import type { NextConfig } from "next";

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(',').map((origin) => origin.trim())
  : ['localhost'];

/**
 * Proxy de la API en dev (mixed content): con la API en RUTA RELATIVA
 * (`NEXT_PUBLIC_API_URL=/api`), el navegador solo habla HTTPS con este
 * origin y Next proxy-ea server-side a `API_PROXY_DESTINATION` (.env local).
 * La ruta NO va hardcodeada: sale del .env. En producción la URL es absoluta
 * (y no hay destino configurado) → el rewrite NO existe.
 */
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const destinoProxy = process.env.API_PROXY_DESTINATION ?? "";
const proxyActivo = apiUrl.startsWith("/api") && destinoProxy.length > 0;

const nextConfig: NextConfig = {
  allowedDevOrigins,
  ...(proxyActivo && {
    async rewrites() {
      return [
        {
          source: `${apiUrl}/:path*`,
          destination: `${destinoProxy}/:path*`,
        },
      ];
    },
  }),
};

export default nextConfig;
