'use client'

import Navbar from '@/components/shared/Navbar'

// Main layout wrapper for all employee-facing pages
export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-900">
      {/* Global navigation bar */}
      <Navbar />
      
      {/* Page content area */}
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}