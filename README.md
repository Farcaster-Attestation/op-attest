# OP-Attest
This repository contains the code for op-attest service. This service is responsible for attesting the identity account from the Farcaster hub to the blockchain.

## How it works
OP-Attest is mono-repo that contains the following services:
- `indexer`: This service is responsible for indexing the event stream from the Farcaster hub and storing the messages in the database. Base on the type of method attestation, the indexer will submit the verify message proof or attestation on chain.
- `attested`: This service will use when use optimistic attestation. This service will read all the stored proof from off-chain database and attested on-chain by calling the EAS schema. The attested service will also connect to same database as the indexer to get the proof of verification.
- `challenge`: This service run by everyone who wants to challenge the proof of verification. Each proof of verification will have a challenge period (1 day) to allow anyone to challenge the proof. If the proof is challenged, the attestation will be revoked.

To use optimistic or on-chain attestation, you need to configure the environment variable `METHOD_VERIFY`:
- METHOD_VERIFY=2: Use optimistic attestation, the verify message will be stored in the off-chain database and submitted on-chain.
- METHOD_VERIFY=1: Use on-chain attestation, the verify message will be attested instantly on-chain.

If you want to run each services, do the following:
```bash

# Ensure you have node 21 installed, use nvm to install it
nvm install 21

pnpm install && pnpm build

# Start the db dependencies
docker compose up postgres redis

# To perform reconciliation/backfill, start the worker (can run multiple processes to speed this up)
POSTGRES_URL=postgres://shuttle:password@0.0.0.0:6541 REDIS_URL=0.0.0.0:16379 HUB_HOST=<host>:<port> HUB_SSL=false PRIVATE_KEY=<private_key> MAX_FID=100 RPC_URL=<rpc_op> pnpm start worker

# Kick off the backfill process (configure with MAX_FID=100 or BACKFILL_FIDS=1,2,3)
POSTGRES_URL=postgres://shuttle:password@0.0.0.0:6541 REDIS_URL=0.0.0.0:16379 HUB_HOST=<host>:<port> HUB_SSL=false PRIVATE_KEY=<private_key> MAX_FID=100 RPC_URL=<rpc_op> pnpm start backfill

# Start the indexer
POSTGRES_URL=postgres://shuttle:password@0.0.0.0:6541 REDIS_URL=0.0.0.0:16379 HUB_HOST=<host>:<port> HUB_SSL=false PRIVATE_KEY=<private_key> METHOD_VERIFY=2 RPC_URL=<rpc_op> pnpm start indexer

# Start the attested service
POSTGRES_URL=postgres://shuttle:password@0.0.0.0:6541 REDIS_URL=0.0.0.0:16379 HUB_HOST=<host>:<port> HUB_SSL=false PRIVATE_KEY=<private_key> RPC_URL=<rpc_op> pnpm start attested

# Start the challenge service
REDIS_URL=0.0.0.0:16379 HUB_HOST=<host>:<port> HUB_SSL=false PRIVATE_KEY=<private_key> RPC_URL=<rpc_op> pnpm start challenge
```