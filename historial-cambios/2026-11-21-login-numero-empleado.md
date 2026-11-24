# Login PWA: el número de empleado acepta hasta 6 dígitos, como la API

**Fecha:** 2026-11-21
**Autor:** P4chec0php

## Cambios realizados
- El campo "Número de empleado" del login con PIN limitaba a 8 caracteres (`TRA-0142`), mientras la API
  (`LoginPinDto`) acepta el prefijo y hasta 6 dígitos (`TRA-123456`, 10 caracteres). El alta genera el
  consecutivo sin tope, así que desde el `TRA-10000` nadie podía entrar.
- El campo cortaba el número sin avisar (`TRA-123456` → `TRA-1234`), así que el intento iba con el número de
  otra persona. Ahora el límite es 10, en una sola constante con el comentario de por qué.

## Cosas nuevas
- `NUMERO_EMPLEADO_MAX` en `apps/web/src/app/page.tsx`.

## Archivos tocados
- `apps/web/src/app/page.tsx` (modificado)

## Pruebas / verificación
- `npx tsc --noEmit` y `eslint` en `apps/web`: limpios.
- Navegador (Chrome headless emulando un Android, modo PIN), con la petición `/auth/login-pin` interceptada
  y contestada 401 sin llegar a la API (sin intento real, sin auditoría ni bloqueo por IP):
  - antes del cambio: el campo dejaba `TRA-1234` y eso se enviaba;
  - después: el campo acepta `TRA-123456`, no sale error de formato y el número viaja completo.

## Pendientes y riesgos
- Ninguno. Si algún día el consecutivo pasa de 6 dígitos, hay que cambiar a la vez `LoginPinDto` y esta
  constante.
