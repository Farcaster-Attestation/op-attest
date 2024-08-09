export interface QueueData {
    messageDataHex: `0x${string}`;
    signatureR: `0x${string}`;
    signatureS: `0x${string}`;
    publicKey: `0x${string}`;
}
export interface EASQueueData {
    publicKey: `0x${string}`;
    messageType: number;
    fid: string;
    verifyAddress: `0x${string}`;
    signature: `0x${string}`;
    verifyMethod: number;
}