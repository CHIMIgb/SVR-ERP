# Ajuste — arqueo de caja con inputs de texto solo numéricos

**Fecha:** 2026-11-05
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- El arqueo de efectivo (`/ventas/corte`) pasaba sus inputs de
  `type="number"` a **`type="text"` + `inputMode="numeric"`** (teclado
  numérico en móvil) con limpieza de valor:
  `e.target.value.replace(/\\D/g, '').slice(0, 7)`
  → acepta SOLO dígitos, sin letras/símbolos, tope 7 posiciones, y sin
  spinners de `type=number` que destotibas en modo oscuro.
- Si un usuario pega texto basura, se limpia al vuelo (cada tecla).
- Igual en bloques de BILLETES y MONEDAS.

## Archivos tocados
- `apps/web/src/components/pos/CorteCaja.tsx` (2 inputs).

## Pruebas / verificación
- `npx tsc --noEmit` web ✔ — visual pendiente del usuario.

## Pendientes y riesgos
- Ninguno funcional; el cálculo ya castea `Number(counts[d]) || 0` — los
  demás inputs del arqueo (fondo inicial del turno) ya eran textos.
