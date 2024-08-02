import { Challenge } from "../challenge/app";
import { REDIS_URL } from "../env";

export class ChallengeCMD {
    static async run() {
        const app = Challenge.create(REDIS_URL);
        await app.start();
    }
}