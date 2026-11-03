/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/futuregraph",
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
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
