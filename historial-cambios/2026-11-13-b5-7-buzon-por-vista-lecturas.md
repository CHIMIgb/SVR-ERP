# 2026-11-13 — B5.7: buzón por ACCESO A VISTA + fix del filtro de audiencia + lecturas por usuario en el backend

## Qué se hizo

Corrección mayor del módulo notificaciones, con 3 piezas:

1. **BUG raíz (confirmado en vivo):** el controller leía el JWT como
   `req.user.userId` — el estándar del repo es `req.user.id`. Con `undefined`,
   la consulta de roles ignoraba el filtro y devolvía los roles de TODOS →
   **todos veían todas las notificaciones** (admin veía lo de rrhh y
   viceversa; verificado por el usuario y por smoke). Corregido a `user.id`.

2. **Filtro de visibilidad del buzón por ACCESO A VISTA** (propuesta del
   cliente, ya presente en el spec F1 §5): mapa `referencia_tipo → ruta`
   (`ordenes_compra`/`pagos_proveedor` → `/proveedores`, `cierres_caja` →
   `/ventas`, `periodos_nomina` → `/nomina`). El buzón consulta
   `role_vistas` (puede_ver) de los roles activos del usuario y solo incluye
   los tipos cuya vista puede ver. `marcarTodas`, `descartarTodas` y el
   conteo `noLeidas` usan el MISMO filtro (antes marcaban/descartaban cosas
   invisibles).

3. **Lecturas por usuario (Opción A, tabla `notificaciones_lecturas`):**
   - `marcarLeida` / `marcarTodas` → upsert/createMany de lecturas del
     usuario (leído deja de ser compartido por rol).
   - `descartarTodas` → descarta SOLO para el usuario (la basura ya no oculta
     para todo el rol).
   - El actor (creado_por) NO ve su propia notificación (excluido en el
     filtro y en el conteo).
   - `users_roles` filtrando `activo: true`.

## Verificación

- `npx tsc --noEmit` (api): limpio.
- Unit `src/notificaciones`: **12/12** (visibilidad en el AND del where,
  actor excluido, sin vista visible → solo tipos sin referencia, lecturas por
  usuario, marcadas solo faltantes, descarte por usuario).
- Suite de los 4 módulos tocados: **203/203**.
- Smoke real: OC aprobada por admin → admin la ve 0 (es el actor ✓)… y rrhh
  también 0 — **hallazgo:** el rol Administrativo NO tiene /proveedores en
  `role_vistas` (solo dashboard/trabajadores/asistencia/nómina/reportes), así
  que con el filtro por vista las notificaciones de órdenes/abonos no tienen
  receptor. DECISIÓN PENDIENTE DEL CLIENTE: (a) dar /proveedores a
  Administrativo, (b) apuntar esos eventos también a Administrador, o (c)
  dejar solo nómina para Administrativo.

## Pendientes / riesgos

- La decisión de arriba (es RBAC/negocio, no del dev).
- Smoke visual del centro pendiente.
