# Documentación del sistema de notificaciones y alertas (README + AGENTS)

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** pregunta del usuario — «¿documentaste cómo funciona el sistema de alertas?» (estaba solo en el chat y en el registro de cambios)

## Cambios realizados
- **`README.md` — nueva sección «Sistema de notificaciones y alertas»** (área backend):
  flujo end-to-end en 5 pasos (emisión best-effort con el catálogo → persistencia
  de una fila por aviso con audiencia triple + lecturas por usuario → buzón con
  `filtroDeBuzon` → `NotificationProvider` con polling de 60 s → hueco de la PWA
  anotado como pendiente), y el **paso a paso para crear una alerta nueva**
  (definición en el catálogo + emisión con `construirAlerta` + test).
- **`AGENTS.md` — regla operativa para agentes** (`### Notificaciones — catálogo
  obligatorio`): prohibido escribir `titulo`/`cuerpo` inline; toda alerta nueva
  nace en `catalogo.ts` (definición + fila del inventario); audiencia con los
  helpers; `TipoNotificacion` no se extiende; el filtro del buzón no se relaja
  (fuga de torres 2026-11-20 documentada).
- El catálogo ya estaba auto-documentado (tabla de inventario + convenciones en
  su encabezado, commit `abea901e`); esta pieza agrega la documentación de
  SISTEMA que faltaba en el repo.

## Archivos tocados
- `README.md` (nueva sección)
- `AGENTS.md` (nueva regla backend)
- `historial-cambios/2026-11-20-doc-sistema-alertas.md` (creado)

## Verificación / pruebas
- `git diff --check`: sin errores. Cambio solo de documentación.

## Pendientes y riesgos
- El catálogo aún no está conectado a los 11 sitios de emisión (commits b y c
  del plan autorizado — pendientes de ejecutar).
- Sin push: el commit queda local.
