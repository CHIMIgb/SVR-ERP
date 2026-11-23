# Detalle PWA: actividades con orden/nombre del escritorio + Asignar/Reasignar

**Fecha:** 2026-11-19
**Autor:** agente
**Plan de origen:** análisis autorizado el 2026-11-19 (reporte del usuario con capturas de PWA y escritorio)

## Cambios realizados
1. **Actividades (antes «Bitácora») — paridad visual del escritorio:**
   - Renombrado a **«Actividades (N)»**.
   - Orden invertido: **la caja de comentario primero** (textarea `flex-1` +
     botón Publicar en fila, como el escritorio compacto) y las cards
     **debajo**.
   - Cada card con **autor + fecha/hora a la derecha**
     (`toLocaleString('es-MX', dateStyle short + timeStyle short)`) y el
     texto debajo — igual que las cards del escritorio.
   - Lista dentro de un **contenedor con scroll** `max-h-64
     overflow-y-auto scrollbar-none` (decisión de UI aprobada en el plan).
2. **Asignar/Reasignar Responsable (faltaba en la PWA):**
   - Botón en el pie de acciones con las condiciones del escritorio:
     `puedeEditar && esAdminReportes`, label **Reasignar** si ya hay
     `asignadoANombre`, si no **Asignar** (orden del pie: Asignar → Iniciar →
     Cerrar incidente → Cerrar).
   - Modal «Asignar Responsable» (FormModal, 1 columna): «Trabajador del
     sistema» (select `nombre — puesto`) + «O nombre libre» (deshabilitado
     si eligieron trabajador, igual que escritorio) + responsable actual al pie.
   - Catálogo cargado **al abrir el modal** con
     `trabajadoresApi.listar({ limit: 100 })` (misma llamada del escritorio;
     catálogo para select, exento de paginación).
   - Pre-carga del formulario si ya hay responsable: `asignadoA = asignadoAId`
     o `asignadoNombre` si fue libre (líneas 430-431 del escritorio).
   - `handleAsignar` idéntico: validación «Asigna un trabajador o un
     nombre.», payload `{ asignadoA | null, asignadoNombre | null }`
     (trabajador pisa el nombre libre), refetch del detalle + lista + stats.

## Archivos tocados
- `apps/web/src/app/(pwa)/m/reportes/page.tsx`
- `historial-cambios/2026-11-19-pwa-actividades-asignar.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit`: 0 errores (faltaban imports de `FormModal/FormField/Select`
  en el primer corte — corregido; también deshice un pegado accidental de
  imports en la misma línea).
- `npm run lint`: 0 errores, 37 warnings preexistentes.
- `git diff --check`: sin errores.
- **Smoke pendiente en el teléfono:** Admin (ADM-01) ve Asignar/Reasignar y
  asigna a un trabajador; las actividades se ven debajo del Publicar con
  fecha, dentro del scroll; el orden Imágenes → Actividades.

## Pendientes y riesgos
- El modal de Asignar requiere conexión (acción interactiva) — regla del spec.
- El catálogo de trabajadores usa `limit: 100` (techo del API): si hay más de
  100 trabajadores activos, la lista del select queda parcial — misma
  limitación del escritorio.
- Sin push: el commit queda local.
