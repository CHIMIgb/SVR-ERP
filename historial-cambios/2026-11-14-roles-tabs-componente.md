# 2026-11-14 — /roles con el componente Tabs del kit (COMPONENTS.md)

## Qué se hizo

- Los dos botones ad-hoc de tabulación de `/roles` (Roles | Usuarios)
  se reemplazaron por el componente reutilizable **`<Tabs>` +
  `<TabPanel>`** (`src/components/ui/Tabs`), documentado en
  COMPONENTS.md §3.2 — el mismo estilo de las pestañas de
  conciliación-bancaria (Movimientos | Conciliación).
- Controlado: `value={tab}` + `onChange` (la carga perezosa de la lista de
  usuarios se mantiene — primera vez que entras al tab Usuarios se
  fetchean, con ref de guard).
- Se eliminó el helper `abrirTabUsuarios` (la lógica vive en el onChange).

## Verificación

- `npx tsc --noEmit` (web): limpio; eslint solo el error patrón
  preexistente (`set-state-in-effect` del fetch inicial).
- Smoke visual en navegador pendiente (sin navegador).
