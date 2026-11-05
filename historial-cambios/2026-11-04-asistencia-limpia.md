# Asistencia: vista limpia, modo oscuro y responsiva

**Fecha:** 2026-11-04
**Autor:** P4chec0php

## Cambios realizados
- Vista rehecha según la referencia del cliente:
  - Encabezado "Asistencia" con subtítulo corto y botones sin íconos: Marcar entrada / salida, Pase de
    lista, Ir a nómina (este último solo si el usuario tiene acceso a Nómina).
  - Tira de 4 indicadores sin íconos: En sitio, Fuera de obra, Sin marcaje hoy, Horas extra hoy (con monto).
  - Pestañas Hoy / Semana / Horas extra / Sin marcaje con contadores.
  - Selector de puesto (en lugar de 6 píldoras de colores) y filtro segmentado Todos / En sitio / Fuera / Anticipada.
  - Tablas con encabezado neutro; en pantallas medianas se ocultan columnas secundarias para que quepan.
  - Resumen semanal con un solo tinte suave por estado; sin banners de colores en Horas extra ni Sin marcaje.
- Modo oscuro completo (vista y modales) con los tokens `surface` / `ui-*`.
- Modal de detalle (`AsistenciaGpsModal`) rehecho: resumen de geocerca, datos del marcaje, esquema de la
  geocerca sin animaciones y sección de horas extra. Se quitaron las pestañas Entrada/Salida (mostraban lo mismo).
- Se conservó toda la funcionalidad: marcaje GPS de entrada/salida/horas extra, salida anticipada con
  notificación, pase de lista por cuadrilla, autorizar horas extra, registrar falta, validar o justificar.

## Bugs corregidos
- Carga de datos: si la API fallaba, el error se veía un instante y la vista quedaba en ceros sin aviso; y
  si se caía la red (el cliente HTTP lanza excepción), la vista se quedaba en "Cargando…" para siempre.
  Ahora cada fuente (trabajadores, obras, registros, semana) reporta su error en un aviso con "Reintentar",
  la vista nunca se traba, y los indicadores muestran "—" en lugar de un 0 que parecería real.
- "Sin marcaje" ya no se calcula si no cargaron completos los trabajadores o los registros de hoy (antes,
  con registros fallidos, salía todo el personal y se le podía registrar falta a quien sí asistió).
- "Registrar falta" y "Autorizar" se bloquean mientras se procesan (un doble clic creaba dos faltas, que
  se descuentan en nómina). El marcaje y el pase de lista tampoco se envían dos veces.
- Un fallo al refrescar la lista después de guardar ya no se reporta como fallo de la acción.
- GPS: se informa la causa real (permiso denegado, tiempo agotado, posición no disponible), se ignoran
  respuestas tardías de solicitudes viejas y no se envía una posición anterior ni mientras se obtiene.
- Coordenadas manuales: se validan rangos (latitud −90 a 90, longitud −180 a 180) y el registro queda
  marcado como "Coordenadas manuales" en el dispositivo.
- Validaciones: trabajador y obra obligatorios; horas de salida anticipada entre 0 y 24; horas extra
  mayores a 0 y hasta 24. Al abrir cada modal el formulario empieza limpio (la cuadrilla ya no viene
  preseleccionada).
- El pase de lista también avisa cuando la obra no tiene coordenadas configuradas.
- Las tarjetas que filtran la tabla limpian la búsqueda y el puesto, para que el número cuadre.
- Un estado de día desconocido en el resumen semanal se muestra tal cual en neutro, nunca como "Falta".
- El modal de detalle mostraba Confirmar / Marcar falta / Autorizar aunque el usuario no tuviera permiso
  de editar; al presionarlos no pasaba nada. Ahora solo aparecen con permiso.
- El modal de detalle ocultaba el mensaje real de la API en los errores; ahora lo muestra.
- El modal decía "Geolocalización en turno extra: En sitio de obra" fijo, sin dato que lo respalde. Ahora
  muestra la ubicación registrada al iniciar, si existe.
- Validaciones nuevas: el motivo de la salida anticipada es obligatorio (antes la notificación quedaba
  "Motivo: .") y las horas extra deben ser mayores a 0 (antes se enviaban 0 h).
- En el resumen semanal los días futuros salían como "Descanso"; ahora salen como "—". Los días anteriores
  a la contratación (que la API también marca como "Descanso") salen como "No aplica".
- Se quitaron dos `setState` dentro de efectos (trabajador por defecto y GPS al abrir modales).

## Archivos tocados
- `apps/web/src/app/(dashboard)/asistencia/page.tsx` (modificado)
- `apps/web/src/components/workers/AsistenciaGpsModal.tsx` (modificado)

## Pruebas / verificación
- `npx tsc --noEmit` y `npx eslint` sin errores; `npm run build` correcto.
- Capturas reales en Chrome (login real, API local) a 390, 768, 1024 y 1440 px, en claro y oscuro, de la
  vista, sus 4 pestañas y los 3 modales. Para ver filas sin escribir en la base, en el navegador de prueba
  se sustituyó solo la respuesta de `GET /api/asistencia` por 4 registros de ejemplo (trabajadores reales).

- Caminos de error probados en el navegador: API que responde con error en `/api/asistencia` y red caída
  (conexión rechazada): aparece el aviso con el motivo y la vista sigue usable.

## Pendientes y riesgos
- Se quitó la tarjeta "Salidas anticipadas" (la referencia del cliente tiene 4 indicadores); el filtro
  "Anticipada" sigue disponible.
- **API (por decidir):** el resumen semanal cuenta el día de hoy como falta desde temprano, aunque el
  trabajador todavía pueda marcar. Hay que definir a partir de qué hora una ausencia de hoy es falta.
- **Por decidir:** si la obra no tiene coordenadas, el marcaje se valida contra un punto de referencia fijo y
  el resultado (en sitio / fuera) se guarda como real. Se avisa en pantalla, pero no se bloquea.
- No se probó marcar con GPS real desde un celular (el navegador de prueba no da ubicación); el flujo de
  coordenadas manuales sí se ve correcto.
