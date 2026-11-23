# 2026-11-20 — Toast: un solo tamaño de línea (arregla el colapso a min-content)

## Cambios realizados

**Reporte visual de la PWA:** el toast "Incidente registrado exitosamente." se partía
en 3 líneas comprimido (~180px de ancho).

**Causa raíz (bug de layout real):** el toast era `w-full max-w-sm` dentro de un
contenedor `fixed` de ancho automático (shrink-to-fit), y el mensaje llevaba `flex-1`
(`flex-basis: 0%`). Al calcular el ancho intrínseco del contenedor, un span con basis 0
contribuye su MIN-CONTENT (su palabra más larga), no su línea completa → el toast
colapsaba a ~180px aunque el texto cabría de sobra.

**Fix (solo clases, el componente no se toca):**
- `w-max` — el toast mide su línea completa (max-content de icono + texto + cierre).
- Tope `max-w-[min(24rem,calc(100vw-2rem))]` — en el teléfono crece hasta lo que pida
  la línea y SOLO rompe cuando la pantalla no alcanza (lo que pidió el usuario); en
  escritorio el tope sigue siendo 24rem como antes.
- `break-words` en el mensaje (cadenas largas sin espacios no desbordan).

**Alcance compartido:** el `Toast` es del kit de layout (escritorio + PWA). El cambio
también arregla el MISMO colapso en el escritorio (allí los toasts también se medían
al min-content) — el desktop mejora, no rompe: el tope 24rem es el que ya tenía.

## Archivos tocados

- `apps/web/src/components/layout/Toast.styles.ts` (2 clases).

## Verificación / pruebas

- `npx tsc --noEmit` → limpio.
- `npm run lint` → 0 errores, 38 warnings (baseline).
- Test del Toast (`npm test -- Toast`) → 1/1.

## Pendientes / riesgos

- Smoke visual en el teléfono (el usuario lo confirmará): el toast de "Incidente
  registrado exitosamente." debe verse en UNA línea a 320px+; errores largos con
  `details` unidos por "·" rompen solo si superan el ancho de pantalla.
- En escritorio los toasts cortos ahora son pastillas al contenido (antes también
  colapsadas a min-content) — mismo comportamiento esperado, distinta forma visual
  para mensajes muy cortos.
