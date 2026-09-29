'use client'

import Navbar from '@/components/shared/Navbar'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
    </div>
  )
}