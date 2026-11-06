# Combustible: vista limpia, sin datos precargados, y alerta de consumo que sí refleja las cargas

**Fecha:** 2026-11-05
**Autor:** P4chec0php

## Cambios realizados
- **Vista rehecha con la plantilla de `/inventario`:**
  - Encabezado corto y "Registrar carga", sin íconos.
  - Tokens de modo oscuro.
  - Indicadores históricos con su etiqueta: litros, gasto, rendimiento promedio y cargas con alerta. Tocar
    la tarjeta de alertas filtra la tabla.
  - Búsqueda en el servidor y filtros de máquina y de alerta. Tabla paginada; en móvil la fecha, el
    operador y el estado van dentro de la fila.
  - Editar y Eliminar en texto, según los permisos. Eliminar pide confirmación con botón rojo.
  - **Modal:**
    - Errores por campo con las reglas de la API.
    - Fecha de la carga (antes no se podía capturar).
    - El operador propuesto es el que tiene asignado la máquina.
    - Muestra el precio por litro.
    - Vista previa del rendimiento contra el esperado, con el mismo umbral de 35 % que usa la API para la
      alerta.
  - La vista usa `maquinasApi` en vez de `apiClient` directo.
- **API:**
  - Las cargas con fecha futura se rechazan, en el alta y en la edición, y quedan auditadas como FAIL
    `FECHA_FUTURA`.
  - DTO: código máximo de 20 caracteres, 2 decimales, topes de las columnas, lugar hasta 200 caracteres y
    operador hasta 150.
  - `GET /maquinas` deriva `rendimientoActualLtsHora` y `alertaConsumoAnormal` de la última carga real de
    cada máquina.

## Bugs corregidos
- **La alerta de consumo de Flota nunca cambiaba.** `alerta_consumo_anormal` y
  `rendimiento_actual_lts_hora` de la máquina no los actualiza ningún flujo: una carga nueva con
  sobreconsumo no encendía la alerta, y una normal no la apagaba. Ahora salen de la última carga.
- **Datos precargados en el formulario:** 120 L, 8 h y "Autoconsumo en Obra" ya capturados, más los
  ejemplos "Juan Pérez" y "Valle Sur".
- **Al editar o registrar se podían mandar 0 litros o 0 horas sin aviso:** un campo vacío se convertía en
  0.
- **Costo estimado guardado como gasto real:** la vista invitaba a dejar el costo vacío, y la API guardaba
  litros × $23 fijos. Ahora la vista lo pide siempre.
- **Si la máquina no tenía consumo esperado, la vista previa asumía 14 L/h.**
- **Emojis en avisos, notificación e insignia.**

## Archivos tocados
- `apps/api/src/modules/maquinas/maquinas.service.ts`
- `apps/api/src/modules/combustible/combustible.service.ts`, `dto/create-carga-combustible.dto.ts` y
  `dto/update-carga-combustible.dto.ts`
- `apps/api/src/modules/combustible/combustible.integration.spec.ts`
- `apps/web/src/app/(dashboard)/combustible/page.tsx` (reemplazo completo)

## Verificación
- `npx tsc --noEmit` en `apps/api` y `apps/web`, y `npx eslint` de la vista: sin errores.
- Unitarias de la API: 1167 de 1169. Las 2 que fallan son las de `cobranza.service.spec.ts`, que dependen
  de la fecha y ya fallaban.
- Integración en serie: pasan las 13 suites de los módulos nuestros y comunes, entre ellas la nueva de
  Horómetro. En Combustible se agregó:
  - Fecha futura: FAIL `FECHA_FUTURA` auditado.
  - Una carga de 37.5 L/h contra 14 esperados enciende la alerta que recibe Flota.
  - Las 11 suites que fallan son las de los módulos de `main` cuyas migraciones faltan en la base local.
- Smoke con curl: una carga con fecha futura da 400 con el mensaje en español, y `/maquinas` devuelve
  para M004 el rendimiento de su última carga (23.53 L/h) con la alerta encendida.
- Capturas a 390, 768, 1024 y 1440 px, en claro y oscuro: la vista, el modal con errores y la vista previa
  de la alerta, y la confirmación de eliminar.

## Pendientes (para decidir)
- **Costo opcional en la API:** si falta, `POST /combustible` sigue calculando litros × $23 fijos. Se dejó
  así por si otra app registra cargas sin costo; la vista web ya no lo permite. Conviene volverlo
  obligatorio o guardar el costo como pendiente.
- **Operador que no es trabajador registrado:** el que se escribe a mano solo se guarda si coincide con uno
  (la tabla tiene `operador_id`); si no, la lista muestra "Sin registrar". Hace falta una columna, es
  decir, una migración. Pasa lo mismo en el checklist de Flota.
- **GPS** sigue usando `alerta_consumo_anormal` de la máquina para el color del marcador. Se revisa en el
  paso de GPS.
