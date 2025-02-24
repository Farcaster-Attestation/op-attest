import { Worker, Job } from "bullmq";
import { EASQueueData } from "./queue.data";
import { MessageType } from "@farcaster/core";
import { log } from "../log";
import Redis, { Cluster } from "ioredis";
import { EAS_QUEUE_NAME } from "../constant";
import { Client } from "../client";
import { AppDb } from "../indexer/models";
import { Fid } from "@farcaster/shuttle";

export class EasWorker {
    public client: Client;
    public db: AppDb;

    constructor(db : AppDb) {
        this.client = Client.getInstance();
        this.db = db;
    }

    getWorker(redis: Redis | Cluster, concurrency = 1) {
        return new Worker(
            EAS_QUEUE_NAME,
            async (job: Job<EASQueueData>) => {
                await this.processEASQueue(job);
            },
            {
                autorun: false, // Don't start yet
                useWorkerThreads: concurrency > 1,
                concurrency,
                connection: redis,
            },
        );
    }

    async processEASQueue(job: Job<EASQueueData>) {
        const queueData = job.data;
        log.info(`Processing jobId: ${job.id} - message: ${JSON.stringify(queueData)}`);
        try {
            switch (queueData.messageType) {
                case MessageType.VERIFICATION_ADD_ETH_ADDRESS:
                    await this.handleVerifyAddAddress(
                        BigInt(queueData.fid),
                        queueData.verifyAddress,
                        queueData.publicKey,
                        queueData.signature,
                        queueData.verifyMethod,
                        );
                    break;
                case MessageType.VERIFICATION_REMOVE:
                    await this.handleVerifyRemoveAddress(
                        BigInt(queueData.fid),
                        queueData.verifyAddress,
                        queueData.publicKey,
                        queueData.signature,
                        queueData.verifyMethod,
                        );
                    break;
                default:
                    log.error(`Unknown message type: ${queueData.messageType}`);
                    return;
            }
        } catch (e) {
            log.error(`Error processing jobId: ${job.id} - error: ${e}`);
            throw e;
        }
    }


    async handleVerifyAddAddress(
        fid: bigint,
        address: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
        methodVerify: number,
        ) {
        const isAttested  = await this.client.checkFidVerification(
            fid,
            address,
        );

        if (isAttested) {
            log.info(`Farcaster was attested for fid: ${fid}`);
            await this.db.updateTable("verifyProofs")
                .where("fid", "=", fid as unknown as Fid)
                .where("verifyAddress", "=", address)
                .set({ status: "ATTESTED" })
                .execute();
            return;
        }

        const tx = await this.client.attest(
            fid,
            address,
            publicKey,
            signature,
            methodVerify,
        );
        log.info(`Attestation tx: ${tx}`);

        await this.db.updateTable("verifyProofs")
            .where("fid", "=", fid as unknown as Fid)
            .where("verifyAddress", "=", address)
            .set({ status: "ATTESTED" })
            .execute();
    }

    async handleVerifyRemoveAddress(
        fid: bigint,
        address: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
        methodVerify: number,
        ) {
        const isAttested  = await this.client.checkFidVerification(
            fid,
            address,
        );

        if (!isAttested) {
            log.error(`Farcaster was not attested for fid: ${fid}`);
            return;
        }

        const tx = await this.client.revoke(
            fid,
            address,
            publicKey,
            signature,
            methodVerify,
        );
        log.info(`Revoke attestation tx: ${tx}`);

        await this.db.updateTable("verifyProofs")
            .where("fid", "=", fid as unknown as Fid)
            .where("verifyAddress", "=", address)
            .set({ status: "REVOKED" })
            .execute();
    }
}