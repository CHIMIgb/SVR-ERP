# 2026-11-12 — /proyectos: presupuesto con separador de miles, alta sin fecha de hoy y obras del catálogo solo en proceso

## Qué se hizo

1. **`apps/web/src/app/(dashboard)/proyectos/page.tsx`**
   - `presupuesto` de los modales **crear** y **editar** pasa de `type="number"`
     a `type="text"` + `inputMode="decimal"` con dos helpers locales:
     `formatearMiles()` (limpia todo lo que no sea dígito/punto, comas cada 3 en
     la parte entera, máx. 2 decimales) y `parsearMiles()`. Se escribe `30000` y
     se ve `30,000`; `3000000` → `3,000,000`; `1,200,000` pegado se normaliza.
   - `openEdit` muestra el presupuesto ya formateado; `validateForm` y
     `buildPayload` parsean el valor sin comas (sigue rechazando ≤ 0 y no
     numéricos).
   - `emptyForm.fechaInicio` ya **no** se precarga con la fecha de hoy: el alta
     abre vacía y la validación existente exige capturarla.
2. **`apps/api/src/bitacora/bitacora.service.ts`** — el catálogo de obras de
   `/operaciones` filtra `estado: 'EN_PROCESO'` en vez de `not: 'FINALIZADA'`
   (el select y el filtro "Obra" solo ofrecen obras en proceso; una
   `RECIEN_INICIADA` ya no aparecería).
3. **`bitacora.service.spec.ts`** — el mock y el test del catálogo ahora
   verifican el `where.estado === 'EN_PROCESO'`.
4. **Datos demo**: 4 proyectos creados vía `POST /proyectos` (crean su obra 1:1
   y su auditoría; **sin SQL directo**, para no repetir el problema de
   `seed-proyectos-demo.sql`):
   - Ampliación Hospital General Tepic — Gobierno Municipal — 18,500,000 — EN_PROCESO
   - Bodega logística Corredor Industrial — Desarrollos Riviera — 7,250,000 — EN_PROCESO
   - Rehabilitación drenaje Col. Emiliano Zapata — Gobierno Municipal — 3,400,000 — EN_PROCESO
   - Parque Lineal Río Mololoa — Gobierno Municipal — 6,100,000 — FINALIZADO

## Verificación

- `npx tsc --noEmit` (web) y `npx tsc --noEmit -p tsconfig.json` (api): sin errores.
- `npx eslint "src/app/(dashboard)/proyectos/page.tsx"`: solo los 2 hallazgos
  preexistentes (`useMemo` sin usar y `setState` en el efecto de carga); el
  lint global sigue con los 56 problemas que ya tenía el repo.
- `npx jest src/bitacora`: **80/80**.
- Formateo comprobado con node: `30000→30,000`, `3000→3,000`,
  `3000000→3,000,000`, `30000.555→30,000.55`, `abc→''` (la validación lo rechaza).
- `GET /bitacora/catalogos` real: **11 obras, 11 `EN_PROCESO`** (8 previas + las 3
  nuevas); "Parque Lineal Río Mololoa" (FINALIZADA) **no** aparece.
- BD: los 4 proyectos tienen su obra con nombre, estado y ubicación heredados.

## Pendientes / riesgos

- El modal de **finanzas** (`ingresoCobrado` / `gastado`) sigue con input numérico
  sin comas — no se tocó porque no estaba en el alcance.
- Las 4 obras demo nacen **sin geocerca** (`lat/lng/radio` NULL): para marcar
  asistencia contra ellas hay que ubicarlas desde `/asistencia` ("Ubicar obra").
- Los proyectos demo se crearon por API en esta BD local; no hay seed
  reproducible en el repo (decisión: no volver a insertar por SQL directo).
- Sigue pendiente la sincronización de la dirección proyecto → obra de B2.2.
