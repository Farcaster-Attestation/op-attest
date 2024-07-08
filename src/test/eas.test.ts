
import { describe, test, expect } from "@jest/globals"
import EventEmitter2 from "eventemitter2";
import { Eas } from "../eas";

describe("eas", () => {

  const emitter = new EventEmitter2();
  const eas = Eas.create(emitter);

  test("should be able to get attest with uid", async () => {
    const uid = "0x43da632e250b58de81f77e7aa2c259004e6dca8bb9de029a8f3d907312b469c9"
    await eas.connect()
    const attest = await eas.getAttestation(uid)
    console.log(attest)
    expect(true).toBe(true)
  });

  test("should be able to return true with fid: 26089905", async () => {
    const fid = BigInt(26089905);
    const address = "0x34CA3Bb75c7f952fb1FF82C885b0E3Eb4466ABf6";
    const isAttested = await eas.checkFidVerification(fid, address)

    expect(isAttested).toBe(true)
  });

  test("should be able to attest on chain with fid: 26089911", async () => {
    await eas.connect()
    const fid = BigInt(26089911);
    const address = "0x34CA3Bb75c7f952fb1FF82C885b0E3Eb4466ABf6";
    const protocol = 1;
    const tx = await eas.attestOnChain(fid, address, protocol)

    console.log(tx)
  });
})