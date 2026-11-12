# PWA — timeout del refresh + un solo refresh en vuelo (fin del "Cargando..." eterno)

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Diagnóstico (análisis autorizado del bug)

Al reabrir la app, `initializeAuth()` → `fetch POST /auth/refresh` **sin
timeout ni AbortController**: si algo acepta la conexión en :3001 pero
no responde (proceso Node huérfano, dev server a mitad de reinicio),
el fetch queda pending indefinidamente → `setIsInitialized(true)`
nunca corre → pantalla «Cargando...» eterna (síntoma del teléfono y
escritorio). Segundo bug relacionado (dev): StrictMode monta el
AuthProvider DOS veces → dos refresh paralelos con el mismo token
(de un solo uso) → el segundo recibe 401 y limpiaba la sesión.

## Fix

En `apps/web/src/lib/api.ts`:

1. **Timeout de 8s** (`AbortController`) en el fetch del refresh —
   al vencer se clasifica como `'red'` (sin conexión): conserva la
   sesión y la app arranca con datos cacheados en vez de congelarse.
2. **Dedupe de refresh concurrentes**: promesa compartida
   (`refreshEnCurso`) — StrictMode y los 401 simultáneos del
   interceptor comparten UNA rotación en vez de competir por el
   token de un solo uso.

## Archivos tocados

- `apps/web/src/lib/api.ts` (solo ese)

## Verificación

- `tsc --noEmit` ✅; eslint ✅.
- Prueba: reabrir la app con la API detenida → en ≤8s debe abrir con
  datos cacheados (no «Cargando...» eterno ni logout).

## Pendientes y riesgos

- Sin push (orden del usuario).
- El spinner de arranque por compilación lenta de Turbopack (dev) es
  otra vía del mismo síntoma — ruido de dev, se resuelve en producción.
