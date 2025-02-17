import {
    DB,
    EventStreamConnection, EventStreamHubSubscriber, getDbClient,
    getHubClient, HubEventProcessor,
    HubEventStreamConsumer,
    HubSubscriber, MessageHandler, MessageState,
    RedisClient, StoreMessageOperation,
} from "@farcaster/shuttle";
import { log } from "../log";
import {
    HubEvent, Message,
} from "@farcaster/hub-nodejs";
import { ok } from "neverthrow";
import { migrateToLatest } from "../db";
import {
    HUB_ID,
    RECONCILE_JOB_NAME,
    COMPLETION_MARKER_JOB_NAME,
    SUBMIT_PROOF_QUEUE_NAME,
} from "../constant";
import { QueueFactory } from "../queue/queue";
import { Queue } from "bullmq";
import { MAX_FID } from "../env";
import { isMergeMessageHubEvent } from "@farcaster/core";

export class App implements MessageHandler {
    private readonly db: DB;
    private readonly hubSubscriber: HubSubscriber;
    private streamConsumer: HubEventStreamConsumer;
    public redis: RedisClient;
    public proofQueue: Queue;

    constructor(db: DB, redis: RedisClient, hubSubscriber: HubSubscriber, streamConsumer: HubEventStreamConsumer) {
        this.db = db;
        this.redis = redis;
        this.hubSubscriber = hubSubscriber;
        this.streamConsumer = streamConsumer;
        this.proofQueue = QueueFactory.getQueue(SUBMIT_PROOF_QUEUE_NAME, redis.client);
    }

    static create(dbUrl: string,
                  redisUrl: string,
                  hubUrl: string,
                  hubSSL = false,
                  totalShards: number,
                  shardIndex: number) {
        const db = getDbClient(dbUrl);
        const redis = RedisClient.create(redisUrl);
        const hub = getHubClient(hubUrl, { ssl: hubSSL });
        const eventStreamForWrite = new EventStreamConnection(redis.client);
        const eventStreamForRead = new EventStreamConnection(redis.client);
        const shardKey = totalShards === 0 ? "all" : `${shardIndex}`;

        const hubSubscriber = new EventStreamHubSubscriber(
            HUB_ID,
            hub,
            eventStreamForWrite,
            redis,
            shardKey,
            log,
            undefined,
            totalShards,
            shardIndex);

        const streamConsumer = new HubEventStreamConsumer(hub, eventStreamForRead, shardKey);

        return new App(db, redis, hubSubscriber, streamConsumer);
    }

    async start() {
        await this.ensureMigrations();
        // Start the hub subscriber
        await this.hubSubscriber.start();

        // Sleep 10 seconds to give the subscriber a chance to create the stream for the first time.
        await new Promise((resolve) => setTimeout(resolve, 10_000));

        log.info("Starting stream consumer");
        await this.streamConsumer.start(async (event) => {
            log.debug(`Received event: ${JSON.stringify(event)}`);
            void this.processHubEvent(event);
            return ok({ skipped: false });
        });

        // Restart indexer if hub subscriber error
        this.hubSubscriber.on("onError", (error) => {
            log.error(`Hub subscriber error: ${error.message}`);
            process.exit(1);
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async onHubEvent(event: HubEvent, txn: DB): Promise<boolean> {
        return !isMergeMessageHubEvent(event);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async handleMessageMerge(message: Message, txn: DB, operation: StoreMessageOperation, state: MessageState, isNew: boolean, wasMissed: boolean,
    ): Promise<void> {
        log.debug(`Handling merge message: ${message.data?.fid} - ${message.data?.type}`);
        return
    }

    private async processHubEvent(hubEvent: HubEvent) {
        await HubEventProcessor.processHubEvent(this.db, hubEvent, this);
    }

    async ensureMigrations() {
        const result = await migrateToLatest(this.db, log, "indexer");
        if (result.isErr()) {
            log.error("Failed to migrate database", result.error);
            throw result.error;
        }
    }

    async backfillFids(fids: number[], backfillQueue: Queue) {
        const startedAt = Date.now();
        if (fids.length === 0) {
            const maxFidResult = await this.hubSubscriber.hubClient!.getFids({ pageSize: 1, reverse: true });
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
                await backfillQueue.add(RECONCILE_JOB_NAME, { fids: subset });
            }
        } else {
            await backfillQueue.add(RECONCILE_JOB_NAME, { fids });
        }
        await backfillQueue.add(COMPLETION_MARKER_JOB_NAME, { startedAt });
        log.info("Backfill jobs queued");
    }

    getHubSubscriber() {
        return this.hubSubscriber;
    }

    getDb() {
        return this.db;
    }
}