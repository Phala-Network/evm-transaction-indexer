import type { ProcessorConfig } from './processorConfig'
import fs from 'fs'

export const WHITELIST_CONFIG: IWhiteListConfing = getJSON(
    'assets/whitelist-config.json'
)

interface IWhiteListConfing {
    Accounts: string[],
    Events: String[],
}

function getJSON(filename: string) {
    const data = fs.readFileSync(filename).toString()
    return JSON.parse(data)
}

export function getChainConfig(): ProcessorConfig {
    switch (process.env.CHAIN) {
        case 'eth':
            return require('./chains/eth').default
        default:
            throw new Error(`Unsupported chain ${process.env.CHAIN}`)
    }
}
