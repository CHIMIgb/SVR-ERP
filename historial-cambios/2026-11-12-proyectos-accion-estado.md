# 2026-11-12 — /proyectos: acción "Estado" con modal para cambiar el estado del proyecto

## Qué se hizo

Todo en `apps/web/src/app/(dashboard)/proyectos/page.tsx`.

1. **Acción nueva "Estado"** en la columna Acciones de la tabla (icono `Flag`,
   `variant="primary"`), visible solo con `puedeEditar` — igual que Finanzas y
   Editar. No se agregó endpoint: usa `proyectosApi.actualizar(id, { estado })`.
2. **Modal "Cambiar Estado"** (`FormModal`): muestra el proyecto y un `select`
   con los mismos estados del formulario de edición
   (`ESTADOS`: En Proceso / Finalizado / Pausado), precargado con el estado
   actual. Al guardar: toast con el estado nuevo, cierre del modal y refetch de
   lista + KPIs.
3. **Estado del formulario**: `estadoOpen` + `estadoValue`; `openEstado()` usa el
   `estadoToValue()` existente para traducir la etiqueta al valor de la API.
4. **"Editar Proyecto"** sigue sin input de `progreso` (se quitó en `78aebb8a`);
   el `select` de Estado se conserva ahí tal cual.

## Verificación

- `npx tsc --noEmit` (web): sin errores.
- `npx eslint "src/app/(dashboard)/proyectos/page.tsx"`: solo los 2 hallazgos
  preexistentes (`useMemo` sin usar y `setState` en el efecto de carga).
- Smoke real contra la API con un proyecto temporal:
  - `PATCH { estado: "FINALIZADO" }` → proyecto `Finalizado`, **obra
    `FINALIZADA`** (sincronización de B2.2) y la obra **desaparece** de
    `GET /bitacora/catalogos` (el catálogo de /operaciones filtra `EN_PROCESO`).
  - `PATCH { estado: "PAUSADO" }` → proyecto `Pausado`; la obra conserva su
    estado (no existe `PAUSADA` en `EstadoObra`).
  - El proyecto de prueba se eliminó al final (soft delete de proyecto y obra).

## Pendientes / riesgos

- **Pausar no toca la obra** (decisión D2): si un proyecto ya estaba
  `FINALIZADO` y se regresa a `PAUSADO`, su obra sigue `FINALIZADA` y por lo
  tanto **no** aparece en /operaciones. Volver a `EN_PROCESO` sí la reactiva.
- La tabla sigue sin columna de avance; el progreso no se captura en ningún
  modal (solo se conserva el valor existente al editar).
- Smoke visual pendiente (sin navegador): botón, modal y refresco de la lista.
