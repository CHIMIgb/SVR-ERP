# 2026-11-20 — sw.js: notificationclick elige la pestaña PWA correcta (bloqueante 4 PR #23)

## Cambios realizados

**Bloqueante 4 de la review del PR #23 (apps/web/public/sw.js):**
1. `cliente.url.includes("/m")` es verdadero también en `/maquinaria`, `/mantenimiento` y
   `/mi-...` (pestañas del ESCRITORIO): un clic en la notificación podía enfocar una
   pestaña del escritorio y navegarla a `/m/reportes`. Ahora se compara el pathname:
   `esPestanaPWA()` = `ruta === "/m" || ruta.startsWith("/m/")` (con `try/catch` por si
   la URL del cliente no parseara — antes tiraría todo el handler).
2. Si `navigate()` falla (cliente no controlado, p. ej. otro perfil de navegador), no
   había respaldo: ahora `.catch(() => self.clients.openWindow(destino))`.

## Cosas nuevas

- Ninguna función pública (sw.js es service worker plano, sin módulos).

## Archivos tocados

- `apps/web/public/sw.js`

## Verificación / pruebas

- `node --check apps/web/public/sw.js` → sintaxis OK.
- `git diff --check` → sin espacios sucios.
- Sin suite automatizada: sw.js es archivo plano de `public/`, fuera del bundler y sin
  runner. Verificación real = smoke manual en dispositivo con la app instalada:
  1. App abierta en `/maquinaria` (escritorio) + notificación push → clic debe abrir
     `/m` en ventana propia (o enfocar SOLO si hay pestaña de la PWA).
  2. PWA abierta en `/m/reportes` + clic en notificación de reporte → la misma pestaña
     salta a `/m/reportes`.
  3. Clic con app cerrada → abre `/m` (o `/m/reportes`) limpia.

## Pendientes / riesgos

- Sin prueba en dispositivo real (iOS/Safari y Android/Chrome): el comportamiento de
  `navigate()` en clientes no controlados varía por navegador; el `.catch` lo cubre
  abriendo ventana nueva, pero conviene el smoke de los 3 escenarios de arriba.
