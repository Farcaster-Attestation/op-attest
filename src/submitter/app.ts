import { AppDb } from "../indexer/models";
import { getDbClient } from "@farcaster/shuttle";
import { log } from "../log";
import { FARCASTER_OPTIMISTIC_VERIFY_ADDRESS, METHOD_VERIFY, SUBMITTER_BATCH_SIZE, SUBMITTER_SUBMIT_INTERVAL } from "../env";
import { MessageStatus } from "../constant";
import { MessageType } from "@farcaster/core";
import { encodeFunctionData } from "viem";
import { FarcasterOptimisticVerifyAbi } from "../abi/farcaster.optimistic.verify.abi";
import { Client } from "../client";
import { IndexEvent } from "./index.event";
import { DataQuery, InputData, transformData } from "../utils";

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
                log.info(`dataQueries: ${dataQueries.length}`)
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


                switch (METHOD_VERIFY) {
                    case 2:
                        // handle optimistic verify
                        await this.handleOptimisticVerify(data);
                        break;
                    default:
                        log.error(`unknown method: ${METHOD_VERIFY}`);
                }


                this.isHandling = false;
            } catch (error) {
                log.error(`submitter err: ${error}`);
            } finally {
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
                        .where("status", "in", [Number(MessageStatus.Created), Number(MessageStatus.HandlingSubmit), Number(MessageStatus.FailedSubmit)])
                        .orderBy("id", "asc") // Ensures deterministic order
                        .limit(SUBMITTER_BATCH_SIZE),
                )
                .set({ status: Number(MessageStatus.HandlingSubmit) })
                .returning(["id", "fid", "type", "raw"])
                .execute();
        });
    }

    async handleOptimisticVerify(data: DataQuery[]) {
        console.log('handle', data.length)

        const inputData = transformData(data);
        if (!inputData || inputData.length === 0) return;

        const respCheck = await this.checkOptimisticVerify(inputData);
        if (!respCheck || respCheck.length === 0) return;

        const validProofs = respCheck.filter((r) => r.success && !r.isVerified);
        console.log('validProofs', validProofs.length)
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

        // We don't need to mark tx as failed for retry
        if (results === "0x") return [];

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
}