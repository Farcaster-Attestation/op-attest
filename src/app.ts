import {
    DB,
    EventStreamConnection, EventStreamHubSubscriber, getDbClient,
    getHubClient, HubEventProcessor,
    HubEventStreamConsumer,
    HubSubscriber, MessageHandler, MessageState,
    RedisClient, StoreMessageOperation,
} from "@farcaster/shuttle";
import { log } from "./log";
import {
    bytesToHexString,
    HubEvent, isVerificationAddAddressMessage, isVerificationRemoveMessage,
    Message,
} from "@farcaster/hub-nodejs";
import { ok } from "neverthrow";
import { AppDb, migrateToLatest } from "./db";
import { farcasterTimeToDate, transformQueueData } from "./utils";
import { HUB_ID, EAS_QUEUE_NAME, RECONCILE_JOB_NAME, COMPLETION_MARKER_JOB_NAME } from "./constant";
import { QueueFactory } from "./queue/queue";
import { Queue } from "bullmq";
import { EasWorker } from "./queue/eas.worker";
import { MAX_FID } from "./env";

export class App implements MessageHandler {
    private readonly db: DB;
    private hubSubscriber: HubSubscriber;
    private streamConsumer: HubEventStreamConsumer;
    public redis: RedisClient;
    public easQueue: Queue

    constructor(db: DB, redis: RedisClient, hubSubscriber: HubSubscriber, streamConsumer: HubEventStreamConsumer) {
        this.db = db;
        this.redis = redis;
        this.hubSubscriber = hubSubscriber;
        this.streamConsumer = streamConsumer;
        this.easQueue = QueueFactory.getQueue(EAS_QUEUE_NAME, redis.client);
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
            void this.processHubEvent(event);
            return ok({ skipped: false });
        });

        log.info("Starting EAS worker");
        const easWorker = new EasWorker().getWorker(this.redis.client);
        await easWorker.run();
    }

    async handleMessageMerge(
        message: Message,
        txn: DB,
        operation: StoreMessageOperation,
        state: MessageState,
        isNew: boolean,
        wasMissed: boolean,
    ): Promise<void> {
        if (!isNew) {
            // Message was already in the db, no-op
            return;
        }

        const appDB = txn as unknown as AppDb;

        const isVerify = isVerificationAddAddressMessage(message) || isVerificationRemoveMessage(message);
        if (isVerify && state === "created") {
            const queueData = transformQueueData(message);
            await this.easQueue.add(EAS_QUEUE_NAME, queueData);

            await appDB
                .insertInto("verifications")
                .values({
                    fid: message.data.fid,
                    hash: message.hash,
                    address: message.data.verificationAddAddressBody?.address || new Uint8Array(),
                    blockHash: message.data.verificationAddAddressBody?.blockHash || new Uint8Array(),
                    verificationType: message.data.verificationAddAddressBody?.verificationType || 0,
                    chainId: message.data.verificationAddAddressBody?.chainId || 0,
                    protocol: message.data.verificationAddAddressBody?.protocol || 0,
                    timestamp: farcasterTimeToDate(message.data.timestamp) || new Date(),
                })
                .execute();
        } else if (isVerify && state === "deleted") {
            const queueData = transformQueueData(message);
            await this.easQueue.add(EAS_QUEUE_NAME, queueData);

            await appDB
                .updateTable("verifications")
                .set({ deletedAt: farcasterTimeToDate(message.data.timestamp) || new Date() })
                .where("hash", "=", message.hash)
                .execute();
        }

        const messageDesc = wasMissed ? `missed message (${operation})` : `message (${operation})`;
        log.info(`${state} ${messageDesc} ${bytesToHexString(message.hash)._unsafeUnwrap()} (type ${message.data?.type})`);
    }

    private async processHubEvent(hubEvent: HubEvent) {
        await HubEventProcessor.processHubEvent(this.db, hubEvent, this);
    }

    async ensureMigrations() {
        const result = await migrateToLatest(this.db, log);
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