import { WatchEvent } from "./watch.event";
import { RedisClient } from "@farcaster/shuttle";
import { Client } from "../client";
import { ChallengeWorker } from "../queue/challenge.worker";
import { log } from "../log";

export class Challenge {
    private watcher: WatchEvent;
    private redis: RedisClient;

    constructor(redis: RedisClient) {
        this.watcher = new WatchEvent(Client.getInstance(), redis);
        this.redis = redis;
    }

    static create(redisUrl: string) {
        const redis = RedisClient.create(redisUrl);
        return new Challenge(redis);
    }

    async start() {
        // start watching for events
        log.warn("Starting watch events");
        await this.watcher.watchEvent();

        // start the challenge worker
        log.warn("Starting challenge worker");
        const worker = new ChallengeWorker(Client.getInstance()).getWorker(this.redis.client);
        await worker.run();

    }
}