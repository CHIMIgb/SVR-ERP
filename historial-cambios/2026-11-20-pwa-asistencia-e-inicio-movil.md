# PWA, rebanada 2: pantallas de Asistencia e Inicio del móvil

**Fecha:** 2026-11-20
**Autor:** P4chec0php

## Cambios realizados
- **`/m/asistencia` deja de ser placeholder.** El trabajador checa su entrada y su salida con el GPS del
  teléfono, contra los endpoints propios de la rebanada 1 (`/asistencia/mia*`):
  - Aviso del día: hora de entrada, hora actual y "Llegas N min tarde"; con más de 15 min de tolerancia
    avisa que la entrada quedará en revisión (omisión), igual que la regla de la API.
  - Ubicación: obra (selector si tiene varias), distancia al centro de la obra, "dentro / fuera de la zona"
    y botón para actualizar el GPS. Fuera de zona no bloquea (como la API hoy): avisa que quedará marcada.
  - Retardo: comentario opcional para el encargado (viaja en `notas`).
  - Salida: opción "salgo antes de terminar mi turno" con motivo; después, resumen de la jornada.
  - Estados cubiertos: cargando, error con Reintentar, cuenta sin trabajador enlazado, sin obra, obra sin
    ubicación, de vacaciones o dado de baja, sin GPS o sin HTTPS, turno nocturno abierto.
  - Sin cola offline a propósito: la hora del marcaje la pone el servidor al recibirlo; una entrada
    encolada quedaría con la hora en que volvió la señal.
- **`/m` (Inicio) deja de ser placeholder.** Saludo, tarjeta del día con el estado de la asistencia y el botón
  a Asistencia (Registrar asistencia / Registrar salida / Ver mi asistencia), asistencias, retardos y faltas
  de la semana, y accesos a "Reportar problema" (solo si el rol tiene `/m/reportes`) y "Llamar a mi
  encargado" (`tel:` al jefe del perfil). Es de todos los roles; los bloques propios de cada rol llegan en
  sus rebanadas.
- **API:** `GET /asistencia/mia` devuelve también la `geocerca` (centro y radio guardados) de las obras del
  trabajador, para el aviso de zona. Quien decide `enSitio` sigue siendo el servidor.

## Cosas nuevas
- `apps/web/src/lib/pwa/asistencia-propia.ts`: GPS con mensajes para el trabajador, distancia (Haversine,
  la misma fórmula que la API), minutos tarde, fecha larga y color por estado.
- `asistenciaApi.mia()`, `marcarEntradaPropia()`, `marcarSalidaPropia()` y sus tipos en `lib/api.ts`.

## Archivos tocados
- `apps/web/src/app/(pwa)/m/asistencia/page.tsx`
- `apps/web/src/app/(pwa)/m/page.tsx`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/pwa/asistencia-propia.ts`
- `apps/api/src/asistencia/asistencia.service.ts`
- `apps/api/src/asistencia/asistencia.service.spec.ts`
- `apps/api/src/asistencia/asistencia-propia.integration.spec.ts`

## Verificación
- `npx tsc --noEmit` en `apps/api` y en `apps/web`: sin errores en el código (los únicos errores de la web
  son de `*.test.tsx` y `jest.config.ts`, que ya fallaban por tipos de jest no instalados).
- `npm run lint` en `apps/web`: 0 errores (las advertencias son de otros archivos).
- Unitarias de asistencia: 146/146. Integración de asistencia contra Postgres real: 19/19.
- Navegador: Chrome headless emulando un Android, login real por número de empleado y PIN, GPS simulado.
  Capturas a 390, 768, 1024 y 1440 px en claro y oscuro de Inicio y Asistencia en tres momentos (sin
  entrada con retardo, con entrada, jornada cerrada), más fuera de zona. Flujo completo: entrada con
  retardo (queda en omisión), salida y resumen. Datos temporales creados y borrados al terminar.

## Pendientes
- Foto obligatoria y catálogo de motivos del retardo: esperan respuesta del cliente.
- "Mis reportes recientes" del diseño del Inicio: es del módulo de reportes (PR #23 en curso).
- El login de la PWA limita el número de empleado a 8 caracteres (`TRA-NNNN`) y la API acepta hasta 6
  dígitos (`TRA-NNNNNN`): con un consecutivo mayor a 9999 no se podría entrar.
