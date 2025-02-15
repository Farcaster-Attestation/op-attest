import { readFileSync } from "fs";
import { Command } from "commander";
import { BackFillCMD } from "./command/backfill";
import { WorkerCMD } from "./command/worker";
import { AttestedCMD } from "./command/attested";
import { ChallengeCMD } from "./command/challenge";
import { IndexerCMD } from "./command/indexer";
import { SubmitterCMD } from "./command/submitter";

const program = new Command()
    .name("op-attest")
    .description("OP-Attest use to automatically verify Farcaster accounts on EAS.")
    .version(JSON.parse(readFileSync("./package.json").toString()).version);

program.command("indexer").description("Starts the indexer of op-attest").action(IndexerCMD.run);
program.command("backfill").description("Backfill the op-attest").action(BackFillCMD.run);
program.command("worker").description("Starts the worker").action(WorkerCMD.run);
program.command("attested").description("Starts the attested").action(AttestedCMD.run);
program.command("challenge").description("Starts the challenge").action(ChallengeCMD.run);
program.command("submitter").description("Starts the submitter").action(SubmitterCMD.run);

program.parse(process.argv);