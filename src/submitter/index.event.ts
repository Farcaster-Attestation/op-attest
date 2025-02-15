import { Client } from "../client";
import { AppDb } from "../indexer/models";
import { NETWORK, SUBMITTER_INDEX_INTERVAL } from "../env";
import { FarcasterOptimisticVerifyAbi } from "../abi/farcaster.optimistic.verify.abi";
import { log } from "../log";
import { MessageStatus } from "../constant";

export class IndexEvent {
    constructor(
        private readonly contract: `0x${string}`,
        private readonly client: Client,
        private readonly db: AppDb,
    ) {
    }

    async getSyncHead() {
        return await this.db.selectFrom("syncHeads").select("head").where("network", "=", NETWORK).executeTakeFirst();
    }

    async updateSyncHead(head: bigint) {
        const headRecord = await this.getSyncHead();
        if (!headRecord) {
            return await this.db.insertInto("syncHeads").values({ network: NETWORK, head }).execute();
        } else {
            return await this.db.updateTable("syncHeads").where("network", "=", NETWORK).set({ head }).execute();
        }
    }

    async getLastHead() {
        return this.client.publicClient.getBlock();
    }

    async indexRange(fromBlock: bigint, toBlock: bigint) {
        const logs = await this.client.publicClient.getContractEvents({
            address: this.contract,
            abi: FarcasterOptimisticVerifyAbi,
            fromBlock,
            toBlock,
            eventName: "SubmitVerification",
        });

        const submitEvents = logs.map((log) => ({
            txHash: log.transactionHash,
            messageType: log.args.messageType,
            fid: log.args.fid,
            verifyAddress: log.args.verifyAddress,
            publicKey: log.args.publicKey,
            hash: log.args.hash,
            signature: log.args.signature,
            blockNumber: log.blockNumber,
        }));
        const uniqueSubmitEvents = Array.from(
            new Map(submitEvents.map(event => [event.txHash, event])).values()
        );


        const persistJobs = uniqueSubmitEvents.map((event) => {
            return this.db.updateTable("messages").where("submitTxHash", "=", event.txHash).set({
                submitBlockNumber: event.blockNumber,
                status: MessageStatus.Submitted,
            }).execute();
        });

        await Promise.all(persistJobs);

        return submitEvents;
    }

    async index(maxBehindHead: bigint) {
        const syncedHead = await this.getSyncHead();
        const lastHead = await this.getLastHead();
        let toBlock = lastHead.number;

        let fromBlock: bigint = toBlock - maxBehindHead;
        if (syncedHead && syncedHead.head >= fromBlock) {
            fromBlock = BigInt(syncedHead.head) + 1n;
        }

        if (toBlock <= fromBlock) {
            return;
        }

        if (syncedHead && fromBlock > syncedHead.head) {
            fromBlock = BigInt(syncedHead.head) + 1n;
            toBlock = fromBlock + maxBehindHead;
        }


        const events = await this.indexRange(fromBlock, toBlock);

        await this.updateSyncHead(toBlock);

        return {
            prevSyncedBlock: syncedHead?.head || 0n,
            fromBlock,
            toBlock,
            length: events.length,
        };
    }

    async start() {
        return setInterval(async () => {
            try {
                const res = await this.index(20n);
                if (res) {
                    if (res.fromBlock > BigInt(res.prevSyncedBlock) + 1n) {
                        log.warn(
                            `Skipped blocks from ${BigInt(res.prevSyncedBlock) + 1n} to ${res.fromBlock - 1n}`,
                        );
                    }
                    log.debug(
                        `Indexed blocks from ${res.fromBlock} to ${res.toBlock}, ${res.length} event(s)`,
                    );
                } else {
                    log.debug("No new blocks to index");
                }
            } catch (e) {
                log.error(e);
            }
        }, SUBMITTER_INDEX_INTERVAL);
    }
}