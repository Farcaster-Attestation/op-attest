import {
    createPublicClient,
    createWalletClient,
    http,
    nonceManager,
    PublicClient,
    WalletClient,
} from "viem";
import { base, optimism, optimismSepolia } from "viem/chains";
import {
    FARCASTER_OPTIMISTIC_VERIFY_ADDRESS, METHOD_VERIFY, NETWORK, PRIVATE_KEY,
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
    private readonly account;
    private readonly gasLimit = 3_000_000n;
    private currentNonce = 0;

    private constructor() {
        let chain;
        switch (NETWORK) {
            case "optimism":
                chain = optimism;
                break;
            case "base":
                chain = base;
                break;
            default:
                chain = optimismSepolia;
        }
        this.publicClient = createPublicClient({
            chain: chain,
            transport: http(RPC_URL),
        }) as PublicClient;

        this.walletClient = createWalletClient({
            chain: chain,
            transport: http(RPC_URL),
        }) as WalletClient;
        this.account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`, { nonceManager });
    }

    static getInstance() {
        if (!Client.instance) {
            Client.instance = new Client();
        }
        return Client.instance;
    }

    /********************************************************************************
     * Resolver client methods for interacting with the Farcaster Resolver contract *
     * ******************************************************************************/

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

    async attest(
        fid: bigint,
        address: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
        methodVerify: number = METHOD_VERIFY
    ) {
        const { request } = await this.publicClient.simulateContract({
            address: RESOLVER_ADDRESS as `0x${string}`,
            abi: resolverAbi,
            functionName: "attest",
            args: [address, fid, publicKey, BigInt(methodVerify), signature],
            account: this.account,
            gas: this.gasLimit,
        });

        const txHash = await this.walletClient.writeContract(request);

        log.warn(`Attested FID: ${txHash}`);
        return txHash;
    }

    async revoke(
        fid: bigint,
        address: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
        methodVerify: number = METHOD_VERIFY
    ) {
        const { request } = await this.publicClient.simulateContract({
            address: RESOLVER_ADDRESS as `0x${string}`,
            abi: resolverAbi,
            functionName: "revoke",
            args: [address, fid, publicKey, BigInt(methodVerify), signature],
            account: this.account,
            gas: this.gasLimit,
        });

        const txHash = await this.walletClient.writeContract(request);

        log.warn(`Revoked FID: ${txHash}`);
        return txHash;
    }

    /*************************************************************************************
     * Wallet client methods for interacting with the farcaster optimistic wallet verify *
     * ***********************************************************************************/

    // verifyAdd returns true if signature is invalid
    // otherwise returns false
    async verifyAdd(
        fid: bigint,
        verifyAddress: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
    ) {
        try {
            const result  = await this.publicClient.readContract({
                address: FARCASTER_OPTIMISTIC_VERIFY_ADDRESS,
                abi: FarcasterOptimisticVerifyAbi,
                functionName: "tryChallengeAdd",
                args: [
                    fid,
                    verifyAddress,
                    publicKey,
                    signature,
                ],
            });

            log.warn(`tryChallengeAdd: ${result}`);
            return result;
        } catch (err) {
            log.error(`tryChallengeAdd error: ${err}`);
            return false;
        }
    }

    // verifyRemove returns true if signature is invalid
    // otherwise returns false
    async verifyRemove(
        fid: bigint,
        verifyAddress: `0x${string}`,
        publicKey: `0x${string}`,
        signature: `0x${string}`,
    ) {
        try {
            const result = await this.publicClient.readContract({
                address: FARCASTER_OPTIMISTIC_VERIFY_ADDRESS,
                abi: FarcasterOptimisticVerifyAbi,
                functionName: "tryChallengeRemove",
                args: [
                    fid,
                    verifyAddress,
                    publicKey,
                    signature,
                ],
            });

            log.warn(`tryChallengeRemove: ${result}`);
            return result;
        } catch (err) {
            log.error(`tryChallengeRemove error: ${err}`);
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
        if (this.currentNonce == 0) {
            this.currentNonce = await this.getNonce(this.account.address);
        }
        try {
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
                account: this.account,
                gas: this.gasLimit,
                nonce: this.currentNonce,
            });

            const txHash = await this.walletClient.writeContract(request);
            log.warn(`Submitted proof to contract: ${txHash}`);
            this.currentNonce++;

            return txHash;
        } catch (err) {
            log.error(`submitVerification error: ${err}`);
            return "0x";
        }
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
            account: this.account,
            gas: this.gasLimit,
        });

        const txHash = await this.walletClient.writeContract(request);

        log.warn(`Submitted proof to contract: ${txHash}`);
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
            account: this.account,
            gas: this.gasLimit,
        });

        const txHash = await this.walletClient.writeContract(request);

        log.warn(`Submitted proof to contract: ${txHash}`);
        return txHash;
    }

    async getNonce(address: `0x${string}`) {
        return await this.publicClient.getTransactionCount({
            address: address,
            blockTag: 'pending'
        });
    }
}