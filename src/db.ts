import { FileMigrationProvider, Kysely, Migrator } from "kysely";
import { Logger } from "./log";
import { err, ok, Result } from "neverthrow";
import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "node:url";
import { HubTables } from "@farcaster/hub-shuttle";
import { DB } from "@farcaster/shuttle";

const createMigrator = async (db: Kysely<HubTables>, appName: string) => {
    const currentDir = path.join(path.dirname(fileURLToPath(import.meta.url)), appName);

    return new Migrator({
        db,
        provider: new FileMigrationProvider({
            fs,
            path,
            migrationFolder: path.join(currentDir, "migrations"),
        }),
    });
};

export const migrateToLatest = async (db: DB, log: Logger, appName: string): Promise<Result<void, unknown>> => {
    const migrator = await createMigrator(db as unknown as Kysely<HubTables>, appName);

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
