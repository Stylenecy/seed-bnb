export const PAYROLL_DISPATCHER_ABI = [
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
      "name": "SCALE",
      "inputs": [],
      "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "disburse",
      "inputs": [
        { "name": "employer", "type": "address", "internalType": "address" },
        { "name": "cycleId", "type": "uint256", "internalType": "uint256" },
        { "name": "amount", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "disbursements",
      "inputs": [
        { "name": "employer", "type": "address", "internalType": "address" },
        { "name": "cycleId", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [
        {
          "name": "totalReceived",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "totalDeposited",
          "type": "uint256",
          "internalType": "uint256"
        },
        { "name": "yieldEarned", "type": "uint256", "internalType": "uint256" },
        { "name": "fee", "type": "uint256", "internalType": "uint256" },
        {
          "name": "employerReturn",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "employeeTotal",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "employeeCount",
          "type": "uint256",
          "internalType": "uint256"
        },
        { "name": "timestamp", "type": "uint256", "internalType": "uint256" },
        { "name": "executed", "type": "bool", "internalType": "bool" }
      ],
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
      "name": "getDisbursement",
      "inputs": [
        { "name": "employer", "type": "address", "internalType": "address" },
        { "name": "cycleId", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple",
          "internalType": "struct PayrollDispatcher.DisbursementRecord",
          "components": [
            {
              "name": "totalReceived",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "totalDeposited",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "yieldEarned",
              "type": "uint256",
              "internalType": "uint256"
            },
            { "name": "fee", "type": "uint256", "internalType": "uint256" },
            {
              "name": "employerReturn",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "employeeTotal",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "employeeCount",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "timestamp",
              "type": "uint256",
              "internalType": "uint256"
            },
            { "name": "executed", "type": "bool", "internalType": "bool" }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "isDisbursed",
      "inputs": [
        { "name": "employer", "type": "address", "internalType": "address" },
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
      "name": "payVault",
      "inputs": [],
      "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "payrollManager",
      "inputs": [],
      "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
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
      "name": "setPayVault",
      "inputs": [
        { "name": "_vault", "type": "address", "internalType": "address" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setPayrollManager",
      "inputs": [
        { "name": "_manager", "type": "address", "internalType": "address" }
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
      "name": "Disbursed",
      "inputs": [
        {
          "name": "employer",
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
          "name": "groupId",
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
          "name": "employerReturn",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "employeeTotal",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "employeeCount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "EmployeePaid",
      "inputs": [
        {
          "name": "employer",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "cycleId",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "groupId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
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
      "name": "PayVaultSet",
      "inputs": [
        {
          "name": "vault",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "PayrollManagerSet",
      "inputs": [
        {
          "name": "manager",
          "type": "address",
          "indexed": true,
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
      "name": "YieldReturnedToEmployer",
      "inputs": [
        {
          "name": "employer",
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
    {
      "type": "error",
      "name": "PayrollDispatcher__AlreadyDisbursed",
      "inputs": []
    },
    {
      "type": "error",
      "name": "PayrollDispatcher__InsufficientBalance",
      "inputs": []
    },
    {
      "type": "error",
      "name": "PayrollDispatcher__InvalidAmount",
      "inputs": []
    },
    {
      "type": "error",
      "name": "PayrollDispatcher__InvalidFeeBps",
      "inputs": []
    },
    {
      "type": "error",
      "name": "PayrollDispatcher__ManagerNotSet",
      "inputs": []
    },
    { "type": "error", "name": "PayrollDispatcher__NoEmployees", "inputs": [] },
    {
      "type": "error",
      "name": "PayrollDispatcher__NotYieldRouter",
      "inputs": []
    },
    {
      "type": "error",
      "name": "PayrollDispatcher__RouterNotSet",
      "inputs": []
    },
    { "type": "error", "name": "PayrollDispatcher__VaultNotSet", "inputs": [] },
    { "type": "error", "name": "PayrollDispatcher__ZeroAddress", "inputs": [] },
    {
      "type": "error",
      "name": "PayrollDispatcher__ZeroTotalPayroll",
      "inputs": []
    },
    { "type": "error", "name": "ReentrancyGuardReentrantCall", "inputs": [] },
    {
      "type": "error",
      "name": "SafeERC20FailedOperation",
      "inputs": [
        { "name": "token", "type": "address", "internalType": "address" }
      ]
    }
  ] as const