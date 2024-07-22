import { log } from "../log";
import { BACKFILL_FIDS, HUB_HOST, HUB_SSL, POSTGRES_URL, REDIS_URL, SHARD_INDEX, TOTAL_SHARDS } from "../env";
import { App } from "../app";
import { QueueFactory } from "../queue/queue";
import { BACKFILL_QUEUE_NAME } from "../constant";
import { BackfillWorker } from "../queue/backfill.worker";

export class BackFillCMD {
    static async run() {
        log.info(`Creating app connecting to: ${POSTGRES_URL}, ${REDIS_URL}, ${HUB_HOST}`);
        const app = App.create(POSTGRES_URL, REDIS_URL, HUB_HOST, HUB_SSL, TOTAL_SHARDS, SHARD_INDEX);
        const fids = BACKFILL_FIDS ? BACKFILL_FIDS.split(",").map((fid) => parseInt(fid)) : [];
        log.info(`Backfilling fids: ${fids}`);
        const backfillQueue = QueueFactory.getQueue(BACKFILL_QUEUE_NAME, app.redis.client);
        await app.backfillFids(fids, backfillQueue);

        // Start the worker after initiating a backfill
        const backfillWorker = new BackfillWorker(app).getWorker();
        await backfillWorker.run();
        return;
    }
}