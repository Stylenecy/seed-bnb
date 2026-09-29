export const PAYROLL_MANAGER_ABI = [
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
    "name": "addEmployee",
    "inputs": [
      { "name": "groupId", "type": "uint256", "internalType": "uint256" },
      { "name": "employee", "type": "address", "internalType": "address" },
      { "name": "salary", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addEmployees",
    "inputs": [
      { "name": "groupId", "type": "uint256", "internalType": "uint256" },
      {
        "name": "employees",
        "type": "address[]",
        "internalType": "address[]"
      },
      { "name": "salaries", "type": "uint256[]", "internalType": "uint256[]" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelCycle",
    "inputs": [
      { "name": "groupId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createGroup",
    "inputs": [
      { "name": "name", "type": "string", "internalType": "string" },
      {
        "name": "cycleDuration",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      { "name": "groupId", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cycleToGroup",
    "inputs": [
      { "name": "", "type": "address", "internalType": "address" },
      { "name": "cycleId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "groupId", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "depositPayroll",
    "inputs": [
      { "name": "groupId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
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
    "name": "getEmployer",
    "inputs": [
      { "name": "employer", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct PayrollManager.EmployerProfile",
        "components": [
          { "name": "isRegistered", "type": "bool", "internalType": "bool" },
          {
            "name": "groupCount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "employerAddress",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getGroup",
    "inputs": [
      { "name": "employer", "type": "address", "internalType": "address" },
      { "name": "groupId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct PayrollManager.PayrollGroup",
        "components": [
          { "name": "groupId", "type": "uint256", "internalType": "uint256" },
          { "name": "name", "type": "string", "internalType": "string" },
          {
            "name": "totalPayroll",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "activeCycleId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "cycleDuration",
            "type": "uint256",
            "internalType": "uint256"
          },
          { "name": "exists", "type": "bool", "internalType": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getGroupEmployees",
    "inputs": [
      { "name": "employer", "type": "address", "internalType": "address" },
      { "name": "groupId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "address[]", "internalType": "address[]" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSalary",
    "inputs": [
      { "name": "employer", "type": "address", "internalType": "address" },
      { "name": "groupId", "type": "uint256", "internalType": "uint256" },
      { "name": "employee", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalPayroll",
    "inputs": [
      { "name": "employer", "type": "address", "internalType": "address" },
      { "name": "groupId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasActiveGroup",
    "inputs": [
      { "name": "employer", "type": "address", "internalType": "address" },
      { "name": "groupId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isRegistered",
    "inputs": [
      { "name": "employer", "type": "address", "internalType": "address" }
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
    "name": "payrollDispatcher",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registerEmployer",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeEmployee",
    "inputs": [
      { "name": "groupId", "type": "uint256", "internalType": "uint256" },
      { "name": "employee", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeEmployees",
    "inputs": [
      { "name": "groupId", "type": "uint256", "internalType": "uint256" },
      {
        "name": "employees",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
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
    "name": "setPayrollDispatcher",
    "inputs": [
      { "name": "_dispatcher", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setUpPayroll",
    "inputs": [
      { "name": "groupId", "type": "uint256", "internalType": "uint256" },
      {
        "name": "employees",
        "type": "address[]",
        "internalType": "address[]"
      },
      { "name": "salaries", "type": "uint256[]", "internalType": "uint256[]" }
    ],
    "outputs": [
      { "name": "cycleId", "type": "uint256", "internalType": "uint256" }
    ],
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
    "name": "updateSalaries",
    "inputs": [
      { "name": "groupId", "type": "uint256", "internalType": "uint256" },
      {
        "name": "employees",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "newSalaries",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateSalary",
    "inputs": [
      { "name": "groupId", "type": "uint256", "internalType": "uint256" },
      { "name": "employee", "type": "address", "internalType": "address" },
      { "name": "newSalary", "type": "uint256", "internalType": "uint256" }
    ],
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
    "name": "CycleCancelled",
    "inputs": [
      {
        "name": "employer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "cycleId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "amountReturned",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "EmployeeAdded",
    "inputs": [
      {
        "name": "employer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
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
        "name": "salary",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "EmployeeRemoved",
    "inputs": [
      {
        "name": "employer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
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
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "EmployerRegistered",
    "inputs": [
      {
        "name": "employer",
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
    "name": "GroupCreated",
    "inputs": [
      {
        "name": "employer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "name",
        "type": "string",
        "indexed": false,
        "internalType": "string"
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
    "name": "PayrollDeposited",
    "inputs": [
      {
        "name": "employer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "cycleId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "cycleDuration",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PayrollDispatcherSet",
    "inputs": [
      {
        "name": "_dispatcher",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PayrollSetup",
    "inputs": [
      {
        "name": "employer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "groupId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "cycleId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SalaryUpdated",
    "inputs": [
      {
        "name": "employer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
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
        "name": "oldSalary",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newSalary",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
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
  {
    "type": "error",
    "name": "PayrollManager__AlreadyRegistered",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PayrollManager__ArrayLengthMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PayrollManager__CycleNotCancellable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PayrollManager__EmployeeAlreadyExists",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PayrollManager__EmployeeNotFound",
    "inputs": []
  },
  { "type": "error", "name": "PayrollManager__EmptyArray", "inputs": [] },
  {
    "type": "error",
    "name": "PayrollManager__GroupHasActiveCycle",
    "inputs": []
  },
  { "type": "error", "name": "PayrollManager__GroupNotFound", "inputs": [] },
  {
    "type": "error",
    "name": "PayrollManager__InsufficientPayroll",
    "inputs": []
  },
  { "type": "error", "name": "PayrollManager__InvalidFeeBps", "inputs": [] },
  {
    "type": "error",
    "name": "PayrollManager__InvalidFeeRecipient",
    "inputs": []
  },
  { "type": "error", "name": "PayrollManager__NoActiveCycle", "inputs": [] },
  { "type": "error", "name": "PayrollManager__NotRegistered", "inputs": [] },
  { "type": "error", "name": "PayrollManager__RouterNotSet", "inputs": [] },
  { "type": "error", "name": "PayrollManager__ZeroAddress", "inputs": [] },
  { "type": "error", "name": "PayrollManager__ZeroDuration", "inputs": [] },
  { "type": "error", "name": "PayrollManager__ZeroSalary", "inputs": [] },
  { "type": "error", "name": "ReentrancyGuardReentrantCall", "inputs": [] },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      { "name": "token", "type": "address", "internalType": "address" }
    ]
  }
] as const;
