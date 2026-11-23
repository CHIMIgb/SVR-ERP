# Fechas 6 h adelantadas en la BD: la conexión a Postgres va en UTC

**Fecha:** 2026-11-23
**Autor:** P4chec0php

## Cambios realizados
- **El bug:** `@prisma/adapter-pg` (7.9.1, y la 7.10.1 igual) manda cada `Date` como la hora UTC sin zona
  (`"2026-11-23 06:04:01"`). Postgres la interpreta con el `TimeZone` de la sesión. Con el servidor en hora de
  México (-06), todo lo que escribía Prisma quedaba 6 h en el futuro. Al leer, el adapter cambia la zona por
  `+00:00` y lo compensaba, por eso en la app no se veía. Lo que sí salía mal:
  - lo que pone Postgres: los 56 triggers `update_updated_at_column()` ponen `actualizado_en = CURRENT_TIMESTAMP`
    y Prisma lo leía 6 h atrás. 408 filas tenían `actualizado_en` horas antes que `creado_en`;
  - cualquier SQL directo, y cambiar de servidor o de `TimeZone`. El Postgres de CI está en UTC y nunca lo veía.
- **El arreglo:** la sesión se abre en UTC (`options: '-c timezone=UTC'`) en la API y en los scripts que crean su
  propio `Pool`. No es la zona de la empresa (esa sigue solo en `.env`, regla de `AGENTS.md`), es el formato en que
  viajan las fechas.
- **Corrección de lo viejo:** migración de datos `20261123010000_corregir_zona_horaria_utc`:
  - corre `(valor AT TIME ZONE <zona del servidor>) AT TIME ZONE 'UTC'` en todas las columnas `timestamptz`;
  - respeta el `actualizado_en` que puso el trigger: lo corrige solo si está a menos de 1 min de `creado_en`;
  - apaga los triggers de UPDATE solo dentro de su transacción y los regresa a su modo original;
  - no corre dos veces:
    - un candado para corridas simultáneas;
    - la fila de `_prisma_migrations`;
    - una marca en el comentario de esa tabla, que viaja con los respaldos;
  - falla si la zona viene forzada desde la conexión (`PGTZ`, `options=` en la URL), en vez de no hacer nada;
  - si el servidor ya está en UTC, no cambia ningún dato.
- **Revisión al arrancar:** si la sesión no quedó en UTC, la API no arranca. Si la BD no tiene la corrección, avisa
  en el log.
- **Documentación:** `DECISIONS.md` sección 23, con las reglas para personas e IA. También se corrigió el fragmento
  de la sección 1, que enseñaba a crear el `Pool` sin la opción.

## Cosas nuevas
- `prisma.service.spec.ts`: truena en CI si alguien quita la opción del `Pool`. La de integración no puede, porque
  ahí Postgres ya está en UTC. También prueba la revisión al arrancar.
- `zona-horaria.integration.spec.ts`: sesión en UTC, una fecha va y vuelve en el mismo instante, y `now()` se lee
  igual que el reloj de la API. Solo lecturas.

## Archivos tocados
- `apps/api/src/prisma/prisma.service.ts` (modificado)
- `apps/api/src/prisma/prisma.service.spec.ts` (nuevo)
- `apps/api/src/prisma/zona-horaria.integration.spec.ts` (nuevo)
- `apps/api/prisma/migrations/20261123010000_corregir_zona_horaria_utc/migration.sql` (nuevo, solo datos)
- `apps/api/scripts/seed-clientes.ts`, `apps/api/scripts/seed-finanzas.ts`, `apps/api/prisma/seed-gps.js` (modificados)
- `apps/api/scripts/migrate-to-timestamptz.ts` (modificado: la opción y un aviso de que es histórico)
- `DECISIONS.md` (sección 23 nueva, sección 1 y tabla de referencia)

## Pruebas / verificación
- **Antes del arreglo**, en local (Postgres en `America/Chihuahua`): las 4 pruebas nuevas fallan, y la fecha que va y
  vuelve sale corrida exactamente 21,600,000 ms (6 h).
- **Después:** pasan las 4.
- **`npx tsc --noEmit`** en `apps/api`: limpio.
- **`npx jest`:** 97 suites, 1,489/1,489. **`npx prisma validate`:** pasa.
- **Migración en una copia desechable** de la BD local:
  - 10,416 filas corregidas en 0.7 s; los 57 triggers de UPDATE (56 de `actualizado_en` y el de auditoría) se
    apagaron y volvieron a su modo original;
  - las filas con `actualizado_en` más de 1 min antes que `creado_en` pasaron de 408 a 0, sin contar un usuario de
    prueba con reloj simulado;
  - las filas testigo (auditoría, trabajador nunca editado, editado, permiso de seed) se corrieron justo lo esperado;
  - con la zona forzada (`PGTZ=UTC`) falla y no cambia nada;
  - una segunda corrida en la misma sesión la detiene la marca;
  - dos corridas simultáneas (psql y `prisma db execute`): una corrige y la otra respeta la marca;
  - al restaurar encima el respaldo viejo, la marca se va con los datos viejos y se puede volver a corregir;
  - en un servidor en UTC no cambia ningún dato: la huella de la auditoría queda idéntica.
- **Integración completa** contra esa copia: 295/315. Las 20 que fallan fallan igual con el código de `main` contra
  una copia sin migrar. Son datos que faltan en mi BD local (por ejemplo el usuario demo `trabajador@…`, que sí está
  en el volcado de CI), no este cambio.
- **Smoke con la API real** contra la copia corregida:
  - login real: la sesión, la auditoría `LOGIN_EXITOSO` y `ultimo_login` quedan a segundos de `now()` (antes, +6 h);
  - las fechas viejas de un cliente salen idénticas a como las mostraba la API antes;
  - después de un PATCH, el `actualizadoEn` que pone el trigger sale con la hora real (antes, 6 h atrás).

## Pendientes y riesgos
- **Código y migración se aplican juntos, con la API detenida** (instrucciones en el encabezado de la migración):
  - si llega el código sin la migración, lo viejo se ve 6 h adelantado;
  - si se aplica la migración con la API vieja corriendo, lo que se escriba en medio vuelve a quedar adelantado.
- La migración debe correr con la zona por defecto del servidor. Si se corre con la zona forzada, falla a propósito.
- En una BD local compartida entre ramas: después de corregirla, una rama SIN este cambio vuelve a escribir fechas
  +6 h. Conviene que las ramas en curso integren `main` antes de usarla.
- Propuesta, no hecha porque cambia la configuración de CI: arrancar el Postgres de `integration.yml` en una zona
  -06. Así `zona-horaria.integration.spec.ts` también truena en CI si se quita el arreglo.
- Visto de paso, sin tocar, porque es otro tema: `prisma.service.ts` y los scripts caen a una URL por defecto con
  contraseña conocida si falta `DATABASE_URL`. Sería mejor que fallaran.
- Las filas que insertó SQL con `NOW()` (seeds de migraciones: roles, permisos, vistas) ya estaban bien y quedan 6 h
  antes. Solo es su fecha de creación.
- El volcado `svr_erp_export/` sigue con las fechas viejas hasta que se regenere desde una BD ya corregida. A CI no
  le afecta.
