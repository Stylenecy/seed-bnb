import { type PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BnbWalletProvider } from './lib/bnb/wallet'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// BNB Chain: injected EIP-1193 wallet via viem (see src/lib/bnb/wallet.tsx)
export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <BnbWalletProvider>{children}</BnbWalletProvider>
    </QueryClientProvider>
  )
}
