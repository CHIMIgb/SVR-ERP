# Anexos documentados del plan RBAC de acciones universal

**Fecha:** 2026-11-15
**Autor:** Agente (solo documentación, sin código)

## Cambios realizados
- Carpeta `docs-planes/rbac-fix/` con los 4 anexos pedidos del plan principal:
  - `README.md` (índice + regla general)
  - `ANEXO-A-mapeo-acciones-opscom.md`: mapeo botón→tupla de las 13 vistas
    Comercial/Operaciones (fase F2), derivado de los controladores verificados +
    los métodos `xxxApi` que llama cada página. Incluye 5 decisiones pendientes
    (D1–D5) por dependencias cross-módulo descubiertas: OC necesita
    `inventario.ver` (picker de artículos), asignar reportes necesita
    `trabajadores.ver`, criba necesita `flota.ver`/`proyectos.ver` en filtros,
    ficha de clientes consume `cotizaciones.*`, y exports client-side.
  - `ANEXO-B-inventario-flags.md`: barrido completo de ~267 referencias a flags
    por archivo (244 de acción a migrar, 23 de `puedeVer` que se quedan), con
    notas de migración por archivo y el grep de criterio de salida.
  - `ANEXO-C-roles-ui-f5.md`: detalle de UI de `/roles` — ficha de vista queda
    solo con `puedeVer` (se reenvían los valores guardados para no tocar el DTO),
    pestaña Permisos como única fuente de acciones, sin cambios de backend.
  - `ANEXO-D-smoke-por-fase.md`: rol de prueba QA-Sin-Acciones/QA-Con-Acciones y
    checklist por vista/fase, incluido el caso semilla (Sincronizar asistencia
    solo con `nomina.procesar`).

## Archivos tocados
- `docs-planes/rbac-fix/README.md` (nuevo)
- `docs-planes/rbac-fix/ANEXO-A-mapeo-acciones-opscom.md` (nuevo)
- `docs-planes/rbac-fix/ANEXO-B-inventario-flags.md` (nuevo)
- `docs-planes/rbac-fix/ANEXO-C-roles-ui-f5.md` (nuevo)
- `docs-planes/rbac-fix/ANEXO-D-smoke-por-fase.md` (nuevo)

## Verificación
- Solo documentación: no se tocó código; no aplica tsc/eslint/tests.
- Los números de referencia (líneas de checkboxes de /roles, endpoints, tuplas)
  corresponden al árbol al 2026-11-15 y fueron verificados contra el código.

## Pendientes / riesgos
- Plan sigue PROPUESTO: nada se ejecuta sin autorización.
- Decisiones D1–D5 (Anexo A) deben resolverse antes de implementar F2.
- F5 depende de F2; sin F5 la pantalla /roles deja de tener efecto sobre botones.
