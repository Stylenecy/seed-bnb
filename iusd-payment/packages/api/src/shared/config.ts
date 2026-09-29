/**
 * iPay API — Central Configuration.
 * Single source of truth for all env vars. Import from here, don't read process.env directly.
 */

// Chain — BNB Smart Chain (97 testnet default, 56 mainnet)
export const EVM_CHAIN_ID = parseInt(process.env.EVM_CHAIN_ID || '97', 10)
export const CHAIN_ID = process.env.CHAIN_ID || String(EVM_CHAIN_ID)
export const RPC_URL  = process.env.BSC_RPC_URL || process.env.RPC_URL || ''
// Only used as a prefix for legacy Initia-REST-shaped lookups, which lib/bnb/evm.ts serves from BSC.
export const REST_URL = process.env.REST_URL || 'https://bsc.compat.local'

// Addresses
export const MODULE_ADDRESS    = process.env.MODULE_ADDRESS || ''
export const IPAY_POOL_ADDRESS = process.env.IPAY_POOL_ADDRESS || ''
export const GIFT_POOL_ADDRESS = process.env.GIFT_POOL_ADDRESS || ''
export const RELAYER_ADDRESS   = process.env.RELAYER_ADDRESS || ''
export const TREASURY_ADDRESS  = process.env.TREASURY_ADDRESS || ''
export const DEPLOYER_ADDRESS  = process.env.DEPLOYER_ADDRESS || ''

// Assets — IUSD_FA holds the ERC-20 stablecoin address (USDT on mainnet, MockERC20 on testnet)
export const IUSD_FA = process.env.IUSD_FA || ''
export const TOKEN_DECIMALS = parseInt(process.env.TOKEN_DECIMALS || '18', 10)

// Relayer
export const RELAYER_MNEMONIC = process.env.RELAYER_MNEMONIC || ''
export const RELAYER_PAY_COUNT = parseInt(process.env.RELAYER_PAY_COUNT || '1', 10)
export const RELAYER_GIFT_COUNT = parseInt(process.env.RELAYER_GIFT_COUNT || '1', 10)
export const RELAYER_SWEEP_COUNT = parseInt(process.env.RELAYER_SWEEP_COUNT || '1', 10)
export const RELAYER_MNEMONICS_PAY = process.env.RELAYER_MNEMONICS_PAY || ''
export const RELAYER_MNEMONICS_GIFT = process.env.RELAYER_MNEMONICS_GIFT || ''
export const RELAYER_MNEMONIC_SWEEP = process.env.RELAYER_MNEMONIC_SWEEP || ''

// Security
export const SERVER_SECRET = process.env.SERVER_SECRET || ''
export const JWT_SECRET    = process.env.JWT_SECRET || process.env.ADMIN_KEY || ''
export const ADMIN_KEY     = process.env.ADMIN_KEY || ''

// App
export const APP_URL = process.env.APP_URL || 'https://iusd-pay.xyz'
export const PORT    = parseInt(process.env.PORT || '3001', 10)
