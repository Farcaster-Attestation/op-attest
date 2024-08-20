import { readFileSync } from "fs";
import { Command } from "commander";
import { StartCMD } from "./command/start";
import { BackFillCMD } from "./command/backfill";
import { WorkerCMD } from "./command/worker";
import { AttestedCMD } from "./command/attested";
import { ChallengeCMD } from "./command/challenge";

const program = new Command()
    .name("op-attest")
    .description("OP-Attest use to automatically verify Farcaster accounts on EAS.")
    .version(JSON.parse(readFileSync("./package.json").toString()).version);

program.command("indexer").description("Starts the indexer of op-attest").action(StartCMD.run);
program.command("backfill").description("Backfill the op-attest").action(BackFillCMD.run);
program.command("worker").description("Starts the worker").action(WorkerCMD.run);
program.command("attested").description("Starts the attested").action(AttestedCMD.run);
program.command("challenge").description("Starts the challenge").action(ChallengeCMD.run);

program.parse(process.argv);