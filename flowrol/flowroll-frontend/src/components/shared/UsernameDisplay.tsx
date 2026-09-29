'use client'

import { useIdentity } from '@/hooks/identity/useIdentity'

interface UsernameDisplayProps {
  variant?: 'badge' | 'inline'
  showAddressTooltip?: boolean
  className?: string
}

export default function UsernameDisplay({ 
  variant = 'badge', 
  showAddressTooltip = true, 
  className = '' 
}: UsernameDisplayProps) {
  const { username, address, displayName, isConnected, isLoading } = useIdentity()

  // Loading skeleton
  if (isLoading) {
    return (
      <span className={`inline-block h-5 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse ${className}`} />
    )
  }

  if (!isConnected || !displayName) return null

  const tooltip = showAddressTooltip && address ? { title: address } : {}

  // Inline typography variant
  if (variant === 'inline') {
    return (
      <span 
        className={`font-medium transition-colors ${username ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'} ${className}`} 
        {...tooltip}
      >
        {displayName}
      </span>
    )
  }

  // High-end badge variant
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
        username 
          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
      } ${className}`}
      {...tooltip}
    >
      {username ? (
        <>
          <span>{username.replace(/\.init$/, '')}</span>
          <span className="opacity-50 text-[10px]">.init</span>
        </>
      ) : (
        <span>{displayName}</span>
      )}
    </span>
  )
}