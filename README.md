# EVM Transaction Indexer

try it out: https://squid.subsquid.io/evm-transaction-indexer/v/v1/graphql

## Running 

Navigate to the example folder.

```bash
npm ci
sqd build
# start the database
sqd up
# starts a long-running ETL and blocks the terminal
sqd process

# starts the GraphQL API server at localhost:4350/graphql
sqd serve
```

## Deployment


```bash
sqd build
sqd deploy .
```
