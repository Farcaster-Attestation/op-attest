export const HUB_HOST = process.env["HUB_HOST"] || "localhost:2283";
export const HUB_SSL = process.env["HUB_SSL"] === "true";

export const POSTGRES_URL = process.env["POSTGRES_URL"] || "postgres://localhost:5432";
export const REDIS_URL = process.env["REDIS_URL"] || "redis://localhost:6379";

export const TOTAL_SHARDS = parseInt(process.env["SHARDS"] || "0");
export const SHARD_INDEX = parseInt(process.env["SHARD_NUM"] || "0");

// default to the EAS contract on Sepolia
export const EAS_CONTRACT_ADDRESS = process.env["EAS_CONTRACT_ADDRESS"] || "0x4200000000000000000000000000000000000021";
export const NETWORK = process.env["NETWORK"] || "optimism-sepolia";
export const RELAYER_PRIVATE_KEY = process.env["RELAYER_PRIVATE_KEY"] || "";
export const EAS_PRIVATE_KEY = process.env["EAS_PRIVATE_KEY"] || "";
export const SCHEMA_UID = process.env["SCHEMA_UID"] || "0x6c782a69f03e8b1839379ff7068027526d492cb4f38e4cfa5e708c669765234b";
export const RESOLVER_ADDRESS = process.env["RESOLVER_ADDRESS"] || "0xba8BfD8306A6a588302A6B931fa53fb6eb8E3292";
export const MIN_CONFIRMATIONS = parseInt(process.env["MIN_CONFIRMATIONS"] || "1");
export const FARCASTER_OPTIMISTIC_VERIFY_ADDRESS = (process.env["FARCASTER_OPTIMISTIC_VERIFY_ADDRESS"] || "0x8D45d7161b7340B297A007Cc7EB6F90350B7BE90") as `0x${string}`;
export const RPC_URL = process.env["RPC_URL"] || "";
export const METHOD_VERIFY = parseInt(process.env["METHOD_VERIFY"] || "2");

// backfill
export const BACKFILL_FIDS = process.env["FIDS"] || "";
export const MAX_FID = process.env["MAX_FID"];