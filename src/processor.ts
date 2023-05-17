import { BatchHandlerContext, BatchProcessorItem, EvmBatchProcessor, EvmBlock } from '@subsquid/evm-processor'
import { LogItem } from '@subsquid/evm-processor/lib/interfaces/dataSelection'
import { Store, TypeormDatabase } from '@subsquid/typeorm-store'
import { lookupArchive } from '@subsquid/archive-registry'
import { In } from 'typeorm'
import { Account, Transaction, DepositEvent } from './model'
import { getChainConfig } from './config'
import { WHITELIST_CONFIG } from './config/index';

const CHAIN_CONFIGS = getChainConfig();

const processor = new EvmBatchProcessor()
    .setBlockRange(CHAIN_CONFIGS.blockRange)
    .setDataSource(CHAIN_CONFIGS.dataSource)
    .addLog(['0xcd38b15a419491c7c1238B0659f65c755792e257'], {
        filter: [[
            '0x8752a472e571a816aea92eec8dae9baf628e840f4929fbcc2d155e6233ff68a7'
        ]],
        data: {
            kind: true,
            address: true,
            evmLog: { id: true, topics: true, data: true, name: true },
            transaction: {
                status: true,
                hash: true,
                name: true,
            }
        }
    })
    .addTransaction([], {
        data: {
            transaction: {
                nonce: true,
                from: true,
                to: true,
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
        // unix timestamp
        let timestamp = BigInt(block.header.timestamp);
        for (let item of block.items) {
            if (item.kind === "transaction") {
                let tx = item.transaction;
                let from = tx.from!;
                // tx like this https://etherscan.io/tx/0x37dbc681e559a4ea5b943112f291165abfbca3baf2e57653ca0ea3da33658de8
                // doesn't have a recipient.
                let to = tx.to!;
                let nonce = Number(tx.nonce);
                // note this: must agree on what case to use
                if (WHITELIST_CONFIG.Accounts.includes(from.toLowerCase())) {
                    console.log(item);
                    console.log(`${from} -> ${to}: ${nonce}`);

                    let account = knownAccounts.get(from);
                    if (account === undefined) {
                        account = new Account();
                        account.id = from;
                    }
                    knownAccounts.set(account.id, account);

                    // at the time of writing, 26.4.2023
                    // subsquid hasn't fully supported EVM tx status
                    // TODO: come back to this later
                    let result = true;
                    transactions.push(new Transaction({
                        id: tx.id,
                        account,
                        nonce,
                        result,
                        blockNumber,
                        timestamp
                    }));
                }
            } else if (item.kind === 'evmLog') {
                console.log(item)

            }
        }
    }

    await ctx.store.save([...knownAccounts.values()]);
    await ctx.store.insert(transactions);
});
