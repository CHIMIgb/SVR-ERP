# Plan documentado — banner uniforme de error de carga (vista asignada, permiso faltante)

**Fecha:** 2026-11-15
**Autor:** Agente (análisis pedido por el usuario; solo documentación, sin código)

## Cambios realizados
- Análisis completo de por qué el acceso a vistas/permisos no se refleja de forma
  uniforme: `/trabajadores` muestra un banner rojo con el motivo (y Reintentar)
  mientras las vistas de Operaciones/Comercial muestran toasts genéricos que ocultan
  el 403.
- Origen del texto confirmado: `PermissionsGuard` de la API
  (`apps/api/src/auth/guards/permissions.guard.ts:85`) lanza el 403 con el mensaje
  crudo `No tienes permiso para <modulo>.<recurso>.<accion>`; el `RouteGuard` solo
  revisa vistas (`puedeVer`), no permisos granulares, así que un rol con vista
  asignada pero permiso faltante entra a la página y el primer GET revienta.
- Barrido de TODAS las vistas del escritorio: 3 grupos (G1 Ops/Com con toast
  hardcodeado que oculta el motivo; G2 RRHH con banner local crudo; G2b Maquinaria
  con toast crudo; G3 sistema sin carga sensible). Líneas exactas de cada catch
  documentadas por vista.
- Plan de implementación en fases (A1 = las 13 vistas de Comercial/Operaciones de
  este hilo; A2 = consolidación de RRHH/Maquinaria, vistas del otro dev, requiere
  su visto bueno): componente `ErrorState` nuevo en el kit `ui/` + humanizado del
  403 dentro de `mensajeErrorApi` + eliminación de toasts duplicados de cargas
  paralelas (ej. `/inventario` fetchData + fetchStats).

## Archivos tocados
- `docs-planes/PLAN-BANNER-ERRORS-CARGA-2026-11-15.md` (nuevo — el plan completo)

## Verificación
- Solo documentación: no se tocó código; no aplica tsc/eslint/tests.
- El barrido de líneas se hizo con lecturas directas de los `page.tsx` (grep línea
  por línea) — los números de línea citados corresponden al árbol al 2026-11-15.

## Pendientes / riesgos
- Nada ejecutado: el plan queda PROPUESTO, pendiente de que el usuario autorice
  alcance (A1-solo vs A1+A2) y el texto humanizado del 403.
- El plan toca vistas de ambos devs — A2 requiere coordinación con el dueño de
  RRHH/Maquinaria antes de escribir código.
- Acción de datos complementaria (no de este plan): revisar en /roles los pares
  vista↔permiso por rol (Residente: vista /trabajadores sin rrhh.trabajadores.ver;
  vista /inventario sin operaciones.inventario.ver).
