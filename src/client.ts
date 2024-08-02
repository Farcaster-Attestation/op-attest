import { createPublicClient, createWalletClient, http, nonceManager, PublicClient, WalletClient } from "viem";
import { optimismSepolia } from "viem/chains";
import {
    FARCASTER_OPTIMISTIC_VERIFY_ADDRESS, PRIVATE_KEY,
    RESOLVER_ADDRESS,
    RPC_URL,
} from "./env";
import { log } from "./log";
import { resolverAbi } from "./abi/resolver.abi";
import { privateKeyToAccount } from "viem/accounts";
import { FarcasterOptimisticVerifyAbi } from "./abi/farcaster.optimistic.verify.abi";

export class Client {
    private static instance: Client;
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

    async simulateChallengeAdd(
        fid: bigint,
        verifyAddress: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
    ) {
        try {
            const { request } = await this.publicClient.simulateContract({
                address: FARCASTER_OPTIMISTIC_VERIFY_ADDRESS,
                abi: FarcasterOptimisticVerifyAbi,
                functionName: "challengeAdd",
                args: [
                    fid,
                    verifyAddress,
                    publicKey,
                    signature,
                ],
            });

            log.info(`simulateChallengeAdd: ${JSON.stringify(request)}`);
            return true;
        } catch (error) {
            log.error(error);
            return false;
        }
    }

    async simulateChallengeRemove(
        fid: bigint,
        verifyAddress: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
    ) {
        try {
            const { request } = await this.publicClient.simulateContract({
                address: FARCASTER_OPTIMISTIC_VERIFY_ADDRESS,
                abi: FarcasterOptimisticVerifyAbi,
                functionName: "challengeRemove",
                args: [
                    fid,
                    verifyAddress,
                    publicKey,
                    signature,
                ],
            });

            log.info(`simulateChallengeRemove: ${JSON.stringify(request)}`);
            return true;
        } catch (error) {
            log.error(error);
            return false;
        }
    }

    async submitVerifyProof(
        messageType: number,
        fid: bigint,
        verifyAddress: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
    ) {
        const { request } = await this.publicClient.simulateContract({
            address: FARCASTER_OPTIMISTIC_VERIFY_ADDRESS,
            abi: FarcasterOptimisticVerifyAbi,
            functionName: "submitVerification",
            args: [
                messageType,
                fid,
                verifyAddress,
                publicKey,
                signature,
            ],
            account: privateKeyToAccount(PRIVATE_KEY as `0x${string}`, { nonceManager }),
        });

        const txHash = await this.walletClient.writeContract(request);

        log.info(`Submitted proof to contract: ${txHash}`);
        return txHash;
    }

    async challengeAdd(
        fid: bigint,
        verifyAddress: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
    ) {
        const { request } = await this.publicClient.simulateContract({
            address: FARCASTER_OPTIMISTIC_VERIFY_ADDRESS,
            abi: FarcasterOptimisticVerifyAbi,
            functionName: "challengeAdd",
            args: [
                fid,
                verifyAddress,
                publicKey,
                signature,
            ],
            account: privateKeyToAccount(PRIVATE_KEY as `0x${string}`, { nonceManager }),
        });

        const txHash = await this.walletClient.writeContract(request);

        log.info(`Submitted proof to contract: ${txHash}`);
        return txHash;
    }

    async challengeRemove(
        fid: bigint,
        verifyAddress: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
    ) {
        const { request } = await this.publicClient.simulateContract({
            address: FARCASTER_OPTIMISTIC_VERIFY_ADDRESS,
            abi: FarcasterOptimisticVerifyAbi,
            functionName: "challengeRemove",
            args: [
                fid,
                verifyAddress,
                publicKey,
                signature,
            ],
            account: privateKeyToAccount(PRIVATE_KEY as `0x${string}`, { nonceManager }),
        });

        const txHash = await this.walletClient.writeContract(request);

        log.info(`Submitted proof to contract: ${txHash}`);
        return txHash;
    }
}