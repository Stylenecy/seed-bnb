/**
 * BNB Chain configuration for the frontend (viem, read + write).
 *
 * Env (see packages/app/.env.example):
 *   VITE_EVM_CHAIN_ID        97 (BSC testnet, default) | 56 (BSC mainnet)
 *   VITE_BSC_RPC_URL         optional RPC override
 *   VITE_IPAY_POOL_ADDRESS   IPayPool contract
 *   VITE_GIFT_POOL_ADDRESS   IPayGiftPool contract
 *   VITE_IUSD_FA             ERC-20 stablecoin address (USDT on mainnet, MockERC20 on testnet)
 *   VITE_TOKEN_DECIMALS      18 for BSC USDT/USDC/FDUSD
 *   VITE_TOKEN_SYMBOL        display symbol, default USDT
 */
import { createPublicClient, http, parseAbi, type Chain } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import { ERC20_ABI, GIFT_ABI, PAY_ABI, toEvmAddress, type ContractKind } from './moveCompat'

const chainIdEnv = Number(import.meta.env.VITE_EVM_CHAIN_ID || '97')

export const EVM_CHAIN: Chain = chainIdEnv === 56 ? bsc : bscTestnet
export const EVM_CHAIN_ID = EVM_CHAIN.id
export const IS_MAINNET = EVM_CHAIN_ID === 56

export const BSC_RPC_URL: string =
  import.meta.env.VITE_BSC_RPC_URL || EVM_CHAIN.rpcUrls.default.http[0]

export const BSC_EXPLORER: string = EVM_CHAIN.blockExplorers?.default.url ?? 'https://bscscan.com'

export const TOKEN_ADDRESS = toEvmAddress(import.meta.env.VITE_IUSD_FA || '0x0')
export const TOKEN_DECIMALS = Number(import.meta.env.VITE_TOKEN_DECIMALS || '18')
export const TOKEN_SYMBOL: string = import.meta.env.VITE_TOKEN_SYMBOL || 'USDT'

export const PAY_POOL = toEvmAddress(import.meta.env.VITE_IPAY_POOL_ADDRESS || '0x0')
export const GIFT_POOL = toEvmAddress(import.meta.env.VITE_GIFT_POOL_ADDRESS || '0x0')

export const payAbi = parseAbi(PAY_ABI)
export const giftAbi = parseAbi(GIFT_ABI)
export const erc20Abi = parseAbi(ERC20_ABI)

export function contractFor(kind: ContractKind) {
  return kind === 'pay' ? { address: PAY_POOL, abi: payAbi } : { address: GIFT_POOL, abi: giftAbi }
}

export const publicClient = createPublicClient({ chain: EVM_CHAIN, transport: http(BSC_RPC_URL) })
