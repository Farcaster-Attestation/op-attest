import { log } from "../log";
import { App } from "../app";
import { HUB_HOST, HUB_SSL, POSTGRES_URL, REDIS_URL, SHARD_INDEX, TOTAL_SHARDS } from "../env";

export class StartCMD {
    static async run() {
        const app = App.create(POSTGRES_URL, REDIS_URL, HUB_HOST, HUB_SSL, TOTAL_SHARDS, SHARD_INDEX);
        log.info("Starting op-attest");
        await app.start();
    }
}

// POSTGRES_URL=postgres://shuttle:password@0.0.0.0:6541 REDIS_URL=0.0.0.0:16379 HUB_HOST=<host>:<port> HUB_SSL=false yarn start start