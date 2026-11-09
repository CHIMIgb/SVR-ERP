# Horómetro: vista limpia, lecturas que mueven el horómetro de la máquina y sin datos inventados

**Fecha:** 2026-11-05
**Autor:** P4chec0php

## Cambios realizados
- **Vista rehecha con la plantilla de `/inventario`:**
  - Encabezado corto con "Registrar lectura", que solo aparece con el permiso de crear de `/horometro`.
  - Indicadores reales, calculados en el servidor: horas de hoy, horas de la semana, máquinas sin lectura hoy
    y máquinas con el servicio cerca (50 h o menos) o ya pasado.
  - **Lecturas:** tabla paginada en el servidor, con búsqueda por máquina y filtros de máquina y periodo
    (hoy, esta semana o este mes).
  - **Próximo servicio:** por máquina, horómetro actual contra el horómetro del servicio que dejó
    programado su último mantenimiento. Antes era un ciclo fijo de 250 h para todas.
  - Modal con errores por campo y las mismas reglas que la API:
    - La lectura inicial sale del horómetro actual de la máquina.
    - Muestra las horas que suma la lectura.
    - Avisa si la lectura inicial no coincide con el horómetro de la máquina.
- **API** (`/lecturas-horometro`):
  - `GET` paginado, con `search`, `maquinaId`, `desde` y `hasta`.
  - `GET /stats` nuevo.
  - `POST` cumple los 4 requisitos de endpoint: auditoría `HOROMETRO_REGISTRADO` del éxito, y del fallo con
    `fallir()` y `error_code` (`FECHA_FUTURA`, `LECTURA_INVALIDA`, `HORAS_EXCEDIDAS`,
    `MAQUINA_NO_ENCONTRADA` y `LECTURA_TRASLAPADA`).
  - Guarda quién registró la lectura y el operador asignado a la máquina en ese momento.
  - El DTO limita los decimales a 2 y las lecturas al tope de la columna.
- La vista usa `horometroApi` y `maquinasApi`, no `apiClient` directo.

## Bugs corregidos
- **Registrar una lectura no movía el horómetro de la máquina.** Flota, Checklist y Mantenimiento seguían
  viendo el valor del alta, y "servicios próximos" de Mantenimiento nunca cambiaba. Ahora la lectura y el
  horómetro de la máquina se guardan en la misma transacción. Una lectura atrasada no lo regresa.
- **La misma lectura se podía registrar dos veces**, también con dos envíos al mismo tiempo. Ahora se
  rechazan los rangos que se enciman con otra lectura de la máquina (409), con un candado sobre la máquina
  para que dos envíos simultáneos no se cuelen.
- Se aceptaban lecturas con fecha futura y lecturas de más de 24 h en un día.
- **Datos inventados:**
  - Tarifas de renta escritas a mano por código de máquina, e "Importe facturable" calculado con ellas.
  - "En 10 hrs", "96.5 %", "4 equipos en operación", "Promedio 8.1h/máq" y "Fracc. Valle Sur".
  - Formulario precargado con "Juan Pérez", "Inmobiliaria ARCO", 1240 → 1248.5 y $1,450. Esos campos ni
    siquiera se enviaban.
- **"Lecturas de hoy" mostraba todas las lecturas,** y "Horas operadas hoy" sumaba el historial completo.

## Archivos tocados
- `apps/api/src/modules/horometro/`: servicio, controller y módulo; `dto/create-lectura-horometro.dto.ts`,
  `dto/query-lectura-horometro.dto.ts` (nuevo); pruebas nuevas `horometro.controller.spec.ts`,
  `dto/create-lectura-horometro.dto.spec.ts` y `horometro.integration.spec.ts`.
- `apps/web/src/app/(dashboard)/horometro/page.tsx` (reemplazo completo)

## Verificación
- `npx tsc --noEmit` en `apps/api` y `apps/web`, y `npx eslint` de la vista: sin errores.
- Unitarias: 15 de 15. Incluyen guards, permiso por ruta, el usuario del token y las reglas del DTO.
- Integración contra Postgres real (`horometro.integration.spec.ts`), 11 de 11:
  - La lectura mueve el horómetro de la máquina y se audita SUCCESS.
  - Un traslape da 409 y se audita FAIL.
  - Dos envíos iguales al mismo tiempo: solo se registra uno.
  - Una lectura atrasada no regresa el horómetro.
  - Cada fallo queda con su `error_code`.
  - Paginación con tope de 100, indicadores y próximo servicio.
  - `registro_auditoria` no se puede borrar ni modificar.
- El auditor de paginación (`audit-pagination.cjs`) no marca el módulo.
- Smoke con curl y login real: 401, 403 (usuario de RRHH), 400 (página 0, final menor, fecha futura, más
  de 24 h, 3 decimales) y 404 (máquina inexistente).
- En el navegador: una lectura que se encima con la existente muestra el aviso de la API y el modal sigue
  abierto.
- Capturas a 390, 768, 1024 y 1440 px, en claro y oscuro: Lecturas, Próximo servicio y el modal con errores.

## Pendientes
- El próximo servicio depende de que Mantenimiento registre `proximoServicioHoras`. M003, M004 y M006 no
  tienen servicio registrado y aparecen como "Sin servicio registrado".
