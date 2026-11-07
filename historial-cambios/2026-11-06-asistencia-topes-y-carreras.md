# Asistencia: topes en horas y textos, horas extra aprobadas que ya no se pisan y salida sin carreras

**Fecha:** 2026-11-06
**Autor:** P4chec0php

## Cambios realizados
- **Topes en los DTO, iguales a la regla del día y a las columnas:**
  - `horasTrabajadasOrdinarias` (salida): de 0 a 24, con 2 decimales.
  - `horasCalculadas` (horas extra): de 0.5 a 24, con 2 decimales. `inicio` y `fin` deben venir como HH:mm.
  - `tarifaPorHora`: 2 decimales y el tope de la columna.
  - Límite de longitud en `dispositivo` (100), `ubicacion` (200) y `notas`, `motivo` y
    `motivoSalidaAnticipada` (500).
  - La cuadrilla acepta hasta 200 trabajadores por petición.
- **Horas extra:**
  - Si ya están aprobadas, se rechazan con 409 `HORAS_EXTRA_YA_APROBADAS` y quedan auditadas.
  - Con la nómina de esa semana pagada no se registran, igual que el resto de cambios de asistencia.
  - La actualización es condicional (`estado != APROBADO`): si alguien las aprueba en el mismo momento, no
    se pisan.
  - La auditoría guarda si la tarifa se capturó a mano y, al corregir unas pendientes, el estado y el monto
    anteriores.
- **Salida:** la escritura es condicional (`hora_salida IS NULL`).
- **Vista de Asistencia:** valida lo mismo que la API (decimales y mínimo de 0.5 h extra), para que el
  error salga en español y antes de enviar.

## Bugs corregidos
- **Las horas extra aprobadas se podían pisar:** el `upsert` las regresaba a "Pendiente" con otras horas y
  otro monto, y la aprobación se perdía sin aviso.
- **Dos salidas del mismo trabajador al mismo tiempo pasaban las dos la revisión,** y la segunda pisaba la
  hora y las coordenadas de la primera.
- **Se aceptaban jornadas de cualquier tamaño** (por ejemplo 500 h trabajadas u horas extra) y horas de
  inicio y fin sin formato.

## Archivos tocados
- `apps/api/src/asistencia/asistencia.service.ts`
- `apps/api/src/asistencia/dto/`: `marcar-salida.dto.ts`, `registrar-horas-extra.dto.ts`,
  `marcar-entrada.dto.ts`, `marcar-cuadrilla.dto.ts`, `registrar-falta.dto.ts` y
  `asistencia-limites.dto.spec.ts` (nuevo)
- `apps/api/src/asistencia/asistencia.service.spec.ts` y `asistencia.integration.spec.ts`
- `apps/web/src/app/(dashboard)/asistencia/page.tsx` (solo validación antes de enviar)

## Verificación
- `npx tsc --noEmit` en `apps/api` y `apps/web`, y `npx eslint` de la vista: sin errores.
- Unitarias de Asistencia: 101 de 101. Incluyen:
  - Horas extra aprobadas que no se pisan, la nómina pagada y la aprobación simultánea.
  - La tarifa capturada a mano en la auditoría.
  - La salida condicional.
  - Los topes de los DTO.
- Integración de Asistencia y Nómina contra Postgres real: 17 de 17. Incluye:
  - Volver a registrar horas extra ya aprobadas da 409 y no cambia nada.
  - Dos salidas simultáneas dejan una sola.

## Pendientes (para Oscar)
- **Tarifa de las horas extra:** 45 de 49 trabajadores no tienen tarifa de horas extra, y a ellos se les
  paga una tarifa fija de $80/h. Por la Ley Federal del Trabajo, la hora extra se paga al doble del salario
  por hora (y al triple después de 9 a la semana). Falta que el cliente confirme la regla para calcularla
  desde el sueldo de cada trabajador.
