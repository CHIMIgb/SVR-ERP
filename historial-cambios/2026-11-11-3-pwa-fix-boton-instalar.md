# PWA — fix del botón «Instalar»: el script de captura no estaba en el HTML del server

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios realizados

**Diagnóstico (verificado contra el server real):** el HTML que Chrome
parsea al entrar a `/m` NO contenía el script de captura de
`beforeinstallprompt` (`scriptCaptura: false` en el fetch). Causa: el
guard de sesión del layout `(pwa)` tiene return temprano (mientras
`isInitialized=false` solo renderiza el `LoadingState`) y el script
estaba SOLO en el return autenticado → se agregaba al DOM después de la
hidratación/auth check → el evento (que se dispara una vez al cargar)
ya se había perdido → `window.__svrPrompt` siempre `null` →
`instalarApp()` devolvía `false` y el modal caía al fallback del ⋮.

**Fix:**

1. El script de captura pasó a `const scriptCaptura` renderizado en
   **AMBAS ramas** del layout (la de carga incluida) → vive en el HTML
   del server → corre al parsear, antes de que el evento dispare.
2. El script ahora también registra `/sw.js` al parsear (Chrome espera
   el SW activo antes de disparar el evento — así puede dispararlo
   cuanto antes). El registro del effect queda (idempotente).
3. Verificación post-fix contra el server: `scriptCaptura: true` ✅.

## Archivos tocados

- `apps/web/src/app/(pwa)/layout.tsx` (script hoisted a ambas ramas + registro SW inline)

## Pruebas / verificación

- `tsc --noEmit` ✅; eslint ✅.
- Fetch HTTPS real del `/m` servido: el script está en el HTML ✅.
- Verificación final del diálogo nativo: en el teléfono (recargar la
  PWA, modal → Instalar).

## Pendientes y riesgos

- Sin push (orden del usuario).
- Si el teléfono ya desinstaló la app recientemente, Chrome puede aplicar
  su enfriamiento de instalación — en ese caso el modal muestra la salida
  del menú ⋮ (comportamiento esperado, no bug).
