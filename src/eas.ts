import EventEmitter2 from "eventemitter2";
import { DEFAULT_BYTES_VALUE, VERIFICATION_CREATED_EVENT, VERIFICATION_DELETED_EVENT } from "./constant";
import { Message } from "@farcaster/hub-nodejs";
import { log } from "./log";
import { Attestation, EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { EAS_CONTRACT_ADDRESS, MIN_CONFIRMATIONS, NETWORK, PRIVATE_KEY, SCHEMA_UID } from "./env";
import { ethers } from "ethers";
import {
    createPublicClient,
    http,
    PublicClient,
    bytesToHex,
    keccak256,
    encodePacked,
} from "viem";
import { optimismSepolia } from "viem/chains";
import { wagmiContract } from "./contracts/resolver/wagmi.abi";

export class Eas {
    public emitter: EventEmitter2;
    public eas: EAS;
    public schemaEncoder: SchemaEncoder;
    public client: PublicClient;

    constructor(emitter: EventEmitter2, eas: EAS, schemaEncoder: SchemaEncoder) {
        this.eas = eas;
        this.emitter = emitter;
        this.schemaEncoder = schemaEncoder;
        this.client = createPublicClient({
            chain: optimismSepolia,
            transport: http(),
        });
    }

    static create(emitter: EventEmitter2) {
        const eas = new EAS(EAS_CONTRACT_ADDRESS);
        const schemaEncoder = new SchemaEncoder("uint256 fid,address verifyAddress,uint8 protocol");

        return new Eas(emitter, eas, schemaEncoder);
    }

    async connect() {
        const provider = ethers.getDefaultProvider(NETWORK);
        const signer = new ethers.Wallet(PRIVATE_KEY??'', provider);
        this.eas.connect(signer);
    }

    async handleEvent() {
        this.emitter.on(VERIFICATION_CREATED_EVENT, async (message: Message) => {
            log.info(`${VERIFICATION_CREATED_EVENT} data: ${JSON.stringify(message)}`);
            if (!message.data) return;
            if (!message.data.verificationAddAddressBody) return;
            if (message.data.verificationAddAddressBody.protocol !== 0) return;

            log.info(`Attesting farcaster for fid: ${message.data.fid}`);
            log.info(`Attesting farcaster for address: ${bytesToHex(message.data.verificationAddAddressBody.address)}`);

            const {isAttested} = await this.checkFidVerification(
                BigInt(message.data.fid),
                bytesToHex(message.data.verificationAddAddressBody.address)
            );
            if (isAttested) {
                log.error(`Farcaster was attested for fid: ${message.data.fid}`);
                return;
            }

            const tx = await this.attestOnChain(
                BigInt(message.data.fid),
                bytesToHex(message.data.verificationAddAddressBody.address),
                message.data.verificationAddAddressBody.protocol
            );

            log.info(`Attestation tx: ${tx}`);
        });

        this.emitter.on(VERIFICATION_DELETED_EVENT, async (message: Message) => {
            log.info(`${VERIFICATION_DELETED_EVENT} data: ${JSON.stringify(message)}`);
            if (!message.data) return;
            if (!message.data.verificationRemoveBody) return;
            if (message.data.verificationRemoveBody.protocol !== 0) return;

            const {isAttested, uid } = await this.checkFidVerification(BigInt(message.data.fid), bytesToHex(message.data.verificationRemoveBody.address));
            if (!isAttested) {
                log.error(`Farcaster was not attested for fid - address: ${message.data.fid} - ${bytesToHex(message.data.verificationRemoveBody.address)}`);
                return;
            }

            const tx = this.revokeAttestation(uid);
            log.info(`Revoke attestation tx: ${tx}`);
        });
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

    compositeKey(fid: bigint, address: `0x${string}`) {
        const encodeData = encodePacked(["uint256", "address"],[fid, address])
        return keccak256(encodeData)
    }
}
