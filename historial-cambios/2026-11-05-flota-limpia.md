# Flota: vista limpia, modo oscuro, responsiva y sin datos inventados

**Fecha:** 2026-11-05
**Autor:** P4chec0php

## Cambios realizados
- Vista rehecha con el mismo patrón que Asistencia, Nómina y Trabajadores:
  - Encabezado corto "Flota" sin banner. Botones sin íconos: "Alta de máquina", "Despachar a obra" y
    "Checklist". Solo aparecen con el permiso de crear de la vista (antes se mostraban a todos).
  - Indicadores en una sola tira, todos con datos reales:
    - Operando: encendidas o en movimiento, sobre el total.
    - Alertas de consumo: lleva a Combustible.
    - Checklists de hoy: cuántas máquinas lo tienen y cuántos salieron con falla.
    - Servicios vencidos, o el próximo servicio si no hay vencidos.
- **Equipos:** las tarjetas pasan a una tabla.
  - Búsqueda por código, máquina u operador, y filtro por tipo.
  - Las columnas se ocultan según el ancho real del contenido. Con el menú lateral, a 1024 px queda casi el
    mismo espacio que a 768 px.
  - En móvil, el estado y el checklist del día van dentro de la fila.
  - Acciones en texto: Checklist y GPS.
- **Despachos:**
  - Cronograma de dos semanas desde el lunes actual, con "Anterior", "Esta semana" y "Siguiente". Antes
    tenía fijas las fechas de abril de 2025.
  - Debajo, la lista de todos los despachos con su estado: En curso, Programado o Terminado. Al tocar uno, el
    cronograma va a su semana, y lo mismo pasa al despachar.
- **Checklists:** tabla con una columna "Hallazgos", que muestra solo los puntos que no están en "Correcto"
  y la observación. Antes era una columna por punto y no cabía en ningún ancho.
- **Mantenimiento:** servicios ordenados por fecha, con los días de atraso o los que faltan, y el consumo
  real contra el esperado.
- **Modales** (`FormModal`):
  - Errores por campo, con las mismas reglas que la API.
  - Bloqueo de doble envío; el modal no se cierra mientras se guarda.
  - El checklist toma el operador y el horómetro de la máquina, avisa si el horómetro es menor que el último
    registrado y pide describir la falla cuando la hay.
- **Carga por fuente:** si falla una (máquinas, despachos, checklists u obras), se dice cuál, con botón
  Reintentar, y el resto de la vista sigue funcionando. Sin el catálogo de obras, el modal de despacho lo
  explica.
- Se borró `components/machinery/MachineCard.tsx`: solo lo usaba esta vista.

## Bugs corregidos
- **El checklist no guardaba "Luces y alarmas":** no se capturaba y la API guardaba siempre "Correcto", así
  que una falla de luces nunca quedaba registrada. Ahora el campo es obligatorio en la API
  (`CreateChecklistDto.lucesYAlarmas`) y una falla deja el checklist "Con falla".
- **Alta de máquina con código en minúsculas:** la API revisaba el duplicado con el código tal como venía,
  pero lo guardaba en mayúsculas. Con "m005", la revisión pasaba y luego chocaba contra "M005" (error 500 en
  vez del aviso). Ahora se normaliza antes de revisar y el nombre se guarda recortado.
- **El filtro por tipo nunca coincidía:** comparaba los nombres del alta ("Excavación") con los del catálogo
  que devuelve la API ("Excavadora"), y "Retroexcavadora" no aparecía. Ahora las opciones salen de los tipos
  reales de la flota.
- **El operador del alta se perdía en silencio:** era texto libre, y si no coincidía exacto con un
  trabajador, la máquina quedaba sin operador sin avisar. El operador se asigna desde Trabajadores, que avisa
  si la máquina ya la tiene alguien. La API sigue aceptando el campo.
- **Un error en cualquier fuente dejaba toda la vista en error.**
- **Datos inventados:**
  - Banner con "94 % de disponibilidad".
  - Indicadores fijos: "14.2 L/hr", "5 Mayo – Kenworth" y "Desvío en Volteo M004".
  - Cronograma con fechas fijas.
  - "+96 %" fijo en las tarjetas. Ahora el sobreconsumo se calcula con el consumo real contra el esperado.
  - "Checklist OK · 06:45 AM" aunque la máquina no tuviera checklist. Ahora dice "Sin checklist hoy".
  - Alta: diésel de 100 % y consumo de 14 L/h si el campo quedaba vacío.
  - Checklist: operador "Juan Pérez" y horómetro 1240 por defecto.

## Archivos tocados
- `apps/web/src/app/(dashboard)/maquinaria/page.tsx` (reemplazo completo)
- `apps/web/src/components/machinery/MachineCard.tsx` (borrado)
- `apps/api/src/modules/checklists/dto/create-checklist.dto.ts`
- `apps/api/src/modules/checklists/checklists.service.ts`
- `apps/api/src/modules/maquinas/maquinas.service.ts`
- `apps/api/src/modules/checklists/checklists.service.spec.ts` (nuevo)
- `apps/api/src/modules/maquinas/maquinas.service.spec.ts` (nuevo)
- `apps/api/src/modules/checklists/checklists.integration.spec.ts` (nuevo)

## Verificación
- `npx tsc --noEmit` en `apps/web` y `apps/api`, y `npx eslint` de la vista: sin errores.
- Unitarias:
  - 6 nuevas: 4 de checklists y 2 de máquinas.
  - `npx jest` completo: 1137 de 1139. Las 2 que fallan son de `cobranza.service.spec.ts`, dependen de la
    fecha y ya fallaban.
- Integración contra Postgres real:
  - `checklists.integration.spec.ts`, 4 de 4: código en mayúsculas, duplicado rechazado y luces y alarmas
    guardadas. Limpia sus datos.
  - Corrida completa en serie: pasan Asistencia, Nómina, Trabajadores, GPS, Checklists, Combustible y
    Mantenimiento. Las 11 suites que fallan lo hacen porque a la BD local le faltan 13 migraciones de `main`
    ("column does not exist"). No es de este cambio.
- Smoke con curl y login real:
  - Checklist sin `lucesYAlarmas`: 400.
  - Alta con " m001 " (ya existe M001): 400 con el aviso de duplicado.
- Capturas a 390, 768, 1024 y 1440 px, en claro y oscuro:
  - Las cuatro pestañas.
  - Los tres modales, vacíos y con errores.
  - El cronograma con despachos.
  - Las fallas de carga simuladas (sin máquinas y sin obras).

## Pendientes
- Máquinas, despachos y checklists (módulos viejos) todavía no escriben auditoría: hacen falta acciones
  nuevas en `AuditAction`, es decir, una migración.
- El alta de máquina pone la ubicación de CDMX por defecto mientras no tenga GPS. Se revisa con la vista de
  GPS.
