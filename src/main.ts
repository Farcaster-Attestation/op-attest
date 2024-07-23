import { readFileSync } from "fs";
import { Command } from "commander";
import { StartCMD } from "./command/start";
import { BackFillCMD } from "./command/backfill";
import { WorkerCMD } from "./command/worker";

const program = new Command()
    .name("op-attest")
    .description("OP-Attest use to automatically verify Farcaster accounts on EAS.")
    .version(JSON.parse(readFileSync("./package.json").toString()).version);

program.command("start").description("Starts the op-attest").action(StartCMD.run);
program.command("backfill").description("Backfill the op-attest").action(BackFillCMD.run);
program.command("worker").description("Starts the worker").action(WorkerCMD.run);

program.parse(process.argv);