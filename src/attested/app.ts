import { AppDb } from "../indexer/models";
import { NETWORK } from "../env";
import { CHALLENGE_BLOCK_OFFSET, EAS_QUEUE_NAME } from "../constant";
import { Queue } from "bullmq";
import { QueueFactory } from "../queue/queue";
import { getDbClient, RedisClient } from "@farcaster/shuttle";
import { EasWorker } from "../queue/eas.worker";
import { log } from "../log";

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
            log.info("Getting proofs to attest");
            const latestBlock = await this.db.selectFrom("syncHeads").select("head").where("network", "=", NETWORK).executeTakeFirst();
            const challengeBlock = latestBlock?.head??0 - CHALLENGE_BLOCK_OFFSET;
            if (challengeBlock < 0) {
                return;
            }
            const proofs = await this.db.selectFrom("verifyProofs")
                .selectAll()
                .where("blockNumber", "<=", BigInt(challengeBlock))
                .where("attested" , "=", false)
                .limit(1800)
                .execute();
            if (!proofs || proofs.length === 0) {
                return;
            }

            log.debug(`Found ${proofs.length} proofs to attest`);

            const queuesData = proofs.map((proof) => {
                return {
                    name: EAS_QUEUE_NAME,
                    data: {
                        publicKey: proof.publicKey,
                        messageType: proof.messageType,
                        fid: proof.fid,
                        verifyAddress: proof.verifyAddress,
                        signature: proof.signature,
                        verifyMethod: proof.verifyMethod,
                    }
                };
            });

            await this.easQueue.addBulk(queuesData);
        }, 1000); // * 60 * 60
    }
}