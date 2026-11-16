# Imagen de producción del web (Next.js) para Railway — el build pesado corre
# en GitHub Actions (los runners de Railway del plan gratis no tienen RAM
# suficiente para `next build` de este monorepo). Railway solo descarga y
# ejecuta la imagen final.
# Build/Push: .github/workflows/build-web.yml → ghcr.io/chimigb/svr-erp-web

# ── Etapa 1: dependencias del workspace (web + shared) ──────────────────────
FROM node:26-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
# npm install (NO npm ci): el lockfile generado en Windows omite las entradas
# packages/ de las variantes NATIVAS de Linux (npm/cli#4828) — lightningcss,
# @tailwindcss/oxide, sharp… — y npm ci no las instala (build muere con
# "Cannot find native binding"). npm install dentro del contenedor Linux llena
# los huecos de plataforma con las mismas versiones del lockfile.
RUN npm install

# ── Etapa 2: build del web (aquí es donde Railway se quedaba sin memoria) ───
FROM node:26-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
ENV NEXT_TELEMETRY_DISABLED=1
# Las NEXT_PUBLIC_* se hornean en build time — las pasa el workflow de Actions
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_TZ
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_TZ=$NEXT_PUBLIC_TZ
RUN npx turbo run build --filter=web

# ── Etapa 3: runtime limpio (solo lo que `next start` necesita) ─────────────
FROM node:26-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/web/next.config.ts ./apps/web/next.config.ts
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "apps/web"]
