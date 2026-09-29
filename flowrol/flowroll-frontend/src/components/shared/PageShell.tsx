interface Props {
  children: React.ReactNode
  className?: string
}

// Wraps page content with consistent max-width and padding.
export default function PageShell({ children, className = '' }: Props) {
  return (
    <main className={`max-w-7xl mx-auto px-4 py-5 ${className}`}>
      {children}
    </main>
  )
}