
import { POSTGRES_URL } from "../env";
import { log } from "../log";
import { AppSubmitter } from "../submitter/app";

export class SubmitterCMD {
    static async run() {
        const app = AppSubmitter.create(POSTGRES_URL);
        log.info("Starting submitter");
        await app.start();
    }
}