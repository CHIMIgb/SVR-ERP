# 2026-11-14 — /criba: sin badges ni colores en turno, material, eficiencia y al banco

## Qué se hizo

Ajustes pedidos por el cliente (mismo barrido "solo texto" que clientes,
cotizaciones, proveedores y finanzas):

- **Tabla**: columnas **Turno**, **Material** y **Efic.** ya no pinta badges
  de color — solo texto neutro. **Al banco** pierde el verde (mismo neutro
  que "Producido").
- **KPIs por material** (Criba fina / Criba gruesa / Arena lavada):
  - El badge **"Efic. X%"** pasa a texto plano (con el mismo spinner de
    carga en su lugar).
  - Métrica **"Al banco"**: verde → texto neutro.
  - Métrica **"Merma"** y su franja **"Merma del material"**: se quita el
    semáforo condicional (rojo/amarillo) → texto neutro.
- Se eliminaron los mapas `turnoVariant`/`materialVariant` y el import de
  `Badge` (sin uso). El `colorEficiencia` se conserva solo para la StatsCard
  "Eficiencia" del encabezado. Los **puntos de color por material** (dot) se
  conservan — no son texto ni badges.

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint` del archivo: solo el error preexistente de
  `set-state-in-effect` en el efecto de carga.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador).
- La StatsCard "Eficiencia" del encabezado conserva su color por umbral — si
  el cliente también la quiere neutra, es un cambio de una línea.
