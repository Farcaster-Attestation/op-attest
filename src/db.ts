import { FileMigrationProvider, Generated, Kysely, Migrator } from "kysely";
import { Logger } from "./log";
import { err, ok, Result } from "neverthrow";
import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "node:url";
import { HubTables } from "@farcaster/hub-shuttle";
import { DB, Fid } from "@farcaster/shuttle";

const createMigrator = async (db: DB) => {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));

    return new Migrator({
        db,
        provider: new FileMigrationProvider({
            fs,
            path,
            migrationFolder: path.join(currentDir, "migrations"),
        }),
    });
};

export const migrateToLatest = async (db: DB, log: Logger): Promise<Result<void, unknown>> => {
    const migrator = await createMigrator(db);

    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((it) => {
        if (it.status === "Success") {
            log.info(`Migration "${it.migrationName}" was executed successfully`);
        } else if (it.status === "Error") {
            log.error(`failed to execute migration "${it.migrationName}"`);
        }
    });

    if (error) {
        log.error("Failed to apply all database migrations");
        log.error(error);
        return err(error);
    }

    log.info("Migrations up to date");
    return ok(undefined);
};

export type VerificationRow = {
    id: Generated<string>;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
    deletedAt: Date | null;
    timestamp: Date;
    fid: Fid;
    hash: Uint8Array;
    address: Uint8Array;
    blockHash: Uint8Array | null;
    verificationType: number;
    chainId: number;
    protocol: number;

};

export interface Tables extends HubTables {
    verifications: VerificationRow;
}

export type AppDb = Kysely<Tables>;
