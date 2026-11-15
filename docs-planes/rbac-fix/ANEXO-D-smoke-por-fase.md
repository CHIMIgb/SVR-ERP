# ANEXO D — Smokes de verificación por fase

Frontend sin infra de tests (deuda activa): cada fase lleva su smoke manual
documentado en el registro de `historial-cambios/`. `npx tsc --noEmit` + eslint
targeted son el gate automático de cada commit.

## 0. Rol de prueba (se usa en todas las fases)

1. En `/roles` crear un rol **QA-Sin-Acciones**: todas las vistas con `puedeVer`
   = true, SIN permisos de acción (pestaña Permisos: solo los `*.ver` necesarios).
2. Asignarlo a un usuario de prueba (ej. un segundo admin de prueba) y entrar con él.
3. Variante **QA-Con-Acciones**: mismo rol + los permisos de acción que se van
   probando, para verificar que los botones **aparecen** al conceder.

## F1 — Helper `puede()` / `usePuede()`

- `npx tsc --noEmit` (web) ✓ · eslint targeted ✓
- Smoke funcional real: lo aporta F2 (el helper no tiene pantalla propia).
- Verificación mínima: la firma compila con `UserAuth` de `@svr-erp/shared` y
  devuelve `false` con `user = null` (caso perfil no cargado).

## F2 — 13 vistas Comercial/Operaciones

Por vista, con QA-Sin-Acciones y luego QA-Con-Acciones:

| # | Vista | Sin acciones (esperado) | Con acciones (esperado) |
|---|---|---|---|
| 1 | `/reportes` | datos cargan; sin "Nuevo reporte", sin asignar/comentar/eliminar en el detalle | aparecen según permiso dado |
| 2 | `/operaciones` | sin "Registrar operación" ni editar/eliminar | ✓ |
| 3 | `/criba` | sin "Abrir turno" ni enviar a inventario; filtros de máquina/proyecto ocultos si faltan D3 | ✓ |
| 4 | `/inventario` | sin crear/editar/eliminar | ✓ |
| 5 | `/proyectos` | sin nuevo/editar/finanzas/eliminar | ✓ |
| 6 | `/clientes` | sin alta/edición; ficha 360 sin sección cotizaciones (D4) | ✓ |
| 7 | `/cotizaciones` | sin nueva cotización, sin facturar | ✓ |
| 8 | `/finanzas` | sin alta/edición; SIN botón Exportar (needs `finanzas.exportar`) | ✓ |
| 9 | `/proveedores` | sin abonar/recibir OC; sin "Nueva OC" si falta `inventario.ver` (D1) | ✓ |
| 10 | `/ventas` | sin vender/apertura/retiros/corte; área de cobro muestra estado vacío legible | ✓ |
| 11 | `/ventas/corte` | pantalla consulta bien; sin ejecutar corte | ✓ |
| 12 | `/ventas/cierres` | lista de cierres visible; sin aprobar/rechazar | ✓ |
| 13 | `/facturas` | sin nueva factura, sin conceptos; Exportar solo con `facturas.exportar` | ✓ |

Checks transversales de F2:
- **Un solo aviso por carga fallida** (sin toasts duplicados — se verificó el caso
  `/inventario` con stats + catálogos).
- Refetch con datos en pantalla: overlay + toast, NUNCA banner ni botones que
  parpadeen.
- Mutación sin permiso (si algo se filtra): toast de `mensajeErrorApi` con el 403
  humanizado — nunca texto crudo.
- Grep residual (Anexo B): `puedeCrear|puedeEditar|puedeEliminar|puedeExportar`
  → 0 en las 13 vistas + `ConciliacionBancaria.tsx`.

## F3 — Vistas RRHH/Maquinaria/Sistema (otro dev)

- `trabajadores` (17 flags): sin alta/baja/editar con QA-Sin-Acciones; "Reiniciar
  PIN" sigue rigiéndose por `sistema.usuarios.editar` (ya correcto hoy); modal
  Bitácoras de renta hereda el gate del padre.
- `nomina`: **el caso semilla del usuario** — QA-Sin-Acciones con `nomina.ver`
  ve el listado; con `editar` ve "Marcar pagado"/"Pagar todos"; el botón
  "Sincronizar asistencia" SOLO aparece con `nomina.procesar` (caso del Anexo A).
- `asistencia` (aprobar/rechazar horas extra), `mantenimiento`, `combustible`,
  `gps` (geocercas), `horometro`, `equipos`, `usuarios`, `roles`, `dashboard`
  (secciones que consumen stats de otros módulos).
- Criterio: mismo grep residual, extendido a los archivos de la fase.

## F4 — PWA `/m/*` (dev PWA)

- Con QA-Sin-Acciones: la nav inferior (sale de `user.vistas`) muestra solo las
  vistas con `puedeVer`; las acciones de captura que exijan permiso de acción se
  ocultan (offline-first: la cola local no debe encolar acciones que el rol no
  puede hacer — verificar interacción cola↔permisos).
- Login PIN con el rol de prueba; mismas tuplas que escritorio.

## F5 — Pantalla `/roles`

- Ficha de vista: solo `puedeVer` editable; los 4 de acción deshabilitados con
  la nota "en Permisos"; guardar no rompe (se reenvían valores guardados).
- Pestaña Permisos: conceder/revocar se refleja en las vistas tras refetch del
  perfil (probar SIN re-login).
- Administrador `es_sistema`: sigue solo lectura.
- Toast "Permisos actualizados" sin conteo (regresión del fix del 14-nov).

## Criterio de salida global del lote

1. Grep residual = solo `puedeVer` + `soloLectura` de roles + permisos directos.
2. Todos los smokes de arriba documentados en los registros de cada commit.
3. Los 3 planes de la carpeta sin "pendiente de decisión" abierto
   (D1–D5 del Anexo A resueltos).
