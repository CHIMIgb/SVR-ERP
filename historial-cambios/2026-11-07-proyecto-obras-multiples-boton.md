# Diseño — flujo proyecto↔obra: regla de la obra base retirada + ubicación del botón

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Cambios realizados (docs)
§6.6 "DEBE SER" ampliado con las decisiones del cliente (sesión 2026-11-07):
1. **Obras múltiples:** un proyecto puede registrar N obras (multi-frente, ej.
   fraccionamiento). **Regla nueva:** al crear la primera obra manual, la obra base
   automática (heredada del nombre del proyecto) se retira con soft-delete
   (`eliminado_en`) en la misma transacción — quedan solo las obras del encargado.
   Proyecto sin manuales → muestra la base; con ≥1 manual → solo manuales.
2. **Ubicación del botón "Agregar obra":** acción contextual del proyecto (acciones
   de fila y/o modal Ver Detalle como "Obras (N)"), NO junto al botón "Registrar
   proyecto" — una obra SIEMPRE nace con proyecto_id (evita huérfanas, el bug de
   hoy). Motivo documentado.
3. Índice Tier 2 (tarea 11) actualizado con ambas reglas.

## Archivos tocados
- `docs-planes/IMPLEMENTACIONES-A-FUTURO.md`

## Pendientes y riesgos
- Sigue sin implementarse nada del flujo (queda en Tier 2, tarea 11).
- Detalle a decidir al implementar: si el proyecto pasa a 0 manuales después
  (ej. se eliminan todas las obras del encargado), ¿vuelve la base automática?
  Doc no lo cubre aún — decisión de implementación.
