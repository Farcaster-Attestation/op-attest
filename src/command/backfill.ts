import { log } from "../log";
import { BACKFILL_FIDS, HUB_HOST, HUB_SSL, MAX_FID, POSTGRES_URL, REDIS_URL, SHARD_INDEX, TOTAL_SHARDS } from "../env";
import { App } from "../app";
import { QueueFactory } from "../queue/queue";
import { BACKFILL_QUEUE_NAME, COMPLETION_MARKER_JOB_NAME, RECONCILE_JOB_NAME } from "../constant";
import { BackfillWorker } from "../queue/backfill.worker";
import { Queue } from "bullmq";

export class BackFillCMD {
    static async run() {
        log.info(`Creating app connecting to: ${POSTGRES_URL}, ${REDIS_URL}, ${HUB_HOST}`);
        const app = App.create(POSTGRES_URL, REDIS_URL, HUB_HOST, HUB_SSL, TOTAL_SHARDS, SHARD_INDEX);
        const fids = BACKFILL_FIDS ? BACKFILL_FIDS.split(",").map((fid) => parseInt(fid)) : [];
        log.info(`Backfilling fids: ${fids}`);
        const backfillQueue = QueueFactory.getQueue(BACKFILL_QUEUE_NAME, app.redis.client);
        await this.backfillFids(fids, backfillQueue, app);

        // Start the worker after initiating a backfill
        const backfillWorker = new BackfillWorker(app).getWorker();
        await backfillWorker.run();
        return;
    }

    static async backfillFids(fids: number[], backfillQueue: Queue, app: App) {
        const startedAt = Date.now();
        if (fids.length === 0) {
            const maxFidResult = await app.getHubSubscriber().hubClient!.getFids({ pageSize: 1, reverse: true });
            if (maxFidResult.isErr()) {
                log.error("Failed to get max fid", maxFidResult.error);
                throw maxFidResult.error;
            }
            const maxFid = MAX_FID ? parseInt(MAX_FID) : maxFidResult.value.fids[0];
            if (!maxFid) {
                log.error("Max fid was undefined");
                throw new Error("Max fid was undefined");
            }
            log.info(`Queuing up fids upto: ${maxFid}`);
            // create an array of arrays in batches of 100 upto maxFid
            const batchSize = 10;
            const fids = Array.from({ length: Math.ceil(maxFid / batchSize) }, (_, i) => i * batchSize).map((fid) => fid + 1);
            for (const start of fids) {
                const subset = Array.from({ length: batchSize }, (_, i) => start + i);
                await backfillQueue.add("reconcile", { fids: subset });
            }
        } else {
            await backfillQueue.add(RECONCILE_JOB_NAME, { fids });
        }
        await backfillQueue.add(COMPLETION_MARKER_JOB_NAME, { startedAt });
        log.info("Backfill jobs queued");
    }
}