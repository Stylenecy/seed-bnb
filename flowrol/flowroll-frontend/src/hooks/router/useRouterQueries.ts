'use client'

import { useQuery } from "@tanstack/react-query";
import { USDC_DECIMALS } from "@/lib/chain";
import { getLogsChunked } from "@/lib/chain";
import {
  useReadContract,
  useReadContracts,
  useWatchContractEvent
} from "wagmi";
import { formatUnits, parseAbiItem } from "viem";

// import { FLOWROLL_CHAIN } from "@/lib/interwoven";
import { PAYROLL_MANAGER_ABI, YIELD_ROUTER_ABI } from "@/lib/contracts/abis";
import { getContractsForChain } from "@/lib/contracts/addresses";
import { useContractClient } from "../useContractClient";
import { POOL_ABI } from "@/lib/contracts/abis/pool";
import { useGroupDetails } from "../payroll/usePayrollQueries";
import {
  FormattedAgentLog,
  LiveYieldData,
  PayrollCycle,
  PoolData,
  PoolDetails,
  PoolEntry,
} from "@/types";
import { useChainId } from "wagmi";



interface AgentActionLog {
  args: {
    actionType: number;
    amountMoved: bigint;
    fromPoolIndex: bigint;
    toPoolIndex: bigint;
    timeIntoCycle: bigint;
    caller: `0x${string}`;
    cycleId: bigint;
  };
  transactionHash: `0x${string}`;
  logIndex: number;
}


export function useAgentStatus() {
  return useQuery({
    queryKey: ["agent-heartbeat"],
    queryFn: async (): Promise<boolean> => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_URL}/status`);
        if (!res.ok) return false;
        const data = await res.json();
        return data.status === "ok";
      } catch (e) {
        return false;
      }
    },
    refetchInterval: 3000,
    retry: false,
    initialData: false,
  });
}

export function usePayrollCycle(address: `0x${string}` | undefined, cycleId: bigint | undefined) {
  const { publicClient, contracts} = useContractClient();
  
  return useQuery({
    queryKey: ["payroll-cycle", address, cycleId?.toString()],
    queryFn: async (): Promise<PayrollCycle> => {
      if (!publicClient || !address || cycleId === undefined) {
        throw new Error("Missing parameters for payroll cycle query");
      }

      const result = await publicClient.readContract({
        address: contracts.YIELD_ROUTER_ADDRESS,
        abi: YIELD_ROUTER_ABI,
        functionName: "getCycle",
        args: [address, cycleId],
      });

      return result as unknown as PayrollCycle;
    },
    enabled: !!address && cycleId !== undefined && !!publicClient,
  });
}

export function useLiveYield(address: `0x${string}` | undefined, cycleId: bigint | undefined) {
  const { publicClient, contracts} = useContractClient();
  // const contracts = getContractsForChain(FLOWROLL_CHAIN.id.toString());

  return useQuery({
    queryKey: ["live-yield", address, cycleId?.toString()],
    queryFn: async (): Promise<LiveYieldData> => {
      if (!publicClient || !address || cycleId === undefined) {
        throw new Error("Missing parameters for live yield query");
      }

      const result = await publicClient.readContract({
        address: contracts.YIELD_ROUTER_ADDRESS,
        abi: YIELD_ROUTER_ABI,
        functionName: "getLiveYield",
        args: [address, cycleId],
      }) as [bigint, bigint, boolean];

      return {
        totalValue: result[0],
        netYield: result[1],
        isLoss: result[2],
      };
    },
    enabled: !!address && !!publicClient && cycleId !== undefined,
  });
}

export function usePools() {
  const { contracts } = useContractClient();

  // Index total active pools from router
  const { data: count, isLoading: loadingCount } = useReadContract({
    address: contracts.YIELD_ROUTER_ADDRESS,
    abi: YIELD_ROUTER_ABI,
    functionName: "getPoolCount",
  });

  const poolCount = Number(count || 0n);

  const poolCalls = Array.from({ length: poolCount }).map((_, index) => ({
    address: contracts.YIELD_ROUTER_ADDRESS,
    abi: YIELD_ROUTER_ABI,
    functionName: "getPool",
    args: [BigInt(index)],
  }));

  // Batch fetch pool entries via multicall
  const query = useReadContracts({
    contracts: poolCalls,
    query: {
      enabled: poolCount > 0,
    },
  });

  const pools: PoolEntry[] = query.data
    ? query.data
      .map((res) => res.result as unknown as PoolEntry)
      .filter(Boolean)
      .filter((pool) => pool.isActive === true)
      .filter(
        (pool, index, self) =>
          index === self.findIndex((p) => p.pool === pool.pool),
      )
    : [];

  return {
    data: pools,
    isLoading: loadingCount || query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function usePoolDetails(poolAddress: `0x${string}` | undefined) {
  const { publicClient } = useContractClient();

  return useQuery({
    queryKey: ["pool-details", poolAddress],
    queryFn: async (): Promise<PoolDetails> => {
      if (!publicClient || !poolAddress) throw new Error("Pool address or client missing");

      // Resolve metadata and stats for specific vault
      const [
        name, symbol, poolName, apyBps, isStablePair, totalAssets, totalSupply
      ] = await Promise.all([
        publicClient.readContract({ address: poolAddress, abi: POOL_ABI, functionName: "name" }),
        publicClient.readContract({ address: poolAddress, abi: POOL_ABI, functionName: "symbol" }),
        publicClient.readContract({ address: poolAddress, abi: POOL_ABI, functionName: "poolName" }),
        publicClient.readContract({ address: poolAddress, abi: POOL_ABI, functionName: "apyBps" }),
        publicClient.readContract({ address: poolAddress, abi: POOL_ABI, functionName: "isStablePair" }),
        publicClient.readContract({ address: poolAddress, abi: POOL_ABI, functionName: "totalAssets" }),
        publicClient.readContract({ address: poolAddress, abi: POOL_ABI, functionName: "totalSupply" }),
      ]);

      return {
        name: name as string,
        symbol: symbol as string,
        poolName: poolName as string,
        apyBps: apyBps as bigint,
        isStablePair: isStablePair as boolean,
        totalAssets: totalAssets as bigint,
        totalSupply: totalSupply as bigint,
      };
    },
    enabled: !!poolAddress && !!publicClient,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePoolData(
  cycleId: bigint | undefined,
  poolIndex: bigint | undefined,
  poolAddress: `0x${string}` | undefined,
) {
  const { address, publicClient, contracts } = useContractClient();

  return useQuery({
    queryKey: ["pool-data", address, cycleId?.toString(), poolIndex?.toString()],
    queryFn: async (): Promise<PoolData> => {
      if (!publicClient || !address || !cycleId || poolIndex === undefined) {
        throw new Error("Incomplete parameters for pool data resolution");
      }

      const shares = (await publicClient.readContract({
        address: contracts.YIELD_ROUTER_ADDRESS,
        abi: YIELD_ROUTER_ABI,
        functionName: "poolAllocations",
        args: [address, cycleId, poolIndex],
      })) as bigint;

      let valueUsdc = 0n;
      if (shares > 0n && poolAddress) {
        valueUsdc = (await publicClient.readContract({
          address: poolAddress,
          abi: POOL_ABI,
          functionName: "sharesToValue",
          args: [shares],
        })) as bigint;
      }
      return { shares, valueUsdc };
    },
    enabled: !!address && !!cycleId && poolIndex !== undefined && !!poolAddress && !!publicClient,
  });
}

export function useCycleBuffer(groupId: bigint | undefined) {
  const { publicClient, contracts, address } = useContractClient();
  const { data: group } = useGroupDetails(address, groupId);
  const cycleId = group?.activeCycleId;

  return useQuery({
    queryKey: ["cycle-buffer", address, cycleId?.toString()],
    queryFn: async () => {
      if (!publicClient || !address || cycleId === undefined) return null;

      const result = await publicClient.readContract({
        address: contracts.YIELD_ROUTER_ADDRESS,
        abi: YIELD_ROUTER_ABI,
        functionName: "calculateBuffer",
        args: [address, cycleId],
      });

      const [bufferAmount, bufferBps, timeLeft] = result as [bigint, bigint, bigint];
      return { bufferAmount, bufferBps, timeLeft };
    },
    enabled: !!address && cycleId !== undefined && !!publicClient,
  });
}

export function useCycleIdleAmount(groupId: bigint | undefined) {
  const { publicClient, contracts, address } = useContractClient();
  const { data: group } = useGroupDetails(address, groupId);
  const cycleId = group?.activeCycleId;

  return useQuery({
    queryKey: ["cycle-idle", address, cycleId?.toString()],
    queryFn: async (): Promise<bigint> => {
      if (!publicClient || !address || cycleId === undefined) return 0n;

      const result = await publicClient.readContract({
        address: contracts.YIELD_ROUTER_ADDRESS,
        abi: YIELD_ROUTER_ABI,
        functionName: "calculateIdleAmount",
        args: [address, cycleId],
      });
      return result as bigint;
    },
    enabled: !!address && cycleId !== undefined && !!publicClient,
  });
}

export function useAgentSync(groupId: bigint | undefined) {
  const { address, queryClient, contracts } = useContractClient();
  const { data: group } = useGroupDetails(address, groupId);
  const cycleId = group?.activeCycleId;

  // Real-time listener for agent yield optimizations
  useWatchContractEvent({
    address: contracts.YIELD_ROUTER_ADDRESS,
    abi: YIELD_ROUTER_ABI,
    eventName: "AgentAction",
    args: (address && cycleId) ? {
      caller: address,
      cycleId: cycleId,
    } : undefined,
    enabled: !!(address && cycleId),
    onLogs() {
      // Invalidate specific cache keys to trigger data refresh
      queryClient.invalidateQueries({ queryKey: ["pool-data", address], exact: false });
      queryClient.invalidateQueries({ queryKey: ["pool-details"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["agent-logs", address, cycleId?.toString()], exact: false });
      queryClient.invalidateQueries({ queryKey: ["cycle-buffer", address, cycleId?.toString()], exact: false });
      queryClient.invalidateQueries({ queryKey: ["payroll-cycle", address, cycleId?.toString()], exact: false });
      queryClient.invalidateQueries({ queryKey: ["disbursement-record", address, cycleId?.toString()], exact: false });
    },
  });
}

export function useAgentLogs(cycleId: bigint | undefined) {
  const { address, publicClient, contracts } = useContractClient();

  return useQuery({
    queryKey: ["agent-logs", address, cycleId?.toString()],
    queryFn: async (): Promise<FormattedAgentLog[]> => {
      if (!publicClient || !address || cycleId === undefined) return [];

      const cycle = await publicClient.readContract({
        address: contracts.YIELD_ROUTER_ADDRESS,
        abi: YIELD_ROUTER_ABI,
        functionName: "getCycle",
        args: [address, cycleId],
      });

      const cycleStartTime = Number(cycle.cycleStartTime);
      const TARGET_ACTIONS = [0, 1, 2, 5];

      // Fetch historical agent execution logs
      const logs = await getLogsChunked(publicClient, contracts.PAYROLL_MANAGER_DEPLOYMENT_BLOCK, (range) =>
        publicClient.getLogs({
        address: contracts.YIELD_ROUTER_ADDRESS,
        event: YIELD_ROUTER_ABI.find((x) => x.type === "event" && x.name === "AgentAction") as any,
        args: {
          caller: address,
          cycleId: cycleId,
          actionType: TARGET_ACTIONS,
        },
        ...range,
      }));

      // Transform raw events into terminal-ready log entries
      return logs.map((rawLog) => {
        const log = rawLog as unknown as AgentActionLog;
        const { actionType, amountMoved, fromPoolIndex, toPoolIndex, timeIntoCycle } = log.args;

        const amountUsdc = amountMoved
          ? Number(formatUnits(amountMoved, USDC_DECIMALS)).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
          : "0.00";

        const exactTimestampMs = (cycleStartTime + Number(timeIntoCycle)) * 1000;
        const formattedTime = new Date(exactTimestampMs).toLocaleTimeString();

        let message = "";
        let type: "info" | "success" | "warning" | "error" = "info";

        if (actionType === 0) {
          message = `[INIT] Payroll Cycle #${cycleId} initialized. Monitoring started.`;
          type = "info";
        }
        else if (actionType === 1) {
          message = `[REBALANCE] Moved ${amountUsdc} USDC from ${fromPoolIndex > 10 ? `Reserve` : `Pool ${fromPoolIndex}`} to Pool ${toPoolIndex}.`;
          type = "success";
        }
        else if (actionType === 2) {
          message = `[LIQUIDITY] Withdrew ${amountUsdc} USDC to Reserve for upcoming payday.`;
          type = "warning";
        }
        else if (actionType === 5) {
          message = `[PAYDAY] Cycle complete. Funds unlocked for disbursement.`;
          type = "success";
        }

        return {
          id: `${log.transactionHash}-${log.logIndex}`,
          timestamp: formattedTime,
          message,
          type,
        };
      });
    },
    enabled: !!address && cycleId !== undefined && !!publicClient,
  });
}