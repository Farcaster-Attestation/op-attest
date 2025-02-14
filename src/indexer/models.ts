import { Generated, Kysely } from "kysely";
import { Fid } from "@farcaster/shuttle";
import { HubTables, MessageBodyJson } from "@farcaster/hub-shuttle";
import { HashScheme, MessageType, SignatureScheme } from "@farcaster/core";

export type VerificationRow = {
    id: Generated<string>;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
    deletedAt: Date | null;
    timestamp: Date;
    fid: Fid;
    hash: Uint8Array;
    address: Uint8Array;
    blockHash: Uint8Array | null;
    verificationType: number;
    chainId: number;
    protocol: number;

};

export type VerifyProofRow = {
    id: Generated<string>;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
    deletedAt: Date | null;
    fid: Fid;
    messageType: number;
    verifyMethod: number;
    verifyAddress: string;
    publicKey: string;
    txHash: string;
    signature: string;
    blockNumber: bigint | null;
    status: string;
}

export type SyncHeadRow = {
    network: string;
    head: bigint;
};

export type MessagesCustomTable = {
    id: Generated<string>;
    fid: number;
    type: MessageType;
    timestamp: Date;
    hashScheme: HashScheme;
    signatureScheme: SignatureScheme;
    hash: Uint8Array;
    signer: Uint8Array;
    raw: Uint8Array;
    body: MessageBodyJson;
    deletedAt: Date | null;
    revokedAt: Date | null;
    prunedAt: Date | null;
    status: number;
    submitTxHash: string | null;
    submitBlockNumber: bigint;
    attestTxHash: string | null;
};

export interface Tables extends HubTables {
    verifications: VerificationRow;
    verifyProofs: VerifyProofRow;
    syncHeads: SyncHeadRow;
    messages: MessagesCustomTable;
}

export type AppDb = Kysely<Tables>;