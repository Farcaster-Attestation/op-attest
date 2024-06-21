import { readFileSync } from "fs";
import { Command } from "commander";
import { StartCMD } from "./command/start";

const program = new Command()
    .name("op-attest")
    .description("OP-Attest use to automatically verify Farcaster accounts on EAS.")
    .version(JSON.parse(readFileSync("./package.json").toString()).version);

program.command("start").description("Starts the shuttle").action(StartCMD.run);

program.parse(process.argv);