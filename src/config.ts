import type { ContractConfig } from "./types";
import { env } from '#/env.ts'

export const configs: { [key: string]: ContractConfig } = {
    'ListRecords_ListOp_Base':  {
        chainId: '8453',
        contractAddress: env.LIST_RECORDS_BASE,
        eventSignature: 'event ListOp(uint256 indexed slot, bytes op)',
        startBlock: 20190000n 
    },
    'ListRecords_ListOp_Op': {
        chainId: '10',
        contractAddress: env.LIST_RECORDS_OP,
        eventSignature: 'event ListOp(uint256 indexed slot, bytes op)',
        startBlock: 125792735n
    },
    'ListRecords_ListOp_Eth': {
        chainId: '1',
        contractAddress: env.LIST_RECORDS_ETH,
        eventSignature: 'event ListOp(uint256 indexed slot, bytes op)',
        startBlock: 20820743n
    },
    'ListRecords_UpdateListMetadata_Base':  {
        chainId: '8453',
        contractAddress: env.LIST_RECORDS_BASE,
        eventSignature: 'event UpdateListMetadata(uint256 indexed slot, string key, bytes value)',
        startBlock: 20190000n
    },
    'ListRecords_UpdateListMetadata_Op': {
        chainId: '10',
        contractAddress: env.LIST_RECORDS_OP,
        eventSignature: 'event UpdateListMetadata(uint256 indexed slot, string key, bytes value)',
        startBlock: 125792735n
    },
    'ListRecords_UpdateListMetadata_Eth': {
        chainId: '1',
        contractAddress: env.LIST_RECORDS_ETH,
        eventSignature: 'event UpdateListMetadata(uint256 indexed slot, string key, bytes value)',
        startBlock: 20820743n
    },
    'AccountMetadata_UpdateAccountMetadata':  {
        chainId: '8453',
        contractAddress: env.ACCOUNT_METADATA,
        eventSignature: 'event UpdateAccountMetadata(address indexed addr, string key, bytes value)',
        startBlock: 20190000n
    },
    'Registry_UpdateListStorageLocation':  {
        chainId: '8453',
        contractAddress: env.REGISTRY,
        eventSignature: 'event UpdateListStorageLocation(uint256 indexed tokenId, bytes listStorageLocation)',
        startBlock: 20190000n
    },
    'Registry_Transfer':  {
        chainId: '8453',
        contractAddress: env.REGISTRY,
        eventSignature: 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
        startBlock: 20190000n
    },

    //ownership events
    'ListRecords_OwnershipTransferred_Base':  {
        chainId: '8453',
        contractAddress: env.LIST_RECORDS_BASE,
        eventSignature: 'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
        startBlock: 20190000n,
        endBlock: 20200000n
    },
    'ListRecords_OwnershipTransferred_Op': {
        chainId: '10',
        contractAddress: env.LIST_RECORDS_OP,
        eventSignature: 'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
        startBlock: 125792735n,
        endBlock: 125800000n
    },
    'ListRecords_OwnershipTransferred_Eth': {
        chainId: '1',
        contractAddress: env.LIST_RECORDS_ETH,
        eventSignature: 'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
        startBlock: 20820743n,
        endBlock: 20830000n
    },
    'AccountMetadata_OwnershipTransferred':  {
        chainId: '8453',
        contractAddress: env.ACCOUNT_METADATA,
        eventSignature: 'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
        startBlock: 20190000n,
        endBlock: 20200000n
    },
    'Registry_OwnershipTransferred':  {
        chainId: '8453',
        contractAddress: env.REGISTRY,
        eventSignature: 'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
        startBlock: 20190000n,
        endBlock: 20200000n
    },
} 