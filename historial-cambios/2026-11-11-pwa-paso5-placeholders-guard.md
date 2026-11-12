# PWA base — paso 5: placeholders restantes + guard de vista por RBAC

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base` (paso 5 del §8.6)

## Cambios realizados

### 1. Las 12 pantallas placeholder (plan §8.5)
Cada ruta `/m/*` ya concesionada por la migración del paso 1 tiene su página
con `PantallaPlaceholder` (título + subtítulo "llega con su fase" + ícono de
la vista registrada). **Cero lógica de módulos** — señales de navegación:

- `/m/asistencia` · `/m/reportes` · `/m/contactos` · `/m/perfil` (Trabajador+)
- `/m/obras` (Residente) · `/m/contactos`
- `/m/flota-obras` · `/m/inventario` · `/m/diesel` (Técnicos, diésel solo
  Técnico-Diesel)
- `/m/pos` · `/m/corte` (Cobrador)
- `/m/finanzas` · `/m/modulos` (Administrador)

Con esto, la **nav inferior por rol ya navega a todo su árbol** (las pestañas
aparecieron solas desde el paso 4 — leen `user.vistas`).

### 2. Guard de VISTA por RBAC en `(pwa)/layout.tsx`
La nav oculta pestañas, pero una **URL directa** (ej. Trabajador → `/m/pos`)
iba a mostrar el placeholder. Nuevo guard: si el `pathname` actual no está
en `navDelRol(user)` → `replace('/m')`. Excepción: `/m/pin-cambio` siempre
permitido (es parte del ciclo de identidad, no una vista). El RBAC de la BD
también rige el acceso directo — igual que el escritorio con sus guards.

## Archivos tocados

- 12× `apps/web/src/app/(pwa)/m/<ruta>/page.tsx` (nuevos)
- `apps/web/src/app/(pwa)/layout.tsx` (guard de vista + imports)

## Pruebas / verificación

- `tsc --noEmit` web ✅; eslint de `(pwa)`, `lib/pwa`, `components/pwa` ✅
  (0 salidas).
- Verificación de rutas: 14 pantallas móviles totales (`/m`, `/m/pin-cambio`
  + las 12) — todas dentro de las vistas concesionadas por rol del paso 1.
- Smoke manual pendiente (navegación por rol en el teléfono).

## Pendientes y riesgos

- Sin push (orden del usuario).
- Paso 6: offline (cola + sincronizador §7c) + manifest/SW instalable.
- Paso 7: smoke por rol con los números/PIN demo (ADM-01…TRA-0142 /
  SVR26DEM).
