/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_CHAIN_ID?: string
  readonly VITE_EXPLORER_BASE?: string
  // BNB Chain
  readonly VITE_EVM_CHAIN_ID?: string
  readonly VITE_BSC_RPC_URL?: string
  readonly VITE_IPAY_POOL_ADDRESS?: string
  readonly VITE_GIFT_POOL_ADDRESS?: string
  readonly VITE_IUSD_FA?: string
  readonly VITE_TOKEN_DECIMALS?: string
  readonly VITE_TOKEN_SYMBOL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
