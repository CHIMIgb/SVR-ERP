# Toast de permisos sin el detalle entre paréntesis

**Fecha:** 2026-11-14
**Autor:** Agente (ajuste del usuario, mismo hilo que el Cerrar naranja en /roles)

## Cambios realizados
- El toast al actualizar permisos de un rol mostraba `Permisos actualizados (+0 / -5)` — el conteo
  entre paréntesis lo ponía el backend en el `message` de la respuesta
  (`roles.service.ts`, `actualizarPermisos`). El usuario lo pidió sin el detalle.
- El mensaje ahora es `Permisos actualizados` a secas. El conteo sigue quedando en la auditoría
  (`metadata: { agregados, quitados }`), así que la información no se pierde, solo deja de
  mostrarse al usuario.
- El mensaje de Vistas (`Vistas actualizadas para N vista(s)`) no se tocó — el usuario solo señaló
  el de permisos.

## Archivos tocados
- `apps/api/src/usuarios/roles.service.ts` (1 línea)

## Verificación
- `npx tsc --noEmit` en `apps/api`: sin errores.
- Unitarias de usuarios/roles: 54/54 (ningún spec asertaba el mensaje viejo).
- Smoke pendiente del usuario: actualizar permisos de un rol en /roles → el toast dice
  "Permisos actualizados" sin paréntesis.

## Pendientes / riesgos
- Ninguno funcional: el frontend ya usa `res.data?.message` con fallback
  `'Permisos actualizados.'` — ambos textos quedan coherentes.
