# Asistencia: omisión (falta o retardo con motivo) y registro de la ubicación de la obra

**Fecha:** 2026-11-05
**Autor:** P4chec0php

## Cambios realizados

### Regla del cliente: omisión
- Checar después de la hora de entrada más 15 minutos de tolerancia, o no checar, ya no es retardo directo: queda
  como **omisión**.
- La administradora la resuelve como **falta** o **retardo**, con el motivo que dio el trabajador.
- Plazo para justificarla: el mismo día hasta las **17:00** (horario laboral de 8 a 17). Sin resolver a esa hora,
  **cuenta como falta**. Esto se calcula, no se guarda.
- Todavía se puede resolver después, mientras no esté pagada la nómina de esa semana.

### Asistencia (vista)
- La pestaña "Sin marcaje" pasa a ser **Omisiones**. Lista a quien checó tarde y a quien no ha checado, con su
  situación y su plazo, y tiene el botón **Resolver**: falta o retardo, y el motivo es obligatorio.
- El indicador "Omisiones hoy" reemplaza a "Sin marcaje hoy".
- La omisión se ve en morado en la tabla del día, en la semana y en el detalle. Vencida, sale en rojo.
- Si alguien todavía está dentro de su tolerancia, se muestra "Por llegar" y no se puede resolver aún.
- El domingo es descanso: no hay omisiones.
- La vista recalcula "por llegar" y "vencida" cada minuto, sin recargar.

### Registro de la ubicación de la obra
- En los modales de marcaje, si la obra no tiene ubicación, aparece el botón **Registrar ubicación** para quien
  puede editar asistencia.
- Toma el GPS del teléfono (o coordenadas escritas a mano) y el radio permitido, de 20 m a 2 km.
- Destraba la regla de la geocerca: ya no se puede checar en una obra sin ubicación guardada.

### Nómina
- Sincronizar avisa cuántas faltas vienen de omisiones sin resolver y cuántas omisiones de hoy siguen
  pendientes. Las pendientes no se descuentan.

## Bugs corregidos
- **La salida anticipada borraba la omisión** (y antes el retardo): el día pasaba a "Salida anticipada" y la
  justificación pendiente desaparecía. Ahora solo reemplaza a un día puntual.
- **Sincronizar reescribía nóminas ya pagadas.** El recibo entregado cambiaba después del pago. Ahora las pagadas
  no se tocan y se avisa.
- **Un día que cuenta como falta seguía pagando sus horas** y sus horas extra, y además se descontaba. Ya no.
- **"No presentado" se mostraba como falta, pero se contaba como día asistido** en el resumen semanal (y en
  nómina). Ahora cuenta como falta.
- **"Confirmar asistencia" borraba un retardo**: lo cambiaba a puntual. Ahora conserva el retardo, y en una falta
  en sitio ya no aparece.
- **Una falta registrada sin checar contaba como "fuera de obra"** y mostraba "Fuera 0 m". En el detalle dibujaba
  un mapa en 0,0. Ahora sale como "Sin marcaje" y sin mapa; la API manda `sinMarcaje` explícito.
- **Cambiar el estado por `PATCH :id/estado`** ya no permite saltarse la resolución de una omisión ni cambiar un día
  de una semana ya pagada.
- El modal de detalle decía "radio permitido 0.1 km" para 150 m: abajo de 1 km ahora va en metros.

## Cosas nuevas
- **Migración `20261105160000_asistencia_omision_y_ubicacion_obra`** (aditiva e idempotente):
  - El valor `OMISION` en `EstadoAsistencia`.
  - Las acciones de auditoría `ASISTENCIA_OMISION_RESUELTA` y `OBRA_UBICACION_REGISTRADA`.
  - Las columnas `omision_motivo`, `omision_resuelta_en` y `omision_resuelta_por` en `registros_asistencia`.
- **Endpoints**, con permiso `rrhh.asistencia.editar` y auditados:
  - `PATCH /asistencia/:id/omision`: resuelve la omisión de un registro.
  - `POST /asistencia/omisiones`: crea el día ya resuelto para quien no checó.
  - `PATCH /asistencia/obras/:obraId/ubicacion`: centro y radio de la geocerca. Rechaza 0,0, puntos fuera de México
    y una señal GPS peor que 100 m.
- **Respuesta de asistencia:** `sinMarcaje`, `omisionVencida`, `omisionMotivo` y `omisionResueltaEn`.
- **Resumen semanal:** los estados `Omisión` y `Pendiente`, y los conteos `totalOmisionesPendientes` y
  `totalOmisionesVencidas`.

## Archivos tocados
- `apps/api/prisma/schema.prisma` y la migración nueva.
- `apps/api/src/audit/audit.constants.ts`.
- `apps/api/src/asistencia/`: service, controller, DTOs nuevos y `query-asistencia.dto.ts`, y pruebas.
- `apps/api/src/nomina/nomina.service.ts` y sus pruebas.
- `apps/web/src/app/(dashboard)/asistencia/page.tsx`.
- `apps/web/src/app/(dashboard)/nomina/page.tsx`.
- `apps/web/src/components/workers/AsistenciaGpsModal.tsx`.
- `apps/web/src/lib/api.ts` (solo se agregó).

## Pruebas / verificación
- **Unitarias:** 1131 de 1133. Los 2 fallos son de `cobranza.service.spec.ts`, que ya fallaban por fecha. Se probó
  la omisión hora por hora (por llegar, omisión, vencida a las 17:00), la resolución y su carrera, la nómina
  pagada, el domingo, la tolerancia, la ubicación y los permisos.
- **Integración contra Postgres:** Asistencia, Nómina, Trabajadores y GPS, 39 de 39. Cubre una omisión resuelta
  como retardo una sola vez, un día sin checar resuelto como falta sin duplicarse, y que registrar la ubicación
  habilita el marcaje en una obra que no la tenía.
- **Smoke con curl** (login real, usuario RRHH):
  - Las respuestas 201, 400, 401, 404 y 409 de los 3 endpoints.
  - El resumen semanal y el filtro por omisión.
  - Lo que se creó para la prueba se dio de baja.
- `npx tsc --noEmit` (web y API) y `npx eslint` sin errores.
- **Capturas reales en Chrome** a 390, 768, 1024 y 1440 px, en claro y oscuro, de:
  - La pestaña Omisiones y la semana.
  - Los modales de resolver y de ubicación, este con el GPS simulado del navegador.
  - El detalle de una omisión (cambiando solo la respuesta en el navegador) y el de un día sin marcaje.

## Pendientes y riesgos
- **Antes de levantar el build en el servidor**, hay que aplicar la migración `20261105160000_…` en la BD del
  servidor. En local ya está aplicada.
- **Ninguna obra tiene ubicación todavía.** Hasta que la administradora registre cada una, no se puede checar en
  ellas (decisión del cliente).
- **Para decidir (negocio):** el mismo permiso (`rrhh.asistencia.editar`) registra la ubicación de la obra y resuelve
  omisiones. El cliente dijo que una sola administradora maneja todo; si después hay más usuarios, conviene un
  permiso aparte para la geocerca.
- **Turnos con entrada a las 17:00 o después:** su omisión vence de inmediato. El cliente indicó horario de 8 a 17.
- **Requiere otra migración (con permiso):** un índice único por trabajador y día. Sin él, dos peticiones
  simultáneas pueden crear dos registros del mismo día (ya pasaba con el marcaje y con "Registrar falta").
