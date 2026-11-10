# Mantenimiento: vista limpia, modo oscuro, indicadores reales y filtro que ya no truena

**Fecha:** 2026-11-05
**Autor:** P4chec0php

## Cambios realizados
- **Vista rehecha con la plantilla de `/inventario`:**
  - Encabezado corto y "Registrar servicio", sin íconos.
  - Tokens de modo oscuro; antes todo era `slate-*` y la vista no cambiaba de tema.
  - Indicadores del servidor: servicio cerca o pasado (50 h o menos), servicios del mes con cuántos fueron
    correctivos, costo del mes y máquinas sin servicio registrado.
  - Búsqueda en el servidor con debounce y filtros de máquina y tipo. Tabla paginada; en móvil la fecha y la
    descripción van dentro de la fila.
  - Editar y Eliminar en texto, según los permisos de la vista. Eliminar pide confirmación con botón rojo.
  - Modal con errores por campo y las reglas de la API. En un alta, el horómetro del servicio sale del
    horómetro actual de la máquina.
  - Carga por fuente con aviso y Reintentar. Antes, si fallaban los indicadores o las máquinas, no se avisaba
    nada.
  - La vista usa `maquinasApi` en vez de `apiClient` directo.
- **API:**
  - `GET /mantenimiento/stats` agrega `umbralServicioHoras`, `serviciosMes`, `costoMes`, `correctivosMes` y
    `sinServicioRegistrado`. `promedioHorasServicio` y `equiposEnOptimoEstado` se quedan por compatibilidad,
    pero la vista ya no los muestra:
    - El promedio era del horómetro al momento del servicio.
    - "Óptimo" contaba como óptimas a las máquinas sin ningún servicio.
  - Las estadísticas usan el cálculo compartido del próximo servicio y ya no hacen `findMany` sin tope.
  - DTO de alta y edición: código máximo de 20 caracteres, descripción de 3 a 500, 2 decimales y topes de
    las columnas.

## Bugs corregidos
- **`GET /mantenimiento?maquinaId=<código inexistente>` daba 500:** metía `'__sin_resultados__'` en una
  columna uuid. Ahora filtra por el código de la máquina y devuelve una lista vacía.
- **La fecha por defecto del alta salía en UTC:** después de las 6 pm proponía la fecha de mañana.
- **Un costo vacío se guardaba como $0 sin avisar.** Ahora se pide (0 si no tuvo costo).
- **Datos de ejemplo en los campos** ("1200", "1450", "5500") y emoji en la notificación.

## Archivos tocados
- `apps/api/src/modules/mantenimiento/mantenimiento.service.ts`, `dto/create-mantenimiento.dto.ts` y
  `dto/update-mantenimiento.dto.ts`
- `apps/api/src/modules/mantenimiento/mantenimiento.service.spec.ts` y `mantenimiento.integration.spec.ts`
- `apps/web/src/lib/api.ts` (solo se agregaron campos a `MantenimientoStats`)
- `apps/web/src/app/(dashboard)/mantenimiento/page.tsx` (reemplazo completo)

## Verificación
- `npx tsc --noEmit` en `apps/api` y `apps/web`, y `npx eslint` de la vista: sin errores.
- Unitarias: 99 de 99. Incluyen el filtro por código y las estadísticas del mes.
- Integración contra Postgres real (37 de 37 en serie con Flota, Horómetro y Combustible):
  - Un código inexistente da lista vacía.
  - El último servicio define el próximo, y Flota lo recibe en horas.
  - Las estadísticas del mes salen de los registros reales.
- Smoke con curl: el filtro por código inexistente da 200 con lista vacía (antes 500) y un costo con 3
  decimales da 400.
- Capturas a 390, 768, 1024 y 1440 px, en claro y oscuro: la vista, el modal con errores y la confirmación
  de eliminar.

## Pendientes
- Registrar un servicio no mueve el horómetro de la máquina; eso lo hacen las lecturas de Horómetro.
