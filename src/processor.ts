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
        to: Number(process.env.TO_BLOCK)
    })
    .setDataSource({
        archive: String(process.env.DATA_SOURCE)
    })
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
    // Txs sent from vitalik.eth
    .addTransaction({
        from: WORKER_ACCOUNTS,
    })

processor.run(new TypeormDatabase({supportHotBlocks: true}), async (ctx) => {
    let transactions: Transaction[] = []

    for (let block of ctx.blocks) {
        for (let transaction of block.transactions) {
            if (findAccount(transaction.from)) {
                continue
            }
            transactions.push(
                new Transaction({
                    id: transaction.id,
                    account: transaction.from,
                    nonce: transaction.nonce,
                    result: transaction.status === 0,
                    blockNumber: block.header.height,
                    timestamp: block.header.timestamp.toString(),
                })
            )
        }
    }

    await ctx.store.insert(transactions)
})
