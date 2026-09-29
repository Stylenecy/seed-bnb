'use client';

import { useQuery } from "@tanstack/react-query";
import { getLogsChunked } from "@/lib/chain";
import { parseAbiItem } from "viem";

import { PAYROLL_MANAGER_ABI } from "@/lib/contracts/abis";
import { useContractClient } from "../useContractClient";
import { EmployeePayrollGroup, PayrollGroup } from "@/types";

// Fetch specific group metadata
export function useGroupDetails(employerAddress: `0x${string}` | undefined, groupId: bigint | undefined) {
  const { publicClient, contracts } = useContractClient();

  return useQuery({
    queryKey: ["payroll-group", employerAddress, groupId?.toString()],
    queryFn: async (): Promise<PayrollGroup> => {
      if (!publicClient || !employerAddress || groupId === undefined) {
        throw new Error("Missing required parameters for group details");
      }

      const group = await publicClient.readContract({
        address: contracts.PAYROLL_MANAGER_ADDRESS,
        abi: PAYROLL_MANAGER_ABI,
        functionName: "getGroup",
        args: [employerAddress, groupId],
      });

      return group as PayrollGroup;
    },
    enabled: !!employerAddress && groupId !== undefined && !!publicClient,
  });
}

// Retrieve the list of employees assigned to a group
export function useGroupEmployees(groupId: bigint | undefined) {
  const { publicClient, address, contracts } = useContractClient();

  return useQuery({
    queryKey: ["group-employees", address, groupId?.toString()],
    queryFn: async (): Promise<string[]> => {
      if (!publicClient || !address || groupId === undefined) return [];

      const groupEmployees = await publicClient.readContract({
        address: contracts.PAYROLL_MANAGER_ADDRESS,
        abi: PAYROLL_MANAGER_ABI,
        functionName: "getGroupEmployees",
        args: [address, groupId],
      });

      return groupEmployees as string[];
    },
    enabled: !!address && groupId !== undefined && !!publicClient,
  });
}

// Index all groups created by the current employer via event logs
export function useEmployerGroups() {
  const { publicClient, address, contracts } = useContractClient();

  return useQuery({
    queryKey: ["employer-groups", address],
    queryFn: async (): Promise<PayrollGroup[]> => {
      if (!publicClient || !address) return [];

      const logs = await getLogsChunked(publicClient, contracts.PAYROLL_MANAGER_DEPLOYMENT_BLOCK, (range) =>
        publicClient.getLogs({
        address: contracts.PAYROLL_MANAGER_ADDRESS,
        event: parseAbiItem(
          "event GroupCreated(address indexed employer, uint256 indexed groupId, string name)"
        ),
        args: { employer: address },
        ...range,
      }));

      const ids = Array.from(new Set(logs.map((log) => log.args.groupId as bigint)));
      if (ids.length === 0) return [];

      // Resolve metadata for each unique groupId
      const groupPromises = ids.map(async (id) => {
        const groupData = await publicClient.readContract({
          address: contracts.PAYROLL_MANAGER_ADDRESS,
          abi: PAYROLL_MANAGER_ABI,
          functionName: "getGroup",
          args: [address, id],
        });

        return {
          groupId: id,
          ...(groupData as any),
        } as PayrollGroup;
      });

      return await Promise.all(groupPromises);
    },
    enabled: !!address && !!publicClient,
  });
}

// Aggregate employee addresses with their current salary configurations
export function useGroupEmployeesWithSalaries(groupId: bigint | undefined) {
  const { publicClient, address, contracts } = useContractClient();
  const { data: employees } = useGroupEmployees(groupId);

  return useQuery({
    queryKey: ["group-employees-salaries", address, groupId?.toString(), employees],
    queryFn: async () => {
      if (!publicClient || !address || !employees || employees.length === 0) return [];

      const salaries = await Promise.all(
        employees.map((employee) =>
          publicClient.readContract({
            address: contracts.PAYROLL_MANAGER_ADDRESS,
            abi: PAYROLL_MANAGER_ABI,
            functionName: "getSalary",
            args: [address, groupId!, employee as `0x${string}`],
          })
        )
      );

      return employees.map((employee, i) => ({
        address: employee,
        salary: salaries[i] as bigint,
      }));
    },
    enabled: !!address && groupId !== undefined && !!employees && employees.length > 0 && !!publicClient,
  });
}

// Get the total periodic USDC liability for a group
export function useTotalPayroll(groupId: bigint | undefined) {
  const { publicClient, address, contracts } = useContractClient();

  return useQuery({
    queryKey: ["total-payroll", address, groupId?.toString()],
    queryFn: async (): Promise<bigint> => {
      if (!publicClient || !address || groupId === undefined) return 0n;

      const totalPayroll = await publicClient.readContract({
        address: contracts.PAYROLL_MANAGER_ADDRESS,
        abi: PAYROLL_MANAGER_ABI,
        functionName: "getTotalPayroll",
        args: [address, groupId],
      });
      return totalPayroll as bigint;
    },
    enabled: !!address && groupId !== undefined && !!publicClient,
  });
}

// Check if a group has an active, funded cycle
export function useHasActiveGroup(groupId: bigint | undefined) {
  const { publicClient, address, contracts } = useContractClient();

  return useQuery({
    queryKey: ["has-active-group", address, groupId?.toString()],
    queryFn: async (): Promise<boolean> => {
      if (!publicClient || !address || groupId === undefined) return false;

      return await publicClient.readContract({
        address: contracts.PAYROLL_MANAGER_ADDRESS,
        abi: PAYROLL_MANAGER_ABI,
        functionName: "hasActiveGroup",
        args: [address, groupId],
      });
    },
    enabled: !!address && groupId !== undefined && !!publicClient,
  });
}

// Index all groups the current employee has been added to via event logs
export function useEmployeeGroups() {
  const { publicClient, address, contracts } = useContractClient();

  return useQuery({
    queryKey: ["employee-groups", address],
    queryFn: async (): Promise<EmployeePayrollGroup[]> => {
      if (!publicClient || !address) return [];

      const logs = await getLogsChunked(publicClient, contracts.PAYROLL_MANAGER_DEPLOYMENT_BLOCK, (range) =>
        publicClient.getLogs({
        address: contracts.PAYROLL_MANAGER_ADDRESS,
        event: parseAbiItem(
          "event EmployeeAdded(address indexed employer, uint256 indexed groupId, address indexed employee, uint256 salary)"
        ),
        args: { employee: address },
        ...range,
      }));

      if (logs.length === 0) return [];

      // Resolve group metadata from the employer context
      const groupPromises = logs.map(async (log) => {
        const groupId = log.args.groupId as bigint;
        const employer = log.args.employer as `0x${string}`;
        const salary = log.args.salary as bigint;

        const groupData = await publicClient.readContract({
          address: contracts.PAYROLL_MANAGER_ADDRESS,
          abi: PAYROLL_MANAGER_ABI,
          functionName: "getGroup",
          args: [employer, groupId],
        });

        return {
          groupId,
          employerAddress: employer,
          employeeSalary: salary,
          ...(groupData as any),
        } as EmployeePayrollGroup;
      });

      return await Promise.all(groupPromises);
    },
    enabled: !!address && !!publicClient,
  });
}