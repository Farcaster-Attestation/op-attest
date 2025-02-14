import { AppDb } from "../indexer/models";
import { getDbClient } from "@farcaster/shuttle";
import { log } from "../log";
import { SUBMITTER_BATCH_SIZE, SUBMITTER_INTERVAL } from "../env";
import { MessageStatus } from "../constant";
import { MessageType } from "@farcaster/core";

export class AppSubmitter {
    private readonly db: AppDb;
    private isHandling = false;

    constructor(db: AppDb) {
        this.db = db;
    }

    static create(dbUrl: string) {
        const db = getDbClient(dbUrl);
        return new AppSubmitter(db as unknown as AppDb);
    }

    async start() {
        return setInterval(async () => {
            try {
                if (this.isHandling) return;
                this.isHandling = true;

                log.warn("starting");
                const messages = await this.fetchBatch();
                if (!messages || messages.length === 0) {
                    this.isHandling = false;
                    return;
                }

                for (const message of messages) {
                    // submit message
                    log.warn(`submitting message: ${message.fid}`);
                    switch (message.type) {
                        case MessageType.VERIFICATION_ADD_ETH_ADDRESS:
                            // handle submit for verification add eth address
                            break;
                        case MessageType.VERIFICATION_REMOVE:
                            // handle submit for verification remove
                            break;
                        default:
                            log.error(`unknown message type: ${message.type}`);
                    }
                }

                this.isHandling = false;
            } catch (error) {
                log.error(`submitter err: ${error}`);
                this.isHandling = false;
            }

        }, SUBMITTER_INTERVAL); // 3s interval
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
                .returning(["fid", "type", "raw"])
                .execute();
        });
    }
}