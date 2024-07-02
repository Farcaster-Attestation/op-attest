import EventEmitter2 from "eventemitter2";
import { VERIFICATION_CREATED_EVENT, VERIFICATION_DELETED_EVENT } from "./constant";
import { Message } from "@farcaster/hub-nodejs";
import { log } from "./log";
import { Attestation, EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { EAS_CONTRACT_ADDRESS, NETWORK, PRIVATE_KEY, SCHEMA_UID } from "./env";
import { ethers } from 'ethers';

export class Eas {
    public emitter: EventEmitter2;
    public eas: EAS;
    public schemaEncoder: SchemaEncoder;

    constructor(emitter: EventEmitter2, eas: EAS, schemaEncoder: SchemaEncoder) {
        this.eas = eas;
        this.emitter = emitter;
        this.schemaEncoder = schemaEncoder;
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
        this.emitter.on(VERIFICATION_CREATED_EVENT, (data: Message) => {
            log.info(`${VERIFICATION_CREATED_EVENT} data: ${JSON.stringify(data)}`);
        });

        this.emitter.on(VERIFICATION_DELETED_EVENT, (data: Message) => {
            log.info(`${VERIFICATION_DELETED_EVENT} data: ${JSON.stringify(data)}`);
        });
    }

    async getAttestation(uid: string): Promise<Attestation>{
        return this.eas.getAttestation(uid);
    }

    async attestOnChain(fid: string ,address: string, protocol: number) {
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

        const newAttestationUID = await tx.wait();
        log.info(`Attestation created: ${newAttestationUID}`);

        return newAttestationUID;
    }

    async revokeAttestation(uid: string) {
        const transaction = await this.eas.revoke({ data: {uid}, schema: SCHEMA_UID});
        await transaction.wait();

        return transaction.receipt?.hash;
    }
}
