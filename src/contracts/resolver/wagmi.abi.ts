export const wagmiContract = {
    address: "0x856448575812346458bCdE68eB6F1a03e74DC743",
    abi: [
        {
            "inputs": [
                {
                    "internalType": "contract IEAS",
                    "name": "eas",
                    "type": "address"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [],
            "name": "AccessDenied",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "InsufficientValue",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "InvalidEAS",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "InvalidLength",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "NotPayable",
            "type": "error"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "bytes32",
                            "name": "uid",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "schema",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "time",
                            "type": "uint64"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expirationTime",
                            "type": "uint64"
                        },
                        {
                            "internalType": "uint64",
                            "name": "revocationTime",
                            "type": "uint64"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "refUID",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "address",
                            "name": "recipient",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "attester",
                            "type": "address"
                        },
                        {
                            "internalType": "bool",
                            "name": "revocable",
                            "type": "bool"
                        },
                        {
                            "internalType": "bytes",
                            "name": "data",
                            "type": "bytes"
                        }
                    ],
                    "internalType": "struct Attestation",
                    "name": "attestation",
                    "type": "tuple"
                }
            ],
            "name": "attest",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_fid",
                    "type": "uint256"
                },
                {
                    "internalType": "address",
                    "name": "_verifyAddr",
                    "type": "address"
                }
            ],
            "name": "computeKey",
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
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "name": "fidAttested",
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
            "name": "isPayable",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "pure",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "bytes32",
                            "name": "uid",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "schema",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "time",
                            "type": "uint64"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expirationTime",
                            "type": "uint64"
                        },
                        {
                            "internalType": "uint64",
                            "name": "revocationTime",
                            "type": "uint64"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "refUID",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "address",
                            "name": "recipient",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "attester",
                            "type": "address"
                        },
                        {
                            "internalType": "bool",
                            "name": "revocable",
                            "type": "bool"
                        },
                        {
                            "internalType": "bytes",
                            "name": "data",
                            "type": "bytes"
                        }
                    ],
                    "internalType": "struct Attestation[]",
                    "name": "attestations",
                    "type": "tuple[]"
                },
                {
                    "internalType": "uint256[]",
                    "name": "values",
                    "type": "uint256[]"
                }
            ],
            "name": "multiAttest",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "bytes32",
                            "name": "uid",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "schema",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "time",
                            "type": "uint64"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expirationTime",
                            "type": "uint64"
                        },
                        {
                            "internalType": "uint64",
                            "name": "revocationTime",
                            "type": "uint64"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "refUID",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "address",
                            "name": "recipient",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "attester",
                            "type": "address"
                        },
                        {
                            "internalType": "bool",
                            "name": "revocable",
                            "type": "bool"
                        },
                        {
                            "internalType": "bytes",
                            "name": "data",
                            "type": "bytes"
                        }
                    ],
                    "internalType": "struct Attestation[]",
                    "name": "attestations",
                    "type": "tuple[]"
                },
                {
                    "internalType": "uint256[]",
                    "name": "values",
                    "type": "uint256[]"
                }
            ],
            "name": "multiRevoke",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "bytes32",
                            "name": "uid",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "schema",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "uint64",
                            "name": "time",
                            "type": "uint64"
                        },
                        {
                            "internalType": "uint64",
                            "name": "expirationTime",
                            "type": "uint64"
                        },
                        {
                            "internalType": "uint64",
                            "name": "revocationTime",
                            "type": "uint64"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "refUID",
                            "type": "bytes32"
                        },
                        {
                            "internalType": "address",
                            "name": "recipient",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "attester",
                            "type": "address"
                        },
                        {
                            "internalType": "bool",
                            "name": "revocable",
                            "type": "bool"
                        },
                        {
                            "internalType": "bytes",
                            "name": "data",
                            "type": "bytes"
                        }
                    ],
                    "internalType": "struct Attestation",
                    "name": "attestation",
                    "type": "tuple"
                }
            ],
            "name": "revoke",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "version",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "stateMutability": "payable",
            "type": "receive"
        }
    ],
} as const