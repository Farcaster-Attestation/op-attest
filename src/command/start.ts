import { log } from "../log";
import { App } from "../indexer/app";
import { HUB_HOST, HUB_SSL, POSTGRES_URL, REDIS_URL, SHARD_INDEX, TOTAL_SHARDS } from "../env";

export class StartCMD {
    static async run() {
        const app = App.create(POSTGRES_URL, REDIS_URL, HUB_HOST, HUB_SSL, TOTAL_SHARDS, SHARD_INDEX);
        log.info("Starting op-attest");
        await app.start();
    }
}