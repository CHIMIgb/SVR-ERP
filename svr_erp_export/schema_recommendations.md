# schema_recommendations.md — Analisis Completo de Base de Datos SVR-ERP

## 1. Reglas Arquitectonicas Fundamentales

Antes de cualquier cambio, el esquema debe cumplir estas reglas no negociables:

1. **Todas las claves primarias son UUID.** Sin excepciones. No usar `serial`, `bigserial` ni IDs numericos autoincrementables.
2. **Todas las tablas de negocio llevan campos de auditoria:**
   - `creado_en TIMESTAMP(3) NOT NULL`
   - `actualizado_en TIMESTAMP(3) NOT NULL`
   - `creado_por UUID REFERENCES users(id) ON DELETE SET NULL`
   - `actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL`
   - `eliminado_en TIMESTAMP(3)` (soft delete)
   - `activo BOOLEAN DEFAULT TRUE NOT NULL`
3. **Nombres de tablas y columnas en snake_case.** En Prisma se mapean a camelCase con `@map`.
4. **Listas cerradas y estables se modelan como ENUMs PostgreSQL.** Catalogos administrables o extensibles se modelan como tablas.
5. **Toda FK lleva indice implicito o explicito.**
6. **No se permite `DELETE` fisico** en tablas de negocio; solo actualizacion de `eliminado_en`.
7. **Campos numericos para dinero usan `NUMERIC(p,2)`.** Precision minima 12,2; recomendado 14,2 para totales.
8. **Fechas y horas no usan `TEXT`.** Usar `DATE`, `TIME` o `TIMESTAMP(3)` segun corresponda.
9. **JSONB solo para datos estructurados variables.** No para relaciones ni datos que deban indexarse frecuentemente.
10. **Toda tabla de negocio requiere trigger** que actualice `actualizado_en` automaticamente.

---

## 2. Inventario del Esquema Actual

Base de datos: `svr_erp`  
Motor: PostgreSQL 16.10  
ORM: Prisma (evidenciado por `_prisma_migrations`)  
Dump: formato custom v1.15-0 (`svr_erp.dump`) + backup texto plano (`svr_erp.sql`)

### 2.1 ENUMs Existentes

| Enum | Valores | Uso principal |
|---|---|---|
| `CategoriaApuItem` | MATERIAL, MANO_DE_OBRA, MAQUINARIA | `apu_items.categoria` |
| `CategoriaDocumento` | PERSONAL, PROYECTOS, MAQUINARIA, PROVEEDORES, CONTABILIDAD | `documentos.categoria` |
| `CategoriaPuesto` | OPERADOR, CHOFER, MECANICO, INGENIERO, ADMINISTRATIVO | `trabajadores.categoria_puesto` |
| `DiaSemana` | LUN, MAR, MIE, JUE, VIE, SAB | `dias_asistencia_semana.dia` |
| `EstadoAsistencia` | PUNTUAL, RETARDO, FALTA, JUSTIFICADO, NO_PRESENTADO, SALIDA_ANTICIPADA | `registros_asistencia.estado` |
| `EstadoAsistenciaDia` | PUNTUAL, RETARDO, FALTA, JUSTIFICADO, SALIDA_ANTICIPADA, DESCANSO | `dias_asistencia_semana.estado` |
| `EstadoChecklist` | APROBADO, CON_FALLA | `checklists_preoperacionales.estado` |
| `EstadoCobroBitacora` | LISTO_FACTURAR, FACTURADO, PENDIENTE_FIRMA | `bitacoras_renta_diaria.estado_cobro` |
| `EstadoCotizacion` | PENDIENTE, ACEPTADA, RECHAZADA | `cotizaciones.estado` |
| `EstadoHoraExtra` | EN_CURSO, APROBADO, PENDIENTE, RECHAZADO | `horas_extra_asistencia.estado` |
| `EstadoIncidente` | ABIERTO, EN_REVISION, RESUELTO | `incidentes.estado` |
| `EstadoLlantas` | CORRECTO, DESGASTE_SEVERO, DANO | `checklists_preoperacionales.estado_llantas_orugas` |
| `EstadoMaquina` | ENCENDIDA, APAGADA, MANTENIMIENTO, MOVIMIENTO | `maquinas.estado` |
| `EstadoPermiso` | PENDIENTE, APROBADO, RECHAZADO | `permisos.estado` |
| `EstadoProyecto` | EN_PROCESO, FINALIZADO, PAUSADO | `proyectos.estado` |
| `EstadoRenta` | RENTADO_CLIENTE, EN_OBRA_PROPIA, DISPONIBLE_PATIO | `trabajadores.estado_renta` |
| `EstadoReporteCampo` | PENDIENTE, VISTO, ATENDIDO, EN_REVISION, RESUELTO | `reportes_campo.estado` |
| `EstadoSistema` | CORRECTO, FALLA | `checklists_preoperacionales.luces_y_alarmas`, `sistema_frenos` |
| `EstadoTrabajador` | ACTIVO, INACTIVO, VACACIONES | `trabajadores.estado` |
| `MetodoPago` | TARJETA, EFECTIVO, MIXTO | `trabajadores.metodo_pago` |
| `NivelAceite` | CORRECTO, BAJO, EXCESO | `checklists_preoperacionales.nivel_aceite_motor` |
| `NivelBinario` | CORRECTO, BAJO | `checklists_preoperacionales.nivel_hidraulico` |
| `Prioridad` | BAJA, MEDIA, ALTA, CRITICA | `incidentes.prioridad`, `reportes_campo.prioridad` |
| `TipoDocumento` | CONTRATO, IDENTIFICACION, FACTURA, MANUAL, PERMISO, POLIZA | `documentos.tipo` |
| `TipoMantenimiento` | CORRECTIVO, PREVENTIVO | `registros_mantenimiento.tipo` |
| `TipoPermiso` | VACACIONES, PERMISO, INCAPACIDAD | `permisos.tipo` |
| `TipoReporteCampo` | MECANICO, OPERADOR, PIPERO, CHECADOR, INCIDENTE, INGENIERO, TRABAJADOR | `reportes_campo.tipo` |
| `TipoTransaccion` | INGRESO, EGRESO | `transacciones.tipo` |
| `Turno` | MATUTINO, VESPERTINO | `registros_criba.turno` |

### 2.2 Tablas Existentes

#### `_prisma_migrations`
Tabla interna de Prisma. No tocar.

#### `apu_templates`
Plantillas de analisis de precios unitarios. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `apu_items`
Items que componen una plantilla APU. Faltan: `activo`, `creado_en`, `actualizado_en`, `creado_por`, `actualizado_por`, `eliminado_en`.

#### `articulos_inventario`
Catalogo de articulos. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `asistencias_semanales`
Resumen semanal de asistencia. Faltan: `activo`, `creado_por`, `actualizado_por`, `eliminado_en`.

#### `bitacoras_operacion`
Actividades operativas de maquinas. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `bitacoras_renta_diaria`
Bitacoras diarias de renta. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `cargas_combustible`
Registro de cargas de diesel. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `checklists_preoperacionales`
Checklist pre-operacional. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `clientes`
Catalogo de clientes. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`, RFC, direccion fiscal.

#### `contactos_emergencia`
Contactos de emergencia. Faltan: `activo`, `creado_por`, `actualizado_por`, `eliminado_en`.

#### `cotizaciones`
Cotizaciones a clientes. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`, vendedor_id.

#### `despachos_maquina`
Asignacion de maquinas a proyectos. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `dias_asistencia_semana`
Detalle diario de asistencia. Faltan: `activo`, `creado_en`, `actualizado_en`, `creado_por`, `actualizado_por`, `eliminado_en`.

#### `documentos`
Documentos adjuntos. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `firmas_cliente`
Firmas de cliente en bitacoras. Faltan: `activo`, `creado_en`, `actualizado_en`, `creado_por`, `actualizado_por`, `eliminado_en`.

#### `hitos_progreso`
Hitos de avance. Faltan: `activo`, `actualizado_en`, `creado_por`, `actualizado_por`, `eliminado_en`.

#### `horas_extra_asistencia`
Registro de horas extra. Faltan: `activo`, `creado_por`, `actualizado_por`, `eliminado_en`.

#### `incidentes`
Incidentes en obra. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `lecturas_horometro`
Lecturas de horometro. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `licencias_trabajador`
Licencias de trabajadores. Faltan: `activo`, `creado_por`, `actualizado_por`, `eliminado_en`.

#### `maquinas`
Flota de maquinaria. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `permisos`
Permisos del negocio (vacaciones). Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `proyectos`
Proyectos/obras. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `registros_asistencia`
Registros diarios de asistencia. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `registros_criba`
Registros de produccion de criba. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `registros_mantenimiento`
Registros de mantenimiento. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `reportes_campo`
Reportes desde campo. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `trabajadores`
Catalogo de trabajadores. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`.

#### `trabajadores_proyectos`
Relacion N:N trabajadores-proyectos. Faltan: `activo`, `creado_por`, `actualizado_por`, `eliminado_en`.

#### `transacciones`
Transacciones financieras. Faltan: `creado_por`, `actualizado_por`, `eliminado_en`, FKs a entidades originales.


### 2.3 Relaciones Existentes (FKs)

| Tabla hija | Columna | Tabla padre | ON DELETE |
|---|---|---|---|
| `apu_items` | `apu_template_id` | `apu_templates` | CASCADE |
| `asistencias_semanales` | `trabajador_id` | `trabajadores` | RESTRICT |
| `bitacoras_operacion` | `maquina_id` | `maquinas` | RESTRICT |
| `bitacoras_renta_diaria` | `cliente_id` | `clientes` | RESTRICT |
| `bitacoras_renta_diaria` | `maquina_id` | `maquinas` | RESTRICT |
| `bitacoras_renta_diaria` | `trabajador_id` | `trabajadores` | RESTRICT |
| `cargas_combustible` | `maquina_id` | `maquinas` | RESTRICT |
| `cargas_combustible` | `operador_id` | `trabajadores` | SET NULL |
| `checklists_preoperacionales` | `maquina_id` | `maquinas` | RESTRICT |
| `checklists_preoperacionales` | `operador_id` | `trabajadores` | SET NULL |
| `contactos_emergencia` | `trabajador_id` | `trabajadores` | CASCADE |
| `cotizaciones` | `cliente_id` | `clientes` | RESTRICT |
| `despachos_maquina` | `maquina_id` | `maquinas` | RESTRICT |
| `despachos_maquina` | `proyecto_id` | `proyectos` | RESTRICT |
| `dias_asistencia_semana` | `asistencia_semanal_id` | `asistencias_semanales` | CASCADE |
| `documentos` | `trabajador_id` | `trabajadores` | SET NULL |
| `firmas_cliente` | `bitacora_id` | `bitacoras_renta_diaria` | CASCADE |
| `hitos_progreso` | `proyecto_id` | `proyectos` | CASCADE |
| `horas_extra_asistencia` | `registro_asistencia_id` | `registros_asistencia` | CASCADE |
| `incidentes` | `maquina_id` | `maquinas` | SET NULL |
| `lecturas_horometro` | `maquina_id` | `maquinas` | RESTRICT |
| `licencias_trabajador` | `trabajador_id` | `trabajadores` | CASCADE |
| `maquinas` | `operador_id` | `trabajadores` | SET NULL |
| `permisos` | `trabajador_id` | `trabajadores` | RESTRICT |
| `proyectos` | `cliente_id` | `clientes` | RESTRICT |
| `registros_asistencia` | `proyecto_id` | `proyectos` | SET NULL |
| `registros_asistencia` | `trabajador_id` | `trabajadores` | RESTRICT |
| `registros_criba` | `operador_id` | `trabajadores` | SET NULL |
| `registros_mantenimiento` | `maquina_id` | `maquinas` | RESTRICT |
| `reportes_campo` | `maquina_id` | `maquinas` | SET NULL |
| `trabajadores` | `cliente_renta_actual_id` | `clientes` | SET NULL |
| `trabajadores_proyectos` | `proyecto_id` | `proyectos` | CASCADE |
| `trabajadores_proyectos` | `trabajador_id` | `trabajadores` | CASCADE |

### 2.4 Indices Existentes

- PKs en todas las tablas.
- Unique indexes sobre `codigo` y `folio` donde aplica.
- Unique indexes sobre FKs uno-a-uno (`contactos_emergencia.trabajador_id`, `firmas_cliente.bitacora_id`, etc.).
- Algunos indices compuestos por `(maquina_id, fecha)`.

---

## 3. Decision: ENUM vs Tabla

| Concepto | Decision | Justificacion |
|---|---|---|
| `CategoriaApuItem` | **Mantener ENUM** | Lista cerrada y estable |
| `CategoriaDocumento` | **Mantener ENUM** | Lista cerrada |
| `CategoriaPuesto` | **Convertir a tabla** `categorias_puesto` | Puede crecer o tener salarios base |
| `DiaSemana` | **Mantener ENUM** | Invariable |
| `EstadoAsistencia` / `EstadoAsistenciaDia` | **Mantener ENUM** | Estados de workflow cerrado |
| `EstadoChecklist` | **Mantener ENUM** | Cerrado |
| `EstadoCobroBitacora` | **Mantener ENUM** | Workflow cerrado |
| `EstadoCotizacion` | **Mantener ENUM** | Workflow cerrado |
| `EstadoHoraExtra` | **Mantener ENUM** | Workflow cerrado |
| `EstadoIncidente` | **Mantener ENUM** | Workflow cerrado |
| `EstadoLlantas` | **Mantener ENUM** | Cerrado |
| `EstadoMaquina` | **Mantener ENUM** | Cerrado |
| `EstadoPermiso` | **Mantener ENUM** | Workflow cerrado |
| `EstadoProyecto` | **Mantener ENUM** | Workflow cerrado |
| `EstadoRenta` | **Mantener ENUM** | Cerrado |
| `EstadoReporteCampo` | **Mantener ENUM** | Workflow cerrado |
| `EstadoSistema` | **Mantener ENUM** | Cerrado |
| `EstadoTrabajador` | **Mantener ENUM** | Cerrado |
| `MetodoPago` | **Mantener ENUM** | Cerrado |
| `NivelAceite` / `NivelBinario` | **Mantener ENUM** | Cerrado |
| `Prioridad` | **Mantener ENUM** | Cerrado |
| `TipoDocumento` | **Mantener ENUM** | Cerrado |
| `TipoMantenimiento` | **Mantener ENUM** | Cerrado |
| `TipoPermiso` | **Mantener ENUM** | Cerrado |
| `TipoReporteCampo` | **Mantener ENUM** | Cerrado |
| `TipoTransaccion` | **Mantener ENUM** | Cerrado |
| `Turno` | **Mantener ENUM** | Cerrado |
| `tipo` en `maquinas` | **Convertir a tabla** `tipos_maquina` | Catalogo administrable |
| `categoria` en `articulos_inventario` | **Convertir a tabla** `categorias_inventario` | Catalogo administrable |
| `unidad` en varias tablas | **Convertir a tabla** `unidades_medida` | Catalogo reutilizable |
| `proveedor` en `articulos_inventario` | **Convertir a tabla** `proveedores` | Entidad de negocio |
| `obra` / `obra_ubicacion` / `ubicacion` | **Convertir a tabla** `obras` | Entidad de negocio |
| `parentesco` en `contactos_emergencia` | **Mantener TEXT o ENUM** | Lista pequena; si es fija, ENUM |
| `tipo` en `licencias_trabajador` | **Convertir a ENUM** | Tipos de licencia estables |

---

## 4. Nuevas Tablas Requeridas

### 4.1 Autenticacion y Autorizacion

```sql
CREATE TABLE personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    apellido_paterno TEXT,
    apellido_materno TEXT,
    rfc TEXT,
    curp TEXT,
    correo TEXT UNIQUE,
    telefono TEXT,
    fecha_nacimiento DATE,
    genero TEXT,
    direccion JSONB,
    avatar_url TEXT,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL UNIQUE REFERENCES personas(id) ON DELETE RESTRICT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email_verificado BOOLEAN DEFAULT FALSE NOT NULL,
    telefono_verificado BOOLEAN DEFAULT FALSE NOT NULL,
    factor_doble_habilitado BOOLEAN DEFAULT FALSE NOT NULL,
    ultimo_login TIMESTAMP(3),
    intentos_fallidos INTEGER DEFAULT 0 NOT NULL,
    bloqueado_hasta TIMESTAMP(3),
    preferencias JSONB DEFAULT '{}'::jsonb,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    nivel INTEGER DEFAULT 0 NOT NULL,
    es_sistema BOOLEAN DEFAULT FALSE NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modulo TEXT NOT NULL,
    recurso TEXT NOT NULL,
    accion TEXT NOT NULL,
    descripcion TEXT,
    UNIQUE (modulo, recurso, accion),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL
);

CREATE TABLE role_permissions (
    rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE users_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    es_principal BOOLEAN DEFAULT FALSE NOT NULL,
    asignado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    asignado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE (user_id, rol_id)
);
```

### 4.2 Menu Dinamico por Rol

```sql
CREATE TABLE vistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    ruta TEXT NOT NULL UNIQUE,
    icono TEXT,
    orden INTEGER DEFAULT 0 NOT NULL,
    vista_padre_id UUID REFERENCES vistas(id) ON DELETE SET NULL,
    es_menu BOOLEAN DEFAULT TRUE NOT NULL,
    es_visible BOOLEAN DEFAULT TRUE NOT NULL,
    requiere_auth BOOLEAN DEFAULT TRUE NOT NULL,
    target TEXT DEFAULT '_self' NOT NULL,
    badges JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);

CREATE TABLE role_vistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    vista_id UUID NOT NULL REFERENCES vistas(id) ON DELETE CASCADE,
    puede_ver BOOLEAN DEFAULT TRUE NOT NULL,
    puede_crear BOOLEAN DEFAULT FALSE NOT NULL,
    puede_editar BOOLEAN DEFAULT FALSE NOT NULL,
    puede_eliminar BOOLEAN DEFAULT FALSE NOT NULL,
    puede_exportar BOOLEAN DEFAULT FALSE NOT NULL,
    asignado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    asignado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE (rol_id, vista_id)
);
```

### 4.3 Sesiones y Tokens

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_jti UUID NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    dispositivo TEXT,
    ubicacion TEXT,
    iniciada_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ultima_actividad TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expira_en TIMESTAMP(3) NOT NULL,
    cerrada_en TIMESTAMP(3),
    motivo_cierre TEXT,
    activa BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    jti UUID NOT NULL UNIQUE,
    token_hash TEXT NOT NULL,
    emitido_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expira_en TIMESTAMP(3) NOT NULL,
    usado_en TIMESTAMP(3),
    reemplazado_por UUID REFERENCES refresh_tokens(id) ON DELETE SET NULL,
    revocado_en TIMESTAMP(3),
    motivo_revocado TEXT,
    activo BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE token_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jti UUID NOT NULL UNIQUE,
    token_hash TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('ACCESS', 'REFRESH')),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    razon TEXT NOT NULL,
    expira_en TIMESTAMP(3) NOT NULL,
    agregado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_token_blacklist_jti ON token_blacklist(jti);
CREATE INDEX idx_token_blacklist_expira ON token_blacklist(expira_en);
```

### 4.4 Auditoria Inmutable

```sql
CREATE TYPE actor_type AS ENUM ('USER', 'SYSTEM');
CREATE TYPE audit_action AS ENUM (
    'LOGIN_EXITOSO', 'LOGIN_FALLIDO', 'LOGOUT',
    'TOKEN_REFRESCADO', 'TOKEN_REVOCADO', 'SESION_CERRADA',
    'USUARIO_CREADO', 'USUARIO_ACTUALIZADO', 'USUARIO_ELIMINADO',
    'ROL_ASIGNADO', 'ROL_REVOCADO', 'PERMISO_MODIFICADO',
    'VISTA_CREADA', 'VISTA_ACTUALIZADA', 'VISTA_ELIMINADA',
    'PERSONA_CREADA', 'PERSONA_ACTUALIZADA',
    'DOCUMENTO_CREADO', 'DOCUMENTO_ACTUALIZADO', 'DOCUMENTO_ELIMINADO',
    'REPORTE_CREADO', 'REPORTE_ACTUALIZADO', 'REPORTE_ELIMINADO',
    'ESTATUS_CAMBIADO',
    'PAGO_REGISTRADO', 'PAGO_ACTUALIZADO', 'PAGO_ELIMINADO',
    'NOMINA_PROCESADA', 'COMBUSTIBLE_CARGADO',
    'MAQUINA_ASIGNADA', 'MAQUINA_LIBERADA',
    'ERROR_SISTEMA'
);
CREATE TYPE audit_result AS ENUM ('SUCCESS', 'FAIL', 'DENIED');
CREATE TYPE audit_severity AS ENUM ('INFO', 'WARNING', 'CRITICAL');

CREATE TABLE registro_auditoria (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL,
    actor_type actor_type NOT NULL,
    action audit_action NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    result audit_result NOT NULL,
    severity audit_severity DEFAULT 'INFO' NOT NULL,
    ip_address TEXT NOT NULL DEFAULT 'unknown',
    user_agent TEXT NOT NULL DEFAULT 'unknown',
    session_id UUID,
    request_id UUID NOT NULL DEFAULT gen_random_uuid(),
    correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    error_code TEXT,
    previous_value JSONB,
    new_value JSONB,
    metadata JSONB,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE OR REPLACE FUNCTION audit_immutable_guard()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'La tabla registro_auditoria es inmutable. No se permiten UPDATE ni DELETE.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable_update
BEFORE UPDATE ON registro_auditoria
FOR EACH ROW EXECUTE FUNCTION audit_immutable_guard();

CREATE TRIGGER trg_audit_immutable_delete
BEFORE DELETE ON registro_auditoria
FOR EACH ROW EXECUTE FUNCTION audit_immutable_guard();

CREATE INDEX idx_audit_timestamp ON registro_auditoria(timestamp DESC);
CREATE INDEX idx_audit_user ON registro_auditoria(actor_user_id);
CREATE INDEX idx_audit_entity ON registro_auditoria(entity_type, entity_id);
CREATE INDEX idx_audit_action ON registro_auditoria(action);
CREATE INDEX idx_audit_correlation ON registro_auditoria(correlation_id);
CREATE INDEX idx_audit_result ON registro_auditoria(result);
```

### 4.5 Catalogos Normalizados

```sql
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE,
    nombre TEXT NOT NULL,
    rfc TEXT,
    correo TEXT,
    telefono TEXT,
    direccion JSONB,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);

CREATE TABLE categorias_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL
);

CREATE TABLE tipos_maquina (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL
);

CREATE TABLE unidades_medida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    categoria TEXT,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL
);

CREATE TABLE obras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE,
    nombre TEXT NOT NULL,
    proyecto_id UUID REFERENCES proyectos(id) ON DELETE SET NULL,
    ubicacion TEXT,
    lat NUMERIC(9,6),
    lng NUMERIC(9,6),
    radio_permitido_metros NUMERIC(10,2),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);

CREATE TABLE categorias_puesto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    salario_base_sugerido NUMERIC(12,2),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL
);
```

---

## 5. Cambios en Tablas Existentes

### 5.1 Campos globales a agregar en todas las tablas de negocio

```sql
ALTER TABLE <tabla> ADD COLUMN activo BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE <tabla> ADD COLUMN creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE <tabla> ADD COLUMN actualizado_en TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE <tabla> ADD COLUMN creado_por UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE <tabla> ADD COLUMN actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE <tabla> ADD COLUMN eliminado_en TIMESTAMP(3);
```

### 5.2 Correccion de tipos de datos

| Tabla | Campo | Cambio |
|---|---|---|
| `bitacoras_renta_diaria` | `hora_inicio`, `hora_fin` | `TEXT` -> `TIME` |
| `checklists_preoperacionales` | `hora` | `TEXT` -> `TIME` |
| `dias_asistencia_semana` | `fecha` | `TEXT` -> `DATE` |
| `dias_asistencia_semana` | `hora_entrada`, `hora_salida` | `TEXT` -> `TIME` |
| `firmas_cliente` | `fecha_firma` | `TEXT` -> `TIMESTAMP(3)` |
| `hitos_progreso` | `fecha` | `TEXT` -> `DATE` |
| `horas_extra_asistencia` | `inicio`, `fin` | `TEXT` -> `TIME` |
| `licencias_trabajador` | `vigencia` | `TEXT` -> `DATE` |
| `registros_asistencia` | `hora_entrada`, `hora_salida`, `hora_marcaje_exacta`, `hora_salida_exacta` | `TEXT` -> `TIME` |
| `reportes_campo` | `hora` | `TEXT` -> `TIME` |
| `trabajadores` | `entrada` | `TEXT` -> `TIME` |

### 5.3 Normalizacion de FKs

| Tabla | Campo | Accion |
|---|---|---|
| `articulos_inventario` | `categoria` | FK -> `categorias_inventario(id)` |
| `articulos_inventario` | `unidad` | FK -> `unidades_medida(id)` |
| `articulos_inventario` | `proveedor` | FK -> `proveedores(id)` |
| `apu_templates` | `unidad` | FK -> `unidades_medida(id)` |
| `apu_items` | `unidad` | FK -> `unidades_medida(id)` |
| `maquinas` | `tipo` | FK -> `tipos_maquina(id)` |
| `trabajadores` | `categoria_puesto` | FK -> `categorias_puesto(id)` |
| `bitacoras_operacion` | `obra` | FK -> `obras(id)` |
| `bitacoras_renta_diaria` | `obra_ubicacion` | FK -> `obras(id)` |
| `incidentes` | `obra` | FK -> `obras(id)` |
| `cargas_combustible` | `lugar` | FK -> `obras(id)` |
| `proyectos` | `ubicacion` | FK -> `obras(id)` o eliminar campo (la obra ya tiene ubicacion) |

### 5.4 Campos calculados a eliminar de tablas principales

- `proyectos.gastado`
- `proyectos.ingreso_cobrado`
- `proyectos.gasto_nomina`
- `proyectos.gasto_combustible`
- `proyectos.gasto_mantenimiento`
- `proyectos.gasto_materiales`
- `proyectos.utilidad_real`
- `proyectos.margen_utilidad_porcentaje`

**Recomendacion:** Crear vista `vw_proyecto_finanzas` o calcular en el servicio.

---

## 6. Constraints CHECK Recomendados

```sql
-- Fechas coherentes
ALTER TABLE proyectos ADD CONSTRAINT chk_proyecto_fechas CHECK (fecha_fin >= fecha_inicio);
ALTER TABLE permisos ADD CONSTRAINT chk_permiso_fechas CHECK (fecha_fin >= fecha_inicio);
ALTER TABLE despachos_maquina ADD CONSTRAINT chk_despacho_fechas CHECK (fecha_fin >= fecha_inicio);

-- Porcentajes
ALTER TABLE proyectos ADD CONSTRAINT chk_proyecto_progreso CHECK (progreso >= 0 AND progreso <= 100);
ALTER TABLE hitos_progreso ADD CONSTRAINT chk_hito_porcentaje CHECK (planificado >= 0 AND planificado <= 100 AND "real" >= 0 AND "real" <= 100);

-- Horometros
ALTER TABLE bitacoras_renta_diaria ADD CONSTRAINT chk_horometro CHECK (horometro_final >= horometro_inicial);
ALTER TABLE lecturas_horometro ADD CONSTRAINT chk_lectura_horometro CHECK (lectura_final >= lectura_inicial);

-- Dinero
ALTER TABLE trabajadores ADD CONSTRAINT chk_sueldos CHECK (sueldo_fiscal >= 0 AND sueldo_efectivo >= 0);
ALTER TABLE transacciones ADD CONSTRAINT chk_monto_positivo CHECK (monto >= 0);

-- Combustible
ALTER TABLE cargas_combustible ADD CONSTRAINT chk_litros_positivos CHECK (litros > 0 AND costo >= 0);

-- Asistencia
ALTER TABLE dias_asistencia_semana ADD CONSTRAINT chk_horas_dia CHECK (horas_trabajadas >= 0 AND COALESCE(horas_extra, 0) >= 0);

-- GPS
ALTER TABLE maquinas ADD CONSTRAINT chk_lat_lng CHECK (lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180);
```

---

## 7. Indices Adicionales Recomendados

```sql
-- Por fecha
CREATE INDEX idx_bitacoras_renta_diaria_fecha ON bitacoras_renta_diaria(fecha);
CREATE INDEX idx_registros_asistencia_fecha ON registros_asistencia(fecha);
CREATE INDEX idx_cargas_combustible_fecha ON cargas_combustible(fecha);
CREATE INDEX idx_registros_mantenimiento_fecha ON registros_mantenimiento(fecha);

-- Por estado
CREATE INDEX idx_trabajadores_estado ON trabajadores(estado);
CREATE INDEX idx_proyectos_estado ON proyectos(estado);
CREATE INDEX idx_maquinas_estado ON maquinas(estado);

-- Menu dinamico
CREATE INDEX idx_vistas_padre ON vistas(vista_padre_id);
CREATE INDEX idx_vistas_activas ON vistas(activo, es_menu, es_visible);
CREATE INDEX idx_role_vistas_rol ON role_vistas(rol_id, activo, puede_ver);
CREATE INDEX idx_role_vistas_vista ON role_vistas(vista_id);

-- Full-text search
CREATE INDEX idx_trabajadores_nombre_fts ON trabajadores
    USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(puesto, '')));
CREATE INDEX idx_clientes_nombre_fts ON clientes
    USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(empresa, '')));
CREATE INDEX idx_proyectos_nombre_fts ON proyectos
    USING gin(to_tsvector('spanish', nombre));

-- JSONB
CREATE INDEX idx_reportes_campo_detalles ON reportes_campo USING gin(detalles);
```

---

## 8. Soft Delete en Prisma

```typescript
export const softDeleteExtension = prisma.$extends({
  model: {
    $allModels: {
      async findMany<T>(this: T, args: any = {}) {
        args.where = { ...args.where, eliminado_en: null };
        return (this as any).$parent.findMany(args);
      },
      async findFirst<T>(this: T, args: any = {}) {
        args.where = { ...args.where, eliminado_en: null };
        return (this as any).$parent.findFirst(args);
      },
      async delete<T>(this: T, args: any) {
        return (this as any).update({
          where: args.where,
          data: { eliminado_en: new Date() },
        });
      },
    },
  },
});
```

---

## 9. Trigger para actualizar `actualizado_en`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de aplicacion
CREATE TRIGGER update_trabajadores_updated_at
BEFORE UPDATE ON trabajadores
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 10. Orden Sugerido de Migracion

1. Crear tablas `personas`, `users`, `roles`, `permissions`, `users_roles`, `role_permissions`.
2. Crear tablas `vistas` y `role_vistas` para menu dinamico.
3. Crear tablas `sessions`, `refresh_tokens`, `token_blacklist`.
4. Crear tabla `registro_auditoria` con triggers de inmutabilidad.
5. Crear catalogos normalizados: `proveedores`, `categorias_inventario`, `tipos_maquina`, `unidades_medida`, `obras`, `categorias_puesto`.
6. Agregar columnas `creado_por`, `actualizado_por`, `eliminado_en`, `activo` a todas las tablas existentes.
7. Corregir tipos de datos (text -> date/time/timestamp).
8. Normalizar campos `obra`, `proveedor`, `categoria`, `tipo`, `unidad` a FKs.
9. Eliminar campos calculados de `proyectos` y crear vista financiera.
10. Agregar CHECK constraints.
11. Agregar indices adicionales.
12. Crear triggers de `actualizado_en` automatico.
13. Migrar datos existentes a nuevos catalogos.
14. Poblar `vistas` con las rutas actuales del sidebar.
15. Asignar vistas a roles por defecto.

---

## 11. Notas Finales

- **Todas las PKs son UUID.** Regla sin excepciones.
- **Nunca usar DELETE fisico** en tablas de negocio.
- **Toda escritura genera auditoria** mediante servicio centralizado en NestJS.
- **Access token corto** (15 min); refresh token rotativo.
- **Menu dinamico** cacheado por rol en el frontend.
- **Badges dinamicos** en `vistas.badges` actualizables por backend.
- **Personas y usuarios son entidades separadas.** Una persona no siempre tiene acceso al sistema.


---

## 12. Glosario Detallado de Tablas y Campos

### Convencion de simbolos
- ✅ Campo correcto y completo
- ⚠️ Campo que requiere ajuste (tipo, FK, nullable)
- ❌ Campo faltante
- 🆕 Tabla o campo nuevo propuesto

---

### `_prisma_migrations`
Tabla interna de Prisma. Registra el historial de migraciones aplicadas. **No debe modificarse manualmente.**

---

### `apu_templates`
**Proposito:** Plantillas de Analisis de Precios Unitarios (APU). Cada plantilla representa un concepto de obra (ej. "Colado de losa") y agrupa los insumos necesarios.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador unico de la plantilla |
| `codigo` | TEXT | Codigo legible unico (ej. APU001) |
| `nombre` | TEXT | Nombre descriptivo del concepto |
| `unidad` | TEXT ⚠️ | Unidad de medida del concepto. **Convertir a FK → `unidades_medida`** |
| `activo` | BOOLEAN | Indica si la plantilla esta disponible |
| `creado_en` | TIMESTAMP | Fecha de creacion |
| `actualizado_en` | TIMESTAMP | Fecha de ultima actualizacion |
| `creado_por` | UUID ❌ | Usuario que creo el registro |
| `actualizado_por` | UUID ❌ | Usuario que actualizo el registro |
| `eliminado_en` | TIMESTAMP ❌ | Fecha de eliminacion logica |

---

### `apu_items`
**Proposito:** Items/insumos que componen una plantilla APU, clasificados en materiales, mano de obra y maquinaria.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador unico del item |
| `apu_template_id` | UUID FK | Plantilla a la que pertenece |
| `categoria` | ENUM | Tipo de insumo: MATERIAL, MANO_DE_OBRA, MAQUINARIA |
| `nombre` | TEXT | Nombre del insumo |
| `unidad` | TEXT ⚠️ | Unidad de medida. **Convertir a FK → `unidades_medida`** |
| `cantidad` | NUMERIC | Cantidad requerida por unidad de obra |
| `costo_unitario` | NUMERIC | Costo unitario del insumo |
| `activo` | BOOLEAN ❌ | Disponibilidad del item |
| `creado_en` | TIMESTAMP ❌ | Fecha de creacion |
| `actualizado_en` | TIMESTAMP ❌ | Fecha de actualizacion |
| `creado_por` / `actualizado_por` | UUID ❌ | Auditoria de usuario |
| `eliminado_en` | TIMESTAMP ❌ | Soft delete |

---

### `articulos_inventario`
**Proposito:** Catalogo de articulos, refacciones y materiales disponibles en almacen.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del articulo |
| `codigo` | TEXT | Codigo SKU unico |
| `nombre` | TEXT | Nombre del articulo |
| `categoria` | TEXT ⚠️ | Categoria del articulo. **Convertir a FK → `categorias_inventario`** |
| `stock` | NUMERIC | Cantidad actual en inventario |
| `stock_minimo` | NUMERIC | Stock minimo para alerta |
| `unidad` | TEXT ⚠️ | Unidad de medida. **Convertir a FK → `unidades_medida`** |
| `precio_unitario` | NUMERIC | Precio de compra unitario |
| `proveedor` | TEXT ⚠️ | Proveedor principal. **Convertir a FK → `proveedores`** |
| `activo` | BOOLEAN | Disponibilidad |
| `creado_en` / `actualizado_en` | TIMESTAMP | Auditoria basica |
| `creado_por` / `actualizado_por` / `eliminado_en` | UUID/TIMESTAMP ❌ | Auditoria completa |

---

### `asistencias_semanales`
**Proposito:** Resumen semanal de asistencia por trabajador. Se deriva de los registros diarios.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del resumen |
| `trabajador_id` | UUID FK | Trabajador al que corresponde |
| `semana` | TEXT | Descripcion de la semana (ej. "Semana 17") |
| `total_dias_asistidos` | INTEGER | Dias asistidos en la semana |
| `total_faltas` | INTEGER | Faltas registradas |
| `total_retardos` | INTEGER | Retardos registrados |
| `total_horas_ordinarias` | NUMERIC | Horas ordinarias acumuladas |
| `total_horas_extra` | NUMERIC | Horas extras acumuladas |
| `creado_en` / `actualizado_en` | TIMESTAMP | Auditoria basica |
| `activo` / `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Campos faltantes |

---

### `bitacoras_operacion`
**Proposito:** Registro diario de actividades operativas realizadas por cada maquina.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador de la bitacora |
| `maquina_id` | UUID FK | Maquina que realizo la actividad |
| `actividad` | TEXT | Descripcion de la actividad |
| `horas` | NUMERIC | Horas invertidas |
| `fecha` | DATE | Fecha de la actividad |
| `obra` | TEXT ⚠️ | Obra donde se realizo. **Convertir a FK → `obras`** |
| `codigo` | TEXT | Folio interno unico |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `bitacoras_renta_diaria`
**Proposito:** Control diario de renta de maquinaria con operador a clientes. Incluye horometro, firma de cliente y estado de cobro.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador de la bitacora |
| `folio` | TEXT UNIQUE | Folio de renta |
| `trabajador_id` | UUID FK | Operador asignado |
| `maquina_id` | UUID FK | Maquina rentada |
| `fecha` | DATE | Fecha de servicio |
| `cliente_id` | UUID FK | Cliente que renta |
| `obra_ubicacion` | TEXT ⚠️ | Ubicacion/obra. **Convertir a FK → `obras`** |
| `hora_inicio` / `hora_fin` | TEXT ❌ | Horas de inicio/fin. **Convertir a TIME** |
| `horas_efectivas` | NUMERIC | Horas efectivas trabajadas |
| `horas_extras` | NUMERIC | Horas extras |
| `horometro_inicial` / `horometro_final` | NUMERIC | Lecturas de horometro |
| `actividad_realizada` | TEXT | Descripcion del trabajo |
| `estado_cobro` | ENUM | Estado de facturacion: LISTO_FACTURAR, FACTURADO, PENDIENTE_FIRMA |
| `tarifa_hora_renta` | NUMERIC | Tarifa cobrada por hora |
| `importe_total_renta` | NUMERIC | Total calculado de la renta |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `cargas_combustible`
**Proposito:** Registro de cargas de combustible (diesel) a maquinas, con calculo de rendimiento.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador de la carga |
| `codigo` | TEXT | Folio de carga |
| `maquina_id` | UUID FK | Maquina abastecida |
| `fecha` | DATE | Fecha de carga |
| `litros` | NUMERIC | Litros cargados |
| `costo` | NUMERIC | Costo total |
| `operador_id` | UUID FK | Operador que reporta la carga |
| `lugar` | TEXT ⚠️ | Lugar de carga. **Convertir a FK → `obras` o `estaciones_combustible`** |
| `horometro_actual` | NUMERIC | Lectura de horometro al cargar |
| `horas_trabajadas_periodo` | NUMERIC | Horas entre cargas |
| `consumo_esperado_lts_hora` | NUMERIC | Consumo esperado |
| `rendimiento_lts_hora` | NUMERIC | Rendimiento real calculado |
| `alerta_ordena` | BOOLEAN | Alerta por rendimiento anormal |
| `desviacion_porcentaje` | NUMERIC | Desviacion del consumo esperado |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `checklists_preoperacionales`
**Proposito:** Inspeccion diaria de maquinas antes de iniciar operaciones.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del checklist |
| `codigo` | TEXT | Folio del checklist |
| `maquina_id` | UUID FK | Maquina inspeccionada |
| `fecha` | DATE | Fecha de inspeccion |
| `hora` | TEXT ❌ | Hora de inspeccion. **Convertir a TIME** |
| `operador_id` | UUID FK | Operador que realiza la inspeccion |
| `horometro_inicial` | NUMERIC | Lectura inicial del horometro |
| `nivel_aceite_motor` | ENUM NivelAceite | Correcto, Bajo, Exceso |
| `nivel_hidraulico` | ENUM NivelBinario | Correcto, Bajo |
| `fugas_visibles` | BOOLEAN | Presencia de fugas |
| `estado_llantas_orugas` | ENUM EstadoLlantas | Estado de llantas/orugas |
| `luces_y_alarmas` | ENUM EstadoSistema | Correcto o Falla |
| `sistema_frenos` | ENUM EstadoSistema | Correcto o Falla |
| `estado` | ENUM EstadoChecklist | Aprobado o Con Falla |
| `observaciones` | TEXT | Notas adicionales |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `clientes`
**Proposito:** Catalogo de clientes que rentan maquinaria o contratan servicios.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del cliente |
| `codigo` | TEXT | Codigo interno del cliente |
| `nombre` | TEXT | Nombre del contacto principal |
| `empresa` | TEXT | Razon social o nombre de la empresa |
| `correo` | TEXT | Correo electronico |
| `telefono` | TEXT | Telefono de contacto |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `rfc` | TEXT ❌ | RFC para facturacion |
| `direccion_fiscal` | JSONB ❌ | Direccion fiscal completa |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `contactos_emergencia`
**Proposito:** Contactos de emergencia asociados a cada trabajador.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del contacto |
| `trabajador_id` | UUID FK | Trabajador al que pertenece |
| `nombre` | TEXT | Nombre del contacto |
| `telefono` | TEXT | Telefono de emergencia |
| `parentesco` | TEXT | Parentesco o relacion |
| `creado_en` / `actualizado_en` | | Auditoria basica |
| `activo` / `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Campos faltantes |

---

### `cotizaciones`
**Proposito:** Propuestas de precio enviadas a clientes.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador de la cotizacion |
| `codigo` | TEXT | Folio de cotizacion |
| `cliente_id` | UUID FK | Cliente destinatario |
| `descripcion` | TEXT | Descripcion del servicio/material |
| `monto` | NUMERIC | Monto total cotizado |
| `fecha` | DATE | Fecha de emision |
| `estado` | ENUM EstadoCotizacion | PENDIENTE, ACEPTADA, RECHAZADA |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `vendedor_id` | UUID ❌ | Usuario que elaboro la cotizacion |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `despachos_maquina`
**Proposito:** Asignacion temporal de maquinas a proyectos/obras.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del despacho |
| `codigo` | TEXT | Folio de asignacion |
| `maquina_id` | UUID FK | Maquina asignada |
| `proyecto_id` | UUID FK | Proyecto destino |
| `fecha_inicio` / `fecha_fin` | DATE | Periodo de asignacion |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `obra_id` | UUID ❌ | Obra especifica dentro del proyecto |
| `operador_id` | UUID ❌ | Operador asignado a la maquina |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `dias_asistencia_semana`
**Proposito:** Detalle diario dentro de una semana de asistencia.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del dia |
| `asistencia_semanal_id` | UUID FK | Resumen semanal padre |
| `dia` | ENUM DiaSemana | Dia de la semana |
| `fecha` | TEXT ❌ | Fecha. **Convertir a DATE** |
| `estado` | ENUM EstadoAsistenciaDia | Estado de asistencia del dia |
| `hora_entrada` / `hora_salida` | TEXT ❌ | Horas. **Convertir a TIME** |
| `horas_trabajadas` | NUMERIC | Horas ordinarias |
| `horas_extra` | NUMERIC | Horas extras |
| `en_sitio_gps` | BOOLEAN | Validacion GPS de entrada |
| `motivo` | TEXT | Motivo de falta/justificacion |
| `activo` / `creado_en` / `actualizado_en` / `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Todo el bloque de auditoria |

---

### `documentos`
**Proposito:** Almacenamiento de referencias a archivos digitales (contratos, facturas, manuales, etc.).

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del documento |
| `codigo` | TEXT | Folio del documento |
| `nombre` | TEXT | Nombre del archivo |
| `tipo` | ENUM TipoDocumento | Tipo: CONTRATO, IDENTIFICACION, FACTURA, MANUAL, PERMISO, POLIZA |
| `categoria` | ENUM CategoriaDocumento | Categoria: PERSONAL, PROYECTOS, MAQUINARIA, PROVEEDORES, CONTABILIDAD |
| `fecha` | DATE | Fecha del documento |
| `tamano_bytes` | BIGINT | Tamano en bytes |
| `propietario` | TEXT ⚠️ | Texto libre. **Convertir a polimorfico: `propietario_tipo` + `propietario_id`** |
| `trabajador_id` | UUID FK | Trabajador asociado (opcional) |
| `url_archivo` | TEXT | Ruta o URL del archivo |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `firmas_cliente`
**Proposito:** Registro de firmas de aceptacion de cliente en bitacoras de renta.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador de la firma |
| `bitacora_id` | UUID FK | Bitacora de renta firmada |
| `firmado` | BOOLEAN | Indica si ya fue firmada |
| `nombre_residente` | TEXT | Nombre de quien firma |
| `cargo_residente` | TEXT | Cargo de quien firma |
| `fecha_firma` | TEXT ❌ | Fecha/hora de firma. **Convertir a TIMESTAMP(3)** |
| `archivo_firma` | TEXT ❌ | Ruta o hash de la imagen de la firma |
| `activo` / `creado_en` / `actualizado_en` / `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `hitos_progreso`
**Proposito:** Hitos de avance fisico de un proyecto a lo largo del tiempo.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del hito |
| `proyecto_id` | UUID FK | Proyecto al que pertenece |
| `fecha` | TEXT ❌ | Fecha del hito. **Convertir a DATE** |
| `planificado` | NUMERIC | Porcentaje planificado |
| `real` | NUMERIC | Porcentaje real ejecutado |
| `creado_en` | TIMESTAMP | Fecha de registro |
| `nombre` | TEXT ❌ | Nombre descriptivo del hito |
| `descripcion` | TEXT ❌ | Descripcion del avance |
| `activo` / `actualizado_en` / `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `horas_extra_asistencia`
**Proposito:** Registro de horas extra generadas desde un registro de asistencia.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del registro |
| `registro_asistencia_id` | UUID FK | Asistencia origen |
| `inicio` / `fin` | TEXT ❌ | Hora de inicio/fin. **Convertir a TIME** |
| `horas_calculadas` | NUMERIC | Horas extra calculadas |
| `tarifa_por_hora` | NUMERIC | Tarifa aplicada |
| `monto_total` | NUMERIC | Monto a pagar |
| `estado` | ENUM EstadoHoraExtra | EN_CURSO, APROBADO, PENDIENTE, RECHAZADO |
| `motivo` | TEXT | Motivo de las horas extra |
| `lat_inicio` / `lng_inicio` / `lat_fin` / `lng_fin` | NUMERIC | Coordenadas GPS de inicio y fin |
| `creado_en` / `actualizado_en` | | Auditoria basica |
| `aprobador_id` | UUID ❌ | Usuario que aprueba |
| `activo` / `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `incidentes`
**Proposito:** Registro de incidentes, accidentes o situaciones anomalas en obra.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del incidente |
| `codigo` | TEXT | Folio del incidente |
| `titulo` | TEXT | Titulo corto |
| `descripcion` | TEXT | Descripcion detallada |
| `prioridad` | ENUM Prioridad | BAJA, MEDIA, ALTA, CRITICA |
| `estado` | ENUM EstadoIncidente | ABIERTO, EN_REVISION, RESUELTO |
| `fecha` | DATE | Fecha del incidente |
| `maquina_id` | UUID FK | Maquina involucrada (opcional) |
| `obra` | TEXT ⚠️ | Obra. **Convertir a FK → `obras`** |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `reporto_id` | UUID ❌ | Usuario o trabajador que reporto |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `lecturas_horometro`
**Proposito:** Lecturas periodicas del horometro de cada maquina.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador de la lectura |
| `maquina_id` | UUID FK | Maquina |
| `fecha` | DATE | Fecha de lectura |
| `lectura_inicial` / `lectura_final` | NUMERIC | Lecturas del horometro |
| `horas_trabajadas` | NUMERIC | Diferencia calculada |
| `codigo` | TEXT | Folio de lectura |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `operador_id` | UUID ❌ | Operador que reporta |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `licencias_trabajador`
**Proposito:** Licencias, certificaciones y documentos oficiales de los trabajadores.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador de la licencia |
| `trabajador_id` | UUID FK | Trabajador titular |
| `tipo` | TEXT ⚠️ | Tipo de licencia. **Convertir a ENUM o catalogo** |
| `vigencia` | TEXT ❌ | Fecha de vigencia. **Convertir a DATE** |
| `folio` | TEXT | Numero de folio |
| `creado_en` / `actualizado_en` | | Auditoria basica |
| `archivo_url` | TEXT ❌ | Ruta del documento escaneado |
| `activo` / `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `maquinas`
**Proposito:** Catalogo maestro de la flota de maquinaria y equipo.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador de la maquina |
| `codigo` | TEXT | Codigo interno de flota |
| `nombre` | TEXT | Nombre descriptivo |
| `tipo` | TEXT ⚠️ | Tipo de maquina. **Convertir a FK → `tipos_maquina`** |
| `estado` | ENUM EstadoMaquina | ENCENDIDA, APAGADA, MANTENIMIENTO, MOVIMIENTO |
| `combustible` | NUMERIC | Nivel actual de combustible (%) |
| `horometro` | NUMERIC | Lectura acumulada del horometro |
| `operador_id` | UUID FK | Operador asignado actualmente |
| `lat` / `lng` | NUMERIC | Ultima posicion GPS conocida |
| `diesel_hoy` | NUMERIC | Diesel consumido en el dia |
| `proximo_mantenimiento` | DATE | Fecha estimada del siguiente mantenimiento |
| `imagen` | TEXT | Foto de la maquina |
| `consumo_esperado_lts_hora` | NUMERIC | Consumo estandar |
| `rendimiento_actual_lts_hora` | NUMERIC | Rendimiento actual |
| `alerta_consumo_anormal` | BOOLEAN | Bandera de alerta |
| `horas_operadas_hoy` | NUMERIC | Horas operadas en el dia |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `modelo` / `anio` / `serie` / `placas` | ❌ | Datos tecnicos del vehiculo |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `permisos` (del negocio)
**Proposito:** Vacaciones, permisos e incapacidades de trabajadores.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del permiso |
| `trabajador_id` | UUID FK | Trabajador solicitante |
| `tipo` | ENUM TipoPermiso | VACACIONES, PERMISO, INCAPACIDAD |
| `fecha_inicio` / `fecha_fin` | DATE | Periodo solicitado |
| `estado` | ENUM EstadoPermiso | PENDIENTE, APROBADO, RECHAZADO |
| `motivo` | TEXT | Motivo del permiso |
| `dias_solicitados` | INTEGER | Dias totales |
| `codigo` | TEXT | Folio del permiso |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `aprobador_id` | UUID ❌ | Usuario que aprueba/rechaza |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `proyectos`
**Proposito:** Obras o proyectos de construccion que gestiona la empresa.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del proyecto |
| `codigo` | TEXT | Codigo interno de obra |
| `nombre` | TEXT | Nombre de la obra |
| `cliente_id` | UUID FK | Cliente propietario |
| `presupuesto` | NUMERIC | Presupuesto total aprobado |
| `gastado` | NUMERIC ⚠️ | **Campo calculado. Eliminar y usar vista** |
| `progreso` | NUMERIC | Porcentaje de avance actual |
| `estado` | ENUM EstadoProyecto | EN_PROCESO, FINALIZADO, PAUSADO |
| `ubicacion` | TEXT ⚠️ | **Convertir a FK → `obras`** |
| `fecha_inicio` / `fecha_fin` | DATE | Periodo del proyecto |
| `ingreso_cobrado` / `gasto_nomina` / `gasto_combustible` / `gasto_mantenimiento` / `gasto_materiales` / `utilidad_real` / `margen_utilidad_porcentaje` | NUMERIC ⚠️ | **Todos calculados. Eliminar de la tabla base** |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `registros_asistencia`
**Proposito:** Registro diario de entrada/salida de trabajadores con validacion GPS.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del registro |
| `codigo` | TEXT | Folio de checada |
| `trabajador_id` | UUID FK | Trabajador |
| `fecha` | DATE | Fecha de la asistencia |
| `hora_entrada` / `hora_salida` | TEXT ❌ | **Convertir a TIME** |
| `hora_marcaje_exacta` / `hora_salida_exacta` | TEXT ❌ | **Convertir a TIME** |
| `estado` | ENUM EstadoAsistencia | PUNTUAL, RETARDO, FALTA, JUSTIFICADO, NO_PRESENTADO, SALIDA_ANTICIPADA |
| `ubicacion` | TEXT | Ubicacion textual de la entrada |
| `lat_entrada` / `lng_entrada` / `lat_salida` / `lng_salida` | NUMERIC | Coordenadas GPS |
| `salida_ubicacion` | TEXT | Ubicacion de salida |
| `proyecto_id` | UUID FK | Proyecto asignado |
| `obra_asignada` | TEXT ⚠️ | **Convertir a FK → `obras`** |
| `lat_obra` / `lng_obra` | NUMERIC | Coordenadas de la obra asignada |
| `distancia_metros` | NUMERIC | Distancia del trabajador a la obra |
| `radio_permitido_metros` | NUMERIC | Radio valido para marcar asistencia |
| `en_sitio` | BOOLEAN | Si estuvo dentro del radio |
| `precision_gps_metros` | NUMERIC | Precision del GPS en la marcacion |
| `dispositivo` | TEXT | Dispositivo desde el que se marco |
| `horas_trabajadas_ordinarias` | NUMERIC | Horas ordinarias calculadas |
| `salida_anticipada` | BOOLEAN | Si salio antes de hora |
| `motivo_salida_anticipada` | TEXT | Motivo |
| `bateria` | INTEGER | Nivel de bateria del dispositivo |
| `notas` | TEXT | Notas |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `registros_criba`
**Proposito:** Registro de produccion de material en planta de criba/trituracion.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del registro |
| `codigo` | TEXT | Folio de produccion |
| `fecha` | DATE | Fecha de produccion |
| `turno` | ENUM Turno | MATUTINO, VESPERTINO |
| `operador_id` | UUID FK | Operador a cargo |
| `tipo_material` | TEXT | Tipo de material producido |
| `material_producido` | NUMERIC | Cantidad producida |
| `horas_trabajadas` | NUMERIC | Horas de operacion |
| `material_al_banco` | NUMERIC | Material acopiado |
| `observaciones` | TEXT | Notas |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `registros_mantenimiento`
**Proposito:** Registro de servicios de mantenimiento correctivo y preventivo.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del mantenimiento |
| `codigo` | TEXT | Folio del servicio |
| `maquina_id` | UUID FK | Maquina mantenida |
| `tipo` | ENUM TipoMantenimiento | CORRECTIVO, PREVENTIVO |
| `descripcion` | TEXT | Descripcion del trabajo |
| `fecha` | DATE | Fecha del servicio |
| `horas_servicio` | NUMERIC | Horas invertidas |
| `costo` | NUMERIC | Costo del mantenimiento |
| `proximo_servicio_horas` | NUMERIC | Horometro para siguiente servicio |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `mecanico_id` | UUID ❌ | Mecanico responsable |
| `refacciones_usadas` | JSONB ❌ | Relacion de refacciones consumidas |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `reportes_campo`
**Proposito:** Reportes enviados desde campo por operadores, mecanicos, ingenieros, etc.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del reporte |
| `codigo` | TEXT | Folio del reporte |
| `tipo` | ENUM TipoReporteCampo | MECANICO, OPERADOR, PIPERO, CHECADOR, INCIDENTE, INGENIERO, TRABAJADOR |
| `usuario` | TEXT ⚠️ | Nombre del usuario. **Convertir a FK → `users`** |
| `maquina_id` | UUID FK | Maquina relacionada (opcional) |
| `obra` | TEXT ⚠️ | **Convertir a FK → `obras`** |
| `fecha` | DATE | Fecha del reporte |
| `hora` | TEXT ❌ | **Convertir a TIME** |
| `descripcion` | TEXT | Descripcion del reporte |
| `estado` | ENUM EstadoReporteCampo | PENDIENTE, VISTO, ATENDIDO, EN_REVISION, RESUELTO |
| `prioridad` | ENUM Prioridad | Prioridad del reporte |
| `detalles` | JSONB | Datos adicionales estructurados |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `trabajadores`
**Proposito:** Catalogo maestro de trabajadores y empleados.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador del trabajador |
| `codigo` | TEXT | Codigo interno de nomina |
| `nombre` | TEXT | Nombre completo |
| `puesto` | TEXT | Puesto especifico |
| `categoria_puesto` | ENUM ⚠️ | Categoria. **Convertir a FK → `categorias_puesto`** |
| `estado` | ENUM EstadoTrabajador | ACTIVO, INACTIVO, VACACIONES |
| `entrada` | TEXT ❌ | Horario de entrada. **Convertir a TIME** |
| `telefono` | TEXT | Telefono de contacto |
| `avatar` | TEXT | Foto del trabajador |
| `sueldo_fiscal` / `sueldo_efectivo` | NUMERIC | Componentes de salario |
| `metodo_pago` | ENUM MetodoPago | TARJETA, EFECTIVO, MIXTO |
| `estado_renta` | ENUM EstadoRenta | RENTADO_CLIENTE, EN_OBRA_PROPIA, DISPONIBLE_PATIO |
| `cliente_renta_actual_id` | UUID FK | Cliente actual de renta |
| `fecha_contratacion` | DATE | Fecha de ingreso |
| `vacaciones_dias` | INTEGER | Dias de vacaciones disponibles |
| `horas_extra_semana` | NUMERIC | Horas extra acumuladas en la semana |
| `tarifa_hora_extra` | NUMERIC | Tarifa por hora extra |
| `descuentos_semana` / `concepto_descuento` | NUMERIC/TEXT | Descuentos aplicados |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `trabajadores_proyectos`
**Proposito:** Relacion N:N entre trabajadores y proyectos.

| Campo | Tipo | Descripcion |
|---|---|---|
| `trabajador_id` | UUID FK | Trabajador |
| `proyecto_id` | UUID FK | Proyecto |
| `asignado_en` | TIMESTAMP | Fecha de asignacion |
| `activo` / `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |

---

### `transacciones`
**Proposito:** Registro financiero de ingresos y egresos. **Actualmente es demasiado generica.**

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador de la transaccion |
| `codigo` | TEXT | Folio contable |
| `tipo` | ENUM TipoTransaccion | INGRESO, EGRESO |
| `categoria` | TEXT | Categoria contable |
| `monto` | NUMERIC | Monto |
| `fecha` | DATE | Fecha contable |
| `descripcion` | TEXT | Descripcion |
| `activo` / `creado_en` / `actualizado_en` | | Auditoria basica |
| `creado_por` / `actualizado_por` / `eliminado_en` | ❌ | Auditoria completa |
| `entidad_tipo` / `entidad_id` | ❌ | Referencia polimorfica a origen (nomina, combustible, mantenimiento, etc.) |

---

## 13. Tablas Propuestas para Gestion de Flota y GPS

El esquema actual **NO cubre** adecuadamente el seguimiento GPS historico, el inventario detallado de maquinas, ni el registro estructurado de fallas. Se proponen las siguientes tablas.

### `rastreo_gps`
**Proposito:** Almacenar el historial de posiciones GPS de cada maquina.

```sql
CREATE TABLE rastreo_gps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maquina_id UUID NOT NULL REFERENCES maquinas(id) ON DELETE CASCADE,
    fecha_hora TIMESTAMP(3) NOT NULL,
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    altitud NUMERIC(8,2),
    velocidad_kmh NUMERIC(5,2),
    heading NUMERIC(5,2),
    precision_metros NUMERIC(6,2),
    ignition BOOLEAN,
    odometro NUMERIC(10,2),
    horometro NUMERIC(10,2),
    proveedor_gps TEXT DEFAULT 'SVR-GPS',
    dispositivo_id TEXT,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_rastreo_gps_maquina_fecha ON rastreo_gps(maquina_id, fecha_hora DESC);
CREATE INDEX idx_rastreo_gps_fecha ON rastreo_gps(fecha_hora DESC);
```

| Campo | Descripcion |
|---|---|
| `maquina_id` | Maquina rastreada |
| `fecha_hora` | Momento exacto de la posicion |
| `lat` / `lng` | Coordenadas geograficas |
| `velocidad_kmh` | Velocidad reportada |
| `heading` | Direccion (0-360) |
| `ignition` | Estado del encendido |
| `odometro` / `horometro` | Lecturas del dispositivo GPS |

---

### `geocercas`
**Proposito:** Definir zonas geograficas de interes (obras, patios, estaciones).

```sql
CREATE TABLE geocercas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('OBRA', 'PATIO', 'ESTACION', 'RUTA', 'PROHIBIDA')),
    color TEXT DEFAULT '#3b82f6',
    centro_lat NUMERIC(9,6) NOT NULL,
    centro_lng NUMERIC(9,6) NOT NULL,
    radio_metros NUMERIC(10,2),
    poligono GEOGRAPHY(POLYGON, 4326),
    activa BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);
```

---

### `geocerca_maquinas`
**Proposito:** Relacionar maquinas con geocercas y detectar entradas/salidas.

```sql
CREATE TABLE geocerca_maquinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geocerca_id UUID NOT NULL REFERENCES geocercas(id) ON DELETE CASCADE,
    maquina_id UUID NOT NULL REFERENCES maquinas(id) ON DELETE CASCADE,
    dentro BOOLEAN DEFAULT FALSE NOT NULL,
    ultima_entrada TIMESTAMP(3),
    ultima_salida TIMESTAMP(3),
    UNIQUE (geocerca_id, maquina_id)
);
```

---

### `alertas_gps`
**Proposito:** Registrar alertas generadas por el sistema GPS (velocidad, geocerca, ignition, etc.).

```sql
CREATE TABLE alertas_gps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maquina_id UUID NOT NULL REFERENCES maquinas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('EXCESO_VELOCIDAD', 'ENTRADA_GEOCERCA', 'SALIDA_GEOCERCA', 'ENCENDIDO_FUERA_HORARIO', 'APAGADO_INESPERADO', 'SOS', 'BATERIA_BAJA')),
    severidad TEXT NOT NULL CHECK (severidad IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
    lat NUMERIC(9,6),
    lng NUMERIC(9,6),
    fecha_hora TIMESTAMP(3) NOT NULL,
    descripcion TEXT,
    atendida BOOLEAN DEFAULT FALSE NOT NULL,
    atendida_por UUID REFERENCES users(id) ON DELETE SET NULL,
    atendida_en TIMESTAMP(3),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL
);

CREATE INDEX idx_alertas_gps_maquina ON alertas_gps(maquina_id, fecha_hora DESC);
CREATE INDEX idx_alertas_gps_atendida ON alertas_gps(atendida);
```

---

### `maquina_operadores`
**Proposito:** Historial de asignacion de operadores a maquinas (quien condujo que maquina y cuando).

```sql
CREATE TABLE maquina_operadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maquina_id UUID NOT NULL REFERENCES maquinas(id) ON DELETE CASCADE,
    trabajador_id UUID NOT NULL REFERENCES trabajadores(id) ON DELETE RESTRICT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    es_actual BOOLEAN DEFAULT TRUE NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);

CREATE INDEX idx_maquina_operadores_actual ON maquina_operadores(maquina_id, es_actual);
CREATE INDEX idx_maquina_operadores_trabajador ON maquina_operadores(trabajador_id);
```

---

### `fallas_mecanicas`
**Proposito:** Registro estructurado de fallas, diagnosticos y reparaciones.

```sql
CREATE TABLE fallas_mecanicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE,
    maquina_id UUID NOT NULL REFERENCES maquinas(id) ON DELETE RESTRICT,
    reporto_id UUID REFERENCES trabajadores(id) ON DELETE SET NULL,
    diagnostico TEXT NOT NULL,
    sistema_afectado TEXT NOT NULL CHECK (sistema_afectado IN ('MOTOR', 'TRANSMISION', 'HIDRAULICO', 'ELECTRICO', 'NEUMATICO', 'ESTRUCTURA', 'OTRO')),
    severidad TEXT NOT NULL CHECK (severidad IN ('LEVE', 'MODERADA', 'GRAVE', 'CRITICA')),
    estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_DIAGNOSTICO', 'EN_REPARACION', 'REPARADA', 'DESCARTADA')),
    fecha_reporte TIMESTAMP(3) NOT NULL,
    fecha_resolucion TIMESTAMP(3),
    costo_reparacion NUMERIC(12,2),
    mantenimiento_id UUID REFERENCES registros_mantenimiento(id) ON DELETE SET NULL,
    imagenes JSONB DEFAULT '[]'::jsonb,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);

CREATE INDEX idx_fallas_maquina ON fallas_mecanicas(maquina_id, fecha_reporte DESC);
CREATE INDEX idx_fallas_estado ON fallas_mecanicas(estado);
```

---

### `maquina_componentes`
**Proposito:** Inventario de componentes principales por maquina (motor, transmision, etc.).

```sql
CREATE TABLE maquina_componentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maquina_id UUID NOT NULL REFERENCES maquinas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    marca TEXT,
    modelo TEXT,
    numero_serie TEXT,
    fecha_instalacion DATE,
    vida_util_horas NUMERIC(10,2),
    horas_acumuladas NUMERIC(10,2) DEFAULT 0,
    estado TEXT DEFAULT 'BUENO' CHECK (estado IN ('BUENO', 'REGULAR', 'MALO')),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);
```

---

### `movimientos_inventario`
**Proposito:** Kardex de entradas y salidas de articulos de inventario.

```sql
CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    articulo_id UUID NOT NULL REFERENCES articulos_inventario(id) ON DELETE RESTRICT,
    tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION')),
    cantidad NUMERIC(10,2) NOT NULL,
    stock_resultante NUMERIC(10,2) NOT NULL,
    referencia_tipo TEXT,
    referencia_id UUID,
    motivo TEXT,
    fecha TIMESTAMP(3) NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_movimientos_articulo ON movimientos_inventario(articulo_id, fecha DESC);
```

---

## 14. Analisis de Cobertura: Cumple la DB con la aplicacion completa?

### 14.1 Modulos bien cubiertos

| Modulo | Tablas | Estado |
|---|---|---|
| Trabajadores | `trabajadores`, `contactos_emergencia`, `licencias_trabajador` | ✅ Basico, falta auditoria |
| Asistencia | `registros_asistencia`, `dias_asistencia_semana`, `asistencias_semanales`, `horas_extra_asistencia` | ✅ Con errores de tipos |
| Maquinaria basica | `maquinas`, `checklists_preoperacionales`, `lecturas_horometro`, `registros_mantenimiento` | ✅ Basico |
| Combustible | `cargas_combustible` | ✅ Basico |
| Proyectos | `proyectos`, `hitos_progreso`, `trabajadores_proyectos`, `apu_templates`, `apu_items` | ✅ Con campos calculados incorrectos |
| Clientes/Cotizaciones | `clientes`, `cotizaciones` | ✅ Basico |
| Documentos | `documentos` | ✅ Con propietario mal modelado |
| Reportes de campo | `reportes_campo`, `incidentes` | ✅ Basico |
| Inventario | `articulos_inventario` | ⚠️ Sin movimientos ni kardex |
| Finanzas | `transacciones` | ⚠️ Demasiado generico |

### 14.2 Modulos con brechas importantes

| Modulo | Brecha | Tablas propuestas |
|---|---|---|
| **GPS / Rastreo** | Solo guarda ultima posicion en `maquinas`. Sin historial, geocercas ni alertas. | `rastreo_gps`, `geocercas`, `geocerca_maquinas`, `alertas_gps` |
| **Inventario de maquinas** | No hay componentes, series, historial de operadores. | `maquina_componentes`, `maquina_operadores` |
| **Fallas mecanicas** | Solo `incidentes` y `registros_mantenimiento` genericos. Sin registro estructurado de fallas. | `fallas_mecanicas` |
| **Autenticacion/RBAC** | No existe. | `personas`, `users`, `roles`, `permissions`, `users_roles` |
| **Menu dinamico** | No existe. | `vistas`, `role_vistas` |
| **Auditoria** | No existe. | `registro_auditoria` |
| **Kardex de inventario** | No existe. | `movimientos_inventario` |
| **Facturacion/Cobranza** | No hay tabla de facturas ni pagos detallados. | `facturas`, `pagos`, `cuentas_por_cobrar` |
| **Nomina** | No hay tablas de nominas, percepciones, deducciones. | `nominas`, `recibos_nomina`, `percepciones`, `deducciones` |
| **Compras/Ordenes** | No hay ordenes de compra. | `ordenes_compra`, `ordenes_compra_items` |
| **Proveedores** | Solo texto en `articulos_inventario`. | `proveedores` |
| **Obras/Ubicaciones** | Solo texto en varias tablas. | `obras` |

---

## 15. Preguntas de Negocio para Resolver

Antes de modelar mas tablas, necesito claridad en los siguientes puntos:

1. **GPS:** ¿El rastreo GPS es en tiempo real con dispositivos IoT propios, o se captura manualmente por el operador? ¿Cada cuantos segundos/minutos se recibe una posicion?

2. **Geocercas:** ¿Las geocercas son circulares (centro + radio) o poligonales? ¿Se requiere PostGIS o bastan coordenadas simples?

3. **Operadores:** ¿Una maquina puede tener un solo operador asignado o multiples turnos? ¿El operador es siempre un `trabajador` con categoria OPERADOR/CHOFER?

4. **Fallas mecanicas:** ¿Una falla siempre genera un `registros_mantenimiento` o pueden existir fallas pendientes sin mantenimiento? ¿Se requiere aprobacion de jefe de taller?

5. **Inventario:** ¿El inventario es por un solo almacen o multiples bodegas? ¿Se requieren traspasos entre bodegas?

6. **Nomina:** ¿La nomina se calcula semanal, quincenal o mensual? ¿Se integra con un sistema externo (BANSEFI, SPEI) o es manual?

7. **Facturacion:** ¿Se emiten facturas CFDI desde el sistema o solo se registran folios? ¿Se requiere timbrado?

8. **Multi-tenancy:** ¿El sistema sera multi-empresa (SaaS) o solo para una constructora?

9. **Cobranza:** ¿Las bitacoras de renta se facturan agrupadas por cliente/mes o una por una?

10. **Documentos:** ¿Los documentos se almacenan en local, S3, o servicio externo? ¿Se requiere versionado?

---

## 16. Notas Finales

- **Todas las PKs deben ser UUID.** Regla sin excepciones.
- **Nunca usar DELETE fisico** en tablas de negocio.
- **Toda escritura genera auditoria** mediante servicio centralizado en NestJS.
- **Access token corto** (15 min); refresh token rotativo.
- **Menu dinamico** cacheado por rol en el frontend.
- **Badges dinamicos** en `vistas.badges` actualizables por backend.
- **Personas y usuarios son entidades separadas.** Una persona no siempre tiene acceso al sistema.
- **Campos calculados** deben calcularse en el backend o vistas, no almacenarse en tablas maestras.


---

## 17. Respuestas a Preguntas de Negocio y Ajustes al Modelo

### 17.1 GPS Real en Tiempo Real

**Decision:** El sistema recibira datos de dispositivos GPS reales que reportan posiciones en intervalos de tiempo.

**Implicaciones en el modelo:**
- `rastreo_gps` almacenara cada posicion recibida.
- `maquinas.lat` y `maquinas.lng` seguiran existiendo como **ultima posicion conocida** (cache) para consultas rapidas.
- Se recomienda una estrategia de **particionamiento por rango** sobre `rastreo_gps.fecha_hora` (mensual) para mantener rendimiento con millones de registros.
- Se sugiere una tarea batch nocturna que archive posiciones antiguas (> 1 ano) a storage frio.

**Estrategia de ingestion:**
1. Dispositivo GPS envia paquete en protocolo propietario a plataforma externa.
2. Plataforma externa transforma a JSON estandar.
3. Plataforma envia POST a endpoint de NestJS (`/api/gps/webhook`).
4. Backend valida firma/API key, parsea JSON y guarda en `rastreo_gps`.
5. Se actualiza `maquinas.lat`, `maquinas.lng`, `maquinas.estado` y se evaluan geocercas.

```json
{
  "deviceId": "GPS-M001",
  "timestamp": "2026-08-20T14:32:10Z",
  "lat": 19.4326,
  "lng": -99.1332,
  "speed": 12.5,
  "heading": 90,
  "ignition": true,
  "odometer": 45231.8,
  "horometro": 1250.2
}
```

---

### 17.2 Geocercas Circulares con PostGIS

**Decision:** Las geocercas seran circulares y se almacenaran usando **PostGIS**.

**Modelo ajustado:**

```sql
-- Extension PostGIS (ejecutar una sola vez)
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE geocercas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('OBRA', 'PATIO', 'ESTACION', 'RUTA', 'PROHIBIDA')),
    color TEXT DEFAULT '#3b82f6',
    centro_lat NUMERIC(9,6) NOT NULL,
    centro_lng NUMERIC(9,6) NOT NULL,
    radio_metros NUMERIC(10,2) NOT NULL CHECK (radio_metros > 0),
    -- Geometria circular en PostGIS (para consultas espaciales eficientes)
    geometria GEOGRAPHY(POLYGON, 4326) GENERATED ALWAYS AS (
        ST_Buffer(
            ST_SetSRID(ST_MakePoint(centro_lng::float, centro_lat::float), 4326)::geography,
            radio_metros
        )
    ) STORED,
    activa BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);

CREATE INDEX idx_geocercas_geometria ON geocercas USING gist(geometria);
```

**JSON alternativo para ingestion:**
Aunque las geocercas se almacenan en PostGIS, el JSON que recibe la app desde la plataforma externa puede usar coordenadas simples:

```json
{
  "id": "G1",
  "nombre": "Valle Sur",
  "lat": 19.4326,
  "lng": -99.1332,
  "radioMetros": 500,
  "tipo": "OBRA"
}
```

**Consulta para saber si una maquina esta dentro de una geocerca:**
```sql
SELECT g.id, g.nombre
FROM geocercas g
WHERE g.activa = TRUE
  AND g.eliminado_en IS NULL
  AND ST_DWithin(
    g.geometria,
    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
    0
  );
```

**Nota sobre `rastreo_gps`:** Tambien se puede agregar una columna PostGIS a `rastreo_gps` para consultas espaciales rapidas:
```sql
ALTER TABLE rastreo_gps ADD COLUMN posicion GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng::float, lat::float), 4326)
)::geography STORED;
CREATE INDEX idx_rastreo_gps_posicion ON rastreo_gps USING gist(posicion);
```

---

### 17.3 Una Sola Constructora (Sin Multi-tenancy)

**Decision:** El ERP es para una sola constructora. No se requiere multi-tenancy por ahora.

**Implicaciones:**
- Se elimina la tabla `organizations` y `user_organizations` de la propuesta inicial.
- Todos los registros pertenecen implicitamente a la misma empresa.
- Si en el futuro se requiere multi-tenancy, se puede agregar `organization_id` a las tablas clave sin romper el modelo.

---

### 17.4 Calculo de Nomina

**Decision:** El sistema debe calcular nominas completas.

**Tablas propuestas para nomina:**

```sql
CREATE TABLE periodos_nomina (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('SEMANAL', 'QUINCENAL', 'MENSUAL')),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    fecha_pago DATE,
    estado TEXT DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'CERRADO', 'PAGADO')),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);

CREATE TABLE nominas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo_id UUID NOT NULL REFERENCES periodos_nomina(id) ON DELETE RESTRICT,
    trabajador_id UUID NOT NULL REFERENCES trabajadores(id) ON DELETE RESTRICT,
    dias_trabajados INTEGER NOT NULL DEFAULT 0,
    dias_faltas INTEGER NOT NULL DEFAULT 0,
    horas_ordinarias NUMERIC(6,2) DEFAULT 0,
    horas_extra NUMERIC(6,2) DEFAULT 0,
    sueldo_fiscal NUMERIC(12,2) DEFAULT 0,
    sueldo_efectivo NUMERIC(12,2) DEFAULT 0,
    total_percepciones NUMERIC(12,2) DEFAULT 0,
    total_deducciones NUMERIC(12,2) DEFAULT 0,
    total_neto NUMERIC(12,2) DEFAULT 0,
    metodo_pago ENUM MetodoPago,
    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PAGADA', 'CANCELADA')),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);

CREATE TABLE percepciones_nomina (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomina_id UUID NOT NULL REFERENCES nominas(id) ON DELETE CASCADE,
    concepto TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('SUELDO', 'HORAS_EXTRA', 'BONO', 'VACACIONES', 'OTRO')),
    monto NUMERIC(12,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL
);

CREATE TABLE deducciones_nomina (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomina_id UUID NOT NULL REFERENCES nominas(id) ON DELETE CASCADE,
    concepto TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('IMSS', 'INFONAVIT', 'PRESTAMO', 'DESCUENTO', 'OTRO')),
    monto NUMERIC(12,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL
);

CREATE INDEX idx_nominas_periodo ON nominas(periodo_id);
CREATE INDEX idx_nominas_trabajador ON nominas(trabajador_id);
```

**Flujo de calculo:**
1. Se cierra el periodo de asistencia.
2. El sistema suma dias trabajados, faltas, horas ordinarias y horas extra por trabajador.
3. Se aplican tarifas de horas extra desde `trabajadores.tarifa_hora_extra`.
4. Se calculan percepciones (sueldo fiscal + efectivo + horas extra + bonos).
5. Se aplican deducciones (prestamos, descuentos, IMSS/INFONAVIT si aplica).
6. Se genera `total_neto` y se guardan desgloses en `percepciones_nomina` y `deducciones_nomina`.

---

### 17.5 Facturacion y CFDI (Preparado para Futuro)

**Decision:** No se timbrara CFDI ahora, pero el modelo debe estar preparado para futura implementacion.

**Tablas propuestas:**

```sql
CREATE TABLE facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    serie TEXT,
    folio TEXT,
    uuid_cfdi TEXT UNIQUE,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    periodo_inicio DATE,
    periodo_fin DATE,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    impuestos NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    moneda TEXT DEFAULT 'MXN',
    tipo_cambio NUMERIC(10,4) DEFAULT 1,
    forma_pago TEXT,
    metodo_pago TEXT,
    uso_cfdi TEXT,
    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'TIMBRADA', 'CANCELADA', 'PAGADA')),
    xml_url TEXT,
    pdf_url TEXT,
    timbrado_en TIMESTAMP(3),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);

CREATE TABLE factura_conceptos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    cantidad NUMERIC(10,4) NOT NULL,
    unidad TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    valor_unitario NUMERIC(12,2) NOT NULL,
    importe NUMERIC(12,2) NOT NULL,
    descuento NUMERIC(12,2) DEFAULT 0,
    objeto_impuesto TEXT,
    impuesto_tasa NUMERIC(6,4),
    impuesto_importe NUMERIC(12,2),
    referencia_tipo TEXT,
    referencia_id UUID,
    activo BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    factura_id UUID REFERENCES facturas(id) ON DELETE SET NULL,
    monto NUMERIC(14,2) NOT NULL,
    fecha_pago DATE NOT NULL,
    metodo_pago TEXT NOT NULL,
    referencia TEXT,
    banco TEXT,
    cuenta_destino TEXT,
    comprobante_url TEXT,
    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'CONFIRMADO', 'RECHAZADO')),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    creado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    eliminado_en TIMESTAMP(3)
);

CREATE TABLE cuentas_por_cobrar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    factura_id UUID REFERENCES facturas(id) ON DELETE SET NULL,
    bitacora_id UUID REFERENCES bitacoras_renta_diaria(id) ON DELETE SET NULL,
    monto NUMERIC(14,2) NOT NULL,
    monto_pagado NUMERIC(14,2) DEFAULT 0,
    saldo NUMERIC(14,2) GENERATED ALWAYS AS (monto - monto_pagado) STORED,
    fecha_vencimiento DATE,
    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO')),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL
);

CREATE INDEX idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX idx_facturas_estado ON facturas(estado);
CREATE INDEX idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX idx_cxc_cliente ON cuentas_por_cobrar(cliente_id, estado);
```

**Nota sobre CFDI:**
- Mientras no se timbre, `estado` permanece en `PENDIENTE` y `uuid_cfdi` sera NULL.
- Los campos `xml_url`, `pdf_url` y `timbrado_en` se llenaran cuando se integre un PAC (Proveedor Autorizado de Certificacion).
- Se recomienda dejar un servicio `CfdiService` con metodo `timbrar(facturaId)` que se implemente mas adelante.

---

## 18. Ajustes al Orden de Migracion (Actualizado)

1. Crear tablas `personas`, `users`, `roles`, `permissions`, `users_roles`, `role_permissions`.
2. Crear tablas `vistas` y `role_vistas` para menu dinamico.
3. Crear tablas `sessions`, `refresh_tokens`, `token_blacklist`.
4. Crear tabla `registro_auditoria` con triggers de inmutabilidad.
5. Crear catalogos normalizados: `proveedores`, `categorias_inventario`, `tipos_maquina`, `unidades_medida`, `obras`, `categorias_puesto`.
6. Activar extension PostGIS y crear tablas GPS: `rastreo_gps`, `geocercas`, `geocerca_maquinas`, `alertas_gps`.
7. Crear tablas de flota: `maquina_componentes`, `maquina_operadores`, `fallas_mecanicas`.
8. Crear tablas de inventario: `movimientos_inventario`.
9. Crear tablas de nomina: `periodos_nomina`, `nominas`, `percepciones_nomina`, `deducciones_nomina`.
10. Crear tablas de facturacion: `facturas`, `factura_conceptos`, `pagos`, `cuentas_por_cobrar`.
11. Agregar columnas `creado_por`, `actualizado_por`, `eliminado_en`, `activo` a todas las tablas existentes.
12. Corregir tipos de datos (text -> date/time/timestamp).
13. Normalizar campos `obra`, `proveedor`, `categoria`, `tipo`, `unidad` a FKs.
14. Eliminar campos calculados de `proyectos` y crear vista financiera.
15. Agregar CHECK constraints.
16. Agregar indices adicionales.
17. Crear triggers de `actualizado_en` automatico.
18. Migrar datos existentes a nuevos catalogos.
19. Poblar `vistas` con las rutas actuales del sidebar.
20. Asignar vistas a roles por defecto.

---

## 19. Dudas Resueltas / Sin Dudas Pendientes

Con las respuestas proporcionadas, **no quedan dudas criticas** para modelar la base de datos. El siguiente paso seria implementar el `schema.prisma` con todos los cambios propuestos.


---

## 20. Mejoras en Gestion Documental

### 20.1 Decision: Tipo de Documento — ENUM vs Tabla

**Pregunta planteada:** "El tipo de documento deberia ser otra tabla o puede ser un enum?"

**Respuesta:** Se recomienda mantener tanto `tipo` como `categoria` del documento como **ENUMs** de PostgreSQL.

**Razones:**
1. La clasificacion de documentos (`CONTRATO`, `FACTURA`, `IDENTIFICACION`, `MANUAL`, `PERMISO`, `POLIZA`) es una lista cerrada y estable.
2. No se requieren atributos adicionales por tipo (no hay "salario del tipo de documento", "padre", "orden", etc.).
3. Los ENUMs garantizan integridad referencial a nivel de base de datos sin necesidad de JOINs.
4. Si en el futuro surge un nuevo tipo, agregar un valor a un ENUM en PostgreSQL es una operacion ligera:
   ```sql
   ALTER TYPE "TipoDocumento" ADD VALUE 'CERTIFICADO';
   ```

**Cuando convertir a tabla:** Si algun dia un tipo de documento requiere campos propios (ej. "Factura" requiere serie, folio, UUID CFDI; "Permiso" requiere vigencia), entonces si se justifica una tabla `tipos_documento`. Por ahora, los campos especificos de facturas viven en la tabla `facturas`, no en el tipo documental.

---

### 20.2 Tabla `documentos` Mejorada

**Proposito:** Repositorio central de archivos digitales del ERP: contratos, facturas, identificaciones, manuales, polizas, fotos de incidentes, etc.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador unico del documento |
| `codigo` | TEXT UNIQUE | Folio o codigo interno del documento |
| `nombre` | TEXT NOT NULL | Nombre original del archivo |
| `nombre_almacenamiento` | TEXT NOT NULL | Nombre unico generado para guardar en storage (UUID + extension) |
| `tipo` | ENUM TipoDocumento | Clasificacion funcional: CONTRATO, IDENTIFICACION, FACTURA, MANUAL, PERMISO, POLIZA |
| `categoria` | ENUM CategoriaDocumento | Ambito: PERSONAL, PROYECTOS, MAQUINARIA, PROVEEDORES, CONTABILIDAD |
| `mime_type` | TEXT NOT NULL | Tipo MIME del archivo (ej. `application/pdf`, `image/jpeg`) |
| `extension` | TEXT NOT NULL | Extension del archivo (pdf, jpg, png, xlsx, etc.) |
| `formato` | TEXT | Formato legible (PDF, Imagen, Excel, Word, etc.) |
| `tamano_bytes` | BIGINT NOT NULL | Peso del archivo en bytes |
| `tamano_legible` | TEXT | Peso legible (ej. "2.5 MB") calculado |
| `hash_sha256` | TEXT | Hash del archivo para integridad y deteccion de duplicados |
| `url_archivo` | TEXT NOT NULL | Ruta completa o URL presignada del archivo en storage |
| `url_thumbnail` | TEXT | Miniatura para imagenes/previews |
| `subido_por` / `creado_por` | UUID FK → `users` | Usuario que subio el documento |
| `actualizado_por` | UUID FK → `users` | Usuario que actualizo los metadatos |
| `propietario_tipo` | TEXT | Tipo de entidad dueña: TRABAJADOR, MAQUINA, PROYECTO, PROVEEDOR, CLIENTE |
| `propietario_id` | UUID | ID de la entidad dueña (patron polimorfico) |
| `trabajador_id` | UUID FK | Trabajador asociado (mantenido por compatibilidad, usar propietario_* preferente) |
| `maquina_id` | UUID FK | Maquina asociada |
| `proyecto_id` | UUID FK | Proyecto asociado |
| `proveedor_id` | UUID FK | Proveedor asociado |
| `cliente_id` | UUID FK | Cliente asociado |
| `palabras_clave` | TEXT[] | Array de tags para busqueda full-text |
| `descripcion` | TEXT | Descripcion opcional del contenido |
| `estado` | TEXT | BORRADOR, PUBLICADO, ARCHIVADO, ELIMINADO |
| `es_publico` | BOOLEAN | Si es visible para todos los usuarios autorizados |
| `requiere_firma` | BOOLEAN | Si requiere firma electronica/digital |
| `firmado` | BOOLEAN | Si ya fue firmado |
| `fecha_documento` | DATE | Fecha real del documento |
| `fecha_vigencia` | DATE | Fecha de expiracion (para permisos, polizas) |
| `version_actual` | INTEGER DEFAULT 1 | Numero de version actual |
| `activo` | BOOLEAN | Disponibilidad del registro |
| `creado_en` | TIMESTAMP | Fecha de subida |
| `actualizado_en` | TIMESTAMP | Ultima modificacion de metadatos |
| `eliminado_en` | TIMESTAMP | Soft delete |

**DDL recomendado:**

```sql
CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE,
    nombre TEXT NOT NULL,
    nombre_almacenamiento TEXT NOT NULL,
    tipo public."TipoDocumento" NOT NULL,
    categoria public."CategoriaDocumento" NOT NULL,
    mime_type TEXT NOT NULL,
    extension TEXT NOT NULL,
    formato TEXT,
    tamano_bytes BIGINT NOT NULL,
    tamano_legible TEXT,
    hash_sha256 TEXT,
    url_archivo TEXT NOT NULL,
    url_thumbnail TEXT,
    subido_por UUID REFERENCES users(id) ON DELETE SET NULL,
    actualizado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    propietario_tipo TEXT CHECK (propietario_tipo IN ('TRABAJADOR', 'MAQUINA', 'PROYECTO', 'PROVEEDOR', 'CLIENTE', 'GENERAL')),
    propietario_id UUID,
    trabajador_id UUID REFERENCES trabajadores(id) ON DELETE SET NULL,
    maquina_id UUID REFERENCES maquinas(id) ON DELETE SET NULL,
    proyecto_id UUID REFERENCES proyectos(id) ON DELETE SET NULL,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    palabras_clave TEXT[],
    descripcion TEXT,
    estado TEXT DEFAULT 'PUBLICADO' CHECK (estado IN ('BORRADOR', 'PUBLICADO', 'ARCHIVADO')),
    es_publico BOOLEAN DEFAULT FALSE NOT NULL,
    requiere_firma BOOLEAN DEFAULT FALSE NOT NULL,
    firmado BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_documento DATE,
    fecha_vigencia DATE,
    version_actual INTEGER DEFAULT 1 NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL,
    eliminado_en TIMESTAMP(3)
);

CREATE INDEX idx_documentos_propietario ON documentos(propietario_tipo, propietario_id);
CREATE INDEX idx_documentos_tipo ON documentos(tipo);
CREATE INDEX idx_documentos_categoria ON documentos(categoria);
CREATE INDEX idx_documentos_subido_por ON documentos(subido_por);
CREATE INDEX idx_documentos_palabras_clave ON documentos USING gin(palabras_clave);
CREATE INDEX idx_documentos_nombre_fts ON documentos
    USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '')));
```

---

### 20.3 Tabla `documento_versiones`

**Proposito:** Versionado de documentos. Cada vez que se sube un nuevo archivo sobre un documento existente, se crea una version historica.

```sql
CREATE TABLE documento_versiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_id UUID NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    numero_version INTEGER NOT NULL,
    nombre_archivo TEXT NOT NULL,
    url_archivo TEXT NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    hash_sha256 TEXT,
    cambios TEXT,
    subido_por UUID REFERENCES users(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (documento_id, numero_version)
);

CREATE INDEX idx_documento_versiones_documento ON documento_versiones(documento_id, numero_version DESC);
```

---

### 20.4 Tablas `etiquetas` y `documento_etiquetas`

**Proposito:** Sistema flexible de etiquetado transversal (no solo documentos; puede extenderse a maquinas, trabajadores, etc.).

```sql
CREATE TABLE etiquetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#64748b',
    entidad TEXT CHECK (entidad IN ('DOCUMENTO', 'MAQUINA', 'TRABAJADOR', 'PROYECTO', 'GENERAL')),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL
);

CREATE TABLE documento_etiquetas (
    documento_id UUID NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
    PRIMARY KEY (documento_id, etiqueta_id)
);
```

---

### 20.5 Tabla `firmas_digitales`

**Proposito:** Almacenar registros de firma digital asociados a documentos. Reemplaza/amplia `firmas_cliente`.

```sql
CREATE TABLE firmas_digitales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_id UUID NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    firmado_por_tipo TEXT NOT NULL CHECK (firmado_por_tipo IN ('CLIENTE', 'TRABAJADOR', 'USUARIO')),
    firmado_por_id UUID NOT NULL,
    nombre_firmante TEXT NOT NULL,
    cargo_firmante TEXT,
    correo_firmante TEXT,
    hash_documento TEXT,
    datos_firma JSONB,
    imagen_firma_url TEXT,
    fecha_firma TIMESTAMP(3) NOT NULL,
    ip_firma TEXT,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP(3) NOT NULL
);

CREATE INDEX idx_firmas_documento ON firmas_digitales(documento_id);
```

**Nota:** La tabla `firmas_cliente` existente puede migrarse a `firmas_digitales` vinculando la bitacora de renta con un documento generado.

---

## 21. Glosario Completo de Tablas Existentes (Version Final)

A continuacion se presenta la version completa y detallada de todas las tablas actuales del esquema `svr_erp`. Para cada tabla se indica su proposito, campos, tipos y campos faltantes.

### `_prisma_migrations`
**Proposito:** Tabla interna de Prisma ORM que registra el historial de migraciones aplicadas. **No debe manipularse manualmente.**

### `apu_templates`
**Proposito:** Plantillas de Analisis de Precios Unitarios (APU). Define conceptos de obra y sus unidades de medida.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador unico | ✅ |
| `codigo` | TEXT | Codigo legible (APU001) | ⚠️ Debe ser UNIQUE NOT NULL |
| `nombre` | TEXT | Nombre del concepto | ✅ |
| `unidad` | TEXT | Unidad de medida | ⚠️ Convertir a FK |
| `activo` | BOOLEAN | Disponibilidad | ✅ |
| `creado_en` / `actualizado_en` | TIMESTAMP | Auditoria basica | ✅ |
| `creado_por` / `actualizado_por` / `eliminado_en` | | Auditoria completa | ❌ |

### `apu_items`
**Proposito:** Insumos que componen una plantilla APU: materiales, mano de obra y maquinaria.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador unico | ✅ |
| `apu_template_id` | UUID FK | Plantilla padre | ✅ |
| `categoria` | ENUM | MATERIAL, MANO_DE_OBRA, MAQUINARIA | ✅ |
| `nombre` | TEXT | Nombre del insumo | ✅ |
| `unidad` | TEXT | Unidad de medida | ⚠️ Convertir a FK |
| `cantidad` | NUMERIC | Cantidad requerida | ✅ |
| `costo_unitario` | NUMERIC | Costo unitario | ✅ |
| Auditoria completa | | | ❌ |

### `articulos_inventario`
**Proposito:** Catalogo de articulos, refacciones y materiales en almacen.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador del articulo | ✅ |
| `codigo` | TEXT | SKU | ⚠️ Debe ser UNIQUE NOT NULL |
| `nombre` | TEXT | Nombre del articulo | ✅ |
| `categoria` | TEXT | Categoria | ⚠️ Convertir a FK |
| `stock` / `stock_minimo` | NUMERIC | Inventario actual y minimo | ✅ |
| `unidad` | TEXT | Unidad de medida | ⚠️ Convertir a FK |
| `precio_unitario` | NUMERIC | Precio de compra | ✅ |
| `proveedor` | TEXT | Proveedor | ⚠️ Convertir a FK |
| Auditoria completa | | | ❌ |

### `asistencias_semanales`
**Proposito:** Resumen semanal de asistencia por trabajador.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `trabajador_id` | UUID FK | Trabajador | ✅ |
| `semana` | TEXT | Descripcion de la semana | ✅ |
| `total_dias_asistidos` / `total_faltas` / `total_retardos` | INTEGER | Totales | ✅ |
| `total_horas_ordinarias` / `total_horas_extra` | NUMERIC | Horas | ✅ |
| `activo` / auditoria completa | | | ❌ |

### `bitacoras_operacion`
**Proposito:** Registro diario de actividades operativas de maquinas.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `maquina_id` | UUID FK | Maquina | ✅ |
| `actividad` | TEXT | Descripcion | ✅ |
| `horas` | NUMERIC | Horas invertidas | ✅ |
| `fecha` | DATE | Fecha | ✅ |
| `obra` | TEXT | Ubicacion | ⚠️ Convertir a FK |
| `codigo` | TEXT | Folio | ⚠️ UNIQUE NOT NULL |
| Auditoria completa | | | ❌ |

### `bitacoras_renta_diaria`
**Proposito:** Control diario de renta de maquinaria con operador.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `folio` | TEXT UNIQUE | Folio de renta | ✅ |
| `trabajador_id` / `maquina_id` / `cliente_id` | UUID FK | Relaciones | ✅ |
| `fecha` | DATE | Fecha de servicio | ✅ |
| `obra_ubicacion` | TEXT | Obra | ⚠️ Convertir a FK |
| `hora_inicio` / `hora_fin` | TEXT | Horas | ❌ Convertir a TIME |
| `horas_efectivas` / `horas_extras` | NUMERIC | Horas | ✅ |
| `horometro_inicial` / `horometro_final` | NUMERIC | Horometro | ✅ |
| `estado_cobro` | ENUM | Estado de facturacion | ✅ |
| `tarifa_hora_renta` / `importe_total_renta` | NUMERIC | Montos | ✅ |
| Auditoria completa | | | ❌ |

### `cargas_combustible`
**Proposito:** Registro de cargas de diesel y calculo de rendimiento.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `codigo` | TEXT | Folio | ⚠️ UNIQUE NOT NULL |
| `maquina_id` | UUID FK | Maquina | ✅ |
| `fecha` | DATE | Fecha | ✅ |
| `litros` / `costo` | NUMERIC | Carga | ✅ |
| `operador_id` | UUID FK | Operador | ✅ |
| `lugar` | TEXT | Lugar | ⚠️ Convertir a FK |
| Rendimiento y alertas | NUMERIC/BOOLEAN | Consumo esperado/real/desviacion | ✅ |
| Auditoria completa | | | ❌ |

### `checklists_preoperacionales`
**Proposito:** Inspeccion diaria pre-operacional de maquinas.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `codigo` | TEXT | Folio | ⚠️ UNIQUE NOT NULL |
| `maquina_id` / `operador_id` | UUID FK | Relaciones | ✅ |
| `fecha` / `hora` | DATE/TEXT | Fecha y hora | ❌ Hora a TIME |
| Niveles y estados | ENUM/BOOLEAN | Aceite, hidraulico, llantas, frenos, luces | ✅ |
| `estado` | ENUM | APROBADO / CON_FALLA | ✅ |
| Auditoria completa | | | ❌ |

### `clientes`
**Proposito:** Catalogo de clientes.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `codigo` | TEXT | Codigo interno | ⚠️ UNIQUE NOT NULL |
| `nombre` / `empresa` | TEXT | Datos del cliente | ✅ |
| `correo` / `telefono` | TEXT | Contacto | ✅ |
| `rfc` / `direccion_fiscal` | | Datos fiscales | ❌ |
| Auditoria completa | | | ❌ |

### `contactos_emergencia`
**Proposito:** Contactos de emergencia de trabajadores.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `trabajador_id` | UUID FK | Trabajador | ✅ |
| `nombre` / `telefono` / `parentesco` | TEXT | Datos del contacto | ✅ |
| `activo` / auditoria completa | | | ❌ |

### `cotizaciones`
**Proposito:** Propuestas de precio a clientes.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `codigo` | TEXT | Folio | ⚠️ UNIQUE NOT NULL |
| `cliente_id` | UUID FK | Cliente | ✅ |
| `descripcion` / `monto` / `fecha` | | Datos de la cotizacion | ✅ |
| `estado` | ENUM | PENDIENTE/ACEPTADA/RECHAZADA | ✅ |
| `vendedor_id` | UUID FK | Usuario que elabora | ❌ |
| Auditoria completa | | | ❌ |

### `despachos_maquina`
**Proposito:** Asignacion temporal de maquinas a proyectos.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `codigo` | TEXT | Folio | ⚠️ UNIQUE NOT NULL |
| `maquina_id` / `proyecto_id` | UUID FK | Relaciones | ✅ |
| `fecha_inicio` / `fecha_fin` | DATE | Periodo | ✅ |
| `obra_id` / `operador_id` | UUID FK | Obra y operador | ❌ |
| Auditoria completa | | | ❌ |

### `dias_asistencia_semana`
**Proposito:** Detalle diario de asistencia semanal.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `asistencia_semanal_id` | UUID FK | Resumen padre | ✅ |
| `dia` | ENUM | Dia de la semana | ✅ |
| `fecha` | TEXT | Fecha | ❌ Convertir a DATE |
| `estado` | ENUM | Estado de asistencia | ✅ |
| `hora_entrada` / `hora_salida` | TEXT | Horas | ❌ Convertir a TIME |
| `horas_trabajadas` / `horas_extra` | NUMERIC | Horas | ✅ |
| `en_sitio_gps` / `motivo` | BOOLEAN/TEXT | Validacion y motivo | ✅ |
| Auditoria completa | | | ❌ |

### `documentos`
**Proposito:** Repositorio de archivos digitales.  
**Ver seccion 20.2 para el modelo completo mejorado.**

### `firmas_cliente`
**Proposito:** Firmas de cliente en bitacoras de renta.  
**Recomendacion:** Migrar a `firmas_digitales` (seccion 20.5).

### `hitos_progreso`
**Proposito:** Hitos de avance fisico de proyectos.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `proyecto_id` | UUID FK | Proyecto | ✅ |
| `fecha` | TEXT | Fecha del hito | ❌ Convertir a DATE |
| `planificado` / `real` | NUMERIC | Porcentajes | ✅ |
| `nombre` / `descripcion` | TEXT | Datos descriptivos | ❌ |
| Auditoria completa | | | ❌ |

### `horas_extra_asistencia`
**Proposito:** Horas extra derivadas de registros de asistencia.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `registro_asistencia_id` | UUID FK | Asistencia origen | ✅ |
| `inicio` / `fin` | TEXT | Horas | ❌ Convertir a TIME |
| `horas_calculadas` / `tarifa_por_hora` / `monto_total` | NUMERIC | Calculo | ✅ |
| `estado` | ENUM | Aprobacion | ✅ |
| Coordenadas GPS | NUMERIC | Inicio/fin | ✅ |
| `aprobador_id` | UUID FK | Aprobador | ❌ |
| Auditoria completa | | | ❌ |

### `incidentes`
**Proposito:** Incidentes y situaciones anomalas en obra.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `codigo` | TEXT | Folio | ⚠️ UNIQUE NOT NULL |
| `titulo` / `descripcion` | TEXT | Datos del incidente | ✅ |
| `prioridad` / `estado` | ENUM | Clasificacion | ✅ |
| `fecha` | DATE | Fecha | ✅ |
| `maquina_id` | UUID FK | Maquina | ✅ |
| `obra` | TEXT | Obra | ⚠️ Convertir a FK |
| `reporto_id` | UUID FK | Quien reporta | ❌ |
| Auditoria completa | | | ❌ |

### `lecturas_horometro`
**Proposito:** Lecturas periodicas de horometro.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `maquina_id` | UUID FK | Maquina | ✅ |
| `fecha` | DATE | Fecha | ✅ |
| `lectura_inicial` / `lectura_final` / `horas_trabajadas` | NUMERIC | Lecturas | ✅ |
| `codigo` | TEXT | Folio | ⚠️ UNIQUE NOT NULL |
| `operador_id` | UUID FK | Operador | ❌ |
| Auditoria completa | | | ❌ |

### `licencias_trabajador`
**Proposito:** Licencias y certificaciones de trabajadores.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `trabajador_id` | UUID FK | Trabajador | ✅ |
| `tipo` | TEXT | Tipo de licencia | ⚠️ Convertir a ENUM |
| `vigencia` | TEXT | Fecha de vigencia | ❌ Convertir a DATE |
| `folio` | TEXT | Numero de folio | ✅ |
| `archivo_url` | TEXT | Documento escaneado | ❌ |
| Auditoria completa | | | ❌ |

### `maquinas`
**Proposito:** Catalogo maestro de la flota.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `codigo` | TEXT | Codigo de flota | ⚠️ UNIQUE NOT NULL |
| `nombre` | TEXT | Nombre | ✅ |
| `tipo` | TEXT | Tipo | ⚠️ Convertir a FK |
| `estado` | ENUM | ENCENDIDA/APAGADA/MANTENIMIENTO/MOVIMIENTO | ✅ |
| `combustible` / `horometro` / `diesel_hoy` / `horas_operadas_hoy` | NUMERIC | Telemetria resumida | ✅ |
| `operador_id` | UUID FK | Operador actual | ✅ |
| `lat` / `lng` | NUMERIC | Ultima posicion GPS | ✅ |
| `proximo_mantenimiento` / `imagen` | DATE/TEXT | Datos tecnicos | ✅ |
| Consumo y rendimiento | NUMERIC | Metricas | ✅ |
| `modelo` / `anio` / `serie` / `placas` | TEXT | Datos tecnicos | ❌ |
| Auditoria completa | | | ❌ |

### `permisos` (negocio)
**Proposito:** Vacaciones, permisos e incapacidades.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `trabajador_id` | UUID FK | Trabajador | ✅ |
| `tipo` / `estado` | ENUM | Clasificacion y aprobacion | ✅ |
| `fecha_inicio` / `fecha_fin` | DATE | Periodo | ✅ |
| `motivo` / `dias_solicitados` | TEXT/INTEGER | Datos | ✅ |
| `codigo` | TEXT | Folio | ⚠️ UNIQUE NOT NULL |
| `aprobador_id` | UUID FK | Aprobador | ❌ |
| Auditoria completa | | | ❌ |

### `proyectos`
**Proposito:** Obras o proyectos de construccion.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `codigo` | TEXT | Codigo interno | ⚠️ UNIQUE NOT NULL |
| `nombre` | TEXT | Nombre | ✅ |
| `cliente_id` | UUID FK | Cliente | ✅ |
| `presupuesto` | NUMERIC | Presupuesto | ✅ |
| `progreso` | NUMERIC | Avance | ✅ |
| `estado` | ENUM | EN_PROCESO/FINALIZADO/PAUSADO | ✅ |
| `fecha_inicio` / `fecha_fin` | DATE | Periodo | ✅ |
| `ubicacion` | TEXT | Ubicacion | ⚠️ Convertir a FK |
| Campos calculados | NUMERIC | gastado, ingresos, gastos, utilidad | ⚠️ Eliminar, usar vista |
| Auditoria completa | | | ❌ |

### `registros_asistencia`
**Proposito:** Registro diario de entrada/salida con validacion GPS.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `codigo` | TEXT | Folio | ⚠️ UNIQUE NOT NULL |
| `trabajador_id` | UUID FK | Trabajador | ✅ |
| `fecha` | DATE | Fecha | ✅ |
| Horas | TEXT | Entrada/salida/marcaje | ❌ Convertir a TIME |
| `estado` | ENUM | Estado de asistencia | ✅ |
| Coordenadas y distancia | NUMERIC/TEXT | GPS y validacion | ✅ |
| `proyecto_id` / `obra_asignada` | UUID FK/TEXT | Asignacion | ⚠️ Obra a FK |
| `en_sitio` / `precision_gps_metros` / `dispositivo` | BOOLEAN/NUMERIC/TEXT | Datos tecnicos | ✅ |
| Horas trabajadas, salida anticipada, bateria, notas | | | ✅ |
| Auditoria completa | | | ❌ |

### `registros_criba`
**Proposito:** Produccion de planta de criba/trituracion.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `codigo` | TEXT | Folio | ⚠️ UNIQUE NOT NULL |
| `fecha` | DATE | Fecha | ✅ |
| `turno` | ENUM | MATUTINO/VESPERTINO | ✅ |
| `operador_id` | UUID FK | Operador | ✅ |
| `tipo_material` / `material_producido` / `horas_trabajadas` / `material_al_banco` | TEXT/NUMERIC | Produccion | ✅ |
| `observaciones` | TEXT | Notas | ✅ |
| Auditoria completa | | | ❌ |

### `registros_mantenimiento`
**Proposito:** Servicios de mantenimiento correctivo y preventivo.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `codigo` | TEXT | Folio | ⚠️ UNIQUE NOT NULL |
| `maquina_id` | UUID FK | Maquina | ✅ |
| `tipo` | ENUM | CORRECTIVO/PREVENTIVO | ✅ |
| `descripcion` / `fecha` / `horas_servicio` / `costo` / `proximo_servicio_horas` | | Datos del servicio | ✅ |
| `mecanico_id` | UUID FK | Mecanico responsable | ❌ |
| `refacciones_usadas` | JSONB | Relacion de refacciones | ❌ |
| Auditoria completa | | | ❌ |

### `reportes_campo`
**Proposito:** Reportes enviados desde campo.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `codigo` | TEXT | Folio | ⚠️ UNIQUE NOT NULL |
| `tipo` / `estado` / `prioridad` | ENUM | Clasificacion | ✅ |
| `usuario` | TEXT | Usuario que reporta | ⚠️ Convertir a FK |
| `maquina_id` | UUID FK | Maquina | ✅ |
| `obra` | TEXT | Obra | ⚠️ Convertir a FK |
| `fecha` / `hora` | DATE/TEXT | Fecha y hora | ❌ Hora a TIME |
| `descripcion` / `detalles` | TEXT/JSONB | Contenido | ✅ |
| Auditoria completa | | | ❌ |

### `trabajadores`
**Proposito:** Catalogo maestro de empleados.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `codigo` | TEXT | Codigo de nomina | ⚠️ UNIQUE NOT NULL |
| `nombre` / `puesto` | TEXT | Datos personales | ✅ |
| `categoria_puesto` | ENUM ⚠️ | Categoria. Convertir a FK |
| `estado` | ENUM | ACTIVO/INACTIVO/VACACIONES | ✅ |
| `entrada` | TEXT | Horario | ❌ Convertir a TIME |
| `telefono` / `avatar` | TEXT | Contacto y foto | ✅ |
| `sueldo_fiscal` / `sueldo_efectivo` / `metodo_pago` | NUMERIC/ENUM | Salario | ✅ |
| `estado_renta` / `cliente_renta_actual_id` | ENUM/FK | Renta | ✅ |
| `fecha_contratacion` / `vacaciones_dias` / etc. | | | ✅ |
| Auditoria completa | | | ❌ |

### `trabajadores_proyectos`
**Proposito:** Relacion N:N trabajadores-proyectos.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|
| `trabajador_id` / `proyecto_id` | UUID FK | Relacion compuesta PK | ✅ |
| `asignado_en` | TIMESTAMP | Fecha de asignacion | ✅ |
| `activo` / auditoria completa | | | ❌ |

### `transacciones`
**Proposito:** Registro financiero generico de ingresos y egresos. **Requiere refactorizacion** para vincularse a entidades origen.

| Campo | Tipo | Descripcion | Estado |
|---|---|---|
| `id` | UUID PK | Identificador | ✅ |
| `codigo` | TEXT | Folio contable | ⚠️ UNIQUE NOT NULL |
| `tipo` | ENUM | INGRESO/EGRESO | ✅ |
| `categoria` | TEXT | Categoria contable | ✅ |
| `monto` / `fecha` / `descripcion` | | Datos | ✅ |
| `entidad_tipo` / `entidad_id` | TEXT/UUID | Referencia polimorfica al origen | ❌ |
| Auditoria completa | | | ❌ |

---

## 22. Veredicto Final: Cumple la Base de Datos?

### Respuesta corta
**No cumple aun.** La base de datos actual es un buen esqueleto funcional para un prototipo, pero le faltan piezas criticas para ser un ERP de produccion completo.

### Estado por modulo

| Modulo | Cobertura | Observacion |
|---|---|---|
| Autenticacion y RBAC | ❌ 0% | No existen tablas de users, roles, permisos |
| Menu dinamico por rol | ❌ 0% | No existe |
| Auditoria inmutable | ❌ 0% | No existe |
| Trabajadores | ⚠️ 70% | Faltan datos fiscales, auditoria, historial de puestos |
| Asistencia y Horas Extra | ⚠️ 75% | Funcional pero con tipos de datos incorrectos |
| Maquinaria / Flota | ⚠️ 65% | Falta historial GPS, geocercas, fallas estructuradas, componentes |
| Combustible | ⚠️ 75% | Falta estaciones de carga y auditoria |
| Mantenimiento | ⚠️ 60% | Basico; falta fallas mecanicas, refacciones, mecanicos |
| Proyectos / Obras | ⚠️ 70% | Bien estructurado pero con campos calculados mal ubicados |
| Clientes y Cotizaciones | ⚠️ 70% | Faltan datos fiscales y vendedor |
| Documentos | ⚠️ 60% | Existe pero le faltan MIME, hash, versiones, firmas digitales |
| Inventario | ⚠️ 50% | Falta kardex, bodegas, movimientos |
| Nomina | ❌ 0% | No existen tablas de nomina |
| Facturacion / CFDI | ❌ 0% | No existen tablas de facturas, pagos, cuentas por cobrar |
| Reportes de Campo / Incidentes | ⚠️ 75% | Funcional, faltan FKs y auditoria |
| GPS / Rastreo | ⚠️ 30% | Solo ultima posicion; sin historial, geocercas ni alertas |
| Finanzas / Contabilidad | ⚠️ 40% | `transacciones` es muy generica |
| Compras / Proveedores | ⚠️ 30% | Proveedores solo texto; sin ordenes de compra |

### Porcentaje estimado de cobertura total
**Aproximadamente 55%** de un ERP constructora completo.

### Conclusio
El esquema actual cubre bien los flujos operativos basicos (maquinas, trabajadores, asistencia, proyectos), pero necesita:

1. **Capa de seguridad**: users, roles, permisos, sessions.
2. **Capa de auditoria**: registro_auditoria inmutable.
3. **GPS completo**: rastreo historico, geocercas, alertas.
4. **Flota completa**: fallas mecanicas, componentes, historial de operadores.
5. **Nomina y facturacion**: tablas de nominas, facturas, pagos.
6. **Inventario avanzado**: kardex y bodegas.
7. **Documental completo**: versiones, firmas, MIME, hash.
8. **Refactorizacion de tipos y campos calculados**.

Con las recomendaciones de este documento, el esquema alcanzaria aproximadamente **90-95%** de cobertura de un ERP constructora estandar.

---

## 23. Resumen Ejecutivo del Esquema Propuesto

Este es el panorama completo de tablas necesarias para SVR-ERP. Se incluyen tablas existentes (requieren ajustes) y tablas nuevas propuestas.

### 23.1 Catalogo de Tablas

| # | Tabla | Proposito | Tipo |
|---|---|---|---|
| 1 | `_prisma_migrations` | Control de migraciones de Prisma | Existente |
| 2 | `personas` | Datos personales de fisicos | Nueva |
| 3 | `users` | Credenciales y cuentas de usuario | Nueva |
| 4 | `roles` | Roles del sistema | Nueva |
| 5 | `permissions` | Permisos granulares | Nueva |
| 6 | `role_permissions` | Relacion roles-permisos | Nueva |
| 7 | `users_roles` | Relacion usuarios-roles | Nueva |
| 8 | `sessions` | Sesiones activas de usuario | Nueva |
| 9 | `refresh_tokens` | Rotacion de refresh tokens | Nueva |
| 10 | `token_blacklist` | Tokens revocados | Nueva |
| 11 | `vistas` | Rutas/menu de la aplicacion | Nueva |
| 12 | `role_vistas` | Permisos de vistas por rol | Nueva |
| 13 | `registro_auditoria` | Logs inmutables de auditoria | Nueva |
| 14 | `clientes` | Clientes de la constructora | Existente |
| 15 | `proveedores` | Proveedores de materiales/servicios | Nueva |
| 16 | `obras` | Ubicaciones/obras de proyectos | Nueva |
| 17 | `proyectos` | Proyectos de construccion | Existente |
| 18 | `trabajadores` | Empleados y operadores | Existente |
| 19 | `categorias_puesto` | Catalogo de categorias de puesto | Nueva |
| 20 | `contactos_emergencia` | Contactos de emergencia | Existente |
| 21 | `licencias_trabajador` | Licencias y certificaciones | Existente |
| 22 | `permisos` | Vacaciones/permisos de trabajadores | Existente |
| 23 | `trabajadores_proyectos` | Asignacion trabajador-proyecto | Existente |
| 24 | `maquinas` | Flota de maquinaria | Existente |
| 25 | `tipos_maquina` | Catalogo de tipos de maquina | Nueva |
| 26 | `maquina_componentes` | Componentes por maquina | Nueva |
| 27 | `maquina_operadores` | Historial de operadores por maquina | Nueva |
| 28 | `fallas_mecanicas` | Registro de fallas y reparaciones | Nueva |
| 29 | `registros_mantenimiento` | Servicios de mantenimiento | Existente |
| 30 | `checklists_preoperacionales` | Inspecciones diarias | Existente |
| 31 | `lecturas_horometro` | Lecturas de horometro | Existente |
| 32 | `cargas_combustible` | Cargas de diesel | Existente |
| 33 | `despachos_maquina` | Asignacion maquina-proyecto | Existente |
| 34 | `bitacoras_operacion` | Actividades operativas | Existente |
| 35 | `bitacoras_renta_diaria` | Renta diaria con operador | Existente |
| 36 | `firmas_cliente` | Firmas en bitacoras (legacy) | Existente |
| 37 | `rastreo_gps` | Historial de posiciones GPS | Nueva |
| 38 | `geocercas` | Zonas geograficas circulares | Nueva |
| 39 | `geocerca_maquinas` | Estado dentro/fuera de geocerca | Nueva |
| 40 | `alertas_gps` | Alertas del sistema GPS | Nueva |
| 41 | `asistencias_semanales` | Resumen semanal de asistencia | Existente |
| 42 | `dias_asistencia_semana` | Detalle diario de asistencia | Existente |
| 43 | `registros_asistencia` | Registro de entrada/salida | Existente |
| 44 | `horas_extra_asistencia` | Horas extra | Existente |
| 45 | `periodos_nomina` | Periodos de pago | Nueva |
| 46 | `nominas` | Calculo de nomina por trabajador | Nueva |
| 47 | `percepciones_nomina` | Percepciones desglosadas | Nueva |
| 48 | `deducciones_nomina` | Deducciones desglosadas | Nueva |
| 49 | `cotizaciones` | Cotizaciones a clientes | Existente |
| 50 | `facturas` | Facturas (preparado CFDI) | Nueva |
| 51 | `factura_conceptos` | Conceptos de factura | Nueva |
| 52 | `pagos` | Pagos recibidos de clientes | Nueva |
| 53 | `cuentas_por_cobrar` | Control de cobranza | Nueva |
| 54 | `articulos_inventario` | Catalogo de articulos | Existente |
| 55 | `categorias_inventario` | Categorias de inventario | Nueva |
| 56 | `unidades_medida` | Unidades de medida | Nueva |
| 57 | `movimientos_inventario` | Kardex de movimientos | Nueva |
| 58 | `apu_templates` | Plantillas APU | Existente |
| 59 | `apu_items` | Insumos de APU | Existente |
| 60 | `hitos_progreso` | Avance de proyectos | Existente |
| 61 | `transacciones` | Movimientos contables genericos | Existente |
| 62 | `reportes_campo` | Reportes desde campo | Existente |
| 63 | `incidentes` | Incidentes en obra | Existente |
| 64 | `registros_criba` | Produccion de criba | Existente |
| 65 | `documentos` | Archivos digitales | Existente |
| 66 | `documento_versiones` | Versionado de documentos | Nueva |
| 67 | `etiquetas` | Etiquetas transversales | Nueva |
| 68 | `documento_etiquetas` | Relacion documento-etiqueta | Nueva |
| 69 | `firmas_digitales` | Firmas digitales de documentos | Nueva |

**Total: 69 tablas** (31 existentes + 38 nuevas propuestas).


### 23.2 Relaciones Principales del Modelo

**Seguridad y Acceso:**
- `personas` 1:1 `users`
- `users` 1:N `sessions`
- `users` 1:N `refresh_tokens`
- `users` N:M `roles` via `users_roles`
- `roles` N:M `permissions` via `role_permissions`
- `roles` N:M `vistas` via `role_vistas`
- `vistas` auto-relacion padre-hijo via `vista_padre_id`

**Flota y GPS:**
- `maquinas` 1:N `rastreo_gps`
- `maquinas` N:M `geocercas` via `geocerca_maquinas`
- `maquinas` 1:N `alertas_gps`
- `maquinas` 1:N `maquina_componentes`
- `maquinas` 1:N `maquina_operadores` -> `trabajadores`
- `maquinas` 1:N `fallas_mecanicas`
- `maquinas` 1:N `registros_mantenimiento`
- `maquinas` 1:N `checklists_preoperacionales`
- `maquinas` 1:N `lecturas_horometro`
- `maquinas` 1:N `cargas_combustible`
- `maquinas` 1:N `despachos_maquina` -> `proyectos`
- `maquinas` 1:N `bitacoras_operacion`
- `maquinas` 1:N `bitacoras_renta_diaria` -> `clientes`, `trabajadores`

**Recursos Humanos:**
- `trabajadores` 1:N `contactos_emergencia`
- `trabajadores` 1:N `licencias_trabajador`
- `trabajadores` 1:N `permisos`
- `trabajadores` N:M `proyectos` via `trabajadores_proyectos`
- `trabajadores` 1:N `maquina_operadores`
- `trabajadores` 1:N `asistencias_semanales`
- `trabajadores` 1:N `registros_asistencia`
- `trabajadores` 1:N `nominas`

**Finanzas:**
- `clientes` 1:N `proyectos`
- `clientes` 1:N `cotizaciones`
- `clientes` 1:N `facturas`
- `clientes` 1:N `pagos`
- `clientes` 1:N `cuentas_por_cobrar`
- `facturas` 1:N `factura_conceptos`
- `facturas` 1:N `pagos`
- `facturas` 1:1 `cuentas_por_cobrar`

**Inventario:**
- `articulos_inventario` 1:N `movimientos_inventario`
- `articulos_inventario` N:1 `categorias_inventario`
- `articulos_inventario` N:1 `unidades_medida`
- `articulos_inventario` N:1 `proveedores`

**Documentos:**
- `documentos` 1:N `documento_versiones`
- `documentos` N:M `etiquetas` via `documento_etiquetas`
- `documentos` 1:N `firmas_digitales`


### 23.3 ENUMs del Sistema

#### ENUMs de Auditoria (nuevos)

| ENUM | Valores |
|---|---|
| `actor_type` | USER, SYSTEM |
| `audit_action` | LOGIN_EXITOSO, LOGIN_FALLIDO, LOGOUT, TOKEN_REFRESCADO, TOKEN_REVOCADO, SESION_CERRADA, USUARIO_CREADO, USUARIO_ACTUALIZADO, USUARIO_ELIMINADO, ROL_ASIGNADO, ROL_REVOCADO, PERMISO_MODIFICADO, VISTA_CREADA, VISTA_ACTUALIZADA, VISTA_ELIMINADA, PERSONA_CREADA, PERSONA_ACTUALIZADA, DOCUMENTO_CREADO, DOCUMENTO_ACTUALIZADO, DOCUMENTO_ELIMINADO, REPORTE_CREADO, REPORTE_ACTUALIZADO, REPORTE_ELIMINADO, ESTATUS_CAMBIADO, PAGO_REGISTRADO, PAGO_ACTUALIZADO, PAGO_ELIMINADO, NOMINA_PROCESADA, COMBUSTIBLE_CARGADO, MAQUINA_ASIGNADA, MAQUINA_LIBERADA, ERROR_SISTEMA |
| `audit_result` | SUCCESS, FAIL, DENIED |
| `audit_severity` | INFO, WARNING, CRITICAL |

#### ENUMs Existentes del Negocio

| ENUM | Valores | Uso Principal |
|---|---|---|
| `CategoriaApuItem` | MATERIAL, MANO_DE_OBRA, MAQUINARIA | `apu_items` |
| `CategoriaDocumento` | PERSONAL, PROYECTOS, MAQUINARIA, PROVEEDORES, CONTABILIDAD | `documentos` |
| `CategoriaPuesto` | OPERADOR, CHOFER, MECANICO, INGENIERO, ADMINISTRATIVO | `trabajadores` (recomendado convertir a FK) |
| `DiaSemana` | LUN, MAR, MIE, JUE, VIE, SAB | `dias_asistencia_semana` |
| `EstadoAsistencia` | PUNTUAL, RETARDO, FALTA, JUSTIFICADO, NO_PRESENTADO, SALIDA_ANTICIPADA | `registros_asistencia` |
| `EstadoAsistenciaDia` | PUNTUAL, RETARDO, FALTA, JUSTIFICADO, SALIDA_ANTICIPADA, DESCANSO | `dias_asistencia_semana` |
| `EstadoChecklist` | APROBADO, CON_FALLA | `checklists_preoperacionales` |
| `EstadoCobroBitacora` | LISTO_FACTURAR, FACTURADO, PENDIENTE_FIRMA | `bitacoras_renta_diaria` |
| `EstadoCotizacion` | PENDIENTE, ACEPTADA, RECHAZADA | `cotizaciones` |
| `EstadoHoraExtra` | EN_CURSO, APROBADO, PENDIENTE, RECHAZADO | `horas_extra_asistencia` |
| `EstadoIncidente` | ABIERTO, EN_REVISION, RESUELTO | `incidentes` |
| `EstadoLlantas` | CORRECTO, DESGASTE_SEVERO, DANO | `checklists_preoperacionales` |
| `EstadoMaquina` | ENCENDIDA, APAGADA, MANTENIMIENTO, MOVIMIENTO | `maquinas` |
| `EstadoPermiso` | PENDIENTE, APROBADO, RECHAZADO | `permisos` |
| `EstadoProyecto` | EN_PROCESO, FINALIZADO, PAUSADO | `proyectos` |
| `EstadoRenta` | RENTADO_CLIENTE, EN_OBRA_PROPIA, DISPONIBLE_PATIO | `trabajadores` |
| `EstadoReporteCampo` | PENDIENTE, VISTO, ATENDIDO, EN_REVISION, RESUELTO | `reportes_campo` |
| `EstadoSistema` | CORRECTO, FALLA | `checklists_preoperacionales` |
| `EstadoTrabajador` | ACTIVO, INACTIVO, VACACIONES | `trabajadores` |
| `MetodoPago` | TARJETA, EFECTIVO, MIXTO | `trabajadores`, `nominas`, `pagos` |
| `NivelAceite` | CORRECTO, BAJO, EXCESO | `checklists_preoperacionales` |
| `NivelBinario` | CORRECTO, BAJO | `checklists_preoperacionales` |
| `Prioridad` | BAJA, MEDIA, ALTA, CRITICA | `incidentes`, `reportes_campo`, `alertas_gps`, `fallas_mecanicas` |
| `TipoDocumento` | CONTRATO, IDENTIFICACION, FACTURA, MANUAL, PERMISO, POLIZA | `documentos` |
| `TipoMantenimiento` | CORRECTIVO, PREVENTIVO | `registros_mantenimiento` |
| `TipoPermiso` | VACACIONES, PERMISO, INCAPACIDAD | `permisos` |
| `TipoReporteCampo` | MECANICO, OPERADOR, PIPERO, CHECADOR, INCIDENTE, INGENIERO, TRABAJADOR | `reportes_campo` |
| `TipoTransaccion` | INGRESO, EGRESO | `transacciones` |
| `Turno` | MATUTINO, VESPERTINO | `registros_criba` |

#### CHECK Constraints tipo ENUM (nuevos)

| Tabla | Campo | Valores permitidos |
|---|---|---|
| `alertas_gps` | `tipo` | EXCESO_VELOCIDAD, ENTRADA_GEOCERCA, SALIDA_GEOCERCA, ENCENDIDO_FUERA_HORARIO, APAGADO_INESPERADO, SOS, BATERIA_BAJA |
| `alertas_gps` | `severidad` | BAJA, MEDIA, ALTA, CRITICA |
| `fallas_mecanicas` | `sistema_afectado` | MOTOR, TRANSMISION, HIDRAULICO, ELECTRICO, NEUMATICO, ESTRUCTURA, OTRO |
| `fallas_mecanicas` | `severidad` | LEVE, MODERADA, GRAVE, CRITICA |
| `fallas_mecanicas` | `estado` | PENDIENTE, EN_DIAGNOSTICO, EN_REPARACION, REPARADA, DESCARTADA |
| `geocercas` | `tipo` | OBRA, PATIO, ESTACION, RUTA, PROHIBIDA |
| `token_blacklist` | `tipo` | ACCESS, REFRESH |
| `movimientos_inventario` | `tipo` | ENTRADA, SALIDA, AJUSTE, DEVOLUCION |
| `periodos_nomina` | `tipo` | SEMANAL, QUINCENAL, MENSUAL |
| `periodos_nomina` | `estado` | ABIERTO, CERRADO, PAGADO |
| `nominas` | `estado` | PENDIENTE, PAGADA, CANCELADA |
| `facturas` | `estado` | PENDIENTE, TIMBRADA, CANCELADA, PAGADA |
| `pagos` | `estado` | PENDIENTE, CONFIRMADO, RECHAZADO |
| `cuentas_por_cobrar` | `estado` | PENDIENTE, PARCIAL, PAGADO, VENCIDO |


### 23.4 Diagrama Conceptual por Capas

```text
CAPA DE SEGURIDAD
  personas -> users -> roles/permissions -> sessions/tokens

CAPA DE CONFIGURACION
  vistas -> role_vistas (menu dinamico)
  registro_auditoria (logs inmutables)

CATALOGOS MAESTROS
  clientes · proveedores · obras · tipos_maquina
  categorias_puesto · categorias_inventario · unidades_medida

NUCLEO OPERATIVO
  trabajadores <-> proyectos <-> maquinas
  asistencia · nomina · mantenimiento · combustible · rentas

CAPA GPS Y FLOTAS
  rastreo_gps · geocercas · alertas_gps
  fallas_mecanicas · maquina_componentes · maquina_operadores

FINANZAS
  cotizaciones · facturas · pagos · cuentas_por_cobrar · transacciones

INVENTARIO Y DOCUMENTOS
  articulos_inventario · movimientos_inventario
  documentos · firmas_digitales · etiquetas
```

---

### 23.5 Veredicto Final Actualizado

Con todas las tablas propuestas en este documento, el esquema cubre:

- Autenticacion y autorizacion (RBAC)
- Menu dinamico por rol
- Auditoria inmutable
- Gestion de trabajadores y asistencia
- Nomina completa
- Gestion de flota, GPS, geocercas y alertas
- Mantenimiento y fallas mecanicas
- Proyectos, obras y APU
- Clientes, cotizaciones, facturas (CFDI-ready), pagos y cobranza
- Inventario con kardex
- Documentos con versionado y firmas digitales

**Cobertura estimada con implementacion completa: 90-95% de un ERP constructora estandar.**

Las principales funcionalidades que quedarian fuera del alcance de este diseno (por requerir modulos especializados o integraciones de terceros) serian:
- Contabilidad electronica oficial (XML de contabilidad SAT)
- Timbrado CFDI real (preparado pero no implementado)
- Integracion bancaria automatica
- Modulo de compras avanzado (ordenes de compra, recepciones, backorders)
- Business Intelligence avanzado (reportes se generan desde datos)

