/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ➜ skip ESLint errors during `next build`
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;        // for next.config.js / .cjs
// export default nextConfig;       // if you choose next.config.mjs