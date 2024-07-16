import { DEFAULT_BYTES_VALUE } from "./constant";
import { log } from "./log";
import { Attestation, EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { EAS_CONTRACT_ADDRESS, MIN_CONFIRMATIONS, NETWORK, PRIVATE_KEY, SCHEMA_UID } from "./env";
import { ethers } from "ethers";
import {
    createPublicClient,
    http,
    PublicClient,
    keccak256,
    encodePacked,
} from "viem";
import { optimismSepolia } from "viem/chains";
import { wagmiContract } from "./contracts/resolver/wagmi.abi";
import { Message, MessageData } from "@farcaster/hub-nodejs";
import { FarcasterVerifyAbi } from "./contracts/farcaster-verify/farcaster.verify.abi";

export class Eas {
    public eas: EAS;
    public schemaEncoder: SchemaEncoder;
    public client: PublicClient;

    constructor() {
        this.eas = new EAS(EAS_CONTRACT_ADDRESS);
        this.schemaEncoder = new SchemaEncoder("uint256 fid,address verifyAddress,uint8 protocol");
        this.client = createPublicClient({
            chain: optimismSepolia,
            transport: http(),
        });
    }

    connect() {
        const provider = ethers.getDefaultProvider(NETWORK);
        const signer = new ethers.Wallet(PRIVATE_KEY??'', provider);
        this.eas.connect(signer);
    }

    async getAttestation(uid: string): Promise<Attestation>{
        return this.eas.getAttestation(uid);
    }

    async attestOnChain(fid: bigint ,address: string, protocol: number) {
        if (!this.eas) {
            throw new Error("EAS is not initialized");
        }

        const encodedData = this.schemaEncoder.encodeData([
            { name: "fid", value: fid, type: "uint256" },
            { name: "verifyAddress", value: address, type: "address" },
            { name: "protocol", value: protocol, type: "uint8" }
        ]);

        const tx = await this.eas.attest({
            schema: SCHEMA_UID,
            data: {
                recipient: address,
                expirationTime: 0n,
                revocable: true,
                data: encodedData
            }
        });

        const newAttestationUID = await tx.wait(MIN_CONFIRMATIONS);
        log.info(`Attestation created: ${newAttestationUID}`);

        return newAttestationUID;
    }

    async revokeAttestation(uid: string) {
        const transaction = await this.eas.revoke({ data: {uid}, schema: SCHEMA_UID});
        await transaction.wait();

        return transaction.receipt?.hash;
    }

    // Check if the FID is attested on chain
    // Returns true if the FID is attested on chain
    // Returns false if the FID is not attested on chain
    async checkFidVerification(fid: bigint, address: string) {
        const key = this.compositeKey(fid, address as `0x${string}`);
        const uid = await this.client.readContract({
            ...wagmiContract,
            functionName: 'fidAttested',
            args: [key],
        });
        const isAttested = uid.toLowerCase() !== DEFAULT_BYTES_VALUE.toLowerCase();
        return {isAttested , uid};
    }

    async verifyAddEthAddress(message: Message) {
        if (!message.data) {
            throw new Error("Message data is empty");
        }
        const messageBytes = (MessageData.encode(message.data).finish());
        const hash = await this.client.readContract({
            ...FarcasterVerifyAbi,
            functionName: "verifyVerificationAddEthAddressBool",
            args: {
                public_key: Buffer.from(message.signer),
                signature_r: Buffer.from(message.signature).subarray(0, 32),
                signature_s: Buffer.from(message.signature).subarray(32),
                message: messageBytes
            }
        });

        log.info(`VerificationAddEthAddressBodyVerified: ${hash}`);
        return hash;
    }

    compositeKey(fid: bigint, address: `0x${string}`) {
        const encodeData = encodePacked(["uint256", "address"],[fid, address])
        return keccak256(encodeData)
    }
}
