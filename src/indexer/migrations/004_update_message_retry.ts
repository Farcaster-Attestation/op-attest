import { Kysely } from "kysely";

export const up = async (db: Kysely<never>) => {
    await db.schema.alterTable("messages")
        .addColumn("attestBlockNumber", "bigint", (col) => col.defaultTo(0))
        .addColumn("retrySubmit", "numeric", (col) => col.notNull().defaultTo(0))
        .addColumn("retryAttest", "numeric", (col) => col.notNull().defaultTo(0))
        .execute();

    await db.schema.createIndex("messages_attest_block_number_index").on("messages").columns(["attestBlockNumber"]).execute();
    await db.schema.createIndex("messages_retry_submit_index").on("messages").columns(["retrySubmit"]).execute();
    await db.schema.createIndex("messages_retry_attest_index").on("messages").columns(["retryAttest"]).execute();

}