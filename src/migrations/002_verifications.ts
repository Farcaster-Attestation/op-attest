import { Kysely, sql } from "kysely";

export const up = async (db: Kysely<never>) => {
    await db.schema
        .createTable("verifications")
        .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`))
        .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
        .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
        .addColumn("deletedAt", "timestamptz")
        .addColumn("timestamp", "timestamptz", (col) => col.notNull())
        .addColumn("fid", "bigint", (col) => col.notNull())
        .addColumn("hash", "bytea", (col) => col.notNull())
        .addColumn("address", "bytea", (col) => col.notNull())
        .addColumn("blockHash", "bytea")
        .addColumn("verificationType", "numeric", (col) => col.notNull())
        .addColumn("chainId", "numeric", (col) => col.notNull())
        .addColumn("protocol", "numeric", (col) => col.notNull())
        .execute();

    await db.schema
        .createIndex("verifications_fid_address_index")
        .on("verifications")
        .columns(["fid", "address"])
        .execute();
};