# FLUJO-PROGRESO-PROYECTOS.md — SVR-ERP

Documentación del control físico y financiero de proyectos: CRUD (implementado),
flujo de avance Planificado vs. Real para la **Curva S** (siguiente fase) y
agregación de costos reales (fase final).

---

## 1. Estado actual — Fase 1 completada ✅

### 1.1 CRUD de proyectos

| Pieza | Ubicación |
|-------|-----------|
| Módulo NestJS | `apps/api/src/proyectos/` |
| Endpoints | `GET/POST /proyectos`, `GET/PATCH/DELETE /proyectos/:id` |
| Estadísticas | `GET /proyectos/stats` |
| Catálogo | `GET /proyectos/catalogos` → clientes reales de BD |
| RBAC | `operaciones.proyectos.ver / crear / editar / eliminar` |
| Auditoría | `PROYECTO_CREADO`, `PROYECTO_ACTUALIZADO`, `PROYECTO_ELIMINADO` |
| Frontend | `apps/web/src/app/(dashboard)/proyectos/page.tsx` consume la API real |

### 1.2 Campos financieros agregados en Fase 1

Solo se agregaron a `proyectos` los campos que **ningún módulo genera** y que
son captura directa de administración:

```sql
ingreso_cobrado  DECIMAL(14,2) NOT NULL DEFAULT 0  -- facturado/cobrado al cliente
gastado          DECIMAL(14,2) NOT NULL DEFAULT 0  -- costo real acumulado
```

Ambos son editables desde el modal **Editar Proyecto**. Con ellos el modal de
detalle calcula utilidad neta y margen reales:

```
utilidadReal            = ingresoCobrado − gastado
margenUtilidadPorcentaje = (utilidadReal ÷ ingresoCobrado) × 100
```

### 1.3 Decisión explícita: desgloses NO almacenados en `proyectos`

Los renglones `gastoNomina`, `gastoCombustible`, `gastoMantenimiento` y
`gastoMateriales` del modal **no son columnas de BD**. Deben salir por
agregación de sus módulos fuente (ver sección 4). Almacenarlos como captura
manual crearía una segunda fuente de verdad que divergiría de nómina,
combustible e inventario.

Mientras la fase final no exista, esos renglones muestran `$0` (honesto), y
solo `Presupuesto`, `Ingreso Cobrado`, `Gastado`, `Utilidad` y `Margen`
reflejan datos reales.

---

## 2. Curva S — Flujo de progreso Planificado vs. Real (Fase 2)

### 2.1 Modelo ya existente en BD

La tabla `hitos_progreso` fue diseñada exactamente para esto:

| Columna | Tipo | Uso en la curva S |
|---------|------|-------------------|
| `proyecto_id` | UUID FK → proyectos (cascade) | A qué obra pertenece el punto |
| `periodo` | String (obligatorio) | Etiqueta del eje X (`"2026-01"`, `"Ene"`) |
| `planificado` | Decimal(5,2) | Serie **Planificado** (%) |
| `real` | Decimal(5,2) | Serie **Real** (%) |
| `nombre` | String? | Nombre del hito (`"Cimentación"`) — opcional |
| `fecha` | Date? | Fecha de corte del registro — opcional |
| `descripcion` | String? | Nota del avance — opcional |
| Soft delete + auditoría | — | Consistente con el resto del ERP |

El gráfico del modal (`LineChart` de `ui/Charts`) consume directamente:

```ts
labels = hitos.map(h => h.periodo)
series = [
  { name: 'Planificado', data: hitos.map(h => h.planificado), color: '#ed8238' },
  { name: 'Real',        data: hitos.map(h => h.real),        color: '#1e293b' },
]
```

### 2.2 Flujo operativo

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. LÍNEA BASE (al crear o planear el proyecto)                  │
│    El residente/director de obra define los % planificados      │
│    por periodo: Ene 10% · Feb 30% · Mar 50% · Abr 75%...        │
│    → POST /proyectos/:id/hitos  (uno por periodo)               │
├─────────────────────────────────────────────────────────────────┤
│ 2. CORTE SEMANAL/QUINCENAL                                      │
│    El residente registra el avance REAL acumulado del periodo   │
│    → PATCH /proyectos/:id/hitos/:hitoId  { real: 27 }           │
├─────────────────────────────────────────────────────────────────┤
│ 3. SINCRONIZACIÓN AUTOMÁTICA                                    │
│    El service actualiza proyectos.progreso = último "real"      │
│    → la barra de la tabla y las StatsCards quedan sincronizadas │
├─────────────────────────────────────────────────────────────────┤
│ 4. VISUALIZACIÓN                                                │
│    GET /proyectos/:id/hitos → alimenta LineChart del modal      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Endpoints propuestos

Todos bajo `@RequirePermission('operaciones', 'proyectos', 'editar')` para
escritura y `'ver'` para lectura:

| Método | Ruta | Función |
|--------|------|---------|
| `GET` | `/proyectos/:id/hitos` | Lista ordenada por `periodo` (alimenta curva S) |
| `POST` | `/proyectos/:id/hitos` | Alta de hito (línea base o punto adicional) |
| `PATCH` | `/proyectos/:id/hitos/:hitoId` | Actualiza `% real` (y planificado si re-planean) |
| `DELETE` | `/proyectos/:id/hitos/:hitoId` | Soft delete del hito |

DTO de creación:

```ts
export class CreateHitoDto {
  @IsString() @IsNotEmpty() periodo!: string;        // "2026-01"
  @IsNumber() @Min(0) @Max(100) planificado!: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) real?: number; // default 0
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsDateString() fecha?: string;
  @IsOptional() @IsString() @MaxLength(500) descripcion?: string;
}
```

Auditoría nueva requerida: `HITO_CREADO`, `HITO_ACTUALIZADO`, `HITO_ELIMINADO`.

### 2.4 Reglas de negocio

1. **Un hito por periodo por proyecto** — validar unicidad `(proyecto_id, periodo)`
   en el service (`BadRequestException` si duplicado).
2. **Acumulativo, no incremental** — `real` es el % acumulado de obra terminada,
   no el avance del mes. La validación `real(n) ≥ real(n−1)` se recomienda como
   advertencia (no bloqueo: puede haber retrocesos reales por trabajos mal ejecutados).
3. **Sincronía con `proyectos.progreso`** — cada vez que se actualiza un `real`,
   el service fija `proyectos.progreso = max(real)` de sus hitos activos.
4. **Rango válido 0–100** — validado en DTO y service.
5. **Línea base protegida** — una vez iniciada la obra (existe algún `real > 0`),
   modificar el `planificado` requiere permiso `editar`; documentar el cambio queda
   cubierto por la auditoría automática.

### 2.5 SPI — Índice de Desempeño de Tiempo

Ya calculado en el modal; con hitos reales deja de ser aproximado:

```
SPI = progreso_real_del_periodo ÷ planificado_del_periodo

SPI ≥ 1  → al corriente o adelantado   🟢
SPI < 1  → desfase de tiempo           🟠
```

---

## 3. Costos reales por agregación (Fase final)

### 3.1 Mapa de fuentes

Cada renglón financiero del modal proviene de módulos existentes:

| Concepto del modal | Fuente de datos (tabla(s)) | Condición |
|--------------------|---------------------------|-----------|
| Nómina y Horas Extras | `nominas` + `horas_extra_asistencia` filtradas por trabajadores del proyecto (`trabajadores_proyectos`) | Requiere módulo nómina migrado a backend |
| Diésel de Maquinaria | `cargas_combustible` de máquinas con despacho activo al proyecto (`despachos_maquina`) | Requiere módulo maquinaria/combustible migrado |
| Refacciones y Mantenimiento | `mantenimientos` + salidas de `movimientos_inventario` vinculadas a máquina del proyecto | Requiere inventario/mantenimiento migrado |
| Materiales y Criba | `movimientos_inventario` (salidas) asignadas al proyecto | Requiere inventario migrado |

> Los módulos de bitácora, combustible e inventario están parcialmente en
> frontend/mock. Agregar costos antes de su migración calcularía sobre datos
> incompletos. Por eso esta fase va **al final**, no por dificultad sino por
> dependencia de datos.

### 3.2 Endpoint propuesto

```
GET /proyectos/:id/finanzas?desde=2026-01-01&hasta=2026-12-31

Respuesta:
{
  ingresoCobrado: number,     // columna administrativa (ya existe)
  gastadoCalculado: number,   // suma de las 4 agregaciones
  desglose: {
    nomina: number,
    combustible: number,
    mantenimiento: number,
    materiales: number,
  }
}
```

Decisión pendiente para esa fase: usar `gastadoCalculado` directo, o mantener
la columna manual `gastado` como *override* administrativo cuando haya costos
fuera de sistema (recomendación inicial: mostrar ambos y usar el calculado para CPI).

### 3.3 CPI — Índice de Desempeño de Costo

```
ValorGanado (EV) = presupuesto × progreso_real
CostoReal  (AC)  = gastado (manual hoy, calculado en fase final)

CPI = EV ÷ AC

CPI ≥ 1  → bajo presupuesto        🟢
CPI < 1  → sobrecosto              🔴
```

---

## 4. Resumen de fases

| Fase | Alcance | Estado |
|------|---------|--------|
| **1. CRUD + financieros admin** | Backend, frontend, auditoría, tests | ✅ Implementado |
| **2. Hitos de progreso (Curva S)** | Endpoints de hitos, UI de línea base y corte, sync de `progreso`, SPI real | ⬜ Siguiente |
| **3. Agregación de costos (CPI real)** | `GET /proyectos/:id/finanzas`, desgloses del modal desde módulos fuente | ⬜ Final — depende de migración de nómina, combustible, mantenimiento e inventario |

---

*Mantener este documento actualizado conforme se implementen las fases 2 y 3.*
