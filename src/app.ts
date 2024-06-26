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
import { farcasterTimeToDate } from "./utils";

const hubId = "op_attest";

export class App implements MessageHandler {
    private readonly db: DB;
    private hubSubscriber: HubSubscriber;
    private streamConsumer: HubEventStreamConsumer;
    public redis: RedisClient;


    constructor(db: DB, redis: RedisClient, hubSubscriber: HubSubscriber, streamConsumer: HubEventStreamConsumer) {
        this.db = db;
        this.redis = redis;
        this.hubSubscriber = hubSubscriber;
        this.streamConsumer = streamConsumer;
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
            hubId,
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
}