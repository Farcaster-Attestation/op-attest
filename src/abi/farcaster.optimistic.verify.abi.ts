export const FarcasterOptimisticVerifyAbi = [
    {
        "inputs": [
            {
                "internalType": "contract IFarcasterWalletVerifier",
                "name": "verifier",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "relayer",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "ChallengeFailed",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "enum MessageType",
                "name": "messageType",
                "type": "uint8"
            }
        ],
        "name": "InvalidMessageType",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "enum MessageType",
                "name": "messageType",
                "type": "uint8"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "fid",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "verifyAddress",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "publicKey",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "hash",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            }
        ],
        "name": "Challenged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "enum MessageType",
                "name": "messageType",
                "type": "uint8"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "fid",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "verifyAddress",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "publicKey",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "hash",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            }
        ],
        "name": "SubmitVerification",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "fid",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "verifyAddress",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "publicKey",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            }
        ],
        "name": "challengeAdd",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "fid",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "verifyAddress",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "publicKey",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            }
        ],
        "name": "challengeRemove",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "challengingPeriod",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "enum MessageType",
                "name": "messageType",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "fid",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "verifyAddress",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "publicKey",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            }
        ],
        "name": "hash",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "onchainVerifier",
        "outputs": [
            {
                "internalType": "contract IFarcasterWalletVerifier",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "enum MessageType",
                "name": "messageType",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "fid",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "verifyAddress",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "publicKey",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            }
        ],
        "name": "submitVerification",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "verificationTimestamp",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "fid",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "verifyAddress",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "publicKey",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            }
        ],
        "name": "verifyAdd",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "fid",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "verifyAddress",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "publicKey",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            }
        ],
        "name": "verifyRemove",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;