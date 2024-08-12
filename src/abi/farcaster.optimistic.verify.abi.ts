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
                "name": "admin",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "AccessControlBadConfirmation",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "neededRole",
                "type": "bytes32"
            }
        ],
        "name": "AccessControlUnauthorizedAccount",
        "type": "error"
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
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "previousAdminRole",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "newAdminRole",
                "type": "bytes32"
            }
        ],
        "name": "RoleAdminChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            }
        ],
        "name": "RoleGranted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            }
        ],
        "name": "RoleRevoked",
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
        "inputs": [],
        "name": "DEFAULT_ADMIN_ROLE",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "RELAYER_ROLE",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "SECURITY_ROLE",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
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
                "internalType": "address",
                "name": "relayer",
                "type": "address"
            }
        ],
        "name": "disableRelayer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            }
        ],
        "name": "getRoleAdmin",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "grantRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "hasRole",
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
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "callerConfirmation",
                "type": "address"
            }
        ],
        "name": "renounceRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "revokeRole",
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
                "internalType": "bytes4",
                "name": "interfaceId",
                "type": "bytes4"
            }
        ],
        "name": "supportsInterface",
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
        "name": "tryChallengeAdd",
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
        "name": "tryChallengeRemove",
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