import { Worker, Job } from "bullmq";
import { QueueData } from "./queue.data";
import { MessageData, MessageType } from "@farcaster/core";
import { encodeAbiParameters, hexToBytes, parseAbiParameters } from "viem";
import { log } from "../log";
import { Protocol } from "@farcaster/hub-nodejs";
import { Eas } from "../eas";
import Redis, { Cluster } from "ioredis";
import { EAS_QUEUE_NAME } from "../constant";
import { Client } from "../client";

export class EasWorker {
    public eas: Eas;
    public client: Client;

    constructor() {
        this.eas = new Eas();
        this.eas.connect();
        this.client = Client.getInstance();
    }

    getWorker(redis: Redis | Cluster, concurrency = 1) {
        return new Worker(
            EAS_QUEUE_NAME,
            async (job: Job<QueueData>) => {
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

    async processEASQueue(job: Job<QueueData>) {
        const queueData = job.data;
        try {
            const msgData = MessageData.decode(hexToBytes(queueData.messageDataHex));
            log.debug(`Processing job: ${job.id} - data: ${JSON.stringify(msgData)}`);
            switch (msgData.type) {
                case MessageType.VERIFICATION_ADD_ETH_ADDRESS:
                    if (!msgData.verificationAddAddressBody) return;
                    if (msgData.verificationAddAddressBody.protocol === Protocol.ETHEREUM) {
                        if (msgData.verificationAddAddressBody.chainId === 0 || msgData.verificationAddAddressBody.chainId === 10) {
                            const { address } = msgData.verificationAddAddressBody;
                            const addressHex = "0x" + Buffer.from(address).toString("hex");
                            const verified = await this.client.verifyAddEthAddress(queueData);
                            log.debug(`Verify add address message status: ${verified}`);
                            if (verified) {
                                const signature = encodeAbiParameters(
                                    parseAbiParameters('bytes32 signature_r, bytes32 signature_s, bytes message'),
                                    [queueData.signatureR, queueData.signatureS, queueData.messageDataHex]
                                )
                                await this.handleVerifyAddAddress(
                                    BigInt(msgData.fid),
                                    addressHex as `0x${string}`,
                                    queueData.publicKey,
                                    signature,
                                );
                            }
                        }
                    }
                    break;
                case MessageType.VERIFICATION_REMOVE:
                    if (!msgData.verificationRemoveBody) return;
                    if (msgData.verificationRemoveBody.protocol === Protocol.ETHEREUM) {
                        const { address } = msgData.verificationRemoveBody;
                        const addressHex = "0x" + Buffer.from(address).toString("hex");
                        const verified = await this.client.verifyRemoveAddress(queueData);
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
            log.error(`Error processing jobId: ${job.id} - error: ${e}`);
            throw e;
        }
    }


    async handleVerifyAddAddress(fid: bigint, address: `0x${string}`, publicKey: `0x${string}`, signature: `0x${string}`) {
        const isAttested  = await this.client.checkFidVerification(
            fid,
            address,
        );

        if (isAttested) {
            log.error(`Farcaster was attested for fid: ${fid}`);
            return;
        }

        log.debug(`Attesting farcaster for fid: ${fid}`);
        log.debug(`Address: ${address}`);
        log.debug(`Public key: ${publicKey}`);
        log.debug(`Signature: ${signature}`);

        const tx = await this.eas.attestOnChain(
            fid,
            address,
            publicKey,
            signature,
        );
        log.info(`Attestation tx: ${tx}`);
    }

    async handleVerifyRemoveAddress(fid: bigint, address: `0x${string}`) {
        const isAttested  = await this.client.checkFidVerification(
            fid,
            address,
        );

        if (!isAttested) {
            log.error(`Farcaster was not attested for fid: ${fid}`);
            return;
        }

        const uid = await this.client.getAttestationUid(fid, address);

        const tx = await this.eas.revokeAttestation(uid);
        log.info(`Revoke attestation tx: ${tx}`);
    }
}