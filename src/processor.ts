import { BatchHandlerContext, BatchProcessorItem, EvmBatchProcessor, EvmBlock } from '@subsquid/evm-processor'
import { LogItem } from '@subsquid/evm-processor/lib/interfaces/dataSelection'
import { Store, TypeormDatabase } from '@subsquid/typeorm-store'
import { lookupArchive } from '@subsquid/archive-registry'
import { In } from 'typeorm'
import { Account, Transaction } from './model'
import { getChainConfig } from './config'
import { WHITELIST_CONFIG } from './config/index';

const CHAIN_CONFIGS = getChainConfig();

const processor = new EvmBatchProcessor()
    .setBlockRange(CHAIN_CONFIGS.blockRange)
    .setDataSource(CHAIN_CONFIGS.dataSource)
    .addTransaction([], {
        // range: CHAIN_CONFIGS.blockRange,
        data: {
            transaction: {
                nonce: true,
                from: true,
                to: true,
                status: true
            }
        }
    })

type Item = BatchProcessorItem<typeof processor>;

processor.run(new TypeormDatabase(), async ctx => {
    let knownAccounts = await ctx.store.find(Account).then(accounts => {
        return new Map(accounts.map(a => [a.id, a]))
    })

    console.log(knownAccounts)

    let transactions: Transaction[] = [];
    for (const block of ctx.blocks) {
        let blockNumber = block.header.height;
        let timestamp = block.header.timestamp;
        for (let item of block.items) {
            if (item.kind === "transaction") {
                let tx = item.transaction;
                let from = tx.from!;
                // tx like this https://etherscan.io/tx/0x37dbc681e559a4ea5b943112f291165abfbca3baf2e57653ca0ea3da33658de8
                // doesn't have a recipient.
                let to = tx.to!;
                let nonce = tx.nonce;

                // note this: must agree on what case to use
                if (WHITELIST_CONFIG.whitelistItems.includes(from.toUpperCase())) {
                    console.log(`${from} -> ${to}: ${nonce}`);

                    let account = knownAccounts.get(from);
                    if (account === undefined) {
                        account = new Account();
                        account.id = from;
                    }
                    knownAccounts.set(account.id, account);

                    let result = tx.status! === 1;
                    transactions.push(new Transaction({
                        id: tx.id,
                        account,
                        nonce,
                        result,
                        blockNumber,
                        timestamp: new Date(timestamp)
                    }));
                }
            }
        }
    }

    await ctx.store.save([...knownAccounts.values()]);
    await ctx.store.insert(transactions);
});
