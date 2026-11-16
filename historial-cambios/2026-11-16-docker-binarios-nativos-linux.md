# Fix de binarios nativos Linux en la imagen Docker (npm/cli#4828)

**Fecha:** 2026-11-16
**Autor:** Agente (autorizado por el usuario — iteración del despliegue opción A)

## Contexto

Los builds de imagen en Actions fallaban en cascada por binarios nativos ausentes:

| Corrida | Error | Fix intentado |
|---|---|---|
| 43778387672 | `Cannot find module '../lightningcss.linux-x64-musl.node'` (base Alpine) | Base → `node:26-slim` (`f8bd7724`) |
| 43778708007 | `Cannot find module '../lightningcss.linux-x64-gnu.node'` (base slim) | Instalar el paquete a mano (`9264a9c7`) |
| 43779005188 | `Cannot find native binding` en **`@tailwindcss/oxide`** (npm/cli#4828) | → **fix de raíz (este cambio)** |

**Causa raíz:** el `package-lock.json` se generó en **Windows** y npm omitió las entradas
`packages/` de las variantes nativas de **Linux** (bug abierto npm/cli#4828) —
`lightningcss-linux-x64-*`, `@tailwindcss/oxide-linux-x64-gnu`, etc. `npm ci` instala
estrictamente del lockfile → sin binarios → `next build` muere al cargar Tailwind v4.

## Cambio

`Dockerfile`, etapa deps: `RUN npm ci && npm install --no-save lightningcss…` →
**`RUN npm install`** — dentro del contenedor Linux, npm resuelve el árbol completo e
instala los binarios de plataforma faltantes con las mismas versiones del lockfile (el
lockfile solo se modifica dentro de la capa descartable, nunca en el repo). Se retira el
parche puntual de lightningcss (lo cubre el install completo).

## Verificación

- Loader local de lightningcss revisado: primero requiere el paquete de plataforma
  (`lightningcss-linux-x64-gnu`), luego el archivo suelto — ambos ausentes en Linux.
- Lockfile verificado: lista variantes Linux SOLO como strings en optionalDependencies,
  sin entrada en `packages/` → npm ci no puede instalarlas.
- Corrida nueva disparada por el push — a vigilar con `gh run watch`.

## Pendientes / riesgos

- `npm install` en CI no es tan determinista como `npm ci` (mitigado: lockfile presente,
  package.json sin cambios → mantiene versiones fijadas y solo llena huecos).
- Runtime: si el web usa `next/image`, `sharp` necesita su binario Linux — el mismo
  `npm install` lo trae; si falta, el error aparecerá en el deploy, no en el build.
- Deuda cosmética: regenerar el lockfile en un Linux algún día para que `npm ci`
  funcione cross-platform de nuevo (requiere cuidar que no se pierdan las variantes
  win32 del equipo Windows).
