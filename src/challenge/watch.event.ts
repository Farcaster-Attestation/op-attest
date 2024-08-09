import { Client } from "../client";
import { FARCASTER_OPTIMISTIC_VERIFY_ADDRESS, METHOD_VERIFY } from "../env";
import { FarcasterOptimisticVerifyAbi } from "../abi/farcaster.optimistic.verify.abi";
import { RedisClient } from "@farcaster/shuttle";
import { Queue } from "bullmq";
import { QueueFactory } from "../queue/queue";
import { CHALLENGE_QUEUE_NAME } from "../constant";
import { log } from "../log";

export class WatchEvent {
    private challengeQueue: Queue;

    constructor(
        private readonly client: Client,
        private readonly redis: RedisClient,
    ) {
        this.challengeQueue = QueueFactory.getQueue(CHALLENGE_QUEUE_NAME, this.redis.client);
    }

    async watchEvent() {
        return this.client.publicClient.watchContractEvent({
            address: FARCASTER_OPTIMISTIC_VERIFY_ADDRESS,
            abi: FarcasterOptimisticVerifyAbi,
            eventName: "SubmitVerification",
            onLogs: async (logs) => {
                const submitEvents = logs.map((log) => {
                    return {
                        name: CHALLENGE_QUEUE_NAME,
                        data: {
                            publicKey: log.args.publicKey,
                            messageType: log.args.messageType,
                            fid: log.args.fid ? log.args.fid.toString() : '0',
                            verifyAddress: log.args.verifyAddress,
                            signature: log.args.signature,
                            verifyMethod: METHOD_VERIFY,
                        },
                    };
                });

                await this.challengeQueue.addBulk(submitEvents);
            },
            onError: (error) => {
                log.error(error);
            },
        });
    }
}