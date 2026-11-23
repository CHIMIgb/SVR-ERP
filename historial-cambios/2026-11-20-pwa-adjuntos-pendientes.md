# 2026-11-20 — Cola PWA: los adjuntos que fallan ya no borran las fotos (bloqueante 1 PR #23)

## Cambios realizados

**Bloqueante 1 de la review del PR #23:** `apiClient.post` no lanza ante un error HTTP
(devuelve `{ success: false }`), así que un 403/413/422 al adjuntar una foto no caía en el
`catch`; un error de red solo quedaba en `console.warn`. En ambos casos se ejecutaba
`marcarEnviada(item.id)`, que **borraba de IndexedDB el item con las fotos dentro** — el
reporte quedaba sin evidencia y nadie se enteraba.

Fix:
- El item ahora rastrea qué fotos **faltan** por subir (`adjuntosPendientes`: índices sobre
  el array `adjuntos`, que nunca se muta — índices y no nombres porque dos fotos pueden
  compartir nombre).
- Cada adjunto se revisa por `res.success`; el item **solo se elimina cuando todas las
  fotos subieron**. Si faltan, queda en la cola para reintentar SOLO las faltantes (evita
  duplicar evidencia en el reenvío: la idempotencia cubre el reporte, no los adjuntos).
- El error de red en un adjunto (apiClient lanza) se captura por índice y conserva los
  pendientes — sin eso, un throw a mitad del ciclo escapaba al `catch` exterior y
  re-subiría fotos ya subidas.
- Caso defensivo ahora cubierto: item con adjuntos y respuesta del alta sin `id` — antes
  borraba el item con las fotos dentro; ahora las conserva como pendientes.
- El reenvío del alta es seguro porque el backend devuelve el reporte original con
  `success` ante la misma `idempotenciaKey` (`reportes-campo.service.create`, línea 550).

## Cosas nuevas

- `ElementoCola.adjuntosPendientes?: number[]` (apps/web/src/lib/pwa/offline.ts).
- `guardarAdjuntosPendientes(id, indices)` en offline.ts: persiste los índices faltantes
  con estado `error` (el reporte ya existe; solo faltan fotos).
- Etiqueta nueva en `EstadoCola`: "Falta(n) N foto(s)" (variante warning) cuando el item
  tiene fotos pendientes — antes mostraría "Error de red", que mentiría (el reporte ya
  está registrado). `conflicto` conserva su precedencia.
- `moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }` en apps/web/jest.config.ts:
  el alias `@/` de tsconfig no lo mapeaba next/jest (los tests previos usaban imports
  relativos). 1 línea de infra necesaria para el test nuevo; no afecta los existentes.

## Archivos tocados

- `apps/web/src/lib/pwa/offline.ts` — interfaz + helper nuevo.
- `apps/web/src/lib/pwa/sincronizador.ts` — revisión de `res.success` por adjunto,
  borrado condicional, reenvío solo de faltantes.
- `apps/web/src/components/pwa/EstadoCola/EstadoCola.tsx` — etiqueta de fotos pendientes.
- `apps/web/jest.config.ts` — moduleNameMapper del alias `@/`.
- `apps/web/src/lib/pwa/sincronizador.test.ts` — NUEVO, 4 tests.

## Verificación / pruebas

- `npx jest src/lib/pwa/sincronizador.test.ts` → 4/4:
  1. adjunto con `success:false` NO elimina el item (queda con las faltantes).
  2. error de red (throw) tras una foto subida NO elimina el item ni pierde la subida.
  3. todas las fotos suben → `marcarEnviada` (item borrado).
  4. reenvío solo intenta las fotos FALTANTES (no duplica las ya subidas).
- `npm test` (apps/web, suite completa) → 8/8.
- `npx tsc --noEmit` (apps/web) → limpio.
- `npm run lint` (apps/web) → 0 errores, 38 warnings (37 del baseline + 1 preexistente
  de la rama; los archivos tocados no generan ninguno).

## Pendientes / riesgos

- Smoke manual en dispositivo pendiente (capturar con señal débil y verificar que el
  item queda como "Falta(n) N foto(s)" y no se pierde la evidencia).
- Una foto que falla por validación permanente (422, ej. mime no soportado) se reintenta
  cada 2 min indefinidamente: el estado terminal "rechazado" y el tope de intentos son el
  **punto 5** de la review (mismo archivo del sincronizador).
- Los items antiguos de la cola (sin `adjuntosPendientes`) se tratan como "todas las
  fotos pendientes": si un item quedara a medias de una versión anterior del PR,
  re-subiría las ya subidas. No existe ese estado en producción (el PR no está
  desplegado), pero hay que tenerlo presente en pruebas con datos viejos.
