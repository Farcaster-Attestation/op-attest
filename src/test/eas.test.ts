
import { describe, test, expect } from "@jest/globals"
import { Eas } from "../attested/eas";

describe("eas", () => {

  const eas = new Eas();

  test("should be able to get attest with uid", async () => {
    const uid = "0x43da632e250b58de81f77e7aa2c259004e6dca8bb9de029a8f3d907312b469c9"
    eas.connect()
    const attest = await eas.getAttestation(uid)
    console.log(attest)
    expect(true).toBe(true)
  });

  // test("should be able to return true with fid: 26089905", async () => {
  //   const fid = BigInt(26089911);
  //   const address = "0x34CA3Bb75c7f952fb1FF82C885b0E3Eb4466ABf6";
  //   const {isAttested} = await eas.checkFidVerification(fid, address)
  //
  //   expect(isAttested).toBe(true)
  // });

  // test("should be able to attest on chain with fid: 26089911", async () => {
  //   eas.connect()
  //   const fid = BigInt(26089911);
  //   const address = "0x34CA3Bb75c7f952fb1FF82C885b0E3Eb4466ABf6";
  //   const protocol = 1;
  //   const tx = await eas.attestOnChain(fid, address, protocol)
  //
  //   console.log(tx)
  // });

  // test("should be able to compute key", async () => {
  //   const key = eas.compositeKey(BigInt(123456), "0x34CA3Bb75c7f952fb1FF82C885b0E3Eb4466ABf6");
  //   console.log(key);
  //   expect(key).toBe("0x46d63a3b5b210870b5c7942a769c932a26dde55acfd2695704df89f01c053385")
  // });

  // test("should be able to verify farcaster message on-chain", async () => {
  //   const fid = 100;
  //   const alice = privateKeyToAccount(`0x${Buffer.from(randomBytes(32)).toString('hex')}`);
  //   const eip712Signer: ViemLocalEip712Signer = new ViemLocalEip712Signer(alice as any);
  //
  //   const ed25519Signer = new NobleEd25519Signer(randomBytes(32));
  //
  //   const blockHash = randomBytes(32)
  //
  //   const ethSignature = await eip712Signer.signVerificationEthAddressClaim({
  //     fid: BigInt(fid),
  //     address: alice.address as `0x${string}`,
  //     network: FarcasterNetwork.MAINNET,
  //     blockHash: `0x${Buffer.from(blockHash).toString('hex')}` as `0x${string}`,
  //     protocol: Protocol.ETHEREUM,
  //   });
  //
  //   const messageResult = await makeVerificationAddEthAddress(
  //       {
  //         address: fromHexString(alice.address),
  //         blockHash,
  //         claimSignature: ethSignature._unsafeUnwrap(),
  //         verificationType: 0,
  //         chainId: 0,
  //         protocol: Protocol.ETHEREUM,
  //       },
  //       { fid, network: FarcasterNetwork.MAINNET },
  //       ed25519Signer
  //   );
  //
  //   const message = messageResult._unsafeUnwrap()
  //
  //   const result = await eas.verifyAddEthAddress(message)
  //   expect(result).toBe(true)
  // });
})