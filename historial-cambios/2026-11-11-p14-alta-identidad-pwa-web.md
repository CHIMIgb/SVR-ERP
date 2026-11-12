# P14 — Alta de Trabajadores con identidad PWA (frontend escritorio)

**Fecha:** 2026-11-11
**Autor:** agente SVR-ERP (GLM-5.3-Flash)

## Cambios realizados
- El formulario de alta de Trabajadores ahora pide **Rol de acceso** (obligatorio) y
  **Encargado (Residente)** (opcional) — spec §6.6-1 y §6.8; la "obra" es el select de
  proyecto que ya existía (decisión del cliente: proyecto == obra).
- Al crear, el backend responde `identidad { numeroEmpleado, pinTemporal, temporalHasta }`:
  se abre el modal "Credenciales de acceso" que muestra el PIN temporal **una sola vez** y
  ofrece **"Enviar por WhatsApp"** (`wa.me/<telefono>?text=...` con nombre, número, PIN,
  aviso de 24 h y enlace a la app — sin API, sin costo) y "Copiar mensaje" (spec §6.6-2).
- Teléfono de 10 dígitos se envía con prefijo 52 (formato internacional de wa.me).
- El modal es `persistent` (no se cierra con Escape/overlay): obliga a decidir si ya se
  envió. Si se cierra sin enviar, solo "Reiniciar PIN" (P12) genera otro.
- El primer ingreso ya funcionaba (login-pin → `/m/pin-cambio` forzado): sin cambios.

## Cosas nuevas
- Componente `CredencialesAccesoModal` (documentado en COMPONENTS.md §17.1).
- Tipos: `IdentidadAltaDTO`, `TrabajadorAltaDTO`, `ResidenteCatalogoDTO`, `RolCatalogoDTO`;
  `TrabajadorCreateInput` += `rolId`/`encargadoId`; catálogo += `residentes`/`roles`.
- `Button/index.ts` ahora también exporta `buttonClasses` (para el `<a>` de WhatsApp con
  estilos de botón de la casa).

## Archivos tocados
- `apps/web/src/lib/api.ts` (modificado)
- `apps/web/src/components/workers/TrabajadorFormModal.tsx` (modificado)
- `apps/web/src/components/workers/CredencialesAccesoModal.tsx` (nuevo)
- `apps/web/src/app/(dashboard)/trabajadores/page.tsx` (modificado: estado + cableado)
- `apps/web/src/components/ui/Button/index.ts` (modificado: export de buttonClasses)
- `COMPONENTS.md` (nueva sección 17.1)

## Pruebas / verificación
- `npx tsc --noEmit` (apps/web) ✓
- `npx eslint` sobre los 5 archivos tocados ✓ (el `npm run lint` completo reporta errores
  preexistentes en otros módulos: clientes, configuracion, Toast, Tooltip, CorteCaja… —
  código de otro dev, sin tocar)
- Smoke manual pendiente de correr con API y web levantadas: alta → modal → wa.me abre con
  el mensaje → login móvil con el temporal → forzado a cambiar PIN.

## Pendientes y riesgos
- Cero tests frontend (no hay infra jest+RTL — deuda activa registrada en AGENTS.md);
  queda el smoke manual como único gate de la vista.
- El PIN temporal se pierde si se cierra el modal sin copiar/enviar (por diseño);
  la salida es Reiniciar PIN desde la ficha (ya cableado por P12).
