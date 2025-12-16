import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // 优化生产构建
  reactStrictMode: true,
  
  // 图片优化（如果将来需要）
  images: {
    domains: [], // 如果使用外部图片，添加域名
  },
  
  // 输出配置（Vercel 自动处理）
  output: 'standalone',
  

};

export default nextConfig;
