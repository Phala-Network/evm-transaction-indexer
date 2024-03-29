// Only for local dev
import * as dotenv from 'dotenv'
dotenv.config()

import { EvmBatchProcessor } from '@subsquid/evm-processor'
import { TypeormDatabase } from '@subsquid/typeorm-store'
import { Transaction } from './model/generated/transaction.model';
import { findAccount, WORKER_ACCOUNTS } from './utils'

const processor = new EvmBatchProcessor()
    .setBlockRange({
        from: Number(process.env.FROM_BLOCK),
        to: Number(process.env.TO_BLOCK) || undefined
    })
    .setDataSource({
        chain: String(process.env.CHAIN_RPC),
        archive: String(process.env.DATA_SOURCE)
    })
    .setFinalityConfirmation(10)
    .setFields({
        transaction: {
            from: true,
            to: true,
            nonce: true,
            value: true,
            hash: true,
            status: true,
        },
    })
    .addTransaction({
        from: WORKER_ACCOUNTS,
    })

processor.run(new TypeormDatabase({supportHotBlocks: true}), async (ctx) => {
    let transactions: Transaction[] = []
    for (let block of ctx.blocks) {
        for (let transaction of block.transactions) {
            if (!findAccount(transaction.from)) {
                continue
            }
            let tx = new Transaction({
                id: transaction.id,
                account: transaction.from.toLowerCase(),
                nonce: transaction.nonce,
                /// 1 for success, 0 for failure
                result: transaction.status === 1,
                blockNumber: block.header.height,
                timestamp: block.header.timestamp.toString(),
            })
            console.log(`Save a Ethereum tx signed by worker: ${JSON.stringify(tx, null, 2)}`)
            transactions.push(tx)
        }
    }

    await ctx.store.insert(transactions)
})
