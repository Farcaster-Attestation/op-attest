import { POSTGRES_URL, REDIS_URL } from "../env";
import { AppAttested } from "../attested/app";

export class AttestedCMD {
    static async run() {
        const app = AppAttested.create(POSTGRES_URL, REDIS_URL);
        await app.start();
    }
}