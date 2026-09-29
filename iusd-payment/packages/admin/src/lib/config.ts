import { EVM_CHAIN_ID, BSC_EXPLORER } from './bnb/chain'

const rawApiUrl = (import.meta.env.VITE_API_URL ?? 'https://api.iusd-pay.xyz').replace(/\/$/, '')

export const API_ORIGIN = rawApiUrl.replace(/\/v1$/, '')
export const API_V1 = `${API_ORIGIN}/v1`
export const CHAIN_ID = String(EVM_CHAIN_ID)
export const EXPLORER_BASE = (import.meta.env.VITE_EXPLORER_BASE ?? BSC_EXPLORER).replace(/\/$/, '')
