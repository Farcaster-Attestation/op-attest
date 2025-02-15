import { POSTGRES_URL } from "../env";
import { AppAttested } from "../attested/app";
import { log } from "../log";

export class AttestedCMD {
    static async run() {
        const app = AppAttested.create(POSTGRES_URL);
        log.info("Starting attested app");
        await app.start();
    }
}