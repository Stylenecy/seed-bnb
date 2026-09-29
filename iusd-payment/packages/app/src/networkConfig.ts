/**
 * Network Configuration (env-driven) — BNB Smart Chain.
 *
 * REST_URL is only a prefix for legacy view/balance URLs; those requests are
 * answered from BSC by src/lib/bnb/fetchShim.ts.
 */
import { EVM_CHAIN_ID, BSC_RPC_URL, BSC_EXPLORER, IS_MAINNET, TOKEN_ADDRESS } from './lib/bnb/chain'

export type Network = 'mainnet' | 'custom'

export const NETWORK: Network = IS_MAINNET ? 'mainnet' : 'custom'

export const CHAIN_ID = String(EVM_CHAIN_ID)
export const REST_URL = import.meta.env.VITE_REST_URL ?? 'https://bsc.compat.local'
export const RPC_URL = BSC_RPC_URL
export const INIT_DENOM = 'uinit' // native BNB, exposed in 6-decimal units by the fetch shim
export const EXPLORER = import.meta.env.VITE_EXPLORER_TX_BASE ?? `${BSC_EXPLORER}/tx`
export const NET_LABEL = IS_MAINNET ? 'BNB Chain' : 'BSC Testnet'

export const IUSD_FA = TOKEN_ADDRESS.toLowerCase()
export const IUSD_DENOM = `move/${IUSD_FA.replace(/^0x/, '')}`
