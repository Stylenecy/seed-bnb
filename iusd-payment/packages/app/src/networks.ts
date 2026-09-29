/**
 * Network Configuration — BNB Smart Chain.
 *
 * Frontend runtime values come from VITE_* envs (see src/lib/bnb/chain.ts).
 */
import { BSC_EXPLORER, BSC_RPC_URL, EVM_CHAIN, EVM_CHAIN_ID, TOKEN_ADDRESS } from './lib/bnb/chain'

export interface NetworkConfig {
  name: string
  chainId: string
  rpcUrl: string
  restUrl: string
  explorerUrl: string
  insContract: string
  iusdFa: string
  iusdDenom: string
  iusdDecimals: number
}

const iusdFa = TOKEN_ADDRESS.toLowerCase()

export const NETWORK: NetworkConfig = {
  name: EVM_CHAIN.name,
  chainId: String(EVM_CHAIN_ID),
  rpcUrl: BSC_RPC_URL,
  restUrl: import.meta.env.VITE_REST_URL || 'https://bsc.compat.local',
  explorerUrl: import.meta.env.VITE_EXPLORER_BASE || BSC_EXPLORER,
  insContract: '', // no .init username service on BNB Chain
  iusdFa,
  iusdDenom: `move/${iusdFa.replace(/^0x/, '')}`,
  // App-internal amounts stay in 6-decimal micro units; the BNB adapter scales to the token's 18 decimals.
  iusdDecimals: 6,
}

export const CHAIN_ID = NETWORK.chainId
export const RPC_URL = NETWORK.rpcUrl
export const REST_URL = NETWORK.restUrl
export const INS_CONTRACT = NETWORK.insContract
export const IUSD_FA = NETWORK.iusdFa
export const IUSD_DENOM = NETWORK.iusdDenom
export const IUSD_DECIMALS = NETWORK.iusdDecimals
