import { BACKFILL_QUEUE_NAME, COMPLETION_MARKER_JOB_NAME, RECONCILE_JOB_NAME } from "../constant";
import { Worker, Job } from "bullmq";
import { log } from "../log";
import { HubEventProcessor, MessageReconciliation } from "@farcaster/shuttle";
import { bytesToHexString } from "@farcaster/hub-nodejs";
import { App } from "../indexer/app";

export class BackfillWorker {
    public app: App;

    constructor(app: App) {
        this.app = app;
    }

    getWorker(concurrency = 1) {
        return new Worker(
            BACKFILL_QUEUE_NAME,
            async (job: Job) => {
                await this.processBackfillQueue(job);
            },
            {
                autorun: false, // Don't start yet
                useWorkerThreads: concurrency > 1,
                concurrency,
                connection: this.app.redis.client,
                removeOnComplete: { count: 100 }, // Keep at most this many completed jobs
                removeOnFail: { count: 100 }, // Keep at most this many failed jobs
            },
        );
    }

    async processBackfillQueue(job: Job) {
        if (job.name === RECONCILE_JOB_NAME) {
            const start = Date.now();
            const fids = job.data.fids as number[];
            await this.reconcileFids(fids);
            const elapsed = (Date.now() - start) / 1000;
            const lastFid = fids[fids.length - 1];
            log.info(`Reconciled ${fids.length} upto ${lastFid} in ${elapsed}s at ${new Date().toISOString()}`);
        } else if (job.name === COMPLETION_MARKER_JOB_NAME) {
            // TODO: Update key in redis so event streaming can start
            const startedAt = new Date(job.data.startedAt as number);
            const duration = (Date.now() - startedAt.getTime()) / 1000 / 60;
            log.info(
                `Reconciliation started at ${startedAt.toISOString()} complete at ${new Date().toISOString()} ${duration} minutes`,
            );
        }
    }

    async reconcileFids(fids: number[]) {
        const reconciler = new MessageReconciliation(this.app.getHubSubscriber().hubClient!, this.app.getDb(), log);
        for (const fid of fids) {
            await reconciler.reconcileMessagesForFid(
                fid,
                async (message, missingInDb, prunedInDb, revokedInDb) => {
                    if (missingInDb) {
                        await HubEventProcessor.handleMissingMessage(this.app.getDb(), message, this.app);
                    } else if (prunedInDb || revokedInDb) {
                        const messageDesc = prunedInDb ? "pruned" : revokedInDb ? "revoked" : "existing";
                        log.info(`Reconciled ${messageDesc} message ${bytesToHexString(message.hash)._unsafeUnwrap()}`);
                    }
                },
                async (message, missingInHub) => {
                    if (missingInHub) {
                        log.info(`Message ${bytesToHexString(message.hash)._unsafeUnwrap()} is missing in the hub`);
                    }
                },
            );
        }
    }
}