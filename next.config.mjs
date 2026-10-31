/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  optimizeFonts: false,
  experimental: {
    outputFileTracingIncludes: {
      '/**': ['./prisma/dev.db', './prisma/schema.prisma'],
    },
  },
};

export default nextConfig;
