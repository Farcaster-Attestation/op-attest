import { Worker, Job } from "bullmq";
import { EasQueueData } from "./eas.queue.data";
import { MessageData, MessageType } from "@farcaster/core";
import { hexToBytes } from "viem";
import { log } from "../log";
import { Protocol } from "@farcaster/hub-nodejs";
import { Eas } from "../eas";
import Redis, { Cluster } from "ioredis";
import { EAS_QUEUE_NAME } from "../constant";

export class EasWorker {
    public eas: Eas;

    constructor() {
        this.eas = new Eas();
        this.eas.connect();
    }

    getWorker(redis: Redis | Cluster, concurrency = 1) {
        return new Worker(
            EAS_QUEUE_NAME,
            async (job: Job<EasQueueData>) => {
                await this.processEASQueue(job);
            },
            {
                autorun: false, // Don't start yet
                useWorkerThreads: concurrency > 1,
                concurrency,
                connection: redis,
                removeOnComplete: { count: 100 }, // Keep at most this many completed jobs
                removeOnFail: { count: 100 }, // Keep at most this many failed jobs
            },
        );
    }

    async processEASQueue(job: Job<EasQueueData>) {
        const queueData = job.data;
        try {
            const msgData = MessageData.decode(hexToBytes(queueData.messageDataHex));
            log.debug(`Processing job: ${job.id} - data: ${JSON.stringify(msgData)}`);
            switch (msgData.type) {
                case MessageType.VERIFICATION_ADD_ETH_ADDRESS:
                    if (!msgData.verificationAddAddressBody) return;
                    if (msgData.verificationAddAddressBody.protocol === Protocol.ETHEREUM) {
                        const { address, protocol } = msgData.verificationAddAddressBody;
                        const addressHex = "0x" + Buffer.from(address).toString("hex");
                        const verified = await this.eas.verifyAddEthAddress(queueData);
                        log.debug(`Verify add address message status: ${verified}`);
                        if (verified) {
                            await this.handleVerifyAddAddress(
                                BigInt(msgData.fid),
                                addressHex as `0x${string}`,
                                protocol,
                            );
                        }
                    }
                    break;
                case MessageType.VERIFICATION_REMOVE:
                    if (!msgData.verificationRemoveBody) return;
                    if (msgData.verificationRemoveBody.protocol === Protocol.ETHEREUM) {
                        const { address } = msgData.verificationRemoveBody;
                        const addressHex = "0x" + Buffer.from(address).toString("hex");
                        const verified = await this.eas.verifyRemoveAddress(queueData);
                        log.debug(`Verify remove address message status: ${verified}`);
                        if (verified) {
                            await this.handleVerifyRemoveAddress(
                                BigInt(msgData.fid),
                                addressHex as `0x${string}`,
                            );
                        }
                    }
                    break;
                default:
                    log.error(`Unknown message type: ${msgData.type}`);
                    return;
            }
        } catch (e) {
            log.error(`Error processing job: ${e}`);
        }
    }


    async handleVerifyAddAddress(fid: bigint, address: `0x${string}`, protocol: number) {
        const { isAttested } = await this.eas.checkFidVerification(
            fid,
            address,
        );

        if (isAttested) {
            log.error(`Farcaster was attested for fid: ${fid}`);
            return;
        }

        const tx = await this.eas.attestOnChain(
            fid,
            address,
            protocol,
        );
        log.info(`Attestation tx: ${tx}`);
    }

    async handleVerifyRemoveAddress(fid: bigint, address: `0x${string}`) {
        const { isAttested, uid } = await this.eas.checkFidVerification(
            fid,
            address,
        );

        if (!isAttested) {
            log.error(`Farcaster was not attested for fid: ${fid}`);
            return;
        }

        const tx = await this.eas.revokeAttestation(uid);
        log.info(`Revoke attestation tx: ${tx}`);
    }
}