import { Generated, Kysely } from "kysely";
import { Fid } from "@farcaster/shuttle";
import { HubTables } from "@farcaster/hub-shuttle";

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

export interface Tables extends HubTables {
    verifications: VerificationRow;
    verifyProofs: VerifyProofRow;
    syncHeads: SyncHeadRow;
}

export type AppDb = Kysely<Tables>;