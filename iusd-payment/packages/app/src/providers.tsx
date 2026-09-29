/**
 * App Providers — BNB Chain wallet (injected EIP-1193 via viem) + React Query.
 *
 * Chain is controlled by VITE_EVM_CHAIN_ID (97 = BSC testnet, 56 = BSC mainnet).
 * All chain constants come from src/lib/bnb/chain.ts.
 */
import { type PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BnbWalletProvider } from './lib/bnb/wallet'
import { ConfigProvider } from './hooks/useConfig'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <BnbWalletProvider>
        <ConfigProvider>
          {children}
        </ConfigProvider>
      </BnbWalletProvider>
    </QueryClientProvider>
  )
}
