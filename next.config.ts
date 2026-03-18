import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone output for optimized Docker images (enable in Phase 6 if needed)
  // output: 'standalone',

  // Silence Prisma warnings during build
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
}

export default nextConfig
