'use client'

import { useCallback } from 'react'
import { injected, useAccount, useChainId, useConnect, useDisconnect } from 'wagmi'
import type { IdentityState } from '@/types'
import { truncateAddress } from '@/lib/utils'

// Wallet identity via wagmi (replaces InterwovenKit + .init usernames).
export function useIdentity(): IdentityState {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const chainId = useChainId()

  const isLoading = (isConnecting || isReconnecting) && !isConnected
  const displayName = address ? truncateAddress(address) : null

  return {
    address,
    // BNB Chain has no native username registry wired in (was Initia .init).
    // TODO(bnb): optionally resolve Space ID (.bnb) names here.
    username: null,
    displayName,
    isConnected,
    isLoading,
    chainId,
  }
}

// Wallet actions (injected wallets: MetaMask, Binance Web3 Wallet, Trust, Rabby…)
export function useWalletActions() {
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  const openConnect = useCallback(() => connect({ connector: injected() }), [connect])
  // Clicking the connected pill disconnects (no hosted wallet drawer on BSC).
  const openWallet = useCallback(() => disconnect(), [disconnect])

  return { openConnect, openWallet }
}
