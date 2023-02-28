import { EvmBatchProcessor } from '@subsquid/evm-processor'

export interface ProcessorConfig {
    chainName: string
    prefix?: number | string
    dataSource: Parameters<EvmBatchProcessor<any>['setDataSource']>[0]
    blockRange?: Parameters<EvmBatchProcessor<any>['setBlockRange']>[0]
}
