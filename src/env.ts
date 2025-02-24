export const LOG_LEVEL = process.env["LOG_LEVEL"] || "info";
export const HUB_HOST = process.env["HUB_HOST"] || "localhost:2283";
export const HUB_SSL = process.env["HUB_SSL"] === "true";

export const POSTGRES_URL = process.env["POSTGRES_URL"] || "postgres://localhost:5432";
export const REDIS_URL = process.env["REDIS_URL"] || "redis://localhost:6379";

export const TOTAL_SHARDS = parseInt(process.env["SHARDS"] || "0");
export const SHARD_INDEX = parseInt(process.env["SHARD_NUM"] || "0");

// default to the EAS contract on Sepolia
export const NETWORK = process.env["NETWORK"] || "optimism-sepolia";
export const PRIVATE_KEY = process.env["PRIVATE_KEY"] || "";
export const SCHEMA_UID = process.env["SCHEMA_UID"] || "0x6c782a69f03e8b1839379ff7068027526d492cb4f38e4cfa5e708c669765234b";
export const MIN_CONFIRMATIONS = parseInt(process.env["MIN_CONFIRMATIONS"] || "1");
export const RPC_URL = process.env["RPC_URL"] || "";
export const FARCASTER_OPTIMISTIC_VERIFY_ADDRESS = (process.env["FARCASTER_OPTIMISTIC_VERIFY_ADDRESS"] || "") as `0x${string}`;
export const RESOLVER_ADDRESS = process.env["RESOLVER_ADDRESS"] || "0x53740150E93BB9dF2f265dA68ce8957Ee6A23A77";
export const METHOD_VERIFY = parseInt(process.env["METHOD_VERIFY"] || "2");

// backfill
export const BACKFILL_FIDS = process.env["FIDS"] || "";
export const MAX_FID = process.env["MAX_FID"];

// submitter
export const SUBMITTER_SUBMIT_INTERVAL = parseInt(process.env["SUBMITTER_SUBMIT_INTERVAL"] || "3000"); // 3s
export const SUBMITTER_BATCH_SIZE = parseInt(process.env["SUBMITTER_BATCH_SIZE"] || "50");
export const SUBMITTER_INDEX_INTERVAL = parseInt(process.env["SUBMITTER_INDEX_INTERVAL"] || "4000"); // 4s
export const SUBMITTER_MAX_L1_FEES = parseInt(process.env["SUBMITTER_MAX_L1_FEES"] || "1000000000000"); // 1000Gwei
export const SUBMITTER_MAX_L2_GAS_PRICE = parseInt(process.env["SUBMITTER_MAX_L2_GAS_PRICE"] || "1010000"); // 0,00101 Gwei

// attested
export const ATTEST_INTERVAL = parseInt(process.env["ATTEST_INTERVAL"] || "10000"); // 10s
export const ATTEST_CHALLENGE_BLOCK_OFFSET = parseInt(process.env["ATTEST_CHALLENGE_BLOCK_OFFSET"] || "45000"); // blocks of 1 day plus 150 blocks for safety
export const ATTEST_BATCH_SIZE = parseInt(process.env["ATTEST_BATCH_SIZE"] || "50");
export const ATTEST_MAX_RETRIES = parseInt(process.env["ATTEST_MAX_RETRIES"] || "5");
export const ATTEST_INTERVAL_RETRY = parseInt(process.env["ATTEST_INTERVAL_RETRY"] || "20000"); // 10s
