# Tier 0 tarea 3 — F2: estandarizar loaders/skeletons (aplicación del kit existente)

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Análisis previo (aprobado por el usuario)
El kit YA existe y estaba documentado (`LoadingState`, `Skeleton` ×6 variantes,
`SkeletonText`, `DataTable loading/emptyText`, `Button loading`, `FormModal
isSubmitting`) — no se creó ningún "sistema nuevo". El gap era de páginas:
spinners `Loader2` artesanale + 11 overlays de refresco copiado-pega idénticos
(patrón repetido 3+ veces → extraer a ui, regla del repo).

## Cambios realizados
1. **Componente nuevo (única pieza):** `src/components/ui/RefreshOverlay/`
   (3 archivos según patrón ui) — overlay translúcido para refetches sobre
   datos ya cargados; null cuando `show=false`. Documentado en
   `COMPONENTS.md` §4.7 con props/ejemplos/cuándo usar/no usar.
2. **11 overlays consolidados** en 10 páginas (inventario, clientes ×2,
   criba, cotizaciones, facturas, finanzas, operaciones, proyectos, reportes,
   ventas/cierres) → `<RefreshOverlay show={...} />`:
   - proyectos/reportes usaban un spinner border-CSS propio → ahora el estándar.
   - ventas/cierres tenía `bg-white/60` sin token (bug dark: quedaba blanco) →
     el componente usa `bg-surface/60`.
3. **6 cargas a pulmón → `LoadingState`:** horometro (py-24), maquinaria
   (py-24), configuracion (en Card), clientes (tab consolidado del modal),
   ventas (card del catálogo POS con su texto), app/page.tsx (login).
4. **Imports limpiados: `Loader2` muertos** en 6 overlay-páginas + horometro,
   maquinaria, configuracion, ventas (+ import de `LoadingState` donde faltó).
5. Fuera de alcance por decisión: RouteGuard/Sidebar/Topbar/login-submit
   (nivel layout, con lógica de auth propia); mock de dashboard/gps/documentos
   (deuda consolidada en F4).

## Incidente controlado durante la ejecución
El primer script de reemplazo (v1, regex con `[\s\S]*?` suelto) fue codicioso y
corrompió bloques vecinos — **se revirtió con `git checkout --`** y se rehizo con
regex estricto anclado a línea (--dry verificado antes de escribir). Lección
reiterada: anchores línea a línea + dry-run; nunca match a través de bloques
sueltos. El script corrector v2 reubicó los 10 imports mal insertados (cayeron
dentro del import multilínea de lucide) tras el ÚLTIMO import terminado en ';'.

## Verificación
- `npx tsc --noEmit` (apps/web): **0 errores**.
- ESLint fichero a fichero (15 tocados): `Loader2 unused` eliminados de la lista;
  los 14 warnings de imports sin uso restantes **ya existían en HEAD** (verificado
  con `git stash`/baseline — nada nuevo introducido).
- Diff: `-57/+21` aprox en 10 páginas + archivo ui nuevo + docs.
- Visual pendiente del usuario (demo martes).

## Pendientes y riesgos
- Los warnings/errors de lint PREEXISTENTES (setState-in-effect, comillas, etc.)
  siguen como deuda — no bloquean, pero se enumeran por si el reviewer los ve.
- La copia huérfana `node_modules/web/src/...` sigue ahí (limpieza futura).
