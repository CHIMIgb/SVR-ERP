# Cola PWA distingue conflictos (409) — fin del reintento infinito (tarea #1 del plan de saneamiento offline)

**Fecha:** 2026-11-19
**Autor:** agente
**Plan de origen:** `docs-planes/docs-pwa/PLAN-SINCRONIZACION-OFFLINE-PWA-2026-11-19.md` (punto 1)

## Cambios realizados
- `lib/pwa/offline.ts`:
  - `ElementoCola.estado` ahora es `"pendiente" | "error" | "conflicto"`. Sin bump de versión de IndexedDB: el store (keyPath `id`) no cambia y los registros viejos solo ganan un valor posible en un campo — no hay migración que pueda romper la cola.
  - `marcarConflicto(id)`: fija `conflicto` SIN incrementar `intentos` (no va a reintentar).
  - `descartar(id)` y `reencolar(id)`: decisiones humanas sobre un conflicto (borrar / regresar a `pendiente`). Las consumirá la vista de `/m/reportes`.
- `lib/pwa/sincronizador.ts`:
  - `PuertoEnvio` devuelve `{ ok: boolean; conflicto?: boolean }`.
  - `puertoPorDefecto`: `conflicto: res.success === false && res.error.code === "CONFLICT"` (el `AllExceptionsFilter` mapea 409→CONFLICT; desde el #2 el envío viaja por `apiClient` que entrega el envoltorio). Primer intento falló `tsc` por la unión discriminada `ApiSuccess | ApiError` — se corrigió con el narrowing de `success === false`.
  - `sincronizarAhora`: filtra los `estado === "conflicto"` de la cola (nunca se reenvían) y ante `conflicto: true` llama `marcarConflicto` en lugar de `marcarError`.
- **No se tocaron** `useCola`/`RoleNav` (el badge sigue contando todo lo no-enviado; un conflicto permanece visible hasta que el humano resuelva), ni `AuthProvider` (`limpiarCola` = `store.clear()`), ni `lib/api.ts`. El grep confirmó que nadie leía `ElementoCola.estado` antes de este cambio. No existe estado "enviado": el item desaparece al ACK, como hoy.

## Cosas nuevas
- Tercera y última tarea del plan de saneamiento offline ejecutada. El plan `PLAN-SINCRONIZACION-OFFLINE-PWA-2026-11-19.md` queda completo.

## Archivos tocados
- `apps/web/src/lib/pwa/offline.ts`
- `apps/web/src/lib/pwa/sincronizador.ts`
- `historial-cambios/2026-11-19-pwa-sincronizador-dev-3.md` (creado)

## Verificación / pruebas
- `npx tsc --noEmit` en `apps/web`: 0 errores.
- `npm run lint` en `apps/web`: 0 errores, 37 warnings preexistentes (deuda conocida, no bloquean).
- `git diff --check`: sin errores.
- **Smoke pendiente del 409:** los caminos 2xx (ACK → desaparece), sin señal (queda `pendiente`) y API caída (queda `error`, `intentos++`) se pueden reproducir en `npm run dev`; el camino del 409 no es forzable en local sin un negocio que lo lance — se verificará con datos reales al conectar `/m/reportes` (siguiente tarea).

## Pendientes y riesgos
- Un conflicto sin pantalla que lo resuelva queda atrapado en la cola (el badge no baja): con `/m/reportes` la vista deberá ofrecer descartar/reintentar vía `descartar`/`reencolar`, o el operario solo lo limpia al cerrar sesión. Hoy la cola está vacía.
- Otros códigos terminales (ej. 400 por payload malformado) siguen reintentando: se agregarán igual que el 409 cuando exista un caso real.
- La infraestructura de tests front sigue sin existir (deuda activa): sin test unitario del branch `conflicto`.
- No se probó en teléfono ni APK; hoy ninguna vista llama a `encolar()`.
- Sin push: el commit queda local, como indica la regla del repo.
