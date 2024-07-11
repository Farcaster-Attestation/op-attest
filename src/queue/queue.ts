import { Job, Queue, Worker } from "bullmq";
import { QUEUE_NAME } from "../constant";
import { Message, Protocol } from "@farcaster/hub-nodejs";
import { log } from "../log";
import { bytesToHex } from "viem";
import { connection } from "./redis.server";
import { Eas } from "../eas";

export class EasQueue {
    public queue: Queue<Message>;
    public eas: Eas;

    constructor(queue: Queue<Message>) {
        this.queue = queue;
        this.eas = new Eas();
        this.eas.connect();
    }

    static createQueue() {
        const queue = new Queue(QUEUE_NAME, { connection });
        return new EasQueue(queue);
    }

    async addJob(data: Message) {
        await this.queue.add(QUEUE_NAME, data, {removeOnComplete: true});
    }

    async processJob() {
        new Worker(QUEUE_NAME, async (job: Job<Message>) => {
            const message = job.data;
            log.error(`Processing job: ${job.id}`);
            if (!message.data) return;
            try {
                if (message.data.verificationAddAddressBody && message.data.verificationAddAddressBody.protocol === Protocol.ETHEREUM) {
                    const { address, protocol } = message.data.verificationAddAddressBody;
                    const addressObj = JSON.parse(JSON.stringify(address));
                    await this.handleVerifyAddAddress(
                        BigInt(message.data.fid),
                        bytesToHex(addressObj["data"]),
                        protocol,
                    );
                }

                if (message.data.verificationRemoveBody && message.data.verificationRemoveBody.protocol === Protocol.ETHEREUM) {
                    const { address } = message.data.verificationRemoveBody;
                    const addressObj = JSON.parse(JSON.stringify(address));
                    await this.handleVerifyRemoveAddress(
                        BigInt(message.data.fid),
                        bytesToHex(addressObj["data"]),
                    );
                }
            } catch (e) {
                log.error(`Error processing job: ${e}`);
            }

        }, { connection });
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