import { configs } from '#/config'
import type { ContractConfig, Event } from '#/types'
import { type Log, decodeEventLog, parseAbiItem } from 'viem'
import { evmClients } from '#/clients/viem/index'
import { database } from '#/database'
import { gracefulExit } from 'exit-hook'


type eventRow = {
    chain_id: number
    block_number: number
    transaction_index: number
    log_index: number
    contract_address: string
    event_name: string
    event_args: string
    block_hash: string
    transaction_hash: string
    sort_key: string
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function arrayToChunks<T>(array: T[], chunkSize: number): T[][] {
	// Muted by user
	// biome-ignore lint/nursery/noEvolvingTypes: <explanation>
	const chunks = [];
	for (let index = 0; index < array.length; index += chunkSize) {
		chunks.push(array.slice(index, index + chunkSize));
	}
	return chunks;
}

export function decodeLogtoEvent(chainId: bigint, contractName: string, abi: any, log: Log): Event {
    const {
      address, // The address of the contract that produced the log.
      blockHash, // The hash of the block where this log was in.
      blockNumber, // The block number where this log was in.
      data, // The data contained in this log - often related to the event that triggered the log.
      logIndex, // The index of this log in the block.
      transactionHash, // The hash of the transaction that generated this log.
      transactionIndex, // The index of the transaction in the block.
      topics // Topics are used for indexing; first topic is usually the hash of the event signature.
    } = log
  
    // problem: we don't have ABI here
    // but I don't want to have to repeat this code for each contract
    const decodedTopics: { eventName: string; args: Record<string, any> } = decodeEventLog({
      abi,
      data,
      topics
    })
  
    if (
      blockNumber === null ||
      blockHash === null ||
      transactionHash === null ||
      transactionIndex === null ||
      logIndex === null
    ) {
      throw new Error('Cannot decode pending log')
    }
  
    return {
      chainId,
      blockNumber,
      blockHash,
      contractAddress: address,
      contractName,
      transactionHash,
      transactionIndex,
      logIndex,
      eventParameters: decodedTopics,
      data,
      topics,
      serializeArgs: () =>
        JSON.stringify(decodedTopics.args, (_: string, value: any) => {
          if (typeof value === 'bigint') {
            // 32-byte hex string
            return `0x${value.toString(16).padStart(64, '0')}`
          }
          return value
        }),
      // signature: () => createEventSignature(decodedTopics),
      sortKey: () =>
        `${blockNumber.toString().padStart(12, '0')}-${transactionIndex.toString().padStart(6, '0')}-${logIndex
          .toString()
          .padStart(6, '0')}`
    }
  }

export async function getContractEvents(config: ContractConfig): Promise<Event[]> {
    const batchSize = 2000n
    let client = evmClients[config.chainId]()
    const latestBlock = config.endBlock ?? await client.getBlockNumber()
    console.log(`[${config.chainId}] Fetching events from block ${config.startBlock} to ${latestBlock} from contract ${config.contractAddress} with signature ${config.eventSignature}`);
    
    let eventCount = 0;
    const events: Event[] = []
    for(let fromBlock = BigInt(config.startBlock); fromBlock <= latestBlock; fromBlock += batchSize) {
        const toBlock = fromBlock + batchSize - 1n
        try {
            const eventLogs = await client.getLogs({
                event: parseAbiItem(config.eventSignature) as any,
                address: config.contractAddress,
                fromBlock,
                toBlock
            })
            for (const log of eventLogs) {
                eventCount += 1
                const event = decodeLogtoEvent(
                    (config.chainId as unknown) as bigint, 
                    config.contractAddress, 
                    [ parseAbiItem(config.eventSignature) ] as any, 
                    log
                )
                events.push(event)
            }
        } catch (error) {
            console.error(`Error fetching history for blocks ${config.startBlock}: ${error}`)
        }
    }
    console.log(`Found ${eventCount} events`)
    return events
}  

async function handleEvents(events: Event[]): Promise<void> {
    const preparedEvents = events.map(toTableRow);

    const batchSize = 1
    let recordCount = 0n
    const recordChunks = arrayToChunks(preparedEvents, batchSize)

    // recordChunks.forEach(async (chunk) => {
    //     console.log(`Uploading ${chunk.length} events...`);
    //     try {
    //         const result = await database.insertInto('events').values(chunk).executeTakeFirst()
    //         recordCount += result.numInsertedOrUpdatedRows ?? 0n
    //         console.log(`📌 Inserted ${result.numInsertedOrUpdatedRows}`)
    //     } catch (error) {
    //         console.error(`Error inserting event ${error}`)
    //     }
    //     await sleep(10000)
    // });

    for(let chunk of recordChunks) {
        console.log(`Uploading ${chunk.length} events...`);
        try {
            console.log(chunk[0]?.event_name, chunk[0]?.event_args)
            const result = await database.insertInto('events').values(chunk).executeTakeFirst()
            recordCount += result.numInsertedOrUpdatedRows ?? 0n
            console.log(`📌 Inserted ${result.numInsertedOrUpdatedRows}`)
        } catch (error) {
            console.error(`Error inserting event ${error}`)
        }
        // await sleep(100)
    }
    console.log(`✅ Uploaded ${recordCount} events`);
}

let listOpEvents:Event[] = [];
let listUserEvents:Event[] = [];
let ownershipEvents:Event[] = [];

async function replay(): Promise<void> {
    console.log("Contract Initialization...");
    const OwnershipConfigs = [
        configs['ListRecords_OwnershipTransferred_Base'],
        configs['ListRecords_OwnershipTransferred_Op'],
        configs['ListRecords_OwnershipTransferred_Eth'],
        configs['AccountMetadata_OwnershipTransferred'],
        configs['Registry_OwnershipTransferred']
    ]
    for( const config of OwnershipConfigs) {
        const updatedEvents = await getContractEvents(config);
        ownershipEvents = [...ownershipEvents, ...updatedEvents];
    }
    await handleEvents(ownershipEvents);
    console.log(`Fetched ${ownershipEvents.length} OwnershipTransferred events`);

    console.log("Fetching List Transfer events...");
    const listTransferEvents:Event[] = await getContractEvents(configs['Registry_Transfer']);
    await handleEvents(listTransferEvents);
    console.log(`Fetched ${listTransferEvents.length} Transfer events`);

    console.log("Fetching Account Metadata:Primary List events...");
    const updateAccountMetadataEvents:Event[] = await getContractEvents(configs['AccountMetadata_UpdateAccountMetadata']);
    await handleEvents(updateAccountMetadataEvents);
    console.log(`Fetched ${updateAccountMetadataEvents.length} updateAccountMetadata events`);

    console.log("Fetching List Storage Location events...");
    const updateListStorageLocationEvents:Event[] = await getContractEvents(configs['Registry_UpdateListStorageLocation']);
    await handleEvents(updateListStorageLocationEvents);
    console.log(`Fetched ${updateListStorageLocationEvents.length} updateListStorageLocation events`);


    console.log("Syncing ListOp events...");
    const listOpConfigs = [
        configs['ListRecords_ListOp_Base'],
        configs['ListRecords_ListOp_Op'],
        configs['ListRecords_ListOp_Eth'],
    ]
    for( const config of listOpConfigs) {
        console.log(`Fetching ListOp events for [${config.chainId}] ${config.eventSignature}...`);
        const updatedEvents = await getContractEvents(config);
        listOpEvents = [...listOpEvents, ...updatedEvents];
    }
    await handleEvents(listOpEvents);
    console.log(`Fetched ${listOpEvents.length} ListOp events`);
 
    const listUserConfigs = [
        configs['ListRecords_UpdateListMetadata_Base'],
        configs['ListRecords_UpdateListMetadata_Op'],
        configs['ListRecords_UpdateListMetadata_Eth'],
    ]
    console.log("Syncing List Metadata:User events...");
    for( const config of listUserConfigs) {
        const updatedListMeta = await getContractEvents(config)
        listUserEvents = [...listUserEvents, ...updatedListMeta];
    }
    await handleEvents(listUserEvents);
    console.log(`Fetched ${listUserEvents.length} listUser events`);

}

function toTableRow(event: Event): {
    block_hash: string
    block_number: bigint
    chain_id: bigint
    contract_address: string
    event_args: string
    event_name: string
    log_index: number
    sort_key: string
    transaction_hash: string
    transaction_index: number
  } {
    return {
      chain_id: event.chainId,
      block_number: event.blockNumber,
      transaction_index: event.transactionIndex,
      log_index: event.logIndex,
      contract_address: event.contractAddress,
      event_name: event.eventParameters.eventName,
      event_args: JSON.parse(event.serializeArgs()) as any,
      block_hash: event.blockHash,
      transaction_hash: event.transactionHash,
      sort_key: event.sortKey()
    }
  }

replay()
    .then(() => {
        console.log('replay completed')
        gracefulExit()
    })
    .catch((error) => {
        console.error('Error retrieving contract history:', error)
    })