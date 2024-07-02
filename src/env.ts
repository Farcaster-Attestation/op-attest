export const HUB_HOST = process.env["HUB_HOST"] || "localhost:2283";
export const HUB_SSL = process.env["HUB_SSL"] === "true";

export const POSTGRES_URL = process.env["POSTGRES_URL"] || "postgres://localhost:5432";
export const REDIS_URL = process.env["REDIS_URL"] || "redis://localhost:6379";

export const TOTAL_SHARDS = parseInt(process.env["SHARDS"] || "0");
export const SHARD_INDEX = parseInt(process.env["SHARD_NUM"] || "0");

// default to the EAS contract on Sepolia
export const EAS_CONTRACT_ADDRESS = process.env["EAS_CONTRACT_ADDRESS"] || "0xC2679fBD37d54388Ce493F1DB75320D236e1815e";
export const NETWORK = process.env["NETWORK"] || "sepolia";
export const PRIVATE_KEY = process.env["PRIVATE_KEY"];
export const SCHEMA_UID = process.env["SCHEMA_UID"] || "0xee47a9ae87bd099348c9e0f42c5307565b5958509d2928803d2ddde5bbfe90ee";
