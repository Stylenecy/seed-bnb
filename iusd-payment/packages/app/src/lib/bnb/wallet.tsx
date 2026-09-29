/**
 * BNB Chain wallet provider — replaces InterwovenKit.
 *
 * Uses any injected EIP-1193 wallet (MetaMask, Trust Wallet, Binance Web3
 * Wallet, OKX, ...) through viem. `useInterwovenKit()` is kept as a
 * compatible hook so the existing pages keep working unchanged; the fields
 * that only made sense on Initia (bridge, auto-sign, .init usernames) are
 * stubbed.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { createWalletClient, custom, numberToHex, type WalletClient } from 'viem'
import { BSC_EXPLORER, BSC_RPC_URL, EVM_CHAIN, EVM_CHAIN_ID, IS_MAINNET, TOKEN_ADDRESS } from './chain'
import { executeMessages, type TxBlockResult } from './executor'

type Hex = `0x${string}`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eth = (): any => (typeof window !== 'undefined' ? (window as any).ethereum : undefined)

const DISCONNECT_KEY = 'ipay_bnb_disconnected'
const FAUCET_URL = 'https://www.bnbchain.org/en/testnet-faucet'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Msgs = { messages: any[]; memo?: string; [k: string]: unknown }

export interface BnbWallet {
  address: string
  /** kept for InterwovenKit compatibility; same 0x address on BNB Chain */
  initiaAddress: string
  hexAddress: string
  username: string | null
  isLoading: boolean
  isConnected: boolean
  chainId: number
  openConnect: () => Promise<void>
  disconnect: () => void
  openWallet: () => void
  openDeposit: () => void
  openWithdraw: () => void
  openBridge: () => void
  requestTxBlock: (tx: Msgs) => Promise<TxBlockResult>
  submitTxBlock: (tx: Msgs) => Promise<TxBlockResult>
  estimateGas: (tx: Msgs) => Promise<number>
  offlineSigner: { signMessage: (message: string) => Promise<string> } | null
  autoSign: {
    isLoading: boolean
    isEnabledByChain: Record<string, boolean>
    enable: (chainId?: string) => Promise<void>
    disable: (chainId?: string) => Promise<void>
  }
}

const Ctx = createContext<BnbWallet | null>(null)

async function ensureChain(): Promise<void> {
  const provider = eth()
  if (!provider) return
  const current = await provider.request({ method: 'eth_chainId' })
  if (Number(current) === EVM_CHAIN_ID) return
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: numberToHex(EVM_CHAIN_ID) }] })
  } catch (e: unknown) {
    if ((e as { code?: number })?.code !== 4902) throw e
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: numberToHex(EVM_CHAIN_ID),
          chainName: EVM_CHAIN.name,
          nativeCurrency: EVM_CHAIN.nativeCurrency,
          rpcUrls: [BSC_RPC_URL],
          blockExplorerUrls: [BSC_EXPLORER],
        },
      ],
    })
  }
}

export function BnbWalletProvider({ children }: PropsWithChildren) {
  const [address, setAddress] = useState<Hex | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const provider = eth()
    if (!provider) {
      setIsLoading(false)
      return
    }
    const onAccounts = (accs: string[]) => setAddress(accs?.[0] ? (accs[0].toLowerCase() as Hex) : null)
    let silent = false
    try {
      silent = localStorage.getItem(DISCONNECT_KEY) === '1'
    } catch {
      /* storage unavailable */
    }
    if (!silent) {
      provider
        .request({ method: 'eth_accounts' })
        .then(onAccounts)
        .catch(() => {})
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
    provider.on?.('accountsChanged', onAccounts)
    return () => provider.removeListener?.('accountsChanged', onAccounts)
  }, [])

  const walletClient: WalletClient | null = useMemo(() => {
    const provider = eth()
    return provider ? createWalletClient({ chain: EVM_CHAIN, transport: custom(provider) }) : null
  }, [])

  const openConnect = useCallback(async () => {
    const provider = eth()
    if (!provider) {
      window.open('https://www.bnbchain.org/en/wallets', '_blank', 'noopener')
      throw new Error('No BNB Chain wallet found. Install MetaMask, Trust Wallet or Binance Web3 Wallet.')
    }
    const accs: string[] = await provider.request({ method: 'eth_requestAccounts' })
    await ensureChain()
    try {
      localStorage.removeItem(DISCONNECT_KEY)
    } catch {
      /* ignore */
    }
    setAddress(accs?.[0] ? (accs[0].toLowerCase() as Hex) : null)
  }, [])

  const disconnect = useCallback(() => {
    try {
      localStorage.setItem(DISCONNECT_KEY, '1')
    } catch {
      /* ignore */
    }
    setAddress(null)
  }, [])

  const requestTxBlock = useCallback(
    async (tx: Msgs) => {
      if (!walletClient || !address) throw new Error('Wallet not connected')
      await ensureChain()
      return executeMessages(walletClient, address, tx.messages)
    },
    [walletClient, address],
  )

  const offlineSigner = useMemo(
    () =>
      walletClient && address
        ? { signMessage: (message: string) => walletClient.signMessage({ account: address, message }) }
        : null,
    [walletClient, address],
  )

  const value: BnbWallet = {
    address: address ?? '',
    initiaAddress: address ?? '',
    hexAddress: address ?? '',
    username: null,
    isLoading,
    isConnected: !!address,
    chainId: EVM_CHAIN_ID,
    openConnect,
    disconnect,
    openWallet: () => address && window.open(`${BSC_EXPLORER}/address/${address}`, '_blank', 'noopener'),
    // No Interwoven bridge on BNB Chain: testnet -> faucet, mainnet -> token page (buy/bridge USDT elsewhere).
    openDeposit: () => window.open(IS_MAINNET ? `${BSC_EXPLORER}/token/${TOKEN_ADDRESS}` : FAUCET_URL, '_blank', 'noopener'),
    openWithdraw: () => address && window.open(`${BSC_EXPLORER}/address/${address}`, '_blank', 'noopener'),
    openBridge: () => window.open('https://www.bnbchain.org/en/bnb-chain-bridges', '_blank', 'noopener'),
    requestTxBlock,
    submitTxBlock: requestTxBlock,
    estimateGas: async () => 0,
    offlineSigner,
    autoSign: {
      isLoading: false,
      isEnabledByChain: {},
      enable: async () => {
        throw new Error('Auto-sign is not available on BNB Chain')
      },
      disable: async () => {},
    },
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Drop-in replacement for InterwovenKit's hook. */
export function useInterwovenKit(): BnbWallet {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useInterwovenKit must be used inside <BnbWalletProvider>')
  return ctx
}
