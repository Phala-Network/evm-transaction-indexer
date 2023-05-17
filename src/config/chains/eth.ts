import { lookupArchive } from '@subsquid/archive-registry';
import { ProcessorConfig } from '../processorConfig';

const config: ProcessorConfig = {
    chainName: 'eth',
    prefix: 'eth',
    dataSource: {
        archive: lookupArchive('eth-mainnet'),
    },
    blockRange:
    {
        from: 17114617,
        to: 17114617
    }
};

export default config;