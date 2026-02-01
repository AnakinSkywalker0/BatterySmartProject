/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Keep native better-sqlite3 out of the bundle so .node bindings load from node_modules
  serverExternalPackages: ['better-sqlite3', '@prisma/adapter-better-sqlite3'],
}

export default nextConfig
