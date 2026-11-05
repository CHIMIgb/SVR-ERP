# Base compartida de modo oscuro (tema + componentes UI)

**Fecha:** 2026-11-04
**Autor:** P4chec0php

## Cambios realizados
- Modo oscuro por clase (`.dark` en `<html>`) con selector Claro / Oscuro / Sistema en la barra superior.
  La preferencia se guarda por navegador; sin preferencia guardada se usa **claro**.
- Un script en el `<head>` del layout raíz aplica el tema antes del primer pintado (sin destello).
  Se usa `<script>` normal y no `next/script`: con `beforeInteractive` inline el App Router lo encola y
  lo corre después de pintar.
- Tokens nuevos en `globals.css`:
  - `canvas` (fondo de página), `tooltip` y overrides de `surface*` en oscuro.
  - Escala neutra `ui-50 … ui-950`: en claro vale exactamente lo mismo que `slate-*`; en oscuro se invierte.
- Componentes compartidos de `components/ui/` y la barra superior, toasts, `layout/Modal` y el modal de
  correo migrados a los tokens: `bg-white` → `bg-surface`, `*-slate-N` → `*-ui-N` (los fondos oscuros
  intencionales se quedan en `slate`) y a los tintes de color se les agregó su variante `dark:`.
  **En modo claro se ven igual que antes.**
- Gráficas (`Charts.tsx`): ejes y cuadrícula toman su color del tema con `useColoresEjes()`; el tooltip usa
  el token `tooltip`.
- `StatsCard`: `icon` ahora es opcional (sin icono usa el diseño limpio: etiqueta arriba, valor abajo) y
  prop nueva `hint` para una línea de apoyo. Retrocompatible: los usos actuales no cambian.
- `Tabs`: la pestaña activa usa tokens; en oscuro se ve más clara que la pista.
- Barra superior en celular: menos separación entre acciones y el nombre del usuario se oculta (queda el
  avatar) para que quepa el selector de tema.
- `COMPONENTS.md`: valores reales de los colores de marca y semánticos (estaban desactualizados), tabla de
  superficies, sección "Modo oscuro" con la regla para adaptar una vista, y docs de `StatsCard`.
- Ajustes tras revisión de código:
  - La vista previa de correo (`EmailPreviewModal`) mantiene fondo blanco en el cuerpo del correo: el HTML
    de la plantilla trae colores propios pensados para fondo blanco.
  - `Overlay` (variante clara) oscurece de verdad en modo oscuro.
  - El selector de tema usa botones con `aria-pressed` (patrón correcto para teclado y lectores de pantalla).
  - `ThemeProvider` avisa en consola si encuentra un valor guardado no reconocido, sigue a otra pestaña
    aunque vacíe todo el `localStorage`, y no truena si el entorno no tiene `matchMedia`.

## Cosas nuevas
- `apps/web/src/lib/tema.ts` — tipos, clave de guardado y script inicial.
- `apps/web/src/providers/ThemeProvider.tsx` — estado del tema con `useSyncExternalStore`.
- `apps/web/src/hooks/useTheme.ts` — `{ preferencia, temaAplicado, setPreferencia }`.
- `apps/web/src/components/layout/ThemeToggle.tsx` — selector de tema.

## Archivos tocados
- `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/(dashboard)/layout.tsx` (modificados)
- `apps/web/src/components/layout/Topbar.tsx`, `Toast.tsx`, `Toast.styles.ts`, `Modal.tsx`, `EmailPreviewModal.tsx` (modificados)
- `apps/web/src/components/ui/**` (modificados: clases a tokens; `StatsCard` y `Charts` con lógica nueva)
- Los 4 archivos nuevos de arriba
- `COMPONENTS.md` (modificado)

## Pruebas / verificación
- `npx tsc --noEmit` en `apps/web`: sin errores.
- `npx eslint` sobre lo tocado: sin errores nuevos (los que quedan en `Toast`, `Portal` y `Tooltip` ya existían).
- `npm run build` de `apps/web`: correcto. Se revisó el HTML generado: el script de tema queda en `<head>`.
- Capturas reales en Chrome (claro y oscuro, 1440 px y 390 px) con login real contra la API local:
  `/asistencia`, el modal "Marcar entrada" y `/dashboard`. Claro sin cambios; oscuro correcto en barra
  superior, tarjetas, buscador, tabla, modal, inputs y selector.

## Pendientes y riesgos
- **Las vistas todavía no están adaptadas.** En oscuro, lo que cada vista pinta por su cuenta (botones,
  pestañas o títulos con `bg-white` / `text-slate-900` directos) sigue en claro. Cada quien adapta las
  suyas con la regla de `COMPONENTS.md` → "Modo oscuro". La clase legacy `.card` se dejó en claro a
  propósito para que las vistas sin adaptar sigan legibles.
- El buscador global de la barra superior busca en los datos mock de `@/lib/data`, no en la API (ya
  estaba así; no se tocó).
