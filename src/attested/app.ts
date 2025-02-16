import { AppDb } from "../indexer/models";
import {
    ATTEST_BATCH_SIZE,
    ATTEST_CHALLENGE_BLOCK_OFFSET,
    ATTEST_INTERVAL,
    NETWORK, METHOD_VERIFY,
} from "../env";
import { MessageStatus } from "../constant";
import { getDbClient } from "@farcaster/shuttle";
import { log } from "../log";
import { DataQuery, InputData, transformData } from "../utils";
import { MessageType } from "@farcaster/core";
import { encodeFunctionData } from "viem";
import { resolverAbi } from "../abi/resolver.abi";
import { Client } from "../client";

export class AppAttested {
    private readonly db: AppDb;
    private isHandling = false;
    public client: Client;

    constructor(db: AppDb, client: Client) {
        this.db = db;
        this.client = client;
    }

    static create(dbUrl: string) {
        const db = getDbClient(dbUrl);
        const client = Client.getInstance();
        return new AppAttested(db as unknown as AppDb, client);
    }


    async start() {
        return setInterval(async () => {
            try {
                if (this.isHandling) return;
                this.isHandling = true;

                const proofs = await this.fetchProofs();
                if (!proofs || proofs.length === 0) {
                    log.info("No proofs to handle");
                    this.isHandling = false;
                    return;
                }

                const data: DataQuery[] = [];
                proofs.map((d) => {
                    data.push({
                        id: d.id,
                        fid: d.fid,
                        type: d.type as MessageType,
                        raw: new Uint8Array(d.raw),
                    });
                });

                switch (METHOD_VERIFY) {
                    case 2:
                        // handle attest optimistic verify
                        await this.handleAttestOptimistic(data);
                        break;
                    default:
                        log.error(`unknown method: ${METHOD_VERIFY}`);
                }

                this.isHandling = false;
            } catch (err) {
                log.error("Error fetching proofs", err);
                this.isHandling = false;
            }
        }, ATTEST_INTERVAL);
    }

    async fetchProofs() {
        const latestBlock = await this.db.selectFrom("syncHeads").select("head").where("network", "=", NETWORK).executeTakeFirst();
        const challengeBlock = latestBlock?.head??0 - ATTEST_CHALLENGE_BLOCK_OFFSET;
        log.info("challengeBlock", challengeBlock);
        if (challengeBlock < 0) {
            return;
        }
        return this.db.transaction().execute(async (trx) => {
            return trx
                .updateTable("messages")
                .where("id", "in",
                    trx.selectFrom("messages")
                        .select("id")
                        .where("type", "in", [7, 8])
                        .where("status", "=", Number(MessageStatus.Submitted))
                        .where("submitBlockNumber", "<=", BigInt(challengeBlock))
                        .where("submitBlockNumber", ">", BigInt(0))
                        .orderBy("id", "asc")
                        .limit(ATTEST_BATCH_SIZE),
                )
                .set({ status: Number(MessageStatus.HandlingAttest) })
                .returning(["id", "fid", "type", "raw"])
                .execute();
        });
    }

    async handleAttestOptimistic(data: DataQuery[]) {
        const transformedData = transformData(data);
        if (!transformedData || transformedData.length === 0) return;

        const respAttest = await this.attestedProofs(transformedData);
        if (!respAttest || respAttest.length === 0) return;

        await this.db.transaction().execute(async (trx) => {
            for (const { id, success, result } of respAttest) {
                const status = success
                    ? MessageStatus.Attested
                    : MessageStatus.FailedAttest;

                await trx
                    .updateTable("messages")
                    .where("id", "=", id!)
                    .set({ status, submitTxHash: result,  })
                    .execute();
            }
        });

    }

    async attestedProofs(inputs: InputData[]) {
        const calls: `0x${string}`[] = [];
        for (const { type, fid, address, publicKey, signature } of inputs) {
            switch (type) {
                case MessageType.VERIFICATION_ADD_ETH_ADDRESS:
                    calls.push(encodeFunctionData({
                        abi: resolverAbi,
                        functionName: "attest",
                        args: [address, fid, publicKey, BigInt(METHOD_VERIFY), signature],
                    }));
                    break;
                case MessageType.VERIFICATION_REMOVE:
                    calls.push(encodeFunctionData({
                        abi: resolverAbi,
                        functionName: "revoke",
                        args: [address, fid, publicKey, BigInt(METHOD_VERIFY), signature],
                    }));
                    break;
                default:
                    log.error(`invalid message type: ${fid} - ${type}`);
            }
        }
        if (calls.length === 0) return;

        const results = await this.client.multicallAttest(calls)

        return inputs.map((result, index) => ({
            ...inputs[index],
            success: results !== "0x",
            result: results !== "0x" ? results : "",
        }));
    }
}