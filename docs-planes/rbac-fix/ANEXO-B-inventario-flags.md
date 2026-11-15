# ANEXO B — Inventario completo de usos de flags por archivo (checklist de migración)

Barrido de `apps/web/src` (excluye mock-data) al 2026-11-15. **Cada referencia de
`puedeCrear/puedeEditar/puedeEliminar/puedeExportar` debe terminar expresada como
`puede(modulo, recurso, accion)`** al terminar el lote. `puedeVer` se queda:
es el gate legítimo del menú (`Sidebar`), del acceso a ruta (`RouteGuard`) y de
pantallas cuyo único dato es "puedo estar aquí".

Las columnas "Fase" indican en qué fase del plan principal se migra ese archivo.

| Archivo | Crear | Editar | Eliminar | Exportar | Ver | Total | Fase |
|---|---:|---:|---:|---:|---:|---:|---|
| app/(dashboard)/roles/page.tsx | 7 | 9 | 7 | 4 | 4 | 31 | F3 + F5 |
| app/(dashboard)/facturas/page.tsx | 4 | 7 | 3 | 4 | 0 | 18 | F2 |
| app/(dashboard)/trabajadores/page.tsx | 6 | 6 | 5 | 0 | 0 | 17 | F3 |
| app/(dashboard)/finanzas/page.tsx | 5 | 5 | 3 | 3 | 0 | 16 | F2 |
| app/(dashboard)/proveedores/page.tsx | 3 | 8 | 4 | 0 | 0 | 15 | F2 |
| app/(dashboard)/proyectos/page.tsx | 3 | 5 | 3 | 0 | 3 | 14 | F2 |
| app/(dashboard)/asistencia/page.tsx | 3 | 10 | 0 | 0 | 0 | 13 | F3 |
| app/(dashboard)/mantenimiento/page.tsx | 3 | 4 | 4 | 0 | 0 | 11 | F3 |
| app/(dashboard)/combustible/page.tsx | 3 | 4 | 4 | 0 | 0 | 11 | F3 |
| app/(dashboard)/nomina/page.tsx | 3 | 5 | 0 | 3 | 0 | 11 | F3 |
| app/(dashboard)/reportes/page.tsx | 3 | 6 | 2 | 0 | 0 | 11 | F2 |
| app/(dashboard)/criba/page.tsx | 3 | 4 | 3 | 0 | 0 | 10 | F2 |
| app/(dashboard)/operaciones/page.tsx | 3 | 3 | 3 | 0 | 0 | 9 | F2 |
| app/(dashboard)/dashboard/page.tsx | 0 | 0 | 0 | 0 | 9 | 9 | (Ver se queda) |
| app/(dashboard)/cobranza/page.tsx | 3 | 3 | 0 | 3 | 0 | 9 | F2 |
| app/(dashboard)/clientes/page.tsx | 3 | 3 | 3 | 0 | 0 | 9 | F2 |
| app/(dashboard)/inventario/page.tsx | 3 | 3 | 3 | 0 | 0 | 9 | F2 |
| app/(dashboard)/configuracion/page.tsx | 0 | 6 | 0 | 0 | 3 | 9 | F3 |
| app/(dashboard)/usuarios/page.tsx | 3 | 3 | 3 | 0 | 0 | 9 | F3 |
| components/finanzas/ConciliacionBancaria.tsx | 4 | 4 | 0 | 0 | 0 | 8 | F2 (finanzas) |
| app/(dashboard)/cotizaciones/page.tsx | 3 | 3 | 0 | 0 | 0 | 6 | F2 |
| components/workers/BitacorasRentaModal.tsx | 3 | 3 | 0 | 0 | 0 | 6 | F3 (trabajadores) |
| app/(dashboard)/ventas/cierres/page.tsx | 0 | 3 | 0 | 0 | 2 | 5 | F2 |
| app/(dashboard)/gps/page.tsx | 0 | 5 | 0 | 0 | 0 | 5 | F3 |
| app/(dashboard)/ventas/page.tsx | 4 | 0 | 0 | 0 | 0 | 4 | F2 |
| app/(dashboard)/maquinaria/page.tsx | 4 | 0 | 0 | 0 | 0 | 4 | F3 |
| app/(dashboard)/equipos/page.tsx | 0 | 4 | 0 | 0 | 0 | 4 | F3 |
| app/(dashboard)/ventas/corte/page.tsx | 0 | 0 | 0 | 0 | 3 | 3 | F2 |
| app/(dashboard)/horometro/page.tsx | 3 | 0 | 0 | 0 | 0 | 3 | F3 |
| components/layout/RouteGuard.tsx | 0 | 0 | 0 | 0 | 1 | 1 | (Ver se queda) |
| components/layout/Sidebar.tsx | 0 | 0 | 0 | 0 | 1 | 1 | (Ver se queda) |

**Totales:** ~267 referencias a flags; de ellas **~244 son de acción** (a migrar a
tuplas) y **~23 de `puedeVer`** (legítimas, se quedan).

## Notas de migración por archivo (casos no-CRUD)

- `roles/page.tsx`: además del gating normal, sus 31 referencias incluyen la lógica
  `soloLectura` del Administrador `es_sistema` — esa lógica **no es RBAC de permisos,
  es estado del recurso** y se queda como está (no confundir).
- `asistencia/page.tsx` (13, todo "Editar"): incluye aprobar/rechazar horas extra →
  mapear a la tupla exacta de su endpoint (verificar en el controlador al tocar).
- `gps/page.tsx` (5 "Editar"): geocercas → `maquinaria.gps.editar` (endpoint ya lo
  exige — alineado).
- `ConciliacionBancaria.tsx`: se accede desde `/finanzas` — sus 8 referencias usan
  las tuplas de `comercial.finanzas.*` (el controlador de conciliación usa
  `finanzas.ver/crear/editar`, verificado).
- `BitacorasRentaModal.tsx`: hijo de `/trabajadores` — hereda el gate del padre;
  usar las tuplas de `rrhh.trabajadores.*`.
- `equipos/page.tsx`: usa `sistema.usuarios.ver` en su endpoint (equipos controller)
  — mapear sus 4 "Editar" a la tupla del endpoint real de equipos.
- `dashboard/page.tsx`: solo `puedeVer` para secciones — si una sección consume un
  módulo con permiso propio, agregar ese gate (los stats agregados fallan en
  silencio hoy; con el banner del plan hermano se verá).
- `ventas/corte/page.tsx`: sus 3 "Ver" se quedan para la carga, pero la EJECUCIÓN
  del corte debe gatear con `comercial.ventas.crear` (ver Anexo A §11).

## Criterio de salida del lote

```powershell
# Al terminar F2+F3, este grep debe devolver SOLO: puedeVer, roles (soloLectura),
# Sidebar/RouteGuard y los usos legítimos de permisos directos:
Get-ChildItem apps\web\src -Recurse -Include *.tsx |
  Select-String -Pattern 'puedeCrear|puedeEditar|puedeEliminar|puedeExportar'
```
