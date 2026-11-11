# PWA base — paso 4: RoleNav + detector completo + seed de identidad demo

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base` (paso 4 del §8.6)

## Cambios realizados

### 1. Nav inferior por rol
- **`lib/pwa/rol-nav.ts`** — `navDelRol(user)`: lee las vistas `/m/*` con
  `puedeVer` del perfil (orden de la BD), las etiqueta con `NAV_MOVIL`
  (mapa ruta→etiqueta/ícono lucide) y pone Inicio primero. PROHIBIDO
  hardcodear el menú en pantallas (regla 3 de AGENTS.md).
- **`components/pwa/RoleNav.tsx`** — nav inferior fija: pestañas ≥44px,
  activa por `usePathname()`, safe-area inferior, badge "N pendientes"
  (para el §7c), e **interruptor "Ver versión de escritorio"**
  (`forzarVista('escritorio')` + href `/dashboard`).

### 2. Detector completo (cierra §7a)
- **`(dashboard)/layout.tsx`:** si `vistaEfectiva() === 'movil'` →
  `router.replace('/m')` (deferido con rAF — misma técnica del paso 3).
  La mitad `(pwa)` ya redirigía a escritorio desde el paso 3.
- **Sidebar del escritorio:** botón **"Versión móvil"** junto al logout
  (`forzarVista('movil')` + href `/m`) — el interruptor manual en ambas caras.
- **El sidebar YA NO muestra las vistas de la PWA:** el perfil ahora incluye
  `es_menu` (bandera que quedó FALSE en las vistas `/m/*` desde el paso 1) y
  `buildGroups` filtra `es_menu !== false`. `VistaAuth` (shared) gana el
  campo opcional. Antes de esto, las 13 vistas móviles aparecían en un grupo
  "General" del sidebar del escritorio.

### 3. Seed de identidad demo (`20261111150000_pwa_seed_identidad_demo`)
- `numero_empleado` para los 8 usuarios demo (por email, SOLO si está NULL):
  ADM-01 · RES-014 · TEC-007/008/009/010 · COB-003 · TRA-0142 (los ejemplos
  del spec §6.4). En servidores sin demo → UPDATE 0 (idempotente).
- `pin_hash` de desarrollo (`SVR26DEM`, bcrypt 12) + `pin_cambiado_en=NOW()`
  SOLO si `pin_hash IS NULL` — nunca sobrescribe PINs existentes.
- Residuo detectado: 3 usuarios `pinint-*` de los experimentos de hora no se
  pueden borrar (el CASCADE hacia registro_auditoria lo bloquea el trigger
  de inmutabilidad — correcto); quedan como data de prueba inofensiva.

### 4. README
- Bloque "PWA móvil" con la tabla de números + PIN dev (`SVR26DEM`) y la nota
  de que la mesa de ayuda no tiene vista móvil.

## Archivos tocados

- `apps/web/src/lib/pwa/rol-nav.ts` (nuevo)
- `apps/web/src/components/pwa/RoleNav.tsx` (nuevo)
- `apps/web/src/app/(pwa)/layout.tsx` (nav + interruptor)
- `apps/web/src/app/(dashboard)/layout.tsx` (detector)
- `apps/web/src/components/layout/Sidebar.tsx` (filtro es_menu + interruptor)
- `packages/shared/src/types/auth.ts` (VistaAuth.es_menu)
- `apps/api/src/auth/auth.service.ts` (perfil incluye es_menu)
- `apps/api/prisma/migrations/20261111150000_pwa_seed_identidad_demo/migration.sql` (nueva)
- `README.md`

## Pruebas / verificación

- `tsc` web ✅; eslint de los archivos tocados ✅.
- `migrate deploy` ✅; query de verificación: los 8 demo numerados + PIN.
- El smoke del navegador sigue pendiente manual (igual que los pasos previos).

## Pendientes y riesgos

- Sin push (orden del usuario).
- Paso 5 (placeholders restantes) y paso 6 (offline + manifest/SW) siguen.
- Los 3 usuarios `pinint-*` de pruebas previas quedan en la BD (no borrables
  por la inmutabilidad de la auditoría) — inofensivos, sin roles activos.
