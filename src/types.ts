
export type ContractConfig = {
    chainId: '8453' | '10' | '1'
    contractAddress: `0x${string}`
    eventSignature: string
    startBlock: bigint
    endBlock?: bigint
}

// export type Event = {
//     args: Record<string, any>
//     eventName: string
//     chainId: bigint
//     address: `0x${string}`
//     blockHash: `0x${string}`
//     blockNumber: bigint
//     data: `0x${string}`
//     logIndex: number
//     removed: boolean
//     topics: `0x${string}`[]
//     transactionHash: `0x${string}`
//     transactionIndex: number
// }

export type Event = {
    chainId: bigint
    blockNumber: bigint
    blockHash: `0x${string}`
    contractAddress: `0x${string}`
    contractName: string
    transactionHash: `0x${string}`
    transactionIndex: number
    logIndex: number
    eventParameters: { eventName: string; args: Record<string, any> }
    data: string
    topics: string[]
  
    serializeArgs: () => string
    sortKey: () => string
  }

export type Operation = {
    version: string
    opcode: string
    recordVersion: string
    recordType: string
    recordTypeDescription: string
    recordAddress: string
    tag?: string
}

export type ListOperation = Operation & {   
    slot?: bigint
    listRecordsContract: `0x${string}`
    chainId: string
    tx: `0x${string}`
}

export type ListStorageLocation = {
    version: string
    type: string
    chainId: bigint
    listRecordsContract: string
    slot: bigint
}

export type ListStorageLocationToken = ListStorageLocation & {
    tokenId: bigint
    blockNumber: bigint
}

export type ListOpRecord = {
    listUserAddress: string
    recordAddress: string
    opcode: string
    tag?: string
}