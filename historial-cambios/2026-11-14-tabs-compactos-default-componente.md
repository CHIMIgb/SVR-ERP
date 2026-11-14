# 2026-11-14 — Tabs compactos por defecto (ajuste a nivel de componente)

## Qué se hizo

El estilo de píldora compacta pasó a ser el **default del componente
reutilizable `<Tabs>`** (petición del cliente: "haz el ajuste a nivel de
componente"):

- **`Tabs.styles.ts`**: la lista base ahora lleva `w-fit` — el grupo de
  pestañas se achica al contenido en TODAS las vistas que usan el
  componente (11: proveedores, ventas, cobranza, trabajadores, maquinaria,
  horometro, gps, asistencia, clientes, ui-showcase, roles) — incluidas
  las 3 de las capturas del cliente.
- **`Tabs.tsx`**: se eliminó la prop `compact` (redundante con el nuevo
  default; nada queda muerto).
- **`/roles`**: quitado el atributo `compact`.
- **COMPONENTS.md**: doc actualizada — default compacto, sin la prop de
  ayer; nota de que una variante a ancho completo se agregaría solo si
  alguna vista la necesita.

Impacto: puramente de presentación (una clase CSS en el default) — cero
lógica. La vista finanzas/conciliación tiene sus tabs hechos a mano (ya
compactos) y no cambia; su migración al componente queda como deuda
anotada.

## Verificación

- `npx tsc --noEmit` (web): limpio; eslint solo el error patrón
  preexistente.
- Impacto visual en las 11 vistas: smoke visual en navegador pendiente
  (sin navegador) — es un cambio de una clase CSS, riesgo bajo.
