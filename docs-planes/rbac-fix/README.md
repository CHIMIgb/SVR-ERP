# Índice — /rbac-fix (anexos del plan RBAC de acciones universal)

**Plan principal:** [`docs-planes/PLAN-RBAC-ACCIONES-UNIVERSAL-2026-11-15.md`](../PLAN-RBAC-ACCIONES-UNIVERSAL-2026-11-15.md)
**Plan hermano:** `docs-planes/PLAN-BANNER-ERRORS-CARGA-2026-11-15.md`

| Anexo | Contenido |
|---|---|
| `ANEXO-A-mapeo-acciones-opscom.md` | Mapeo botón→tupla de las 13 vistas de Comercial/Operaciones (fase F2) + dependencias cross-módulo |
| `ANEXO-B-inventario-flags.md` | Inventario completo de usos de flags por archivo (checklist de migración) |
| `ANEXO-C-roles-ui-f5.md` | Detalle de UI de `/roles` para la fase F5 |
| `ANEXO-D-smoke-por-fase.md` | Checklists de verificación por fase |

Regla general que rige todo el lote: **cada botón/acción usa la tupla EXACTA
`(modulo, recurso, accion)` que exige su endpoint** — nunca un flag de vista,
nunca un permiso prestado.
