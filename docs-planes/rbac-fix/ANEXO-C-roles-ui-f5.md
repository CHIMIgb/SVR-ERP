# ANEXO C — Fase F5: pantalla `/roles` como fuente única de acciones

**Objetivo:** cuando los botones de TODAS las vistas se rijan por
`role_permissions`, la pantalla `/roles` debe reflejarlo: quien administre roles
necesita una sola forma de conceder/revocar acciones, y no checkboxes que ya no
tienen efecto.

## 1. Estado actual de `/roles` (verificado)

- **Tabs:** Roles · Usuarios (ficha 360).
- **Ficha de vista de un rol** (modal "Vistas de `<rol>`"): tabla con 5 checkboxes
  por vista — `puedeVer, puedeCrear, puedeEditar, puedeEliminar, puedeExportar`
  (`roles/page.tsx:953`) — que se guardan con `PATCH /roles/:id/vistas`
  (`VistasRolInput`). Para el Administrador (`es_sistema`) es solo lectura.
- **Ficha de permisos** (modal "Permisos de `<rol>`"): matriz por
  `(modulo, recurso, accion)` — `GET /roles/:id/permisos` +
  `PATCH /roles/:id/permisos` con `{ agregar: PermisoInput[], quitar: PermisoInput[] }`
  (audita `PERMISOS_ROL_ACTUALIZADAS`).
- Esas dos asignaciones **no se cruzan en ninguna parte** (causa raíz del plan).

## 2. Cambios de F5 (solo frontend; backend no cambia)

| # | Cambio | Detalle |
|---|---|---|
| 1 | **Vista modal: solo `puedeVer`** | El checkbox `puedeVer` se queda (controla menú + ruta). Los 4 checkboxes de acción se deshabilitan (no se eliminan del DOM) con nota: *"Las acciones se gestionan en la pestaña Permisos."* |
| 2 | **Se siguen enviando los valores guardados** | `PATCH /roles/:id/vistas` sigue recibiendo los 5 campos (evita tocar el DTO con `forbidNonWhitelisted`): el frontend manda los valores ya almacenados, sin permitir editar los 4 de acción. **Cero cambios de backend.** |
| 3 | **Pestaña Permisos = única fuente de acciones** | Ya existe y funciona; mejora de usabilidad: agrupar la matriz por módulo y, dentro del módulo, por recurso, con subtítulos ("Lo que ve" vs "Lo que hace": `*.ver` arriba, acciones abajo). Opcional, no bloquea. |
| 4 | **Filtro de "qué puede hacer en esta vista"** | Opcional: desde la fila de una vista, un link "→ permisos de este módulo" que abre la pestaña Permisos pre-filtrada por `modulo` de esa vista. Ayuda al admin a entender el nuevo modelo. |
| 5 | **Textos** | Ajustar copys de ayuda de la ficha: el modelo es "vista = dónde entra (menú); permisos = qué puede hacer". 100% es-MX. |

## 3. Lo que NO se toca en F5

- `soloLectura` del Administrador `es_sistema` (estado del recurso, no RBAC) — igual.
- El backend de vistas (`PATCH /roles/:id/vistas`) y su auditoría — igual.
- Las columnas de `role_vistas` en BD (`puede_crear`, etc.) — quedan como datos
  históricos/inertes; NO se renombran ni eliminan (convención del repo: nada de
  renombrados cosméticos en masa). Si algún día se quiere limpiar, migración propia.
- El seed — no requiere cambios: los permisos de acciones ya viven en
  `role_permissions`.

## 4. Verificación de F5

- Unitarios existentes de `roles.service` (54) siguen pasando sin cambios.
- Smoke: editar las vistas de un rol de negocio → solo `puedeVer` es editable;
  conceder `operaciones.inventario.crear` en la pestaña Permisos → el botón
  "Crear artículo" aparece en `/inventario` tras refetch del perfil (sin re-login,
  el AuthProvider debe refrescar `user.permisos` — verificar ese flujo);
  revocar → desaparece.
- Verificar que el toast de "Permisos actualizados" sigue sin el conteo entre
  paréntesis (fix del 2026-11-14).

## 5. Orden y dependencia

- F5 va **después de F2** (o en paralelo): si se hace primero, la UI de /roles
  promete un control (flags) que las vistas ya no leen — confusión temporal.
- F5 es bloqueante para el RELEASE, no para el desarrollo de F3/F4.
