# 2026-11-21 — Proxy de la API por Next (adiós mixed content) + errores de red elegantes en el Inicio

## Contexto

Probando la PWA con la API caída, `/m` soltó `unhandledRejection` en consola (el código
del inicio no atrapa el error de red) y quedó al descubierto la fragilidad de
**mixed content**: página HTTPS (`:3000` con certificado) + API HTTP
(`http://192.168.0.103:3001`) = Chrome bloquea el fetch en el teléfono a menos que
ese navegador tenga la excepción "Contenido no seguro" concedida A MANO por sitio y
por dispositivo. No era rotura nueva del código: era (1) la API muerta por operación
(y solo se levantó el web) y (2) la fragilidad dormida desde que existe el HTTPS.

## Cambios realizados

1. **Proxy de la API por Next** (`apps/web/next.config.ts`): cuando
   `NEXT_PUBLIC_API_URL` es una RUTA RELATIVA (`/api`), Next activa un rewrite
   `/api/:path*` → `http://localhost:3001/api/:path*`. El navegador solo habla
   HTTPS con el :3000 — **mixed content desaparecido para siempre**, sin
   excepciones por dispositivo (escritorio y teléfono iguales). El proxy corre
   server-side: la regla de mixed content solo aplica al navegador.
   - **Guard de producción:** la condicional es que la URL empiece por `/api` —
     en Railway `NEXT_PUBLIC_API_URL` es absoluta → el rewrite NO existe. Impacto
     en prod: cero.
2. **`.env` local** (`apps/web/.env`, archivo no commiteado):
   `NEXT_PUBLIC_API_URL=/api`. Nota para la fase APK (Capacitor): dentro del APK
   no hay origen web — ese `.env` llevará la URL absoluta del servidor.
3. **Errores de red elegantes en el Inicio** (`(pwa)/m/page.tsx`): `TarjetaHoy`
   (asistencia propia) y `EquipoHoy` ahora atrapan el throw del `apiClient`
   (API caída) y muestran su estado de error con "Reintentar" — ya no
   `unhandledRejection` en consola. `ReportesResidente` ya lo atrapaba de fábrica.

## Cómo queda el flujo de arranque en dev ahora

```powershell
# Terminal 1 — API (los logs de la API se ven aquí):
cd apps\api ; npm run dev          # :3001

# Terminal 2 — Web con HTTPS:
cd apps\web ; npm run dev:https:ip # :3000 (proxy activo hacia :3001)
```

El teléfono/escritorio solo conocen `https://…:3000` — la API la toca el server
de Next, no el navegador.

## Verificación / pruebas

- `npx tsc --noEmit` → limpio.
- `npm run lint` → 0 errores, 38 warnings (baseline de la rama).
- `npm test` (web) → 12/12.
- Requiere reinicio del dev server (el rewrite se evalúa al arrancar).
- Smoke pendiente del usuario: API arriba → todo igual que antes; API caída → el
  Inicio muestra "No se pudo cargar tu asistencia" con Reintentar (sin ruido de
  consola).

## Pendientes / riesgos

- El `.env` editado es LOCAL (no commitea): si otro compañero levanta el proyecto,
  su `.env` manda — la URL absoluta vieja sigue funcionando SI su Chrome tiene la
  excepción; la recomendación es copiar el `/api`.
- El proxy solo existe en dev: en producción sigue siendo API directa por URL
  absoluta (correcto — Railway ya sirve la API bajo el dominio HTTPS de la web).
- Si algún día la API escucha en otro puerto/host local, ajustar el `destination`
  del rewrite (está hardcodeado a `localhost:3001` — igual que el `.env` viejo).
