import { fromFarcasterTime, Message, Protocol } from "@farcaster/hub-nodejs";
import { QueueData } from "./queue/queue.data";
import { MessageData, MessageType } from "@farcaster/core";
import { encodeAbiParameters, encodePacked, keccak256, parseAbiParameters } from "viem";
import { log } from "./log";

export type DataQuery = {
    id: string;
    fid: number;
    type: MessageType;
    raw: Uint8Array;
}

export type InputData = {
    id: string;
    type: MessageType;
    fid: bigint;
    address: `0x${string}`;
    publicKey: `0x${string}`;
    signature: `0x${string}`;
}

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

export function transformQueueData(message: Message): QueueData {
    if (!message.data) throw new Error("Message data is missing");
    const messageBytes = MessageData.encode(message.data).finish();

    return {
        messageDataHex: `0x${Buffer.from(messageBytes).toString("hex")}` as `0x${string}`,
        signatureR: `0x${Buffer.from(message.signature).subarray(0, 32).toString("hex")}` as `0x${string}`,
        signatureS: `0x${Buffer.from(message.signature).subarray(32).toString("hex")}` as `0x${string}`,
        publicKey: `0x${Buffer.from(message.signer).toString("hex")}` as `0x${string}`,
    };
}

export function compositeKey(fid: bigint, address: `0x${string}`) {
    const encodeData = encodePacked(["uint256", "address"], [fid, address]);
    return keccak256(encodeData);
}

export function transformData(data: DataQuery[]) {
    const inputData: InputData[] = [];
    for (const { id, fid, type, raw } of data) {
        const message = Message.decode(raw);
        if (!message) {
            log.error(`invalid message: ${fid} - ${type} - ${raw}`);
            continue;
        }

        const queueData = parseMsg(message);
        const signature = encodeAbiParameters(
            parseAbiParameters("bytes32 signature_r, bytes32 signature_s, bytes message"),
            [queueData.signatureR, queueData.signatureS, queueData.messageDataHex],
        );

        switch (type) {
            case 7:
                if (!message.data ||
                    !message.data.verificationAddAddressBody ||
                    message.data.verificationAddAddressBody.protocol !== Protocol.ETHEREUM) {
                    log.info(`Not Ethereum`);
                    continue;
                }

                if (message.data.verificationAddAddressBody.chainId === 0 ||
                    message.data.verificationAddAddressBody.chainId === 10
                ) {
                    const { address } = message.data.verificationAddAddressBody;
                    const addressHex = "0x" + Buffer.from(address).toString("hex") as `0x${string}`;
                    inputData.push({
                        id,
                        type: 7,
                        fid: BigInt(fid),
                        address: addressHex,
                        publicKey: queueData.publicKey,
                        signature,
                    });
                } else {
                    log.info(`invalid chainId: ${message.data.verificationAddAddressBody.chainId}`);
                }
                break;
            case 8:
                if (!message.data || !message.data.verificationRemoveBody) {
                    log.info(`Missing Remove Body`);
                    continue;
                }

                if (message.data.verificationRemoveBody.protocol === Protocol.ETHEREUM) {
                    const { address } = message.data.verificationRemoveBody;
                    const addressHex = "0x" + Buffer.from(address).toString("hex") as `0x${string}`;
                    inputData.push({
                        id,
                        type: 8,
                        fid: BigInt(fid),
                        address: addressHex,
                        publicKey: queueData.publicKey,
                        signature,
                    });
                } else {
                    log.info(`Not Ethereum`);
                }
                break;
            default:
                log.error(`invalid message type: ${fid} - ${type}`);
        }
    }
    return inputData;
}

export function parseMsg(message: Message): QueueData {
    if (!message.data) throw new Error("Message data is missing");
    const messageBytes = MessageData.encode(message.data).finish();

    return {
        messageDataHex: `0x${Buffer.from(messageBytes).toString("hex")}` as `0x${string}`,
        signatureR: `0x${Buffer.from(message.signature).subarray(0, 32).toString("hex")}` as `0x${string}`,
        signatureS: `0x${Buffer.from(message.signature).subarray(32).toString("hex")}` as `0x${string}`,
        publicKey: `0x${Buffer.from(message.signer).toString("hex")}` as `0x${string}`,
    };
}

export function print(data: unknown[]) {
    const jsonString = JSON.stringify(data, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
    );
    log.info(`Show results: ${jsonString}`);
}