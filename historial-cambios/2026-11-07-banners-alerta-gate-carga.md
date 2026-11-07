# Ajuste — banners de alerta (stock crítico, incidentes críticos): ocultos durante la carga, aparición animada

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Diagnóstico (pregunta del usuario: "¿qué sería lo correcto?")
Las alertas-banner de datos (rojas) aparecían "de golpe" porque su condición solo
miraba el conteo (`lowStockCount > 0` / `stats.criticosActivos > 0`), sin esperar
la carga. Alternativas evaluadas:
- Skeleton rojo del banner: DESCARTADO — un skeleton de una alerta roja simula una
  emergencia que puede no existir (si al cargar el conteo es 0, el skeleton
  desaparecería: falsa alarma).
- Contador de spinner dentro del banner siempre visible: DESCARTADO — el banner
  mismas desaparece si no hay alertas (parpadeeo ruido).
- **Elegido:** el banner NO existe durante la carga (los skeletons de la tabla
  llenan la vista); aparece justo DESPUÉS de la carga solo si su condición lo
  confirma, con animación de entrada sutil (`fadeScaleIn`, keyframe global ya
  existente para modales, 0.2s).

## Cambios realizados
1. **/inventario**: banner "Alerta de Stock Crítico" gateado por
   `{!initialLoading && lowStockCount > 0 && (...)}` + animación de entrada.
2. **/reportes**: banner "Incidentes Críticos Activos" gateado por
   `{!initialLoading && stats.criticosActivos > 0 && (...)}` + animación.
3. Auditoría del alcance OP/Com: esas 2 son las ÚNICAS alertas-banner de datos
   en el par de módulos (los demás hits del grep son mock de maquinaria/dashboard
   en deuda F4, y labels de filtros en cobranza).

## Verificación
- `npx tsc --noEmit`: 0 errores.

## Pendientes y riesgos
- Si el reviewer del martes quiera un skeleton "neutro" para el banner (gris,
  no rojo) durante la carga, se cambia a `<Skeleton variant="row">` — diseño
  variables; hoy no existe batch porque el banner es condicional por naturaleza.
- Las deudas de mock (dashboard/maquinaria) conservan sus alertas mock — tocar
  cuando se migren (F4).
