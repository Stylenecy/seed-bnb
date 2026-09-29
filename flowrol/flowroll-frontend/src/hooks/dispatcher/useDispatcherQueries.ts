import { PAYROLL_DISPATCHER_ABI } from "@/lib/contracts/abis";
import { DisbursementRecord } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useChainId } from "wagmi";
import { useContractClient } from "../useContractClient";

export function useDisbursementRecord(
  caller: `0x${string}` | undefined,
  cycleId: bigint | undefined
) {
  const { publicClient, contracts } = useContractClient();
  const chainId = useChainId();

  return useQuery({
    queryKey: ["disbursement-record", caller, cycleId?.toString(), chainId],
    queryFn: async (): Promise<DisbursementRecord> => {
      const result = await publicClient!.readContract({
        address: contracts.PAYROLL_DISPATCHER_ADDRESS,
        abi: PAYROLL_DISPATCHER_ABI,
        functionName: "getDisbursement",
        args: [caller!, cycleId!],
      });

      return result as unknown as DisbursementRecord;
    },
    enabled: !!caller && cycleId !== undefined && !!publicClient,
  });
}


// import { PAYROLL_DISPATCHER_ABI, PAYROLL_MANAGER_ABI } from "@/lib/contracts/abis";
// import { getContractsForChain } from "@/lib/contracts/addresses";
// import { FLOWROLL_CHAIN } from "@/lib/interwoven";
// import { DisbursementRecord } from "@/types";
// import { useQuery } from "@tanstack/react-query";
// import { useContractClient } from "../useContractClient";

// export function useDisbursementRecord(
//   caller: `0x${string}` | undefined,
//   cycleId: bigint | undefined
// ) {
//   const { publicClient } = useContractClient();
//   const contracts = getContractsForChain(FLOWROLL_CHAIN.id.toString());

//   return useQuery({
//     queryKey: ["disbursement-record", caller, cycleId?.toString()],
//     queryFn: async (): Promise<DisbursementRecord> => {
//       const result = await publicClient!.readContract({
//         address: contracts.PAYROLL_DISPATCHER_ADDRESS,
//         abi: PAYROLL_DISPATCHER_ABI,
//         functionName: "getDisbursement",
//         args: [caller!, cycleId!],
//       });

//       return result as unknown as DisbursementRecord;
//     },
//     enabled: !!caller && cycleId !== undefined && !!publicClient,
//   });
// }