import { createPublicClient, createWalletClient, http, nonceManager, PublicClient, WalletClient } from "viem";
import { optimismSepolia } from "viem/chains";
import {
    FARCASTER_OPTIMISTIC_VERIFY_ADDRESS,
    RELAYER_PRIVATE_KEY,
    RESOLVER_ADDRESS,
    RPC_URL,
} from "./env";
import { log } from "./log";
import { resolverAbi } from "./abi/resolver.abi";
import { privateKeyToAccount } from "viem/accounts";
import { FarcasterOptimisticVerifyAbi } from "./abi/farcaster.optimistic.verify.abi";

export class Client {
    static instance: Client;
    public publicClient: PublicClient;
    private walletClient: WalletClient;

    private constructor() {
        this.publicClient = createPublicClient({
            chain: optimismSepolia,
            transport: http(RPC_URL),
        }) as PublicClient;

        this.walletClient = createWalletClient({
            chain: optimismSepolia,
            transport: http(RPC_URL),
        }) as WalletClient;
    }

    static getInstance() {
        if (!Client.instance) {
            Client.instance = new Client();
        }
        return Client.instance;
    }

    // Check if the FID is attested on chain
    // Returns true if the FID is attested on chain
    // Returns false if the FID is not attested on chain
    async checkFidVerification(fid: bigint, address: `0x${string}`) {
        return await this.publicClient.readContract({
            address: RESOLVER_ADDRESS as `0x${string}`,
            abi: resolverAbi,
            functionName: "isVerified",
            args: [fid, address],
        });
    }

    async getAttestationUid(fid: bigint, address: `0x${string}`) {
        return await this.publicClient.readContract({
            address: RESOLVER_ADDRESS as `0x${string}`,
            abi: resolverAbi,
            functionName: "getAttestationUid",
            args: [fid, address],
        });
    }

    async verifyAddEthAddress(
        fid: bigint,
        verifyAddress: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
    ) {
        const isVerified = await this.publicClient.simulateContract({
            address: FARCASTER_OPTIMISTIC_VERIFY_ADDRESS as `0x${string}`,
            abi: FarcasterOptimisticVerifyAbi,
            functionName: "challengeAdd",
            args: [
                fid,
                verifyAddress,
                publicKey,
                signature,
            ],
        });

        log.info(`VerificationAddEthAddressBodyVerified: ${JSON.stringify(isVerified)}`);
        return isVerified;
    }

    async verifyRemoveAddress(
        fid: bigint,
        verifyAddress: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
    ) {
        const isVerified = await this.publicClient.readContract({
            address: FARCASTER_OPTIMISTIC_VERIFY_ADDRESS as `0x${string}`,
            abi: FarcasterOptimisticVerifyAbi,
            functionName: "verifyRemove",
            args: [
                fid,
                verifyAddress,
                publicKey,
                signature,
            ],
        });

        log.info(`VerificationRemoveBodyVerified: ${JSON.stringify(isVerified)}`);
        return isVerified;
    }

    async submitVerifyProof(
        messageType: number,
        fid: bigint,
        verifyAddress: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
    ) {
        const { request } = await this.publicClient.simulateContract({
            address: FARCASTER_OPTIMISTIC_VERIFY_ADDRESS as `0x${string}`,
            abi: FarcasterOptimisticVerifyAbi,
            functionName: "submitVerification",
            args: [
                messageType,
                fid,
                verifyAddress,
                publicKey,
                signature,
            ],
            account: privateKeyToAccount(RELAYER_PRIVATE_KEY as `0x${string}`, { nonceManager }),
        });

        const txHash = await this.walletClient.writeContract(request);

        log.info(`Submitted proof to contract: ${txHash}`);
        return txHash;
    }
}