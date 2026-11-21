# Catálogo de alertas — la única fuente de las notificaciones (commit a de 3)

**Fecha:** 2026-11-20
**Autor:** agente
**Plan de origen:** plan autorizado 2026-11-20 (catálogo en código + refactor de los 11 sitios)

## Cambios realizados
- **`apps/api/src/notificaciones/catalogo.ts` (nuevo):** el inventario
  documentado de las 12 alertas que existen hoy (clave · disparo · audiencia ·
  tipo en la tabla del encabezado), con cada definición como `{ clave, tipo,
  titulo(c), cuerpo(c), referenciaTipo }` — funciones puras del contexto; cada
  definición trunca SU cuerpo. `construirAlerta(def, ctx, referenciaId,
  creadoPor)` arma la entrada exacta que consumen `emitirA*` (sin cambiar la
  firma de ningún helper). `TipoNotificacion` NO se migra (3 valores): la
  semántica de dominio vive en la `clave` del catálogo.
- **`catalogo.spec.ts` (nuevo):** sincronía tabla↔objeto (12 claves únicas),
  tipos válidos del enum, textos armados con contexto real que coinciden con
  el copy vivo, y formato de dinero es-MX/MXN.

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores (tras unificar el contexto de cada
  definición — título y cuerpo de una misma alerta comparten `C`).
- Unit: catalogo 5/5 + notificaciones 18/18 = 23/23. `npm run build`: OK.
- `git diff --check`: sin errores.
- Aprendizaje de herramientas (documentado en el propio archivo): los edits
  masivos de texto sobre UTF-8 van SOLO por write/edit tool o node — el
  Get-Content/Set-Content de PowerShell 5.1 corrompió los acentos de este
  archivo una vez y se re-creó con el write tool.

## Archivos tocados
- `apps/api/src/notificaciones/catalogo.ts` (creado)
- `apps/api/src/notificaciones/catalogo.spec.ts` (creado)
- `historial-cambios/2026-11-20-catalogo-alertas.md` (creado)

## Pendientes y riesgos
- Los 11 sitios de emisión AÚN escriben sus textos inline: los commits (b)
  reportes-campo y (c) nómina/proveedores/ventas los migrarán al catálogo con
  textos idénticos (sin cambio de comportamiento).
- Si un día el front necesita reaccionar por TIPO de alerta, se persiste la
  `clave` en la tabla `notificaciones` — decisión futura, hoy no se necesita.
- Sin push: el commit queda local.
