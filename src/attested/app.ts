import { AppDb } from "../indexer/models";
import { NETWORK } from "../env";
import { CHALLENGE_BLOCK_OFFSET, EAS_QUEUE_NAME } from "../constant";
import { Queue } from "bullmq";
import { QueueFactory } from "../queue/queue";
import { getDbClient, RedisClient } from "@farcaster/shuttle";
import { EasWorker } from "../queue/eas.worker";
import { log } from "../log";
import { sha256, toHex } from "viem";

export class AppAttested {
    private readonly db: AppDb;
    private easQueue: Queue;
    private readonly redis: RedisClient;

    constructor(db: AppDb, redis: RedisClient) {
        this.db = db;
        this.redis = redis;
        this.easQueue = QueueFactory.getQueue(EAS_QUEUE_NAME, this.redis.client);
    }

    static create(dbUrl: string,
                  redisUrl: string ) {
        const db = getDbClient(dbUrl);
        const redis = RedisClient.create(redisUrl);
        return new AppAttested(db as unknown as AppDb, redis);
    }


    async start() {
        // set interval to get proofs
        await this.getProofs();

        // run worker to attest proofs
        const worker = new EasWorker(this.db).getWorker(this.redis.client);
        await worker.run();
    }

    async getProofs() {
        return setInterval(async () => {
            log.warn("Getting proofs to attest");
            const latestBlock = await this.db.selectFrom("syncHeads").select("head").where("network", "=", NETWORK).executeTakeFirst();
            const challengeBlock = latestBlock?.head??0 - CHALLENGE_BLOCK_OFFSET;
            if (challengeBlock < 0) {
                return;
            }
            const proofs = await this.db.selectFrom("verifyProofs")
                .selectAll()
                .where("blockNumber", "<=", BigInt(challengeBlock))
                .where("status" , "=", "SUBMITTED")
                .limit(1800)
                .execute();
            if (!proofs || proofs.length === 0) {
                return;
            }

            log.warn(`Found ${proofs.length} proofs to attest`);

            for (const proof of proofs) {
                await this.checkAndAddJob({
                    publicKey: proof.publicKey,
                    messageType: proof.messageType,
                    fid: proof.fid,
                    verifyAddress: proof.verifyAddress,
                    signature: proof.signature,
                    verifyMethod: proof.verifyMethod,
                });
            }

        }, 1000 * 60 * 60); // * 60 * 60
    }

    async checkAndAddJob(data: unknown) {
        const jobId = this.generateJobId(JSON.stringify(data));
        const existingJob = await this.easQueue.getJob(jobId);
        if (existingJob) {
            log.warn("Job already exists:", jobId);
            return;
        }

        await this.easQueue.add(EAS_QUEUE_NAME, data, { jobId });
    }

    generateJobId(data: string): `0x${string}` {
        return sha256(toHex(data));
    }
}