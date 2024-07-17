export const fromHexString = (hexString: `0x${string}`) =>
    Uint8Array.from((hexString.substring(2).match(/.{1,2}/g)!).map((byte) => parseInt(byte, 16)));