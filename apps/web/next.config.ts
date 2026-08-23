import type { NextConfig } from "next";

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(',').map((origin) => origin.trim())
  : ['localhost'];

const nextConfig: NextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
