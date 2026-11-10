# Bloque 5 (parte API) review PR#17: json 15mb SOLO en adjuntos — 100 KB para el resto

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

`main.ts` tenía `json({ limit: '15mb' })` GLOBAL: login y resto de endpoints
aceptaban 15 MB de body (abuso de memoria por endpoint).

1. **Límite por ruta:**
   - `app.use('/api/reportes-campo/:id/adjuntos', json({ limit: '15mb' }))` —
     el específico primero (la evidencia base64 de 2 MB ≈ 2.7 MB sigue entrando).
   - `app.use(json({ limit: '100kb' }))` — default para TODA la API; el
     body-parser ignora requests ya parseadas (sin doble parseo).
2. **Filtro global de excepciones 413 real:** el HttpError del body-parser no
   deriva de `HttpException`, así que los 413 llegaban como 500
   INTERNAL_ERROR al frontend. Ahora `all-exceptions.filter.ts` detecta
   `type === 'entity.too.large'` y responde **413 PAYLOAD_TOO_LARGE** con el
   contrato estándar de error.

## Archivos tocados

- `apps/api/src/main.ts` (límites por ruta)
- `apps/api/src/common/filters/all-exceptions.filter.ts` (413)

## Pruebas / verificación (smoke HTTP real sobre node dist)

| Escenario | Esperado | Obtenido |
|---|---|---|
| POST login con body 200 KB | 413 | **413** ✅ |
| POST adjunto (~150 KB base64) en `/reportes-campo/:id/adjuntos` | 201 | **201** ✅ |
| PATCH general (`/reportes-campo/:id`) con 200 KB | 413 | **413** ✅ |
| Login normal (body chico) | 200 | **200** ✅ |
| Limpieza del reporte de humo (DELETE) | 200 | **200** ✅ |

- `tsc --noEmit` API OK; `npm run build` OK; specs de `src/common` 9/9.

## Pendientes y riesgos

- **Sin push (orden del usuario)** — commit local.
- La parte de FRONT de bloque 5 (AbortController + candado Aceptar + toasts en
  /reportes) sigue abierta — se hace a continuación.
- Un adjunto por HTTP ya no cabría si alguien intenta mandar 5 imágenes en-US
  un solo request: ahora el tope de 4 adjuntos/insidente + el tope de 2 MB
  por imagen y 15 MB por request forman la defensa en capas.
