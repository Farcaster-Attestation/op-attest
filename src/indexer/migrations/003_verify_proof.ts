import { Kysely, sql } from "kysely";

/**************************************************************************************************
 Notes about the patterns in this file:

 * Uses features introduced in Postgres 15, so this will not work on older versions.

 * Uses ULIDs as the surrogate key for most tables so that we don't rely on sequences, allowing
 tables to be partitioned in the future if needed. ULIDs still have temporal ordering unlike
 most UUIDs.

 * Uses created_at/updated_at columns to refer to database row create/update time, NOT
 the creation time of the entity on the Farcaster network itself.
 Separate columns (e.g. "timestamp") represent when the content was created on Farcaster.

 * Declares columns in a particular order to minimize storage on disk. If the declaration order
 looks odd, remember it's to reduce disk space.
 See https://www.2ndquadrant.com/en/blog/on-rocks-and-sand/ for more info.

 * Uses bytea columns to store raw bytes instead of text columns with `0x` prefixed strings, since
 raw bytes reduce storage space, reduce index size, are faster to query (especially with joins),
 and avoid case sensitivity issues when dealing with string comparison.

 * Uses B-tree indexes (the default) for most columns representing a hash digest, since you can
 perform lookups on those hashes matching by prefix, whereas you can't do this with hash indexes.

 * Declares some indexes that we think might be useful for data analysis and general querying,
 but which aren't actually required by the shuttle itself.

 * Declares partial indexes (via a WHERE predicate) to reduce the size of the index and ensure
 only relevant rows are returned (e.g. ignoring soft-deleted rows, etc.)

 * Uses JSON columns instead of native Postgres array columns to significantly reduce on-disk
 storage (JSON is treated like TEXT) at the cost of slightly slower querying time. JSON columns
 can also be more easily modified over time without requiring a schema migration.

 * Declares foreign keys to ensure correctness. This means that the shuttle will not process
 a message if it refers to content that has not yet been seen, since that would violate the FK
 constraint. Instead, it will put the message into an unprocessed message queue and try again
 once the content it references has been processed. If you want to remove data that was
 pruned/revoked/deleted, you can hard delete the corresponding row in the messages table, and
 the downstream tables referencing that message will also be deleted.
 **************************************************************************************************/

// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
export const up = async (db: Kysely<never>) => {
    // Used for generating random bytes in ULID creation
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`.execute(db);

    // verify_proofs -------------------------------------------------------------------------------------
    await db.schema
        .createTable("verify_proofs")
        .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`))
        .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
        .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
        .addColumn("deletedAt", "timestamptz")
        .addColumn("fid", "bigint", (col) => col.notNull())
        .addColumn("blockNumber", "bigint")
        .addColumn("messageType", sql`smallint`, (col) => col.notNull())
        .addColumn("verifyMethod", sql`smallint`, (col) => col.notNull())
        .addColumn("verifyAddress", "text", (col) => col.notNull())
        .addColumn("publicKey", "text", (col) => col.notNull())
        .addColumn("txHash", "text")
        .addColumn("signature", "text", (col) => col.notNull())
        .addColumn("status", "text", (col) => col.notNull())
        .addUniqueConstraint("proof_hash_unique", ["txHash"])
        .$call((qb) =>
            qb.addPrimaryKeyConstraint("proof_pkey", ["id"]).addUniqueConstraint("proof_hash_unique", ["txHash"]),
        )
        .execute();

    await db.schema.createIndex("proof_fid_index").on("verify_proofs").columns(["fid"]).execute();

    await db.schema.createIndex("proof_verify_address_index").on("verify_proofs").columns(["verifyAddress"]).execute();

    await db.schema.createIndex("proof_block_number_index").on("verify_proofs").columns(["blockNumber"]).execute();

    // create table sync heads
    await db.schema
        .createTable("sync_heads")
        .addColumn("network", "text", (col) => col.notNull())
        .addColumn("head", "bigint", (col) => col.notNull())
        .addUniqueConstraint("sync_head_network_unique", ["network"])
        .$call((qb) =>
            qb.addPrimaryKeyConstraint("sync_head_network", ["network"]),
        )
        .execute();
};
