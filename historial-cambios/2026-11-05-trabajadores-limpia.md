# Trabajadores: vista limpia, modo oscuro, responsiva y sin datos inventados

**Fecha:** 2026-11-05
**Autor:** P4chec0php

## Cambios realizados
- Vista rehecha con el mismo patrón que Asistencia y Nómina:
  - Encabezado corto "Trabajadores" con dos botones sin íconos: "Baja y finiquito" y "Alta de trabajador".
  - Las tarjetas se cambiaron por una tabla, con encabezado neutro, paginación y columnas secundarias que se
    ocultan en pantallas medianas. Tocar una fila abre la edición, y las acciones van en texto: Bitácoras
    (operadores y choferes) y Dar de baja.
  - Filtros de puesto y de estado en selectores. Por defecto se ven los activos; los dados de baja ya no se
    mezclan con la plantilla.
  - La pestaña "Bitácoras de renta" es una tabla paginada; tocar una hoja abre las bitácoras de su operador.
    Se quitó la franja oscura con el título largo.
- Modal de alta y edición (`TrabajadorFormModal`, nuevo):
  - Errores por campo con las mismas reglas que la API.
  - Campos nuevos: fecha de ingreso (obligatoria, porque de ella sale la antigüedad del finiquito) y esquema
    de pago (antes siempre "Mixto").
  - La máquina avisa si la tiene otro operador.
- Modal de bitácoras:
  - Totales reales por estado: listas para facturar, pendientes de firma y facturadas.
  - Acción nueva **Registrar firma**: antes una hoja sin firma no se podía firmar desde ninguna pantalla y
    nunca llegaba a facturarse.
  - Captura con validaciones e importe a cobrar a la vista.
- Modal de baja y finiquito:
  - Ahora es más ancho y tiene una confirmación con botón rojo.
  - La carta para firma sale siempre en blanco y negro, y se imprime sola (regla `.solo-impresion`).

## Bugs corregidos
- **RRHH no podía asignar máquina ni proyecto, ni capturar bitácoras.** Los catálogos venían de
  `/maquinas` y `/catalogos/proyectos`, que piden permisos de Maquinaria y Operaciones, y RRHH recibía 403
  con los selectores vacíos y sin aviso. Se agregó `GET /trabajadores/catalogos`, con el permiso de
  Trabajadores.
- **Editar no guardaba el proyecto**: la API lo ignoraba. Ahora lo reemplaza, lo quita (`''`) y reactiva una
  asignación borrada antes sin chocar con la llave `(trabajador, proyecto)`. Un proyecto inexistente o
  inactivo da 404 (antes, en el alta, se ignoraba en silencio).
- **"Sin asignar" no se podía elegir como máquina**: un efecto volvía a poner la primera máquina, y en el
  alta le quitaba la máquina a su operador.
  - Al cambiar a un operador de categoría, su máquina ya no se queda asignada.
  - Si se le quita la máquina a otro operador, queda en la auditoría.
- **Datos inventados**:
  - Formulario: teléfono "55 0000 0000" y sueldos de 2000 y 3000 si el campo quedaba vacío. Un sueldo de 0
    se guardaba como 2000.
  - Captura de bitácora: tarifa de $1,450 y horómetros en 0.
  - Carta de finiquito: RFC, domicilio y firmante ficticios.
  - Finiquito: reparto "SPEI / efectivo" calculado con una regla que no existe.
  - API: fecha de ingreso 15/01/2023 si faltaba, y la del día del alta si no se mandaba.
- **Finiquito**:
  - Se podía liquidar dos veces al mismo trabajador, también con dos peticiones a la vez. La baja ahora es
    condicional dentro de la transacción.
  - Desde el botón del encabezado, "Confirmar" daba de baja al primer trabajador de la lista sin elegirlo.
  - Por `PATCH` (permiso de editar) se podía dar de baja sin finiquito o reactivar a alguien liquidado. Ya
    no: la baja solo se hace con "Baja y finiquito", que pide el permiso de eliminar.
  - A un dado de baja no se le asigna máquina ni proyecto.
  - Si el préstamo supera el finiquito, se avisa en vez de dejar el total en $0 sin explicación.
- **Bitácoras**:
  - Por `PATCH` se podía marcar "Facturado" sin crear la cuenta por cobrar, o cambiar el importe de una ya
    facturada.
  - Se podía borrar una facturada.
  - Facturar y editar al mismo tiempo podía dejar la cuenta por cobrar con un monto distinto al de la hoja.
  - Quitar la firma ahora regresa la hoja a "Pendiente de firma".
  - Se rechazan una fecha futura, más de 24 horas en un día y las horas en un formato que no sea `HH:mm`
    (antes daban error 500).
- **Fechas en UTC**: después de las 6 p. m., la fecha de la bitácora y la de la carta salían con el día
  siguiente.
- **Carta de finiquito**: se perdía el espacio después de los nombres en negritas ("Pérez(en lo…"), un fallo
  de compilación del JSX con `&quot;`. Lo mismo se corrigió en un texto de Asistencia.
- **`SearchBar` (compartido)**: el *debounce* nunca cancelaba el temporizador anterior, así que `onSearch`
  se disparaba una vez por tecla. Se corrigió, y los botones ahora son `type="button"`.
- **Otros**:
  - "Reintentar" dentro de un formulario lo enviaba.
  - Escape cerraba a la vez el modal de arriba y el de abajo, y se perdía lo capturado.
  - Una carga vieja podía pisar la de un filtro nuevo.
  - Tras una baja, la página podía quedar vacía y sin paginación.

## Cosas nuevas
- API:
  - `GET /trabajadores/catalogos`: máquinas con su operador actual y proyectos activos
    (`rrhh.trabajadores.ver`).
  - `apps/api/src/common/validacion.ts`: hora `HH:mm`, teléfono (al menos 7 dígitos), recorte de espacios y
    fecha futura en la zona de la empresa.
  - DTOs con topes de largo y de monto. `fechaContratacion` es obligatoria en el alta.
- Web:
  - `TrabajadorFormModal`.
  - `trabajadoresApi.catalogos()` y sus tipos en `lib/api.ts` (solo se agregó).
  - Se eliminó `WorkerCard` (lo reemplaza la tabla; era su único uso).

## Archivos tocados
- `apps/api/src/trabajadores/` (controller, service, DTOs y pruebas).
- `apps/api/src/bitacoras-renta/` (service, DTOs y pruebas).
- `apps/api/src/common/validacion.ts` (nuevo).
- `apps/web/src/app/(dashboard)/trabajadores/page.tsx`.
- `apps/web/src/components/workers/`: `TrabajadorFormModal.tsx` (nuevo), `BitacorasRentaModal.tsx`,
  `LiquidacionModal.tsx` y `WorkerCard.tsx` (eliminado).
- `apps/web/src/components/ui/SearchBar/SearchBar.tsx` (compartido).
- `apps/web/src/lib/api.ts` (solo se agregó).
- `apps/web/src/app/(dashboard)/asistencia/page.tsx` (un texto).

## Pruebas / verificación
- **Unitarias**: 1091 de 1093. Los 2 fallos son de `cobranza.service.spec.ts`, que ya fallaban antes por
  fecha. Las de trabajadores y bitácoras pasaron de 61 a 114.
- **Integración contra Postgres**:
  - Trabajadores, Asistencia, Nómina y GPS pasan. Incluyen dos bajas simultáneas del mismo trabajador (una
    se registra y la otra da 409) y el cambio de proyecto A → B → sin proyecto → A.
  - En bitácoras fallan solo los 3 casos de `facturar()`, que ya fallaban: a la base local le falta el valor
    de enum `BITACORA_FACTURADA` (migraciones pendientes).
- **Smoke con curl** (login real, usuario RRHH), con todas las respuestas como se esperaba:
  - RRHH carga los catálogos.
  - 400 por hora, fecha y teléfono inválidos, y por baja por `PATCH`.
  - 404 por proyecto inexistente.
  - 409 por doble baja, por reactivar a un dado de baja y por borrar o editar una bitácora facturada.
- `npx tsc --noEmit` (web y API) y `npx eslint` sin errores.
- **Capturas reales en Chrome** a 390, 768, 1024 y 1440 px, en claro y oscuro:
  - La plantilla, el formulario de alta y el de edición.
  - Bitácoras: modal, captura, registro de firma y confirmación de facturar.
  - Finiquito: el cálculo, el selector, la confirmación, la carta y la impresión emulada.
  - Los avisos de error, probados con la red caída.
  - El dado de baja se vio cambiando solo la respuesta en el navegador, sin escribir en la base.

## Pendientes y riesgos
- **Por confirmar (negocio):**
  - La razón social que firma la carta (hoy "CONSTRUCTORA SVR S.A. DE C.V.") y si se agregan RFC y domicilio
    reales.
  - Fórmula del finiquito (ya existía, no se cambió):
    - El aguinaldo usa días desde el aniversario y no los del año calendario.
    - El sueldo diario es el semanal entre 6.
    - El tope de 498 de la prima de antigüedad está desactualizado frente a 2 salarios mínimos.
  - Facturar una bitácora (crea la cuenta por cobrar) solo pide el permiso de RRHH. La firma del residente la
    captura el mismo usuario.
- El desglose del finiquito solo queda en la auditoría: no hay tabla para consultarlo después (requiere
  migración).
- Al dar de baja no se quitan las asignaciones a proyectos.
- No se valida que la hora de fin sea posterior a la de inicio (hay turnos que cruzan la medianoche).
