import type { NextConfig } from "next";

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(',').map((origin) => origin.trim())
  : ['localhost'];

/**
 * Proxy de la API en dev (mixed content): con la API en RUTA RELATIVA
 * (`NEXT_PUBLIC_API_URL=/api`), el navegador solo habla HTTPS con este
 * origin y Next proxy-ea al API local (server-side, sin reglas de mixed
 * content). En producción la URL es absoluta → el rewrite NO existe.
 */
const esApiPorRuta = (process.env.NEXT_PUBLIC_API_URL ?? "").startsWith("/api");

const nextConfig: NextConfig = {
  allowedDevOrigins,
  ...(esApiPorRuta && {
    async rewrites() {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:3001/api/:path*",
        },
      ];
    },
  }),
};

export default nextConfig;
