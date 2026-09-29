import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { bsc, bscTestnet } from "viem/chains";
import { bnbChain } from "./chain";
import { IS_MAINNET, RPC_URL } from "./contracts";

// Only the configured network (BSC Testnet 97 by default, BSC Mainnet 56 when
// NEXT_PUBLIC_CHAIN_ID=56) is exposed; both transports are declared so the
// config type-checks for either choice.
export const config = createConfig({
  chains: [bnbChain],
  connectors: [injected()],
  transports: {
    [bsc.id]: http(IS_MAINNET ? RPC_URL : undefined),
    [bscTestnet.id]: http(IS_MAINNET ? undefined : RPC_URL),
  },
  ssr: true,
});
