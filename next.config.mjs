/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  compress: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.NEXT_PUBLIC_API_URL
      ].filter(Boolean)
    }
  }
};

export default nextConfig;
