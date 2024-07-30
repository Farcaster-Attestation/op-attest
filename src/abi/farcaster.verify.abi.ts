export const FarcasterVerifyAbi = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "fid",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "address_",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "eth_signature",
                "type": "bytes"
            },
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "block_hash",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "uint32",
                "name": "verification_type",
                "type": "uint32"
            },
            {
                "indexed": false,
                "internalType": "uint32",
                "name": "chain_id",
                "type": "uint32"
            },
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "protocol",
                "type": "uint8"
            }
        ],
        "name": "VerificationAddEthAddressBodyVerified",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "fid",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "address_",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "protocol",
                "type": "uint8"
            }
        ],
        "name": "VerificationRemoveBodyVerified",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "public_key",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "signature_r",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "signature_s",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "message",
                "type": "bytes"
            }
        ],
        "name": "verifyVerificationAddEthAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "public_key",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "signature_r",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "signature_s",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "message",
                "type": "bytes"
            }
        ],
        "name": "verifyVerificationAddEthAddressBool",
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
                "name": "public_key",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "signature_r",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "signature_s",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "message",
                "type": "bytes"
            }
        ],
        "name": "verifyVerificationRemove",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "public_key",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "signature_r",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "signature_s",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "message",
                "type": "bytes"
            }
        ],
        "name": "verifyVerificationRemoveBool",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    }
];