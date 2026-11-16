# Favicon del casco en producción — borrar el favicon.ico default de Next

**Fecha:** 2026-11-16
**Autor:** Agente (autorizado por el usuario)

## Contexto

En producción (`svr-prod.up.railway.app`) el favicon de la pestaña salía con el triángulo
**default de Next.js** en vez del casco naranja; en local salía el casco.

**Causa:** `apps/web/src/app/favicon.ico` en el repo es el favicon **default de Next que
nunca se reemplazó** (25,931 bytes = el triángulo). El casco vive solo en
`apps/web/src/app/icon.png` (1,436 bytes — verificado byte a byte que Railway lo sirve
idéntico al local). Chrome elige entre los dos `<link rel="icon">` del `<head>`: con los
hints de dev (`256x256` para el .ico) caía en `icon.png` (casco); con los de prod
(`16x16`) prefería el `.ico` (triángulo). Verificado abriendo `/favicon.ico` en
producción: renderiza el triángulo.

## Cambio

**Borrado** de `apps/web/src/app/favicon.ico` — Next anunciará solo `/icon.png` (casco)
como favicon en todos los entornos. No se generó un `.ico` del casco (no hay herramienta
de conversión local; el `.ico` solo importaba a navegadores antiguos — el app es Chrome
moderno + PWA, cuyo manifest ya usa el casco).

## Verificación

- `/icon.png` y `/favicon.ico` servidos desde Railway comparados byte a byte contra
  local: idénticos (el problema nunca fue la imagen Docker ni la build).
- Rebuild de la imagen vía Actions tras el push + Redeploy del usuario — favicon del
  casco esperado en el tab.

## Pendientes / riesgos

- Navegadores muy viejos que exigieran `.ico` pierden el favicon — fuera de alcance del
  app (Chrome moderno + móvil).
- La caché de favicon de Chrome es pegajosa: si en tu sesión sigue el triángulo tras el
  redeploy, cerrar la pestaña / visitar `/icon.png` directo.
