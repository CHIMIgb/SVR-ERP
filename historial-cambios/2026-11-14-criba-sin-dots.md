# 2026-11-14 — /criba: sin puntos de color en los títulos de las KPIs por material

## Qué se hizo

- **`apps/web/src/app/(dashboard)/criba/page.tsx`** — los **puntos de color**
  (dot) antes de los títulos de las KPIs por material (Criba fina / Criba
  gruesa / Arena lavada) quedaron eliminados, igual que los badges y colores
  de texto del ajuste anterior. Se eliminó el mapa `materialDot` (sin uso).
  Los títulos quedan solos: "Criba fina — Efic. X%".

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` del archivo: solo el error preexistente de
  `set-state-in-effect`.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador).
