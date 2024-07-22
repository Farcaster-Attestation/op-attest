import { fromFarcasterTime, Message } from "@farcaster/hub-nodejs";
import { EasQueueData } from "./queue/eas.queue.data";
import { MessageData } from "@farcaster/core";

export function farcasterTimeToDate(time: number): Date;
export function farcasterTimeToDate(time: null): null;
export function farcasterTimeToDate(time: undefined): undefined;
export function farcasterTimeToDate(time: number | null | undefined): Date | null | undefined {
    if (time === undefined) return undefined;
    if (time === null) return null;
    const result = fromFarcasterTime(time);
    if (result.isErr()) throw result.error;
    return new Date(result.value);
}

export function transformQueueData(message: Message): EasQueueData {
    if (!message.data) throw new Error("Message data is missing");
    const messageBytes = MessageData.encode(message.data).finish();

    return {
        messageDataHex: `0x${Buffer.from(messageBytes).toString("hex")}` as `0x${string}`,
        signatureR: `0x${Buffer.from(message.signature).subarray(0, 32).toString("hex")}` as `0x${string}`,
        signatureS: `0x${Buffer.from(message.signature).subarray(32).toString("hex")}` as `0x${string}`,
        publicKey: `0x${Buffer.from(message.signer).toString("hex")}` as `0x${string}`,
    };
}