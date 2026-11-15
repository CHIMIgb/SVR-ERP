# Limpieza de svr-erp-backup → base de datos preparada para la aplicación

**Fecha:** 2026-11-15
**Autor:** Agente (autorizado por el usuario tras el análisis comparativo svr-erp-dump vs svr-erp-backup)

## Contexto

El usuario pidió preparar una BD limpia ("solo lo esencial: admin, roles, materiales de criba,
permisos…"). El análisis comparó `svr-erp-dump` (todo el dominio con datos demo, 50 users,
6 roles inactivos) contra `svr-erp-backup` y resultó que **backup ya era casi la base limpia**
(sin datos operativos, 6 roles exactos) — se optó por limpiar backup (lista chica) en vez de
vaciar ~60 tablas de dump.

## Cambios realizados (solo BD `svr-erp-backup`; ningún archivo del repo)

Respaldo previo: `pg_dump -Fc` → `svr-erp-backup-pre-limpieza.dump` (413 KB, en temp del equipo).

Una transacción con `SET session_replication_role = replica` (bypasea FKs y el trigger de
inmutabilidad de `registro_auditoria`):

- **Vaciar:** `registro_auditoria` (326), `sessions` (2), `intentos_login` (2), `refresh_tokens`
  (12), `token_blacklist` (10), `notificaciones` (1), `notificaciones_lecturas` (0).
- **Recortar:** `users` (−2: TEC-001/TEC-002 de prueba PIN; queda solo `admin@svr-constructora.com`
  ADM-01), `users_roles` (−2), `personas` (−87: las 2 de los TEC + 85 huérfanas de demo;
  queda solo la del admin), `categorias_inventario` (−4 `TestCat-*`; quedan las 6 reales),
  `articulos_inventario` (−7 demo `I001-I003`/`COD-xxx`; quedan los 12 seed `MAT-001..012`),
  `articulos_precio` (−0, todos eran de seed).
- **Sin tocar:** roles (6), permissions (107), vistas (40), role_permissions (147),
  role_vistas (100), categorias_puesto (10), niveles_bloqueo (5), configuracion_sistema (2),
  unidades_medida (19), tipos_maquina (4), materiales_criba (3), subcategorias_reporte (9),
  apu_templates (3) + apu_items (16), `_prisma_migrations` (102).
- `svr-erp-dump` y `svr_erp` (BD activa del dev) NO se tocaron.

## Verificación

- Conteos post-limpieza contra la lista acordada ✓ (tabla completa en el análisis).
- Único user: `admin@svr-constructora.com` (ADM-01, activo) ✓.
- Integridad referencial: 0 huérfanos en role_permissions/role_vistas/users_roles/personas/
  articulos_precio; los 3 materiales de criba siguen apuntando a su artículo seed ✓.

## Pendientes / riesgos

- Pendiente de decisión: renombrar BDs (`svr-erp-dump` → vieja, `svr-erp-backup` → `svr-erp-dump`)
  si el usuario quiere ese nombre para la base final.
- El `.env` de la API sigue apuntando a `svr_erp` — la BD limpia es para despliegue (Railway),
  no reemplaza la de desarrollo.
- PostGIS sigue pendiente en backup/dump (plan del 2026-11-16).
