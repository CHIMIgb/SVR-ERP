# 2026-11-13 — B5.3: emisión de notificaciones desde 4 eventos del ERP

## Qué se hizo

- **`NotificacionesService.emitirARol(nombreRol, input)`** — helper nuevo que
  resuelve el rol por NOMBRE (sin UUIDs hardcodeados) y emite; best-effort
  doble (rol inexistente o fallo de BD → solo warning, nunca revierte el
  negocio).
- **4 eventos de dinero, cada uno dentro del service que ya maneja el evento,
  después del audit SUCCESS:**
  | Evento | Vista/Service | Audiencia | Tipo |
  |---|---|---|---|
  | OC **aprobada** | `proveedores.cambiarEstadoOrden` | Administrativo | ALERTA |
  | **Abono registrado** (CxP) | `proveedores.registrarAbono` | Administrativo | INFO |
  | **Cierre de caja** creado (pendiente de aprobación) | `ventas.createCierre` | Administrador | ALERTA |
  | **Nómina pagada** (`pagar-todos`) | `nomina.pagarTodos` | Administrativo | INFO |
- Módulos Proveedores/Ventas/Nómina importan `NotificacionesModule` (exportado
  en B5.2). El findFirst de `cambiarEstadoOrden` ganó `include proveedores`
  para el cuerpo del mensaje.
- Scripts de seed que instancian services a mano actualizados con stubs de
  notificaciones (`seed-proveedores.ts`, `seed-demo-workflows.ts`).

## Verificación

- `npx tsc --noEmit` (api): limpio.
- Unit: **198/198** en ventas + nómina + proveedores + notificaciones (los
  specs de ventas/nómina/proveedores recibieron el provider mock de
  `NotificacionesService`).

## Pendientes / riesgos

- Integración real (evento → fila en `notificaciones`) queda para el smoke del
  cierre (B5.4), donde la API queda arriba y se puede probar de punta a punta.
- El evento "CxP/CxC por vencer" NO se enchufó: depende de las dudas #34, #7 y
  #5 del SVR (plan §12) — con la tubería lista, es un `emitirARol` más.
- La emisión es best-effort: si la BD falla en el create, la notificación se
  pierde silenciosamente (loggeada) — decisión del diseño F1 para no
  comprometer la transacción de negocio.
