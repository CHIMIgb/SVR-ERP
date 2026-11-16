# Fix del primer build de imagen: base Alpine → Debian slim (musl → glibc)

**Fecha:** 2026-11-16
**Autor:** Agente (autorizado por el usuario — iteración del despliegue opción A)

## Contexto

La primera corrida del workflow `build-web` falló en el build dentro del Docker (12s):

```
web:build: Error: Cannot find module '../lightningcss.linux-x64-musl.node'
web:build: An error occurred in `next/font`.
```

Problema conocido (tailwindlabs/tailwindcss #17958): sobre **Alpine (musl)** npm no
selecciona el binario nativo de `lightningcss` (motor CSS de Tailwind v4 y `next/font`) —
el lockfile local (Windows) no trae la variante musl y npm la salta.

## Cambio

`Dockerfile`: las 3 imágenes base `node:26-alpine` → **`node:26-slim`** (Debian, glibc).
La variante `lightningcss-linux-x64-gnu` sí está en el lockfile → se instala y carga.
Alpine era una optimización de tamaño de imagen; Debian slim es la base estándar de Node.

## Verificación

- Corrida 43778387672 fallida documentada (log de `gh run --log-failed`, error exacto).
- El build del web ya está probado en entornos glibc (Windows local, y Debian por igual).
- Segunda corrida disparada por el push — a vigilar con `gh run watch`.

## Pendientes / riesgos

- Imagen final algo más pesada que Alpine (~200 MB extra en runtime) — irrelevante para
  Railway (disco barato; la RAM en runtime no cambia).
- Si apareciera otro binario nativo faltante, el mismo patrón lo delata en el log.
