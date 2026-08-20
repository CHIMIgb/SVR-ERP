from pathlib import Path

content = """

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

---

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

---

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

---

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
"""

path = Path('/mnt/c/Users/chimi/Documents/GitHub/SVR-ERP/svr_erp_export/schema_recommendations.md')
path.write_text(path.read_text(encoding='utf-8') + content, encoding='utf-8')
print('Executive summary appended')
"""
