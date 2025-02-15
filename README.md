# OP-Attest
This repository contains the code for op-attest service. This service is responsible for attesting the identity account from the Farcaster hub to the blockchain.

## How it works
OP-Attest is mono-repo that contains the following services:
- `indexer`: This service is responsible for indexing the event stream from the Farcaster hub and storing the messages in the database.
- `submitter`: This service is responsible for submitting the verify message to the Farcaster verify. The submitter will read the stored proof from the off-chain database and submit the proof to the EAS schema.
- `attested`: This service will use when use optimistic attestation. This service will read all the stored proof from off-chain database and attested on-chain by calling the EAS schema. The attested service will also connect to same database as the indexer to get the proof of verification.
- `challenge`: This service run by everyone who wants to challenge the proof of verification. Each proof of verification will have a challenge period (1 day) to allow anyone to challenge the proof. If the proof is challenged, the attestation will be revoked.

To use optimistic or on-chain attestation, you need to configure the environment variable `METHOD_VERIFY`:
- METHOD_VERIFY=2: Use optimistic attestation, the verify message will be stored in the off-chain database and submitted on-chain.
- METHOD_VERIFY=1: Use on-chain attestation, the verify message will be attested instantly on-chain.

If you want to run each services, do the following:
# 1. Start the database dependencies
```bash

# Ensure you have node 21 installed, use nvm to install it
nvm install 21

pnpm install && pnpm build

# Start the db dependencies
docker compose up postgres redis
```

# 2. Start Indexer
## 2.1. Configure the environment variables
```bash
# Configure the environment variables
REDIS_URL=<redis_url>
HUB_HOST=<host>:<port>
HUB_SSL=false
POSTGRES_URL=<postgres_url>
```
## 2.2. Start the indexer
```bash
# Start the indexer
pnpm start indexer
```

# 3. Start Submitter
## 3.1. Configure the environment variables
```bash
# Configure the environment variables
PRIVATE_KEY=<private_key>
FARCASTER_OPTIMISTIC_VERIFY_ADDRESS=<address of farcaster optimistic verify>
POSTGRES_URL=<postgres_url>
METHOD_VERIFY=<method_verify>
SUBMITTER_SUBMIT_INTERVAL=<submit_interval_to_submit>
SUBMITTER_BATCH_SIZE=<submit_batch_size>
SUBMITTER_INDEX_INTERVAL=<submit_index_interval>

```
## 3.2. Start the submitter
```bash
# Start the submitter
pnpm start submitter
```
# 4. Start Attested
## 4.1. Configure the environment variables
```bash
# Configure the environment variables
PRIVATE_KEY=<private_key>
FARCASTER_OPTIMISTIC_VERIFY_ADDRESS=<address of farcaster optimistic verify>
POSTGRES_URL=<postgres_url>
METHOD_VERIFY=<method_verify>
ATTEST_INTERVAL=<attest_interval>
ATTEST_CHALLENGE_BLOCK_OFFSET=<attest_challenge_block_offset>
ATTEST_BATCH_SIZE=<attest_batch_size>
```

## 4.2. Start the attested
```bash
# Start the attested
pnpm start attested
```