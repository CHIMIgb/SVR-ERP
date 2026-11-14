# 2026-11-14 — Ficha 360: permisos como chips, sesiones con scroll y conteo honesto

## Qué se hizo

Sobre el análisis pedido por el cliente en /roles → tab Usuarios:

**API (`83cb5f0c`):**
- **Sesiones vivas reales**: la ficha filtraba solo `activa=true`, pero las
  sesiones vencidas por fecha siguen marcadas activas (nadie las cierra al
  expirar — en BD había 167 activas y 16 ya vencidas). Ahora el conteo y la
  lista filtran `expira_en > ahora` — el "139" del admin baja a lo real.
- El **cierre masivo** sigue cerrando TODAS las activas (vivas + vencidas):
  sirve de limpieza del histórico.
- **Fallback de dispositivo**: los logins de escritorio no llenan
  `dispositivo` (solo lo hace el login-PIN con 'pwa-pin') pero guardan
  `user_agent` — ahora muestra "Web" con ese dato, no "Desconocido" a
  ciegas.
- Test de integración actualizado: sesión viva + sesión vencida → la ficha
  cuenta 1 y el cierre masivo cierra 2.

**Web:**
- **Permisos como chips agrupadas por módulo** (mismo estilo que las
  Vistas): cada chip `recurso · acción`, dentro de contenedor con scroll
  propio — se acabó el texto corrido.
- **Sesiones activas en contenedor con scroll propio** (`max-h-60`,
  `scrollbar-none`).
- **Tooltips en las letras** de las chips de vistas: C=Crear, E=Editar,
  X=Eliminar, Ex=Exportar (title al pasar el mouse) — la chip aparece solo
  si el rol puede Ver; las letras son permisos extra del rol.

## Verificación

- `npx tsc --noEmit` (web y api) limpio. Unit **54/54**; integración
  **24/24** (la ficha ya no cuenta sesiones vencidas y el masivo las
  limpia).
- Smoke visual en navegador pendiente (sin navegador).

## Pendientes / riesgos

- Las 16 sesiones vencidas de la BD seguirán `activa=true` hasta que
  alguien abra su ficha y use "Cerrar sesiones" (que las limpia) — si
  molestan a escala, un sweeper como el de `token_blacklist` (P13) las
  barre.
- "Última actividad" sigue siendo el último refresco de token (~15 min),
  no cada clic — así está diseñada la sesión.
