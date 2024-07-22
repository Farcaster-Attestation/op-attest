export const HUB_HOST = process.env["HUB_HOST"] || "localhost:2283";
export const HUB_SSL = process.env["HUB_SSL"] === "true";

export const POSTGRES_URL = process.env["POSTGRES_URL"] || "postgres://localhost:5432";
export const REDIS_URL = process.env["REDIS_URL"] || "redis://localhost:6379";

export const TOTAL_SHARDS = parseInt(process.env["SHARDS"] || "0");
export const SHARD_INDEX = parseInt(process.env["SHARD_NUM"] || "0");

// default to the EAS contract on Sepolia
export const EAS_CONTRACT_ADDRESS = process.env["EAS_CONTRACT_ADDRESS"] || "0x4200000000000000000000000000000000000021";
export const NETWORK = process.env["NETWORK"] || "optimism-sepolia";
export const PRIVATE_KEY = process.env["PRIVATE_KEY"] || "";
export const SCHEMA_UID = process.env["SCHEMA_UID"] || "0x2437dfe5b04815e0ef259af2725858c7c6db4b359370ad0f445fdec3f47b2229";
export const RESOLVER_ADDRESS = process.env["RESOLVER_ADDRESS"] || "0x856448575812346458bCdE68eB6F1a03e74DC743";
export const MIN_CONFIRMATIONS = parseInt(process.env["MIN_CONFIRMATIONS"] || "1");
export const FARCASTER_VERIFY_ADDRESS = process.env["FARCASTER_VERIFY_ADDRESS"] || "0xa88cB25ae5Bb4EFd28e4Aa9ac620F38d4d18f209";

// backfill
export const BACKFILL_FIDS = process.env["FIDS"] || "";
export const MAX_FID = process.env["MAX_FID"];