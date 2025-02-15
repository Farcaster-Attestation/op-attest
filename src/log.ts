import { pino } from "pino";
import { LOG_LEVEL } from "./env";

const COLORIZE =
    process.env["COLORIZE"] === "true" ? true : process.env["COLORIZE"] === "false" ? false : process.stdout.isTTY;

export const log = pino({
    level: LOG_LEVEL,
    transport: {
        target: "pino-pretty",
        options: {
            colorize: COLORIZE,
            singleLine: true,
        },
    },
});

export type Logger = pino.Logger;