import { lookupArchive } from '@subsquid/archive-registry';
import { ProcessorConfig } from '../processorConfig';

const config: ProcessorConfig = {
    chainName: 'eth',
    prefix: 'eth',
    dataSource: {
        archive:
        // lookupArchive('eth-mainnet')
        lookupArchive('moonbeam', { type: 'EVM' }),
    },
    blockRange: //undefined
    {
        from: 3043509,
        //to: 3043543
    }
};

export default config;