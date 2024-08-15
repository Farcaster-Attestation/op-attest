import Redis, { Cluster } from "ioredis";
import { SUBMIT_PROOF_QUEUE_NAME } from "../constant";
import { Worker, Job } from "bullmq";
import { MessageData, MessageType } from "@farcaster/core";
import { encodeAbiParameters, hexToBytes, parseAbiParameters } from "viem";
import { log } from "../log";
import { Protocol } from "@farcaster/hub-nodejs";
import { Client } from "../client";
import { QueueData } from "./queue.data";
import { DB, Fid } from "@farcaster/shuttle";
import { AppDb } from "../indexer/models";
import { METHOD_VERIFY } from "../env";
import { Eas } from "../attested/eas";

export class SubmitProofWorker {
    public eas: Eas;
    private readonly db: AppDb;
    public client: Client;

    constructor(db: DB) {
        this.eas = new Eas();
        this.eas.connect();
        this.client = Client.getInstance();
        this.db = db as unknown as AppDb;
    }

    getWorker(redis: Redis | Cluster, concurrency = 1) {
        return new Worker(
            SUBMIT_PROOF_QUEUE_NAME,
            async (job: Job<QueueData>) => {
                await this.processSubmitProofQueue(job);
            },
            {
                autorun: false, // Don't start yet
                useWorkerThreads: concurrency > 1,
                concurrency,
                connection: redis,
            },
        );
    }

    async processSubmitProofQueue(job: Job<QueueData>) {
        const queueData = job.data;
        try {
            const msgData = MessageData.decode(hexToBytes(queueData.messageDataHex));
            log.info(`Processing job: ${job.id} - data: ${JSON.stringify(msgData)}`);
            switch (msgData.type) {
                case MessageType.VERIFICATION_ADD_ETH_ADDRESS:
                    if (!msgData.verificationAddAddressBody) return;
                    if (msgData.verificationAddAddressBody.protocol === Protocol.ETHEREUM) {
                        if (msgData.verificationAddAddressBody.chainId === 0 || msgData.verificationAddAddressBody.chainId === 10) {
                            const { address } = msgData.verificationAddAddressBody;
                            const addressHex = "0x" + Buffer.from(address).toString("hex");
                            const signature = encodeAbiParameters(
                                parseAbiParameters("bytes32 signature_r, bytes32 signature_s, bytes message"),
                                [queueData.signatureR, queueData.signatureS, queueData.messageDataHex],
                            );

                            // check data able to verify on chain or not before submit proof
                            const verified = await this.client.verifyAdd(
                                BigInt(msgData.fid),
                                addressHex as `0x${string}`,
                                queueData.publicKey,
                                signature,
                            );

                            log.info(`Verify add address message status: 
                            ${verified} 
                            - address: ${addressHex} 
                            - fid: ${msgData.fid} 
                            - publicKey: ${queueData.publicKey} 
                            - signature: ${signature}`);
                            if (!verified) {
                                await this.handleVerifyAddAddress(
                                    msgData.type,
                                    BigInt(msgData.fid),
                                    addressHex as `0x${string}`,
                                    queueData.publicKey,
                                    signature,
                                );
                            } else {
                                // insert into db
                                await this.db.insertInto("verifyProofs")
                                    .values({
                                        fid: msgData.fid,
                                        messageType: msgData.type,
                                        verifyMethod: METHOD_VERIFY,
                                        verifyAddress: addressHex as `0x${string}`,
                                        publicKey: queueData.publicKey,
                                        txHash: "",
                                        signature,
                                        status: "FAILED",
                                    })
                                    .execute();
                            }
                        }
                    }
                    break;
                case MessageType.VERIFICATION_REMOVE:
                    if (!msgData.verificationRemoveBody) return;
                    if (msgData.verificationRemoveBody.protocol === Protocol.ETHEREUM) {
                        const { address } = msgData.verificationRemoveBody;
                        const addressHex = "0x" + Buffer.from(address).toString("hex");
                        const signature = encodeAbiParameters(
                            parseAbiParameters("bytes32 signature_r, bytes32 signature_s, bytes message"),
                            [queueData.signatureR, queueData.signatureS, queueData.messageDataHex],
                        );

                        // check data able to verify on chain or not before submit proof
                        const verified = await this.client.verifyRemove(
                            BigInt(msgData.fid),
                            addressHex as `0x${string}`,
                            queueData.publicKey,
                            signature,
                        );

                        log.info(`Verify remove address message status: 
                        ${verified}
                        - address: ${addressHex}
                        - fid: ${msgData.fid}
                        - publicKey: ${queueData.publicKey}
                        - signature: ${signature}`);
                        if (!verified) {
                            await this.handleVerifyRemoveAddress(
                                msgData.type,
                                BigInt(msgData.fid),
                                addressHex as `0x${string}`,
                                queueData.publicKey,
                                signature,
                            );
                        } else {
                            // insert into db
                            await this.db.insertInto("verifyProofs")
                                .values({
                                    fid: msgData.fid,
                                    messageType: msgData.type,
                                    verifyMethod: METHOD_VERIFY,
                                    verifyAddress: addressHex as `0x${string}`,
                                    publicKey: queueData.publicKey,
                                    txHash: "",
                                    signature,
                                    status: "FAILED",
                                })
                                .execute();
                        }
                    }
                    break;
                default:
                    log.error(`Unknown message type: ${msgData.type}`);
                    return;
            }
        } catch (error) {
            log.error(`Error processing submit proof jobId: ${job.id} - error: ${error}`);
            throw error;
        }
    }

    async handleVerifyAddAddress(
        messageType: MessageType,
        fid: bigint,
        address: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
    ) {
        const isAttested = await this.client.checkFidVerification(
            fid,
            address,
        );

        if (isAttested) {
            log.error(`Farcaster was attested for fid: ${fid}`);
            return;
        }

        switch (METHOD_VERIFY) {
            case 2:
                // handle submit proof to contract with method verify optimistic
                await this.handleSubmitProof(messageType, fid, address, publicKey, signature);
                break;
            case 1:
                // attest on chain instantly
                await this.handleAttestOnChain(messageType, fid, address, publicKey, signature, METHOD_VERIFY);
                break;
            default:
                log.error(`Unknown verify method: ${METHOD_VERIFY}`);
        }
    }

    async handleVerifyRemoveAddress(
        messageType: MessageType,
        fid: bigint,
        address: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
    ) {
        const isAttested = await this.client.checkFidVerification(
            fid,
            address,
        );

        if (!isAttested) {
            log.error(`Farcaster was not attested for fid: ${fid}`);
            return;
        }

        switch (METHOD_VERIFY) {
            case 2:
                // handle submit proof to contract with method verify optimistic
                await this.handleSubmitProof(messageType, fid, address, publicKey, signature);
                break;
            case 1:
                // attest on chain instantly
                await this.handleRevokeAttestation(messageType, fid, address, publicKey, signature, METHOD_VERIFY);
                break;
            default:
                log.error(`Unknown verify method: ${METHOD_VERIFY}`);

        }
    }

    async handleSubmitProof(
        messageType: number,
        fid: bigint,
        address: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
    ) {
        let txHash = "", status;
        try {
            txHash = await this.client.submitVerifyProof(messageType, fid, address, publicKey, signature);
            status = "PENDING";
        } catch (error) {
            log.error(`Error submitting proof to contract: ${error}`);
            status = "FAILED";
        }

        // insert into db
        await this.db.insertInto("verifyProofs")
            .values({
                fid: fid as unknown as Fid,
                messageType,
                verifyMethod: METHOD_VERIFY,
                verifyAddress: address,
                publicKey,
                txHash,
                signature,
                status: status,
            })
            .execute();
    }

    async handleAttestOnChain(
        messageType: number,
        fid: bigint,
        address: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
        methodVerify: number,
    ) {
        const tx = await this.eas.attestOnChain(
            fid,
            address,
            publicKey,
            signature,
            methodVerify,
        );

        // insert into db
        await this.db.insertInto("verifyProofs")
            .values({
                fid: fid as unknown as Fid,
                messageType,
                verifyMethod: methodVerify,
                verifyAddress: address,
                publicKey,
                txHash: tx,
                signature,
                status: "ATTESTED",
            })
            .execute();
    }

    async handleRevokeAttestation(
        messageType: number,
        fid: bigint,
        address: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
        methodVerify: number,
    ) {
        const uid = await this.client.getAttestationUid(fid, address);

        const tx = await this.eas.revokeAttestation(uid);

        // insert into db
        await this.db.insertInto("verifyProofs")
            .values({
                fid: fid as unknown as Fid,
                messageType,
                verifyMethod: methodVerify,
                verifyAddress: address,
                publicKey,
                txHash: tx??'',
                signature,
                status: "REVOKED",
            })
            .execute();
    }
}