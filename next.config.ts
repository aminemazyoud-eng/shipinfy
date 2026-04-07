import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pdfkit', 'fontkit', 'nodemailer'],
};

export default nextConfig;
