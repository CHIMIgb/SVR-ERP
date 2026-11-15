# 2026-11-14 — /usuarios: alta siempre crea persona (con teléfono) y área obligatoria

## Qué se hizo

Cambios en el formulario de crear usuario de `/usuarios`, según el cliente:

- **Se eliminó el select "Persona"** — al crear un usuario SIEMPRE se crea
  una persona nueva con los datos capturados (nombre, apellidos, teléfono).
  El formulario ahora solo captura persona nueva.
- **"Área (opcional)" → "Área" obligatoria sin default**: se quitó la
  opción "La del rol" — el área se elige a mano con "Seleccionar..."
  inicial y validación propia en el submit.
- **Nuevo campo "Número de Teléfono"** (opcional) — se guarda en la
  persona creada.

**Backend** (`create-usuario.dto.ts` + service): el create acepta
`telefono` opcional y lo persiste en `personas.telefono`. El soporte de
`personaId` (persona existente) se deja en el backend sin usar desde la
vista — servirá para la ficha 360 de la Fase 3 (V3). Tests: 34/34
unitarios (el test de create ahora aserta el teléfono persistido).

**Frontend**: `UsuarioCreateInput.telefono` en `lib/api.ts`; formulario
de crear sin select de persona, con teléfono, y área requerida.

## Verificación

- `npx tsc --noEmit` (web y api): limpio. Unitarios 34/34.
- Smoke real: crear usuario "Telefono Smoke" con teléfono y torre → la
  persona quedó con `telefono='322-123-4567'` y `users.torre='RESIDENTE'`
  en BD; el usuario de smoke se eliminó después (soft delete).
- eslint: solo el error patrón preexistente (`set-state-in-effect`).
- Smoke visual en navegador pendiente (sin navegador).

## Pendientes / riesgos

- El catálogo `personas` de `GET /usuarios/catalogos` (246 personas sin
  usuario) ya no se usa en esta vista — queda disponible para la Fase 3
  (ficha 360); si al cliente no le sirve, se quita del endpoint.
- El EDIT de usuario sigue mostrando el select de área con opción vacía
  (usuarios legados con torre NULL) — si el área también debe ser
  obligatoria al editar, se ajusta aparte.
