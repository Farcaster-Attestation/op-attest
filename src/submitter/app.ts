import { AppDb } from "../indexer/models";
import { getDbClient } from "@farcaster/shuttle";
import { log } from "../log";
import { FARCASTER_OPTIMISTIC_VERIFY_ADDRESS, SUBMITTER_METHOD_VERIFY, SUBMITTER_BATCH_SIZE, SUBMITTER_SUBMIT_INTERVAL } from "../env";
import { MessageStatus } from "../constant";
import { MessageData, MessageType } from "@farcaster/core";
import { Message, Protocol } from "@farcaster/hub-nodejs";
import { encodeAbiParameters, encodeFunctionData, parseAbiParameters } from "viem";
import { FarcasterOptimisticVerifyAbi } from "../abi/farcaster.optimistic.verify.abi";
import { QueueData } from "../queue/queue.data";
import { Client } from "../client";
import { IndexEvent } from "./index.event";

type DataQuery = {
    id: string;
    fid: number;
    type: MessageType;
    raw: Uint8Array;
}

type InputData = {
    id: string;
    type: MessageType;
    fid: bigint;
    address: `0x${string}`;
    publicKey: `0x${string}`;
    signature: `0x${string}`;
}

export class AppSubmitter {
    private readonly db: AppDb;
    public client: Client;
    private indexer: IndexEvent;
    private isHandling = false;

    constructor(db: AppDb, client: Client, idx: IndexEvent) {
        this.db = db;
        this.indexer = idx;
        this.client = client;
    }

    static create(dbUrl: string) {
        const client = Client.getInstance();
        const db = getDbClient(dbUrl);
        const idx = new IndexEvent(FARCASTER_OPTIMISTIC_VERIFY_ADDRESS, client, db as unknown as AppDb);
        return new AppSubmitter(db as unknown as AppDb, client, idx);
    }

    async startSubmitter() {
        return setInterval(async () => {
            try {
                if (this.isHandling) return;
                this.isHandling = true;

                const dataQueries = await this.fetchBatch();
                if (!dataQueries || dataQueries.length === 0) {
                    this.isHandling = false;
                    return;
                }
                const data: DataQuery[] = [];
                dataQueries.map((d) => {
                    data.push({
                        id: d.id,
                        fid: d.fid,
                        type: d.type as MessageType,
                        raw: new Uint8Array(d.raw),
                    });
                });


                switch (SUBMITTER_METHOD_VERIFY) {
                    case 2:
                        // handle optimistic verify
                        await this.handleOptimisticVerify(data);
                        break;
                    default:
                        log.error(`unknown method: ${SUBMITTER_METHOD_VERIFY}`);
                }


                this.isHandling = false;
            } catch (error) {
                log.error(`submitter err: ${error}`);
                this.isHandling = false;
            }

        }, SUBMITTER_SUBMIT_INTERVAL); // 3s interval
    }

    async startIndexer() {
        return this.indexer.start();
    }

    async fetchBatch() {
        return this.db.transaction().execute(async (trx) => {
            return trx
                .updateTable("messages")
                .where("id", "in",
                    trx.selectFrom("messages")
                        .select("id")
                        .where("type", "in", [7, 8])
                        .where("status", "=", Number(MessageStatus.Created))
                        .orderBy("id", "asc") // Ensures deterministic order
                        .limit(SUBMITTER_BATCH_SIZE),
                )
                .set({ status: Number(MessageStatus.HandlingSubmit) })
                .returning(["id", "fid", "type", "raw"])
                .execute();
        });
    }

    async handleOptimisticVerify(data: DataQuery[]) {
        const inputData = this.transformData(data);
        if (!inputData || inputData.length === 0) return;

        const respCheck = await this.checkOptimisticVerify(inputData);
        if (!respCheck || respCheck.length === 0) return;

        const validProofs = respCheck.filter((r) => r.success && !r.isVerified);
        if (validProofs.length === 0) return;

        const respSubmit = await this.submitOptimisticVerify(validProofs as InputData[]);
        if (!respSubmit || respSubmit.length === 0) return;

        await this.db.transaction().execute(async (trx) => {
            for (const { id, success, result } of respSubmit) {
                const status = success
                    ? MessageStatus.Submitted
                    : MessageStatus.FailedSubmit;

                await trx
                    .updateTable("messages")
                    .where("id", "=", id!)
                    .set({ status, submitTxHash: result,  })
                    .execute();
            }
        });

    }

    async submitOptimisticVerify(inputs: InputData[]) {
        const calls: `0x${string}`[] = [];
        for (const { type, fid, address, publicKey, signature } of inputs) {
            calls.push(encodeFunctionData({
                abi: FarcasterOptimisticVerifyAbi,
                functionName: "submitVerification",
                args: [type, fid, address, publicKey, signature],
            }))
        }
        if (calls.length === 0) return;

        const results = await this.client.multicallSubmitProof(calls)

        return inputs.map((result, index) => ({
            ...inputs[index],
            success: results !== "0x",
            result: results !== "0x" ? results : "",
        }));
    }

    async checkOptimisticVerify(inputs: InputData[]) {
        const optimisticVerifyContract = {
            address: FARCASTER_OPTIMISTIC_VERIFY_ADDRESS,
            abi: FarcasterOptimisticVerifyAbi,
        } as const;

        const calls = inputs.map(({ type, fid, address, publicKey, signature }) => {
            return {
                ...optimisticVerifyContract,
                functionName: type === 7 ? "tryChallengeAdd" : "tryChallengeRemove",
                args: [fid, address, publicKey, signature],
            };
        });

        const results = await this.client.publicClient.multicall({
            contracts: calls,
        });


        return results.map((result, index) => ({
            ...inputs[index],
            success: result.status === "success",
            isVerified: result.status === "success"
                ? result.result
                : false,
        }));
    }

    transformData(data: DataQuery[]) {
        const inputData: InputData[] = [];
        for (const { id, fid, type, raw } of data) {
            const message = Message.decode(raw);
            if (!message) {
                log.error(`invalid message: ${fid} - ${type} - ${raw}`);
                continue;
            }

            const queueData = this.parseMsg(message);
            const signature = encodeAbiParameters(
                parseAbiParameters("bytes32 signature_r, bytes32 signature_s, bytes message"),
                [queueData.signatureR, queueData.signatureS, queueData.messageDataHex],
            );

            switch (type) {
                case 7:
                    if (!message.data ||
                        !message.data.verificationAddAddressBody ||
                        message.data.verificationAddAddressBody.protocol !== Protocol.ETHEREUM) continue;

                    if (message.data.verificationAddAddressBody.chainId === 0 ||
                        message.data.verificationAddAddressBody.chainId === 10
                    ) {
                        const { address } = message.data.verificationAddAddressBody;
                        const addressHex = "0x" + Buffer.from(address).toString("hex") as `0x${string}`;
                        inputData.push({
                            id,
                            type: 7,
                            fid: BigInt(fid),
                            address: addressHex,
                            publicKey: queueData.publicKey,
                            signature,
                        });
                    }
                    break;
                case 8:
                    if (!message.data || !message.data.verificationRemoveBody) return;

                    if (message.data.verificationRemoveBody.protocol === Protocol.ETHEREUM) {
                        const { address } = message.data.verificationRemoveBody;
                        const addressHex = "0x" + Buffer.from(address).toString("hex") as `0x${string}`;
                        inputData.push({
                            id,
                            type: 8,
                            fid: BigInt(fid),
                            address: addressHex,
                            publicKey: queueData.publicKey,
                            signature,
                        });
                    }
                    break;
                default:
                    log.error(`invalid message type: ${fid} - ${type}`);
            }
        }
        return inputData;
    }

    parseMsg(message: Message): QueueData {
        if (!message.data) throw new Error("Message data is missing");
        const messageBytes = MessageData.encode(message.data).finish();

        return {
            messageDataHex: `0x${Buffer.from(messageBytes).toString("hex")}` as `0x${string}`,
            signatureR: `0x${Buffer.from(message.signature).subarray(0, 32).toString("hex")}` as `0x${string}`,
            signatureS: `0x${Buffer.from(message.signature).subarray(32).toString("hex")}` as `0x${string}`,
            publicKey: `0x${Buffer.from(message.signer).toString("hex")}` as `0x${string}`,
        };
    }

    print(data: unknown[]) {
        const jsonString = JSON.stringify(data, (_, value) =>
            typeof value === "bigint" ? value.toString() : value,
        );
        log.info(`Show results: ${jsonString}`);
    }
}