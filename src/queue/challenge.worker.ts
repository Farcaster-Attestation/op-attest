import { Client } from "../client";
import Redis, { Cluster } from "ioredis";
import { Job, Worker } from "bullmq";
import { CHALLENGE_QUEUE_NAME } from "../constant";
import { EASQueueData } from "./queue.data";
import { log } from "../log";
import { MessageType } from "@farcaster/core";

export class ChallengeWorker {
    constructor(private readonly client: Client) {}

    getWorker(redis: Redis | Cluster, concurrency = 1) {
        return new Worker(
            CHALLENGE_QUEUE_NAME,
            async (job: Job<EASQueueData>) => {
                await this.processChallenge(job);
            },
            {
                autorun: false, // Don't start yet
                useWorkerThreads: concurrency > 1,
                concurrency,
                connection: redis,
            },
        );
    }

    async processChallenge(job: Job<EASQueueData>) {
        const queueData = job.data;
        try {
            log.info(`Processing job: ${job.id} - data: ${JSON.stringify(queueData)}`);
            switch (queueData.messageType) {
                case MessageType.VERIFICATION_ADD_ETH_ADDRESS: {
                    const verified = await this.client.simulateChallengeAdd(
                        BigInt(queueData.fid),
                        queueData.verifyAddress,
                        queueData.publicKey,
                        queueData.signature,
                    );

                    if (!verified) {
                        // call the challengeAdd function
                        await this.client.challengeAdd(
                            BigInt(queueData.fid),
                            queueData.verifyAddress,
                            queueData.publicKey,
                            queueData.signature,
                        );
                    }
                    break;
                }
                case MessageType.VERIFICATION_REMOVE: {
                    const verified = await this.client.simulateChallengeRemove(
                        BigInt(queueData.fid),
                        queueData.verifyAddress,
                        queueData.publicKey,
                        queueData.signature,
                    );

                    if (!verified) {
                        // call the challengeRemove function
                        await this.client.challengeRemove(
                            BigInt(queueData.fid),
                            queueData.verifyAddress,
                            queueData.publicKey,
                            queueData.signature,
                        );
                    }
                    break;
                }
                default:
                    log.error(`Unknown message type: ${queueData.messageType}`);
            }

        } catch (error) {
            log.error(error);
        }
    }
}