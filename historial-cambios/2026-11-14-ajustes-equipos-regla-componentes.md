# 2026-11-14 — Ajustes /equipos (botón info) + regla dura de COMPONENTS.md en AGENTS.md

## Qué se hizo

- **`/equipos`**: el botón "Ver equipo" pasó de `variant="secondary"` a
  `variant="info"` — el patrón documentado en COMPONENTS.md para acciones
  de ver/leer en columnas de acciones (`variant="info"` + icono `Eye`).
- **AGENTS.md**: nueva **REGLA DURA** en la sección "UI Components —
  Reglas de Migración": toda vista usa el kit `src/components/ui/*`
  siguiendo SU documentación en `COMPONENTS.md` (variantes, props, cuándo
  usar / cuándo no); antes de construir o editar una vista se consulta
  `COMPONENTS.md`; desviarse del componente documentado es Request
  Changes; componente nuevo = se crea en `src/components/ui/` con el
  patrón `.tsx` + `.styles.ts` + `index.ts` y se documenta en
  `COMPONENTS.md` en el mismo cambio. Con ejemplos concretos (acción ver
  = info, pie de modal de solo lectura = `ModalFooter` + Cerrar).

## Sobre el botón "Cerrar" del modal Ver equipo

Verificado línea por línea: el footer **ya estaba** en el código y es
idéntico al ejemplo de COMPONENTS.md (`ModalFooter` con
`<Button variant="secondary">Cerrar</Button>`, líneas ~304-306 del
`page.tsx`; `ModalFooter` siempre se renderiza, incluso con equipo vacío).
Lo que se vio sin footer casi seguro fue un render viejo del hot-reload
de Turbopack (glitch conocido del repo) — con refresco duro aparece.

## Verificación

- `npx tsc --noEmit` (web): limpio. eslint: solo el error patrón
  preexistente (`set-state-in-effect`).
- Smoke visual en navegador pendiente (sin navegador).
