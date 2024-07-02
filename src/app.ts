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
import EventEmitter2 from "eventemitter2";
import { HUB_ID, VERIFICATION_CREATED_EVENT, VERIFICATION_DELETED_EVENT } from "./constant";
import { Eas } from "./eas";

export class App implements MessageHandler {
    private readonly db: DB;
    private hubSubscriber: HubSubscriber;
    private streamConsumer: HubEventStreamConsumer;
    public redis: RedisClient;
    public emitter: EventEmitter2;
    public eas: Eas;


    constructor(db: DB, redis: RedisClient, hubSubscriber: HubSubscriber, streamConsumer: HubEventStreamConsumer, emitter: EventEmitter2) {
        this.db = db;
        this.redis = redis;
        this.hubSubscriber = hubSubscriber;
        this.streamConsumer = streamConsumer;
        this.emitter = emitter;
        this.eas = Eas.create(emitter);
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
        const emitter = new EventEmitter2();

        return new App(db, redis, hubSubscriber, streamConsumer, emitter);
    }

    async start() {
        // connect to the EAS
        await this.eas.connect();

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
        log.info("Start handle event");
        await this.eas.handleEvent();
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
            this.emitter.emit(VERIFICATION_CREATED_EVENT, message);
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
            this.emitter.emit(VERIFICATION_DELETED_EVENT, message);
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