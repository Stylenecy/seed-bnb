import { PAY_VAULT_ABI } from "@/lib/contracts/abis";
import { getLogsChunked } from "@/lib/chain";
import { getContractsForChain } from "@/lib/contracts/addresses";
// import { FLOWROLL_CHAIN } from "@/lib/interwoven";
import { useQuery } from "@tanstack/react-query";
import { useContractClient } from "../useContractClient";
import { parseAbiItem } from "viem";
import { AutoSaveCycle } from "@/types";


export function useAvailableBalance(employeeAddress: `0x${string}` | undefined) {
  const { publicClient, contracts } = useContractClient();
  // const contracts = getContractsForChain(FLOWROLL_CHAIN.id.toString());

  return useQuery({
    queryKey: ["available-balance", employeeAddress],
    queryFn: async (): Promise<bigint> => {
      const balance = await publicClient!.readContract({
        address: contracts.PAY_VAULT_ADDRESS,
        abi: PAY_VAULT_ABI,
        functionName: "getBalance",
        args: [employeeAddress!],
      });

      return balance as bigint;
    },
    // Only run the query if the address and publicClient are actually available
    enabled: !!employeeAddress && !!publicClient,
  });
}


export function useTotalLocked(employeeAddress: `0x${string}` | undefined) {
  const { publicClient, contracts } = useContractClient();

  return useQuery({
    queryKey: ["total-locked", employeeAddress],
    queryFn: async (): Promise<bigint> => {
      const addedLogsPromise = getLogsChunked(publicClient!, contracts.PAYROLL_MANAGER_DEPLOYMENT_BLOCK, (range) =>
        publicClient!.getLogs({
        address: contracts.PAYROLL_MANAGER_ADDRESS,
        event: parseAbiItem(
          "event EmployeeAdded(address indexed employer, uint256 indexed groupId, address indexed employee, uint256 salary)"
        ),
        args: { employee: employeeAddress },
        ...range,
      }));

      const paidLogsPromise = getLogsChunked(publicClient!, contracts.PAYROLL_MANAGER_DEPLOYMENT_BLOCK, (range) =>
        publicClient!.getLogs({
        address: contracts.PAYROLL_DISPATCHER_ADDRESS,
        event: parseAbiItem(
          "event EmployeePaid(address indexed employer, uint256 cycleId, uint256 indexed groupId, address indexed employee, uint256 amount)"
        ),
        args: { employee: employeeAddress },
        ...range,
      }));

      const [addedLogs, paidLogs] = await Promise.all([addedLogsPromise, paidLogsPromise]);

      const uniqueGroups = new Map<string, bigint>();

      addedLogs.forEach((log) => {
        const employer = log.args.employer as string;
        const groupId = log.args.groupId as bigint;
        const salary = log.args.salary as bigint;
        
        // The composite key (lowercased for safety against checksum mismatches)
        const compositeKey = `${employer.toLowerCase()}-${groupId.toString()}`;
        
        uniqueGroups.set(compositeKey, salary);
      });

      let totalSalary = 0n;
      uniqueGroups.forEach((salary) => {
        totalSalary += salary;
      });

      let totalPaid = 0n;
      paidLogs.forEach((log) => {
        const amount = log.args.amount as bigint;
        totalPaid += amount;
      });

      const totalLocked = totalSalary - totalPaid;

      return totalLocked > 0n ? totalLocked : 0n;
    },
    enabled: !!employeeAddress && !!publicClient,
  });
}

export function useAutoSaveCycles(employeeAddress: `0x${string}` | undefined) {
  const { publicClient, contracts } = useContractClient();

  return useQuery({
    queryKey: ["auto-save-cycles", employeeAddress],
    queryFn: async (): Promise<AutoSaveCycle[]> => {
      const result = await publicClient!.readContract({
        address: contracts.PAY_VAULT_ADDRESS, 
        abi: PAY_VAULT_ABI,
        functionName: "getAutoSaveCycles",
        args: [employeeAddress!],
      });

      // Viem automatically maps the returned array of structs into an array of objects
      return result as unknown as AutoSaveCycle[];
    },
    enabled: !!employeeAddress && !!publicClient,
  });
}

export function useCycleSettled(
  employeeAddress: `0x${string}` | undefined,
  cycleId: bigint | undefined
) {
  const { publicClient, contracts } = useContractClient();

  return useQuery({
    queryKey: ["cycle-settled", employeeAddress, cycleId?.toString()],
    queryFn: async (): Promise<boolean> => {
      const isSettled = await publicClient!.readContract({
        address: contracts.PAY_VAULT_ADDRESS,
        abi: PAY_VAULT_ABI,
        functionName: "isCycleSettled",
        args: [employeeAddress!, cycleId!],
      });

      return isSettled as boolean;
    },
    enabled: !!employeeAddress && cycleId !== undefined && !!publicClient,
  });
}