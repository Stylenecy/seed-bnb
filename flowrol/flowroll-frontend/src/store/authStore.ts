import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/types'

interface AuthState {
  role: UserRole | null
  lastAddress: string | null
  setRole: (role: UserRole) => void
  setLastAddress: (address: string) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      lastAddress: null,
      setRole: (role) => set({ role }),
      setLastAddress: (address) => set({ lastAddress: address }),
      clearSession: () => set({ role: null, lastAddress: null }),
    }),
    {
      name: 'flowroll-auth',
      partialize: (state) => ({
        role: state.role,
        lastAddress: state.lastAddress,
      }),
    }
  )
)