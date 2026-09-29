export const PAY_VAULT_ABI =  [
    {
      "type": "constructor",
      "inputs": [
        { "name": "_usdc", "type": "address", "internalType": "address" },
        {
          "name": "_feeRecipient",
          "type": "address",
          "internalType": "address"
        },
        { "name": "_feeBps", "type": "uint256", "internalType": "uint256" }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "MAX_FEE_BPS",
      "inputs": [],
      "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "MAX_SAVE_PCT",
      "inputs": [],
      "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "SCALE",
      "inputs": [],
      "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "claim",
      "inputs": [
        { "name": "amount", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "claimAndSave",
      "inputs": [
        { "name": "amount", "type": "uint256", "internalType": "uint256" },
        { "name": "savePct", "type": "uint256", "internalType": "uint256" },
        { "name": "duration", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "credit",
      "inputs": [
        { "name": "employee", "type": "address", "internalType": "address" },
        { "name": "amount", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "disburse",
      "inputs": [
        { "name": "employee", "type": "address", "internalType": "address" },
        { "name": "cycleId", "type": "uint256", "internalType": "uint256" },
        { "name": "amount", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "dispatcher",
      "inputs": [],
      "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "feeBps",
      "inputs": [],
      "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "feeRecipient",
      "inputs": [],
      "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getAutoSaveCycle",
      "inputs": [
        { "name": "employee", "type": "address", "internalType": "address" },
        { "name": "index", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple",
          "internalType": "struct PayVault.AutoSaveCycle",
          "components": [
            { "name": "cycleId", "type": "uint256", "internalType": "uint256" },
            {
              "name": "amountSaved",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "startTime",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "duration",
              "type": "uint256",
              "internalType": "uint256"
            },
            { "name": "isActive", "type": "bool", "internalType": "bool" }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getAutoSaveCycles",
      "inputs": [
        { "name": "employee", "type": "address", "internalType": "address" }
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple[]",
          "internalType": "struct PayVault.AutoSaveCycle[]",
          "components": [
            { "name": "cycleId", "type": "uint256", "internalType": "uint256" },
            {
              "name": "amountSaved",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "startTime",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "duration",
              "type": "uint256",
              "internalType": "uint256"
            },
            { "name": "isActive", "type": "bool", "internalType": "bool" }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getBalance",
      "inputs": [
        { "name": "employee", "type": "address", "internalType": "address" }
      ],
      "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "isCycleSettled",
      "inputs": [
        { "name": "employee", "type": "address", "internalType": "address" },
        { "name": "cycleId", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "pause",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "paused",
      "inputs": [],
      "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "recoverDust",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "renounceOwnership",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setDispatcher",
      "inputs": [
        { "name": "_dispatcher", "type": "address", "internalType": "address" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setFeeBps",
      "inputs": [
        { "name": "_feeBps", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setFeeRecipient",
      "inputs": [
        {
          "name": "_feeRecipient",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setYieldRouter",
      "inputs": [
        { "name": "_router", "type": "address", "internalType": "address" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "totalEmployeeBalances",
      "inputs": [],
      "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "transferOwnership",
      "inputs": [
        { "name": "newOwner", "type": "address", "internalType": "address" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "unpause",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "usdc",
      "inputs": [],
      "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "yieldRouter",
      "inputs": [],
      "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "AutoSaveSettled",
      "inputs": [
        {
          "name": "employee",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "cycleId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "totalReceived",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "yieldEarned",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "fee",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "netCredited",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "timestamp",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "AutoSaveStarted",
      "inputs": [
        {
          "name": "employee",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "cycleId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "amountSaved",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "amountClaimed",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "duration",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "timestamp",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "Claimed",
      "inputs": [
        {
          "name": "employee",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "timestamp",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "Credited",
      "inputs": [
        {
          "name": "employee",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "timestamp",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "DispatcherSet",
      "inputs": [
        {
          "name": "dispatcher",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "FeeBpsUpdated",
      "inputs": [
        {
          "name": "previous",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "updated",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "FeeCollected",
      "inputs": [
        {
          "name": "recipient",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "FeeRecipientUpdated",
      "inputs": [
        {
          "name": "previous",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "updated",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "OwnershipTransferred",
      "inputs": [
        {
          "name": "previousOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "newOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "Paused",
      "inputs": [
        {
          "name": "account",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "Unpaused",
      "inputs": [
        {
          "name": "account",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "YieldRouterSet",
      "inputs": [
        {
          "name": "router",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    { "type": "error", "name": "EnforcedPause", "inputs": [] },
    { "type": "error", "name": "ExpectedPause", "inputs": [] },
    {
      "type": "error",
      "name": "OwnableInvalidOwner",
      "inputs": [
        { "name": "owner", "type": "address", "internalType": "address" }
      ]
    },
    {
      "type": "error",
      "name": "OwnableUnauthorizedAccount",
      "inputs": [
        { "name": "account", "type": "address", "internalType": "address" }
      ]
    },
    { "type": "error", "name": "PayVault__AlreadyDisbursed", "inputs": [] },
    { "type": "error", "name": "PayVault__CycleAlreadySettled", "inputs": [] },
    { "type": "error", "name": "PayVault__CycleNotFound", "inputs": [] },
    { "type": "error", "name": "PayVault__DispatcherNotSet", "inputs": [] },
    { "type": "error", "name": "PayVault__InsufficientBalance", "inputs": [] },
    {
      "type": "error",
      "name": "PayVault__InsufficientContractBalance",
      "inputs": []
    },
    { "type": "error", "name": "PayVault__InvalidFeeBps", "inputs": [] },
    { "type": "error", "name": "PayVault__InvalidSavePct", "inputs": [] },
    { "type": "error", "name": "PayVault__NotDispatcher", "inputs": [] },
    { "type": "error", "name": "PayVault__NotYieldRouter", "inputs": [] },
    { "type": "error", "name": "PayVault__RouterNotSet", "inputs": [] },
    { "type": "error", "name": "PayVault__ZeroAddress", "inputs": [] },
    { "type": "error", "name": "PayVault__ZeroAmount", "inputs": [] },
    { "type": "error", "name": "PayVault__ZeroDuration", "inputs": [] },
    { "type": "error", "name": "ReentrancyGuardReentrantCall", "inputs": [] },
    {
      "type": "error",
      "name": "SafeERC20FailedOperation",
      "inputs": [
        { "name": "token", "type": "address", "internalType": "address" }
      ]
    }
  ]