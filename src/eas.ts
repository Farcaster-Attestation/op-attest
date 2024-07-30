import { log } from "./log";
import { Attestation, EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import {
    EAS_CONTRACT_ADDRESS,
    METHOD_VERIFY,
    MIN_CONFIRMATIONS,
    NETWORK,
    PRIVATE_KEY,
    RPC_URL,
    SCHEMA_UID,
} from "./env";
import { ethers } from "ethers";
import {
    createPublicClient,
    http,
    PublicClient,

} from "viem";
import { optimismSepolia } from "viem/chains";

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
}
