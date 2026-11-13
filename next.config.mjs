/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/futuregraph",
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Bundle the OFL card fonts with the PNG share-card renderer on serverless deployments.
    outputFileTracingIncludes: {
      "/api/og": ["./src/assets/fonts/**/*"],
    },
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/futuregraph",
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
