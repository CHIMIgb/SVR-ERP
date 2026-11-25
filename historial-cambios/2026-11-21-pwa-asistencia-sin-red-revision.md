# PWA: asistencia y panel del admin sin red, con los cambios de la revisión del PR #24

**Fecha:** 2026-11-21
**Autor:** P4chec0php

## Cambios realizados
- **Sin red ya no se queda cargando ni se traba** (mismo bug que se corrigió en el Inicio en `aae4842`): el
  `apiClient` lanza cuando `fetch` falla (API caída / sin señal) en vez de devolver `success:false`.
  - `MiAsistencia`: la carga muestra "Sin conexión" con Reintentar. Al checar, el botón se libera siempre
    (`.catch` + `finally`).
  - `EquipoAsistencia`: error con Reintentar.
  - `PanelEmpresa`: cada tarjeta con su error y Reintentar; la tarjeta en error dice de qué métrica es.
- **Checar sin respuesta**: si la petición sí llegó y se perdió la respuesta, el registro ya existe. Después de
  un fallo se recarga sin perder la pantalla (formulario, obra y aviso) y, si el registro quedó, se avisa
  "Entrada registrada a las …" en vez de pedir otro intento. Sin respuesta y sin registro: "No se pudo
  confirmar tu registro" (no "revisa tu señal" como si nada hubiera pasado).
- **Alertas del panel**: ya no dicen "Sin alertas por ahora" cuando una fuente falló. Ahora dicen qué no se
  pudo revisar y por qué, con un Reintentar que solo repite las fuentes que fallaron.

### Correcciones de la revisión del PR #24
- `mensajeDeApi` delega en `mensajeErrorApi` (un 422 dice qué campo falló) y solo agrega el caso sin conexión.
- Zona horaria desde `APP_TIMEZONE` (`NEXT_PUBLIC_TZ`): `fechaLarga`, `minutosTarde`, `horaActual` y el "hoy"
  del panel ya no usan una zona fija ni la hora del teléfono.
- Conteo del equipo en una sola función (`contarEquipo`), usada por el Inicio y por Mi equipo.
- Pruebas del front (antes no había ninguna en estas pantallas).
- Cada punto corregido lleva un comentario en el código con el porqué, para que no se vuelva a quitar.

## Cosas nuevas
- `contarEquipo`, `fechaHoyEnZona` y `MENSAJE_SIN_CONEXION` en `lib/pwa/asistencia-propia.ts`.
- Pruebas: `asistencia-propia.test.ts`, `MiAsistencia.test.tsx`, `EquipoAsistencia.test.tsx`,
  `PanelEmpresa.test.tsx`.

## Archivos tocados
- `apps/web/src/lib/pwa/asistencia-propia.ts` (modificado)
- `apps/web/src/lib/pwa/asistencia-propia.test.ts` (creado)
- `apps/web/src/app/(pwa)/m/asistencia/MiAsistencia.tsx` (modificado)
- `apps/web/src/app/(pwa)/m/asistencia/MiAsistencia.test.tsx` (creado)
- `apps/web/src/app/(pwa)/m/asistencia/EquipoAsistencia.tsx` (modificado)
- `apps/web/src/app/(pwa)/m/asistencia/EquipoAsistencia.test.tsx` (creado)
- `apps/web/src/app/(pwa)/m/PanelEmpresa.tsx` (modificado)
- `apps/web/src/app/(pwa)/m/PanelEmpresa.test.tsx` (creado)
- `apps/web/src/app/(pwa)/m/page.tsx` (modificado: solo el conteo de "Mi equipo hoy")

## Pruebas / verificación
- `npm test` en `apps/web`: 51/51. Antes del arreglo, 18 de las pruebas nuevas fallaban, entre ellas
  "sin red al checar" (botón trabado y promesa sin atrapar).
- `npx tsc --noEmit`: limpio. `npm run lint`: 0 errores, 38 warnings (los mismos de la rama base).
- Navegador: Chrome headless emulando un Android, login real del administrador.
  - **Corte simulado** (`Fetch.failRequest`), sin escribir en la BD:
    - Inicio del admin con la API de datos caída;
    - Mi asistencia: sin red al cargar, sin red al checar, y sin red con el registro guardado;
    - Mi equipo: sin red y su recuperación.
    Las 15 revisiones dieron OK, sin promesas sin atrapar.
  - **API apagada de verdad**: el Inicio, también tras recargar la página completa, muestra "Sin conexión" en
    cada bloque y nada se queda cargando.
  - Capturas a 390, 768, 1024 y 1440 px, en claro y oscuro.

## Pendientes y riesgos
- **Detectado, fuera de este cambio** (`lib/api.ts`, compartido): si el refresh del token falla por red o es
  inválido, las peticiones que esperaban ese refresh nunca se resuelven. Su pantalla se queda cargando para
  siempre (el panel del admin hace 4 en paralelo). Va en su propia rama.
- Las pruebas en navegador de Mi asistencia y Mi equipo usaron respuestas simuladas (no hay cuenta de
  trabajador enlazada en la BD local). Falta probarlas con una cuenta real de Trabajador y de Residente.
