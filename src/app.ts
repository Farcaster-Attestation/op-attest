import {
    DB,
    EventStreamConnection, EventStreamHubSubscriber, getDbClient,
    getHubClient, HubEventProcessor,
    HubEventStreamConsumer,
    HubSubscriber, MessageHandler, MessageState,
    RedisClient, StoreMessageOperation,
} from "@farcaster/shuttle";
import { log } from "./log";
import { bytesToHexString, HubEvent, Message } from "@farcaster/hub-nodejs";
import { ok } from "neverthrow";

const hubId = "shuttle";

export class App implements MessageHandler{
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
            null,
            totalShards,
            shardIndex);

        const streamConsumer = new HubEventStreamConsumer(hub, eventStreamForRead, shardKey);

        return new App(db, redis, hubSubscriber, streamConsumer);
    }

    async start() {
        // Start the hub subscriber
        await this.hubSubscriber.start();

        // Sleep 10 seconds to give the subscriber a chance to create the stream for the first time.
        await new Promise((resolve) => setTimeout(resolve, 10_000));

        log.info("Starting stream consumer");

        await this.streamConsumer.start(async (event) => {
            log.info(`Processing event ${JSON.stringify(event)}`);
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

        log.info(`Handling message ${JSON.stringify(message)}`);
        const messageDesc = wasMissed ? `missed message (${operation})` : `message (${operation})`;
        log.info(`${state} ${messageDesc} ${bytesToHexString(message.hash)._unsafeUnwrap()} (type ${message.data?.type})`);
    }

    private async processHubEvent(hubEvent: HubEvent) {
        await HubEventProcessor.processHubEvent(this.db, hubEvent, this);
    }
}