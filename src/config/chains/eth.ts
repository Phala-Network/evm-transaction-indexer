import { lookupArchive } from '@subsquid/archive-registry';
import { ProcessorConfig } from '../processorConfig';

const config: ProcessorConfig = {
    chainName: 'eth',
    prefix: 'eth',
    dataSource: {
        archive: lookupArchive('eth-mainnet')
        //lookupArchive('moonbase', { type: 'EVM' }),
    },
    blockRange: undefined
    //{
    //    from: 16721386,
    //    to: 16721725
    //}
};

export default config;