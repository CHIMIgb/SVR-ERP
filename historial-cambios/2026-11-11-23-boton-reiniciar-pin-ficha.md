# 2026-11-11 — Fix review PR #18 #6: botón "Reiniciar PIN" en la ficha de Trabajadores

## Problema (review del PR #18, punto 6)

`CredencialesAccesoModal` mandaba a un "Reiniciar PIN en la ficha" que **no
existía** — solo el endpoint. Si RRHH cerraba el modal sin enviar el PIN, o el
trabajador no entraba en 24 h, no había forma de darle otro desde la pantalla.

## Cambios

**Backend (exponer el vínculo trabajador ↔ cuenta de acceso):**
- `trabajadores.service.ts` — helper `vinculosAcceso()`: el alta P14 une al
  trabajador con su cuenta **por persona (mismo nombre y teléfono)** — no hay
  FK. Con esa vía resuelve `usuarioId` + `numeroEmpleado` de la cuenta activa.
  Aplicado en `findAll` (el botón vive en la fila); `toResponse` acepta el
  vínculo como tercer parámetro opcional.
- `TrabajadorDTO` (web): `usuarioId?` y `numeroEmpleado?`.

**Front:**
- `lib/api.ts` — `authApi.pinReinicio(userId)` (lo que el plan ya anotaba
  pendiente exponer).
- `(dashboard)/trabajadores/page.tsx`:
  - acción por fila **"Reiniciar PIN"**, visible solo si el usuario tiene el
    permiso `sistema.usuarios.editar` (via `user.permisos`) y la fila tiene
    cuenta vinculada (`usuarioId` + `numeroEmpleado`);
  - modal de confirmación (temporal 24 h, cierra TODAS sus sesiones, se
    muestra una vez);
  - tras confirmar, reusa el **mismo `CredencialesAccesoModal`** del alta:
    PIN en claro una vez + botón WhatsApp + copiar. Hoy solo Administrador
    tiene el permiso (RRHH no tiene `sistema.usuarios.editar` en la BD) — si
    mañana se lo dan, el botón aparece solo.
- `CredencialesAccesoModal.tsx`: el texto ahora apunta a un botón que existe.

## Verificación / pruebas

- Unit backend: 44/44 (`trabajadores.service.spec.ts`) — 2 tests nuevos:
  fila con vínculo expone `usuarioId`/`numeroEmpleado`; sin persona
  vinculada viene sin `usuarioId`.
- Integración BD real: 19/19 — test nuevo: alta → `findAll` con search →
  la fila expone `usuarioId` y `numeroEmpleado` reales.
- `npx tsc --noEmit` limpio (web y api); eslint limpio en los 3 archivos
  front tocados (el `lint` completo de web sigue fallando por 18 errores
  pre-existentes en otros archivos).
- El endpoint de reinicio ya cumple el estándar completo (JWT, blacklist,
  audit SUCCESS/FAIL, jerarquía del #5).

## Pendientes / riesgos

- **Smoke visual pendiente** (no hay infra de tests front): login admin →
  `/trabajadores` → fila con acceso a la app → "Reiniciar PIN" → confirmar →
  debe abrir el modal de credenciales con el temporal y el WhatsApp. Debe
  cerrar todas las sesiones activas del trabajador al ejecutarse.
- El vínculo por persona (nombre+teléfono) es el diseño actual del alta — si
  se dan de alta dos personas con mismo nombre y teléfono, el match es
  ambiguo (toma la primera cuenta activa). Deuda conocida del alta P14,
  no introducida por este fix.
- Trabajadores sin cuenta (dado de alta antes de P14) no muestran el botón
  — el camino para darles acceso es el #8 (rol/encargado en edición).
