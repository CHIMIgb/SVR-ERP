# 2026-11-14 — Tabla de estado sincronizada con lo ya realizado

## Qué se hizo

En `docs-prioridades/IMPLEMENTACIONES-A-FUTURO.md` (§7 Estado de cada flujo)
había filas marcadas ⏳ Pendiente con verificaciones viejas que ya quedaron
cubiertas por el plan comercial/operaciones (B1–B9, cerrado el 2026-11-14).
Se sincronizaron 4 filas:

- **P2** (partidas de cotización): ⏳ → ✅ **Realizado (B1)** — el motivo
  viejo decía "`cotizacion_items` no existe en schema"; ya existe y la vista
  `/cotizaciones` tiene editor de partidas en crear/editar.
- **6.4** (criba → máquina/obra): ⏳ → ✅ **Realizado (B6)**.
- **6.5** (inventario ↔ criba): ⏳ → ✅ **Realizado (B7)** — con nota de que
  la salida por partidas de cotización sigue pendiente (P4).
- **F1** (notificaciones): ⏳ → ✅ **Realizado (B5)** — modelo + eventos +
  centro del Topbar; ver `NOTIFICACIONES.md`.

No se tocó ninguna fila que siga pendiente de verdad (P3, P4, P7, 6.2, 6.3,
6.6 restante, F5, C3).

## Verificación

- Solo ediciones de docs; sin código.
- `cotizacion_items` confirmado en `prisma/schema.prisma` antes de marcar P2.
