# 2026-11-11 — Fix review PR #18 #10: enlace del mensaje de WhatsApp con NEXT_PUBLIC_APP_URL

## Problema (review del PR #18, punto 10)

`CredencialesAccesoModal` armaba el enlace del trabajador con
`window.location.origin`: si RRHH entra al ERP por `localhost`, el trabajador
recibe un enlace que no abre en su teléfono.

## Cambios

- `CredencialesAccesoModal.tsx` — `const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || window.location.origin` y el mensaje
  usa esa variable. Sin la variable configurada, cae al origen actual
  (comportamiento anterior).
- `.env.example` — `NEXT_PUBLIC_APP_URL` documentada (URL pública que abre
  desde el teléfono: IP LAN o dominio final, nunca localhost).
- `.env` local (no trackeado) — `NEXT_PUBLIC_APP_URL=http://192.168.0.104:3000`
  (misma IP LAN que ya usa `NEXT_PUBLIC_API_URL`).

## Verificación / pruebas

- `npx tsc --noEmit` y eslint limpios en el archivo.
- Smoke manual pendiente (no hay infra front): dar de alta un trabajador con
  RRHH entrando por `localhost:3000` → el enlace del mensaje de
  WhatsApp/copiado debe ser `http://192.168.0.104:3000` (el del env).

## Pendientes / riesgos

- Si el servidor final tiene dominio, solo se actualiza el env (sin código).
- La variable se inlina en el build: cambiarla exige rebuild/restart del dev
  server de Next (no solo refresh).
