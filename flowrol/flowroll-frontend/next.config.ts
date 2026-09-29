import type { NextConfig } from 'next'
import path from 'path'


const nextConfig: NextConfig = {

  experimental: {
    taint: true, // This forces Next.js to use experimental React features
  },
}

export default nextConfig