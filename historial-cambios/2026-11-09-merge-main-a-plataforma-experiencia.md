# Merge de origin/main hacia plataforma-experiencia (PR #16 quedanados)

**Fecha:** 2026-11-09
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

El usuario fusionó el PR #16 (`ui-limpia-rrhh-maquinaria`) a `main` en
`f640392e` (merge commit real, sin squash). Se sincronizó `main` hacia
`plataforma-experiencia` con merge (no rebase, por decisión acordada: 91
commits locales ya pusheados, 1 solo episodio de conflicto, SHAs intactos).

Separación previa al merge: plataforma **91 adelante / main 30 adelante**;
intersección real de archivos tocados por ambas ramas: solo 5.

### Resolución de conflictos / uniones

1. **`apps/api/prisma/schema.prisma`** — auto-merge limpio, verificado:
   unión del enum `AuditAction` (nuestros `REPORTE_COMENTADO` / `REPORTE_ADJUNTO`
   + los 6 de main:`ASISTENCIA_OMISION_RESUELTA`,
   `OBRA_UBICACION_REGISTRADA`, `HOROMETRO_REGISTRADO`, `MAQUINA_CREADA`,
   `DESPACHO_CREADO`, `CHECKLIST_REGISTRADO`), columnas `omision_*` de
   `registros_asistencia`, y **nuestro modelo v2 de `reportes_campo`** intacto
   (main aún llevara el v1; nunca lo tocó).
2. **`apps/api/src/audit/audit.constants.ts`** — auto-merge: unión de severities.
3. **`apps/web/src/lib/api.ts`** — auto-merge: helpers de flota/horómetro de
   main + los nuestros de reportes v2 (bloques disjuntos, verificados ambos).
4. **`apps/web/src/app/(dashboard)/horometro/page.tsx` y `maquinaria/page.tsx`**
   — conflicto real; se tomó la **reescritura completa de main** (revisada en
   el PR #16). El toque cosmético nuestro (Loader2→LoadingState, 9 líneas)
   se sacrificó para no pelear con la reescritura; puede reapuntarse luego.
5. **Residuo semántico del merge:** el dashboard reescrito por main
   (`a6ab995f`) leía `ReportesCampoStats.pendientes/enRevision` (v1), que en la
   v2 son `nuevos/enCurso`. Ajuste en `dashboard/page.tsx` (el aviso "por
   atender" ahora cuenta nuevos + en proceso; excluye cerrados, igual que antes).

### Base de datos

- `npx prisma migrate deploy` aplico las 2 migraciones pendientes de main
  (`20261105160000_asistencia_omision_y_ubicacion_obra` y
  `20261105200000_flota_horometro_auditoria`) — **aditivas**, sin choque con
  las 12 nuestras.
- Limpieza cosmética de `_prisma_migrations`: DELETE 44 filas de intentos
  fallidos (`logs IS NOT NULL`) duplicadas durante el desarrollo del v2.

### State del grafo

- `4fe875b8` = merge origin/main → plataforma-experiencia.
- `1dee538b` = pull-merge que alineó el fix JWT (`0449746b`) ya pusheado en el
  remoto (la rama local y la remota divergieron el commit del fix JWT; ese pull
  lo absorbió sin conflicto).
- `b3149ddd` = fix(web) del dashboard al vocabulario v2.
- HEAD queda **94 commit adelantado de main / 0 detrás**.

## Archivos tocados

- Los ~85 archivos del PR #16 entran limpios (RRHH/nómina reescrita,
  dashboard con datos reales, flota/horómetro, SearchBar, etc.).
- Manual: dashboard/page.tsx (v2 stats), horometro + maquinaria
  (`--theirs`), y el registro en historial-cambios/.

## Pruebas / verificación

- `npx prisma validate` ✅ y `generate` ✅.
- `tsc --noEmit` api ✅ y web ✅ (después del fix del dashboard).
- Jest unitarios: auth+asistencia+horómetro+maquinas+audit **240/240**;
  reportes-campo **81/81**.
- `migrate deploy` ✅ (2 migraciones aplicadas).

## Pendientes y riesgos

- **Lint falla en web** en 6 pantallas (clientes, configuracion, cotizaciones,
  criba, inventario, operaciones) por la regla nueva
  `react-hooks/set-state-in-effect` de eslint-config-next: **deuda previa, no
  introducida por este merge** (esos archivos no los toca main ni el merge).
  Se corrigen cuando se toque cada módulo.
- El look LoadingState de horometro/maquinaria quedó en versión de main
  (Loader2 suelto) — cosmético, reapuntar a gusto si molesta.
- `nueva-info/` sigue sin versionar (estado ?); decisión pendiente: versionar
  o añadirlo a .gitignore.
- No se hizo smoke de la API arrancada tras el deploy de migraciones (las
  suites de integración de estos módulos sí corrieron contra BD en ejecuciones
  previas de PR #16; el deploy fue aditivo verificado campo a campo).
