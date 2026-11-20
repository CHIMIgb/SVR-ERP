# Límite de fotos 2 MB → 10 MB + reducción a 2048px

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** pedido del usuario — «2 MB es muy poco para una foto tomada desde un teléfono actual»

## Cambios realizados
- **Server (una sola fuente):** `MAX_BYTES_DECODIFICADOS_ADJUNTO` en
  `dto/adjunto.dto.ts` 2 MB → **10 MB** — el cap de base64 del DTO
  (`13,981,014 chars`) y el chequeo `ADJUNTO_MUY_GRANDE` del service se
  derivan de esa constante. Mensajes actualizados a 10 MB.
- **Cliente:** `MAX_TAMANO_IMAGEN` en `lib/imagenes.ts` 2 MB → 10 MB; hints
  «10 MB cada una» en el modal de la PWA y los dos del escritorio; toasts
  «excede el máximo de 10 MB».
- **Downscale (recomendado y aprobado):** `convertirAWebp` reduce el lado
  mayor a **2048 px** antes de comprimir (canvas re-dimensionado, calidad
  0.85 igual). Una foto de 12 MP queda en ~2048×1536 → WebP de ~300-800 KB:
  las fotos de teléfono prácticamente SIEMPRE pasan el tope, se suben rápido
  y el detalle carga ligero. Comparte escritorio + PWA (misma función).
- **Tests actualizados:** DTO spec («rechaza datos por arriba del tope de
  10 MB»: 14M chars ≈ 10.5 MB decodificados) y service spec
  («ADJUNTO_MUY_GRANDE» con 14 × 1024 × 1024 chars de base64).

## Verificación / pruebas
- `npx prisma validate`: OK. `npm run build`: OK.
- Unit reportes-campo: 112/112. Integración: 38/38 (BD real).
- Web: `npx tsc --noEmit` 0 errores; lint 0 errores / 37 warnings.
- `git diff --check`: sin errores.
- Incidente con PowerShell 5.1 durante este cambio: un replace masivo por
  consola corrompió los acentos de 3 archivos (leía UTF-8 como ANSI) — se
  restauró con `git checkout` y se re-aplicó con herramientas UTF-8 seguras
  (edit tool). Verificado que el diff solo contiene los cambios esperados.

## Archivos tocados
- `apps/api/src/reportes-campo/dto/adjunto.dto.ts`
- `apps/api/src/reportes-campo/reportes-campo.service.ts` (mensaje 10 MB)
- `apps/api/src/reportes-campo/dto/create-reporte-campo.dto.spec.ts`
- `apps/api/src/reportes-campo/reportes-campo.service.spec.ts`
- `apps/web/src/lib/imagenes.ts`
- `apps/web/src/components/pwa/ModalNuevoReporte/ModalNuevoReporte.tsx`
- `apps/web/src/app/(pwa)/m/reportes/page.tsx` (toast)
- `apps/web/src/app/(dashboard)/reportes/page.tsx` (toasts + hints)
- `historial-cambios/2026-11-20-limite-fotos-10mb.md` (creado)

## Pendientes y riesgos
- **Transporte:** cuando exista nginx/Railway, `client_max_body_size` debe
  admitir ~14 MB (10 MB decodificados ≈ 13.4 MB de base64); hoy no hay proxy.
- El downscale cambia el comportamiento del escritorio también (misma
  función): las fotos que el escritorio subía a resolución original ahora
  bajan a 2048px — mejor para storage y detalle, pero es un cambio visible
  en imágenes ya subidas que se re-suban.
- Sin push: el commit queda local.
