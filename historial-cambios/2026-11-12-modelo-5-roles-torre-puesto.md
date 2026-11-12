# 2026-11-12 — Modelo de 5 roles: consolidación + torre al puesto (decisión del SVR)

## Decisión del cliente (12-nov)

Solo deben existir 5 roles de negocio — **Administrativo, Residente,
Cobrador, Técnico, Trabajador** — y dentro de ellos los **puestos** (en
Técnico: mecánico, diésel, soldador, mantenimiento…). La **torre** (área que
atiende los reportes de campo: MECANICO/DIESEL/SOLDADOR/MANTENIMIENTO/
RESIDENTE/ADMINISTRATIVO) pasa al **puesto**, y RRHH colapsa dentro de
Administrativo. Limpieza del residuo de pruebas incluida.

**Por qué no rompe reportes:** el módulo ya resolvía el área con la cadena
`users.torre (por usuario) → torre del rol → ADMINISTRATIVO` — la torre del
usuario tiene prioridad. La migración escribe la torre del puesto en
`users.torre` y de ahí en adelante el alta/edición la mantienen. Probado:
`reportes-campo` integration **33/33** con los roles consolidados.

## Cambios

**BD — migración `20261112000000_roles_5_puestos_torre` (idempotente):**
- `categorias_puesto.torre` (columna nueva en
  schema + SQL): Mecanico→MECANICO, Tecnico Diesel→DIESEL, Soldador→SOLDADOR,
  Mantenimiento→MANTENIMIENTO, Ingeniero→RESIDENTE, RRHH/Administrativo→
  ADMINISTRATIVO, Operador/Chofer→sin torre (ven solo los suyos, como hoy).
- Puestos nuevos en el catálogo: Tecnico Diesel, Soldador, Mantenimiento, RRHH.
- Rol **`Tecnico`** (nivel 70): unión de permisos y vistas de los 4 técnicos
  (con `DISTINCT` — el NOT EXISTS no ve lo insertado en el mismo statement).
- `Encargado de RRHH` → **`Administrativo`** (nivel 80): unión de permisos
  (15) y vistas (4) — el administrativo de oficina gana los módulos RRHH.
- Mapeo de `users_roles` con dedupe del unique (user,rol) + **`users.torre`
  desde el rol viejo** (respecta overrides previos).
- Roles viejos desactivados (`activo=false, eliminado_en`) — no se borran.
- Residuo de pruebas: `DELETE categorias_puesto WHERE nombre LIKE
  'TestCategoria-%'` (5 filas).
- DOWN best-effort documentado (reactiva los roles; la torre no se revierte).
- Incidente durante la aplicación: PK duplicada en role_permissions →
  arreglado con DISTINCT; `migrate resolve --rolled-back` + re-deploy limpio.

**API (`apps/api/src/trabajadores`):**
- `resolverCategoriaPuesto` devuelve también la torre del puesto.
- El alta escribe `users.torre` desde el puesto; la edición del puesto la
  refresca (update + `otorgarCuentaAcceso`/`crearFilaCuentaAcceso` aceptan
  torre); `TRABAJADOR_INCLUDE` trae la torre de la categoría.
- DTO: `CATEGORIAS_PUESTO` con los 9 puestos.
- `demo-seed.sql`: los 3 técnicos demo y rrhh → roles consolidados.

**Front (`apps/web`):**
- Select de puesto del alta con los 9 puestos y etiquetas es-MX;
  filtro de la vista de Trabajadores con los mismos valores.

## Verificación / pruebas

- Migración aplicada y verificada en BD: 5 roles activos
  (Residente 90 / Administrativo 80 / Tecnico 70 / Cobrador 60 /
  Trabajador 20) + Administrador sistema; unión de permisos/vistas correcta
  (Administrativo 20 permisos/5 vistas; Tecnico 4/8); usuarios mapeados
  (Administrativo 3, Técnico 5); torres en `users` y en los puestos.
- Integración: trabajadores **23/23** (2 tests nuevos: alta con rol
  `Tecnico` → numero `TEC-…` + `users.torre` = MECANICO del puesto;
  edición del puesto → torre refrescada a DIESEL) · reportes **33/33**
  (ámbito por torre intacto) · suite completa 1313/1315 (los 2 fallos
  siguen siendo cobranza, pre-existentes).
- `npx tsc --noEmit` limpio (api y web); eslint limpio en los archivos front.

## Pendientes / riesgos

- Los usuarios demo (soldador/diesel/mantenimiento/rrhh) quedaron en los
  roles consolidados por la migración; sus números (TEC-008, TEC-009…) y
  torres no cambiaron.
- Los roles viejos quedan desactivados con sus permisos/vistas intactos:
  si algún día se reactiva uno, vuelve a aparecer en catálogos que filtran
  por activo (el alta los excluye solo si no son sistema… verificar cuando
  toque).
- Smoke visual del select de puestos y del filtro en la vista (no hay
  infra front).
- `roles.torre` de los roles consolidados: Técnico/Administrativo quedaron
  sin torre en el rol — la torre ahora vive en users/puesto. Si algún
  reporte llega a resolverse por rol (usuarios sin `users.torre` y sin
  puesto torre), cae a ADMINISTRATIVO como siempre.
