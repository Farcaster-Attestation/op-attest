import { Queue } from "bullmq";
import Redis, { Cluster } from "ioredis";

export class QueueFactory {

    /// @dev Create a new queue
    /// @returns OpQueue The new queue
    static getQueue(queueName: string, redis: Redis | Cluster) {
        return new Queue(queueName, {
            connection: redis,
            defaultJobOptions: { attempts: 3, backoff: { delay: 1000, type: "exponential" } },
        });
    }
}