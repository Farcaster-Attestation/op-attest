import { HUB_HOST, HUB_SSL, POSTGRES_URL, REDIS_URL, SHARD_INDEX, TOTAL_SHARDS } from "../env";
import { log } from "../log";
import { App } from "../indexer/app";
import { BackfillWorker } from "../queue/backfill.worker";

export class WorkerCMD {
    static async run() {
        log.info(`Starting worker connecting to: ${POSTGRES_URL}, ${REDIS_URL}, ${HUB_HOST}`);
        const app = App.create(POSTGRES_URL, REDIS_URL, HUB_HOST, HUB_SSL, TOTAL_SHARDS, SHARD_INDEX);
        log.info("Starting worker");
        const worker = new BackfillWorker(app).getWorker();
        await worker.run();
        return;
    }
}