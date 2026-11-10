# Dashboard con datos reales y vista limpia

**Fecha:** 2026-11-08
**Autor:** P4chec0php

## Cambios realizados
Todo el Dashboard salía de `lib/data.ts`: el "98 % de capacidad", la salida anticipada, el goteo hidráulico y el mapa
eran texto fijo. Tampoco tenía modo oscuro y el cliente pidió quitar "Acciones rápidas" y los íconos.

- **Se quitó:** el banner grande, "Acciones rápidas", el mapa inventado, el margen por proyecto (salía de un valor
  fijo de 15 %) y casi todos los íconos.
- **Indicadores:** máquinas operando, personal en sitio hoy, alertas de consumo y servicios cercanos. Cada uno lleva
  a su módulo.
- **Avisos**, de más a menos urgente: incidentes críticos, servicios pasados, omisiones vencidas, posible ordeña,
  omisiones de hoy, servicios próximos y reportes por atender. Muestra hasta 8 e indica cuántos más hay.
- **Proyectos en proceso** con presupuesto, cobrado y avance reales.
- **Por rol:** cada fuente se pide solo si el rol tiene su vista, así que no hay 403 ni datos ajenos. Un rol sin
  flota (RRHH) ve sus indicadores de asistencia y sus avisos a todo el ancho.
- **Omisiones:** usa el mismo cálculo que "Omisiones hoy" de Asistencia, para que las dos pantallas den igual.
- **Si una fuente falla:** banner con el detalle y Reintentar, "—" en lugar de 0, y la lista de avisos dice que está
  incompleta. Tampoco afirma que no hay omisiones si la fecha del equipo no coincide con la del servidor.
- Modo oscuro con tokens y responsiva.

No cambia la API ni la base de datos.

## Archivos tocados
- `apps/web/src/app/(dashboard)/dashboard/page.tsx`

## Verificación
- `npx tsc --noEmit` y eslint de la vista: sin errores.
- Capturas reales a 390, 768, 1024 y 1440 px, en claro y oscuro: sin desbordes. En oscuro, 0 fondos claros, también
  con banner y lista llena. El único texto bajo 3:1 es el blanco sobre naranja de marca del menú.
- Números comparados contra la API con datos locales: operando, en mantenimiento, alerta de consumo, servicios y
  reportes coinciden.
- Con la API real y usuario RRHH: solo ve asistencia y avisos, sin errores 403.
- Con respuestas simuladas y el reloj del navegador en lunes: 4 omisiones con 2 vencidas y 1 por llegar, orden de
  avisos, tope de 8 y fecha desfasada.
- Red caída en las 6 fuentes y en una sola, y Reintentar al volver la red: se recupera sin recargar.
- Clics a Flota, Combustible, Mantenimiento y Proyectos llevan a su módulo.

No se probó un día laboral con registros reales de asistencia: hoy es domingo y no hay marcajes.

## Pendientes
- El tope es de 200 registros de asistencia por día, igual que en la vista de Asistencia.
- Los contadores "24" de Trabajadores y "3" de Mantenimiento en el menú lateral son fijos en `Sidebar.tsx` y no
  corresponden con los datos reales.
