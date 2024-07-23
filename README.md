# OP-Attest
This repository contains the code for op-attest service. This service is responsible for attesting the identity account from the Farcaster hub to the blockchain.

## Usage
The package is meant to be used as a library. The app provided is just an example.

If you want to run the test the app, do the following:
```bash

# Ensure you have node 21 installed, use nvm to install it
nvm install 21

yarn install && yarn build

# Start the db dependencies
docker compose up postgres redis

# To perform reconciliation/backfill, start the worker (can run multiple processes to speed this up)
POSTGRES_URL=postgres://shuttle:password@0.0.0.0:6541 REDIS_URL=0.0.0.0:16379 HUB_HOST=<host>:<port> HUB_SSL=false PRIVATE_KEY=<private_key> MAX_FID=100 RPC_URL=<rpc_op> yarn start worker

# Kick off the backfill process (configure with MAX_FID=100 or BACKFILL_FIDS=1,2,3)
POSTGRES_URL=postgres://shuttle:password@0.0.0.0:6541 REDIS_URL=0.0.0.0:16379 HUB_HOST=<host>:<port> HUB_SSL=false PRIVATE_KEY=<private_key> MAX_FID=100 RPC_URL=<rpc_op> yarn start backfill

# Start the app and sync messages from the event stream
POSTGRES_URL=postgres://shuttle:password@0.0.0.0:6541 REDIS_URL=0.0.0.0:16379 HUB_HOST=<host>:<port> HUB_SSL=false PRIVATE_KEY=<private_key> MAX_FID=100 RPC_URL=<rpc_op> yarn start start
```