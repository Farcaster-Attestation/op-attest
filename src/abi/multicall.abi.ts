export const multicallABI = [
    {
        "type": "function",
        "name": "multicall",
        "inputs": [
            {
                "name": "data",
                "type": "bytes[]",
                "internalType": "bytes[]",
            },
        ],
        "outputs": [
            {
                "name": "results",
                "type": "bytes[]",
                "internalType": "bytes[]",
            },
        ],
        "stateMutability": "nonpayable",
    }
];