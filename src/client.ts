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
    RPC_URL, RESOLVER_ADDRESS,
} from "./env";
import { log } from "./log";
import { resolverAbi } from "./abi/resolver.abi";
import { privateKeyToAccount } from "viem/accounts";
import { FarcasterOptimisticVerifyAbi } from "./abi/farcaster.optimistic.verify.abi";
import { multicallABI } from "./abi/multicall.abi";

export class Client {
    private static instance: Client;
    public publicClient: PublicClient;
    private walletClient: WalletClient;
    private readonly account;
    private readonly gasLimit = 5_000_000n;
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

        log.info(`Attested FID: ${txHash}`);
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

        log.info(`Revoked FID: ${txHash}`);
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

            log.info(`tryChallengeAdd: ${result}`);
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

            log.info(`tryChallengeRemove: ${result}`);
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
                nonce: this.currentNonce++,
            });

            const txHash = await this.walletClient.writeContract(request);
            await this.waitForTransaction(txHash);

            log.info(`Submitted proof to contract: ${txHash}`);

            return txHash;
        } catch (err) {
            this.currentNonce = 0;
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
            account: this.account,
            gas: this.gasLimit,
        });

        const txHash = await this.walletClient.writeContract(request);

        log.info(`Submitted proof to contract: ${txHash}`);
        return txHash;
    }

    async getNonce(address: `0x${string}`) {
        return await this.publicClient.getTransactionCount({
            address: address,
        });
    }

    async waitForTransaction(txHash: `0x${string}`) {
        return await this.publicClient.waitForTransactionReceipt({
            hash: txHash,
            timeout: 10000,
        });
    }

    async multicallSubmitProof(data: `0x${string}`[]) {
        if (this.currentNonce == 0) {
            this.currentNonce = await this.getNonce(this.account.address);
        }
        try {
            const { request } = await this.publicClient.simulateContract({
                address: FARCASTER_OPTIMISTIC_VERIFY_ADDRESS,
                abi: multicallABI,
                functionName: "multicall",
                args: [data],
                account: this.account,
                gas: this.gasLimit,
                nonce: this.currentNonce++,
            });

            const txHash = await this.walletClient.writeContract(request);
            await this.waitForTransaction(txHash);

            log.info(`Submitted batch proof to contract: ${txHash}`);
            return txHash;
        } catch (err) {
            this.currentNonce = 0;
            log.error(`multicallSubmitProof error: ${err}`);
            return "0x";
        }
    }

    async multicallAttest(data: `0x${string}`[]) {
        try {
            const { request } = await this.publicClient.simulateContract({
                address: RESOLVER_ADDRESS as `0x${string}`,
                abi: multicallABI,
                functionName: "multicall",
                args: [data],
                account: this.account,
                gas: this.gasLimit,
            });

            const txHash = await this.walletClient.writeContract(request);

            log.info(`Attest - Revoke batch proof to contract: ${txHash}`);
            return txHash;
        } catch (err) {
            log.error(`multicallAttest error: ${err}`);
            return "0x";
        }
    }

    async getL1L2GasFees() {
        const L1_GAS_PRICE_ORACLE = "0x420000000000000000000000000000000000000F"; // Optimism Gas Oracle

        // Get L1 Base Fee
        const l1BaseFee = await this.publicClient.readContract({
            address: L1_GAS_PRICE_ORACLE,
            abi: [{
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "_unsignedTxSize",
                        "type": "uint256"
                    }
                ],
                "name": "getL1FeeUpperBound",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }],
            functionName: "getL1FeeUpperBound",
            args: [BigInt(1)], // measure 1 byte
        });

        // Get L2 Gas Price
        const l2GasPrice = await this.publicClient.getGasPrice();

        return { l1BaseFee, l2GasPrice };
    }
}