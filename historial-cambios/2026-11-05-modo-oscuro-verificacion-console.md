# Modo oscuro — verificación REAL del proyecto abierto (fase console)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode (verificación solicitada: "revisalo tu mismo")

## Qué se encontró (causa real de por qué "seguía igual")
- El web dev server **estaba corriendo desde antes (11:14 a.m.)**, y con la
  caché de Turbopack liviana del **árbol ANTERIOR** al rebase y de las fases de
  modo oscuro — el CSS servido en pantalla era del build viejo. Por eso, aunque
  los archivos ya estaban migrados (fases 3–8), la pantalla no reflejaba nada.
- Además, una prueba intermedia de la fase console tenía error en el propio
  script (regex con espacios), ya arbitrado.

## Qué se hizo (verificación desde consola, sin abrir navegador)
1. **Detuve el dev server en :3000** (proceso node 19396, puerto tan del
   reloj del deploy) y **eliminé `apps/web/.next`** (caché de build).
2. **Arranqué de nuevo** `npm run dev` (web :3000 en background) — sirvió
   la página ("/", 200) con el árbol ACTUAL.
3. **Inspeccioné el CSS que efectivamente se sirve** (chunk dev de globals):
   - web/.next/dev/static/chunks/[root-of-the-server]__0_4c36b._.css
   - **1 bloque `.dark`** que define `--color-surface: #1e293b` y
     `--color-ui-100: #243146` (los tokens que voltean tarjetas/textos) ✔
   - `.bg-surface { background-color: var(--color-surface) }` — la clase que
     usan los panel del POS/corte/reportes **realmente referencia el token
     que cambia** ✔
   - **No hay reglas de blanco sólido** para `bg-white/#fff` en el CSS servido
     (0 líneas) — es decir, las cards ya no son blancas pegadas ✔
4. API (puerto 3001) sigue arriba ✔.

## Qué debes hacer para verlo bien
- En el navegador hacer **recarga forzada** (Ctrl+F5) con dark activado —
  si el dev server anterior era el que tenías abierto, ahora el :3000 activo
  es el mío (fresh) con el árbol reopezado.
- El ticket impreso del POS NO se cambia (permanece blanco correcto).

## Archivos tocados
- `apps/web/.next` (borrado; se regenera solo)
- procesos node (2 reinician)

## Pruebas / verificación
- node scripts/check-dark-css.cjs: los 3 checks arriba ✔
- Nada backend touched; no commit (solo build-infra).

## Pendientes y riesgos
- Si el usuario re-ever ver Engine, la cache del其他 device — igual se fija
  recargando.
- Si tras Ctrl+F5 ALGO sigue blanco en el POS, Es porque tu browser mantiene
  preferencia de theme en claro (el toggle lo cambia) — presiona el toggle.
