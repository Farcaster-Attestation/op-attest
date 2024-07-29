import { DEFAULT_BYTES_VALUE } from "./constant";
import { log } from "./log";
import { Attestation, EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import {
    EAS_CONTRACT_ADDRESS,
    FARCASTER_VERIFY_ADDRESS, METHOD_VERIFY,
    MIN_CONFIRMATIONS,
    NETWORK,
    PRIVATE_KEY,
    RESOLVER_ADDRESS, RPC_URL,
    SCHEMA_UID,
} from "./env";
import { ethers } from "ethers";
import {
    createPublicClient,
    http,
    PublicClient,
    keccak256,
    encodePacked,
} from "viem";
import { optimismSepolia } from "viem/chains";
import { resolverContractAbi } from "./contracts/resolver/wagmi.abi";
import { FarcasterVerifyAbi } from "./contracts/farcaster-verify/farcaster.verify.abi";
import { EasQueueData } from "./queue/eas.queue.data";

export class Eas {
    public eas: EAS;
    public schemaEncoder: SchemaEncoder;
    public client: PublicClient;

    constructor() {
        this.eas = new EAS(EAS_CONTRACT_ADDRESS);
        this.schemaEncoder = new SchemaEncoder("uint256 fid,bytes32 publicKey,uint256 verificationMethod,bytes memory signature");
        this.client = createPublicClient({
            chain: optimismSepolia,
            transport: http(RPC_URL),
        }) as PublicClient;
    }

    connect() {
        // const provider = ethers.getDefaultProvider(NETWORK);
        const provider = new ethers.JsonRpcProvider(RPC_URL, NETWORK);
        const signer = new ethers.Wallet(PRIVATE_KEY ?? "", provider);
        this.eas.connect(signer);
    }

    async getAttestation(uid: string): Promise<Attestation> {
        return this.eas.getAttestation(uid);
    }

    async attestOnChain(fid: bigint, address: string, publicKey: `0x${string}`, signature: `0x${string}`) {
        if (!this.eas) {
            throw new Error("EAS is not initialized");
        }

        const encodedData = this.schemaEncoder.encodeData([
            { name: "fid", value: fid, type: "uint256" },
            { name: "publicKey", value: publicKey, type: "bytes32" },
            { name: "verificationMethod", value: METHOD_VERIFY, type: "uint256" },
            { name: "signature", value: signature, type: "bytes" },
        ]);

        const tx = await this.eas.attest({
            schema: SCHEMA_UID,
            data: {
                recipient: address,
                expirationTime: 0n,
                revocable: true,
                data: encodedData,
            },
        });

        const newAttestationUID = await tx.wait(MIN_CONFIRMATIONS);
        log.info(`Attestation created: ${newAttestationUID}`);

        return newAttestationUID;
    }

    async revokeAttestation(uid: string) {
        const transaction = await this.eas.revoke({ data: { uid }, schema: SCHEMA_UID });
        await transaction.wait();

        return transaction.receipt?.hash;
    }

    // Check if the FID is attested on chain
    // Returns true if the FID is attested on chain
    // Returns false if the FID is not attested on chain
    async checkFidVerification(fid: bigint, address: string) {
        const key = this.compositeKey(fid, address as `0x${string}`);
        const uid = await this.client.readContract({
            address: RESOLVER_ADDRESS as `0x${string}`,
            abi: resolverContractAbi,
            functionName: "uid",
            args: [key],
        });
        const isAttested = uid.toLowerCase() !== DEFAULT_BYTES_VALUE.toLowerCase();
        return { isAttested, uid };
    }

    async verifyAddEthAddress(queueData: EasQueueData) {
        const isVerified = await this.client.readContract({
            address: FARCASTER_VERIFY_ADDRESS as `0x${string}`,
            abi: FarcasterVerifyAbi.abi,
            functionName: "verifyVerificationAddEthAddressBool",
            args: [
                queueData.publicKey,
                queueData.signatureR,
                queueData.signatureS,
                queueData.messageDataHex,
            ],
        });

        log.info(`VerificationAddEthAddressBodyVerified: ${JSON.stringify(isVerified)}`);
        return isVerified;
    }

    async verifyRemoveAddress(queueData: EasQueueData) {
        const isVerified =  await this.client.readContract({
            address: FARCASTER_VERIFY_ADDRESS as `0x${string}`,
            abi: FarcasterVerifyAbi.abi,
            functionName: "verifyVerificationRemoveBool",
            args: [
                queueData.publicKey,
                queueData.signatureR,
                queueData.signatureS,
                queueData.messageDataHex,
            ],
        });

        log.info(`VerificationRemoveBodyVerified: ${JSON.stringify(isVerified)}`);
        return isVerified;
    }

    compositeKey(fid: bigint, address: `0x${string}`) {
        const encodeData = encodePacked(["uint256", "address"], [fid, address]);
        return keccak256(encodeData);
    }
}
