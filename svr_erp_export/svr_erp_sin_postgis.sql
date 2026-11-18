--
-- PostgreSQL database dump
--

\restrict KLMYbBa3Iy85jRhLyhgpzQpaOozHgrwhwnPVaU2usW8vzhFmgC1Mc24wnXIYfLn

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ActorType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ActorType" AS ENUM (
    'USER',
    'SYSTEM'
);


--
-- Name: AuditAction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditAction" AS ENUM (
    'LOGIN_EXITOSO',
    'LOGIN_FALLIDO',
    'LOGOUT',
    'TOKEN_REFRESCADO',
    'TOKEN_REVOCADO',
    'SESION_CERRADA',
    'USUARIO_CREADO',
    'USUARIO_ACTUALIZADO',
    'USUARIO_ELIMINADO',
    'ROL_ASIGNADO',
    'ROL_REVOCADO',
    'PERMISO_MODIFICADO',
    'VISTA_CREADA',
    'VISTA_ACTUALIZADA',
    'VISTA_ELIMINADA',
    'PERSONA_CREADA',
    'PERSONA_ACTUALIZADA',
    'DOCUMENTO_CREADO',
    'DOCUMENTO_ACTUALIZADO',
    'DOCUMENTO_ELIMINADO',
    'REPORTE_CREADO',
    'REPORTE_ACTUALIZADO',
    'REPORTE_ELIMINADO',
    'ESTATUS_CAMBIADO',
    'PAGO_REGISTRADO',
    'PAGO_ACTUALIZADO',
    'PAGO_ELIMINADO',
    'NOMINA_PROCESADA',
    'COMBUSTIBLE_CARGADO',
    'MAQUINA_ASIGNADA',
    'MAQUINA_LIBERADA',
    'ERROR_SISTEMA',
    'USUARIO_BLOQUEADO',
    'IP_BLOQUEADA',
    'ARTICULO_CREADO',
    'ARTICULO_ACTUALIZADO',
    'ARTICULO_ELIMINADO',
    'MOVIMIENTO_REGISTRADO',
    'STOCK_BAJO_DETECTADO',
    'STOCK_BAJO_RESUELTO',
    'STOCK_INSUFICIENTE',
    'BITACORA_CREADA',
    'BITACORA_ACTUALIZADA',
    'BITACORA_ELIMINADA',
    'MANTENIMIENTO_REGISTRADO',
    'MANTENIMIENTO_ACTUALIZADO',
    'MANTENIMIENTO_ELIMINADO',
    'COMBUSTIBLE_ACTUALIZADO',
    'COMBUSTIBLE_ELIMINADO',
    'INCIDENTE_CREADO',
    'INCIDENTE_ACTUALIZADO',
    'INCIDENTE_ELIMINADO',
    'TRABAJADOR_CREADO',
    'TRABAJADOR_ACTUALIZADO',
    'TRABAJADOR_ELIMINADO',
    'TRABAJADOR_LIQUIDADO',
    'BITACORA_RENTA_CREADA',
    'BITACORA_RENTA_ACTUALIZADA',
    'BITACORA_RENTA_ELIMINADA',
    'ASISTENCIA_ENTRADA_REGISTRADA',
    'ASISTENCIA_SALIDA_REGISTRADA',
    'ASISTENCIA_CUADRILLA_REGISTRADA',
    'ASISTENCIA_FALTA_REGISTRADA',
    'ASISTENCIA_ESTADO_ACTUALIZADO',
    'ASISTENCIA_HORAS_EXTRA_REGISTRADAS',
    'ASISTENCIA_HORAS_EXTRA_APROBADAS',
    'ASISTENCIA_HORAS_EXTRA_RECHAZADAS',
    'NOMINA_AJUSTE_APLICADO',
    'NOMINA_PAGO_MARCADO',
    'INCIDENTE_RESUELTO',
    'INCIDENTE_REPORTADO',
    'PROYECTO_CREADO',
    'PROYECTO_ACTUALIZADO',
    'PROYECTO_ELIMINADO',
    'PROYECTO_FINANZAS_ACTUALIZADO',
    'REGISTRO_CRIBA_CREADO',
    'REGISTRO_CRIBA_ACTUALIZADO',
    'REGISTRO_CRIBA_ELIMINADO',
    'TRANSACCION_CREADA',
    'TRANSACCION_ACTUALIZADA',
    'TRANSACCION_ELIMINADA',
    'CLIENTE_CREADO',
    'CLIENTE_ACTUALIZADO',
    'CLIENTE_ELIMINADO',
    'COTIZACION_CREADA',
    'COTIZACION_ACTUALIZADA',
    'COTIZACION_ELIMINADA',
    'VENTA_CREADA',
    'RETIRO_REGISTRADO',
    'CIERRE_CAJA_REGISTRADO',
    'APERTURA_CAJA_REGISTRADA',
    'CIERRE_CAJA_APROBADO',
    'CIERRE_CAJA_RECHAZADO',
    'CONFIG_TURNO_ACTUALIZADA',
    'PROVEEDOR_CREADO',
    'PROVEEDOR_ACTUALIZADO',
    'PROVEEDOR_ELIMINADO',
    'ORDEN_COMPRA_CREADA',
    'ORDEN_COMPRA_ACTUALIZADA',
    'ORDEN_COMPRA_ELIMINADA',
    'ORDEN_COMPRA_ESTADO_CAMBIADO',
    'PAGO_PROVEEDOR_REGISTRADO',
    'PROVEEDOR_CONSULTADO',
    'CXC_CREADA',
    'CXC_ACTUALIZADA',
    'CXC_CONSULTADA',
    'COBRO_REGISTRADO',
    'FACTURA_CREADA',
    'FACTURA_ACTUALIZADA',
    'FACTURA_TIMBRADA',
    'FACTURA_CANCELADA',
    'COTIZACION_FACTURADA',
    'BITACORA_FACTURADA',
    'COBRO_REVERTIDO',
    'REPORTE_CAMPO_FACTURADO',
    'BANCO_CREADO',
    'CUENTA_BANCARIA_CREADA',
    'MOVIMIENTO_BANCARIO_CREADO',
    'MOVIMIENTO_BANCARIO_LOTE_CARGADO',
    'MOVIMIENTO_CONCILIADO',
    'MOVIMIENTO_DESCONCILIADO',
    'TRANSACCION_EXPORTADA',
    'ORDEN_COMPRA_RECIBIDA',
    'REPORTE_ASIGNADO',
    'GEOCERCA_CREADA',
    'GEOCERCA_ACTUALIZADA',
    'GEOCERCA_ELIMINADA',
    'GEOCERCA_ENTRADA_DETECTADA',
    'GEOCERCA_SALIDA_DETECTADA',
    'GPS_POSICIONES_SIMULADAS',
    'REPORTE_COMENTADO',
    'REPORTE_ADJUNTO',
    'ASISTENCIA_OMISION_RESUELTA',
    'OBRA_UBICACION_REGISTRADA',
    'HOROMETRO_REGISTRADO',
    'MAQUINA_CREADA',
    'DESPACHO_CREADO',
    'CHECKLIST_REGISTRADO',
    'REPORTE_ACCESO_DENEGADO',
    'PIN_CAMBIADO',
    'PIN_REINICIADO',
    'CUENTA_DESBLOQUEADA',
    'NOTIFICACION_LEIDA',
    'NOTIFICACION_DESCARTADA',
    'JEFE_ASIGNADO',
    'ROL_CREADO',
    'ROL_ACTUALIZADO',
    'ROL_ELIMINADO',
    'VISTAS_ROL_ACTUALIZADAS',
    'PERMISOS_ROL_ACTUALIZADOS',
    'PERMISOS_ROL_ACTUALIZADAS'
);


--
-- Name: AuditResult; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditResult" AS ENUM (
    'SUCCESS',
    'FAIL',
    'DENIED'
);


--
-- Name: AuditSeverity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditSeverity" AS ENUM (
    'INFO',
    'WARNING',
    'CRITICAL'
);


--
-- Name: CategoriaApuItem; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CategoriaApuItem" AS ENUM (
    'MATERIAL',
    'MANO_DE_OBRA',
    'MAQUINARIA'
);


--
-- Name: CategoriaDocumento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CategoriaDocumento" AS ENUM (
    'PERSONAL',
    'PROYECTOS',
    'MAQUINARIA',
    'PROVEEDORES',
    'CONTABILIDAD'
);


--
-- Name: CategoriaLicencia; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CategoriaLicencia" AS ENUM (
    'DC3',
    'LICENCIA_FEDERAL',
    'CERTIFICADO_TECNICO',
    'CEDULA_PROFESIONAL',
    'OTRO'
);


--
-- Name: CategoriaReporte; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CategoriaReporte" AS ENUM (
    'MECANICO',
    'SOLDADOR',
    'DIESEL',
    'MANTENIMIENTO',
    'ADMINISTRATIVO',
    'RESIDENTE'
);


--
-- Name: DiaSemana; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DiaSemana" AS ENUM (
    'LUN',
    'MAR',
    'MIE',
    'JUE',
    'VIE',
    'SAB'
);


--
-- Name: EstadoAsistencia; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoAsistencia" AS ENUM (
    'PUNTUAL',
    'RETARDO',
    'FALTA',
    'JUSTIFICADO',
    'NO_PRESENTADO',
    'SALIDA_ANTICIPADA',
    'OMISION'
);


--
-- Name: EstadoAsistenciaDia; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoAsistenciaDia" AS ENUM (
    'PUNTUAL',
    'RETARDO',
    'FALTA',
    'JUSTIFICADO',
    'SALIDA_ANTICIPADA',
    'DESCANSO'
);


--
-- Name: EstadoChecklist; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoChecklist" AS ENUM (
    'APROBADO',
    'CON_FALLA'
);


--
-- Name: EstadoCobroBitacora; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoCobroBitacora" AS ENUM (
    'LISTO_FACTURAR',
    'FACTURADO',
    'PENDIENTE_FIRMA'
);


--
-- Name: EstadoCotizacion; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoCotizacion" AS ENUM (
    'PENDIENTE',
    'ACEPTADA',
    'RECHAZADA'
);


--
-- Name: EstadoHoraExtra; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoHoraExtra" AS ENUM (
    'EN_CURSO',
    'APROBADO',
    'PENDIENTE',
    'RECHAZADO'
);


--
-- Name: EstadoIncidente; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoIncidente" AS ENUM (
    'NUEVO',
    'EN_CURSO',
    'CERRADO'
);


--
-- Name: EstadoLlantas; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoLlantas" AS ENUM (
    'CORRECTO',
    'DESGASTE_SEVERO',
    'DANO'
);


--
-- Name: EstadoMaquina; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoMaquina" AS ENUM (
    'ENCENDIDA',
    'APAGADA',
    'MANTENIMIENTO',
    'MOVIMIENTO'
);


--
-- Name: EstadoObra; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoObra" AS ENUM (
    'RECIEN_INICIADA',
    'EN_PROCESO',
    'FINALIZADA'
);


--
-- Name: EstadoOrdenCompra; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoOrdenCompra" AS ENUM (
    'PENDIENTE',
    'APROBADA',
    'RECIBIDA',
    'CANCELADA'
);


--
-- Name: EstadoPermiso; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoPermiso" AS ENUM (
    'PENDIENTE',
    'APROBADO',
    'RECHAZADO'
);


--
-- Name: EstadoProyecto; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoProyecto" AS ENUM (
    'EN_PROCESO',
    'FINALIZADO',
    'PAUSADO'
);


--
-- Name: EstadoRenta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoRenta" AS ENUM (
    'RENTADO_CLIENTE',
    'EN_OBRA_PROPIA',
    'DISPONIBLE_PATIO'
);


--
-- Name: EstadoSistema; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoSistema" AS ENUM (
    'CORRECTO',
    'FALLA'
);


--
-- Name: EstadoTrabajador; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoTrabajador" AS ENUM (
    'ACTIVO',
    'INACTIVO',
    'VACACIONES'
);


--
-- Name: MetodoPago; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MetodoPago" AS ENUM (
    'TARJETA',
    'EFECTIVO',
    'MIXTO',
    'TRANSFERENCIA'
);


--
-- Name: NivelAceite; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NivelAceite" AS ENUM (
    'CORRECTO',
    'BAJO',
    'EXCESO'
);


--
-- Name: NivelBinario; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NivelBinario" AS ENUM (
    'CORRECTO',
    'BAJO'
);


--
-- Name: Prioridad; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Prioridad" AS ENUM (
    'BAJA',
    'MEDIA',
    'ALTA',
    'CRITICA'
);


--
-- Name: TipoDocumento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoDocumento" AS ENUM (
    'CONTRATO',
    'IDENTIFICACION',
    'FACTURA',
    'MANUAL',
    'PERMISO',
    'POLIZA'
);


--
-- Name: TipoMantenimiento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoMantenimiento" AS ENUM (
    'CORRECTIVO',
    'PREVENTIVO'
);


--
-- Name: TipoNotificacion; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoNotificacion" AS ENUM (
    'ALERTA',
    'INFO'
);


--
-- Name: TipoPermiso; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoPermiso" AS ENUM (
    'VACACIONES',
    'PERMISO',
    'INCAPACIDAD'
);


--
-- Name: TipoReporteCampo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoReporteCampo" AS ENUM (
    'MECANICO',
    'OPERADOR',
    'PIPERO',
    'CHECADOR',
    'INCIDENTE',
    'INGENIERO',
    'TRABAJADOR',
    'ADMINISTRATIVO',
    'SOLDADOR',
    'DIESEL',
    'MANTENIMIENTO',
    'RESIDENTE'
);


--
-- Name: TipoTransaccion; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoTransaccion" AS ENUM (
    'INGRESO',
    'EGRESO'
);


--
-- Name: Turno; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Turno" AS ENUM (
    'MATUTINO',
    'VESPERTINO'
);


--
-- Name: audit_immutable_guard(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_immutable_guard() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'La tabla registro_auditoria es inmutable. No se permiten UPDATE ni DELETE.';
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: alertas_gps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alertas_gps (
    id uuid NOT NULL,
    maquina_id uuid NOT NULL,
    tipo text NOT NULL,
    severidad text NOT NULL,
    lat numeric(9,6),
    lng numeric(9,6),
    fecha_hora timestamp with time zone NOT NULL,
    descripcion text,
    atendida boolean DEFAULT false NOT NULL,
    atendida_por uuid,
    atendida_en timestamp with time zone,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    CONSTRAINT chk_alertas_gps_severidad CHECK ((severidad = ANY (ARRAY['BAJA'::text, 'MEDIA'::text, 'ALTA'::text, 'CRITICA'::text]))),
    CONSTRAINT chk_alertas_gps_tipo CHECK ((tipo = ANY (ARRAY['EXCESO_VELOCIDAD'::text, 'ENTRADA_GEOCERCA'::text, 'SALIDA_GEOCERCA'::text, 'ENCENDIDO_FUERA_HORARIO'::text, 'APAGADO_INESPERADO'::text, 'SOS'::text, 'BATERIA_BAJA'::text])))
);


--
-- Name: aperturas_caja; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aperturas_caja (
    id uuid NOT NULL,
    fecha date NOT NULL,
    cajero text NOT NULL,
    fondo_inicial numeric(12,2) NOT NULL,
    abierta_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid
);


--
-- Name: apu_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apu_items (
    id uuid NOT NULL,
    apu_template_id uuid NOT NULL,
    categoria public."CategoriaApuItem" NOT NULL,
    nombre text NOT NULL,
    cantidad numeric(10,4) NOT NULL,
    costo_unitario numeric(12,2) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    unidad_id uuid NOT NULL
);


--
-- Name: apu_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apu_templates (
    id uuid NOT NULL,
    codigo text,
    nombre text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    unidad_id uuid NOT NULL
);


--
-- Name: articulos_inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articulos_inventario (
    id uuid NOT NULL,
    codigo text,
    nombre text NOT NULL,
    stock numeric(10,2) NOT NULL,
    stock_minimo numeric(10,2) NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    categoria_id uuid NOT NULL,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    proveedor_id uuid NOT NULL,
    unidad_id uuid NOT NULL
);


--
-- Name: articulos_precio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articulos_precio (
    id uuid NOT NULL,
    articulo_id uuid NOT NULL,
    medida text NOT NULL,
    precio numeric(12,2) NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: asistencias_semanales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asistencias_semanales (
    id uuid NOT NULL,
    trabajador_id uuid NOT NULL,
    semana text NOT NULL,
    total_dias_asistidos integer NOT NULL,
    total_faltas integer NOT NULL,
    total_retardos integer NOT NULL,
    total_horas_ordinarias numeric(6,2) NOT NULL,
    total_horas_extra numeric(6,2) NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone
);


--
-- Name: bancos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bancos (
    id uuid NOT NULL,
    nombre text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid
);


--
-- Name: bitacoras_operacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bitacoras_operacion (
    id uuid NOT NULL,
    maquina_id uuid NOT NULL,
    actividad text NOT NULL,
    horas numeric(6,2) NOT NULL,
    fecha date NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    codigo text,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    obra_id uuid,
    obra_texto text NOT NULL
);


--
-- Name: bitacoras_renta_diaria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bitacoras_renta_diaria (
    id uuid NOT NULL,
    folio text NOT NULL,
    trabajador_id uuid NOT NULL,
    maquina_id uuid NOT NULL,
    fecha date NOT NULL,
    cliente_id uuid NOT NULL,
    obra_ubicacion text NOT NULL,
    horas_efectivas numeric(6,2) NOT NULL,
    horas_extras numeric(6,2) DEFAULT 0 NOT NULL,
    horometro_inicial numeric(10,2) NOT NULL,
    horometro_final numeric(10,2) NOT NULL,
    actividad_realizada text NOT NULL,
    estado_cobro public."EstadoCobroBitacora" NOT NULL,
    tarifa_hora_renta numeric(10,2) NOT NULL,
    importe_total_renta numeric(12,2) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    obra_id uuid,
    hora_inicio time(0) without time zone NOT NULL,
    hora_fin time(0) without time zone NOT NULL,
    CONSTRAINT chk_horometro CHECK ((horometro_final >= horometro_inicial))
);


--
-- Name: cargas_combustible; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cargas_combustible (
    id uuid NOT NULL,
    codigo text,
    maquina_id uuid NOT NULL,
    fecha date NOT NULL,
    litros numeric(10,2) NOT NULL,
    costo numeric(12,2) NOT NULL,
    operador_id uuid,
    lugar text NOT NULL,
    horometro_actual numeric(10,2) NOT NULL,
    horas_trabajadas_periodo numeric(6,2) NOT NULL,
    consumo_esperado_lts_hora numeric(8,2) NOT NULL,
    rendimiento_lts_hora numeric(8,2) NOT NULL,
    alerta_ordena boolean DEFAULT false NOT NULL,
    desviacion_porcentaje numeric(6,2) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    CONSTRAINT chk_litros_positivos CHECK (((litros > (0)::numeric) AND (costo >= (0)::numeric)))
);


--
-- Name: categorias_inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_inventario (
    id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL
);


--
-- Name: categorias_puesto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_puesto (
    id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    salario_base_sugerido numeric(12,2),
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    torre public."CategoriaReporte",
    rol_id uuid
);


--
-- Name: checklists_preoperacionales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checklists_preoperacionales (
    id uuid NOT NULL,
    codigo text,
    maquina_id uuid NOT NULL,
    fecha date NOT NULL,
    operador_id uuid,
    horometro_inicial numeric(10,2) NOT NULL,
    nivel_aceite_motor public."NivelAceite" NOT NULL,
    nivel_hidraulico public."NivelBinario" NOT NULL,
    fugas_visibles boolean NOT NULL,
    estado_llantas_orugas public."EstadoLlantas" NOT NULL,
    luces_y_alarmas public."EstadoSistema" NOT NULL,
    sistema_frenos public."EstadoSistema" NOT NULL,
    estado public."EstadoChecklist" NOT NULL,
    observaciones text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    hora time(0) without time zone NOT NULL
);


--
-- Name: cierres_caja; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cierres_caja (
    id uuid NOT NULL,
    fecha date NOT NULL,
    cajero text NOT NULL,
    ventas_count integer NOT NULL,
    total_ventas numeric(12,2) NOT NULL,
    efectivo_inicial numeric(12,2) NOT NULL,
    ventas_efectivo numeric(12,2) NOT NULL,
    total_retiros numeric(12,2) NOT NULL,
    esperado numeric(12,2) NOT NULL,
    contado numeric(12,2) NOT NULL,
    diferencia numeric(12,2) NOT NULL,
    fondo_siguiente numeric(12,2) NOT NULL,
    notas text,
    denominaciones jsonb NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    estado text DEFAULT 'PENDIENTE'::text NOT NULL,
    aprobador_id uuid,
    motivo_rechazo text
);


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id uuid NOT NULL,
    codigo text,
    nombre text NOT NULL,
    empresa text,
    correo text NOT NULL,
    telefono text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    direccion_fiscal jsonb,
    eliminado_en timestamp with time zone,
    rfc text
);


--
-- Name: configuracion_sistema; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracion_sistema (
    clave character varying(100) NOT NULL,
    valor text NOT NULL,
    descripcion text,
    tipo character varying(20) DEFAULT 'string'::character varying NOT NULL,
    categoria character varying(50) DEFAULT 'general'::character varying NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    creado_por uuid,
    actualizado_por uuid
);


--
-- Name: contactos_emergencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contactos_emergencia (
    id uuid NOT NULL,
    trabajador_id uuid NOT NULL,
    nombre text NOT NULL,
    telefono text NOT NULL,
    parentesco text NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone
);


--
-- Name: cotizacion_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cotizacion_items (
    id uuid NOT NULL,
    cotizacion_id uuid NOT NULL,
    descripcion text NOT NULL,
    cantidad numeric(10,4) NOT NULL,
    unidad text NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    importe numeric(12,2) NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid
);


--
-- Name: cotizaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cotizaciones (
    id uuid NOT NULL,
    codigo text,
    cliente_id uuid NOT NULL,
    descripcion text NOT NULL,
    monto numeric(14,2) NOT NULL,
    fecha date NOT NULL,
    estado public."EstadoCotizacion" DEFAULT 'PENDIENTE'::public."EstadoCotizacion" NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    vendedor_id uuid,
    motivo_rechazo text,
    condiciones text
);


--
-- Name: cuentas_bancarias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuentas_bancarias (
    id uuid NOT NULL,
    banco_id uuid NOT NULL,
    numero text NOT NULL,
    nombre text,
    saldo_inicial numeric(14,2) DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid
);


--
-- Name: cuentas_por_cobrar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuentas_por_cobrar (
    id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    factura_id uuid,
    bitacora_id uuid,
    monto numeric(14,2) NOT NULL,
    monto_pagado numeric(14,2) DEFAULT 0 NOT NULL,
    fecha_vencimiento date,
    estado text DEFAULT 'PENDIENTE'::text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    proyecto_id uuid,
    CONSTRAINT chk_cxc_estado CHECK ((estado = ANY (ARRAY['PENDIENTE'::text, 'PARCIAL'::text, 'PAGADO'::text, 'VENCIDO'::text])))
);


--
-- Name: cuentas_por_pagar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuentas_por_pagar (
    id uuid NOT NULL,
    proveedor_id uuid NOT NULL,
    orden_compra_id uuid NOT NULL,
    monto numeric(14,2) NOT NULL,
    monto_pagado numeric(14,2) DEFAULT 0 NOT NULL,
    fecha_vencimiento date,
    estado text DEFAULT 'PENDIENTE'::text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL
);


--
-- Name: deducciones_nomina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deducciones_nomina (
    id uuid NOT NULL,
    nomina_id uuid NOT NULL,
    concepto text NOT NULL,
    tipo text NOT NULL,
    monto numeric(12,2) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL
);


--
-- Name: despachos_maquina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.despachos_maquina (
    id uuid NOT NULL,
    codigo text,
    maquina_id uuid NOT NULL,
    proyecto_id uuid NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    operador_id uuid,
    CONSTRAINT chk_despacho_fechas CHECK ((fecha_fin >= fecha_inicio))
);


--
-- Name: dias_asistencia_semana; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dias_asistencia_semana (
    id uuid NOT NULL,
    asistencia_semanal_id uuid NOT NULL,
    dia public."DiaSemana" NOT NULL,
    estado public."EstadoAsistenciaDia" NOT NULL,
    horas_trabajadas numeric(6,2) NOT NULL,
    horas_extra numeric(6,2),
    en_sitio_gps boolean NOT NULL,
    motivo text,
    activo boolean DEFAULT true NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    fecha date NOT NULL,
    hora_entrada time(0) without time zone,
    hora_salida time(0) without time zone,
    CONSTRAINT chk_horas_dia CHECK (((horas_trabajadas >= (0)::numeric) AND (COALESCE(horas_extra, (0)::numeric) >= (0)::numeric)))
);


--
-- Name: documento_etiquetas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documento_etiquetas (
    documento_id uuid NOT NULL,
    etiqueta_id uuid NOT NULL
);


--
-- Name: documento_versiones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documento_versiones (
    id uuid NOT NULL,
    documento_id uuid NOT NULL,
    numero_version integer NOT NULL,
    nombre_archivo text NOT NULL,
    url_archivo text NOT NULL,
    tamano_bytes bigint NOT NULL,
    hash_sha256 text,
    cambios text,
    subido_por uuid,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos (
    id uuid NOT NULL,
    nombre text NOT NULL,
    tipo public."TipoDocumento" NOT NULL,
    categoria public."CategoriaDocumento" NOT NULL,
    tamano_bytes bigint NOT NULL,
    propietario text NOT NULL,
    trabajador_id uuid,
    url_archivo text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    codigo text,
    actualizado_por uuid,
    descripcion text,
    eliminado_en timestamp with time zone,
    es_publico boolean DEFAULT false NOT NULL,
    estado text DEFAULT 'PUBLICADO'::text NOT NULL,
    extension text,
    fecha_documento date,
    fecha_vigencia date,
    firmado boolean DEFAULT false NOT NULL,
    formato text,
    hash_sha256 text,
    maquina_id uuid,
    mime_type text,
    nombre_almacenamiento text,
    palabras_clave text[],
    propietario_id uuid,
    propietario_tipo text,
    proveedor_id uuid,
    proyecto_id uuid,
    requiere_firma boolean DEFAULT false NOT NULL,
    subido_por uuid,
    url_thumbnail text,
    version_actual integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_documentos_estado CHECK ((estado = ANY (ARRAY['BORRADOR'::text, 'PUBLICADO'::text, 'ARCHIVADO'::text]))),
    CONSTRAINT chk_documentos_propietario_tipo CHECK (((propietario_tipo IS NULL) OR (propietario_tipo = ANY (ARRAY['TRABAJADOR'::text, 'MAQUINA'::text, 'PROYECTO'::text, 'PROVEEDOR'::text, 'CLIENTE'::text, 'GENERAL'::text]))))
);


--
-- Name: etiquetas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.etiquetas (
    id uuid NOT NULL,
    nombre text NOT NULL,
    color text DEFAULT '#64748b'::text NOT NULL,
    entidad text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL
);


--
-- Name: factura_conceptos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.factura_conceptos (
    id uuid NOT NULL,
    factura_id uuid NOT NULL,
    cantidad numeric(10,4) NOT NULL,
    unidad text NOT NULL,
    descripcion text NOT NULL,
    valor_unitario numeric(12,2) NOT NULL,
    importe numeric(12,2) NOT NULL,
    descuento numeric(12,2) DEFAULT 0 NOT NULL,
    objeto_impuesto text,
    impuesto_tasa numeric(6,4),
    impuesto_importe numeric(12,2),
    referencia_tipo text,
    referencia_id uuid,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: facturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facturas (
    id uuid NOT NULL,
    codigo text NOT NULL,
    serie text,
    folio text,
    uuid_cfdi text,
    cliente_id uuid NOT NULL,
    periodo_inicio date,
    periodo_fin date,
    subtotal numeric(14,2) DEFAULT 0 NOT NULL,
    impuestos numeric(14,2) DEFAULT 0 NOT NULL,
    total numeric(14,2) DEFAULT 0 NOT NULL,
    moneda text DEFAULT 'MXN'::text NOT NULL,
    tipo_cambio numeric(10,4) DEFAULT 1 NOT NULL,
    forma_pago text,
    metodo_pago text,
    uso_cfdi text,
    estado text DEFAULT 'PENDIENTE'::text NOT NULL,
    xml_url text,
    pdf_url text,
    timbrado_en timestamp with time zone,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone,
    cotizacion_id uuid,
    CONSTRAINT chk_facturas_estado CHECK ((estado = ANY (ARRAY['PENDIENTE'::text, 'TIMBRADA'::text, 'CANCELADA'::text, 'PAGADA'::text])))
);


--
-- Name: fallas_mecanicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fallas_mecanicas (
    id uuid NOT NULL,
    codigo text,
    maquina_id uuid NOT NULL,
    reporto_id uuid,
    diagnostico text NOT NULL,
    sistema_afectado text NOT NULL,
    severidad text NOT NULL,
    estado text DEFAULT 'PENDIENTE'::text NOT NULL,
    fecha_reporte timestamp with time zone NOT NULL,
    fecha_resolucion timestamp with time zone,
    costo_reparacion numeric(12,2),
    mantenimiento_id uuid,
    imagenes jsonb DEFAULT '[]'::jsonb NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone,
    CONSTRAINT chk_fallas_estado CHECK ((estado = ANY (ARRAY['PENDIENTE'::text, 'EN_DIAGNOSTICO'::text, 'EN_REPARACION'::text, 'REPARADA'::text, 'DESCARTADA'::text]))),
    CONSTRAINT chk_fallas_severidad CHECK ((severidad = ANY (ARRAY['LEVE'::text, 'MODERADA'::text, 'GRAVE'::text, 'CRITICA'::text]))),
    CONSTRAINT chk_fallas_sistema CHECK ((sistema_afectado = ANY (ARRAY['MOTOR'::text, 'TRANSMISION'::text, 'HIDRAULICO'::text, 'ELECTRICO'::text, 'NEUMATICO'::text, 'ESTRUCTURA'::text, 'OTRO'::text])))
);


--
-- Name: firmas_cliente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.firmas_cliente (
    id uuid NOT NULL,
    bitacora_id uuid NOT NULL,
    firmado boolean DEFAULT false NOT NULL,
    nombre_residente text,
    cargo_residente text,
    activo boolean DEFAULT true NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    archivo_firma text,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    fecha_firma timestamp with time zone
);


--
-- Name: firmas_digitales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.firmas_digitales (
    id uuid NOT NULL,
    documento_id uuid NOT NULL,
    firmado_por_tipo text NOT NULL,
    firmado_por_id uuid NOT NULL,
    nombre_firmante text NOT NULL,
    cargo_firmante text,
    correo_firmante text,
    hash_documento text,
    datos_firma jsonb,
    imagen_firma_url text,
    fecha_firma timestamp with time zone NOT NULL,
    ip_firma text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    CONSTRAINT chk_firmas_digitales_tipo CHECK ((firmado_por_tipo = ANY (ARRAY['CLIENTE'::text, 'TRABAJADOR'::text, 'USUARIO'::text])))
);


--
-- Name: geocerca_maquinas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geocerca_maquinas (
    id uuid NOT NULL,
    geocerca_id uuid NOT NULL,
    maquina_id uuid NOT NULL,
    dentro boolean DEFAULT false NOT NULL,
    ultima_entrada timestamp with time zone,
    ultima_salida timestamp with time zone
);


--
-- Name: geocercas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geocercas (
    id uuid NOT NULL,
    nombre text NOT NULL,
    tipo text NOT NULL,
    color text DEFAULT '#3b82f6'::text NOT NULL,
    centro_lat numeric(9,6) NOT NULL,
    centro_lng numeric(9,6) NOT NULL,
    radio_metros numeric(10,2) NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone,
    CONSTRAINT chk_geocercas_radio CHECK ((radio_metros > (0)::numeric)),
    CONSTRAINT chk_geocercas_tipo CHECK ((tipo = ANY (ARRAY['OBRA'::text, 'PATIO'::text, 'ESTACION'::text, 'RUTA'::text, 'PROHIBIDA'::text])))
);


--
-- Name: hitos_progreso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hitos_progreso (
    id uuid NOT NULL,
    proyecto_id uuid NOT NULL,
    planificado numeric(5,2) NOT NULL,
    "real" numeric(5,2) NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    descripcion text,
    eliminado_en timestamp with time zone,
    nombre text,
    periodo text NOT NULL,
    fecha date,
    CONSTRAINT chk_hito_porcentaje CHECK (((planificado >= (0)::numeric) AND (planificado <= (100)::numeric) AND ("real" >= (0)::numeric) AND ("real" <= (100)::numeric)))
);


--
-- Name: horas_extra_asistencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horas_extra_asistencia (
    id uuid NOT NULL,
    registro_asistencia_id uuid NOT NULL,
    horas_calculadas numeric(6,2) NOT NULL,
    tarifa_por_hora numeric(10,2) NOT NULL,
    monto_total numeric(12,2) NOT NULL,
    estado public."EstadoHoraExtra" DEFAULT 'PENDIENTE'::public."EstadoHoraExtra" NOT NULL,
    motivo text,
    lat_inicio numeric(9,6),
    lng_inicio numeric(9,6),
    lat_fin numeric(9,6),
    lng_fin numeric(9,6),
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    actualizado_por uuid,
    aprobador_id uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    inicio time(0) without time zone NOT NULL,
    fin time(0) without time zone
);


--
-- Name: intentos_login; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intentos_login (
    id uuid NOT NULL,
    user_id uuid,
    email_intentado text NOT NULL,
    exitoso boolean NOT NULL,
    motivo_fallo text,
    ip_address text,
    user_agent text,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: lecturas_horometro; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lecturas_horometro (
    id uuid NOT NULL,
    maquina_id uuid NOT NULL,
    fecha date NOT NULL,
    lectura_inicial numeric(10,2) NOT NULL,
    lectura_final numeric(10,2) NOT NULL,
    horas_trabajadas numeric(6,2) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    codigo text,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    operador_id uuid,
    CONSTRAINT chk_lectura_horometro CHECK ((lectura_final >= lectura_inicial))
);


--
-- Name: licencias_trabajador; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licencias_trabajador (
    id uuid NOT NULL,
    trabajador_id uuid NOT NULL,
    tipo text NOT NULL,
    folio text NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    actualizado_por uuid,
    archivo_url text,
    categoria public."CategoriaLicencia" NOT NULL,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    vigencia_indefinida boolean DEFAULT false NOT NULL,
    vigencia date
);


--
-- Name: maquina_componentes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maquina_componentes (
    id uuid NOT NULL,
    maquina_id uuid NOT NULL,
    nombre text NOT NULL,
    marca text,
    modelo text,
    numero_serie text,
    fecha_instalacion date,
    vida_util_horas numeric(10,2),
    horas_acumuladas numeric(10,2) DEFAULT 0 NOT NULL,
    estado text DEFAULT 'BUENO'::text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone,
    CONSTRAINT chk_maquina_componentes_estado CHECK ((estado = ANY (ARRAY['BUENO'::text, 'REGULAR'::text, 'MALO'::text])))
);


--
-- Name: maquina_operadores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maquina_operadores (
    id uuid NOT NULL,
    maquina_id uuid NOT NULL,
    trabajador_id uuid NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date,
    es_actual boolean DEFAULT true NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone
);


--
-- Name: maquinas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maquinas (
    id uuid NOT NULL,
    codigo text,
    nombre text NOT NULL,
    estado public."EstadoMaquina" DEFAULT 'APAGADA'::public."EstadoMaquina" NOT NULL,
    combustible numeric(5,2) DEFAULT 0 NOT NULL,
    horometro numeric(10,2) DEFAULT 0 NOT NULL,
    operador_id uuid,
    lat numeric(9,6) NOT NULL,
    lng numeric(9,6) NOT NULL,
    diesel_hoy numeric(10,2) DEFAULT 0 NOT NULL,
    proximo_mantenimiento date,
    imagen text,
    consumo_esperado_lts_hora numeric(8,2),
    rendimiento_actual_lts_hora numeric(8,2),
    alerta_consumo_anormal boolean DEFAULT false NOT NULL,
    horas_operadas_hoy numeric(6,2),
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    anio integer,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    modelo text,
    placas text,
    serie text,
    tipo_id uuid NOT NULL,
    CONSTRAINT chk_lat_lng CHECK (((lat >= ('-90'::integer)::numeric) AND (lat <= (90)::numeric) AND ((lng >= ('-180'::integer)::numeric) AND (lng <= (180)::numeric))))
);


--
-- Name: materiales_criba; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materiales_criba (
    id uuid NOT NULL,
    nombre text NOT NULL,
    articulo_id uuid,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL
);


--
-- Name: movimientos_bancarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimientos_bancarios (
    id uuid NOT NULL,
    cuenta_id uuid NOT NULL,
    fecha date NOT NULL,
    descripcion text NOT NULL,
    deposito numeric(14,2),
    retiro numeric(14,2),
    conciliado boolean DEFAULT false NOT NULL,
    transaccion_id uuid,
    conciliado_en timestamp with time zone,
    conciliado_por uuid,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid
);


--
-- Name: movimientos_inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimientos_inventario (
    id uuid NOT NULL,
    articulo_id uuid NOT NULL,
    tipo text NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    stock_resultante numeric(10,2) NOT NULL,
    referencia_tipo text,
    referencia_id uuid,
    motivo text,
    fecha timestamp with time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por uuid,
    CONSTRAINT chk_movimientos_tipo CHECK ((tipo = ANY (ARRAY['ENTRADA'::text, 'SALIDA'::text, 'AJUSTE'::text, 'DEVOLUCION'::text])))
);


--
-- Name: niveles_bloqueo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.niveles_bloqueo (
    id uuid NOT NULL,
    nivel integer NOT NULL,
    duracion_minutos integer NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    CONSTRAINT chk_niveles_bloqueo_duracion CHECK ((duracion_minutos > 0))
);


--
-- Name: nominas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nominas (
    id uuid NOT NULL,
    periodo_id uuid NOT NULL,
    trabajador_id uuid NOT NULL,
    dias_trabajados integer DEFAULT 0 NOT NULL,
    dias_faltas integer DEFAULT 0 NOT NULL,
    horas_ordinarias numeric(6,2) DEFAULT 0 NOT NULL,
    horas_extra numeric(6,2) DEFAULT 0 NOT NULL,
    sueldo_fiscal numeric(12,2) DEFAULT 0 NOT NULL,
    sueldo_efectivo numeric(12,2) DEFAULT 0 NOT NULL,
    total_percepciones numeric(12,2) DEFAULT 0 NOT NULL,
    total_deducciones numeric(12,2) DEFAULT 0 NOT NULL,
    total_neto numeric(12,2) DEFAULT 0 NOT NULL,
    metodo_pago public."MetodoPago",
    estado text DEFAULT 'PENDIENTE'::text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone,
    CONSTRAINT chk_nominas_estado CHECK ((estado = ANY (ARRAY['PENDIENTE'::text, 'PAGADA'::text, 'CANCELADA'::text])))
);


--
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificaciones (
    id uuid NOT NULL,
    tipo public."TipoNotificacion" DEFAULT 'INFO'::public."TipoNotificacion" NOT NULL,
    titulo character varying(200) NOT NULL,
    cuerpo text NOT NULL,
    referencia_tipo text,
    referencia_id uuid,
    audiencia_rol_id uuid,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por uuid,
    audiencia_torre public."CategoriaReporte",
    destinatario_user_id uuid
);


--
-- Name: notificaciones_lecturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificaciones_lecturas (
    notificacion_id uuid NOT NULL,
    user_id uuid NOT NULL,
    leido_en timestamp with time zone,
    descartada boolean DEFAULT false NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: obras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.obras (
    id uuid NOT NULL,
    codigo text,
    nombre text NOT NULL,
    proyecto_id uuid,
    ubicacion text,
    lat numeric(9,6),
    lng numeric(9,6),
    radio_permitido_metros numeric(10,2),
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone,
    estado public."EstadoObra" DEFAULT 'EN_PROCESO'::public."EstadoObra" NOT NULL
);


--
-- Name: ordenes_compra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ordenes_compra (
    id uuid NOT NULL,
    folio text NOT NULL,
    proveedor_id uuid NOT NULL,
    descripcion text NOT NULL,
    monto numeric(14,2) NOT NULL,
    pagado numeric(14,2) DEFAULT 0 NOT NULL,
    fecha date NOT NULL,
    estado public."EstadoOrdenCompra" DEFAULT 'PENDIENTE'::public."EstadoOrdenCompra" NOT NULL,
    motivo_cancelacion text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone,
    fecha_vencimiento date
);


--
-- Name: ordenes_compra_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ordenes_compra_items (
    id uuid NOT NULL,
    orden_compra_id uuid NOT NULL,
    articulo_id uuid,
    nombre text NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    cantidad_recibida numeric(10,2) DEFAULT 0 NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone
);


--
-- Name: pagos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagos (
    id uuid NOT NULL,
    codigo text NOT NULL,
    cliente_id uuid NOT NULL,
    factura_id uuid,
    monto numeric(14,2) NOT NULL,
    fecha_pago date NOT NULL,
    metodo_pago text NOT NULL,
    referencia text,
    banco text,
    cuenta_destino text,
    comprobante_url text,
    estado text DEFAULT 'PENDIENTE'::text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone,
    cuenta_por_cobrar_id uuid,
    CONSTRAINT chk_pagos_estado CHECK ((estado = ANY (ARRAY['PENDIENTE'::text, 'CONFIRMADO'::text, 'RECHAZADO'::text])))
);


--
-- Name: pagos_proveedor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagos_proveedor (
    id uuid NOT NULL,
    codigo text NOT NULL,
    proveedor_id uuid NOT NULL,
    orden_compra_id uuid NOT NULL,
    monto numeric(14,2) NOT NULL,
    fecha_pago date NOT NULL,
    metodo_pago text DEFAULT 'EFECTIVO'::text NOT NULL,
    referencia text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por uuid,
    eliminado_en timestamp with time zone
);


--
-- Name: percepciones_nomina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.percepciones_nomina (
    id uuid NOT NULL,
    nomina_id uuid NOT NULL,
    concepto text NOT NULL,
    tipo text NOT NULL,
    monto numeric(12,2) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL
);


--
-- Name: periodos_nomina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.periodos_nomina (
    id uuid NOT NULL,
    codigo text NOT NULL,
    nombre text NOT NULL,
    tipo text NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    fecha_pago date,
    estado text DEFAULT 'ABIERTO'::text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone,
    CONSTRAINT chk_periodos_nomina_estado CHECK ((estado = ANY (ARRAY['ABIERTO'::text, 'CERRADO'::text, 'PAGADO'::text]))),
    CONSTRAINT chk_periodos_nomina_tipo CHECK ((tipo = ANY (ARRAY['SEMANAL'::text, 'QUINCENAL'::text, 'MENSUAL'::text])))
);


--
-- Name: permisos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permisos (
    id uuid NOT NULL,
    trabajador_id uuid NOT NULL,
    tipo public."TipoPermiso" NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    estado public."EstadoPermiso" DEFAULT 'PENDIENTE'::public."EstadoPermiso" NOT NULL,
    motivo text NOT NULL,
    dias_solicitados integer NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    codigo text,
    actualizado_por uuid,
    aprobador_id uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    modulo text NOT NULL,
    recurso text NOT NULL,
    accion text NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL
);


--
-- Name: personas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personas (
    id uuid NOT NULL,
    nombre text NOT NULL,
    apellido_paterno text,
    apellido_materno text,
    rfc text,
    curp text,
    correo text,
    telefono text,
    fecha_nacimiento date,
    genero text,
    direccion jsonb,
    avatar_url text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone
);


--
-- Name: proveedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proveedores (
    id uuid NOT NULL,
    codigo text,
    nombre text NOT NULL,
    rfc text,
    correo text,
    telefono text,
    direccion jsonb,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone,
    categoria text DEFAULT 'Otros'::text
);


--
-- Name: proyectos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proyectos (
    id uuid NOT NULL,
    codigo text,
    nombre text NOT NULL,
    cliente_id uuid NOT NULL,
    presupuesto numeric(14,2) NOT NULL,
    progreso numeric(5,2) DEFAULT 0 NOT NULL,
    estado public."EstadoProyecto" DEFAULT 'EN_PROCESO'::public."EstadoProyecto" NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    ingreso_cobrado numeric(14,2) DEFAULT 0 NOT NULL,
    gastado numeric(14,2) DEFAULT 0 NOT NULL,
    calle text,
    colonia text,
    ciudad text,
    estado_ubicacion text,
    codigo_postal character varying(10),
    municipio text,
    CONSTRAINT chk_proyecto_fechas CHECK ((fecha_fin >= fecha_inicio)),
    CONSTRAINT chk_proyecto_progreso CHECK (((progreso >= (0)::numeric) AND (progreso <= (100)::numeric)))
);


--
-- Name: rastreo_gps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rastreo_gps (
    id uuid NOT NULL,
    maquina_id uuid NOT NULL,
    fecha_hora timestamp with time zone NOT NULL,
    lat numeric(9,6) NOT NULL,
    lng numeric(9,6) NOT NULL,
    altitud numeric(8,2),
    velocidad_kmh numeric(5,2),
    heading numeric(5,2),
    precision_metros numeric(6,2),
    ignition boolean,
    odometro numeric(10,2),
    horometro numeric(10,2),
    proveedor_gps text DEFAULT 'SVR-GPS'::text NOT NULL,
    dispositivo_id text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por uuid,
    temperatura_motor numeric(5,2)
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    jti uuid NOT NULL,
    token_hash text NOT NULL,
    emitido_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expira_en timestamp with time zone NOT NULL,
    usado_en timestamp with time zone,
    reemplazado_por uuid,
    revocado_en timestamp with time zone,
    motivo_revocado text,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: registro_auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registro_auditoria (
    event_id uuid NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actor_user_id uuid,
    actor_role text NOT NULL,
    actor_type public."ActorType" NOT NULL,
    action public."AuditAction" NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    result public."AuditResult" NOT NULL,
    severity public."AuditSeverity" DEFAULT 'INFO'::public."AuditSeverity" NOT NULL,
    ip_address text DEFAULT 'unknown'::text NOT NULL,
    user_agent text DEFAULT 'unknown'::text NOT NULL,
    session_id uuid,
    request_id uuid NOT NULL,
    correlation_id uuid NOT NULL,
    error_code text,
    previous_value jsonb,
    new_value jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: registros_asistencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros_asistencia (
    id uuid NOT NULL,
    codigo text,
    trabajador_id uuid NOT NULL,
    fecha date NOT NULL,
    estado public."EstadoAsistencia" NOT NULL,
    ubicacion text NOT NULL,
    lat_entrada numeric(9,6) NOT NULL,
    lng_entrada numeric(9,6) NOT NULL,
    lat_salida numeric(9,6),
    lng_salida numeric(9,6),
    salida_ubicacion text,
    obra_asignada text NOT NULL,
    lat_obra numeric(9,6) NOT NULL,
    lng_obra numeric(9,6) NOT NULL,
    distancia_metros numeric(10,2) NOT NULL,
    radio_permitido_metros numeric(10,2) NOT NULL,
    en_sitio boolean NOT NULL,
    precision_gps_metros numeric(8,2) NOT NULL,
    dispositivo text NOT NULL,
    horas_trabajadas_ordinarias numeric(6,2),
    salida_anticipada boolean DEFAULT false NOT NULL,
    motivo_salida_anticipada text,
    bateria integer,
    notas text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    obra_id uuid,
    hora_entrada time(0) without time zone,
    hora_salida time(0) without time zone,
    hora_marcaje_exacta time(0) without time zone,
    hora_salida_exacta time(0) without time zone,
    omision_motivo text,
    omision_resuelta_en timestamp with time zone,
    omision_resuelta_por uuid
);


--
-- Name: registros_criba; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros_criba (
    id uuid NOT NULL,
    codigo text,
    fecha date NOT NULL,
    turno public."Turno" NOT NULL,
    operador_id uuid,
    tipo_material text NOT NULL,
    material_producido numeric(10,2) NOT NULL,
    horas_trabajadas numeric(6,2) NOT NULL,
    material_al_banco numeric(10,2) NOT NULL,
    observaciones text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    maquina_id uuid,
    proyecto_id uuid,
    material_criba_id uuid,
    inventario_en timestamp with time zone
);


--
-- Name: registros_mantenimiento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros_mantenimiento (
    id uuid NOT NULL,
    codigo text,
    maquina_id uuid NOT NULL,
    tipo public."TipoMantenimiento" NOT NULL,
    descripcion text NOT NULL,
    fecha date NOT NULL,
    horas_servicio numeric(10,2) NOT NULL,
    costo numeric(12,2) NOT NULL,
    proximo_servicio_horas numeric(10,2) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    mecanico_id uuid,
    refacciones_usadas jsonb
);


--
-- Name: reportes_actividades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reportes_actividades (
    id uuid NOT NULL,
    reporte_id uuid NOT NULL,
    texto text NOT NULL,
    autor_nombre text NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: reportes_adjuntos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reportes_adjuntos (
    id uuid NOT NULL,
    reporte_id uuid NOT NULL,
    nombre text NOT NULL,
    mime text NOT NULL,
    tamano integer NOT NULL,
    datos text NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: reportes_campo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reportes_campo (
    id uuid NOT NULL,
    codigo text,
    tipo public."TipoReporteCampo" NOT NULL,
    usuario text NOT NULL,
    maquina_id uuid,
    fecha date NOT NULL,
    descripcion text NOT NULL,
    estado public."EstadoIncidente" DEFAULT 'NUEVO'::public."EstadoIncidente" NOT NULL,
    prioridad public."Prioridad",
    detalles jsonb,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    obra_id uuid,
    obra_texto text NOT NULL,
    usuario_id uuid,
    hora time(0) without time zone NOT NULL,
    asignado_a_id uuid,
    asignado_en timestamp with time zone,
    asignado_nombre text,
    cerrado_en timestamp with time zone,
    categoria public."CategoriaReporte",
    latitud numeric(10,7),
    longitud numeric(10,7),
    subcategoria_id uuid,
    proyecto_id uuid,
    asignado_user_id uuid
);


--
-- Name: retiros_caja; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.retiros_caja (
    id uuid NOT NULL,
    concepto text NOT NULL,
    monto numeric(12,2) NOT NULL,
    autorizado_por text NOT NULL,
    cajero text NOT NULL,
    fecha date NOT NULL,
    hora text NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    eliminado_en timestamp with time zone
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    rol_id uuid NOT NULL,
    permiso_id uuid NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: role_vistas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_vistas (
    id uuid NOT NULL,
    rol_id uuid NOT NULL,
    vista_id uuid NOT NULL,
    puede_ver boolean DEFAULT true NOT NULL,
    puede_crear boolean DEFAULT false NOT NULL,
    puede_editar boolean DEFAULT false NOT NULL,
    puede_eliminar boolean DEFAULT false NOT NULL,
    puede_exportar boolean DEFAULT false NOT NULL,
    asignado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    asignado_por uuid,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    nivel integer DEFAULT 0 NOT NULL,
    es_sistema boolean DEFAULT false NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone,
    torre public."CategoriaReporte"
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    refresh_token_jti uuid NOT NULL,
    ip_address text,
    user_agent text,
    dispositivo text,
    ubicacion text,
    iniciada_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ultima_actividad timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expira_en timestamp with time zone NOT NULL,
    cerrada_en timestamp with time zone,
    motivo_cierre text,
    activa boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL
);


--
-- Name: subcategorias_reporte; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subcategorias_reporte (
    id uuid NOT NULL,
    categoria public."CategoriaReporte" NOT NULL,
    nombre text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tipos_maquina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_maquina (
    id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL
);


--
-- Name: token_blacklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_blacklist (
    id uuid NOT NULL,
    jti uuid NOT NULL,
    token_hash text NOT NULL,
    tipo text NOT NULL,
    user_id uuid,
    razon text NOT NULL,
    expira_en timestamp with time zone NOT NULL,
    agregado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_token_blacklist_tipo CHECK ((tipo = ANY (ARRAY['ACCESS'::text, 'REFRESH'::text])))
);


--
-- Name: trabajadores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trabajadores (
    id uuid NOT NULL,
    codigo text,
    nombre text NOT NULL,
    puesto text NOT NULL,
    estado public."EstadoTrabajador" DEFAULT 'ACTIVO'::public."EstadoTrabajador" NOT NULL,
    telefono text NOT NULL,
    avatar text NOT NULL,
    sueldo_fiscal numeric(12,2) NOT NULL,
    sueldo_efectivo numeric(12,2) NOT NULL,
    metodo_pago public."MetodoPago" NOT NULL,
    estado_renta public."EstadoRenta",
    cliente_renta_actual_id uuid,
    fecha_contratacion date,
    vacaciones_dias integer,
    horas_extra_semana numeric(6,2),
    tarifa_hora_extra numeric(10,2),
    descuentos_semana numeric(10,2),
    concepto_descuento text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    categoria_puesto_id uuid NOT NULL,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    entrada time(0) without time zone NOT NULL,
    usuario_id uuid,
    CONSTRAINT chk_sueldos CHECK (((sueldo_fiscal >= (0)::numeric) AND (sueldo_efectivo >= (0)::numeric)))
);


--
-- Name: trabajadores_proyectos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trabajadores_proyectos (
    trabajador_id uuid NOT NULL,
    proyecto_id uuid NOT NULL,
    asignado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone
);


--
-- Name: transacciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transacciones (
    id uuid NOT NULL,
    codigo text,
    tipo public."TipoTransaccion" NOT NULL,
    categoria text NOT NULL,
    monto numeric(14,2) NOT NULL,
    fecha date NOT NULL,
    descripcion text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    entidad_id uuid,
    entidad_tipo text,
    otra_categoria text,
    CONSTRAINT chk_monto_positivo CHECK ((monto >= (0)::numeric))
);


--
-- Name: unidades_medida; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unidades_medida (
    id uuid NOT NULL,
    codigo text NOT NULL,
    nombre text NOT NULL,
    categoria text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    persona_id uuid NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    email_verificado boolean DEFAULT false NOT NULL,
    telefono_verificado boolean DEFAULT false NOT NULL,
    factor_doble_habilitado boolean DEFAULT false NOT NULL,
    ultimo_login timestamp with time zone,
    preferencias jsonb DEFAULT '{}'::jsonb NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone,
    torre public."CategoriaReporte",
    jefe_user_id uuid,
    numero_empleado text,
    pin_hash text,
    pin_temporal_hasta timestamp with time zone,
    pin_cambiado_en timestamp with time zone,
    pin_historial jsonb DEFAULT '[]'::jsonb,
    intentos_pin integer DEFAULT 0,
    cuenta_bloqueada_en timestamp with time zone
);


--
-- Name: users_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users_roles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    rol_id uuid NOT NULL,
    es_principal boolean DEFAULT false NOT NULL,
    asignado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    asignado_por uuid,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: usuarios_bloqueados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios_bloqueados (
    id uuid NOT NULL,
    user_id uuid,
    nivel_id uuid,
    nivel_numero integer NOT NULL,
    intentos_fallidos_consecutivos integer NOT NULL,
    bloqueado_desde timestamp with time zone NOT NULL,
    bloqueado_hasta timestamp with time zone NOT NULL,
    desbloqueado_en timestamp with time zone,
    desbloqueado_manualmente_por uuid,
    motivo text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    ip_address text,
    CONSTRAINT chk_usuarios_bloqueados_fechas CHECK ((bloqueado_hasta >= bloqueado_desde))
);


--
-- Name: ventas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ventas (
    id uuid NOT NULL,
    folio text NOT NULL,
    ticket integer NOT NULL,
    terminal text DEFAULT 'TER-01'::text NOT NULL,
    caja text DEFAULT 'CAJA-PV'::text NOT NULL,
    cliente text DEFAULT 'Público en general'::text NOT NULL,
    cajero text NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    iva numeric(12,2) NOT NULL,
    ieps numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) NOT NULL,
    metodo public."MetodoPago" NOT NULL,
    efectivo_recibido numeric(12,2),
    cambio numeric(12,2),
    descuento_pct numeric(5,2),
    descuento_total numeric(12,2),
    autorizado_por text,
    items_count integer NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    eliminado_en timestamp with time zone,
    idempotencia_key text,
    cliente_id uuid
);


--
-- Name: ventas_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ventas_items (
    id uuid NOT NULL,
    venta_id uuid NOT NULL,
    articulo_id uuid CONSTRAINT ventas_items_material_id_not_null NOT NULL,
    nombre text NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    medida text NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    descuento_pct numeric(5,2),
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ventas_pagos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ventas_pagos (
    id uuid NOT NULL,
    venta_id uuid NOT NULL,
    metodo public."MetodoPago" NOT NULL,
    monto numeric(12,2) NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: vistas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vistas (
    id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    ruta text NOT NULL,
    icono text,
    orden integer DEFAULT 0 NOT NULL,
    vista_padre_id uuid,
    es_menu boolean DEFAULT true NOT NULL,
    es_visible boolean DEFAULT true NOT NULL,
    requiere_auth boolean DEFAULT true NOT NULL,
    target text DEFAULT '_self'::text NOT NULL,
    badges jsonb DEFAULT '[]'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp with time zone
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
dd745ced-e443-4a6f-b7f2-57004dc07aa4	c53efe545d3a6e0dbb431cdcf929cbd6e2ca0b9dc1cab93b3eaa3bfedb2a318a	2026-11-03 18:53:54.267731-06	20260911000000_cierres_caja_aprobacion	\N	\N	2026-11-03 18:53:54.264039-06	1
c0e5f0da-a431-43c7-8faf-8a49bc33d221	378953d28761c32e8cb296f73010bd514825cf283dd7dcb18b858b45d4d300a5	2026-11-03 18:53:53.955889-06	20260905000001_cotizaciones_motivo_rechazo	\N	\N	2026-11-03 18:53:53.942707-06	1
ea2f3468-ff99-4a63-9ae3-1d0a2a24c1ba	bb7af60ea45feff879aaefe082ba260307859b4be3944c417718a8089176acf5	2026-11-03 18:53:54.16964-06	20260908000000_seed_ventas_pos	\N	\N	2026-11-03 18:53:54.161119-06	1
6ba38f24-2ed1-4bd1-b381-428d51b90353	31773f9a0c5bfa9ac423b38a138cf0c1ad22b3f0a4e7191606fc02bdb35787fa	2026-11-03 18:53:53.973637-06	20260906000000_ventas_corte_vista	\N	\N	2026-11-03 18:53:53.956933-06	1
50afb569-d4dc-4851-bbd3-a73efae68ded	6f7ed401d647f32598cee59937d24cd2bd96694320deca0cf245b3c641535a1d	2026-11-03 18:53:54.160269-06	20260907000000_ventas_pos	\N	\N	2026-11-03 18:53:53.97472-06	1
5cc0486c-8c37-492d-9780-8ca54534d438	6da29e69c1e5b04bba5c55a82c37224e003b37e29bece3f5ff22d42e41da961b	2026-11-03 18:53:54.263062-06	20260910000000_aperturas_caja	\N	\N	2026-11-03 18:53:54.247164-06	1
db31085d-f1b4-47de-863f-c96b7e5a7030	1b2a5d8467f7de3d268df4510427a222c1132cc411bd98579b3f0b5267d74a93	2026-11-03 18:53:54.246107-06	20260909000000_unificar_ventas_inventario	\N	\N	2026-11-03 18:53:54.170632-06	1
5e58d39d-3c16-4fd0-92b7-d275b559d901	19ebf1d7da4b55f022cd3052f4ab02061e279cf523eb19829d053d84140be8ce	2026-11-03 18:53:54.287011-06	20260913000000_configuracion_sistema	\N	\N	2026-11-03 18:53:54.268511-06	1
6c0a4d19-0436-49fe-a148-2062c111e501	5a2c58038bbe73c5f9f0d951c98e7d2bc8ab21d1142aa0e04eefdfe19e134408	2026-11-03 18:53:54.290697-06	20260914000000_eliminar_tolerancia_turno	\N	\N	2026-11-03 18:53:54.287808-06	1
3f427d93-6cb7-43f3-b6f2-f617180824cf	8d46804c4080057c4cb7a63ce4bd1b5f958371d7f0eccbc36a6d618c85b6c71b	2026-11-03 18:53:54.297483-06	20260915000000_add_venta_idempotencia_key	\N	\N	2026-11-03 18:53:54.291633-06	1
0b696c22-c19d-4e6b-8e7b-5d8c3a437fb1	8537648b5004f6f7344293898ffd7e5775fc0a81c13a13006a665acbb8c2b7d0	2026-11-03 18:53:54.300696-06	20260916000000_add_audit_config_turno	\N	\N	2026-11-03 18:53:54.298309-06	1
632822a9-556f-4721-9adf-0ad75b477e19	18626634cfd6db6c294f849d659df980c69d33cb22c949ca949a93b78f90a422	2026-11-03 18:53:54.399672-06	20260917000000_proveedores_ordenes_compra	\N	\N	2026-11-03 18:53:54.301554-06	1
1c790fa7-fcd8-4ead-a81a-6a23c82dde14	bb3e92493d0dd9f5818453444a59f9025f93ca7b96898380a3e3c2f01cd8ad33	2026-11-03 18:53:54.689785-06	20260930000000_ordenes_compra_items_recepcion	\N	\N	2026-11-03 18:53:54.662918-06	1
8054d001-9696-4fcb-af58-85b00c66e33b	155938ea1d100c179e0691f3872f28a84adbe1a725b488acafbc9aa48f4aa6bb	2026-11-03 18:53:54.409446-06	20260918000000_proveedores_rfc_unique_y_consultado	\N	\N	2026-11-03 18:53:54.400656-06	1
2dfd5cda-8030-4dbe-8ad0-0dae0520fdae	4ed09edd9cf7d17a5b4c6874ec967aff4720bff308f8f4330b48fa874667a600	2026-11-03 18:53:54.428937-06	20260919000000_cobranza_pagos	\N	\N	2026-11-03 18:53:54.410568-06	1
14a6a5d7-e473-4651-8bcc-87efd15ef946	8bc44931ff16f94729b4554acc7951dc51804b6c636db0182eae91149213cf6d	2026-11-03 18:53:54.480534-06	20260920000000_facturas_cotizacion_link	\N	\N	2026-11-03 18:53:54.429775-06	1
897271c7-2bfd-4b43-a0f2-e34dd1f3dcce	4449884b17c9e0cdac998a65e1acb26ddae5384e1eb2e2e4ba12e7c4ca0d4755	2026-11-03 18:53:54.498403-06	20260921000000_cxc_proyecto_link	\N	\N	2026-11-03 18:53:54.481498-06	1
e67fde68-bd0c-4901-a86a-ff69ad13288b	015f39dc41f8ea32695fd0157c256eced828e4a58dac0e38fd90643424452777	2026-11-03 18:53:54.501836-06	20260922000000_cobro_revertido	\N	\N	2026-11-03 18:53:54.499308-06	1
3e404245-9fde-4f8f-aa94-a890bffeab07	86d82b8af9b9958837fd975044868748cdb54347cac364d8325e7996f752e71f	2026-11-03 18:53:54.533664-06	20260923000000_reporte_campo_facturado	\N	\N	2026-11-03 18:53:54.502757-06	1
780af6c2-c384-4db7-b416-b0192e77c7d7	0759e3a8c92bc3deb00bb91f7e8926fa436ec93cafb90de2a37f24a38638a654	2026-11-03 18:53:54.615485-06	20260924000000_conciliacion_bancaria	\N	\N	2026-11-03 18:53:54.534515-06	1
6bf105a0-098f-45f3-a335-e8f572f9a2ee	c89a2b07a44eb813b918de9f9f3e7aedb5b573b8d907ca71a8c371f8345d8774	2026-11-03 18:53:54.6264-06	20260925120000_movimientos_bancarios_dedupe_idempotente	\N	\N	2026-11-03 18:53:54.616293-06	1
cbabe1c6-f195-4faf-aa25-c2ad9e90069b	1b8d02533dda243f4a5892c2eb77e38d8ab05985d8913850939d50495ef490d7	2026-11-03 18:53:54.63613-06	20260926000000_facturas_cotizacion_id_unico	\N	\N	2026-11-03 18:53:54.627359-06	1
65ac43d5-96c0-431f-8aac-a2d050b60389	c88a37f6db18a10f48ddd7db3dde6289a6b991deeec46925c9715132ed9fc3ca	2026-11-03 18:53:54.645322-06	20260927000000_movimientos_bancarios_transaccion_id_unico	\N	\N	2026-11-03 18:53:54.637068-06	1
38da7639-b8b2-4eb8-8ba9-a5fc3e306054	2a6bd026cd954e11214e5a16b8b07770c36eafef3bff64ee9ec0a28fe9ca2013	2026-11-08 14:06:15.742411-06	20261108000000_fix_uuids_categorias_unidades	\N	\N	2026-11-08 14:06:15.712707-06	1
11ffc4a8-687b-4d63-8710-b36cae2ef3f3	3e83559e35a9579635c26573242707406ee61bbc21b40542ad550e7603a76219	2026-11-03 18:53:54.658253-06	20260928000000_facturas_serie_folio_unique	\N	\N	2026-11-03 18:53:54.646223-06	1
31d9dd0a-028c-4dc3-a8ef-4ce1e54e2d4e	59f14f22df318457ba86e05f23129f9a5538a1bad58048b70fda5a8c6adbd6bd	2026-11-03 18:53:54.662043-06	20260929000000_transaccion_exportada	\N	\N	2026-11-03 18:53:54.659378-06	1
9249357d-1d49-41c4-b0a0-043f676c89e6	a89dce4d1939e3261321e4bafb4842ae6ed05dae7b290953686f2a22d59d397d	2026-11-10 20:25:24.214537-06	20261111120000_pwa_identidad_pin	\N	\N	2026-11-10 20:25:24.153269-06	1
716ea6ea-ec71-48b9-b196-7dcd8cc8fab2	a4af0e746549a986d2f240d384b97b0213218f01f043d2b44e08ea1d9918ae57	2026-11-08 15:18:29.579608-06	20261108100000_folio_inc_y_categoria_reportes	\N	\N	2026-11-08 15:18:29.502625-06	1
87609b8c-65a2-441e-b35d-47bdcb2bcdab	1a40a45e076ed44ef6b5020cd658b9a880039b5a46f3187d46e379a7e105a000	2026-11-10 20:25:24.250067-06	20261111130000_pwa_vistas_rbac	\N	\N	2026-11-10 20:25:24.215732-06	1
0629175d-fdec-454b-be6d-d128ef340de5	4fd56f39dd5fbbdad206150178e8480771fc7ab0f40785bf6a68134fbc7c38a5	2026-11-08 16:13:21.344695-06	20261108153000_flujo_incidentes_v2	\N	\N	2026-11-08 16:13:21.210649-06	1
dfb57b60-f125-4fde-a3d3-d66d1713295a	ff954c7a4a7d990de57d2cf02367174cef1795ebbdf38d160a860e2a93dba06b	2026-11-08 16:16:16.701752-06	20261108153100_reporte_subcategoria_fk	\N	\N	2026-11-08 16:16:16.684643-06	1
68cdabcb-2544-4309-a138-885a8153b5aa	60dd711f1fce6686fe4005f7fb0659e090820219d4cdb188c7661a5ed4b8173b	2026-11-10 21:25:09.803312-06	20261111140000_pwa_pin_audit_actions	\N	\N	2026-11-10 21:25:09.769301-06	1
81f77ff2-8d76-4d7b-937b-b17544ebfa27	f5092474d58d338a4cf6e1301c6b6d6dfbfceeb68261bbe6e563100f7678a2d3	2026-11-08 18:03:46.891558-06	20261108170000_users_torre	\N	\N	2026-11-08 18:03:46.863313-06	1
e8ac1fc1-f8bd-4a5b-b8ce-cc991ddae77a	d135fb93f3b2b045b8c51a2b1d284cc12c9fe996c156352321a70bc9a1c65441	2026-11-08 18:57:26.586659-06	20261108180000_roles_plantilla_y_usuarios	\N	\N	2026-11-08 18:57:26.546611-06	1
a7d8eb2c-35db-4d99-8542-cbc6ef39dc8a	a9096fc82e8af63fc408b4b6865daaa036d45cfef73781d444f19cead28ee150	2026-11-10 22:26:13.457856-06	20261111150000_pwa_seed_identidad_demo	\N	\N	2026-11-10 22:26:13.414051-06	1
6356c55f-84d6-4f42-82c2-2273664a14c9	93e6fd3629b53e729a154cbd4de858b0556c2bfc04a2ff3e08da0c3684a73be2	2026-11-08 19:48:41.284146-06	20261108190000_enum_por_torre_y_accesos_cobrador	\N	\N	2026-11-08 19:48:41.262516-06	1
9735e1a9-5620-4a0a-8127-79b8bc20e954	45be3a8fbe7b72b9e835ec4e8f80cd62ad7b8a892b3a5a1d65b714102e6f56dc	2026-11-08 20:12:06.123959-06	20261108200000_reporte_ubicacion_proyecto_gps	\N	\N	2026-11-08 20:12:06.077017-06	1
ac0e5a82-1550-4754-9aeb-71532992c838	5ef3dea4b853120769f04a66bc69042f9dd3cdbf0fbacd176ecf625a245edf5a	2026-11-08 21:53:13.65065-06	20261108210000_telefonos_demo_personas	\N	\N	2026-11-08 21:53:13.623088-06	1
980c6c13-8574-4c91-b37d-fe541322cd0b	508a89fba09b48763c75bff6335d333545ccfe9868f793215a4c3ae6839c05e4	2026-11-09 03:01:24.038994-06	20261109010000_equipo_residente_demo	\N	\N	2026-11-09 03:01:23.996657-06	1
ebbb8418-f9db-4590-8950-5df06f407b49	ce5948f9f2d837a27c883b195a4db2df70a224ab23a2d9c65bfb8a599e77d3f7	2026-11-08 22:51:45.947438-06	20261108220000_rbac_reportes_por_rol_y_jefes	\N	\N	2026-11-08 22:51:45.906954-06	1
b6a90fc4-ca1b-4871-86c7-3791bb26cc89	2a7c3e80e748f1991a7305deaad6318d27b753a30550d3be8ef16e42e5cb552a	2026-11-08 23:51:01.484188-06	20261108230000_usuarios_por_area	\N	\N	2026-11-08 23:51:01.444868-06	1
b3423bba-24a9-4784-b8b8-790e945ce2cc	f8b73168006ab93106e37b2fa23d2b6a3bd5c577e95d64d28c1ab4de5e2d91f4	2026-11-10 10:58:26.065242-06	20260825000000_add_audit_actions_mantenimiento_combustible		\N	2026-11-10 10:58:26.065242-06	0
8a6c76a3-c956-45ce-91d5-9c816d14acff	e452157c0ccd46b61ff0d97804245b4df02fd05d52c4a0834a8b2e3ff141ef97	2026-11-10 10:58:29.469493-06	20260825000000_add_incidentes_vista		\N	2026-11-10 10:58:29.469493-06	0
2c7ec2d3-33b2-41a8-a451-80c4ee4eb02c	f26f0b04d374ed1f8c009d1dcecc84e9d06614f5a00323f0aad7d5643a0fd284	2026-11-09 19:40:17.866325-06	20261105160000_asistencia_omision_y_ubicacion_obra	\N	\N	2026-11-09 19:40:17.801892-06	1
9fa38800-cc82-4716-9c37-829206b3487a	0facbfcc1619dcaf24fa4872c6e20315436981328f69877333b5db11a355e559	2026-11-09 00:09:36.157852-06	20261108221000_roles_tecnicos_descriptivos	\N	\N	2026-11-09 00:09:36.137227-06	1
c8f8eae2-b37a-4cb8-b7d8-d6c0ccc6984a	0ba31b0b28a86c6da7010113c2660c62b020fd9e4b81a301332df31ddd1cb3cc	2026-11-10 10:58:32.944651-06	20260825000001_add_permiso_eliminar_mantenimiento_combustible		\N	2026-11-10 10:58:32.944651-06	0
4b14f653-a698-4341-80fd-1718462c66be	16725211d4a87175b82aed1d9d88d544e5b443d3f916e746323e03949e5f9b9a	2026-11-10 10:58:36.340674-06	20260826000000_add_audit_actions_incidentes		\N	2026-11-10 10:58:36.340674-06	0
f20a1bd2-2117-448a-a8c0-abd2475b39d7	58847a7ab3fae4923ffab63fe596309b39aaa30683dd43bc8046190e2715b530	2026-11-09 19:40:17.875753-06	20261105200000_flota_horometro_auditoria	\N	\N	2026-11-09 19:40:17.867226-06	1
b93e3eb3-12d8-4c76-a7aa-e0a44006fb2b	e98e571ee4de1c1072a6dcb853f632a6faf79bc59f99a63129d1adf7658581f7	2026-11-10 10:57:51.635809-06	20260821000000_seed_rbac		\N	2026-11-10 10:57:51.635809-06	0
1abac84d-435f-4eb0-ad59-75d28300c7da	6d4c707b69cddee31d7c9860c56d8b7fe25722308a860ec6c2400365cf423e48	2026-11-10 10:57:55.146069-06	20260821000001_seed_niveles_bloqueo		\N	2026-11-10 10:57:55.146069-06	0
68da3a41-150a-4b80-89f8-5cd2a4bf9e83	a3be8ea35d6a13aa6240804fe26c86dc7ce6f4cd27a0f750d68607d61cb208bf	2026-11-10 10:57:58.568013-06	20260821000002_seed_usuario_rrhh		\N	2026-11-10 10:57:58.568013-06	0
9d5a9bef-63e2-45b0-9acb-c35a18678b0e	ce14f43dcb4fc86c5d130a281704448833a38344d15544f1a3b4bddca5fca737	2026-11-10 10:58:01.98949-06	20260821000003_add_ip_to_usuarios_bloqueados		\N	2026-11-10 10:58:01.98949-06	0
57198ac6-01b6-4cf4-9675-6693247e09a4	154082b86820e50fda3896200b46153edb7d8134cf96866ec3dd00edd9cd2736	2026-11-10 10:58:05.443498-06	20260821020000_postgis_geometrias		\N	2026-11-10 10:58:05.443498-06	0
486b2320-0ff2-4823-85d8-a516d731afa6	1cb3b8d71cb6f2826da950000747c817999c535c842e29b955f03c1ae3e69260	2026-11-10 10:58:08.883739-06	20260821030000_fix_check_usuarios_bloqueados		\N	2026-11-10 10:58:08.883739-06	0
01dcbf9c-b5c5-4123-95b7-ab89e46ada96	12b217cf126dec1d499fbc34ce05ee3aab6b7985d7e9db01d26ea2c0059fa431	2026-11-10 10:58:12.252857-06	20260822100000_add_estado_obra		\N	2026-11-10 10:58:12.252857-06	0
5c7e8708-825b-4d16-9946-590e8222785c	5adfaa197ea6c669a920d934bc11a79b5a2cf3f2ee9d754073d4c1d02b2b5f26	2026-11-10 10:58:15.669439-06	20260822110000_add_audit_actions_blocks		\N	2026-11-10 10:58:15.669439-06	0
023261c4-35f0-43d0-b532-3650e48045d4	d255ad9ecc52d26d46ced5616df163958b68de945f4e4771ce7f397f8ac16dcb	2026-11-10 10:58:19.093783-06	20260823000000_add_audit_actions_inventario		\N	2026-11-10 10:58:19.093783-06	0
6c813d5d-7bfd-4759-b247-f4ed9031ebdc	1dab9410dee2175d519aa8664e441d272e6f1e13083a96437b52c1dc5868e177	2026-11-10 10:58:22.612023-06	20260824000000_add_audit_actions_bitacora		\N	2026-11-10 10:58:22.612023-06	0
1a41a17b-c2ff-447e-a88a-8fb9df2eb0a5	cd44ff3cdb576efc3cad8129bcc8c52432c34b0f7965643ab41b3e20e7fc5587	2026-11-10 10:58:39.707692-06	20260826000000_add_audit_actions_trabajadores		\N	2026-11-10 10:58:39.707692-06	0
dd7356f2-118b-4f10-9e5b-019358d8cfb7	0c652270f6d9769f30f6f1b8705fb459a393873deb142af398d9776899c81c49	2026-11-10 10:58:43.080003-06	20260826010000_add_audit_actions_asistencia		\N	2026-11-10 10:58:43.080003-06	0
74d94be5-0ec6-4a79-a62e-689b9f1da324	9d5149c388ce737e8cf3ff6e78a23d1e050bc7a2e298026b1a216cc7769b46a2	2026-11-10 10:58:46.494115-06	20260826020000_add_audit_actions_nomina		\N	2026-11-10 10:58:46.494115-06	0
23d91b3e-75dc-4e34-a8d3-9f74d7468bd7	5223a990959a535f83efedb06a06071cb885eba9478e6c5a25396634dc2e2f44	2026-11-10 10:58:49.902468-06	20260827000000_add_incidente_resuelto_audit		\N	2026-11-10 10:58:49.902468-06	0
9124f5eb-f83e-4882-9abd-c3fd09da0e4d	2fe59488f16421527d0ca2c7b52ea090d8120e38615c7ddc6538a8d6f24a9770	2026-11-10 10:58:53.333996-06	20260828000000_incidentes_reporte_y_fecha_hora		\N	2026-11-10 10:58:53.333996-06	0
9ad6e537-1ed4-4cd2-984c-daf3d2faa68d	b15e607103ed030aceaff4cd10c2f53f1713efd3945922ba858c9d2a3cd4976b	2026-11-10 10:58:56.776995-06	20260829000000_proyectos_financieros_y_auditoria		\N	2026-11-10 10:58:56.776995-06	0
79d34bef-5884-4f42-a280-c468cfcc640f	ca4c862bd14971057926d5999a91aec582d5daa084a6e6a904680e24ada710a3	2026-11-10 10:59:00.188555-06	20260830000000_add_audit_action_proyecto_finanzas		\N	2026-11-10 10:59:00.188555-06	0
a213dfdd-aeb0-41e7-8118-183876cd2055	f9f816eb6cead5c730684244673ab56ec7e2b9c319a52a4ebac9925959a88407	2026-11-10 10:59:03.624151-06	20260831000000_criba_auditoria_y_permiso_eliminar		\N	2026-11-10 10:59:03.624151-06	0
b560e053-8cd5-42cd-b3ba-6d999d20f133	41ede4df8557e80cb8b3e2b32ab048f889ce0eb5f1ba82f1751fb0723e3f2e3a	2026-11-10 10:59:07.023137-06	20260901000000_reportes_campo_permiso_eliminar		\N	2026-11-10 10:59:07.023137-06	0
f6e81759-1fd3-401a-bb67-7a4cb2732274	ba68a300d840354062fc47a45696a0d9225e99938b78dbfb9cc102d463b792d9	2026-11-10 10:59:10.427129-06	20260902000000_finanzas_auditoria_y_permiso_eliminar		\N	2026-11-10 10:59:10.427129-06	0
b2893d96-b1b5-400b-97d1-eed0cb5e269e	5cccec82bf97a67b59cc11cd01c9d44b50e5e7bb43d67b9693f018f3d8c0e54b	2026-11-10 10:59:13.858282-06	20260903000000_finanzas_otra_categoria		\N	2026-11-10 10:59:13.858282-06	0
5425289c-b455-43ec-ba2b-31ba32bc8cb0	5545da1f940abddb11f58b1a198e3d9141dc1e5d3c405ef7700791ec6778730b	2026-11-10 10:59:17.26351-06	20260904000000_clientes_auditoria		\N	2026-11-10 10:59:17.26351-06	0
51857805-996e-405a-9ad7-642cb9089344	fc1d43d0549e98889024ce8cf4178065480d169c5de9c097c095c33b8b804e3f	2026-11-10 10:59:20.674197-06	20260905000000_cotizaciones_auditoria		\N	2026-11-10 10:59:20.674197-06	0
87c3a88f-7bc2-463e-9330-957305c4c4e6	113b47d06a647636004e3330ceff35b4a66ab01bcafe6b1a9d37dca4ad4ecc8b	2026-11-10 10:59:24.086039-06	20260925000000_gps_geocercas_auditoria		\N	2026-11-10 10:59:24.086039-06	0
fd9d3ad6-3fa3-4121-b0cf-3bc00c5684f8	408a00fb41d28c2b910f183558d2389443d76d0190904c05bd42faea84259124	2026-11-10 11:00:23.772199-06	20261104000000_unificar_reportes		\N	2026-11-10 11:00:23.772199-06	0
f0e92c6d-9024-4dff-bef6-d2b3dbe0c6a4	b6ae7038c136e3b3bd4d3e5d3941096a069417cecef549776a8d9e2cc7a418be	2026-11-10 11:00:27.117966-06	20261104000100_auditaction_asignar		\N	2026-11-10 11:00:27.117966-06	0
6f5664c4-e3f7-434d-822f-1d6dad0e2539	bdad5e931302d1d8c717c255e838f5a96f90d11d6a9fe224c48beaa4c95c4fcd	2026-11-10 11:00:30.566276-06	20261104003000_proyectos_ubicacion		\N	2026-11-10 11:00:30.566276-06	0
d9267fa4-8b36-486a-9236-d9bc3e199d1f	7bf5f2e038326718a8c0d87d37e9a44e52fb8883b4fa5ad2a20e1dbdfe4562cf	2026-11-10 11:16:28.525251-06	20261110120000_audit_acceso_denegado	\N	\N	2026-11-10 11:16:28.516759-06	1
f4056df7-5a35-42fa-9d25-04225c2c4fdb	1493055763c4f4c84dbb910a24cf59ad11ca9d77a4929e5e0459a56b997a7697	2026-11-10 13:00:44.93243-06	20261111103000_reparar_drift_bloque6	\N	\N	2026-11-10 13:00:44.892964-06	1
3908f79d-5f46-44c7-a862-a5582e1ab0bc	559919e10c2e3b39bf12490d643d0217149c1fa75933a370720ec75c0da7802e	\N	20261112000000_roles_5_puestos_torre	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20261112000000_roles_5_puestos_torre\n\nDatabase error code: 23505\n\nDatabase error:\nERROR: llave duplicada viola restricción de unicidad «role_permissions_pkey»\nDETAIL: Ya existe la llave (rol_id, permiso_id)=(82eb4e1b-8676-48b2-a42d-236707587af5, aa00000b-0000-0000-0000-000000000003).\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E23505), message: "llave duplicada viola restricción de unicidad «role_permissions_pkey»", detail: Some("Ya existe la llave (rol_id, permiso_id)=(82eb4e1b-8676-48b2-a42d-236707587af5, aa00000b-0000-0000-0000-000000000003)."), hint: None, position: None, where_: None, schema: Some("public"), table: Some("role_permissions"), column: None, datatype: None, constraint: Some("role_permissions_pkey"), file: Some("nbtinsert.c"), line: Some(673), routine: Some("_bt_check_unique") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20261112000000_roles_5_puestos_torre"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20261112000000_roles_5_puestos_torre"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:255	2026-11-11 23:40:54.628482-06	2026-11-11 23:39:59.078292-06	0
032dcb85-1c52-46a8-a628-e3bfe5eea1ff	92e86cb6130aa250362539ea71fe85e5b7a5f6527d9e9fae318230552ca5097a	2026-11-11 23:40:58.460032-06	20261112000000_roles_5_puestos_torre	\N	\N	2026-11-11 23:40:57.885615-06	1
34f3dd4b-051d-41ac-9cdd-44307eb30d3b	6f4dcc6f16625008caab4fae2ef6f37debdb0afc1d366c3a5868d51f684e82aa	2026-11-12 13:04:46.764875-06	20261112010000_puesto_rol_y_otro	\N	\N	2026-11-12 13:04:46.573796-06	1
51c982da-fd8c-4eba-9d18-2b6ea5b2bbd1	b5fda074cf3388e9e46b4bc4408a7d17143f098e81194bce19956cdc2d93bd5e	\N	20261112020000_reportes_eliminar_solo_admin	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20261112020000_reportes_eliminar_solo_admin\n\nDatabase error code: 42703\n\nDatabase error:\nERROR: no existe la columna «actualizado_en» en la relación «role_vistas»\n\nPosition:\n[1m  2[0m -- Administrador" (el permiso ya se retiró por SQL; las vistas del rol\n[1m  3[0m -- Administrativo seguían con puede_eliminar=true y el front mostraba el botón).\n[1m  4[0m -- IDEMPOTENTE.\n[1m  5[0m\n[1m  6[0m UPDATE "role_vistas" rv\n[1m  7[1;31m SET "puede_eliminar" = false, "actualizado_en" = now()[0m\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42703), message: "no existe la columna «actualizado_en» en la relación «role_vistas»", detail: None, hint: None, position: Some(Original(298)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("analyze.c"), line: Some(2597), routine: Some("transformUpdateTargetList") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20261112020000_reportes_eliminar_solo_admin"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20261112020000_reportes_eliminar_solo_admin"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:255	2026-11-12 13:26:57.230571-06	2026-11-12 13:26:38.353667-06	0
94436697-a2a2-4fdc-8901-58555d11eb8e	b6f29e6615945b2988072a4b7d398159f6d81819a461e4fe145d0751c6759fef	2026-11-13 14:21:55.699827-06	20261113030000_notificaciones		\N	2026-11-13 14:21:55.699827-06	0
cfceaaa7-c89f-49be-a641-14612f4ffbc7	1ab79105c9713a81a6d6fd746809b78f312eaea42e46ee04b549314d5ef2cba6	2026-11-12 13:27:00.282055-06	20261112020000_reportes_eliminar_solo_admin	\N	\N	2026-11-12 13:27:00.223532-06	1
7d9f765b-8ed0-4571-8bd1-86e9c0ac4305	7e69e0ccbf8965c101f9f028b38ece7dc0e2911c57e94b8ad44c413232ce8d99	2026-11-12 22:53:18.699919-06	20261112050000_vista_obras		\N	2026-11-12 22:53:18.699919-06	0
f4f0d29e-15ae-43fa-8543-f9feca2b5166	df0b6b04740136a3e847033e1655f802fa801cbd07695e9e2138935c6a8c84dc	2026-11-13 00:51:08.07887-06	20261112130000_clientes_empresa_opcional		\N	2026-11-13 00:51:08.07887-06	0
c9de6f87-5d9d-495e-aefa-5eddd8adb79e	cf9599fe82dcadb1bf19dee9fc8395d15f255ce4d0beb4c687eecad1c7195881	2026-11-13 14:27:11.272256-06	20261113031000_notificaciones_permiso		\N	2026-11-13 14:27:11.272256-06	0
d0732ab0-9484-4724-985f-b1d06b238558	54439a676f9590599fc8f0c2f5e7600d5df1d67d38c3926d6617ce67e8cc1097	2026-11-13 16:10:56.166437-06	20261113041000_administrativo_proveedores_vista		\N	2026-11-13 16:10:56.166437-06	0
91972530-69f6-44e0-9a90-d63fc1c04aa3	00b04dd7664e92c281c03b4f3b59db623e4a2e2edf0931a9b031c80d5eb57a15	2026-11-14 01:22:48.355213-06	20261114010000_vista_usuarios_sistema		\N	2026-11-14 01:22:48.355213-06	0
9bde7de0-accc-4cdb-af27-8b463b0aca45	fc0ceba7565d6450e869bf3feddf5b1e34dc7842cf82662c7ae049b5440e12a4	2026-11-14 01:55:11.969101-06	20261114020000_equipos_enum_jefe		\N	2026-11-14 01:55:11.969101-06	0
794c7e22-0cf6-4ca0-92a8-fcdb7ae5d649	6bc1f5e685269affb77487ff9f94b794e6699bc759a61bdcf0e9b5f303f6b665	2026-11-14 11:16:40.014579-06	20261114030000_roles_gestion_identidad		\N	2026-11-14 11:16:40.014579-06	0
5d244462-d9f9-4642-8dd6-9eed55a1b2d0	eb6eaa80236b0527cdfeae2dc7679e92aaa44b363dcf140db7a8f8215476fd8e	2026-11-12 20:32:41.001268-06	20261112030000_obras_1a1		\N	2026-11-12 20:32:41.001268-06	0
7dfd2cbf-99cf-4ee6-8d8a-ec8ac5e48082	46f5b6a3c054bfff7179c9b5243d338fa2222675668dbabe53089331ab43ccc8	2026-11-12 22:24:04.714164-06	20261112040000_proyectos_municipio		\N	2026-11-12 22:24:04.714164-06	0
e287b950-d845-4523-9a97-e832a1579825	949fa67d474ea7db82cfaa2144e7244e746a3f1bd2864ace23c6d8978872d1be	2026-11-12 23:19:41.444555-06	20261112060000_cotizacion_items		\N	2026-11-12 23:19:41.444555-06	0
b2f12821-77b1-46e4-9237-9c86fe5457b2	c328c51d6ccee86da4941a5bcf05a799f9ba0f460f28b0df95e4f3ce805c9534	2026-11-13 00:58:13.0113-06	20261112140000_ventas_cliente_id		\N	2026-11-13 00:58:13.0113-06	0
986da41f-14d2-41e3-8b5d-71abc21acbb5	9ba59838ecb6e6a414a49535431af211423560a3227c0973c74e816a7d7ece8e	2026-11-13 11:56:54.148014-06	20261113020000_ordenes_compra_fecha_vencimiento		\N	2026-11-13 11:56:54.148014-06	0
f2eb5b91-e1b8-4d91-91f3-ac2f0087344d	4d7f41c3f41fb7c112f90f1cc40c1e515d1021733ba412f8c91177d3b891b121	2026-11-13 15:01:53.354449-06	20261113032000_notificaciones_descartada		\N	2026-11-13 15:01:53.354449-06	0
28689c29-6344-4e7f-9175-8eec3a4cfb64	867ee7e30f7f05cd582dd3c06e346a337f3dd7343eba074ae5063d4c69d3de75	2026-11-13 16:00:21.742695-06	20261113040000_notificaciones_lecturas		\N	2026-11-13 16:00:21.742695-06	0
34a88dac-776e-4cc2-a56e-23e570882466	6d06c8247716dde44b7ebe18e4acc99c2fbdeea58684cfaee6ec56ef06894412	2026-11-13 16:36:11.999385-06	20261113050000_notificaciones_destinatarios		\N	2026-11-13 16:36:11.999385-06	0
33abcbea-04b6-49f3-8cf4-3658d6f9102e	43a82039191c6c02755c58041233df3f014e58b7614509bb77db716988d108c8	2026-11-13 17:11:38.702303-06	20261113060000_trabajadores_usuario_id		\N	2026-11-13 17:11:38.702303-06	0
d3f1ff12-bf4a-44f8-af52-0908a5346eaa	2f72ea7ab912f86e096feafa544180438a02124b167bc9d067878b8570e89ff6	2026-11-13 17:25:42.984892-06	20261113070000_reportes_asignado_user_id		\N	2026-11-13 17:25:42.984892-06	0
c7ed1692-59d1-4abd-9203-1cd2a3f6fe59	14f072f7b2aef877c60d5b29f5028c3dc48e5a1281dfe055ae590a9de67cd73e	2026-11-13 18:45:38.630096-06	20261114010000_registros_criba_maquina_proyecto		\N	2026-11-13 18:45:38.630096-06	0
250fe3c4-7ce3-4fb6-962e-450c8e98329a	65f04e9efdab9895e2b0146273f92ba0fe9055b4055cf7cdb4cefe8f26af4427	2026-11-13 20:47:09.462939-06	20261114020000_materiales_criba		\N	2026-11-13 20:47:09.462939-06	0
\.


--
-- Data for Name: alertas_gps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alertas_gps (id, maquina_id, tipo, severidad, lat, lng, fecha_hora, descripcion, atendida, atendida_por, atendida_en, activo, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: aperturas_caja; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.aperturas_caja (id, fecha, cajero, fondo_inicial, abierta_en, creado_en, actualizado_en, creado_por) FROM stdin;
e448c40c-2272-4364-8170-bbbe616bdbb3	2026-11-04	Carlos SVR	0.00	2026-11-04 04:02:13.701-06	2026-11-04 04:02:13.702-06	2026-11-04 04:02:13.701-06	c0000000-0000-0000-0000-000000000001
6b0ba124-3181-434f-8836-9ddbf73fbb54	2026-11-05	Carlos SVR	0.00	2026-11-05 19:27:25.485-06	2026-11-05 19:27:25.487-06	2026-11-05 19:27:25.485-06	c0000000-0000-0000-0000-000000000001
81a3621e-2062-4114-9f02-29af4430c679	2026-11-07	Carlos SVR	0.00	2026-11-07 20:28:49.288-06	2026-11-07 20:28:49.29-06	2026-11-07 20:28:49.288-06	c0000000-0000-0000-0000-000000000001
dc4883e6-7add-41a8-8dbd-7fe27acc9da2	2026-11-08	Carlos SVR	0.00	2026-11-08 01:49:37.49-06	2026-11-08 01:49:37.491-06	2026-11-08 01:49:37.49-06	c0000000-0000-0000-0000-000000000001
3c495c32-aa36-4c01-ae73-8c54d03f6896	2026-11-09	Carlos SVR	0.00	2026-11-09 01:39:28.417-06	2026-11-09 01:39:28.418-06	2026-11-09 01:39:28.417-06	c0000000-0000-0000-0000-000000000001
2bb48f66-5060-42ca-95a9-b7b945864493	2026-11-11	Carlos SVR	0.00	2026-11-11 23:03:41.026-06	2026-11-11 23:03:41.027-06	2026-11-11 23:03:41.026-06	c0000000-0000-0000-0000-000000000001
dd4700b5-6b32-42cc-818c-b2de46782e13	2026-11-12	Carlos SVR	0.00	2026-11-12 20:12:40.138-06	2026-11-12 20:12:40.139-06	2026-11-12 20:12:40.138-06	c0000000-0000-0000-0000-000000000001
fdd1c925-c813-4eac-aa7e-2be263992b57	2026-11-13	Carlos SVR	0.00	2026-11-13 07:23:50.88-06	2026-11-13 07:23:50.881-06	2026-11-13 07:23:50.88-06	c0000000-0000-0000-0000-000000000001
a7bc25c0-42d2-4218-8c2c-d55d7602e796	2026-11-14	Carlos SVR	0.00	2026-11-14 06:32:43.64-06	2026-11-14 06:32:43.641-06	2026-11-14 06:32:43.64-06	c0000000-0000-0000-0000-000000000001
771c67fa-744d-48d3-a2a2-37c6e626372d	2026-11-15	Carlos SVR	0.00	2026-11-15 07:38:15.259-06	2026-11-15 07:38:15.26-06	2026-11-15 07:38:15.259-06	c0000000-0000-0000-0000-000000000001
\.


--
-- Data for Name: apu_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.apu_items (id, apu_template_id, categoria, nombre, cantidad, costo_unitario, activo, actualizado_en, actualizado_por, creado_en, creado_por, eliminado_en, unidad_id) FROM stdin;
19ce67b2-680c-4b0c-a94e-f0062ae4a222	dfa9a24b-4b4c-478b-a68c-4585ca7cab25	MATERIAL	Concreto Premezclado f'c=250	0.1200	2200.00	t	2026-08-21 02:14:59.176-06	\N	2026-08-21 02:14:59.176-06	\N	\N	859c80fa-b812-409b-8a73-df80b792a132
5d6614b9-77ca-4bbc-89bd-3ffb7690f99f	dfa9a24b-4b4c-478b-a68c-4585ca7cab25	MATERIAL	Malla Electrosoldada 6-6/10-10	1.1500	45.00	t	2026-08-21 02:14:59.176-06	\N	2026-08-21 02:14:59.176-06	\N	\N	ff1462a0-24da-4cc9-ae87-fe4552063dbf
085936ad-da7b-4c70-9ba4-104a375c8721	dfa9a24b-4b4c-478b-a68c-4585ca7cab25	MATERIAL	Madera para Cimbra (Uso)	2.5000	18.00	t	2026-08-21 02:14:59.176-06	\N	2026-08-21 02:14:59.176-06	\N	\N	cddac107-cf7a-4d94-9344-57b22a508c26
e2bc67d8-f90e-42a8-b8d5-973064eeb124	dfa9a24b-4b4c-478b-a68c-4585ca7cab25	MANO_DE_OBRA	Cuadrilla de Albañilería (1 Oficial + 2 Ayudantes)	0.0500	1800.00	t	2026-08-21 02:14:59.176-06	\N	2026-08-21 02:14:59.176-06	\N	\N	d6118e1e-11c0-4e53-8725-1f1b801d9841
e5e843f3-6036-4018-a404-fbecc1562557	dfa9a24b-4b4c-478b-a68c-4585ca7cab25	MANO_DE_OBRA	Cabo de Oficios	0.0050	2200.00	t	2026-08-21 02:14:59.176-06	\N	2026-08-21 02:14:59.176-06	\N	\N	d6118e1e-11c0-4e53-8725-1f1b801d9841
5d77b114-097a-4fe9-aafe-226652e6def4	dfa9a24b-4b4c-478b-a68c-4585ca7cab25	MAQUINARIA	Vibrador para Concreto 4HP	0.2000	150.00	t	2026-08-21 02:14:59.176-06	\N	2026-08-21 02:14:59.176-06	\N	\N	9256e1ce-cc2c-4ec3-a268-6b41240f2471
77ea17e2-bf8d-48a1-8e25-73c5f25092a6	dfa9a24b-4b4c-478b-a68c-4585ca7cab25	MAQUINARIA	Herramienta Menor (3% Mano de Obra)	1.0000	3.50	t	2026-08-21 02:14:59.176-06	\N	2026-08-21 02:14:59.176-06	\N	\N	20c20a29-da38-4fc7-a50d-3aed186c429e
fdb265de-6b1d-4952-ac8d-1c41b59707c7	fded9146-5b46-4739-8e36-4306f20998ad	MANO_DE_OBRA	Cuadrilla de Operación (1 Operador + 1 Ayudante)	0.0200	2000.00	t	2026-08-21 02:14:59.181-06	\N	2026-08-21 02:14:59.181-06	\N	\N	d6118e1e-11c0-4e53-8725-1f1b801d9841
90c880ee-6888-4c07-839e-6c177aa2abee	fded9146-5b46-4739-8e36-4306f20998ad	MANO_DE_OBRA	Ayudante general (limpieza)	0.0400	700.00	t	2026-08-21 02:14:59.181-06	\N	2026-08-21 02:14:59.181-06	\N	\N	d6118e1e-11c0-4e53-8725-1f1b801d9841
53d0c255-a4eb-4894-8291-ec5740bd50b8	fded9146-5b46-4739-8e36-4306f20998ad	MAQUINARIA	Excavadora CAT 320 (incluye diésel)	0.1500	850.00	t	2026-08-21 02:14:59.181-06	\N	2026-08-21 02:14:59.181-06	\N	\N	9256e1ce-cc2c-4ec3-a268-6b41240f2471
e3cb0608-ec22-49c2-b72d-16f33ebacfcc	fded9146-5b46-4739-8e36-4306f20998ad	MAQUINARIA	Herramienta Menor	1.0000	2.00	t	2026-08-21 02:14:59.181-06	\N	2026-08-21 02:14:59.181-06	\N	\N	20c20a29-da38-4fc7-a50d-3aed186c429e
c94c9698-31ca-450d-aa9a-fa48ada8a441	493aaccf-1234-4ec3-b7f4-f2e6c43e5461	MATERIAL	Block de Concreto 15x20x40	12.5000	14.00	t	2026-08-21 02:14:59.184-06	\N	2026-08-21 02:14:59.184-06	\N	\N	0f042f87-bebf-4c10-b591-6de9f369b3e6
a60f75f1-549b-44cd-b05c-8a6d71205626	493aaccf-1234-4ec3-b7f4-f2e6c43e5461	MATERIAL	Mortero Cemento-Arena 1:5	0.0150	1600.00	t	2026-08-21 02:14:59.184-06	\N	2026-08-21 02:14:59.184-06	\N	\N	859c80fa-b812-409b-8a73-df80b792a132
01c9ce42-08f9-4749-b694-cb797520e158	493aaccf-1234-4ec3-b7f4-f2e6c43e5461	MATERIAL	Andamios (Renta)	0.1000	50.00	t	2026-08-21 02:14:59.184-06	\N	2026-08-21 02:14:59.184-06	\N	\N	3c735df8-1cd3-4ba9-a8d6-cda84f8d98a0
beb937da-1e3d-41ba-9400-c1b446da1301	493aaccf-1234-4ec3-b7f4-f2e6c43e5461	MANO_DE_OBRA	Cuadrilla de Albañiles (1 Oficial + 1 Ayudante)	0.0800	1400.00	t	2026-08-21 02:14:59.184-06	\N	2026-08-21 02:14:59.184-06	\N	\N	d6118e1e-11c0-4e53-8725-1f1b801d9841
e7a17a2e-e195-4cde-8f4d-333def3e47ea	493aaccf-1234-4ec3-b7f4-f2e6c43e5461	MAQUINARIA	Revolvedora de Concreto 1 saco	0.1000	80.00	t	2026-08-21 02:14:59.184-06	\N	2026-08-21 02:14:59.184-06	\N	\N	9256e1ce-cc2c-4ec3-a268-6b41240f2471
\.


--
-- Data for Name: apu_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.apu_templates (id, codigo, nombre, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, unidad_id) FROM stdin;
dfa9a24b-4b4c-478b-a68c-4585ca7cab25	APU001	Colado de Losa de Concreto f'c=250 kg/cm²	t	2026-08-21 02:14:59.176-06	2026-08-21 02:14:59.176-06	\N	\N	\N	ff1462a0-24da-4cc9-ae87-fe4552063dbf
fded9146-5b46-4739-8e36-4306f20998ad	APU002	Excavación Mecánica en Terreno Tipo B	t	2026-08-21 02:14:59.181-06	2026-08-21 02:14:59.181-06	\N	\N	\N	859c80fa-b812-409b-8a73-df80b792a132
493aaccf-1234-4ec3-b7f4-f2e6c43e5461	APU003	Muro de Block de Concreto 15x20x40 cm	t	2026-08-21 02:14:59.184-06	2026-08-21 02:14:59.184-06	\N	\N	\N	ff1462a0-24da-4cc9-ae87-fe4552063dbf
\.


--
-- Data for Name: articulos_inventario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.articulos_inventario (id, codigo, nombre, stock, stock_minimo, precio_unitario, activo, creado_en, actualizado_en, actualizado_por, categoria_id, creado_por, eliminado_en, proveedor_id, unidad_id) FROM stdin;
24ce4ad9-32fa-43e0-b3f3-d11e055571c0	COD-81496f01-vk8v	Art-81496f01-7j6w	20.00	5.00	1500.00	f	2026-11-18 22:14:27.199-06	2026-11-18 16:14:27.213862-06	c0000000-0000-0000-0000-000000000001	67ee1b59-fafe-4754-a928-79c820e384fe	c0000000-0000-0000-0000-000000000001	2026-11-18 22:14:27.21-06	9cdb3ff4-f52e-4ee7-8fb1-8008dba7f1cd	8eba26ce-1fe4-4f39-9d84-6cec4c1a7914
cf78496d-786b-4618-8c84-bbe134ab3655	COD-c0252b7c-maa4	Art-c0252b7c-k3rr	20.00	5.00	1500.00	f	2026-11-14 05:27:17.408-06	2026-11-13 23:27:17.424412-06	c0000000-0000-0000-0000-000000000001	150d0948-0228-4b4d-9bb3-d1235b67ece4	c0000000-0000-0000-0000-000000000001	2026-11-14 05:27:17.42-06	0ee4b84d-a5be-40c8-aa66-95264de06d74	159429fe-b598-49d6-b26f-7037f2c3b309
7c8761e3-3d8e-47d2-bab7-aeb9687e8db0	COD-5a17ee2d-wul7	Art-5a17ee2d-qjso	20.00	5.00	1500.00	f	2026-11-13 05:28:06.103-06	2026-11-12 23:28:06.118463-06	c0000000-0000-0000-0000-000000000001	d9ac72d1-bf92-4bd9-9125-45c8339fdf95	c0000000-0000-0000-0000-000000000001	2026-11-13 05:28:06.115-06	e49e388a-7f84-4a6a-9d12-ac6ae5764479	d2aba40c-2f0d-490e-86f4-5562eeff71da
39206992-a3eb-4b4e-b410-fa47a260f045	COD-b7a92e38-i2w1	Art-b7a92e38-il7h	20.00	5.00	1500.00	f	2026-11-14 05:21:40.619-06	2026-11-13 23:21:40.675934-06	c0000000-0000-0000-0000-000000000001	62dd8031-1df7-4713-a914-b3266936a1fb	c0000000-0000-0000-0000-000000000001	2026-11-14 05:21:40.672-06	d4ec4481-e206-4069-b1ae-c88b69378a5f	23b86eb5-4fd1-40f8-99fb-23bb8aa966be
c9715a46-dae5-4c7c-a7b2-20e0b67e34b9	COD-6a37c69a-y9z4	Art-6a37c69a-gz1v	20.00	5.00	1500.00	f	2026-11-13 05:29:36.22-06	2026-11-12 23:29:36.239345-06	c0000000-0000-0000-0000-000000000001	5674e164-338d-4a91-8c15-9462b96c34ef	c0000000-0000-0000-0000-000000000001	2026-11-13 05:29:36.231-06	d7dd6b2c-ca17-4d5c-a23e-007f39f991e7	04593cf9-368d-4f32-978d-983078c05879
c2000000-0000-0000-0000-000000000003	MAT-003	Grava 1/2"	73.00	0.00	430.00	t	2026-11-03 18:53:54.163-06	2026-11-08 14:06:15.719266-06	\N	d2000000-0000-4000-8000-000000000001	\N	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	859c80fa-b812-409b-8a73-df80b792a132
c2000000-0000-0000-0000-000000000002	MAT-002	Grava 3/4"	80.00	0.00	420.00	t	2026-11-03 18:53:54.163-06	2026-11-08 14:06:15.719266-06	\N	d2000000-0000-4000-8000-000000000001	\N	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	859c80fa-b812-409b-8a73-df80b792a132
c2000000-0000-0000-0000-000000000012	MAT-012	Cal hidratada (bolsa)	52.00	0.00	55.00	t	2026-11-03 18:53:54.163-06	2026-11-08 14:11:59.403924-06	\N	d2000000-0000-4000-8000-000000000002	\N	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	d1000000-0000-4000-8000-000000000005
c2000000-0000-0000-0000-000000000001	MAT-001	Arena lavada	204.00	0.00	350.00	t	2026-11-03 18:53:54.163-06	2026-11-18 16:14:03.35953-06	\N	d2000000-0000-4000-8000-000000000001	\N	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	859c80fa-b812-409b-8a73-df80b792a132
c2000000-0000-0000-0000-000000000008	MAT-008	Block 15x20x40	808.00	0.00	12.00	t	2026-11-03 18:53:54.163-06	2026-11-12 23:29:30.564739-06	\N	d2000000-0000-4000-8000-000000000002	\N	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	d1000000-0000-4000-8000-000000000004
c2000000-0000-0000-0000-000000000009	MAT-009	Cemento CPC 40 (50 kg)	162.00	0.00	185.00	t	2026-11-03 18:53:54.163-06	2026-11-12 23:28:04.297083-06	\N	d2000000-0000-4000-8000-000000000002	\N	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	d1000000-0000-4000-8000-000000000003
372d5385-6846-46de-bc2e-e15663ab8fc6	I001	Filtro de Aceite CAT	22.00	5.00	450.00	t	2026-08-21 02:14:59.121-06	2026-11-12 23:28:04.386856-06	\N	fb2240f1-776d-404f-9eb9-778c05e57fad	\N	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	936fbba3-8af5-4bb8-ba36-ab99d462ae05
56386558-d057-4ef2-955b-11da214b128d	COD-81fcbc23-5iq5	Art-81fcbc23-vi5h	20.00	5.00	1500.00	f	2026-11-18 21:56:32.36-06	2026-11-18 15:56:32.372674-06	c0000000-0000-0000-0000-000000000001	092be5f1-08f8-4375-bd82-b72d6b1da7bd	c0000000-0000-0000-0000-000000000001	2026-11-18 21:56:32.369-06	b8da6f3a-7159-4681-917c-f09c8184c0f6	40b6c06f-b616-43ac-8781-e50825b76c40
c2000000-0000-0000-0000-000000000010	MAT-010	Varilla 3/8" (12 m)	208.00	0.00	95.00	t	2026-11-03 18:53:54.163-06	2026-11-18 16:15:30.041498-06	\N	d2000000-0000-4000-8000-000000000003	\N	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	d1000000-0000-4000-8000-000000000004
b0a74063-1fd6-4b7e-ac55-bc3d8a56e0a9	I003	Llanta para Volteo 11R22.5	14.00	4.00	8500.00	t	2026-08-21 02:14:59.124-06	2026-11-12 23:29:30.620874-06	\N	af90f6f0-334d-4a06-8adb-5a0622f131d8	\N	\N	53e3ab7a-8296-4344-a36e-8b5a3e3fc7d3	936fbba3-8af5-4bb8-ba36-ab99d462ae05
c2000000-0000-0000-0000-000000000007	MAT-007	Tepetate	94.00	0.00	180.00	t	2026-11-03 18:53:54.163-06	2026-11-13 01:32:29.925374-06	\N	d2000000-0000-4000-8000-000000000001	\N	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	859c80fa-b812-409b-8a73-df80b792a132
c2000000-0000-0000-0000-000000000011	MAT-011	Malla electrosoldada 6x6	49.00	0.00	650.00	t	2026-11-03 18:53:54.163-06	2026-11-13 12:02:49.775216-06	\N	d2000000-0000-4000-8000-000000000003	\N	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	d1000000-0000-4000-8000-000000000004
b6c8f0cc-2ca0-45eb-bc75-1d547d7e74bc	COD-34193423-pbhu	Art-34193423-czg3	20.00	5.00	1500.00	f	2026-11-18 22:19:38.655-06	2026-11-18 16:19:38.671639-06	c0000000-0000-0000-0000-000000000001	0f135c49-f51e-4e48-8cc5-9f2d8c71e130	c0000000-0000-0000-0000-000000000001	2026-11-18 22:19:38.668-06	0bb1fff0-fdbd-4848-8d80-13db54143ce0	79f72c12-34bb-402c-90e5-0d72d2ba5921
a9598262-f4fb-40c3-9831-c14ff59876a0	COD-f6b40283-58z9	Art-f6b40283-1aoj	20.00	5.00	1500.00	f	2026-11-18 22:15:23.239-06	2026-11-18 16:15:23.252027-06	c0000000-0000-0000-0000-000000000001	59e2117c-124b-410c-94a3-fde89219430c	c0000000-0000-0000-0000-000000000001	2026-11-18 22:15:23.248-06	4c9e89b2-bbd9-4a31-bc5d-8c9b915c2285	fbcd9ed5-e112-4bfa-a350-52ab31a144ac
5c3afc42-0623-46ad-988d-55b227a48673	I002	Aceite Hidráulico SAE 10W	110.00	100.00	1200.00	t	2026-08-21 02:14:59.122-06	2026-11-13 18:10:59.772137-06	\N	824c9e7e-30e1-43d8-868b-205b6403ead8	\N	\N	bd7a0bff-6245-4c61-ab32-69f698abc750	7ef1227e-8879-4ed7-ae09-3497610b5d02
c2000000-0000-0000-0000-000000000004	MAT-004	Criba fina	8112.00	0.00	280.00	t	2026-11-03 18:53:54.163-06	2026-11-18 16:19:33.198159-06	\N	d2000000-0000-4000-8000-000000000001	\N	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	859c80fa-b812-409b-8a73-df80b792a132
c2000000-0000-0000-0000-000000000005	MAT-005	Criba gruesa	47.00	0.00	290.00	t	2026-11-03 18:53:54.163-06	2026-11-18 16:19:35.248542-06	\N	d2000000-0000-4000-8000-000000000001	\N	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	859c80fa-b812-409b-8a73-df80b792a132
c2000000-0000-0000-0000-000000000006	MAT-006	Tezontle	54.00	0.00	500.00	t	2026-11-03 18:53:54.163-06	2026-11-18 16:19:35.304006-06	\N	d2000000-0000-4000-8000-000000000001	\N	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	859c80fa-b812-409b-8a73-df80b792a132
\.


--
-- Data for Name: articulos_precio; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.articulos_precio (id, articulo_id, medida, precio, creado_en) FROM stdin;
c2100000-0000-0000-0000-000000000010	c2000000-0000-0000-0000-000000000004	m³	280.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000017	c2000000-0000-0000-0000-000000000006	tonelada	750.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000021	c2000000-0000-0000-0000-000000000007	viaje	900.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000016	c2000000-0000-0000-0000-000000000006	m³	500.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000006	c2000000-0000-0000-0000-000000000002	viaje	2100.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000011	c2000000-0000-0000-0000-000000000004	tonelada	430.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000027	c2000000-0000-0000-0000-000000000011	pieza	650.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000024	c2000000-0000-0000-0000-000000000009	bulto	185.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000002	c2000000-0000-0000-0000-000000000001	tonelada	520.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000008	c2000000-0000-0000-0000-000000000003	tonelada	660.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000015	c2000000-0000-0000-0000-000000000005	viaje	1450.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000007	c2000000-0000-0000-0000-000000000003	m³	430.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000028	c2000000-0000-0000-0000-000000000011	m²	47.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000029	c2000000-0000-0000-0000-000000000012	bolsa	55.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000001	c2000000-0000-0000-0000-000000000001	m³	350.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000025	c2000000-0000-0000-0000-000000000010	pieza	95.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000013	c2000000-0000-0000-0000-000000000005	m³	290.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000014	c2000000-0000-0000-0000-000000000005	tonelada	450.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000009	c2000000-0000-0000-0000-000000000003	viaje	2150.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000023	c2000000-0000-0000-0000-000000000008	m²	150.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000003	c2000000-0000-0000-0000-000000000001	viaje	1800.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000026	c2000000-0000-0000-0000-000000000010	tonelada	21000.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000012	c2000000-0000-0000-0000-000000000004	viaje	1400.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000005	c2000000-0000-0000-0000-000000000002	tonelada	640.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000020	c2000000-0000-0000-0000-000000000007	tonelada	270.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000022	c2000000-0000-0000-0000-000000000008	pieza	12.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000004	c2000000-0000-0000-0000-000000000002	m³	420.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000019	c2000000-0000-0000-0000-000000000007	m³	180.00	2026-11-03 18:53:54.165638-06
c2100000-0000-0000-0000-000000000018	c2000000-0000-0000-0000-000000000006	viaje	2500.00	2026-11-03 18:53:54.165638-06
\.


--
-- Data for Name: asistencias_semanales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asistencias_semanales (id, trabajador_id, semana, total_dias_asistidos, total_faltas, total_retardos, total_horas_ordinarias, total_horas_extra, creado_en, actualizado_en, activo, actualizado_por, creado_por, eliminado_en) FROM stdin;
9ae6581e-43c8-4578-aadf-ecddb50198e2	d69e3ac7-f268-4533-a7ed-780c000f4ad7	Semana 17 (21 Abr - 26 Abr 2025)	6	0	1	48.00	6.50	2026-08-21 02:14:59.104-06	2026-08-21 02:14:59.104-06	t	\N	\N	\N
511a9fcd-b046-4f24-84c0-74d9ba1f995b	ea344f07-0905-4881-a64b-b7315f0bfe97	Semana 17 (21 Abr - 26 Abr 2025)	6	0	0	48.00	4.50	2026-08-21 02:14:59.109-06	2026-08-21 02:14:59.109-06	t	\N	\N	\N
6194964e-9325-4213-9cdf-3902c62c54bc	fe2ec7b7-7fda-4c09-af19-279f41215d06	Semana 17 (21 Abr - 26 Abr 2025)	5	1	2	40.00	0.00	2026-08-21 02:14:59.114-06	2026-08-21 02:14:59.114-06	t	\N	\N	\N
9f60d932-a357-42e2-a7c3-d9532738df5b	f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	Semana 17 (21 Abr - 26 Abr 2025)	6	0	0	45.75	0.00	2026-08-21 02:14:59.118-06	2026-08-21 02:14:59.118-06	t	\N	\N	\N
\.


--
-- Data for Name: bancos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bancos (id, nombre, activo, creado_en, actualizado_en, creado_por) FROM stdin;
\.


--
-- Data for Name: bitacoras_operacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bitacoras_operacion (id, maquina_id, actividad, horas, fecha, activo, creado_en, actualizado_en, codigo, actualizado_por, creado_por, eliminado_en, obra_id, obra_texto) FROM stdin;
e8e8a795-df1d-42f9-a666-e713532de405	b7bb9152-0851-4372-9e55-b393fa7da463	Excavación para cimentación profunda	8.00	2025-04-27	t	2026-08-21 02:14:59.159-06	2026-08-21 02:14:59.159-06	B001	\N	\N	\N	\N	Valle Sur
393a36d5-b70c-4e1f-b899-1c2e097c10f3	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	Acarreo de escombro a tiro autorizado	6.00	2025-04-27	t	2026-08-21 02:14:59.162-06	2026-08-21 02:14:59.162-06	B002	\N	\N	\N	\N	Valle Sur
\.


--
-- Data for Name: bitacoras_renta_diaria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bitacoras_renta_diaria (id, folio, trabajador_id, maquina_id, fecha, cliente_id, obra_ubicacion, horas_efectivas, horas_extras, horometro_inicial, horometro_final, actividad_realizada, estado_cobro, tarifa_hora_renta, importe_total_renta, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, obra_id, hora_inicio, hora_fin) FROM stdin;
e71db8bb-8c68-488b-92f1-cc4b6b9f3115	BIT-2025-042	d69e3ac7-f268-4533-a7ed-780c000f4ad7	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	f600f831-a44a-4930-9fc0-8e5ec1ee9450	Fraccionamiento Valle Sur (Manzana 4)	8.00	2.50	1238.50	1249.00	Excavación de zanja pluvial 80m lineales, afine de talud y carga de material sobrante a camiones de volteo.	LISTO_FACTURAR	1450.00	15225.00	t	2026-08-21 02:14:59.076-06	2026-08-21 02:14:59.076-06	\N	\N	\N	\N	07:00:00	17:30:00
972b3c29-cf18-4de3-af2e-774941f8116e	BIT-2025-041	ea344f07-0905-4881-a64b-b7315f0bfe97	27800748-89c1-4900-8b5d-31926fc63836	2025-04-27	a298e1f4-5cfb-478b-b0ad-5e7e7e25308d	Remodelación Centro Histórico (Calle 5 de Mayo)	8.00	0.00	885.00	893.00	Demolición de banquetas dañadas, retiro de escombro y apertura de cajas para tubería de gas natural.	FACTURADO	950.00	7600.00	t	2026-08-21 02:14:59.08-06	2026-08-21 02:14:59.08-06	\N	\N	\N	\N	07:00:00	15:00:00
18a90b16-13de-454d-80d4-d05f8d03928d	BIT-2025-040	fe2ec7b7-7fda-4c09-af19-279f41215d06	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2025-04-26	cc2f4d26-2ef8-4579-8ca6-6a8e5006daae	Tramo Carretero Atizapán Km 14+200	8.00	3.50	3410.00	3421.50	12 viajes de acarreo de base hidráulica y tepetate desde banco de tiro a terraplén principal.	LISTO_FACTURAR	850.00	9775.00	t	2026-08-21 02:14:59.084-06	2026-11-13 18:10:11.070067-06	c0000000-0000-0000-0000-000000000001	\N	\N	\N	06:30:00	18:00:00
\.


--
-- Data for Name: cargas_combustible; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cargas_combustible (id, codigo, maquina_id, fecha, litros, costo, operador_id, lugar, horometro_actual, horas_trabajadas_periodo, consumo_esperado_lts_hora, rendimiento_lts_hora, alerta_ordena, desviacion_porcentaje, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en) FROM stdin;
4002b850-9511-4901-be63-bb3715c38bad	F001	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	110.00	2530.00	d69e3ac7-f268-4533-a7ed-780c000f4ad7	Gasolinera Norte	1245.50	8.00	14.00	13.75	f	-1.80	t	2026-08-21 02:14:59.053-06	2026-08-21 02:14:59.053-06	\N	\N	\N
12947003-b903-4cb3-8841-47327c60580c	F002	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2025-04-27	200.00	4600.00	fe2ec7b7-7fda-4c09-af19-279f41215d06	Autoconsumo Obra Valle Sur	3421.10	8.50	12.00	23.53	t	96.10	t	2026-08-21 02:14:59.056-06	2026-08-21 02:14:59.056-06	\N	\N	\N
b5530433-43c1-4d96-8355-261553cd1960	F003	27800748-89c1-4900-8b5d-31926fc63836	2025-04-26	45.00	1035.00	ea344f07-0905-4881-a64b-b7315f0bfe97	Gasolinera Centro	890.20	4.80	9.50	9.38	f	-1.20	t	2026-08-21 02:14:59.059-06	2026-08-21 02:14:59.059-06	\N	\N	\N
\.


--
-- Data for Name: categorias_inventario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorias_inventario (id, nombre, descripcion, activo, creado_en, actualizado_en) FROM stdin;
fb2240f1-776d-404f-9eb9-778c05e57fad	Refacciones	\N	t	2026-08-21 02:14:58.942-06	2026-08-21 02:14:58.942-06
824c9e7e-30e1-43d8-868b-205b6403ead8	Lubricantes	\N	t	2026-08-21 02:14:58.943-06	2026-08-21 02:14:58.943-06
af90f6f0-334d-4a06-8adb-5a0622f131d8	Neumáticos	\N	t	2026-08-21 02:14:58.944-06	2026-08-21 02:14:58.944-06
d2000000-0000-4000-8000-000000000001	Áridos	\N	t	2026-11-03 18:53:54.173-06	2026-11-08 14:06:15.719266-06
d2000000-0000-4000-8000-000000000002	Materiales	\N	t	2026-11-03 18:53:54.173-06	2026-11-08 14:06:15.719266-06
d2000000-0000-4000-8000-000000000003	Acero	\N	t	2026-11-03 18:53:54.173-06	2026-11-08 14:06:15.719266-06
d9ac72d1-bf92-4bd9-9125-45c8339fdf95	TestCat-5a17ee2d	\N	t	2026-11-13 05:28:05.721-06	2026-11-13 05:28:05.716-06
5674e164-338d-4a91-8c15-9462b96c34ef	TestCat-6a37c69a	\N	t	2026-11-13 05:29:35.788-06	2026-11-13 05:29:35.781-06
62dd8031-1df7-4713-a914-b3266936a1fb	TestCat-b7a92e38	\N	t	2026-11-14 05:21:39.61-06	2026-11-14 05:21:39.568-06
150d0948-0228-4b4d-9bb3-d1235b67ece4	TestCat-c0252b7c	\N	t	2026-11-14 05:27:16.117-06	2026-11-14 05:27:15.906-06
092be5f1-08f8-4375-bd82-b72d6b1da7bd	TestCat-81fcbc23	\N	t	2026-11-18 21:56:31.811-06	2026-11-18 21:56:31.807-06
67ee1b59-fafe-4754-a928-79c820e384fe	TestCat-81496f01	\N	t	2026-11-18 22:14:26.809-06	2026-11-18 22:14:26.788-06
59e2117c-124b-410c-94a3-fde89219430c	TestCat-f6b40283	\N	t	2026-11-18 22:15:22.91-06	2026-11-18 22:15:22.904-06
0f135c49-f51e-4e48-8cc5-9f2d8c71e130	TestCat-34193423	\N	t	2026-11-18 22:19:38.317-06	2026-11-18 22:19:38.31-06
\.


--
-- Data for Name: categorias_puesto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorias_puesto (id, nombre, descripcion, salario_base_sugerido, activo, creado_en, actualizado_en, torre, rol_id) FROM stdin;
923aa0cd-8e76-43e6-95a9-3be3c96ca14e	Operador	\N	\N	t	2026-08-21 02:14:58.931-06	2026-11-12 13:04:46.731597-06	\N	e0000000-0000-0000-0000-0000000000a5
457083fb-f806-47f5-bf2e-46d75b6bd610	Chofer	\N	\N	t	2026-08-21 02:14:58.933-06	2026-11-12 13:04:46.731597-06	\N	e0000000-0000-0000-0000-0000000000a5
c1c154bb-be3a-4694-9273-f07c64d2dec1	Mecanico	\N	\N	t	2026-08-21 02:14:58.934-06	2026-11-12 13:04:46.754901-06	MECANICO	82eb4e1b-8676-48b2-a42d-236707587af5
48997f22-863f-4f0c-a46f-572f5992415c	Tecnico Diesel	\N	\N	t	2026-11-11 23:39:59.17697-06	2026-11-12 13:04:46.754901-06	DIESEL	82eb4e1b-8676-48b2-a42d-236707587af5
4bb91468-eaba-4260-897b-7863755e0f32	Soldador	\N	\N	t	2026-11-11 23:39:59.17697-06	2026-11-12 13:04:46.754901-06	SOLDADOR	82eb4e1b-8676-48b2-a42d-236707587af5
271c4b95-467e-46c7-a034-c55bb7ea4c11	Mantenimiento	\N	\N	t	2026-11-11 23:39:59.17697-06	2026-11-12 13:04:46.754901-06	MANTENIMIENTO	82eb4e1b-8676-48b2-a42d-236707587af5
3f66ae71-7d0d-45b6-8e2f-eb9e5aa5715b	Ingeniero	\N	\N	t	2026-08-21 02:14:58.935-06	2026-11-12 13:04:46.755801-06	RESIDENTE	e0000000-0000-0000-0000-0000000000a2
e71fb890-67e3-4e62-8cc1-b5170a4f0606	Administrativo	\N	\N	t	2026-08-21 02:14:58.932-06	2026-11-12 13:04:46.75633-06	ADMINISTRATIVO	e0000000-0000-0000-0000-0000000000a1
400dff2b-c91a-4c78-a208-e8ab573fbc8d	RRHH	\N	\N	t	2026-11-11 23:39:59.17697-06	2026-11-12 13:04:46.75633-06	ADMINISTRATIVO	e0000000-0000-0000-0000-0000000000a1
67ed58fa-4281-427c-bf6c-151c4376158c	Otro	\N	\N	t	2026-11-12 13:04:46.757399-06	2026-11-12 13:04:46.757399-06	\N	\N
\.


--
-- Data for Name: checklists_preoperacionales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.checklists_preoperacionales (id, codigo, maquina_id, fecha, operador_id, horometro_inicial, nivel_aceite_motor, nivel_hidraulico, fugas_visibles, estado_llantas_orugas, luces_y_alarmas, sistema_frenos, estado, observaciones, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, hora) FROM stdin;
bea53cc7-5bd1-4462-a8d6-d93d6281dee7	CHK-001	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	d69e3ac7-f268-4533-a7ed-780c000f4ad7	1239.20	CORRECTO	CORRECTO	f	CORRECTO	CORRECTO	CORRECTO	APROBADO	Equipo en óptimas condiciones para inicio de jornada.	t	2026-08-21 02:14:59.045-06	2026-08-21 02:14:59.045-06	\N	\N	\N	06:50:00
5d366a55-7036-44f7-8600-a024bdeaba81	CHK-002	27800748-89c1-4900-8b5d-31926fc63836	2025-04-27	ea344f07-0905-4881-a64b-b7315f0bfe97	885.40	CORRECTO	BAJO	t	CORRECTO	CORRECTO	CORRECTO	CON_FALLA	Goteo visible en manguera de cilindro de elevación. Requiere reapriete de niple.	t	2026-08-21 02:14:59.048-06	2026-08-21 02:14:59.048-06	\N	\N	\N	07:10:00
dfbe08c7-a662-4ed6-9fd0-b929ae60c7fc	CHK-004	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2025-04-27	fe2ec7b7-7fda-4c09-af19-279f41215d06	3412.60	CORRECTO	CORRECTO	f	CORRECTO	CORRECTO	CORRECTO	APROBADO	Inspección pre-operacional conforme.	t	2026-08-21 02:14:59.051-06	2026-08-21 02:14:59.051-06	\N	\N	\N	06:45:00
\.


--
-- Data for Name: cierres_caja; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cierres_caja (id, fecha, cajero, ventas_count, total_ventas, efectivo_inicial, ventas_efectivo, total_retiros, esperado, contado, diferencia, fondo_siguiente, notas, denominaciones, creado_en, actualizado_en, creado_por, estado, aprobador_id, motivo_rechazo) FROM stdin;
94215e29-d479-4772-9cef-fad7867da3b2	2026-11-13	Carlos SVR	3	1060.00	0.00	1060.00	0.00	1060.00	1060.00	0.00	500.00	\N	{"10": 1, "50": 1, "1000": 1}	2026-11-13 21:31:54.092-06	2026-11-13 21:31:54.091-06	c0000000-0000-0000-0000-000000000001	PENDIENTE	\N	\N
0caf70ab-d186-4ac4-8666-067d3fa78b58	2026-11-14	Carlos SVR	0	0.00	0.00	0.00	0.00	0.00	1000.00	1000.00	1000.00	se registraron $1000 a favor	{"1000": 1}	2026-11-14 06:33:18.991-06	2026-11-14 06:33:18.989-06	c0000000-0000-0000-0000-000000000001	PENDIENTE	\N	\N
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clientes (id, codigo, nombre, empresa, correo, telefono, activo, creado_en, actualizado_en, actualizado_por, creado_por, direccion_fiscal, eliminado_en, rfc) FROM stdin;
f600f831-a44a-4930-9fc0-8e5ec1ee9450	C001	Ing. Alberto Ruiz	Inmobiliaria ARCO	aruiz@arco.com	555-9988	t	2026-08-21 02:14:58.948-06	2026-08-21 02:14:58.948-06	\N	\N	\N	\N	\N
3a05641a-c5eb-4676-8ec3-720b3e2d7ba1	C002	Lic. Martha Silva	Gobierno CDMX	msilva@gob.mx	555-1122	t	2026-08-21 02:14:58.951-06	2026-08-21 02:14:58.951-06	\N	\N	\N	\N	\N
cf8c9e99-7dac-4337-a50f-82db43546a6a	\N	SCT	SCT			t	2026-08-21 02:14:58.952-06	2026-08-21 02:14:58.952-06	\N	\N	\N	\N	\N
cc2f4d26-2ef8-4579-8ca6-6a8e5006daae	\N	Constructora ABC / SCT	Constructora ABC / SCT			t	2026-08-21 02:14:58.953-06	2026-08-21 02:14:58.953-06	\N	\N	\N	\N	\N
a298e1f4-5cfb-478b-b0ad-5e7e7e25308d	\N	Gobierno CDMX - Obras Públicas	Gobierno CDMX - Obras Públicas			t	2026-08-21 02:14:58.954-06	2026-08-21 02:14:58.954-06	\N	\N	\N	\N	\N
debd3854-f1a7-4e08-bfc2-a0ea2cc67bab	\N	Licenciado Roberto	Refaccion Nay	rfanay@gmail.com	3433432121	t	2026-11-05 20:42:32.635-06	2026-11-05 20:42:32.634-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N	WERGFDETRF34E
a8185226-0a28-4b32-8858-d0ba902d38d2	\N	Cliente POS Smoke	Peluqueria Smoke	pos-smoke@test.mx	322-000-0000	t	2026-11-13 07:09:41.676-06	2026-11-13 07:09:41.675-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N	\N
7e8298c8-3c2f-4e84-b117-e9d29aff7003	\N	Juan Pérez Garcia	Mobiliaria	mobiliaria@gmail.com	3332323443	t	2026-11-13 07:57:11.958-06	2026-11-13 07:57:11.947-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N	\N
34b9e169-6dfd-4e59-b6ff-dd2ef6f998a4	SEED-CXC-001	Constructora Ortiz	Constructora Ortiz SA de CV	contacto@coo950101t11.mx	55-0000-000	t	2026-11-07 20:34:16.397-06	2026-11-07 20:34:16.382-06	\N	\N	\N	\N	COO950101T11
e0ee77c3-441b-4dfb-82c4-225611e0815c	SEED-CXC-002	Desarrollos Riviera	Desarrollos Riviera SAPI	contacto@dri880202m15.mx	55-1000-001	t	2026-11-07 20:34:16.418-06	2026-11-07 20:34:16.418-06	\N	\N	\N	\N	DRI880202M15
8e38241a-6951-4ca7-b971-38a10c4ccf27	SEED-CXC-003	Minera Santa Fe	Minera Santa Fe SA	contacto@msf910303dj2.mx	55-2000-002	t	2026-11-07 20:34:16.421-06	2026-11-07 20:34:16.421-06	\N	\N	\N	\N	MSF910303DJ2
7411b3d0-e334-4afe-8634-92d24a05b1fd	SEED-CXC-004	Ferrocarriles del Sur	Ferrocarriles del Sur SA de CV	contacto@fsu920404xa1.mx	55-3000-003	t	2026-11-07 20:34:16.424-06	2026-11-07 20:34:16.423-06	\N	\N	\N	\N	FSU920404XA1
ff2b4f34-2003-42aa-b72f-9e015c281293	SEED-CXC-005	Gobierno Municipal	H. Ayuntamiento de Santiago	contacto@gms930505ql3.mx	55-4000-004	t	2026-11-07 20:34:16.426-06	2026-11-07 20:34:16.426-06	\N	\N	\N	\N	GMS930505QL3
3811dfb6-8263-4d9f-8ba5-2d2b2f304102	SEED-CXC-006	Constructora Pirámide	Constructora Pirámide SA	contacto@cpi940606p17.mx	55-5000-005	t	2026-11-07 20:34:16.428-06	2026-11-07 20:34:16.428-06	\N	\N	\N	\N	CPI940606P17
\.


--
-- Data for Name: configuracion_sistema; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configuracion_sistema (clave, valor, descripcion, tipo, categoria, creado_en, actualizado_en, creado_por, actualizado_por) FROM stdin;
turno_apertura	08:00	Hora de apertura del turno (formato HH:mm 24h)	string	turno	2026-11-03 18:53:54.28226-06	2026-11-18 22:19:10.579-06	\N	c0000000-0000-0000-0000-000000000001
turno_cierre	16:00	Hora de cierre del turno (formato HH:mm 24h)	string	turno	2026-11-03 18:53:54.28226-06	2026-11-18 22:19:10.58-06	\N	c0000000-0000-0000-0000-000000000001
\.


--
-- Data for Name: contactos_emergencia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contactos_emergencia (id, trabajador_id, nombre, telefono, parentesco, creado_en, actualizado_en, activo, actualizado_por, creado_por, eliminado_en) FROM stdin;
44160b89-de8b-4593-af72-61ea392bc038	d69e3ac7-f268-4533-a7ed-780c000f4ad7	María Gómez	55 9876 5432	Esposa	2026-08-21 02:14:58.977-06	2026-08-21 02:14:58.977-06	t	\N	\N	\N
2d72e0bf-299c-4ace-b64b-e105b635e234	ea344f07-0905-4881-a64b-b7315f0bfe97	Rosa Pérez	55 1122 3344	Madre	2026-08-21 02:14:58.984-06	2026-08-21 02:14:58.984-06	t	\N	\N	\N
8f3ed4c6-35c4-4747-9c2f-3eeaf5bb4244	f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	Carlos Martínez	55 5566 7788	Hermano	2026-08-21 02:14:58.989-06	2026-08-21 02:14:58.989-06	t	\N	\N	\N
3aeda245-5659-463c-a437-cb25546a6766	fe2ec7b7-7fda-4c09-af19-279f41215d06	Lucía Torres	55 9988 7766	Esposa	2026-08-21 02:14:58.993-06	2026-08-21 02:14:58.993-06	t	\N	\N	\N
fae8dc6a-1a28-47a5-9a30-006e56447bde	99ef344b-2f95-4dec-8f4f-dccc4bb43351	Laura Soto	55 4433 2211	Esposa	2026-08-21 02:14:58.998-06	2026-08-21 02:14:58.998-06	t	\N	\N	\N
3b99582c-b911-4a63-aaec-f99a1282e30a	7ae68a33-6be6-46f3-8344-2dbf7389540d	Patricia Valenzuela	55 7788 9900	Hermana	2026-08-21 02:14:59.004-06	2026-08-21 02:14:59.004-06	t	\N	\N	\N
\.


--
-- Data for Name: cotizacion_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cotizacion_items (id, cotizacion_id, descripcion, cantidad, unidad, precio_unitario, importe, orden, creado_en, actualizado_en, creado_por, actualizado_por) FROM stdin;
d6aa8afc-456d-4b6a-8062-c68daea12f2c	22da26e4-969a-4e9d-88a1-5134e03a8331	VIBROCOMPACTADOR BOMAG	1.0000	DIA	5500.00	5500.00	0	2026-11-13 06:13:44.565-06	2026-11-13 06:13:44.54-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001
888b247f-5f58-4399-8d2d-b20421d832ad	22da26e4-969a-4e9d-88a1-5134e03a8331	TRASLADO IDA Y VUELTA	1.0000	DIA	9000.00	9000.00	1	2026-11-13 06:13:44.565-06	2026-11-13 06:13:44.54-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001
bc0cf31f-23f3-4e17-ae22-044808ba1925	22da26e4-969a-4e9d-88a1-5134e03a8331	PIPA CAP 20,000 LTS	2.0000	DIA	8000.00	16000.00	2	2026-11-13 06:13:44.565-06	2026-11-13 06:13:44.54-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001
58977c9b-7eef-4e5a-a3a7-950e25ad4748	d5d396ef-c8e3-43ab-9a73-f8b64ad6c95c	www	2.0000	2	1000.00	2000.00	0	2026-11-13 06:21:27.626-06	2026-11-13 06:21:27.621-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001
1696e549-603a-4d62-a537-fe8fea58af70	d5d396ef-c8e3-43ab-9a73-f8b64ad6c95c	eee	5.0000	10	500.00	2500.00	1	2026-11-13 06:21:27.626-06	2026-11-13 06:21:27.621-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001
c4a2c325-b730-42bf-98ae-5668efee1b78	e31f5eec-5863-4cb8-b9f5-a75979a6101f	Renta retroexcavadora	48.0000	horas	700.00	33600.00	0	2026-11-14 06:32:06.718-06	2026-11-14 06:32:06.702-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001
c5f5568a-13c1-43e9-9d41-c1be68019eb9	e31f5eec-5863-4cb8-b9f5-a75979a6101f	Criba fina	100.0000	metros cuadrados	220.00	22000.00	1	2026-11-14 06:32:06.718-06	2026-11-14 06:32:06.702-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001
093b63ad-a050-4e27-a71e-23843b29b632	e31f5eec-5863-4cb8-b9f5-a75979a6101f	Criba grueso	70.0000	metros cuadrados	240.00	16800.00	2	2026-11-14 06:32:06.718-06	2026-11-14 06:32:06.702-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001
\.


--
-- Data for Name: cotizaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cotizaciones (id, codigo, cliente_id, descripcion, monto, fecha, estado, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, vendedor_id, motivo_rechazo, condiciones) FROM stdin;
c4d700e7-b55b-45e4-8d3e-faec0ac44bd2	Q001	f600f831-a44a-4930-9fc0-8e5ec1ee9450	Renta de Excavadora 320 por 100 horas	125000.00	2025-04-25	ACEPTADA	t	2026-08-21 02:14:59.125-06	2026-08-21 02:14:59.125-06	\N	\N	\N	\N	\N	\N
10039415-ed0a-4c40-a1a6-7b6b639dc62f	Q002	f600f831-a44a-4930-9fc0-8e5ec1ee9450	Movimiento de tierras Valle Sur - Fase 2	450000.00	2025-04-27	ACEPTADA	t	2026-08-21 02:14:59.127-06	2026-11-07 18:33:18.286309-06	c0000000-0000-0000-0000-000000000001	\N	\N	\N	\N	\N
e31f5eec-5863-4cb8-b9f5-a75979a6101f	COT-20261113-21B90E	cc2f4d26-2ef8-4579-8ca6-6a8e5006daae	Renta de mquinaria y venta de material	72400.00	2026-11-13	PENDIENTE	t	2026-11-14 06:21:35.988-06	2026-11-14 00:32:06.703396-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	c0000000-0000-0000-0000-000000000001	\N	Estos precios no incluyen IVA.\nEl turno por día se tomará a 8 horas.\nVigencia de la presente cotización 8 días a partir de su elaboración.\nAnticipar una semana antes de la fecha de inicio de trabajo para verificar disponibilidad.
4a084ec8-e9fd-4c2d-b496-71831a05aeaf	COT-20261108-84633D	34b9e169-6dfd-4e59-b6ff-dd2ef6f998a4	maquinaria	55000.00	2026-11-08	RECHAZADA	t	2026-11-08 00:37:08.624-06	2026-11-14 00:05:29.170728-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	c0000000-0000-0000-0000-000000000001	no cumple con los requisitos	\N
d5d396ef-c8e3-43ab-9a73-f8b64ad6c95c	COT-20261113-7022C6	e0ee77c3-441b-4dfb-82c4-225611e0815c	dwdwd	4500.00	2026-11-13	ACEPTADA	t	2026-11-13 06:21:27.626-06	2026-11-14 00:05:29.170728-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	c0000000-0000-0000-0000-000000000001	\N	Estos precios no incluyen IVA.\nVigencia de la presente cotización 8 días a partir de su elaboración.\nAnticipar una semana antes de la fecha de inicio de trabajo para verificar disponibilidad.
0b142d5d-e3c7-47e2-a458-b6479b71eff0	COT-20261108-E87C36	ff2b4f34-2003-42aa-b72f-9e015c281293	Renta de gondulas al ayuntamiento de Santiago	120000.00	2026-11-08	ACEPTADA	t	2026-11-08 00:38:17.657-06	2026-11-14 00:05:29.170728-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	c0000000-0000-0000-0000-000000000001	\N	Estos precios no incluyen IVA.\nVigencia de la presente cotización 8 días a partir de su elaboración.\nAnticipar una semana antes de la fecha de inicio de trabajo para verificar disponibilidad.
cb2d568d-63ac-4250-8bdd-55bdc8b4f068	COT-20261113-93214B	34b9e169-6dfd-4e59-b6ff-dd2ef6f998a4	sssssss	333333.00	2026-11-13	ACEPTADA	t	2026-11-13 05:43:30.438-06	2026-11-14 00:05:29.170728-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	c0000000-0000-0000-0000-000000000001	\N	Estos precios no incluyen IVA.\nVigencia de la presente cotización 8 días a partir de su elaboración.\nAnticipar una semana antes de la fecha de inicio de trabajo para verificar disponibilidad.
22da26e4-969a-4e9d-88a1-5134e03a8331	COT-20261112-DD7945	cc2f4d26-2ef8-4579-8ca6-6a8e5006daae	SMOKE B1 - renta con partidas	30500.00	2026-11-12	ACEPTADA	t	2026-11-13 06:13:44.565-06	2026-11-14 00:05:29.170728-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	c0000000-0000-0000-0000-000000000001	\N	Estos precios no incluyen IVA.
\.


--
-- Data for Name: cuentas_bancarias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cuentas_bancarias (id, banco_id, numero, nombre, saldo_inicial, activo, creado_en, actualizado_en, creado_por) FROM stdin;
\.


--
-- Data for Name: cuentas_por_cobrar; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cuentas_por_cobrar (id, cliente_id, factura_id, bitacora_id, monto, monto_pagado, fecha_vencimiento, estado, activo, creado_en, actualizado_en, proyecto_id) FROM stdin;
d977c82e-43a9-46a4-ab76-fcff85545202	34b9e169-6dfd-4e59-b6ff-dd2ef6f998a4	885fae50-1e64-4cf2-9fb4-6ba0a565baae	\N	386666.28	0.00	2026-12-13	PENDIENTE	t	2026-11-13 05:43:40.477-06	2026-11-13 05:43:40.477-06	\N
b9f0679e-2e44-46b9-88f4-55c2cf3c7f73	cc2f4d26-2ef8-4579-8ca6-6a8e5006daae	2edcc996-8057-4769-920e-99a6e0d78091	\N	35380.00	0.00	2026-12-13	PENDIENTE	t	2026-11-13 06:13:44.979-06	2026-11-13 06:13:44.979-06	\N
9273f2f4-5842-430f-932d-9241270a4bbe	34b9e169-6dfd-4e59-b6ff-dd2ef6f998a4	\N	\N	84500.00	0.00	2026-12-02	PENDIENTE	t	2026-11-07 20:34:16.448-06	2026-11-07 20:34:16.437-06	\N
56cfd076-7f52-448d-9d41-bbdba3ffb071	34b9e169-6dfd-4e59-b6ff-dd2ef6f998a4	\N	\N	32000.00	0.00	2026-10-30	PENDIENTE	t	2026-11-07 20:34:16.477-06	2026-11-07 20:34:16.474-06	\N
524c67c6-0b8f-41c7-b24f-46c10c099a0b	e0ee77c3-441b-4dfb-82c4-225611e0815c	\N	\N	156000.00	0.00	2026-09-23	PENDIENTE	t	2026-11-07 20:34:16.489-06	2026-11-07 20:34:16.486-06	\N
e2459470-6146-4ac4-bfd3-45cf47c2948f	8e38241a-6951-4ca7-b971-38a10c4ccf27	\N	\N	98000.00	40000.00	2026-11-22	PARCIAL	t	2026-11-07 20:34:16.502-06	2026-11-07 14:34:16.603071-06	\N
08da46c2-b580-4553-b251-0554844a245e	7411b3d0-e334-4afe-8634-92d24a05b1fd	\N	\N	215000.00	80000.00	2026-10-26	PARCIAL	t	2026-11-07 20:34:16.711-06	2026-11-07 14:34:16.76322-06	\N
db609eea-c41b-46d0-8b60-232fb69c9eb7	ff2b4f34-2003-42aa-b72f-9e015c281293	\N	\N	67400.00	67400.00	2026-10-08	PAGADO	t	2026-11-07 20:34:16.784-06	2026-11-07 14:34:16.817131-06	\N
4442eff6-b2e5-4d8e-b754-68cd1d68b6c1	ff2b4f34-2003-42aa-b72f-9e015c281293	\N	\N	45000.00	0.00	\N	PENDIENTE	t	2026-11-07 20:34:16.842-06	2026-11-07 20:34:16.839-06	\N
aae2b5b9-c27f-4e67-9c46-450d1adb7b4e	3811dfb6-8263-4d9f-8ba5-2d2b2f304102	\N	\N	124800.00	124800.00	2026-10-18	PAGADO	t	2026-11-07 20:34:16.854-06	2026-11-07 14:34:16.864814-06	\N
9d9d1679-fb1b-49a8-a1ec-60197d6a17a3	f600f831-a44a-4930-9fc0-8e5ec1ee9450	b292c87f-7b5f-46a9-bf2c-3ad3ed102a2b	\N	522000.00	0.00	2026-12-08	PENDIENTE	t	2026-11-08 00:33:18.351-06	2026-11-08 00:33:18.351-06	\N
\.


--
-- Data for Name: cuentas_por_pagar; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cuentas_por_pagar (id, proveedor_id, orden_compra_id, monto, monto_pagado, fecha_vencimiento, estado, activo, creado_en, actualizado_en) FROM stdin;
577bea4f-2709-4eb2-ae2f-aebd0dc7b42b	22d61153-008b-479f-bd4b-3df58f7f5b2f	914684c3-7af2-4a1c-b93c-b31a8ca4c9a1	21600.00	21600.00	\N	PAGADA	t	2026-11-06 19:53:44.668-06	2026-11-06 20:22:12.509-06
40fd8d66-b072-460e-b5e6-be7d8f1027ad	2718c4b8-f7d9-45b2-a5dc-f4521866997b	29cbf63f-88cb-4f11-9b72-75462db45e32	700.00	300.00	\N	PARCIAL	t	2026-11-06 19:55:46.918-06	2026-11-13 19:20:38.257-06
07b30162-c789-498a-b3bd-8332328e6d6a	22d61153-008b-479f-bd4b-3df58f7f5b2f	afb84d0b-ffb5-4b28-b4a1-53f7cfd138dc	200.00	110.00	2027-01-10	PARCIAL	t	2026-11-13 18:11:09.772-06	2026-11-13 19:37:08.597-06
\.


--
-- Data for Name: deducciones_nomina; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deducciones_nomina (id, nomina_id, concepto, tipo, monto, activo, creado_en, actualizado_en) FROM stdin;
602fb175-fd43-4d70-9eab-8861bd8f43a9	6c8982ca-3ecb-4e0e-b2d3-87b9f7bab1fb	3 inasistencia(s) detectada(s)	FALTA_AUTO	2700.00	t	2026-11-04 20:40:00.313-06	2026-11-04 20:40:00.311-06
455fe56a-d6ee-4267-afd1-136fa9aad73e	77199855-44a9-48c3-8054-fa6b9ce97846	3 inasistencia(s) detectada(s)	FALTA_AUTO	3500.00	t	2026-11-04 20:40:00.335-06	2026-11-04 20:40:00.335-06
6ff41c41-ff94-425c-beb5-f692e3ee04b0	1cdfe003-5012-4ac4-b843-572ea9a0a627	3 inasistencia(s) detectada(s)	FALTA_AUTO	2400.00	t	2026-11-04 20:40:00.346-06	2026-11-04 20:40:00.344-06
d3dda7db-1fe9-445c-a6a7-b6f0fa01e46c	9aa4473f-a252-45a7-bd6c-d0aecc1021c6	3 inasistencia(s) detectada(s)	FALTA_AUTO	3500.00	t	2026-11-04 20:40:00.356-06	2026-11-04 20:40:00.356-06
584337e2-2d59-4878-b0e9-546f837879a1	9d4f8461-8773-4893-adc3-f5d3e48858d9	3 inasistencia(s) detectada(s)	FALTA_AUTO	5500.00	t	2026-11-04 20:40:00.365-06	2026-11-04 20:40:00.365-06
c5ab67f2-e82c-4742-8e73-ca1514aad6d7	66d4b243-6a0f-46d7-96e0-5c9f6a2d5c0b	3 inasistencia(s) detectada(s)	FALTA_AUTO	3000.00	t	2026-11-04 20:40:00.375-06	2026-11-04 20:40:00.374-06
\.


--
-- Data for Name: despachos_maquina; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.despachos_maquina (id, codigo, maquina_id, proyecto_id, fecha_inicio, fecha_fin, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, operador_id) FROM stdin;
c00b78c6-8312-4868-8737-56f64da2a3cb	DSP001	b7bb9152-0851-4372-9e55-b393fa7da463	00692bdb-27d2-4e7b-be62-16c2977e1650	2025-04-20	2025-05-02	t	2026-08-21 02:14:59.07-06	2026-08-21 02:14:59.07-06	\N	\N	\N	\N
23f62901-8acf-4baf-acc0-016eb3137deb	DSP002	27800748-89c1-4900-8b5d-31926fc63836	21b6cf72-c07c-40e8-aac6-b538511f5127	2025-04-25	2025-04-29	t	2026-08-21 02:14:59.071-06	2026-08-21 02:14:59.071-06	\N	\N	\N	\N
e7fc1ff4-96d1-4460-a680-1469eb8e338d	DSP004	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	00692bdb-27d2-4e7b-be62-16c2977e1650	2025-04-22	2025-04-30	t	2026-08-21 02:14:59.072-06	2026-08-21 02:14:59.072-06	\N	\N	\N	\N
\.


--
-- Data for Name: dias_asistencia_semana; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dias_asistencia_semana (id, asistencia_semanal_id, dia, estado, horas_trabajadas, horas_extra, en_sitio_gps, motivo, activo, actualizado_en, actualizado_por, creado_en, creado_por, eliminado_en, fecha, hora_entrada, hora_salida) FROM stdin;
a7b3162e-44d4-495f-9705-e8306314b16f	9ae6581e-43c8-4578-aadf-ecddb50198e2	LUN	PUNTUAL	8.00	2.00	t	\N	t	2026-08-21 02:14:59.104-06	\N	2026-08-21 02:14:59.104-06	\N	\N	2025-04-21	06:55:00	17:00:00
fef3091c-d103-4056-a688-ea266728ac41	9ae6581e-43c8-4578-aadf-ecddb50198e2	MAR	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.104-06	\N	2026-08-21 02:14:59.104-06	\N	\N	2025-04-22	07:00:00	17:00:00
5893f49d-23af-41d9-b465-87095c881b79	9ae6581e-43c8-4578-aadf-ecddb50198e2	MIE	RETARDO	8.00	1.00	t	\N	t	2026-08-21 02:14:59.104-06	\N	2026-08-21 02:14:59.104-06	\N	\N	2025-04-23	07:22:00	17:00:00
5198b34b-8d3b-48c7-9425-47b24af8a826	9ae6581e-43c8-4578-aadf-ecddb50198e2	JUE	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.104-06	\N	2026-08-21 02:14:59.104-06	\N	\N	2025-04-24	06:58:00	17:00:00
e1daf998-988e-46e3-b008-8b6903addae2	9ae6581e-43c8-4578-aadf-ecddb50198e2	VIE	PUNTUAL	8.00	3.50	t	\N	t	2026-08-21 02:14:59.104-06	\N	2026-08-21 02:14:59.104-06	\N	\N	2025-04-25	07:02:00	17:00:00
6a6737bd-1f61-408d-97bc-22162a57b42b	9ae6581e-43c8-4578-aadf-ecddb50198e2	SAB	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.104-06	\N	2026-08-21 02:14:59.104-06	\N	\N	2025-04-26	07:00:00	15:00:00
592115c3-e772-47de-a40e-af4a780470a7	511a9fcd-b046-4f24-84c0-74d9ba1f995b	LUN	PUNTUAL	8.00	2.00	t	\N	t	2026-08-21 02:14:59.109-06	\N	2026-08-21 02:14:59.109-06	\N	\N	2025-04-21	06:50:00	17:00:00
7d7213bc-fbbf-46b1-a4c2-c608259a9acf	511a9fcd-b046-4f24-84c0-74d9ba1f995b	MAR	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.109-06	\N	2026-08-21 02:14:59.109-06	\N	\N	2025-04-22	06:55:00	17:00:00
dfcf807c-379c-4582-b172-949e7873750e	511a9fcd-b046-4f24-84c0-74d9ba1f995b	MIE	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.109-06	\N	2026-08-21 02:14:59.109-06	\N	\N	2025-04-23	06:58:00	17:00:00
be3e053e-68e1-4a97-9252-96166c051bb5	511a9fcd-b046-4f24-84c0-74d9ba1f995b	JUE	PUNTUAL	8.00	2.50	t	\N	t	2026-08-21 02:14:59.109-06	\N	2026-08-21 02:14:59.109-06	\N	\N	2025-04-24	06:52:00	17:00:00
edce9426-6767-4191-bae4-150a92d73522	511a9fcd-b046-4f24-84c0-74d9ba1f995b	VIE	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.109-06	\N	2026-08-21 02:14:59.109-06	\N	\N	2025-04-25	06:58:00	17:00:00
406e0076-948f-4d3b-8537-5f5414884977	511a9fcd-b046-4f24-84c0-74d9ba1f995b	SAB	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.109-06	\N	2026-08-21 02:14:59.109-06	\N	\N	2025-04-26	07:00:00	15:00:00
c39d04bf-cecb-424d-94df-4fe7a741ed7b	6194964e-9325-4213-9cdf-3902c62c54bc	LUN	RETARDO	8.00	0.00	t	\N	t	2026-08-21 02:14:59.114-06	\N	2026-08-21 02:14:59.114-06	\N	\N	2025-04-21	07:45:00	17:00:00
6b2331dc-7268-4467-9121-29ffc9fd7ba8	6194964e-9325-4213-9cdf-3902c62c54bc	MAR	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.114-06	\N	2026-08-21 02:14:59.114-06	\N	\N	2025-04-22	07:05:00	17:00:00
f5a5c3c3-7908-4253-be41-144948e4e636	6194964e-9325-4213-9cdf-3902c62c54bc	MIE	FALTA	0.00	0.00	f	Inasistencia no justificada	t	2026-08-21 02:14:59.114-06	\N	2026-08-21 02:14:59.114-06	\N	\N	2025-04-23	\N	\N
ecd86727-5796-402f-acb7-71a491d2ef12	6194964e-9325-4213-9cdf-3902c62c54bc	JUE	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.114-06	\N	2026-08-21 02:14:59.114-06	\N	\N	2025-04-24	07:00:00	17:00:00
38480b90-564d-4291-b743-abb0751e3553	6194964e-9325-4213-9cdf-3902c62c54bc	VIE	RETARDO	8.00	0.00	f	Marcaje fuera de geocerca	t	2026-08-21 02:14:59.114-06	\N	2026-08-21 02:14:59.114-06	\N	\N	2025-04-25	08:15:00	17:00:00
f1990084-3c3f-4b3a-b8b2-c5e4bb27fa6b	6194964e-9325-4213-9cdf-3902c62c54bc	SAB	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.114-06	\N	2026-08-21 02:14:59.114-06	\N	\N	2025-04-26	07:00:00	15:00:00
5f6f685b-1962-4ca7-a268-817959c0248b	9f60d932-a357-42e2-a7c3-d9532738df5b	LUN	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.118-06	\N	2026-08-21 02:14:59.118-06	\N	\N	2025-04-21	08:30:00	17:00:00
5832fd24-3bbc-4cdb-8dcd-f22d00252aec	9f60d932-a357-42e2-a7c3-d9532738df5b	MAR	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.118-06	\N	2026-08-21 02:14:59.118-06	\N	\N	2025-04-22	08:28:00	17:00:00
5baf8eab-7f3d-4d1f-8bdc-8fe04e8072f0	9f60d932-a357-42e2-a7c3-d9532738df5b	MIE	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.118-06	\N	2026-08-21 02:14:59.118-06	\N	\N	2025-04-23	08:30:00	17:00:00
78036009-0791-469d-a297-9da4514bb5d9	9f60d932-a357-42e2-a7c3-d9532738df5b	JUE	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.118-06	\N	2026-08-21 02:14:59.118-06	\N	\N	2025-04-24	08:25:00	17:00:00
462ca95b-cf9a-4b3f-9f84-1528a28fab01	9f60d932-a357-42e2-a7c3-d9532738df5b	VIE	SALIDA_ANTICIPADA	5.75	0.00	t	Cita médica IMSS	t	2026-08-21 02:14:59.118-06	\N	2026-08-21 02:14:59.118-06	\N	\N	2025-04-25	08:30:00	14:15:00
a05f8140-495d-4f0a-a19b-5d4aacd6a9b9	9f60d932-a357-42e2-a7c3-d9532738df5b	SAB	PUNTUAL	6.00	0.00	t	\N	t	2026-08-21 02:14:59.118-06	\N	2026-08-21 02:14:59.118-06	\N	\N	2025-04-26	08:30:00	14:30:00
\.


--
-- Data for Name: documento_etiquetas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documento_etiquetas (documento_id, etiqueta_id) FROM stdin;
\.


--
-- Data for Name: documento_versiones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documento_versiones (id, documento_id, numero_version, nombre_archivo, url_archivo, tamano_bytes, hash_sha256, cambios, subido_por, activo, creado_en) FROM stdin;
\.


--
-- Data for Name: documentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documentos (id, nombre, tipo, categoria, tamano_bytes, propietario, trabajador_id, url_archivo, activo, creado_en, actualizado_en, codigo, actualizado_por, descripcion, eliminado_en, es_publico, estado, extension, fecha_documento, fecha_vigencia, firmado, formato, hash_sha256, maquina_id, mime_type, nombre_almacenamiento, palabras_clave, propietario_id, propietario_tipo, proveedor_id, proyecto_id, requiere_firma, subido_por, url_thumbnail, version_actual) FROM stdin;
270c52eb-715a-4612-a5ec-fd53c66f3041	Contrato_Laboral_Juan_Perez.pdf	CONTRATO	PERSONAL	1887437	Juan Pérez	d69e3ac7-f268-4533-a7ed-780c000f4ad7	(pendiente de carga — metadata heredada del mock, D001)	t	2026-08-21 02:14:59.133-06	2026-08-21 02:14:59.133-06	D001	\N	\N	\N	f	PUBLICADO	\N	2022-03-15	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
63ff5445-2e4d-45f9-89bd-9ce56311ffa3	INE_Juan_Perez.jpg	IDENTIFICACION	PERSONAL	1258291	Juan Pérez	d69e3ac7-f268-4533-a7ed-780c000f4ad7	(pendiente de carga — metadata heredada del mock, D002)	t	2026-08-21 02:14:59.137-06	2026-08-21 02:14:59.137-06	D002	\N	\N	\N	f	PUBLICADO	\N	2022-03-15	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
c97bfcff-2b18-4bac-8414-640a6d0bd0d2	Contrato_Laboral_Pedro_Gomez.pdf	CONTRATO	PERSONAL	1782579	Pedro Gómez	ea344f07-0905-4881-a64b-b7315f0bfe97	(pendiente de carga — metadata heredada del mock, D003)	t	2026-08-21 02:14:59.138-06	2026-08-21 02:14:59.138-06	D003	\N	\N	\N	f	PUBLICADO	\N	2021-08-01	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
0f64c2ca-f286-4df5-91f9-23997e642ba6	INE_Ana_Martinez.jpg	IDENTIFICACION	PERSONAL	943718	Ana Martínez	f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	(pendiente de carga — metadata heredada del mock, D004)	t	2026-08-21 02:14:59.139-06	2026-08-21 02:14:59.139-06	D004	\N	\N	\N	f	PUBLICADO	\N	2020-01-10	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
3e6085fa-05ef-4a1c-b63b-6a6b972535c8	Contrato_Laboral_Luis_Torres.pdf	CONTRATO	PERSONAL	1677722	Luis Torres	fe2ec7b7-7fda-4c09-af19-279f41215d06	(pendiente de carga — metadata heredada del mock, D005)	t	2026-08-21 02:14:59.14-06	2026-08-21 02:14:59.14-06	D005	\N	\N	\N	f	PUBLICADO	\N	2023-06-20	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
f0252a77-cff1-4d80-b32a-3c0f32fcc625	Contrato_Valle_Sur_Fase1.pdf	CONTRATO	PROYECTOS	2516582	Inmobiliaria ARCO	\N	(pendiente de carga — metadata heredada del mock, D006)	t	2026-08-21 02:14:59.142-06	2026-08-21 02:14:59.142-06	D006	\N	\N	\N	f	PUBLICADO	\N	2025-01-10	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
648170d1-3436-4f3d-9928-577dc2dfdf9d	Permiso_Obra_Valle_Sur.pdf	PERMISO	PROYECTOS	734003	Inmobiliaria ARCO	\N	(pendiente de carga — metadata heredada del mock, D007)	t	2026-08-21 02:14:59.144-06	2026-08-21 02:14:59.144-06	D007	\N	\N	\N	f	PUBLICADO	\N	2025-01-05	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
0505bb5f-e488-435d-84e4-3d306b8c26c8	Contrato_Centro_Historico.pdf	CONTRATO	PROYECTOS	3250586	Gobierno CDMX	\N	(pendiente de carga — metadata heredada del mock, D008)	t	2026-08-21 02:14:59.146-06	2026-08-21 02:14:59.146-06	D008	\N	\N	\N	f	PUBLICADO	\N	2025-03-01	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
44286777-a655-46c1-9251-fe53ff2906d9	Factura_Excavadora_CAT320.pdf	FACTURA	MAQUINARIA	1153434	SVR Constructora	\N	(pendiente de carga — metadata heredada del mock, D009)	t	2026-08-21 02:14:59.147-06	2026-08-21 02:14:59.147-06	D009	\N	\N	\N	f	PUBLICADO	\N	2023-05-10	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
faf652e7-3897-4b3c-b22d-f93717d9fedd	Poliza_Seguro_Flota_2025.pdf	POLIZA	MAQUINARIA	2097152	SVR Constructora	\N	(pendiente de carga — metadata heredada del mock, D010)	t	2026-08-21 02:14:59.149-06	2026-08-21 02:14:59.149-06	D010	\N	\N	\N	f	PUBLICADO	\N	2025-01-01	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
aa82c9e6-7b7f-481c-a2c0-6cd45ba3734a	Manual_Liebherr_LTM.pdf	MANUAL	MAQUINARIA	14680064	SVR Constructora	\N	(pendiente de carga — metadata heredada del mock, D011)	t	2026-08-21 02:14:59.151-06	2026-08-21 02:14:59.151-06	D011	\N	\N	\N	f	PUBLICADO	\N	2022-11-20	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
761f8197-8dd2-4cd1-a2e1-5952f0bfc4bd	Factura_Diesel_Abril_2025.pdf	FACTURA	CONTABILIDAD	524288	SVR Constructora	\N	(pendiente de carga — metadata heredada del mock, D012)	t	2026-08-21 02:14:59.153-06	2026-08-21 02:14:59.153-06	D012	\N	\N	\N	f	PUBLICADO	\N	2025-04-27	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
b83de370-fd38-4899-b691-29cd5318a4be	Estado_Cuenta_Abril_2025.pdf	FACTURA	CONTABILIDAD	838861	SVR Constructora	\N	(pendiente de carga — metadata heredada del mock, D013)	t	2026-08-21 02:14:59.154-06	2026-08-21 02:14:59.154-06	D013	\N	\N	\N	f	PUBLICADO	\N	2025-04-30	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
\.


--
-- Data for Name: etiquetas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.etiquetas (id, nombre, color, entidad, activo, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: factura_conceptos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.factura_conceptos (id, factura_id, cantidad, unidad, descripcion, valor_unitario, importe, descuento, objeto_impuesto, impuesto_tasa, impuesto_importe, referencia_tipo, referencia_id, activo) FROM stdin;
09c12dc5-05d5-4022-a7ec-c743e509f5d3	b292c87f-7b5f-46a9-bf2c-3ad3ed102a2b	1.0000	Servicio	Movimiento de tierras Valle Sur - Fase 2	450000.00	450000.00	0.00	04	0.1600	72000.00	\N	\N	t
90e13ccf-4460-4e19-ad74-79e6d2c74471	885fae50-1e64-4cf2-9fb4-6ba0a565baae	1.0000	Servicio	sssssss	333333.00	333333.00	0.00	04	0.1600	53333.28	\N	\N	t
94935bba-6242-431f-b9c0-f15b4f8d8be3	2edcc996-8057-4769-920e-99a6e0d78091	1.0000	DIA	VIBROCOMPACTADOR BOMAG	5500.00	5500.00	0.00	04	0.1600	880.00	\N	\N	t
ae6d2e70-6f62-431b-b4d5-2e1ddae6a7fd	2edcc996-8057-4769-920e-99a6e0d78091	1.0000	DIA	TRASLADO IDA Y VUELTA	9000.00	9000.00	0.00	04	0.1600	1440.00	\N	\N	t
e148c845-8520-4cf0-b746-2374a520931d	2edcc996-8057-4769-920e-99a6e0d78091	2.0000	DIA	PIPA CAP 20,000 LTS	8000.00	16000.00	0.00	04	0.1600	2560.00	\N	\N	t
\.


--
-- Data for Name: facturas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.facturas (id, codigo, serie, folio, uuid_cfdi, cliente_id, periodo_inicio, periodo_fin, subtotal, impuestos, total, moneda, tipo_cambio, forma_pago, metodo_pago, uso_cfdi, estado, xml_url, pdf_url, timbrado_en, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en, cotizacion_id) FROM stdin;
885fae50-1e64-4cf2-9fb4-6ba0a565baae	FAC-2026-0002	F	000002	\N	34b9e169-6dfd-4e59-b6ff-dd2ef6f998a4	\N	\N	333333.00	53333.28	386666.28	MXN	1.0000	\N	\N	\N	PENDIENTE	\N	\N	\N	t	2026-11-13 05:43:40.451-06	2026-11-13 05:43:40.451-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	cb2d568d-63ac-4250-8bdd-55bdc8b4f068
b292c87f-7b5f-46a9-bf2c-3ad3ed102a2b	FAC-2026-0001	F	000001	\N	f600f831-a44a-4930-9fc0-8e5ec1ee9450	\N	\N	450000.00	72000.00	522000.00	MXN	1.0000	\N	\N	\N	TIMBRADA	\N	\N	2026-11-12 23:41:14.619-06	t	2026-11-08 00:33:18.308-06	2026-11-12 17:41:14.622888-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	10039415-ed0a-4c40-a1a6-7b6b639dc62f
2edcc996-8057-4769-920e-99a6e0d78091	FAC-2026-0003	F	000003	\N	cc2f4d26-2ef8-4579-8ca6-6a8e5006daae	\N	\N	30500.00	4880.00	35380.00	MXN	1.0000	\N	\N	\N	PENDIENTE	\N	\N	\N	t	2026-11-13 06:13:44.963-06	2026-11-13 06:13:44.963-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	22da26e4-969a-4e9d-88a1-5134e03a8331
\.


--
-- Data for Name: fallas_mecanicas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fallas_mecanicas (id, codigo, maquina_id, reporto_id, diagnostico, sistema_afectado, severidad, estado, fecha_reporte, fecha_resolucion, costo_reparacion, mantenimiento_id, imagenes, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
\.


--
-- Data for Name: firmas_cliente; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.firmas_cliente (id, bitacora_id, firmado, nombre_residente, cargo_residente, activo, actualizado_en, actualizado_por, archivo_firma, creado_en, creado_por, eliminado_en, fecha_firma) FROM stdin;
3d8d3463-3b38-43ab-8593-8422c8b64b24	e71db8bb-8c68-488b-92f1-cc4b6b9f3115	t	Ing. Roberto Garza	Residente de Obra · Inmobiliaria ARCO	t	2026-08-21 02:14:59.076-06	\N	\N	2026-08-21 02:14:59.076-06	\N	\N	2025-04-27 17:45:00-06
9dcab8b0-be1a-48c0-878c-61bada6a8c85	972b3c29-cf18-4de3-af2e-774941f8116e	t	Arq. Manuel Morales	Supervisor Obras CDMX	t	2026-08-21 02:14:59.08-06	\N	\N	2026-08-21 02:14:59.08-06	\N	\N	2025-04-27 15:15:00-06
16d7303f-c696-4c04-834c-d0a0dea92d0b	18a90b16-13de-454d-80d4-d05f8d03928d	t	Ing. Fernando Silva	Jefe de Frente SCT	t	2026-11-13 18:10:11.070067-06	c0000000-0000-0000-0000-000000000001	\N	2026-08-21 02:14:59.084-06	\N	\N	2026-11-14 00:10:11.068-06
\.


--
-- Data for Name: firmas_digitales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.firmas_digitales (id, documento_id, firmado_por_tipo, firmado_por_id, nombre_firmante, cargo_firmante, correo_firmante, hash_documento, datos_firma, imagen_firma_url, fecha_firma, ip_firma, activo, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: geocerca_maquinas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.geocerca_maquinas (id, geocerca_id, maquina_id, dentro, ultima_entrada, ultima_salida) FROM stdin;
\.


--
-- Data for Name: geocercas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.geocercas (id, nombre, tipo, color, centro_lat, centro_lng, radio_metros, activa, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
\.


--
-- Data for Name: hitos_progreso; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hitos_progreso (id, proyecto_id, planificado, "real", creado_en, activo, actualizado_en, actualizado_por, creado_por, descripcion, eliminado_en, nombre, periodo, fecha) FROM stdin;
77de7e9b-61d4-462f-92d8-40798fe14a15	00692bdb-27d2-4e7b-be62-16c2977e1650	10.00	8.00	2026-08-21 02:14:59.021-06	t	2026-08-21 02:14:59.021-06	\N	\N	\N	\N	\N	Ene	\N
45ae5e34-ef14-4a72-a8c3-e87afa828a1b	00692bdb-27d2-4e7b-be62-16c2977e1650	30.00	25.00	2026-08-21 02:14:59.021-06	t	2026-08-21 02:14:59.021-06	\N	\N	\N	\N	\N	Feb	\N
810a1850-c6bd-4fb7-b1de-139963ca88d2	00692bdb-27d2-4e7b-be62-16c2977e1650	50.00	48.00	2026-08-21 02:14:59.021-06	t	2026-08-21 02:14:59.021-06	\N	\N	\N	\N	\N	Mar	\N
0f0744a4-310c-4d2d-8aa4-a26b019a4793	00692bdb-27d2-4e7b-be62-16c2977e1650	75.00	72.00	2026-08-21 02:14:59.021-06	t	2026-08-21 02:14:59.021-06	\N	\N	\N	\N	\N	Abr	\N
261b2c9e-cd53-48b0-9bef-c3ae6b5ba8ed	00692bdb-27d2-4e7b-be62-16c2977e1650	90.00	85.00	2026-08-21 02:14:59.021-06	t	2026-08-21 02:14:59.021-06	\N	\N	\N	\N	\N	May	\N
5dda2431-e232-481f-8f00-87f05e025fc5	21b6cf72-c07c-40e8-aac6-b538511f5127	15.00	10.00	2026-08-21 02:14:59.027-06	t	2026-08-21 02:14:59.027-06	\N	\N	\N	\N	\N	Mar	\N
b80804ea-cf11-4c93-969c-ff71b6195e36	21b6cf72-c07c-40e8-aac6-b538511f5127	30.00	28.00	2026-08-21 02:14:59.027-06	t	2026-08-21 02:14:59.027-06	\N	\N	\N	\N	\N	Abr	\N
210cad5b-896c-4f4d-b015-a66f60c5dbc4	21b6cf72-c07c-40e8-aac6-b538511f5127	45.00	32.00	2026-08-21 02:14:59.027-06	t	2026-08-21 02:14:59.027-06	\N	\N	\N	\N	\N	May	\N
5a0fdb74-16cf-4675-80cb-f4a7d958880c	caf3c621-4982-4b27-bef3-02c362cb96a6	20.00	20.00	2026-08-21 02:14:59.033-06	t	2026-08-21 02:14:59.033-06	\N	\N	\N	\N	\N	Nov	\N
f1122aa7-f9e0-45b3-8375-73d4c56900e9	caf3c621-4982-4b27-bef3-02c362cb96a6	45.00	40.00	2026-08-21 02:14:59.033-06	t	2026-08-21 02:14:59.033-06	\N	\N	\N	\N	\N	Dic	\N
d0063fc0-089d-4a5c-a3cb-f4d783e7bcb0	caf3c621-4982-4b27-bef3-02c362cb96a6	70.00	72.00	2026-08-21 02:14:59.033-06	t	2026-08-21 02:14:59.033-06	\N	\N	\N	\N	\N	Ene	\N
b081dd2f-79de-49be-9d16-ac7b81e26135	caf3c621-4982-4b27-bef3-02c362cb96a6	90.00	88.00	2026-08-21 02:14:59.033-06	t	2026-08-21 02:14:59.033-06	\N	\N	\N	\N	\N	Feb	\N
4e80ad43-4012-438b-ac08-7bd4666cf7e5	caf3c621-4982-4b27-bef3-02c362cb96a6	100.00	100.00	2026-08-21 02:14:59.033-06	t	2026-08-21 02:14:59.033-06	\N	\N	\N	\N	\N	Mar	\N
\.


--
-- Data for Name: horas_extra_asistencia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.horas_extra_asistencia (id, registro_asistencia_id, horas_calculadas, tarifa_por_hora, monto_total, estado, motivo, lat_inicio, lng_inicio, lat_fin, lng_fin, creado_en, actualizado_en, activo, actualizado_por, aprobador_id, creado_por, eliminado_en, inicio, fin) FROM stdin;
aff9cced-a98f-456d-8a15-1bdb032078c7	2dc12a6b-60bf-4f4c-b8d4-2baa1fad2b6b	3.50	80.00	280.00	APROBADO	Colado continuo de cimentación y losa	19.342300	-99.184100	19.342600	-99.184200	2026-08-21 02:14:59.089-06	2026-08-21 02:14:59.089-06	t	\N	\N	\N	\N	17:00:00	20:30:00
fe430fc4-2089-4749-9bfb-86374522e2cf	4b2a99c1-a97c-4505-84ec-989221a655a0	2.50	75.00	187.50	APROBADO	Nivelación nocturna de terreno para pavimentación	19.432800	-99.133000	\N	\N	2026-08-21 02:14:59.094-06	2026-08-21 02:14:59.094-06	t	\N	\N	\N	\N	16:30:00	19:00:00
\.


--
-- Data for Name: lecturas_horometro; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lecturas_horometro (id, maquina_id, fecha, lectura_inicial, lectura_final, horas_trabajadas, activo, creado_en, actualizado_en, codigo, actualizado_por, creado_por, eliminado_en, operador_id) FROM stdin;
d833b29d-310e-4baa-9728-d1e729398a5f	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	1237.50	1245.50	8.00	t	2026-08-21 02:14:59.065-06	2026-08-21 02:14:59.065-06	\N	\N	\N	\N	\N
9ee93fd3-627e-42fb-94fd-8bdd8771b59c	27800748-89c1-4900-8b5d-31926fc63836	2025-04-27	885.20	890.20	5.00	t	2026-08-21 02:14:59.067-06	2026-08-21 02:14:59.067-06	\N	\N	\N	\N	\N
b21b64ab-52b4-428f-9457-bc45d41a5aa0	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2025-04-27	3415.10	3421.10	6.00	t	2026-08-21 02:14:59.069-06	2026-08-21 02:14:59.069-06	\N	\N	\N	\N	\N
\.


--
-- Data for Name: licencias_trabajador; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.licencias_trabajador (id, trabajador_id, tipo, folio, creado_en, actualizado_en, activo, actualizado_por, archivo_url, categoria, creado_por, eliminado_en, vigencia_indefinida, vigencia) FROM stdin;
8c920828-94d3-45c6-878a-6380699234b8	d69e3ac7-f268-4533-a7ed-780c000f4ad7	Certificación DC-3 Excavadora Hidráulica	DC3-CAT-8921	2026-08-21 02:14:58.977-06	2026-08-21 02:14:58.977-06	t	\N	\N	DC3	\N	\N	f	2026-11-30
75181013-7651-4f34-bb96-f128dced9019	ea344f07-0905-4881-a64b-b7315f0bfe97	Certificación DC-3 Retroexcavadora	DC3-JD-4412	2026-08-21 02:14:58.984-06	2026-08-21 02:14:58.984-06	t	\N	\N	DC3	\N	\N	f	2026-08-15
5a159a7a-fdc1-4277-b69e-14ede24641b3	fe2ec7b7-7fda-4c09-af19-279f41215d06	Licencia Federal de Chofer Tipo E	SCT-FED-99882	2026-08-21 02:14:58.993-06	2026-08-21 02:14:58.993-06	t	\N	\N	LICENCIA_FEDERAL	\N	\N	f	2027-02-28
61e2c476-08f6-435d-bf52-e57a8d86d171	99ef344b-2f95-4dec-8f4f-dccc4bb43351	Certificado Diagnóstico Hidráulico CAT/JD	MEC-CAT-3321	2026-08-21 02:14:58.998-06	2026-08-21 02:14:58.998-06	t	\N	\N	CERTIFICADO_TECNICO	\N	\N	f	2027-10-15
c84c8205-b602-47ee-bb4c-cda67daa47ce	7ae68a33-6be6-46f3-8344-2dbf7389540d	Cédula Profesional Ing. Civil	CED-CIV-8849102	2026-08-21 02:14:59.004-06	2026-08-21 02:14:59.004-06	t	\N	\N	CEDULA_PROFESIONAL	\N	\N	t	\N
\.


--
-- Data for Name: maquina_componentes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maquina_componentes (id, maquina_id, nombre, marca, modelo, numero_serie, fecha_instalacion, vida_util_horas, horas_acumuladas, estado, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
\.


--
-- Data for Name: maquina_operadores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maquina_operadores (id, maquina_id, trabajador_id, fecha_inicio, fecha_fin, es_actual, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
\.


--
-- Data for Name: maquinas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maquinas (id, codigo, nombre, estado, combustible, horometro, operador_id, lat, lng, diesel_hoy, proximo_mantenimiento, imagen, consumo_esperado_lts_hora, rendimiento_actual_lts_hora, alerta_consumo_anormal, horas_operadas_hoy, activo, creado_en, actualizado_en, actualizado_por, anio, creado_por, eliminado_en, modelo, placas, serie, tipo_id) FROM stdin;
27800748-89c1-4900-8b5d-31926fc63836	M002	Retroexcavadora JD 310L	MANTENIMIENTO	42.00	890.20	ea344f07-0905-4881-a64b-b7315f0bfe97	19.428400	-99.127600	45.00	2026-04-28	\N	9.50	9.20	f	4.80	t	2026-08-21 02:14:59.01-06	2026-11-18 16:19:24.224669-06	\N	\N	\N	\N	\N	\N	\N	c1d7c6fb-3644-443e-a61f-fac9ac1f04ca
9c9760e5-66c9-4fbc-bf1f-b90745fd459d	M004	Camión Volteo Kenworth	MOVIMIENTO	15.00	3421.10	fe2ec7b7-7fda-4c09-af19-279f41215d06	19.476379	-99.123373	200.00	2026-05-05	\N	12.00	23.50	t	8.50	t	2026-08-21 02:14:59.014-06	2026-11-18 16:19:24.224669-06	\N	\N	\N	\N	\N	\N	\N	f0b44546-5e25-40ab-aea8-ad2fa5482c26
b7bb9152-0851-4372-9e55-b393fa7da463	M001	Excavadora CAT 320	ENCENDIDA	65.00	1245.50	d69e3ac7-f268-4533-a7ed-780c000f4ad7	19.413563	-99.190704	85.00	2026-05-20	\N	14.00	13.50	f	6.30	t	2026-08-21 02:14:59.008-06	2026-11-18 16:19:24.224669-06	\N	\N	\N	\N	\N	\N	\N	ee7d04d7-e77a-4875-b179-94a921fc5261
dba9c3c3-e696-4ce7-aaec-87970b37392d	M003	Grúa Liebherr LTM	APAGADA	88.00	456.80	\N	19.435000	-99.141200	0.00	2026-06-15	\N	16.00	15.80	f	0.00	t	2026-08-21 02:14:59.012-06	2026-11-18 16:19:24.224669-06	\N	\N	\N	\N	\N	\N	\N	f3b26935-7ef1-4105-a890-0c9fa6be4212
\.


--
-- Data for Name: materiales_criba; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.materiales_criba (id, nombre, articulo_id, creado_en, actualizado_en) FROM stdin;
99739f72-861b-436f-991d-61bba63e605a	Criba gruesa	c2000000-0000-0000-0000-000000000005	2026-11-13 20:47:06.008388-06	2026-11-13 20:47:06.008388-06
b007c692-c0df-4e44-a379-168e4a725aa3	Arena lavada	c2000000-0000-0000-0000-000000000001	2026-11-13 20:47:06.008388-06	2026-11-13 20:47:06.008388-06
d5ca7fab-d319-422d-815e-5dc06fa63a5a	Criba fina	c2000000-0000-0000-0000-000000000004	2026-11-13 20:47:06.008388-06	2026-11-13 20:47:06.008388-06
\.


--
-- Data for Name: movimientos_bancarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movimientos_bancarios (id, cuenta_id, fecha, descripcion, deposito, retiro, conciliado, transaccion_id, conciliado_en, conciliado_por, creado_en, actualizado_en, creado_por) FROM stdin;
\.


--
-- Data for Name: movimientos_inventario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movimientos_inventario (id, articulo_id, tipo, cantidad, stock_resultante, referencia_tipo, referencia_id, motivo, fecha, activo, creado_en, creado_por) FROM stdin;
85ca7596-febf-47dc-af4d-34a245f5db36	372d5385-6846-46de-bc2e-e15663ab8fc6	ENTRADA	6.00	18.00	ORDEN_COMPRA	9fd6e942-6346-45a4-b178-162ca76db6af	RECEPCION_OC	2026-11-06 17:46:47.567-06	t	2026-11-06 17:46:47.569-06	c0000000-0000-0000-0000-000000000001
d6fbc8ca-d76d-4404-9cd0-db8c86fad14b	5c3afc42-0623-46ad-988d-55b227a48673	ENTRADA	2.00	47.00	ORDEN_COMPRA	e1c1fd20-c63d-46d0-8f70-017991ab5e60	RECEPCION_OC	2026-11-06 17:46:47.617-06	t	2026-11-06 17:46:47.618-06	c0000000-0000-0000-0000-000000000001
03fc1248-147b-4624-9e97-04d8c0fd192d	b0a74063-1fd6-4b7e-ac55-bc3d8a56e0a9	ENTRADA	6.00	10.00	ORDEN_COMPRA	ad7b6314-3b24-444b-bf3d-fd57c481cb28	RECEPCION_OC	2026-11-06 17:47:11.956-06	t	2026-11-06 17:47:11.957-06	c0000000-0000-0000-0000-000000000001
ceaa3e4e-e4a1-47a6-a36f-c9405972a161	c2000000-0000-0000-0000-000000000012	ENTRADA	2.00	62.00	ORDEN_COMPRA	03445f0d-7919-4247-9cd9-693cde3d2bc3	RECEPCION_OC	2026-11-06 17:47:12.011-06	t	2026-11-06 17:47:12.012-06	c0000000-0000-0000-0000-000000000001
06560022-64e7-4e61-87fb-496eb144e53e	c2000000-0000-0000-0000-000000000003	ENTRADA	6.00	71.00	ORDEN_COMPRA	cfa73bd0-68f1-465b-85ff-4c0950d47e9d	RECEPCION_OC	2026-11-06 17:48:14.458-06	t	2026-11-06 17:48:14.46-06	c0000000-0000-0000-0000-000000000001
ce67d667-bc33-451c-b96c-b7ef3752ae56	c2000000-0000-0000-0000-000000000001	ENTRADA	2.00	122.00	ORDEN_COMPRA	2a1802d4-4ca2-4a72-bc2e-56425307db4c	RECEPCION_OC	2026-11-06 17:48:14.506-06	t	2026-11-06 17:48:14.507-06	c0000000-0000-0000-0000-000000000001
96b330b9-a739-48c4-b63a-fe12767880b7	c2000000-0000-0000-0000-000000000005	ENTRADA	6.00	41.00	ORDEN_COMPRA	5994993d-24de-4cd1-87fc-82468c941566	RECEPCION_OC	2026-11-06 17:48:40.841-06	t	2026-11-06 17:48:40.843-06	c0000000-0000-0000-0000-000000000001
44f7224f-3645-4fdb-b4bc-a73d19c8c583	c2000000-0000-0000-0000-000000000002	ENTRADA	2.00	82.00	ORDEN_COMPRA	bedf7009-da9e-40a1-ba01-98d01be1e3a1	RECEPCION_OC	2026-11-06 17:48:40.891-06	t	2026-11-06 17:48:40.892-06	c0000000-0000-0000-0000-000000000001
6f5a14b0-435e-4539-8684-a62b094efe86	c2000000-0000-0000-0000-000000000007	ENTRADA	6.00	96.00	ORDEN_COMPRA	3c11f0fc-7030-4870-b8ec-fd8a8ccdebd2	RECEPCION_OC	2026-11-06 17:49:04.182-06	t	2026-11-06 17:49:04.184-06	c0000000-0000-0000-0000-000000000001
c886891f-d8ef-4b07-8da8-8d314e333870	c2000000-0000-0000-0000-000000000011	ENTRADA	2.00	47.00	ORDEN_COMPRA	59bfb02f-1cd6-4e93-9934-952823ce2c32	RECEPCION_OC	2026-11-06 17:49:04.238-06	t	2026-11-06 17:49:04.239-06	c0000000-0000-0000-0000-000000000001
44b22aa0-5fd1-41b6-93a8-bd3e7671de32	c2000000-0000-0000-0000-000000000004	ENTRADA	6.00	46.00	ORDEN_COMPRA	a4f54bf3-0304-4659-acce-7ca4e9854bfa	RECEPCION_OC	2026-11-06 17:49:26.678-06	t	2026-11-06 17:49:26.679-06	c0000000-0000-0000-0000-000000000001
b8d79f3c-3ed9-4cf7-9d6e-05ed64a8d045	c2000000-0000-0000-0000-000000000006	ENTRADA	2.00	52.00	ORDEN_COMPRA	46c53bfb-3efe-43dd-8d43-1e88e5885153	RECEPCION_OC	2026-11-06 17:49:26.726-06	t	2026-11-06 17:49:26.728-06	c0000000-0000-0000-0000-000000000001
1fa3ff7f-8f03-453c-a6ae-e4cbb86ca326	c2000000-0000-0000-0000-000000000010	ENTRADA	6.00	206.00	ORDEN_COMPRA	05027b80-0740-4f1a-9eb9-9073d8b05963	RECEPCION_OC	2026-11-06 17:50:57.278-06	t	2026-11-06 17:50:57.28-06	c0000000-0000-0000-0000-000000000001
018c5eb9-d56e-4b3e-88fd-ad9d279110d7	c2000000-0000-0000-0000-000000000008	ENTRADA	2.00	802.00	ORDEN_COMPRA	89eeb06e-ff8d-4826-9598-a450e0148abb	RECEPCION_OC	2026-11-06 17:50:57.327-06	t	2026-11-06 17:50:57.328-06	c0000000-0000-0000-0000-000000000001
58845d46-e11d-4e7b-85fd-8433276e1c03	c2000000-0000-0000-0000-000000000009	ENTRADA	6.00	156.00	ORDEN_COMPRA	fb8909e6-c053-48c4-ac56-481c520836e5	RECEPCION_OC	2026-11-06 17:51:20.923-06	t	2026-11-06 17:51:20.925-06	c0000000-0000-0000-0000-000000000001
54769fba-f222-4082-8c7e-978a2437db29	372d5385-6846-46de-bc2e-e15663ab8fc6	ENTRADA	2.00	20.00	ORDEN_COMPRA	ab09cf5c-7ab8-439d-b83d-289a64f79a85	RECEPCION_OC	2026-11-06 17:51:20.974-06	t	2026-11-06 17:51:20.975-06	c0000000-0000-0000-0000-000000000001
b312cec7-8a55-48eb-9cbb-b12b9132ec06	5c3afc42-0623-46ad-988d-55b227a48673	ENTRADA	6.00	53.00	ORDEN_COMPRA	4872b645-93a0-46a5-8524-2493c975af75	RECEPCION_OC	2026-11-06 17:52:28.745-06	t	2026-11-06 17:52:28.746-06	c0000000-0000-0000-0000-000000000001
2f8cd1dd-2fec-41f2-a029-eca3701a165e	b0a74063-1fd6-4b7e-ac55-bc3d8a56e0a9	ENTRADA	2.00	12.00	ORDEN_COMPRA	da995e2f-cc8f-47e5-823b-0627e04a82c0	RECEPCION_OC	2026-11-06 17:52:28.796-06	t	2026-11-06 17:52:28.797-06	c0000000-0000-0000-0000-000000000001
5f0d6b94-0a92-4086-8805-9dd44e195ba3	c2000000-0000-0000-0000-000000000012	ENTRADA	6.00	68.00	ORDEN_COMPRA	8b287da1-9d34-4b4c-894f-6b36005808ed	RECEPCION_OC	2026-11-06 17:54:11.063-06	t	2026-11-06 17:54:11.065-06	c0000000-0000-0000-0000-000000000001
d4bcde52-c535-4367-b7b2-154e3671aad8	c2000000-0000-0000-0000-000000000003	ENTRADA	2.00	73.00	ORDEN_COMPRA	0dea8167-ba1c-4c14-b775-c78580ddd48d	RECEPCION_OC	2026-11-06 17:54:11.11-06	t	2026-11-06 17:54:11.111-06	c0000000-0000-0000-0000-000000000001
55f7f49d-9511-42d1-8a3b-c03b632c2bcf	5c3afc42-0623-46ad-988d-55b227a48673	ENTRADA	18.00	71.00	ORDEN_COMPRA	914684c3-7af2-4a1c-b93c-b31a8ca4c9a1	RECEPCION_OC	2026-11-06 20:22:21.11-06	t	2026-11-06 20:22:21.112-06	c0000000-0000-0000-0000-000000000001
c9d1b7b7-6b8a-4748-a2f3-81bc473777e2	c2000000-0000-0000-0000-000000000012	SALIDA	16.00	52.00	VENTA_POS	dc20f301-5f75-483d-883d-39d4df701453	Venta POS	2026-11-08 20:11:59.44-06	t	2026-11-08 20:11:59.449-06	c0000000-0000-0000-0000-000000000001
49714c80-9d77-4517-a33e-5891df4a185c	c2000000-0000-0000-0000-000000000009	ENTRADA	6.00	162.00	ORDEN_COMPRA	4bcf0162-c0d9-4d43-85c3-320ce4675c99	RECEPCION_OC	2026-11-13 05:28:04.334-06	t	2026-11-13 05:28:04.336-06	c0000000-0000-0000-0000-000000000001
61451399-c811-431a-876f-26f356bb1267	372d5385-6846-46de-bc2e-e15663ab8fc6	ENTRADA	2.00	22.00	ORDEN_COMPRA	58811660-3691-4010-a574-a0cbbf91c1ce	RECEPCION_OC	2026-11-13 05:28:04.392-06	t	2026-11-13 05:28:04.393-06	c0000000-0000-0000-0000-000000000001
ff31d2ce-44c8-4e94-8b28-51e8b6c8a7d8	c2000000-0000-0000-0000-000000000008	ENTRADA	6.00	808.00	ORDEN_COMPRA	d4187ede-322b-4711-a00f-bc7214cd8af0	RECEPCION_OC	2026-11-13 05:29:30.569-06	t	2026-11-13 05:29:30.57-06	c0000000-0000-0000-0000-000000000001
b21ac2a4-9926-403e-bba6-4dd0d616eec8	b0a74063-1fd6-4b7e-ac55-bc3d8a56e0a9	ENTRADA	2.00	14.00	ORDEN_COMPRA	8939cd3c-0654-4a7e-9298-2b876c5eb69f	RECEPCION_OC	2026-11-13 05:29:30.62-06	t	2026-11-13 05:29:30.621-06	c0000000-0000-0000-0000-000000000001
52f437e1-91dd-463b-b6f3-e2cf43adedd2	c2000000-0000-0000-0000-000000000001	SALIDA	1.00	119.00	VENTA_POS	da59df97-4967-4eff-993c-ca8356a5b2ac	Venta POS	2026-11-13 07:17:38.802-06	t	2026-11-13 07:17:38.81-06	c0000000-0000-0000-0000-000000000001
c9c77c5e-41db-4044-bbc5-7b71f5d317ff	c2000000-0000-0000-0000-000000000001	SALIDA	1.00	118.00	VENTA_POS	74111a36-21f5-4e76-bfc3-9e474ac0c02b	Venta POS	2026-11-13 07:17:38.865-06	t	2026-11-13 07:17:38.868-06	c0000000-0000-0000-0000-000000000001
48cc606f-3fb3-43bd-b3d0-8dc85078eaf8	c2000000-0000-0000-0000-000000000007	SALIDA	2.00	94.00	VENTA_POS	f21b2c3b-eef1-4cf3-ab23-1e5b767e9b67	Venta POS	2026-11-13 07:32:29.944-06	t	2026-11-13 07:32:29.951-06	c0000000-0000-0000-0000-000000000001
f3af1ff4-fae5-4c24-94e3-be202a69a1e1	5c3afc42-0623-46ad-988d-55b227a48673	ENTRADA	6.00	77.00	ORDEN_COMPRA	345c4de9-52a5-4185-9468-2b5099592a5d	RECEPCION_OC	2026-11-13 18:02:49.719-06	t	2026-11-13 18:02:49.72-06	c0000000-0000-0000-0000-000000000001
acdff0b1-188a-4721-9708-f181afb48ff4	c2000000-0000-0000-0000-000000000011	ENTRADA	2.00	49.00	ORDEN_COMPRA	63980511-93a6-4cb9-8b50-9f331f71723e	RECEPCION_OC	2026-11-13 18:02:49.78-06	t	2026-11-13 18:02:49.781-06	c0000000-0000-0000-0000-000000000001
190b3acb-dbd7-4a2d-9234-dd2e2585e601	5c3afc42-0623-46ad-988d-55b227a48673	ENTRADA	33.00	110.00	\N	\N	Orden de compra - Aceite Hidráulico SAE 10W	2026-11-14 00:10:59.78-06	t	2026-11-14 00:10:59.785-06	c0000000-0000-0000-0000-000000000001
e7e98869-b327-4d3a-b1b3-2eeb5bc0e47c	c2000000-0000-0000-0000-000000000004	ENTRADA	450.00	496.00	registros_criba	f5a2aace-93f3-49c1-abd3-f43714e501a1	PRODUCCION_CRIBA	2026-11-14 04:04:47.653-06	t	2026-11-14 04:04:47.655-06	c0000000-0000-0000-0000-000000000001
d6d57674-6222-4168-8376-c1f9bbaad09b	c2000000-0000-0000-0000-000000000004	ENTRADA	400.00	896.00	registros_criba	a5d4b0c8-c174-47ef-ba6e-80d83749f66c	PRODUCCION_CRIBA	2026-11-14 04:04:47.854-06	t	2026-11-14 04:04:47.855-06	c0000000-0000-0000-0000-000000000001
9f03cc41-f074-4aac-b52f-8922f88e2aa8	c2000000-0000-0000-0000-000000000004	ENTRADA	450.00	1346.00	registros_criba	b4833145-d6c9-4603-ae66-83f52f28075c	PRODUCCION_CRIBA	2026-11-14 04:05:07.239-06	t	2026-11-14 04:05:07.241-06	c0000000-0000-0000-0000-000000000001
3e635519-c296-4a54-acf0-dfd9c53ec2b1	c2000000-0000-0000-0000-000000000004	ENTRADA	400.00	1746.00	registros_criba	0b93cb62-cdba-45f6-ab18-d0c526ac8014	PRODUCCION_CRIBA	2026-11-14 04:05:07.398-06	t	2026-11-14 04:05:07.399-06	c0000000-0000-0000-0000-000000000001
408e5410-e230-49a5-b73d-2c40e9a4a367	c2000000-0000-0000-0000-000000000004	ENTRADA	450.00	2196.00	registros_criba	a6c30f4b-e14e-4547-99b1-21e6e36d8e8f	PRODUCCION_CRIBA	2026-11-14 04:05:42.743-06	t	2026-11-14 04:05:42.745-06	c0000000-0000-0000-0000-000000000001
20eaf054-1634-4e72-b58d-1b175aaeff35	c2000000-0000-0000-0000-000000000004	ENTRADA	400.00	2596.00	registros_criba	28b38411-1727-4b60-beb5-625269bd52bb	PRODUCCION_CRIBA	2026-11-14 04:05:42.906-06	t	2026-11-14 04:05:42.908-06	c0000000-0000-0000-0000-000000000001
dcd51599-45cb-4d7e-8978-ee87e2dc0080	c2000000-0000-0000-0000-000000000004	ENTRADA	450.00	3046.00	registros_criba	dd274570-ee9e-4e1a-b9e1-e52e2e27b71d	PRODUCCION_CRIBA	2026-11-14 04:18:43.099-06	t	2026-11-14 04:18:43.101-06	c0000000-0000-0000-0000-000000000001
26d959ec-6c5e-4ca1-8ae8-831ee678122d	c2000000-0000-0000-0000-000000000004	ENTRADA	400.00	3446.00	registros_criba	ffc24d3c-2b15-40dd-a157-40c7812d6d27	PRODUCCION_CRIBA	2026-11-14 04:18:43.25-06	t	2026-11-14 04:18:43.251-06	c0000000-0000-0000-0000-000000000001
dbaa0af0-55c3-4cf4-ab6d-a08a55a093ac	c2000000-0000-0000-0000-000000000001	ENTRADA	55.00	173.00	registros_criba	f3e26d9d-0925-4227-8ea1-6917d1790295	PRODUCCION_CRIBA	2026-11-14 04:19:36.452-06	t	2026-11-14 04:19:36.453-06	c0000000-0000-0000-0000-000000000001
857efd5a-9a69-48cd-894e-e32ab23bd91f	c2000000-0000-0000-0000-000000000004	ENTRADA	110.00	3556.00	registros_criba	ea7c14a7-2a91-4bd6-b78b-4634e44e9c92	PRODUCCION_CRIBA	2026-11-14 04:40:32.004-06	t	2026-11-14 04:40:32.005-06	c0000000-0000-0000-0000-000000000001
10d1c6dc-202f-47b1-a075-9797e8f8025b	c2000000-0000-0000-0000-000000000001	ENTRADA	15.00	188.00	registros_criba	959b85d6-29d6-41e0-9172-df0af5e45afd	PRODUCCION_CRIBA	2026-11-14 04:40:52.624-06	t	2026-11-14 04:40:52.625-06	c0000000-0000-0000-0000-000000000001
dd630417-ef35-4794-b814-19419a688083	c2000000-0000-0000-0000-000000000004	ENTRADA	300.00	3856.00	registros_criba	f486fe46-53e3-4877-a9a2-82fc7c4dbae3	PRODUCCION_CRIBA	2026-11-14 04:41:12.396-06	t	2026-11-14 04:41:12.397-06	c0000000-0000-0000-0000-000000000001
ce6d4142-be64-4e06-8db8-9322be60751d	c2000000-0000-0000-0000-000000000004	ENTRADA	450.00	4306.00	registros_criba	60f92fb4-5af6-4b99-bf73-cad4a86b05e9	PRODUCCION_CRIBA	2026-11-14 05:27:17.676-06	t	2026-11-14 05:27:17.679-06	c0000000-0000-0000-0000-000000000001
1fba798c-4d19-44ce-952a-987a874c7698	c2000000-0000-0000-0000-000000000004	ENTRADA	400.00	4706.00	registros_criba	bc4c75bc-a067-47fc-8a07-20eba4dea96e	PRODUCCION_CRIBA	2026-11-14 05:27:17.918-06	t	2026-11-14 05:27:17.92-06	c0000000-0000-0000-0000-000000000001
81696648-9a44-49eb-a9e0-52e97c415ff7	c2000000-0000-0000-0000-000000000004	ENTRADA	450.00	5156.00	registros_criba	68432a8e-fd30-42b1-9e34-d6e88ea6b38d	PRODUCCION_CRIBA	2026-11-18 21:56:41.186-06	t	2026-11-18 21:56:41.22-06	c0000000-0000-0000-0000-000000000001
69e4f662-14eb-41f1-bc2e-825ad64abd5b	c2000000-0000-0000-0000-000000000004	ENTRADA	400.00	5556.00	registros_criba	b1f55d9e-6e9b-485a-a14f-0c874c6be1ba	PRODUCCION_CRIBA	2026-11-18 21:56:45.026-06	t	2026-11-18 21:56:45.055-06	c0000000-0000-0000-0000-000000000001
90fac6df-a6dd-4ef4-9e05-2709d7d5de69	c2000000-0000-0000-0000-000000000001	ENTRADA	6.00	194.00	ORDEN_COMPRA	097fccc9-de2f-47e2-b293-0a66843df7d5	RECEPCION_OC	2026-11-18 22:05:24.697-06	t	2026-11-18 22:05:24.698-06	c0000000-0000-0000-0000-000000000001
81f039b7-b141-463a-9c9c-558727a0d6e3	c2000000-0000-0000-0000-000000000001	ENTRADA	2.00	196.00	ORDEN_COMPRA	b279e641-9ab1-4bd7-ac4b-87991188fe9c	RECEPCION_OC	2026-11-18 22:05:24.748-06	t	2026-11-18 22:05:24.749-06	c0000000-0000-0000-0000-000000000001
de0700a2-cd94-42ff-87b8-5f3d34e3651b	c2000000-0000-0000-0000-000000000001	ENTRADA	6.00	202.00	ORDEN_COMPRA	232f7130-0de8-4675-a70b-a60eb35e8b11	RECEPCION_OC	2026-11-18 22:14:03.308-06	t	2026-11-18 22:14:03.309-06	c0000000-0000-0000-0000-000000000001
ed49fd6c-6cc5-4c60-935e-58212b81e536	c2000000-0000-0000-0000-000000000001	ENTRADA	2.00	204.00	ORDEN_COMPRA	68cb9b3e-a99c-4e5c-ac95-426709e0bca6	RECEPCION_OC	2026-11-18 22:14:03.365-06	t	2026-11-18 22:14:03.367-06	c0000000-0000-0000-0000-000000000001
c3cd4686-e91c-42c8-967e-bca4b1d9710b	c2000000-0000-0000-0000-000000000004	ENTRADA	450.00	6006.00	registros_criba	95653fa1-fcb5-46b5-bb1d-f5903aa6e67e	PRODUCCION_CRIBA	2026-11-18 22:14:26.636-06	t	2026-11-18 22:14:26.638-06	c0000000-0000-0000-0000-000000000001
da25261d-3a48-49c8-87e7-22cdef6939ef	c2000000-0000-0000-0000-000000000004	ENTRADA	400.00	6406.00	registros_criba	1e95a336-0f02-4777-af7d-a89093ad8d2c	PRODUCCION_CRIBA	2026-11-18 22:14:26.912-06	t	2026-11-18 22:14:26.913-06	c0000000-0000-0000-0000-000000000001
499c6d85-639a-4191-903c-81f8e445af16	c2000000-0000-0000-0000-000000000004	ENTRADA	450.00	6856.00	registros_criba	76fb3cac-e236-407a-95a4-28ae222c3a69	PRODUCCION_CRIBA	2026-11-18 22:15:27.582-06	t	2026-11-18 22:15:27.583-06	c0000000-0000-0000-0000-000000000001
e2e74942-1b9b-47c9-ada0-d80b54b3536b	c2000000-0000-0000-0000-000000000004	ENTRADA	400.00	7256.00	registros_criba	71338aba-bf30-4f36-9ad2-99eae8a1dd90	PRODUCCION_CRIBA	2026-11-18 22:15:27.921-06	t	2026-11-18 22:15:27.923-06	c0000000-0000-0000-0000-000000000001
9c51b2af-1247-42b1-a23f-cc337c6682a8	c2000000-0000-0000-0000-000000000004	ENTRADA	6.00	7262.00	ORDEN_COMPRA	8b2ba269-7898-4b97-8b0a-9a4e537f7e72	RECEPCION_OC	2026-11-18 22:15:29.992-06	t	2026-11-18 22:15:29.994-06	c0000000-0000-0000-0000-000000000001
6560bc02-9473-4372-9acb-e9e71550c194	c2000000-0000-0000-0000-000000000010	ENTRADA	2.00	208.00	ORDEN_COMPRA	37b73b65-c17d-4163-8f28-f7fbaa0861ef	RECEPCION_OC	2026-11-18 22:15:30.047-06	t	2026-11-18 22:15:30.049-06	c0000000-0000-0000-0000-000000000001
1201baa3-05d0-464d-be68-2e8a7f10eb31	c2000000-0000-0000-0000-000000000004	ENTRADA	450.00	7712.00	registros_criba	420a3f2f-907f-4000-a322-abf5984b639b	PRODUCCION_CRIBA	2026-11-18 22:19:32.982-06	t	2026-11-18 22:19:32.983-06	c0000000-0000-0000-0000-000000000001
f99347ba-842d-4fd9-a6bb-0a558af8fac6	c2000000-0000-0000-0000-000000000004	ENTRADA	400.00	8112.00	registros_criba	a26d5af5-9065-4553-a21f-5a9c8942974f	PRODUCCION_CRIBA	2026-11-18 22:19:33.202-06	t	2026-11-18 22:19:33.203-06	c0000000-0000-0000-0000-000000000001
573ab097-926f-464e-b35b-67883f3a6977	c2000000-0000-0000-0000-000000000005	ENTRADA	6.00	47.00	ORDEN_COMPRA	61317dd5-faae-4ea9-ad57-e078435def5f	RECEPCION_OC	2026-11-18 22:19:35.257-06	t	2026-11-18 22:19:35.259-06	c0000000-0000-0000-0000-000000000001
7b3bf084-67b7-4b76-b648-f8d329f32490	c2000000-0000-0000-0000-000000000006	ENTRADA	2.00	54.00	ORDEN_COMPRA	fec55e22-01ff-4455-95da-979efd112516	RECEPCION_OC	2026-11-18 22:19:35.309-06	t	2026-11-18 22:19:35.31-06	c0000000-0000-0000-0000-000000000001
\.


--
-- Data for Name: niveles_bloqueo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.niveles_bloqueo (id, nivel, duracion_minutos, descripcion, activo, creado_en, actualizado_en) FROM stdin;
8e7c3dfd-096a-4373-94f5-d9cde50afc3f	1	5	Primer bloqueo: 5 intentos fallidos consecutivos	t	2026-08-20 21:01:27.931-06	2026-08-20 21:01:27.931-06
82bff625-b64a-4b92-8465-684fd32464f4	2	15	Segundo bloqueo: reincidencia tras el primero	t	2026-08-20 21:01:27.931-06	2026-08-20 21:01:27.931-06
121c0aa6-c666-46e2-90ae-d06939ab1065	3	30	Tercer bloqueo	t	2026-08-20 21:01:27.931-06	2026-08-20 21:01:27.931-06
018ac55e-2845-4123-bc60-c5486f7965ae	4	60	Cuarto bloqueo	t	2026-08-20 21:01:27.931-06	2026-08-20 21:01:27.931-06
41d530dd-3dd2-4920-a56c-b086ce3c6fa2	5	1440	Quinto bloqueo en adelante: 24 horas	t	2026-08-20 21:01:27.931-06	2026-08-20 21:01:27.931-06
\.


--
-- Data for Name: nominas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nominas (id, periodo_id, trabajador_id, dias_trabajados, dias_faltas, horas_ordinarias, horas_extra, sueldo_fiscal, sueldo_efectivo, total_percepciones, total_deducciones, total_neto, metodo_pago, estado, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
6c8982ca-3ecb-4e0e-b2d3-87b9f7bab1fb	f27367f1-e3ab-4a24-adc2-e7ebd9cc42f6	ea344f07-0905-4881-a64b-b7315f0bfe97	0	3	0.00	0.00	2200.00	3200.00	0.00	2700.00	2700.00	MIXTO	PENDIENTE	t	2026-11-04 20:39:55.378-06	2026-11-04 14:40:00.329034-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
77199855-44a9-48c3-8054-fa6b9ce97846	f27367f1-e3ab-4a24-adc2-e7ebd9cc42f6	f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	0	3	0.00	0.00	5000.00	2000.00	0.00	3500.00	3500.00	MIXTO	PENDIENTE	t	2026-11-04 20:39:55.385-06	2026-11-04 14:40:00.343013-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
1cdfe003-5012-4ac4-b843-572ea9a0a627	f27367f1-e3ab-4a24-adc2-e7ebd9cc42f6	fe2ec7b7-7fda-4c09-af19-279f41215d06	0	3	0.00	0.00	2000.00	2800.00	0.00	2400.00	2400.00	MIXTO	PENDIENTE	t	2026-11-04 20:39:55.389-06	2026-11-04 14:40:00.353739-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9aa4473f-a252-45a7-bd6c-d0aecc1021c6	f27367f1-e3ab-4a24-adc2-e7ebd9cc42f6	99ef344b-2f95-4dec-8f4f-dccc4bb43351	0	3	0.00	0.00	3000.00	4000.00	0.00	3500.00	3500.00	MIXTO	PENDIENTE	t	2026-11-04 20:39:55.391-06	2026-11-04 14:40:00.361757-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9d4f8461-8773-4893-adc3-f5d3e48858d9	f27367f1-e3ab-4a24-adc2-e7ebd9cc42f6	7ae68a33-6be6-46f3-8344-2dbf7389540d	0	3	0.00	0.00	6500.00	4500.00	0.00	5500.00	5500.00	MIXTO	PENDIENTE	t	2026-11-04 20:39:55.398-06	2026-11-04 14:40:00.372342-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
66d4b243-6a0f-46d7-96e0-5c9f6a2d5c0b	f27367f1-e3ab-4a24-adc2-e7ebd9cc42f6	d69e3ac7-f268-4533-a7ed-780c000f4ad7	0	3	0.00	0.00	2500.00	3500.00	0.00	3000.00	3000.00	MIXTO	PENDIENTE	t	2026-11-04 20:39:55.402-06	2026-11-04 14:40:00.38465-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
\.


--
-- Data for Name: obras; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.obras (id, codigo, nombre, proyecto_id, ubicacion, lat, lng, radio_permitido_metros, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en, estado) FROM stdin;
0fe88d91-fac1-4923-a804-e6e9d30b7f17	\N	Fraccionamiento Valle Sur	00692bdb-27d2-4e7b-be62-16c2977e1650	Querétaro, Qro.	\N	\N	\N	t	2026-08-21 02:14:59.024-06	2026-08-21 02:14:59.024-06	\N	\N	\N	EN_PROCESO
4d7ad209-71ed-4bb4-838c-fd59b7d9c32c	\N	Remodelación Centro Histórico	21b6cf72-c07c-40e8-aac6-b538511f5127	Centro, CDMX	\N	\N	\N	t	2026-08-21 02:14:59.03-06	2026-08-21 02:14:59.03-06	\N	\N	\N	EN_PROCESO
d7be3f4a-1330-4e10-bead-622e6cc19567	\N	Urbanización Vista Xalisco	3e7bfc6f-7298-4ba7-89bb-165cdb79f884	Av. Cuauhtémoc 892, Lote 12, Fraccionamiento Xalisco, Xalisco, Nayarit	\N	\N	\N	t	2026-11-12 20:32:25.523004-06	2026-11-12 20:32:25.523004-06	\N	\N	\N	EN_PROCESO
a5a0f4cf-5c33-49b6-99a1-c23d77e460cf	\N	Nave industrial Parque Tepic	36cc8b6d-3f61-42ca-9e7b-3b006dc156b5	Parque Industrial 220, Lote 8 (Nave C), Ciudad Industrial de Tepic, Tepic, Nayarit	\N	\N	\N	t	2026-11-12 20:32:25.523004-06	2026-11-12 20:32:25.523004-06	\N	\N	\N	EN_PROCESO
a5faca89-3ede-4e69-8aad-50bdb2802ecd	\N	Planta de agua potable Mezcales	38f84e5c-aa38-4f41-8073-23cfa6090344	Benito Juárez 45, Mezcales, Bahía de Banderas, Nayarit	\N	\N	\N	t	2026-11-12 20:32:25.523004-06	2026-11-12 20:32:25.523004-06	\N	\N	\N	EN_PROCESO
21d31b59-7aa1-4931-aecd-4857164197d7	\N	Oficinas distribuidora Tokio	874fbf97-5eaf-43fa-96aa-8f3e8dcd0de7	Blvd. Avila Camacho 1563, Nave 3, Ciudad del Valle, Tepic, Nayarit	\N	\N	\N	t	2026-11-12 20:32:25.523004-06	2026-11-12 20:32:25.523004-06	\N	\N	\N	EN_PROCESO
4088a33b-8666-4c31-bea0-bd392f900e41	\N	Pavimentación Av. Bahía (etapa II)	1b7a0953-b5eb-4230-af83-ccf090ea4690	Av. Bahía de Banderas, tramos 2-14, Mirador de la Bahía, San Blas, Nayarit	\N	\N	\N	t	2026-11-12 20:32:25.523004-06	2026-11-12 20:32:25.523004-06	\N	\N	\N	FINALIZADA
0284058e-a854-4e9b-883b-2e22511edc8f	\N	Escuela Secundaria	41e0730e-45fb-4585-aa99-9a2045415969	Calle xd 67, tuntunutun sahur, Roba un Brainrot, Lo soñe	\N	\N	\N	t	2026-11-12 20:32:25.523004-06	2026-11-12 20:32:25.523004-06	\N	\N	\N	EN_PROCESO
970e6a8f-9729-462b-bd8e-3d97bc90b229	\N	Puente Atizapán	caf3c621-4982-4b27-bef3-02c362cb96a6	Atizapán, EdoMex	\N	\N	\N	t	2026-08-21 02:14:59.037-06	2026-11-12 20:32:25.523004-06	\N	\N	\N	FINALIZADA
8b20eea7-f103-4126-9078-642a37f4e597	\N	Fraccionamiento centro	368d2d07-6c87-4c57-99f6-b149fab5785e	Calle Independencia 4, Col. Centro, Puerto Vallardo, Nayarit	\N	\N	\N	t	2026-11-13 02:56:54.217-06	2026-11-13 02:56:54.215-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	EN_PROCESO
f4a6f327-2b85-47f4-bf75-99d609400add	\N	Ampliación Hospital General Tepic	ba8d114e-78b2-4224-9bde-c086d19d68e0	Av. Insurgentes Sur 1200, Col. Centro, Tepic, Nayarit	\N	\N	\N	t	2026-11-13 03:38:29.311-06	2026-11-13 03:38:29.31-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	EN_PROCESO
d0d782fe-cb22-437a-99f5-351a621e3d97	\N	Bodega logística Corredor Industrial	43486b54-daf0-44d9-b63e-66671c795994	Blvd. Industrial 45, Parque Industrial, Bahía de Banderas, Nayarit	\N	\N	\N	t	2026-11-13 03:38:29.401-06	2026-11-13 03:38:29.401-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	EN_PROCESO
282e91b1-7827-4e17-ac1e-5450193a2208	\N	Rehabilitación drenaje Col. Emiliano Zapata	01ab9a70-2eb2-43fe-8e24-0225da37bb6e	Calle Morelos 210, Col. Emiliano Zapata, Tepic, Nayarit	\N	\N	\N	t	2026-11-13 03:38:29.456-06	2026-11-13 03:38:29.456-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	EN_PROCESO
e8e1055b-c806-417d-bc9a-4a7a5a8ade17	\N	Parque Lineal Río Mololoa	8b9c79a2-2352-412c-b368-f0e4fc97211e	Av. Mololoa 88, Col. Lagos del Country, Tepic, Nayarit	\N	\N	\N	t	2026-11-13 03:38:29.494-06	2026-11-13 03:38:29.493-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	FINALIZADA
cd881fb1-9460-4382-96ca-eaa454a88f3b	\N	Estacionamiento	cd0e297f-4eb9-45a2-aa81-c1a7a93d5da0	Av. Revoluión 5, Col. La loma, Tepic, Nayarit	\N	\N	\N	t	2026-11-13 04:19:27.635-06	2026-11-13 04:19:27.635-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	EN_PROCESO
09e4feb0-de68-42a4-b3aa-9340fb968f37	\N	SMOKE municipio temporal	de96d47c-14b5-4130-a640-e1360fcfac6e	Calle Smoke 1, Col. Prueba, Xalisco, Tepic, Nayarit	\N	\N	\N	f	2026-11-13 04:27:29.815-06	2026-11-12 22:27:30.005473-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-13 04:27:30.009-06	EN_PROCESO
8c89c612-feea-4cd0-8ce9-a22b36c8141b	\N	Edificio de oficinas	949bce82-7516-4e52-a53c-db976e71c9fa	Av. Insurgentes 221, Col. Sur, Bahía de Banderas, Puerto Vallarta, Nayarit	\N	\N	\N	t	2026-11-13 04:30:31.58-06	2026-11-13 04:30:31.58-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	EN_PROCESO
4a70a178-44d4-45b5-b5cf-589b0f815c20	\N	SMOKE estado temporal	8e39db1d-db8b-486b-8da1-22010e5d6932	\N	\N	\N	\N	f	2026-11-13 04:41:09.794-06	2026-11-12 22:41:10.267954-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-13 04:41:10.269-06	FINALIZADA
\.


--
-- Data for Name: ordenes_compra; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ordenes_compra (id, folio, proveedor_id, descripcion, monto, pagado, fecha, estado, motivo_cancelacion, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en, fecha_vencimiento) FROM stdin;
28129cad-411c-414b-a338-8d7d5277d535	OC-2026-001	dcc6302b-9191-47f5-a586-ed8a19d02195	Compra test 1fcd8a91	1200.50	0.00	2026-11-06	PENDIENTE	\N	t	2026-11-06 17:46:47.034-06	2026-11-06 17:46:47.01-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
2a1802d4-4ca2-4a72-bc2e-56425307db4c	OC-INT2-dd26e54b	014d5302-8cd5-499b-ba6d-7d24adf1fab1	Doble recepción	200.00	11.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:48:14.485-06	2026-11-13 19:31:13.881-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
3d72bbd2-9676-44ad-af70-4ac56b991478	OC-2026-002	330399c6-0817-41d5-941b-885c1a912e4e	Pago test 1fcd8a91	5000.00	2000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:46:47.096-06	2026-11-06 17:46:47.133-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
0dcefc50-5468-4a0b-8b8c-2c1472eb44c0	OC-2026-003	f6c321de-8e7c-4319-8501-bcc3c0d73d2d	Fail test 1fcd8a91	1000.00	0.00	2026-11-06	PENDIENTE	\N	t	2026-11-06 17:46:47.192-06	2026-11-06 17:46:47.187-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
26218958-6170-4f1b-b6b4-67e659e08e59	OC-2026-039	ebe50130-b82c-4d71-bf3b-16d61f9de1c3	Fail test d12af529	1000.00	0.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:50:56.917-06	2026-11-13 21:28:04.541-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
0f6a9087-48fa-4e40-a711-e2a0fcaee336	OC-2026-004	f2010b93-df86-4346-95e0-f6b3f5797a6c	Blocker test 1fcd8a91	3000.00	3000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:46:47.255-06	2026-11-06 17:46:47.288-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
adacd94e-6d3b-4763-895e-63e4ca66e859	OC-2026-043	05cc74b2-d08c-4bbb-b4f4-313b30f9287b	Compra test 9eb2ddeb	1200.50	0.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:51:20.324-06	2026-11-13 21:28:07.623-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
b12d2345-a8be-449e-ab95-04ec2d7e42b8	OC-2026-044	743779ec-3a9a-4a34-887f-02f1296f2af1	Pago test 9eb2ddeb	5000.00	3500.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:51:20.374-06	2026-11-13 21:28:28.807-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
9fd6e942-6346-45a4-b178-162ca76db6af	OC-INT-1fcd8a91	0dc20abd-3b38-444f-a523-ca70e2099dd2	Recepción con inventario	400.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:46:47.527-06	2026-11-06 17:46:47.552-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
e1c1fd20-c63d-46d0-8f70-017991ab5e60	OC-INT2-1fcd8a91	ab12b48b-7fd8-46ff-94af-55e4ca83b0b6	Doble recepción	200.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:46:47.597-06	2026-11-06 17:46:47.612-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
d0ffc724-1128-420b-852c-48c497210de8	OC-2026-007	3c4591b5-9c69-4191-8541-53a55b02a622	Compra test 66c1e509	1200.50	0.00	2026-11-06	PENDIENTE	\N	t	2026-11-06 17:47:11.451-06	2026-11-06 17:47:11.43-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
7c70911c-c264-41fe-87f0-a68ec64ba874	OC-2026-008	6e236272-b4eb-4e78-8f8d-46b820225b09	Pago test 66c1e509	5000.00	2000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:47:11.5-06	2026-11-06 17:47:11.535-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
53cb439e-ce56-46bf-bddf-3029415b2f01	OC-2026-009	b8367877-37a6-4f24-91d7-1b33fc72b435	Fail test 66c1e509	1000.00	0.00	2026-11-06	PENDIENTE	\N	t	2026-11-06 17:47:11.59-06	2026-11-06 17:47:11.586-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
99a517f0-bba8-4e24-988d-2bf41d18542a	OC-2026-010	eef0999a-f84a-4949-b8bf-7ae1a3be1470	Blocker test 66c1e509	3000.00	3000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:47:11.659-06	2026-11-06 17:47:11.694-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
ad7b6314-3b24-444b-bf3d-fd57c481cb28	OC-INT-66c1e509	5bbf2c65-86ef-450e-a314-334df568987d	Recepción con inventario	400.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:47:11.918-06	2026-11-06 17:47:11.944-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
03445f0d-7919-4247-9cd9-693cde3d2bc3	OC-INT2-66c1e509	9286bc42-3af7-48f0-8b6b-1189b75f0204	Doble recepción	200.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:47:11.983-06	2026-11-06 17:47:11.999-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
6fcdbcdb-2b81-4d2e-a9a6-1ede84032e0a	OC-2026-013	cb5f29f2-fdea-4c9f-80b6-0a49f0d3b539	Compra test dd26e54b	1200.50	0.00	2026-11-06	PENDIENTE	\N	t	2026-11-06 17:48:13.975-06	2026-11-06 17:48:13.955-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
202786b4-5ba7-441f-a05c-4a6852dba029	OC-2026-014	f1b059fe-4591-4a62-864f-967661489018	Pago test dd26e54b	5000.00	2000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:48:14.024-06	2026-11-06 17:48:14.058-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
db2d7117-cd53-48e9-8b0b-fb84e2479b07	OC-2026-015	76d9f12e-697c-434e-b26d-35418ea015ea	Fail test dd26e54b	1000.00	0.00	2026-11-06	PENDIENTE	\N	t	2026-11-06 17:48:14.108-06	2026-11-06 17:48:14.104-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
ee491839-e004-4998-932c-8f16825254a7	OC-2026-016	53c03100-92df-4443-81cf-5249592ee916	Blocker test dd26e54b	3000.00	3000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:48:14.172-06	2026-11-06 17:48:14.204-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
cfa73bd0-68f1-465b-85ff-4c0950d47e9d	OC-INT-dd26e54b	64606f6f-db8c-42f1-a5fd-e8fd6a08a954	Recepción con inventario	400.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:48:14.419-06	2026-11-06 17:48:14.446-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
de1ea054-85f0-4454-a215-ea0731ed582c	OC-2026-019	0e6b7f2c-f6e8-488b-ae29-d1a0181fafbc	Compra test d4de074c	1200.50	0.00	2026-11-06	PENDIENTE	\N	t	2026-11-06 17:48:40.347-06	2026-11-06 17:48:40.326-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
3adda21c-4045-4fb5-9f26-b1e14bccc14c	OC-2026-020	912c34cb-c7a3-43f0-a27c-259abe4eb997	Pago test d4de074c	5000.00	2000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:48:40.394-06	2026-11-06 17:48:40.429-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
9797a09b-085b-4cc6-a762-6e383bda0a9b	OC-2026-021	7f9c9d08-a3e5-44e6-9fb2-87dacb5526b0	Fail test d4de074c	1000.00	0.00	2026-11-06	PENDIENTE	\N	t	2026-11-06 17:48:40.483-06	2026-11-06 17:48:40.479-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
b0dc895c-3a1b-4b35-a16c-588df4886dbe	OC-2026-022	24422e5b-65a2-402c-982d-eb203ed45ff8	Blocker test d4de074c	3000.00	3000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:48:40.549-06	2026-11-06 17:48:40.583-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
5994993d-24de-4cd1-87fc-82468c941566	OC-INT-d4de074c	9078590e-e43d-4de7-b079-2ca81eb89d16	Recepción con inventario	400.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:48:40.804-06	2026-11-06 17:48:40.83-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
bedf7009-da9e-40a1-ba01-98d01be1e3a1	OC-INT2-d4de074c	71f01384-aef6-4d0f-89d5-092c3b7eb012	Doble recepción	200.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:48:40.869-06	2026-11-06 17:48:40.885-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
beec5cdb-1b13-448a-bd82-ee0f2cef9b97	OC-2026-025	91040894-5876-422a-b39c-6f941f1b44db	Compra test 1ec8a387	1200.50	0.00	2026-11-06	PENDIENTE	\N	t	2026-11-06 17:49:03.686-06	2026-11-06 17:49:03.665-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
eda7032c-3c70-411f-9ca2-b57c08f63e68	OC-2026-026	f8ed8a5e-ae2f-4a39-b07e-e4e69122772d	Pago test 1ec8a387	5000.00	2000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:49:03.73-06	2026-11-06 17:49:03.769-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
9dd7d102-abf6-4d4d-a78a-d983d682a2b8	OC-2026-027	28f15aa4-9b9f-4f82-8a28-d282f1d80b82	Fail test 1ec8a387	1000.00	0.00	2026-11-06	PENDIENTE	\N	t	2026-11-06 17:49:03.821-06	2026-11-06 17:49:03.816-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
1efe995a-7b48-41d2-9f5e-17b03fcd3650	OC-2026-028	b76deab4-de03-4078-a979-152e35bde5dc	Blocker test 1ec8a387	3000.00	3000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:49:03.886-06	2026-11-06 17:49:03.92-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
3c11f0fc-7030-4870-b8ec-fd8a8ccdebd2	OC-INT-1ec8a387	fe840c2e-0302-4e5d-8461-196b18f07c1c	Recepción con inventario	400.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:49:04.145-06	2026-11-06 17:49:04.172-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
59bfb02f-1cd6-4e93-9934-952823ce2c32	OC-INT2-1ec8a387	ccdd6975-6a3a-4fa0-930e-ad24c7a93b30	Doble recepción	200.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:49:04.215-06	2026-11-06 17:49:04.232-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
9dc585d9-ac43-4a40-86b9-b52e7af2060c	OC-2026-031	b0e683ed-e0a9-4e06-a3e9-9b5468c50517	Compra test d1eb4989	1200.50	0.00	2026-11-06	PENDIENTE	\N	t	2026-11-06 17:49:26.186-06	2026-11-06 17:49:26.165-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
038e6ee7-7f65-40a8-a09e-5733ce5730a1	OC-2026-032	b840b7c1-9d94-4b06-897f-bb7e31332636	Pago test d1eb4989	5000.00	2000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:49:26.234-06	2026-11-06 17:49:26.269-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
1bbc8537-5426-4656-a9b1-7358d59385d8	OC-2026-033	4bc4346d-077c-42cf-ac88-f9dfaa04238a	Fail test d1eb4989	1000.00	0.00	2026-11-06	PENDIENTE	\N	t	2026-11-06 17:49:26.322-06	2026-11-06 17:49:26.317-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
569d6c8c-5518-4368-a150-10a349d3a7a4	OC-2026-034	5175a40c-de01-4e40-b979-8835f6e0684d	Blocker test d1eb4989	3000.00	3000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:49:26.392-06	2026-11-06 17:49:26.426-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
a4f54bf3-0304-4659-acce-7ca4e9854bfa	OC-INT-d1eb4989	0f313293-870f-469c-8dcd-548008b238af	Recepción con inventario	400.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:49:26.64-06	2026-11-06 17:49:26.667-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
46c53bfb-3efe-43dd-8d43-1e88e5885153	OC-INT2-d1eb4989	33df534c-2c57-400d-b304-2e4490f88bf0	Doble recepción	200.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:49:26.705-06	2026-11-06 17:49:26.721-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
b23f2982-5eba-4511-9c29-6cc04ed144f1	OC-2026-037	d7519d01-11ed-4f39-8d97-152c0fcf5382	Compra test d12af529	1200.50	0.00	2026-11-06	PENDIENTE	\N	t	2026-11-06 17:50:56.782-06	2026-11-06 17:50:56.761-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
40394511-49ab-4619-9e20-e72d68308564	OC-2026-038	2876e9e8-cd01-4cbc-a1a4-9485e843ade9	Pago test d12af529	5000.00	2000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:50:56.831-06	2026-11-06 17:50:56.865-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
533bf84c-6771-4ca5-a367-de06a138cb63	OC-2026-040	e3209dc2-86d5-42b1-9b8b-aba0a58d61d5	Blocker test d12af529	3000.00	3000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:50:56.985-06	2026-11-06 17:50:57.02-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
05027b80-0740-4f1a-9eb9-9073d8b05963	OC-INT-d12af529	1110745e-244d-4717-90ff-07d2bf2fbae2	Recepción con inventario	400.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:50:57.24-06	2026-11-06 17:50:57.267-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
89eeb06e-ff8d-4826-9598-a450e0148abb	OC-INT2-d12af529	1adcbdc6-a2f3-4d06-9002-672192e172e9	Doble recepción	200.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:50:57.306-06	2026-11-06 17:50:57.321-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
160262a9-1b58-4e75-8316-1a8489f84876	OC-2026-046	396aad2b-9593-423c-b2ba-2da10c845c00	Blocker test 9eb2ddeb	3000.00	3000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:51:20.531-06	2026-11-06 17:51:20.566-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
afb84d0b-ffb5-4b28-b4a1-53f7cfd138dc	OC-2026-057	22d61153-008b-479f-bd4b-3df58f7f5b2f	SMOKE B4 - vencimiento	200.00	110.00	2026-11-13	APROBADA	\N	t	2026-11-13 18:11:09.734-06	2026-11-13 19:37:08.597-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	2027-01-10
9e65ac8b-6a38-4cc1-a85d-6b1c6f1e393b	OC-2026-051	34a625c9-b41b-40d3-a928-60c5053529d7	Fail test e3c4e9f9	1000.00	0.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:52:28.393-06	2026-11-13 20:45:55.936-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
fb8909e6-c053-48c4-ac56-481c520836e5	OC-INT-9eb2ddeb	04fe631a-36bc-48cf-b013-5c96987c743a	Recepción con inventario	400.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:51:20.885-06	2026-11-06 17:51:20.911-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
03a10b2a-07ac-4df9-8d40-c4010fe9d4ea	OC-2026-049	fcad0788-b9fe-4d97-879c-303168e5be4f	Compra test e3c4e9f9	1200.50	0.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:52:28.258-06	2026-11-13 22:03:28.11-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
ab09cf5c-7ab8-439d-b83d-289a64f79a85	OC-INT2-9eb2ddeb	bb24a179-2aff-4730-ace8-0570f34bfe78	Doble recepción	200.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:51:20.952-06	2026-11-06 17:51:20.967-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
62197212-62d1-4b00-a29e-bf313e43701b	OC-2026-050	36e5dec1-1b47-459d-94ef-430c28b7d0bd	Pago test e3c4e9f9	5000.00	2000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:52:28.306-06	2026-11-06 17:52:28.343-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
a7d1d0f8-b817-4d63-b098-45620fb7b19d	OC-2026-052	9ddfe2a9-a65d-4106-9f1d-87f999f9bfc8	Blocker test e3c4e9f9	3000.00	3000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:52:28.46-06	2026-11-06 17:52:28.494-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
4872b645-93a0-46a5-8524-2493c975af75	OC-INT-e3c4e9f9	4957ca7a-9b0c-459c-a8f3-9b7c427ae21f	Recepción con inventario	400.00	0.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:52:28.707-06	2026-11-06 17:52:28.734-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
914684c3-7af2-4a1c-b93c-b31a8ca4c9a1	OC-2026-055	22d61153-008b-479f-bd4b-3df58f7f5b2f		21600.00	21600.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 19:53:44.651-06	2026-11-06 20:22:21.091-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
731f6fb6-d979-4a6f-89a8-072a9fdc0ade	OC-2026-045	d4291a6e-553c-4c87-a27f-ba13965d985e	Fail test 9eb2ddeb	1000.00	1000.00	2026-11-06	APROBADA	\N	t	2026-11-06 17:51:20.467-06	2026-11-07 04:48:56.718-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
da995e2f-cc8f-47e5-823b-0627e04a82c0	OC-INT2-e3c4e9f9	f1417a44-3ba3-4c65-9b2c-1b8d18a4771c	Doble recepción	200.00	100.00	2026-11-06	RECIBIDA	\N	t	2026-11-06 17:52:28.773-06	2026-11-13 17:51:10.979-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
29cbf63f-88cb-4f11-9b72-75462db45e32	OC-2026-056	2718c4b8-f7d9-45b2-a5dc-f4521866997b	Sanitizada	700.00	300.00	2026-11-06	APROBADA	\N	t	2026-11-06 19:55:46.901-06	2026-11-13 19:20:38.257-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N
\.


--
-- Data for Name: ordenes_compra_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ordenes_compra_items (id, orden_compra_id, articulo_id, nombre, cantidad, cantidad_recibida, precio_unitario, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en) FROM stdin;
615fbd6d-a599-49cb-adf4-fed0ea9d21b0	28129cad-411c-414b-a338-8d7d5277d535	\N	Cemento Sílice Fino	12.00	0.00	100.04	t	2026-11-06 17:46:47.049-06	2026-11-06 17:46:47.01-06	\N	\N	\N
25125745-f90e-4c54-b4ff-bcf5312bca8f	3d72bbd2-9676-44ad-af70-4ac56b991478	\N	Cemento Pago	50.00	0.00	100.00	t	2026-11-06 17:46:47.1-06	2026-11-06 17:46:47.091-06	\N	\N	\N
b1e47a57-166e-4d3b-90b3-5cffc501a897	0dcefc50-5468-4a0b-8b8c-2c1472eb44c0	\N	Ítem fail test 1fcd8a91	1.00	0.00	1000.00	t	2026-11-06 17:46:47.194-06	2026-11-06 17:46:47.187-06	\N	\N	\N
bbe4a1c0-5108-43eb-8457-881d5d17f058	0f6a9087-48fa-4e40-a711-e2a0fcaee336	\N	Item Blocker 1fcd8a91	1.00	0.00	3000.00	t	2026-11-06 17:46:47.258-06	2026-11-06 17:46:47.251-06	\N	\N	\N
f4b2b5f4-930d-48ee-a5ee-175ac9bfa804	9fd6e942-6346-45a4-b178-162ca76db6af	372d5385-6846-46de-bc2e-e15663ab8fc6	Filtro de Aceite CAT	6.00	6.00	450.00	t	2026-11-06 17:46:47.527-06	2026-11-06 17:46:47.574-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
8b9f132b-3559-4740-bff3-c368a7e891c3	e1c1fd20-c63d-46d0-8f70-017991ab5e60	5c3afc42-0623-46ad-988d-55b227a48673	Aceite Hidráulico SAE 10W	2.00	2.00	1200.00	t	2026-11-06 17:46:47.597-06	2026-11-06 17:46:47.62-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
834b9fb7-42b5-4039-b5c6-1e1293c87442	d0ffc724-1128-420b-852c-48c497210de8	\N	Cemento Sílice Fino	12.00	0.00	100.04	t	2026-11-06 17:47:11.46-06	2026-11-06 17:47:11.43-06	\N	\N	\N
dcc56137-e3e7-42e8-89a0-c8ee0da0b50e	7c70911c-c264-41fe-87f0-a68ec64ba874	\N	Cemento Pago	50.00	0.00	100.00	t	2026-11-06 17:47:11.503-06	2026-11-06 17:47:11.495-06	\N	\N	\N
e2b0e2fa-d62b-455c-be8f-41e17981734f	53cb439e-ce56-46bf-bddf-3029415b2f01	\N	Ítem fail test 66c1e509	1.00	0.00	1000.00	t	2026-11-06 17:47:11.593-06	2026-11-06 17:47:11.586-06	\N	\N	\N
c4b8847c-5a08-4317-8e61-129b9d21565b	99a517f0-bba8-4e24-988d-2bf41d18542a	\N	Item Blocker 66c1e509	1.00	0.00	3000.00	t	2026-11-06 17:47:11.662-06	2026-11-06 17:47:11.654-06	\N	\N	\N
ab0ca6b5-1e15-4808-8ba5-89e6b4682a6b	ad7b6314-3b24-444b-bf3d-fd57c481cb28	b0a74063-1fd6-4b7e-ac55-bc3d8a56e0a9	Llanta para Volteo 11R22.5	6.00	6.00	8500.00	t	2026-11-06 17:47:11.918-06	2026-11-06 17:47:11.96-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b8403d53-c617-4854-948e-55694c0af200	03445f0d-7919-4247-9cd9-693cde3d2bc3	c2000000-0000-0000-0000-000000000012	Cal hidratada (bolsa)	2.00	2.00	55.00	t	2026-11-06 17:47:11.983-06	2026-11-06 17:47:12.014-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6ac5b012-b3b5-42b4-b204-444789db9980	6fcdbcdb-2b81-4d2e-a9a6-1ede84032e0a	\N	Cemento Sílice Fino	12.00	0.00	100.04	t	2026-11-06 17:48:13.984-06	2026-11-06 17:48:13.955-06	\N	\N	\N
2ac95319-3304-4859-a958-2d182cf9bcca	202786b4-5ba7-441f-a05c-4a6852dba029	\N	Cemento Pago	50.00	0.00	100.00	t	2026-11-06 17:48:14.028-06	2026-11-06 17:48:14.019-06	\N	\N	\N
ff68f68f-d7b0-46ee-a134-ad862cd1b84d	db2d7117-cd53-48e9-8b0b-fb84e2479b07	\N	Ítem fail test dd26e54b	1.00	0.00	1000.00	t	2026-11-06 17:48:14.112-06	2026-11-06 17:48:14.104-06	\N	\N	\N
3d368ab6-8879-4e7e-be0d-b6f03e2a53ba	ee491839-e004-4998-932c-8f16825254a7	\N	Item Blocker dd26e54b	1.00	0.00	3000.00	t	2026-11-06 17:48:14.175-06	2026-11-06 17:48:14.168-06	\N	\N	\N
5428dff1-0e68-4a39-8e9c-33e985290df0	cfa73bd0-68f1-465b-85ff-4c0950d47e9d	c2000000-0000-0000-0000-000000000003	Grava 1/2"	6.00	6.00	430.00	t	2026-11-06 17:48:14.419-06	2026-11-06 17:48:14.462-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
490ba780-93d6-4006-ae32-3e555e201417	2a1802d4-4ca2-4a72-bc2e-56425307db4c	c2000000-0000-0000-0000-000000000001	Arena de río	2.00	2.00	350.00	t	2026-11-06 17:48:14.485-06	2026-11-06 17:48:14.509-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c631b177-9ff9-4912-8ec5-fef4ccb39475	de1ea054-85f0-4454-a215-ea0731ed582c	\N	Cemento Sílice Fino	12.00	0.00	100.04	t	2026-11-06 17:48:40.356-06	2026-11-06 17:48:40.326-06	\N	\N	\N
847b7465-cb7e-4dc7-99b5-e3e85bfd4288	3adda21c-4045-4fb5-9f26-b1e14bccc14c	\N	Cemento Pago	50.00	0.00	100.00	t	2026-11-06 17:48:40.399-06	2026-11-06 17:48:40.389-06	\N	\N	\N
d2cf60af-d25a-44bc-9052-8d8f8976551d	9797a09b-085b-4cc6-a762-6e383bda0a9b	\N	Ítem fail test d4de074c	1.00	0.00	1000.00	t	2026-11-06 17:48:40.486-06	2026-11-06 17:48:40.479-06	\N	\N	\N
728dbf8f-c429-4432-896e-45aa1bf8e88f	b0dc895c-3a1b-4b35-a16c-588df4886dbe	\N	Item Blocker d4de074c	1.00	0.00	3000.00	t	2026-11-06 17:48:40.553-06	2026-11-06 17:48:40.545-06	\N	\N	\N
03786307-c94b-40ce-bf38-f90cc6b5db3d	5994993d-24de-4cd1-87fc-82468c941566	c2000000-0000-0000-0000-000000000005	Criba gruesa	6.00	6.00	290.00	t	2026-11-06 17:48:40.804-06	2026-11-06 17:48:40.846-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
650fd4ed-5438-4c45-83bd-c69b6683e2b7	bedf7009-da9e-40a1-ba01-98d01be1e3a1	c2000000-0000-0000-0000-000000000002	Grava 3/4"	2.00	2.00	420.00	t	2026-11-06 17:48:40.869-06	2026-11-06 17:48:40.893-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c0d7ef2d-8467-400f-bdc9-4ecc515a0efa	beec5cdb-1b13-448a-bd82-ee0f2cef9b97	\N	Cemento Sílice Fino	12.00	0.00	100.04	t	2026-11-06 17:49:03.695-06	2026-11-06 17:49:03.665-06	\N	\N	\N
2f64353d-e50e-4e89-94de-e6d1edf33bb4	eda7032c-3c70-411f-9ca2-b57c08f63e68	\N	Cemento Pago	50.00	0.00	100.00	t	2026-11-06 17:49:03.733-06	2026-11-06 17:49:03.726-06	\N	\N	\N
a7c11973-eda2-49de-a288-026b6cc0c925	9dd7d102-abf6-4d4d-a78a-d983d682a2b8	\N	Ítem fail test 1ec8a387	1.00	0.00	1000.00	t	2026-11-06 17:49:03.824-06	2026-11-06 17:49:03.816-06	\N	\N	\N
270867ba-bdd0-429e-9adf-769e5f198e8d	1efe995a-7b48-41d2-9f5e-17b03fcd3650	\N	Item Blocker 1ec8a387	1.00	0.00	3000.00	t	2026-11-06 17:49:03.889-06	2026-11-06 17:49:03.882-06	\N	\N	\N
aca0a1b4-ce4c-4f2c-a3a7-6f7b24dc8b79	3c11f0fc-7030-4870-b8ec-fd8a8ccdebd2	c2000000-0000-0000-0000-000000000007	Tepetate	6.00	6.00	180.00	t	2026-11-06 17:49:04.145-06	2026-11-06 17:49:04.186-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2776d7a1-b205-406e-9aa5-7962a1a58878	59bfb02f-1cd6-4e93-9934-952823ce2c32	c2000000-0000-0000-0000-000000000011	Malla electrosoldada 6x6	2.00	2.00	650.00	t	2026-11-06 17:49:04.215-06	2026-11-06 17:49:04.241-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
0b43b25f-e028-4c7f-8ce5-f5d215999513	9dc585d9-ac43-4a40-86b9-b52e7af2060c	\N	Cemento Sílice Fino	12.00	0.00	100.04	t	2026-11-06 17:49:26.195-06	2026-11-06 17:49:26.165-06	\N	\N	\N
96543a5a-b30c-448a-8344-6c8421acd350	038e6ee7-7f65-40a8-a09e-5733ce5730a1	\N	Cemento Pago	50.00	0.00	100.00	t	2026-11-06 17:49:26.238-06	2026-11-06 17:49:26.23-06	\N	\N	\N
a22433ea-3099-4525-9aa1-4fec8088548a	1bbc8537-5426-4656-a9b1-7358d59385d8	\N	Ítem fail test d1eb4989	1.00	0.00	1000.00	t	2026-11-06 17:49:26.325-06	2026-11-06 17:49:26.317-06	\N	\N	\N
96f4112d-f489-4811-a8a3-d5df1a530839	569d6c8c-5518-4368-a150-10a349d3a7a4	\N	Item Blocker d1eb4989	1.00	0.00	3000.00	t	2026-11-06 17:49:26.395-06	2026-11-06 17:49:26.384-06	\N	\N	\N
d466f0d7-d778-4680-9c60-605998db0718	a4f54bf3-0304-4659-acce-7ca4e9854bfa	c2000000-0000-0000-0000-000000000004	Criba fina	6.00	6.00	280.00	t	2026-11-06 17:49:26.64-06	2026-11-06 17:49:26.682-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a287a2fb-5265-4f1f-8419-6c6b503ec3f1	46c53bfb-3efe-43dd-8d43-1e88e5885153	c2000000-0000-0000-0000-000000000006	Tezontle	2.00	2.00	500.00	t	2026-11-06 17:49:26.705-06	2026-11-06 17:49:26.73-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
8f8f20fb-6978-4007-8d4d-0ab18c795f9a	b23f2982-5eba-4511-9c29-6cc04ed144f1	\N	Cemento Sílice Fino	12.00	0.00	100.04	t	2026-11-06 17:50:56.792-06	2026-11-06 17:50:56.761-06	\N	\N	\N
ec7c27ad-089a-4c05-83ad-6f442a0ea6eb	40394511-49ab-4619-9e20-e72d68308564	\N	Cemento Pago	50.00	0.00	100.00	t	2026-11-06 17:50:56.835-06	2026-11-06 17:50:56.826-06	\N	\N	\N
2130d70f-5b63-4b24-a6fa-6e0eda6e86c6	26218958-6170-4f1b-b6b4-67e659e08e59	\N	Ítem fail test d12af529	1.00	0.00	1000.00	t	2026-11-06 17:50:56.92-06	2026-11-06 17:50:56.912-06	\N	\N	\N
5c6ed5fc-090c-4f8c-a511-6e2ce61d747f	533bf84c-6771-4ca5-a367-de06a138cb63	\N	Item Blocker d12af529	1.00	0.00	3000.00	t	2026-11-06 17:50:56.988-06	2026-11-06 17:50:56.981-06	\N	\N	\N
3590a837-d6ee-4d86-8309-2d06c2d15c3c	05027b80-0740-4f1a-9eb9-9073d8b05963	c2000000-0000-0000-0000-000000000010	Varilla 3/8" (12 m)	6.00	6.00	95.00	t	2026-11-06 17:50:57.24-06	2026-11-06 17:50:57.282-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
76257012-9827-4ddb-ab31-609f5e74e194	89eeb06e-ff8d-4826-9598-a450e0148abb	c2000000-0000-0000-0000-000000000008	Block 15x20x40	2.00	2.00	12.00	t	2026-11-06 17:50:57.306-06	2026-11-06 17:50:57.33-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f9e93033-c635-4b0f-9474-131d5fae745a	adacd94e-6d3b-4763-895e-63e4ca66e859	\N	Cemento Sílice Fino	12.00	0.00	100.04	t	2026-11-06 17:51:20.334-06	2026-11-06 17:51:20.303-06	\N	\N	\N
19483161-558c-4e07-98eb-dfac8b25b659	b12d2345-a8be-449e-ab95-04ec2d7e42b8	\N	Cemento Pago	50.00	0.00	100.00	t	2026-11-06 17:51:20.378-06	2026-11-06 17:51:20.368-06	\N	\N	\N
ecede9a3-a22e-4167-996f-8e78ef37de6a	731f6fb6-d979-4a6f-89a8-072a9fdc0ade	\N	Ítem fail test 9eb2ddeb	1.00	0.00	1000.00	t	2026-11-06 17:51:20.47-06	2026-11-06 17:51:20.462-06	\N	\N	\N
09e30757-ac5e-4a2b-98d1-fc385ccbe4d8	160262a9-1b58-4e75-8316-1a8489f84876	\N	Item Blocker 9eb2ddeb	1.00	0.00	3000.00	t	2026-11-06 17:51:20.535-06	2026-11-06 17:51:20.527-06	\N	\N	\N
93e159e7-3e6a-42e2-9c68-dce04e229cda	fb8909e6-c053-48c4-ac56-481c520836e5	c2000000-0000-0000-0000-000000000009	Cemento CPC 40 (50 kg)	6.00	6.00	185.00	t	2026-11-06 17:51:20.885-06	2026-11-06 17:51:20.927-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
bd0acf24-e119-4ce0-a767-52d2f4fce593	ab09cf5c-7ab8-439d-b83d-289a64f79a85	372d5385-6846-46de-bc2e-e15663ab8fc6	Filtro de Aceite CAT	2.00	2.00	450.00	t	2026-11-06 17:51:20.952-06	2026-11-06 17:51:20.976-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
0e910044-b970-4897-971c-6be893e0d380	03a10b2a-07ac-4df9-8d40-c4010fe9d4ea	\N	Cemento Sílice Fino	12.00	0.00	100.04	t	2026-11-06 17:52:28.266-06	2026-11-06 17:52:28.236-06	\N	\N	\N
96e41beb-e5fb-4a17-a7d1-3e13ad8ba966	62197212-62d1-4b00-a29e-bf313e43701b	\N	Cemento Pago	50.00	0.00	100.00	t	2026-11-06 17:52:28.311-06	2026-11-06 17:52:28.301-06	\N	\N	\N
eba146d7-6379-474d-8e5a-d5ee06f831d8	9e65ac8b-6a38-4cc1-a85d-6b1c6f1e393b	\N	Ítem fail test e3c4e9f9	1.00	0.00	1000.00	t	2026-11-06 17:52:28.396-06	2026-11-06 17:52:28.389-06	\N	\N	\N
e5ab95a6-aff6-468f-bc64-e8c27ea66647	a7d1d0f8-b817-4d63-b098-45620fb7b19d	\N	Item Blocker e3c4e9f9	1.00	0.00	3000.00	t	2026-11-06 17:52:28.462-06	2026-11-06 17:52:28.456-06	\N	\N	\N
6744ed9c-e0a4-4c79-beed-63c79cdbb8af	4872b645-93a0-46a5-8524-2493c975af75	5c3afc42-0623-46ad-988d-55b227a48673	Aceite Hidráulico SAE 10W	6.00	6.00	1200.00	t	2026-11-06 17:52:28.707-06	2026-11-06 17:52:28.749-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
4dacdacf-9dc7-4df3-80ce-b77151a5f18f	da995e2f-cc8f-47e5-823b-0627e04a82c0	b0a74063-1fd6-4b7e-ac55-bc3d8a56e0a9	Llanta para Volteo 11R22.5	2.00	2.00	8500.00	t	2026-11-06 17:52:28.773-06	2026-11-06 17:52:28.798-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
ec19c4b3-f2ec-4c66-a677-a5d5cb6233e7	29cbf63f-88cb-4f11-9b72-75462db45e32	c2000000-0000-0000-0000-000000000001		2.00	0.00	350.00	t	2026-11-06 19:55:46.909-06	2026-11-06 19:55:46.889-06	\N	\N	\N
f2bad027-b64e-4503-9db6-ba89a7d851ec	914684c3-7af2-4a1c-b93c-b31a8ca4c9a1	5c3afc42-0623-46ad-988d-55b227a48673		18.00	18.00	1200.00	t	2026-11-06 19:53:44.659-06	2026-11-06 20:22:21.116-06	c0000000-0000-0000-0000-000000000001	\N	\N
459a0ce3-185b-46e6-a200-a5d98be3ca7d	afb84d0b-ffb5-4b28-b4a1-53f7cfd138dc	\N	Cemento SMOKE	2.00	0.00	100.00	t	2026-11-13 18:11:09.743-06	2026-11-13 18:11:09.724-06	\N	\N	\N
\.


--
-- Data for Name: pagos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pagos (id, codigo, cliente_id, factura_id, monto, fecha_pago, metodo_pago, referencia, banco, cuenta_destino, comprobante_url, estado, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en, cuenta_por_cobrar_id) FROM stdin;
6b0b910f-cf9c-425a-9926-a5579b27f4ae	PAG-CXC-2026-001	8e38241a-6951-4ca7-b971-38a10c4ccf27	\N	40000.00	2026-11-04	TRANSFERENCIA	SEED-7E2BF2	\N	\N	\N	CONFIRMADO	t	2026-11-07 20:34:16.612-06	2026-11-07 20:34:16.6-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	e2459470-6146-4ac4-bfd3-45cf47c2948f
976d3812-869f-4c26-ac7b-53cc67b6c6f2	PAG-CXC-2026-002	7411b3d0-e334-4afe-8634-92d24a05b1fd	\N	50000.00	2026-09-28	EFECTIVO	SEED-326F0D	\N	\N	\N	CONFIRMADO	t	2026-11-07 20:34:16.734-06	2026-11-07 20:34:16.729-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	08da46c2-b580-4553-b251-0554844a245e
188f6a3a-478e-423f-a1ff-aa6f36bc5dfd	PAG-CXC-2026-003	7411b3d0-e334-4afe-8634-92d24a05b1fd	\N	30000.00	2026-10-28	TRANSFERENCIA	SEED-FA1F0F	\N	\N	\N	CONFIRMADO	t	2026-11-07 20:34:16.765-06	2026-11-07 20:34:16.761-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	08da46c2-b580-4553-b251-0554844a245e
296b39b1-125b-43ed-bbf5-cce40532fda4	PAG-CXC-2026-004	ff2b4f34-2003-42aa-b72f-9e015c281293	\N	30000.00	2026-10-26	CHEQUE	SEED-4ECBB2	\N	\N	\N	CONFIRMADO	t	2026-11-07 20:34:16.799-06	2026-11-07 20:34:16.796-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	db609eea-c41b-46d0-8b60-232fb69c9eb7
547fcd2d-bf81-4be6-a0a3-d945e390a431	PAG-CXC-2026-005	ff2b4f34-2003-42aa-b72f-9e015c281293	\N	37400.00	2026-11-05	TRANSFERENCIA	SEED-C72FEE	\N	\N	\N	CONFIRMADO	t	2026-11-07 20:34:16.82-06	2026-11-07 20:34:16.815-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	db609eea-c41b-46d0-8b60-232fb69c9eb7
12dd9b73-fa16-4a87-8565-617509d60fe9	PAG-CXC-2026-006	3811dfb6-8263-4d9f-8ba5-2d2b2f304102	\N	124800.00	2026-11-02	TRANSFERENCIA	SEED-90041A	\N	\N	\N	CONFIRMADO	t	2026-11-07 20:34:16.866-06	2026-11-07 20:34:16.863-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	aae2b5b9-c27f-4e67-9c46-450d1adb7b4e
\.


--
-- Data for Name: pagos_proveedor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pagos_proveedor (id, codigo, proveedor_id, orden_compra_id, monto, fecha_pago, metodo_pago, referencia, activo, creado_en, creado_por, eliminado_en) FROM stdin;
caf11443-ece0-4518-b08d-1e87fb2a8109	PAG-PROV-2026-001	22d61153-008b-479f-bd4b-3df58f7f5b2f	914684c3-7af2-4a1c-b93c-b31a8ca4c9a1	21600.00	2026-11-06	EFECTIVO	\N	t	2026-11-06 20:22:12.525-06	c0000000-0000-0000-0000-000000000001	\N
5662d6c9-c765-4d28-b1f7-874bce9108f1	PAG-PROV-2026-002	d4291a6e-553c-4c87-a27f-ba13965d985e	731f6fb6-d979-4a6f-89a8-072a9fdc0ade	500.00	2026-11-07	EFECTIVO	\N	t	2026-11-07 04:48:49.552-06	c0000000-0000-0000-0000-000000000001	\N
e92010f2-30c0-4ee5-9dd3-61e1985169f4	PAG-PROV-2026-003	d4291a6e-553c-4c87-a27f-ba13965d985e	731f6fb6-d979-4a6f-89a8-072a9fdc0ade	500.00	2026-11-07	EFECTIVO	\N	t	2026-11-07 04:48:56.721-06	c0000000-0000-0000-0000-000000000001	\N
7f5cc1e1-80a8-4fd0-ab89-7a0f5b9792a5	PAG-PROV-2026-004	f1417a44-3ba3-4c65-9b2c-1b8d18a4771c	da995e2f-cc8f-47e5-823b-0627e04a82c0	100.00	2026-11-13	EFECTIVO	\N	t	2026-11-13 17:51:11.332-06	c0000000-0000-0000-0000-000000000001	\N
794e325a-0033-462c-9092-5736b13050c1	PAG-PROV-2026-005	2718c4b8-f7d9-45b2-a5dc-f4521866997b	29cbf63f-88cb-4f11-9b72-75462db45e32	300.00	2026-11-13	EFECTIVO	\N	t	2026-11-13 19:20:38.266-06	c0000000-0000-0000-0000-000000000001	\N
0e5cf88d-4a6d-4dec-b561-e0e53ce8ba13	PAG-PROV-2026-006	22d61153-008b-479f-bd4b-3df58f7f5b2f	afb84d0b-ffb5-4b28-b4a1-53f7cfd138dc	80.00	2026-11-13	EFECTIVO	\N	t	2026-11-13 19:28:22.727-06	c0000000-0000-0000-0000-000000000001	\N
8dab76d9-6ede-4a2e-a054-1d8ae1b358e9	PAG-PROV-2026-007	22d61153-008b-479f-bd4b-3df58f7f5b2f	afb84d0b-ffb5-4b28-b4a1-53f7cfd138dc	23.00	2026-11-13	EFECTIVO	\N	t	2026-11-13 19:31:06.298-06	c0000000-0000-0000-0000-000000000001	\N
e4d0f943-8e50-4352-bbdc-b5936be13df1	PAG-PROV-2026-008	014d5302-8cd5-499b-ba6d-7d24adf1fab1	2a1802d4-4ca2-4a72-bc2e-56425307db4c	11.00	2026-11-13	EFECTIVO	\N	t	2026-11-13 19:31:13.885-06	c0000000-0000-0000-0000-000000000001	\N
e9ff02d4-53b1-4b1c-9de5-cbeb58965db7	PAG-PROV-2026-009	22d61153-008b-479f-bd4b-3df58f7f5b2f	afb84d0b-ffb5-4b28-b4a1-53f7cfd138dc	7.00	2026-11-13	EFECTIVO	\N	t	2026-11-13 19:37:08.605-06	c0000000-0000-0000-0000-000000000001	\N
ae05d9fe-8616-4868-901d-afb30c9e2271	PAG-PROV-2026-010	743779ec-3a9a-4a34-887f-02f1296f2af1	b12d2345-a8be-449e-ab95-04ec2d7e42b8	1500.00	2026-11-13	EFECTIVO	\N	t	2026-11-13 21:28:28.822-06	c0000000-0000-0000-0000-000000000001	\N
\.


--
-- Data for Name: percepciones_nomina; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.percepciones_nomina (id, nomina_id, concepto, tipo, monto, activo, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: periodos_nomina; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.periodos_nomina (id, codigo, nombre, tipo, fecha_inicio, fecha_fin, fecha_pago, estado, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
f27367f1-e3ab-4a24-adc2-e7ebd9cc42f6	NOM-2026-S45-e469	Semana 45: 2 Nov – 7 Nov 2026	SEMANAL	2026-11-02	2026-11-07	\N	ABIERTO	t	2026-11-04 20:39:55.36-06	2026-11-04 20:39:55.359-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
\.


--
-- Data for Name: permisos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permisos (id, trabajador_id, tipo, fecha_inicio, fecha_fin, estado, motivo, dias_solicitados, activo, creado_en, actualizado_en, codigo, actualizado_por, aprobador_id, creado_por, eliminado_en) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, modulo, recurso, accion, descripcion, activo, creado_en, actualizado_en) FROM stdin;
aa000001-0000-0000-0000-000000000001	dashboard	dashboard	ver	Ver panel principal	t	2026-11-03 18:51:00.028-06	2026-11-03 18:51:00.028-06
aa000002-0000-0000-0000-000000000001	rrhh	trabajadores	ver	Ver listado de trabajadores	t	2026-11-03 18:51:00.032-06	2026-11-03 18:51:00.032-06
aa000002-0000-0000-0000-000000000002	rrhh	trabajadores	crear	Crear trabajadores	t	2026-11-03 18:51:00.032-06	2026-11-03 18:51:00.032-06
aa000002-0000-0000-0000-000000000003	rrhh	trabajadores	editar	Editar trabajadores	t	2026-11-03 18:51:00.032-06	2026-11-03 18:51:00.032-06
aa000002-0000-0000-0000-000000000004	rrhh	trabajadores	eliminar	Eliminar trabajadores	t	2026-11-03 18:51:00.032-06	2026-11-03 18:51:00.032-06
aa000002-0000-0000-0000-000000000005	rrhh	trabajadores	exportar	Exportar listado de trabajadores	t	2026-11-03 18:51:00.032-06	2026-11-03 18:51:00.032-06
aa000003-0000-0000-0000-000000000001	rrhh	asistencia	ver	Ver registros de asistencia	t	2026-11-03 18:51:00.033-06	2026-11-03 18:51:00.033-06
aa000003-0000-0000-0000-000000000002	rrhh	asistencia	crear	Registrar asistencia	t	2026-11-03 18:51:00.033-06	2026-11-03 18:51:00.033-06
aa000003-0000-0000-0000-000000000003	rrhh	asistencia	editar	Editar registros de asistencia	t	2026-11-03 18:51:00.033-06	2026-11-03 18:51:00.033-06
aa000003-0000-0000-0000-000000000004	rrhh	asistencia	exportar	Exportar reporte de asistencia	t	2026-11-03 18:51:00.033-06	2026-11-03 18:51:00.033-06
aa000004-0000-0000-0000-000000000001	rrhh	nomina	ver	Ver nomina	t	2026-11-03 18:51:00.034-06	2026-11-03 18:51:00.034-06
aa000004-0000-0000-0000-000000000002	rrhh	nomina	crear	Crear nomina	t	2026-11-03 18:51:00.034-06	2026-11-03 18:51:00.034-06
aa000004-0000-0000-0000-000000000003	rrhh	nomina	editar	Editar nomina	t	2026-11-03 18:51:00.034-06	2026-11-03 18:51:00.034-06
aa000004-0000-0000-0000-000000000004	rrhh	nomina	procesar	Procesar pagos de nomina	t	2026-11-03 18:51:00.034-06	2026-11-03 18:51:00.034-06
aa000004-0000-0000-0000-000000000005	rrhh	nomina	exportar	Exportar nomina	t	2026-11-03 18:51:00.034-06	2026-11-03 18:51:00.034-06
aa000005-0000-0000-0000-000000000001	maquinaria	flota	ver	Ver flota de maquinaria	t	2026-11-03 18:51:00.035-06	2026-11-03 18:51:00.035-06
aa000005-0000-0000-0000-000000000002	maquinaria	flota	crear	Registrar maquinaria	t	2026-11-03 18:51:00.035-06	2026-11-03 18:51:00.035-06
aa000005-0000-0000-0000-000000000003	maquinaria	flota	editar	Editar maquinaria	t	2026-11-03 18:51:00.035-06	2026-11-03 18:51:00.035-06
aa000005-0000-0000-0000-000000000004	maquinaria	flota	eliminar	Eliminar maquinaria	t	2026-11-03 18:51:00.035-06	2026-11-03 18:51:00.035-06
aa000006-0000-0000-0000-000000000001	maquinaria	horometro	ver	Ver lecturas de horometro	t	2026-11-03 18:51:00.036-06	2026-11-03 18:51:00.036-06
aa000006-0000-0000-0000-000000000002	maquinaria	horometro	crear	Registrar lectura de horometro	t	2026-11-03 18:51:00.036-06	2026-11-03 18:51:00.036-06
aa000006-0000-0000-0000-000000000003	maquinaria	horometro	editar	Editar lectura de horometro	t	2026-11-03 18:51:00.036-06	2026-11-03 18:51:00.036-06
aa000007-0000-0000-0000-000000000001	maquinaria	mantenimiento	ver	Ver registros de mantenimiento	t	2026-11-03 18:51:00.036-06	2026-11-03 18:51:00.036-06
aa000007-0000-0000-0000-000000000002	maquinaria	mantenimiento	crear	Crear mantenimiento	t	2026-11-03 18:51:00.036-06	2026-11-03 18:51:00.036-06
aa000007-0000-0000-0000-000000000003	maquinaria	mantenimiento	editar	Editar mantenimiento	t	2026-11-03 18:51:00.036-06	2026-11-03 18:51:00.036-06
aa000007-0000-0000-0000-000000000004	maquinaria	mantenimiento	aprobar	Aprobar mantenimiento	t	2026-11-03 18:51:00.036-06	2026-11-03 18:51:00.036-06
aa000008-0000-0000-0000-000000000001	maquinaria	combustible	ver	Ver registros de combustible	t	2026-11-03 18:51:00.037-06	2026-11-03 18:51:00.037-06
aa000008-0000-0000-0000-000000000002	maquinaria	combustible	crear	Registrar carga de combustible	t	2026-11-03 18:51:00.037-06	2026-11-03 18:51:00.037-06
aa000008-0000-0000-0000-000000000003	maquinaria	combustible	editar	Editar registro de combustible	t	2026-11-03 18:51:00.037-06	2026-11-03 18:51:00.037-06
aa000008-0000-0000-0000-000000000004	maquinaria	combustible	exportar	Exportar reporte de combustible	t	2026-11-03 18:51:00.037-06	2026-11-03 18:51:00.037-06
aa000009-0000-0000-0000-000000000001	maquinaria	gps	ver	Ver rastreo GPS	t	2026-11-03 18:51:00.038-06	2026-11-03 18:51:00.038-06
aa000009-0000-0000-0000-000000000002	maquinaria	gps	editar	Configurar geocercas	t	2026-11-03 18:51:00.038-06	2026-11-03 18:51:00.038-06
aa00000a-0000-0000-0000-000000000001	operaciones	operaciones	ver	Ver ordenes de operacion	t	2026-11-03 18:51:00.039-06	2026-11-03 18:51:00.039-06
aa00000a-0000-0000-0000-000000000002	operaciones	operaciones	crear	Crear orden de operacion	t	2026-11-03 18:51:00.039-06	2026-11-03 18:51:00.039-06
aa00000a-0000-0000-0000-000000000003	operaciones	operaciones	editar	Editar orden de operacion	t	2026-11-03 18:51:00.039-06	2026-11-03 18:51:00.039-06
aa00000a-0000-0000-0000-000000000004	operaciones	operaciones	eliminar	Eliminar orden de operacion	t	2026-11-03 18:51:00.039-06	2026-11-03 18:51:00.039-06
aa00000b-0000-0000-0000-000000000001	operaciones	reportes_campo	ver	Ver reportes de campo	t	2026-11-03 18:51:00.039-06	2026-11-03 18:51:00.039-06
aa00000b-0000-0000-0000-000000000002	operaciones	reportes_campo	crear	Crear reporte de campo	t	2026-11-03 18:51:00.039-06	2026-11-03 18:51:00.039-06
aa00000b-0000-0000-0000-000000000003	operaciones	reportes_campo	editar	Editar reporte de campo	t	2026-11-03 18:51:00.039-06	2026-11-03 18:51:00.039-06
aa00000b-0000-0000-0000-000000000004	operaciones	reportes_campo	exportar	Exportar reportes de campo	t	2026-11-03 18:51:00.039-06	2026-11-03 18:51:00.039-06
aa00000c-0000-0000-0000-000000000001	operaciones	criba	ver	Ver registros de criba	t	2026-11-03 18:51:00.04-06	2026-11-03 18:51:00.04-06
aa00000c-0000-0000-0000-000000000002	operaciones	criba	crear	Crear registro de criba	t	2026-11-03 18:51:00.04-06	2026-11-03 18:51:00.04-06
aa00000c-0000-0000-0000-000000000003	operaciones	criba	editar	Editar registro de criba	t	2026-11-03 18:51:00.04-06	2026-11-03 18:51:00.04-06
aa00000d-0000-0000-0000-000000000001	operaciones	inventario	ver	Ver inventario	t	2026-11-03 18:51:00.041-06	2026-11-03 18:51:00.041-06
aa00000d-0000-0000-0000-000000000002	operaciones	inventario	crear	Crear articulo de inventario	t	2026-11-03 18:51:00.041-06	2026-11-03 18:51:00.041-06
aa00000d-0000-0000-0000-000000000003	operaciones	inventario	editar	Editar articulo de inventario	t	2026-11-03 18:51:00.041-06	2026-11-03 18:51:00.041-06
aa00000d-0000-0000-0000-000000000004	operaciones	inventario	eliminar	Eliminar articulo de inventario	t	2026-11-03 18:51:00.041-06	2026-11-03 18:51:00.041-06
aa00000d-0000-0000-0000-000000000005	operaciones	inventario	exportar	Exportar inventario	t	2026-11-03 18:51:00.041-06	2026-11-03 18:51:00.041-06
aa00000e-0000-0000-0000-000000000001	operaciones	proyectos	ver	Ver proyectos	t	2026-11-03 18:51:00.042-06	2026-11-03 18:51:00.042-06
aa00000e-0000-0000-0000-000000000002	operaciones	proyectos	crear	Crear proyecto	t	2026-11-03 18:51:00.042-06	2026-11-03 18:51:00.042-06
aa00000e-0000-0000-0000-000000000003	operaciones	proyectos	editar	Editar proyecto	t	2026-11-03 18:51:00.042-06	2026-11-03 18:51:00.042-06
aa00000e-0000-0000-0000-000000000004	operaciones	proyectos	eliminar	Eliminar proyecto	t	2026-11-03 18:51:00.042-06	2026-11-03 18:51:00.042-06
aa00000f-0000-0000-0000-000000000001	comercial	clientes	ver	Ver clientes	t	2026-11-03 18:51:00.043-06	2026-11-03 18:51:00.043-06
aa00000f-0000-0000-0000-000000000002	comercial	clientes	crear	Crear cliente	t	2026-11-03 18:51:00.043-06	2026-11-03 18:51:00.043-06
aa00000f-0000-0000-0000-000000000003	comercial	clientes	editar	Editar cliente	t	2026-11-03 18:51:00.043-06	2026-11-03 18:51:00.043-06
aa00000f-0000-0000-0000-000000000004	comercial	clientes	eliminar	Eliminar cliente	t	2026-11-03 18:51:00.043-06	2026-11-03 18:51:00.043-06
aa000010-0000-0000-0000-000000000001	comercial	cotizaciones	ver	Ver cotizaciones	t	2026-11-03 18:51:00.044-06	2026-11-03 18:51:00.044-06
aa000010-0000-0000-0000-000000000002	comercial	cotizaciones	crear	Crear cotizacion	t	2026-11-03 18:51:00.044-06	2026-11-03 18:51:00.044-06
aa000010-0000-0000-0000-000000000003	comercial	cotizaciones	editar	Editar cotizacion	t	2026-11-03 18:51:00.044-06	2026-11-03 18:51:00.044-06
aa000010-0000-0000-0000-000000000004	comercial	cotizaciones	eliminar	Eliminar cotizacion	t	2026-11-03 18:51:00.044-06	2026-11-03 18:51:00.044-06
aa000010-0000-0000-0000-000000000005	comercial	cotizaciones	exportar	Exportar cotizacion	t	2026-11-03 18:51:00.044-06	2026-11-03 18:51:00.044-06
aa000011-0000-0000-0000-000000000001	comercial	finanzas	ver	Ver finanzas	t	2026-11-03 18:51:00.045-06	2026-11-03 18:51:00.045-06
aa000011-0000-0000-0000-000000000002	comercial	finanzas	crear	Registrar transaccion financiera	t	2026-11-03 18:51:00.045-06	2026-11-03 18:51:00.045-06
aa000011-0000-0000-0000-000000000003	comercial	finanzas	editar	Editar transaccion financiera	t	2026-11-03 18:51:00.045-06	2026-11-03 18:51:00.045-06
aa000011-0000-0000-0000-000000000004	comercial	finanzas	exportar	Exportar reportes financieros	t	2026-11-03 18:51:00.045-06	2026-11-03 18:51:00.045-06
aa000012-0000-0000-0000-000000000001	comercial	proveedores	ver	Ver proveedores	t	2026-11-03 18:51:00.045-06	2026-11-03 18:51:00.045-06
aa000012-0000-0000-0000-000000000002	comercial	proveedores	crear	Crear proveedor	t	2026-11-03 18:51:00.045-06	2026-11-03 18:51:00.045-06
aa000012-0000-0000-0000-000000000003	comercial	proveedores	editar	Editar proveedor	t	2026-11-03 18:51:00.045-06	2026-11-03 18:51:00.045-06
aa000012-0000-0000-0000-000000000004	comercial	proveedores	eliminar	Eliminar proveedor	t	2026-11-03 18:51:00.045-06	2026-11-03 18:51:00.045-06
aa000013-0000-0000-0000-000000000001	comercial	ventas	ver	Ver punto de venta	t	2026-11-03 18:51:00.047-06	2026-11-03 18:51:00.047-06
aa000013-0000-0000-0000-000000000002	comercial	ventas	crear	Crear venta	t	2026-11-03 18:51:00.047-06	2026-11-03 18:51:00.047-06
aa000013-0000-0000-0000-000000000003	comercial	ventas	editar	Editar venta	t	2026-11-03 18:51:00.047-06	2026-11-03 18:51:00.047-06
aa000013-0000-0000-0000-000000000004	comercial	ventas	cancelar	Cancelar venta	t	2026-11-03 18:51:00.047-06	2026-11-03 18:51:00.047-06
aa000014-0000-0000-0000-000000000001	comercial	cobranza	ver	Ver cuentas por cobrar	t	2026-11-03 18:51:00.047-06	2026-11-03 18:51:00.047-06
aa000014-0000-0000-0000-000000000002	comercial	cobranza	crear	Registrar cobro	t	2026-11-03 18:51:00.047-06	2026-11-03 18:51:00.047-06
aa000014-0000-0000-0000-000000000003	comercial	cobranza	editar	Editar cobro	t	2026-11-03 18:51:00.047-06	2026-11-03 18:51:00.047-06
aa000014-0000-0000-0000-000000000004	comercial	cobranza	exportar	Exportar reporte de cobranza	t	2026-11-03 18:51:00.047-06	2026-11-03 18:51:00.047-06
aa000015-0000-0000-0000-000000000001	sistema	documentos	ver	Ver documentos	t	2026-11-03 18:51:00.048-06	2026-11-03 18:51:00.048-06
aa000015-0000-0000-0000-000000000002	sistema	documentos	crear	Subir documento	t	2026-11-03 18:51:00.048-06	2026-11-03 18:51:00.048-06
aa000015-0000-0000-0000-000000000003	sistema	documentos	editar	Editar documento	t	2026-11-03 18:51:00.048-06	2026-11-03 18:51:00.048-06
aa000015-0000-0000-0000-000000000004	sistema	documentos	eliminar	Eliminar documento	t	2026-11-03 18:51:00.048-06	2026-11-03 18:51:00.048-06
aa000016-0000-0000-0000-000000000001	sistema	reportes	ver	Ver reportes	t	2026-11-03 18:51:00.048-06	2026-11-03 18:51:00.048-06
aa000016-0000-0000-0000-000000000002	sistema	reportes	exportar	Exportar reportes	t	2026-11-03 18:51:00.048-06	2026-11-03 18:51:00.048-06
aa000017-0000-0000-0000-000000000001	sistema	configuracion	ver	Ver configuracion del sistema	t	2026-11-03 18:51:00.049-06	2026-11-03 18:51:00.049-06
aa000017-0000-0000-0000-000000000002	sistema	configuracion	editar	Editar configuracion del sistema	t	2026-11-03 18:51:00.049-06	2026-11-03 18:51:00.049-06
aa000018-0000-0000-0000-000000000001	sistema	usuarios	ver	Ver usuarios del sistema	t	2026-11-03 18:51:00.049-06	2026-11-03 18:51:00.049-06
aa000018-0000-0000-0000-000000000002	sistema	usuarios	crear	Crear usuario	t	2026-11-03 18:51:00.049-06	2026-11-03 18:51:00.049-06
aa000018-0000-0000-0000-000000000003	sistema	usuarios	editar	Editar usuario	t	2026-11-03 18:51:00.049-06	2026-11-03 18:51:00.049-06
aa000018-0000-0000-0000-000000000004	sistema	usuarios	eliminar	Eliminar usuario (soft delete)	t	2026-11-03 18:51:00.049-06	2026-11-03 18:51:00.049-06
aa000018-0000-0000-0000-000000000005	sistema	usuarios	asignar_rol	Asignar roles a usuarios	t	2026-11-03 18:51:00.049-06	2026-11-03 18:51:00.049-06
aa000019-0000-0000-0000-000000000001	sistema	roles	ver	Ver roles del sistema	t	2026-11-03 18:51:00.05-06	2026-11-03 18:51:00.05-06
aa000019-0000-0000-0000-000000000002	sistema	roles	crear	Crear rol	t	2026-11-03 18:51:00.05-06	2026-11-03 18:51:00.05-06
aa000019-0000-0000-0000-000000000003	sistema	roles	editar	Editar rol y sus permisos	t	2026-11-03 18:51:00.05-06	2026-11-03 18:51:00.05-06
aa000019-0000-0000-0000-000000000004	sistema	roles	eliminar	Eliminar rol (si no es de sistema)	t	2026-11-03 18:51:00.05-06	2026-11-03 18:51:00.05-06
aa00001a-0000-0000-0000-000000000001	sistema	permisos	ver	Ver permisos del sistema	t	2026-11-03 18:51:00.05-06	2026-11-03 18:51:00.05-06
aa00001a-0000-0000-0000-000000000002	sistema	permisos	editar	Gestionar permisos	t	2026-11-03 18:51:00.05-06	2026-11-03 18:51:00.05-06
aa000007-0000-0000-0000-000000000005	maquinaria	mantenimiento	eliminar	Eliminar registro de mantenimiento	t	2026-11-03 18:51:00.194-06	2026-11-03 18:51:00.194-06
aa000008-0000-0000-0000-000000000005	maquinaria	combustible	eliminar	Eliminar registro de combustible	t	2026-11-03 18:51:00.194-06	2026-11-03 18:51:00.194-06
11bfe0fb-513e-40e7-8307-a87ef3530d0c	operaciones	criba	eliminar	Eliminar registros de criba	t	2026-11-03 18:51:00.27-06	2026-11-03 18:51:00.27-06
276283c0-1f65-41ac-8095-6a493b7e5c71	operaciones	reportes_campo	eliminar	Eliminar reportes de campo	t	2026-11-03 18:51:00.271-06	2026-11-03 18:51:00.271-06
a9e09d91-65c5-4580-ad5f-1d964b22ffe3	comercial	finanzas	eliminar	Eliminar transaccion financiera	t	2026-11-03 18:51:00.273-06	2026-11-03 18:51:00.273-06
aa00001c-0000-0000-0000-000000000001	comercial	facturas	ver	Ver facturas	t	2026-11-03 18:53:54.451-06	2026-11-03 18:53:54.451-06
aa00001c-0000-0000-0000-000000000002	comercial	facturas	crear	Crear factura	t	2026-11-03 18:53:54.451-06	2026-11-03 18:53:54.451-06
aa00001c-0000-0000-0000-000000000003	comercial	facturas	editar	Editar factura	t	2026-11-03 18:53:54.451-06	2026-11-03 18:53:54.451-06
aa00001c-0000-0000-0000-000000000004	comercial	facturas	eliminar	Eliminar factura	t	2026-11-03 18:53:54.451-06	2026-11-03 18:53:54.451-06
aa00001c-0000-0000-0000-000000000005	comercial	facturas	exportar	Exportar facturas	t	2026-11-03 18:53:54.451-06	2026-11-03 18:53:54.451-06
aa00001d-0000-0000-0000-000000000001	sistema	notificaciones	ver	Ver el centro de notificaciones del Topbar	t	2026-11-13 14:27:08.102315-06	2026-11-13 14:27:08.102315-06
\.


--
-- Data for Name: personas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.personas (id, nombre, apellido_paterno, apellido_materno, rfc, curp, correo, telefono, fecha_nacimiento, genero, direccion, avatar_url, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
b0000000-0000-0000-0000-000000000001	Carlos	SVR	\N	\N	\N	admin@svr-constructora.com	8112345678	\N	\N	\N	\N	t	2026-11-03 18:51:00.012-06	2026-11-03 18:51:00.012-06	\N	\N	\N
f0000000-0000-0000-0000-000000000010	María	López	Hernández	\N	\N	rrhh@svr-constructora.com	8112345679	\N	\N	\N	\N	t	2026-11-03 18:51:00.078-06	2026-11-03 18:51:00.078-06	\N	\N	\N
e1000000-0000-0000-0000-0000000000a1	Laura	Administrativo	Oficina	\N	\N	\N	55 1234 0001	\N	\N	\N	\N	t	2026-11-08 18:57:26.5543-06	2026-11-08 21:53:13.642641-06	\N	\N	\N
e1000000-0000-0000-0000-0000000000a2	Óscar	Residente	de Obra	\N	\N	\N	55 1234 0002	\N	\N	\N	\N	t	2026-11-08 18:57:26.5543-06	2026-11-08 21:53:13.642641-06	\N	\N	\N
e1000000-0000-0000-0000-0000000000a3	Rubén	Técnico	de Flota	\N	\N	\N	55 1234 0003	\N	\N	\N	\N	t	2026-11-08 18:57:26.5543-06	2026-11-08 21:53:13.642641-06	\N	\N	\N
e1000000-0000-0000-0000-0000000000a4	Carla	Cobradora	de Criba	\N	\N	\N	55 1234 0004	\N	\N	\N	\N	t	2026-11-08 18:57:26.5543-06	2026-11-08 21:53:13.642641-06	\N	\N	\N
e1000000-0000-0000-0000-0000000000a5	Juan	Trabajador	de Campo	\N	\N	\N	55 1234 0005	\N	\N	\N	\N	t	2026-11-08 18:57:26.5543-06	2026-11-08 21:53:13.642641-06	\N	\N	\N
e1000000-0000-0000-0000-0000000000b1	Carlos	Soldador	de Planta	\N	\N	\N	55 1234 0011	\N	\N	\N	\N	t	2026-11-08 23:51:01.465202-06	2026-11-08 23:51:01.465202-06	\N	\N	\N
e1000000-0000-0000-0000-0000000000b2	Denis	Repartidor	de Diesel	\N	\N	\N	55 1234 0012	\N	\N	\N	\N	t	2026-11-08 23:51:01.465202-06	2026-11-08 23:51:01.465202-06	\N	\N	\N
e1000000-0000-0000-0000-0000000000b3	Moises	Mantenimiento	General	\N	\N	\N	55 1234 0013	\N	\N	\N	\N	t	2026-11-08 23:51:01.465202-06	2026-11-08 23:51:01.465202-06	\N	\N	\N
e1000000-0000-0000-0000-0000000000c1	Pedro	Chofer	de Obra	\N	\N	\N	55 1234 0021	\N	\N	\N	\N	t	2026-11-09 03:01:24.020327-06	2026-11-09 03:01:24.020327-06	\N	\N	\N
e1000000-0000-0000-0000-0000000000c2	Luis	Operador	de Patio	\N	\N	\N	55 1234 0022	\N	\N	\N	\N	t	2026-11-09 03:01:24.020327-06	2026-11-09 03:01:24.020327-06	\N	\N	\N
2a08770e-632c-48b3-9f06-a6f64416abd2	Integration	Tester	\N	\N	\N	inttest-2e52be7c@svr-erp.local	\N	\N	\N	\N	\N	t	2026-11-10 00:06:04.751-06	2026-11-10 00:06:04.705-06	\N	\N	\N
dc69f9cd-4977-457e-be12-7cb97e790fd8	PinInt	680ba1d9	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-11 03:35:07.625-06	2026-11-11 03:35:07.408-06	\N	\N	\N
e8662c97-2a18-4023-94e8-c72ffa4f9cd5	PinInt	fadba26f	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-11 03:36:38.31-06	2026-11-11 03:36:38.103-06	\N	\N	\N
098aa1e1-0cc5-4513-8022-87e09bb51852	PinInt	37e025bd	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-11 03:37:50.675-06	2026-11-11 03:37:50.458-06	\N	\N	\N
dbb11f95-493d-4c62-88a5-5769c183e2e5	PinInt	2622bfd4	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-11 05:23:08.569-06	2026-11-11 05:23:08.251-06	\N	\N	\N
199a8a2b-f664-4b9e-aa1d-1c5ded13798f	PinInt	bb95bf0d	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-11 05:55:18.149-06	2026-11-11 05:55:17.739-06	\N	\N	\N
bf05390d-bdf2-4359-b378-8c0caf69e28e	PinInt	77d0d743	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-11 06:02:37.208-06	2026-11-11 06:02:36.98-06	\N	\N	\N
238612d4-514f-4565-be6d-21f801d8f6f7	Rosa	Marin	\N	\N	\N	jefe-inttest-e337a65b@svr-erp.local	5598765432	\N	\N	\N	\N	t	2026-11-11 19:21:14.716-06	2026-11-11 19:21:14.715-06	\N	\N	\N
7df6f379-836f-4703-a796-c26b6f03bcde	Integration	Tester	\N	\N	\N	inttest-e337a65b@svr-erp.local	5512345678	\N	\N	\N	\N	t	2026-11-11 19:21:14.147-06	2026-11-11 13:21:15.128495-06	\N	\N	\N
eeb782d2-2067-4685-847d-56a3d5797b72	Trabajador Test a1d1abf1	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:46:59.973-06	2026-11-11 20:46:59.719-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
82279392-cf4b-47ff-8616-5df1b645ec92	Trabajador Licencia a1d1abf1	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:00.846-06	2026-11-11 20:47:00.832-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
10c5308e-5145-4fcb-b942-c8eba929777b	Con identidad a1d1abf1	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:01.647-06	2026-11-11 20:47:01.641-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
5e4fac8d-edbd-43d7-8e95-2f1e006bb750	Carrera A a1d1abf1	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:03.222-06	2026-11-11 20:47:03.216-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a72df4f7-0cca-4333-af24-7859ff1ffee4	Carrera B a1d1abf1	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:03.289-06	2026-11-11 20:47:03.278-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
797f1c46-2cac-45e8-ab51-125daf42fc73	Trabajador Test a1d1abf1	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:05.023-06	2026-11-11 20:47:04.983-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
ee2b9a49-e231-41bb-9659-b56b1b75cbb2	Trabajador Test a1d1abf1	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:06.29-06	2026-11-11 20:47:06.242-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
89918758-37d7-4a1e-9cb8-a84e6873401c	Trabajador Test a1d1abf1	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:07.148-06	2026-11-11 20:47:07.143-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
02e6a3d2-60a0-4e1d-8566-d08ba3e26c1f	Trabajador Test a1d1abf1	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:07.98-06	2026-11-11 20:47:07.976-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
19afe2c2-c524-4b3d-8e0a-6cf8346bd7e5	Trabajador Test a1d1abf1	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:08.777-06	2026-11-11 20:47:08.773-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
079fdc9d-4157-4c37-842c-1014e91459f8	Trabajador Test a1d1abf1	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:09.576-06	2026-11-11 20:47:09.573-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f034b9c2-c917-4be0-a150-8c9adafd8ed8	Trabajador Test a1d1abf1	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:10.395-06	2026-11-11 20:47:10.391-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
29448d67-8403-429a-9c16-c8661e866f8a	Trabajador Test a1d1abf1	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:11.197-06	2026-11-11 20:47:11.193-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
24d8cbc4-2bf7-4c36-9a24-700b0aec69c4	Trabajador Test c660bb95	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:40.066-06	2026-11-11 20:47:40.041-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9a0bd817-4b62-4599-bac5-9f67bf92050f	Trabajador Licencia c660bb95	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:40.934-06	2026-11-11 20:47:40.92-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
746ccfd1-252c-4394-a489-17be9f2c5260	Con identidad c660bb95	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:41.772-06	2026-11-11 20:47:41.766-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
40998a60-95c5-45d1-a402-bc6a46fdbb0f	Carrera A c660bb95	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:43.52-06	2026-11-11 20:47:43.497-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
83773692-8aea-4ecf-9a85-caa71484274f	Carrera B c660bb95	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:43.734-06	2026-11-11 20:47:43.715-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d775af84-1808-494f-9e83-16846b291749	Trabajador Test c660bb95	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:44.825-06	2026-11-11 20:47:44.816-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
dc58b67d-509d-46d0-b5ad-70d43c057016	Trabajador Test c660bb95	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:45.751-06	2026-11-11 20:47:45.744-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7cdaf7cd-e837-4028-8763-db7d128d0049	Trabajador Test c660bb95	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:46.645-06	2026-11-11 20:47:46.641-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7a99612c-e5db-47d8-8798-b66f74a357f7	Trabajador Test c660bb95	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:47.46-06	2026-11-11 20:47:47.456-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f44c486b-eb64-4021-9acb-d7e4c21b71f4	Trabajador Test c660bb95	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:48.259-06	2026-11-11 20:47:48.255-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
ad5cec96-abba-47cc-a6a7-c0335cd34b3c	Trabajador Test c660bb95	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:49.072-06	2026-11-11 20:47:49.066-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b5dfc1e5-4579-4173-b85d-158e3bcc8106	Trabajador Test c660bb95	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:49.885-06	2026-11-11 20:47:49.876-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
49503234-01ec-436a-b8ae-a19cf15918d4	Trabajador Test c660bb95	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 20:47:50.804-06	2026-11-11 20:47:50.8-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6130dee0-2457-4015-8041-ddd8e555da7b	Juan Perez Garcia	\N	\N	\N	\N	\N	3231013548	\N	\N	\N	\N	t	2026-11-11 21:27:27.191-06	2026-11-11 21:27:27.179-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c5c6adb3-4409-4f03-b0ef-a42721d1f3ba	PinInt	4480b4b2	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-11 21:37:03.506-06	2026-11-11 21:37:03.26-06	\N	\N	\N
57beb929-bac5-4072-a0eb-32178d9c86f6	Trabajador Test ef7cbd39	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 21:37:06.607-06	2026-11-11 21:37:06.578-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b07f41df-a205-4070-a043-9a968c97784d	Trabajador Licencia ef7cbd39	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 21:37:07.627-06	2026-11-11 21:37:07.614-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9e9a5d92-8470-4083-af5c-85637df7b494	Con identidad ef7cbd39	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 21:37:08.659-06	2026-11-11 21:37:08.653-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7192b160-07f1-4b74-9588-3ba499431ef3	Rosa	Marin	\N	\N	\N	jefe-inttest-7f56d79b@svr-erp.local	5598765432	\N	\N	\N	\N	t	2026-11-11 21:37:09.205-06	2026-11-11 21:37:09.204-06	\N	\N	\N
7e33c7bb-50c6-4cca-a6d2-7b2d05acdebc	Integration	Tester	\N	\N	\N	inttest-7f56d79b@svr-erp.local	5512345678	\N	\N	\N	\N	t	2026-11-11 21:36:57.068-06	2026-11-11 15:37:09.633042-06	\N	\N	\N
6d7c51a5-597d-4ba0-a1b9-82ea052bcab3	Carrera A ef7cbd39	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 21:37:10.304-06	2026-11-11 21:37:10.298-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
26ed2d71-9d03-464f-97fe-4eb132f8bb93	Carrera B ef7cbd39	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 21:37:10.38-06	2026-11-11 21:37:10.367-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2c52aca1-7754-42c2-b629-659555be178c	Trabajador Test ef7cbd39	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 21:37:11.407-06	2026-11-11 21:37:11.395-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e197d837-4bdf-4742-b9d9-63f8db452270	Trabajador Test ef7cbd39	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 21:37:12.34-06	2026-11-11 21:37:12.332-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
3af09d39-8cce-448d-b78c-951ca38eca17	Trabajador Test ef7cbd39	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 21:37:13.214-06	2026-11-11 21:37:13.209-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9cfa703e-3d3f-41b0-bfcc-2dbe24ddb837	Trabajador Test ef7cbd39	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 21:37:14.202-06	2026-11-11 21:37:14.193-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
71a7e306-b31f-46a1-937c-f9e1aef167cb	Trabajador Test ef7cbd39	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 21:37:15.019-06	2026-11-11 21:37:15.013-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
110f18c8-00f4-42d2-b2cf-0b74d87665c6	Trabajador Test ef7cbd39	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 21:37:15.776-06	2026-11-11 21:37:15.771-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
73f6ad35-bbee-4784-96d1-a6dc58726907	Trabajador Test ef7cbd39	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 21:37:16.595-06	2026-11-11 21:37:16.59-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f41e790b-0851-476f-a003-cebd0471b73e	Trabajador Test ef7cbd39	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-11 21:37:17.417-06	2026-11-11 21:37:17.411-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
0f9b1d74-c46d-474c-bb43-d5d05aa18c20	Ramiro	Angulo	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-14 08:16:14.09-06	2026-11-14 08:16:14.089-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
37b3b718-453c-418a-97b8-bcde752328f0	Trabajador Test d297d63f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:11:50.613-06	2026-11-12 02:11:50.582-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b7b69281-bd88-49d7-becb-1e51c5c2f366	Trabajador Licencia d297d63f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:11:51.495-06	2026-11-12 02:11:51.481-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9cda9c82-39d0-42f7-a519-22d4acff75d3	Con identidad d297d63f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:11:52.299-06	2026-11-12 02:11:52.293-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c7c3704f-1e55-4999-b521-33c1ca9b5bc3	Carrera A d297d63f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:11:53.272-06	2026-11-12 02:11:53.237-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
0faeebc5-14ec-454a-a48a-a871596aea50	Carrera B d297d63f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:11:54.041-06	2026-11-12 02:11:54.035-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
660c06cb-2d8c-4e5f-8402-cc7ae874290a	Saul	Osuna	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-14 08:16:14.53-06	2026-11-14 08:16:14.53-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
1d1c9626-7b25-4c15-94a2-d97f86433b28	Trabajador Test d297d63f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:11:55.406-06	2026-11-12 02:11:55.394-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
1ecfbae1-bbb9-46f0-a2d8-9063a303b6a4	Trabajador Test d297d63f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:11:56.399-06	2026-11-12 02:11:56.39-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2aa655e1-5a03-4a20-8133-54ec9f50dc98	Trabajador Test d297d63f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:11:57.28-06	2026-11-12 02:11:57.274-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e096cc71-8b5a-49b1-af0a-a6fb8815d08e	Trabajador Test d297d63f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:11:58.093-06	2026-11-12 02:11:58.082-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
608fc614-049b-4567-ada1-7e41a207c6fb	Trabajador Test d297d63f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:11:58.925-06	2026-11-12 02:11:58.92-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f336ad76-99f4-4d0e-9cbf-3a21a3a8d117	Trabajador Test d297d63f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:11:59.72-06	2026-11-12 02:11:59.716-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
ea3f45ca-3de7-414c-8775-9d2a6b126cea	Trabajador Test d297d63f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:12:00.6-06	2026-11-12 02:12:00.592-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
49893df4-c0a5-4705-a8c1-3c691916a355	Trabajador Test d297d63f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:12:01.422-06	2026-11-12 02:12:01.418-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
8c1b3637-d53d-43aa-b01e-3f31c3960f9e	Trabajador Test 135ee994	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:18:26.511-06	2026-11-12 02:18:26.484-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
58bff346-8e76-4002-8001-d92f6b9273da	Trabajador Licencia 135ee994	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:18:27.435-06	2026-11-12 02:18:27.422-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
67e22266-8690-40f0-8e8c-369c9a55f27e	Con identidad 135ee994	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:18:28.258-06	2026-11-12 02:18:28.252-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6a90ed75-2a4c-4004-9a89-543fec63efb6	Carrera A 135ee994	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:18:29.104-06	2026-11-12 02:18:29.098-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d79d96b0-7a64-41dd-b0fc-2cc2f21a1554	Carrera B 135ee994	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:18:29.881-06	2026-11-12 02:18:29.869-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
84b58653-6c93-475a-a1f7-265ed7ebd781	Hueco alta 135ee994	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:18:30.929-06	2026-11-12 02:18:30.923-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
fbe7f568-1880-4b24-be3b-613431d44ef6	Trabajador Test 135ee994	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:18:32.042-06	2026-11-12 02:18:32.029-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7059dbe1-3c29-43bf-8cdb-4a92d05e7352	Trabajador Test 135ee994	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:18:32.985-06	2026-11-12 02:18:32.975-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
ef493bab-a2c9-4dff-904b-7675d31c7b79	Trabajador Test 135ee994	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:18:33.872-06	2026-11-12 02:18:33.867-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
26e94466-1f41-490b-b527-9b2bc52c0a11	Trabajador Test 135ee994	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:18:34.666-06	2026-11-12 02:18:34.661-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
510c223d-edbf-4193-a501-52d1e41a2679	Trabajador Test 135ee994	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:18:35.464-06	2026-11-12 02:18:35.46-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
5d2c2906-5887-4844-a7b9-8121bc06f53e	Trabajador Test 135ee994	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:18:36.32-06	2026-11-12 02:18:36.316-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d17e8dd4-b0fe-4a3f-a3a8-d520fb074a70	Trabajador Test 135ee994	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:18:37.135-06	2026-11-12 02:18:37.13-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
3b6fc7a1-937d-48da-a807-07bf3c84d7bc	Trabajador Test 135ee994	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 02:18:37.943-06	2026-11-12 02:18:37.938-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
ba3ebb19-bfb5-45f4-a5cb-9255dc156dd3	PinInt	145dc769	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-12 02:29:35.561-06	2026-11-12 02:29:35.346-06	\N	\N	\N
cb1dcd21-080a-4497-baa4-4d33cb190292	PinInt	b9bd1bad	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-12 03:32:57.01-06	2026-11-12 03:32:56.795-06	\N	\N	\N
3b85a293-49fe-4028-8136-0b05d3d56069	PinInt	947460cb	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-12 04:02:26.606-06	2026-11-12 04:02:26.374-06	\N	\N	\N
27b1482d-068e-41b5-b182-ee17286d2b42	Trabajador Test 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:20:59.967-06	2026-11-12 04:20:59.897-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
69b58c0c-88ac-4b21-9837-32b413352ed5	Trabajador Licencia 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:21:00.86-06	2026-11-12 04:21:00.845-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a542d6cc-2a98-4d92-bfcc-76aea2bf930f	Trabajador Test 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:21:01.67-06	2026-11-12 04:21:01.665-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2fb9b72d-ec6d-40d3-911a-199504eb7eef	Con identidad 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:21:02.773-06	2026-11-12 04:21:02.762-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6fc167e5-a6e8-47fd-85ff-98cbf6ab2deb	Carrera B 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:21:04.556-06	2026-11-12 04:21:04.55-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7293295a-4f07-435c-aa21-8d99f8966a78	Carrera A 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:21:04.709-06	2026-11-12 04:21:04.55-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e4a53cb5-46d4-4a5a-91b6-676e1cd4c4a6	Hueco alta 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:21:05.749-06	2026-11-12 04:21:05.742-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
22bf629c-6db0-4f6f-96f6-f4e56016c223	Trabajador Test 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:21:06.61-06	2026-11-12 04:21:06.601-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
4ebafad1-614a-49b7-a4cc-f48e5e5a6c90	Trabajador Test 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:21:07.49-06	2026-11-12 04:21:07.48-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f909a5c6-cb57-42f8-a8c3-b31b0eed9084	Trabajador Test 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:21:08.359-06	2026-11-12 04:21:08.351-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
586b9987-a950-49d4-84e2-7d4d0a7eb907	Trabajador Test 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:21:09.152-06	2026-11-12 04:21:09.147-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
db45415b-aaa7-449d-8b2f-aaf67051ed8f	Trabajador Test 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:21:09.975-06	2026-11-12 04:21:09.97-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b9d3731b-3b10-4cd9-8510-9dfeb44a1736	Trabajador Test 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:21:10.756-06	2026-11-12 04:21:10.751-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d396f63e-e76c-4882-81bf-4688ef0877aa	Trabajador Test 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:21:11.639-06	2026-11-12 04:21:11.634-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
149bfc02-15d7-4c00-a807-625644211027	Trabajador Test 0faaa341	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:21:12.511-06	2026-11-12 04:21:12.506-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
cd114051-d6eb-4e35-9063-12e6b194a41f	Trabajador Test d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:01.742-06	2026-11-12 04:41:01.661-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9c6087ab-37cb-4b43-8e27-641a651ac4f9	Trabajador Licencia d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:02.605-06	2026-11-12 04:41:02.593-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a56ef48f-738a-4e15-b3dd-25cb92926c9d	Trabajador Test d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:03.414-06	2026-11-12 04:41:03.408-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f7bbc8e0-850d-4aa9-89eb-392335679d24	Con identidad d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:04.4-06	2026-11-12 04:41:04.389-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
df92c8b3-97ed-4fab-bf9b-89cafb876fd5	Carrera B d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:06.022-06	2026-11-12 04:41:06.015-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9304f356-e68f-412d-8f53-bc561bca56ac	Carrera A d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:06.195-06	2026-11-12 04:41:06.012-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9ce5755f-ef89-4744-860e-2429c0c9b65f	Hueco alta d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:07.293-06	2026-11-12 04:41:07.287-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
13ff742c-7865-4bfa-b5fe-5c6a9c121026	Trabajador Test d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:08.143-06	2026-11-12 04:41:08.134-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
30e91172-32fb-4718-82bb-933cec0273a4	Trabajador Test d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:09.006-06	2026-11-12 04:41:08.996-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
17c5d14b-27c4-4d68-9c94-56e387eb9efa	Trabajador Test d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:09.894-06	2026-11-12 04:41:09.885-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d352d358-8632-4b1a-91e6-ae7c93691e09	Trabajador Test d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:10.731-06	2026-11-12 04:41:10.726-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6454f2f5-922e-4eca-81f8-d7c7edb24cdb	Trabajador Test d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:11.524-06	2026-11-12 04:41:11.52-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
89d00c84-9d29-403b-ac72-71d75b61b497	Trabajador Test d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:12.361-06	2026-11-12 04:41:12.356-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
10767030-6a27-4d63-b8a1-e92b6f8c1765	Enrique	Lugo	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-14 08:16:14.939-06	2026-11-14 08:16:14.938-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
85b03832-68e8-4b20-b731-d67e2108f7d1	PinInt	f5ffd367	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-18 22:10:11.728-06	2026-11-18 22:10:11.525-06	\N	\N	\N
f877fbbe-7fc6-421c-9e51-be7d9eb914c9	Con identidad 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:41.09-06	2026-11-18 22:11:41.078-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2f71b8fe-8acd-490d-8c42-3d2e12e9884c	Carrera B 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:43.085-06	2026-11-18 22:11:42.734-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a069b1e8-ddd6-4ef6-9acc-b26e06c74406	Hueco alta 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:44.004-06	2026-11-18 22:11:43.997-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
0bb08291-9eb9-4e19-8498-1b7fdd75087c	Trabajador Test 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:47.32-06	2026-11-18 22:11:47.315-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c8c4b43a-6939-445b-b4a2-bac83b15f02e	Trabajador Test 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:48.125-06	2026-11-18 22:11:48.121-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
0757cb09-fe54-4ca5-b213-7bcece74b666	Trabajador Test 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:48.925-06	2026-11-18 22:11:48.919-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a3351935-e7cc-43d6-97a5-2cdadfd023f7	Cambio rol 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:51.397-06	2026-11-18 22:11:51.387-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b0d3d615-8ca6-4be4-be2d-bfcbb7eb152e	Tecnico torre 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:53.058-06	2026-11-18 22:11:53.053-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
ec69b586-bbc1-4000-a187-15a00ad168fb	Cambio puesto 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:53.865-06	2026-11-18 22:11:53.86-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c0dd16ff-120e-4bb8-a60f-e52c60f0c698	Con identidad 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:13:55.968-06	2026-11-18 22:13:55.956-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
fb581842-7cfd-408a-8c8c-9c9800dc082e	Carrera B 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:13:58.216-06	2026-11-18 22:13:58.209-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7c1d13f0-598f-45d4-bd45-649a8ff1aed0	Trabajador Test 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:14:03.022-06	2026-11-18 22:14:03.012-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f9137f56-a46a-4e7f-9687-fa1eff0fb651	Cambio rol 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:14:11.316-06	2026-11-18 22:14:11.303-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c621cc22-f70e-4d6c-8027-4d7a8c9c8e2f	Tecnico torre 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:14:13.569-06	2026-11-18 22:14:13.564-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a487bfee-2232-4dd1-b1d0-10dff104bd9f	Integration	Tester	\N	\N	\N	inttest-4e6df254@svr-erp.local	5512345678	\N	\N	\N	\N	t	2026-11-18 22:14:04.718-06	2026-11-18 16:14:14.181477-06	\N	\N	\N
6639b557-d747-450e-8fa1-31f2b5cbe31b	Cambio puesto 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:14:14.888-06	2026-11-18 22:14:14.878-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d86bba34-921a-4cfa-ba23-2ca2cf9900ae	Trabajador Test fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:07.714-06	2026-11-18 22:15:07.704-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e2a31b35-9b6c-4ae4-a779-ad81370b8f91	Rosa	Marin	\N	\N	\N	jefe-inttest-daf59d98@svr-erp.local	5598765432	\N	\N	\N	\N	t	2026-11-18 22:15:10.352-06	2026-11-18 22:15:10.351-06	\N	\N	\N
b0de4f92-1a30-44db-ab1c-73204ee6fde6	Integration	Tester	\N	\N	\N	inttest-daf59d98@svr-erp.local	5512345678	\N	\N	\N	\N	t	2026-11-18 22:15:01.245-06	2026-11-18 16:15:10.879654-06	\N	\N	\N
66f8e4e0-5fbf-48ee-8557-8194f27e6f74	Carrera A 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:16.207-06	2026-11-18 22:19:16.02-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6c84f52f-f5d8-404a-8c73-5c844bd87f8f	Hueco alta 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:17.25-06	2026-11-18 22:19:17.245-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7237643f-4b98-4bdd-9dae-ad15e12ff974	Trabajador Test 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:19.112-06	2026-11-18 22:19:19.103-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
5531af1f-1a97-435b-b405-38e1f90f5929	Trabajador Test 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:57:18.103-06	2026-11-18 21:57:18.092-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c068b4e5-6a2f-461b-816b-e5d343f94086	Trabajador Test 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:57:19.56-06	2026-11-18 21:57:19.555-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
863919da-1b14-4f19-b14e-bc75c5afcb3c	Trabajador Test 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:57:20.46-06	2026-11-18 21:57:20.443-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
101fbfcd-ae22-4752-9799-6907df2ff4d0	PinInt	b0f6feda	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-18 22:02:57.263-06	2026-11-18 22:02:57.05-06	\N	\N	\N
6fcded52-39a8-4116-90aa-8a076ae50fa8	Integration	Tester	\N	\N	\N	inttest-4c1577d0@svr-erp.local	5512345678	\N	\N	\N	\N	t	2026-11-18 22:19:11.653-06	2026-11-18 16:19:19.541567-06	\N	\N	\N
ba17b64e-399c-40b0-9ca3-481655f3c935	Carrera A 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:35.305-06	2026-11-18 22:03:35.066-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
038201f9-589d-424d-8cd0-95b48fb2bf00	Hueco alta 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:36.224-06	2026-11-18 22:03:36.219-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
67c44e00-172e-4b25-b12b-b150f4c33401	Cambio rol 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:43.555-06	2026-11-18 22:03:43.55-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6e1625dc-d34c-46ad-9e66-ef6ca38fa3d9	Tecnico torre 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:45.214-06	2026-11-18 22:03:45.21-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d7447c26-ec86-40b9-81c8-415543910fe2	Cambio puesto 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:46.041-06	2026-11-18 22:03:46.037-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c2e1adea-9279-4431-816c-5459c6ffc6f0	Cambio rol 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:26.698-06	2026-11-18 22:19:26.693-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6f22df4a-061c-4efd-9a7c-5b3a4fca5cf2	Tecnico torre 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:29.777-06	2026-11-18 22:19:29.772-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9a0c9624-78a0-46d6-95ec-1e0e59d6a741	Cambio puesto 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:31.272-06	2026-11-18 22:19:31.266-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7bde0bc4-22ec-4698-a84f-5b2ab59eb80c	Trabajador Test d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:13.185-06	2026-11-12 04:41:13.18-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
dfd730d1-49b5-48c6-a3a6-ad8d4fbf91d9	Trabajador Test d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:14.039-06	2026-11-12 04:41:14.033-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
abc54bba-9620-4122-8a62-6872525b98a2	Telefono	Smoke	\N	\N	\N	\N	322-123-4567	\N	\N	\N	\N	t	2026-11-14 08:39:55.445-06	2026-11-14 08:39:55.444-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e9ef1537-d482-40d5-8f23-6548346602e6	MonoRol Editado	Test	\N	\N	\N	\N	322-999-8888	\N	\N	\N	\N	t	2026-11-14 09:07:33.443-06	2026-11-14 03:07:33.987113-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
4fd46bfb-6dfd-4b9b-be66-8efa22069faa	PinInt	48df7c6b	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-18 22:11:20.991-06	2026-11-18 22:11:20.979-06	\N	\N	\N
a7c42038-744e-4d1e-a776-c88493bdcaa3	Carrera A 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:42.74-06	2026-11-18 22:11:42.539-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b4a22221-6893-47fc-860f-2acc6cf15c58	Trabajador Test 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:45.653-06	2026-11-18 22:11:45.645-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
aa7f9249-ab9a-42c8-9b64-21eec13de260	PinInt	dcc182f0	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-18 22:12:23.439-06	2026-11-18 22:12:23.429-06	\N	\N	\N
226eaa27-64fb-4b31-9662-9f1707fc87c0	Carrera A 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:13:58.403-06	2026-11-18 22:13:58.2-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
aa89cc4b-057d-4979-841f-c7ff55965b59	Hueco alta 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:13:59.944-06	2026-11-18 22:13:59.936-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
04b395c5-abf3-45d9-a015-92e22de07925	Trabajador Test fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:14:58.273-06	2026-11-18 22:14:58.228-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
dbe033f3-bd2e-4f80-8628-26955c91edf6	Con identidad fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:02.725-06	2026-11-18 22:15:02.712-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
12f72b67-20b8-4b53-b4e3-a057a04c4be3	Carrera B fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:05.273-06	2026-11-18 22:15:05.006-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
1d94deb5-0a82-49ec-8082-1c1c25d0802f	PinInt	46f93465	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-18 21:56:17.715-06	2026-11-18 21:56:17.413-06	\N	\N	\N
2c3e481f-6b4a-460f-80f6-6d4eef8c3b9e	Integration	Tester	\N	\N	\N	inttest-5708df43@svr-erp.local	5512345678	\N	\N	\N	\N	t	2026-11-18 21:56:56.461-06	2026-11-18 15:57:04.483501-06	\N	\N	\N
f642cf7e-593f-454f-bdcd-f7ad0abecbf6	Cambio rol 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:57:24.022-06	2026-11-18 21:57:24.017-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
4dbad0ce-428e-43ec-9734-90a27e7594c5	Hueco alta fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:06.44-06	2026-11-18 22:15:06.434-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
8a2bd7e7-e459-4500-b048-08d917dad0d1	Tecnico torre 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:57:26.222-06	2026-11-18 21:57:26.217-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d4f4d8ec-a6a9-4cf1-b617-26984e97134a	Cambio puesto 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:57:27.401-06	2026-11-18 21:57:27.396-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
eb4da636-0a5b-4559-8dfc-52fbfef11bae	Trabajador Test fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:08.886-06	2026-11-18 22:15:08.876-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2a53b6f8-f7d4-4200-a531-621ce1ba31ac	Trabajador Test 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:30.755-06	2026-11-18 22:03:30.736-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
8cd123f8-fe5c-44f5-a488-3f9d1127c433	Trabajador Licencia 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:31.602-06	2026-11-18 22:03:31.587-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7a395098-1d3f-4c9b-9f8d-5707d6b5e2f4	Trabajador Test 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:32.422-06	2026-11-18 22:03:32.417-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9fd90d3f-11e1-4be0-93d5-1cdf0d89b2ba	Trabajador Test 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:37.038-06	2026-11-18 22:03:37.027-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e09f7bbe-dee2-4f38-b1c0-e0a05386ab8f	Trabajador Test 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:38.712-06	2026-11-18 22:03:38.707-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
41a517cd-a435-4eed-9b81-e17ab32b1a29	Trabajador Test 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:41.876-06	2026-11-18 22:03:41.871-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
5d86c539-17ba-46e6-8eea-829392a6105b	Trabajador Test 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:42.738-06	2026-11-18 22:03:42.734-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
970119f7-ea07-41a8-8893-6caec445ef9a	Alta por puesto 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:46.877-06	2026-11-18 22:03:46.873-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
cc0545f8-7db0-43a1-98ee-ee3037fba2c7	Trabajador Test fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:11.215-06	2026-11-18 22:15:11.203-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d2879bc9-0b70-4acb-b610-f6258ae35dd1	Trabajador Test fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:12.636-06	2026-11-18 22:15:12.63-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7a8961de-4176-4aaa-a0ef-cde1d245d3d6	Trabajador Test fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:14.05-06	2026-11-18 22:15:14.044-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f45986ee-328a-4c87-ae5d-edea35330d83	Alta por puesto fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:24.016-06	2026-11-18 22:15:24.009-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d2a891b2-23d6-477d-89e9-1ea8639823bc	PinInt	8beda5f9	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-18 22:19:13.409-06	2026-11-18 22:19:13.408-06	\N	\N	\N
ebce780d-5fc1-43d4-a233-621f45a1c439	Trabajador Test 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:18.193-06	2026-11-18 22:19:18.182-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b22fd560-c7b6-4a0f-9945-f6c32f27ee84	Trabajador Test 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:20.139-06	2026-11-18 22:19:20.134-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
ca8a81f5-4e5f-411e-becf-07f32423bb51	Trabajador Test 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:21.427-06	2026-11-18 22:19:21.38-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d057f0ae-8523-42ac-84ae-3cee0599671c	Trabajador Test 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:22.474-06	2026-11-18 22:19:22.466-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
18e9e451-097c-4528-9e72-da4fd3ee6dc8	Trabajador Test 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:23.47-06	2026-11-18 22:19:23.465-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c70baa44-c071-4c09-97a0-802a62e5330f	Cambio rol d94d6c1f	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:14.872-06	2026-11-12 04:41:14.867-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a7edf5b9-c6e0-4692-b942-fe20ec52189a	Trabajador Test 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:38.499-06	2026-11-18 22:11:38.482-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
8c6a8da5-9cc5-4833-bc7f-b6069373e0c2	Trabajador Test f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:46.381-06	2026-11-12 04:41:46.359-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
caf62a73-1909-4eb0-9840-28f1ce7634a9	Trabajador Licencia f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:47.194-06	2026-11-12 04:41:47.18-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
5c7915dc-ff22-4af0-b5db-1c69ad64741d	Trabajador Test f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:48.008-06	2026-11-12 04:41:48.002-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
51c0a1cb-ab85-4a2b-8f43-8fc24795212d	Con identidad f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:49.147-06	2026-11-12 04:41:49.136-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
26e2febc-fa72-4e57-ad9c-1acb34428f28	Carrera B f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:50.742-06	2026-11-12 04:41:50.735-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
0a6f75fa-64d4-4a7b-8f1c-b2a734182202	PinInt	53cefceb	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-18 22:13:21.364-06	2026-11-18 22:13:21.353-06	\N	\N	\N
40d68864-4d11-4352-afdb-8557bce42aae	Carrera A f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:50.89-06	2026-11-12 04:41:50.732-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2fd2e132-8409-490c-a238-fcdc81514bc6	PinInt	3b394eb9	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-18 22:14:59.605-06	2026-11-18 22:14:59.603-06	\N	\N	\N
16cad722-5625-4ec9-9c91-14ecc575147b	Hueco alta f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:51.813-06	2026-11-12 04:41:51.808-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b3c5326b-d737-45fc-a8eb-1ed3240fd263	Trabajador Test f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:52.65-06	2026-11-12 04:41:52.64-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7e1eaed2-4b68-4cc8-892a-2c14afec72c4	Trabajador Test f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:53.535-06	2026-11-12 04:41:53.526-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e1fd3e94-4407-453b-adc1-4eb6ec24fbd8	Trabajador Test f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:54.406-06	2026-11-12 04:41:54.398-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
92462a34-ec59-458c-8a4b-c6f11b4cd476	Trabajador Test f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:55.237-06	2026-11-12 04:41:55.232-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b547ef70-0ca9-411a-8d91-9216e98b1a83	Trabajador Test f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:56.054-06	2026-11-12 04:41:56.049-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
358842bf-3bf2-4bc6-88fb-a8ed93557bcc	Trabajador Test f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:56.922-06	2026-11-12 04:41:56.917-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
4022d32b-af9c-4712-8e14-eaddaedd17f1	Trabajador Test f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:57.737-06	2026-11-12 04:41:57.731-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
ecdbc0d3-ba4c-4694-92fb-6b2a4d19a3d3	Trabajador Test f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:58.579-06	2026-11-12 04:41:58.574-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e240b788-9bb3-4f2c-ae4f-e404fff9a65d	Cambio rol f44137bf	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:41:59.386-06	2026-11-12 04:41:59.38-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
1e34a298-12a3-4785-be08-10370a9071ec	Trabajador Test 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:32.15-06	2026-11-12 04:42:32.128-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
4c4ef229-a98f-457b-a6e1-d98bbead94e6	Trabajador Licencia 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:33.004-06	2026-11-12 04:42:32.991-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
16c0a567-e767-4d9c-8fdf-b16f8c4fbeec	Trabajador Test 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:33.876-06	2026-11-12 04:42:33.87-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
40a1cb04-1ffc-476e-9d7d-7e5303681968	Con identidad 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:34.879-06	2026-11-12 04:42:34.868-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
774cba22-d6ed-482c-a672-a564caf7c4f0	Carrera B 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:36.627-06	2026-11-12 04:42:36.619-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c655e532-2dbc-48ce-955c-c47f9abb0205	Carrera A 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:36.794-06	2026-11-12 04:42:36.616-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
1441f75e-25b1-4776-8b70-42690a17f892	Hueco alta 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:37.888-06	2026-11-12 04:42:37.883-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6f4750c3-6fbd-4282-b1cc-a66520f07808	Trabajador Test 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:38.775-06	2026-11-12 04:42:38.764-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
92ae24b9-5c6e-4a02-97c6-571b817e6fb6	Trabajador Test 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:39.662-06	2026-11-12 04:42:39.652-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b2ff6672-69fa-4e65-a8d4-66dbfab6d15e	Trabajador Test 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:40.571-06	2026-11-12 04:42:40.563-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
4919f245-e3d5-4ff6-84b8-3fe4f6bcb39d	Trabajador Test 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:41.464-06	2026-11-12 04:42:41.459-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c607de1b-044c-4737-b779-5d32e58a3592	Trabajador Test 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:42.348-06	2026-11-12 04:42:42.343-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e43ab0c0-bcf5-4e80-8276-49358b7e2e6e	Trabajador Test 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:43.201-06	2026-11-12 04:42:43.196-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
0cc73db0-fcf2-4773-9361-4cf5121aec77	Trabajador Test 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:44.058-06	2026-11-12 04:42:44.052-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d2cf3540-f428-473a-ab90-7a1949bdb567	Trabajador Test 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:44.894-06	2026-11-12 04:42:44.888-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a5c8f6a8-d5f8-42e0-8d46-4a1c83cadfa8	Cambio rol 70c93611	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:42:45.773-06	2026-11-12 04:42:45.768-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
4dbf4cd0-e719-4375-b084-80c63000e1ac	Trabajador Test 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:31.726-06	2026-11-12 04:43:31.705-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
558fa28c-a721-47a5-94a2-a32ed46e4678	Trabajador Licencia 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:32.613-06	2026-11-12 04:43:32.601-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
557b36b5-03c3-4824-80c4-91222646617b	Trabajador Test 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:33.419-06	2026-11-12 04:43:33.414-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a5150c71-20a8-42d1-9315-78e67cd29515	Con identidad 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:34.42-06	2026-11-12 04:43:34.41-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e3c66044-f19a-4d03-89c1-8c7e31ecb800	Carrera B 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:36.041-06	2026-11-12 04:43:36.034-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
ef98fa3f-1811-4ef5-a58f-ffc4b621631d	Carrera A 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:36.218-06	2026-11-12 04:43:36.028-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
3d9fd9a1-d450-437a-a3ed-f582c0d420fa	Hueco alta 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:37.49-06	2026-11-12 04:43:37.485-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
849c6efc-5aa7-4c7d-bb27-2365ba4b856b	Trabajador Test 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:38.369-06	2026-11-12 04:43:38.359-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2cf2250a-9a72-4d26-941a-5c82d883dda1	Trabajador Test 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:39.242-06	2026-11-12 04:43:39.234-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
0b6e3a93-40bf-4ff4-a633-ca07d926367e	Trabajador Test 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:40.109-06	2026-11-12 04:43:40.105-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
4a0a7481-e1e2-4ab1-998c-56382adc921b	Trabajador Test 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:40.932-06	2026-11-12 04:43:40.927-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c0f871bb-f826-4677-be78-8625844b8e8b	Trabajador Test 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:41.805-06	2026-11-12 04:43:41.801-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2cc6cceb-b0e2-405d-be16-a3fe9a901a03	Trabajador Test 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:42.705-06	2026-11-12 04:43:42.701-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
917df044-171b-4652-ab55-75059ab2a6fa	Trabajador Test 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:43.551-06	2026-11-12 04:43:43.543-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
1442ca46-ee11-4f2c-a373-09110764c147	Trabajador Test 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:44.358-06	2026-11-12 04:43:44.353-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
61255fa7-5c3a-4072-9cac-1376708e7bf3	Cambio rol 454e5645	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:43:45.509-06	2026-11-12 04:43:45.502-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
76961e6b-6f0b-4224-8097-e4000728925c	Trabajador Test 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:09.655-06	2026-11-12 04:46:09.636-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c58d43c5-3175-4b72-8dcd-f72f2f31b058	Trabajador Licencia 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:10.516-06	2026-11-12 04:46:10.505-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7dd54192-080e-4417-b290-79109894f0d4	Trabajador Test 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:11.323-06	2026-11-12 04:46:11.318-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
614bbf3b-55b6-4e51-ab26-8695d3a4568b	Con identidad 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:12.579-06	2026-11-12 04:46:12.569-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
24380140-e6ea-4e81-aaf8-3bea2dc98be4	Carrera B 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:14.232-06	2026-11-12 04:46:14.224-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
90f62b4a-8b49-4804-af91-6b2e95c80728	Carrera A 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:14.376-06	2026-11-12 04:46:14.221-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9b092b5b-113d-4a42-98d2-b773f684a7cd	Trabajador Licencia 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:39.309-06	2026-11-18 22:11:39.295-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f89a3fcd-fcb9-4fc4-9f63-a626314e00e6	Hueco alta 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:15.395-06	2026-11-12 04:46:15.39-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
92a037c3-046e-4b6c-b134-2c2419d94176	Trabajador Test 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:16.312-06	2026-11-12 04:46:16.303-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
1b00d3e6-a601-4bce-bbfd-4c90fa11d040	Trabajador Test 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:17.196-06	2026-11-12 04:46:17.188-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a21ace9b-889c-408e-99ab-3b32eda193f9	Trabajador Test 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:18.084-06	2026-11-12 04:46:18.079-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
bca60a6e-f211-487a-904f-5ac0a63490b1	Trabajador Test 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:18.917-06	2026-11-12 04:46:18.912-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
5ee0c101-d828-4adc-8ea5-3397bfb68d26	Trabajador Test 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:19.728-06	2026-11-12 04:46:19.724-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
31a306df-a397-423d-971f-7a6aa760a577	Trabajador Test 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:20.541-06	2026-11-12 04:46:20.537-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
5264199a-78db-44bf-a424-3fb408986f1b	Trabajador Test 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:21.382-06	2026-11-12 04:46:21.376-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
4a4c33f2-1d07-43d3-bc51-3bbef75124e6	Trabajador Test 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:22.229-06	2026-11-12 04:46:22.225-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7d9182e6-7374-489c-b574-cbcbf19f299a	Cambio rol 34cd1201	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 04:46:23.073-06	2026-11-12 04:46:23.069-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9757f966-6236-45c7-8f34-bf074cca0396	PinInt	4fa95c63	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-18 22:13:49.82-06	2026-11-18 22:13:49.808-06	\N	\N	\N
bc2fd32b-6bd8-4fb3-9a0c-b69da6015897	Juan Garcia Perez	\N	\N	\N	\N	\N	3231013548	\N	\N	\N	\N	t	2026-11-12 05:20:54.386-06	2026-11-12 05:20:54.359-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
1ffff646-de5c-4da1-84bd-81f61eb32acb	Trabajador Test 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:20.876-06	2026-11-12 05:47:20.807-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e8360960-560b-4122-a772-59cc046f9605	Trabajador Licencia 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:22.006-06	2026-11-12 05:47:21.994-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
940abfed-e0e4-46c5-b207-dcf3583b3176	Trabajador Test 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:22.806-06	2026-11-12 05:47:22.8-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
673903d9-51de-449f-a2bd-bffd4fe4713e	Con identidad 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:24.164-06	2026-11-12 05:47:24.152-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
89d13441-67a6-4238-85b3-4c73f6976e21	Carrera B 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:25.805-06	2026-11-12 05:47:25.797-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e991d77c-0953-4fbd-b496-9e7f653eaea0	Carrera A 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:25.962-06	2026-11-12 05:47:25.711-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
76d9c8ef-436b-4a27-85e3-b9427b792945	Hueco alta 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:27.29-06	2026-11-12 05:47:27.284-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
50e9bc19-97fc-40a3-9731-2bf1ac8f2e1d	Trabajador Test 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:28.395-06	2026-11-12 05:47:28.386-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b41371e8-8940-43ae-a862-830da3de7f85	Trabajador Test 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:29.329-06	2026-11-12 05:47:29.315-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9a7a1a75-6c86-4676-afc6-e6709db9ac10	Trabajador Test 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:30.209-06	2026-11-12 05:47:30.204-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2f724c37-de8f-442f-9d38-ade0dd47fb32	Trabajador Test 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:31.038-06	2026-11-12 05:47:31.034-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d44c93e0-f825-4514-9700-461973c57ae6	Trabajador Test 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:31.919-06	2026-11-12 05:47:31.915-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2c5d6e8d-e45d-4745-a603-3d6892b1a145	Trabajador Test 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:32.775-06	2026-11-12 05:47:32.769-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d9c9c506-d7ce-4f44-bc79-412e4ca237e2	Trabajador Test 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:33.932-06	2026-11-12 05:47:33.923-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
69df9956-aa52-4e55-afe7-f0a6a594acbd	Trabajador Test 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:35.098-06	2026-11-12 05:47:35.092-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
8184f36c-14f7-4fc0-ae95-5569ee54fb53	Cambio rol 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:35.979-06	2026-11-12 05:47:35.974-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6fba1767-ee0c-4d17-bde8-b0bd1f9c27a5	Tecnico torre 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:37.718-06	2026-11-12 05:47:37.713-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
3958fe8d-61d4-4d04-b1eb-f160b31e854e	Cambio puesto 1c552a11	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:47:38.517-06	2026-11-12 05:47:38.512-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
96ef22bb-2ec0-4483-85d0-cca4667add16	Trabajador Test 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:46.364-06	2026-11-12 05:48:46.343-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e7c352d2-8f5e-45ad-8d09-0a459c52d0ca	Trabajador Licencia 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:47.275-06	2026-11-12 05:48:47.261-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
78aaebd7-0abe-45f3-8dfb-8f3b11b2b416	Trabajador Test 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:48.146-06	2026-11-12 05:48:48.14-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a60f1041-706a-4adf-87a6-3f65f6ed574c	Con identidad 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:49.241-06	2026-11-12 05:48:49.231-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
3894368b-67fe-4ac5-a1e0-6338b2266305	Carrera B 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:50.943-06	2026-11-12 05:48:50.935-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
8d2bf77a-daae-4428-80c3-8c7f17004ea6	Carrera A 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:51.099-06	2026-11-12 05:48:50.933-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b6fa3964-4b2c-496b-8019-a30020a46ed8	Hueco alta 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:52.071-06	2026-11-12 05:48:52.066-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
af4d873d-36aa-446e-bee2-963b5ab4a1df	Trabajador Test 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:52.963-06	2026-11-12 05:48:52.954-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
bd39ac53-d975-4d78-94de-d9ff92959603	Trabajador Test 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:53.897-06	2026-11-12 05:48:53.887-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d89290fc-5117-4709-9b14-705cdb7d1403	Trabajador Test 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:54.867-06	2026-11-12 05:48:54.863-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
3bffdfb1-2908-42ee-983f-e89384beb535	Trabajador Test 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:55.728-06	2026-11-12 05:48:55.722-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
81e32505-1de5-4adf-8ae3-b3790b5ab422	Trabajador Test 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:56.597-06	2026-11-12 05:48:56.591-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6c7affc0-8134-4a88-971c-402b8e5d9457	Trabajador Test 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:57.93-06	2026-11-12 05:48:57.926-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
560271bf-7276-4925-8888-bde245ea4d69	Trabajador Test 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:58.84-06	2026-11-12 05:48:58.835-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a19804bb-53a2-47c5-8974-022b8fc1d91c	Trabajador Test 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:48:59.765-06	2026-11-12 05:48:59.761-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2e5dd87a-48de-4dbe-aace-a809a5b3adbe	Cambio rol 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:49:00.727-06	2026-11-12 05:49:00.721-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
8a065937-0e00-40d1-b152-ac673659114d	Tecnico torre 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:49:02.638-06	2026-11-12 05:49:02.634-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
08897f41-f1c5-458f-9832-87a40b16d582	Cambio puesto 90c6601d	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 05:49:03.47-06	2026-11-12 05:49:03.466-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
82135782-f9fa-458f-abac-63c07068860a	Trabajador Test 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:14:54.097-06	2026-11-12 19:14:54.064-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
419a6df0-b253-4557-ab05-539900babb17	Trabajador Licencia 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:14:55.156-06	2026-11-12 19:14:55.136-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a3a4a297-a0fa-49e7-ab77-245395b2c4ad	Trabajador Test 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:14:55.997-06	2026-11-12 19:14:55.991-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
33b098e5-09e5-475c-8340-6687a8649b04	Con identidad 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:14:57.132-06	2026-11-12 19:14:57.122-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
1fd157e2-b9b5-4d8b-879a-650009c43629	Carrera B 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:14:58.892-06	2026-11-12 19:14:58.887-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d0e6f233-3bb4-432c-9547-cc49bfe11b42	Carrera A 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:14:59.151-06	2026-11-12 19:14:58.851-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
372292a1-89ec-4a20-aa5a-108f1f0ab0f0	Hueco alta 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:15:01.08-06	2026-11-12 19:15:01.074-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
80d0dc93-ffce-4b58-812d-40349dc4857b	Trabajador Test 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:15:02.007-06	2026-11-12 19:15:01.998-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f1aafbf4-bcfe-461f-ac92-ac4fdf73b9f7	Trabajador Test 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:15:02.951-06	2026-11-12 19:15:02.937-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
5c17b05b-69e0-43ff-bf50-7e00402d698a	Trabajador Test 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:15:03.884-06	2026-11-12 19:15:03.88-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e084e539-1039-4896-b3b0-10c3e74bd673	Trabajador Test 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:15:04.782-06	2026-11-12 19:15:04.773-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
1e0fa8af-5b17-4110-9d85-b2aa43056e6d	Trabajador Test 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:15:05.674-06	2026-11-12 19:15:05.669-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
97296fda-44da-409d-9a5a-962aee3ee116	Trabajador Test 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:15:06.553-06	2026-11-12 19:15:06.548-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2b1fbf2d-cd72-47c0-abd2-3c5d167aca50	Trabajador Test 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:15:07.462-06	2026-11-12 19:15:07.457-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
265377b6-6a18-4f50-99a5-f799536e3254	Trabajador Test 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:15:08.912-06	2026-11-12 19:15:08.904-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f1eafcef-bf36-4793-9ba7-562a2c6bd1f1	Alta por puesto 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:15:14.63-06	2026-11-12 19:15:14.626-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
73da48b2-7d5a-49ce-85c5-bdf5a1713d2f	Trabajador Test 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:40.11-06	2026-11-18 22:11:40.104-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b23ec8c2-09bb-4032-8e24-d8b467c1f3a8	Trabajador Test 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:44.82-06	2026-11-18 22:11:44.809-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e65ca3e2-f69f-4752-9e7e-6604894a47fe	Trabajador Test 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:46.519-06	2026-11-18 22:11:46.514-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f6939f33-7bdf-4154-a7a4-0ef0589e2cc3	Trabajador Test 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:49.719-06	2026-11-18 22:11:49.714-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
4e7f91a3-28d5-4b69-a983-d3136fc86adc	Trabajador Test 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:50.566-06	2026-11-18 22:11:50.561-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
316f81a4-70a8-4b6b-8c36-a36e654ba6a9	Alta por puesto 678fb7dd	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:11:54.695-06	2026-11-18 22:11:54.691-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
ab54943b-5344-4c01-ab9f-6e0b7d209f95	Trabajador Test 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:13:51.915-06	2026-11-18 22:13:51.894-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
ed0b0e15-59b0-4bd9-842d-120cc0016cf5	Trabajador Licencia 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:13:53.093-06	2026-11-18 22:13:53.078-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c52e90d5-d062-4df0-8df7-db8fade875dc	Trabajador Test 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:13:54.402-06	2026-11-18 22:13:54.388-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
166bed45-9c7e-4d35-a9f7-91e809458ec5	Trabajador Test 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:14:01.348-06	2026-11-18 22:14:01.336-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
1f5f699a-237f-4c09-b3c5-e26b6ce2bd3c	Trabajador Test 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:14:04.403-06	2026-11-18 22:14:04.397-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
33cb9efd-eca6-4986-a137-7aa16dcac63c	Trabajador Test 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:14:05.943-06	2026-11-18 22:14:05.929-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
18ea7a1a-83a7-4cb5-86be-7863b20e0b06	Trabajador Test 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:14:07.043-06	2026-11-18 22:14:07.037-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b24766b8-15d3-4faa-9090-731e08e5993e	Trabajador Test 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:14:08.091-06	2026-11-18 22:14:08.086-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f4ada69b-6c39-47fb-8a3a-961c66633277	Trabajador Test 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:14:09.158-06	2026-11-18 22:14:09.152-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
50372f7f-f859-4f41-930e-73f500178bf1	Trabajador Test 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:14:10.182-06	2026-11-18 22:14:10.177-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
23bf7875-c6bb-40f7-9ca3-c01316444fa0	Rosa	Marin	\N	\N	\N	jefe-inttest-4e6df254@svr-erp.local	5598765432	\N	\N	\N	\N	t	2026-11-18 22:14:13.539-06	2026-11-18 22:14:13.537-06	\N	\N	\N
200ef9ae-3b79-41f7-8399-866335e16678	Alta por puesto 4ebe32ec	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:14:16.532-06	2026-11-18 22:14:16.517-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
364e84cf-8400-4451-83c8-220bde7861e5	Trabajador Licencia fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:14:59.904-06	2026-11-18 22:14:59.884-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f2e3e1d2-29da-4914-9d9c-bd404deefac8	Trabajador Test fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:01.359-06	2026-11-18 22:15:01.352-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
1d70121d-6aa6-429e-9f67-87fdbe7cbae2	Carrera A fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:05.005-06	2026-11-18 22:15:04.769-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
66a56975-6452-45b0-a586-0de036ad7e73	Trabajador Test fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:10.101-06	2026-11-18 22:15:10.09-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d887ea36-bcb1-4727-b6b2-f94795f0f5a1	Trabajador Test fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:15.328-06	2026-11-18 22:15:15.321-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a19b265b-6695-42d4-b707-f842922970f1	Trabajador Test fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:16.476-06	2026-11-18 22:15:16.471-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
967cee76-54cc-4b2c-915e-49e90ca32a90	Trabajador Test 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:56:22.563-06	2026-11-18 21:56:22.533-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
213c2578-93f3-46fd-b287-a08e6df0f37f	Trabajador Licencia 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:56:23.603-06	2026-11-18 21:56:23.576-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
aaff1eeb-2219-4bdc-88e7-3e038494e559	Trabajador Test 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:56:24.491-06	2026-11-18 21:56:24.485-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
342a8c45-2581-4fe8-a434-42527d4f3aea	Cambio rol fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:17.638-06	2026-11-18 22:15:17.631-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a3503827-5c9d-4de7-a0ed-9f7bb35b62d0	Rosa	Marin	\N	\N	\N	jefe-inttest-5708df43@svr-erp.local	5598765432	\N	\N	\N	\N	t	2026-11-18 21:57:04.092-06	2026-11-18 21:57:04.091-06	\N	\N	\N
c020e3f7-b19f-4b59-b253-331b859f0476	Alta por puesto 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:57:28.24-06	2026-11-18 21:57:28.235-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6085924f-654a-4efb-a915-752a3977220f	Con identidad 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:33.559-06	2026-11-18 22:03:33.545-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7ff078ea-2bd8-4d1c-886f-07021536b0fa	Carrera B 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:35.151-06	2026-11-18 22:03:35.146-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
3b8e5fe8-e975-4ed6-bfe4-bc6f6659dd94	Trabajador Test 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:37.86-06	2026-11-18 22:03:37.851-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
9bca4946-ffbb-4492-8e4b-9671fce763f6	Trabajador Test 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:39.522-06	2026-11-18 22:03:39.513-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7c11be96-bd60-48c2-a86f-e8e33c66f620	Trabajador Test 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:40.302-06	2026-11-18 22:03:40.297-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
5dc3d4f1-5f72-4771-bfac-971644e0b069	Trabajador Test 190808c9	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:03:41.099-06	2026-11-18 22:03:41.095-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d468b18a-cc37-4556-bd0d-a14881cb64c0	Tecnico torre fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:21.063-06	2026-11-18 22:15:21.057-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
3c283236-6818-4d90-9d71-9b2c21bb8ae7	Cambio puesto fea7b1fe	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:15:22.526-06	2026-11-18 22:15:22.52-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
91a2e9be-7f58-4aea-b80b-36631e1baaf9	Trabajador Test 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:10.698-06	2026-11-18 22:19:10.678-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
83ffd049-6c56-41fd-a91e-6f64a90520e5	Trabajador Licencia 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:11.811-06	2026-11-18 22:19:11.796-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
007fa357-8579-4f7d-844c-a78c756c2c38	Trabajador Test 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:12.722-06	2026-11-18 22:19:12.716-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e79b6b2c-c028-4363-8b60-a6df43ebc4f6	Con identidad 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:14.314-06	2026-11-18 22:19:14.3-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
fc0fd161-8406-4337-b066-a1d47128fede	Carrera B 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:16.044-06	2026-11-18 22:19:16.038-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b1ae8002-e36a-498f-9d59-c267f0bf0e7a	Rosa	Marin	\N	\N	\N	jefe-inttest-4c1577d0@svr-erp.local	5598765432	\N	\N	\N	\N	t	2026-11-18 22:19:19.109-06	2026-11-18 22:19:19.107-06	\N	\N	\N
40d4d8b2-017e-4455-bed5-cdcaedf8765a	Trabajador Test 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:24.546-06	2026-11-18 22:19:24.541-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
01c456cb-120c-4c94-a78f-171aa7e3a4ab	Trabajador Test 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:25.651-06	2026-11-18 22:19:25.646-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6a67fc81-fff7-4bc7-b671-6a5964a09ac3	Alta por puesto 4e4041d4	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 22:19:32.681-06	2026-11-18 22:19:32.674-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
31408e7a-de9c-4ce4-b52d-ce1dcc59583c	Cambio rol 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:15:10.262-06	2026-11-12 19:15:10.254-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
199cb9dc-6470-4b2c-925f-b794869d7e1f	Tecnico torre 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:15:12.76-06	2026-11-12 19:15:12.753-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
ad32973d-8a99-43a8-a31a-7e59002695fa	Cambio puesto 215d06d0	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-12 19:15:13.741-06	2026-11-12 19:15:13.736-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
60de16cb-a0ef-4bba-a749-ec84e16f249a	PinInt	40fab53c	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-13 05:28:22.384-06	2026-11-13 05:28:22.153-06	\N	\N	\N
fa67bf28-ec81-452e-a132-b72349fe1c77	Trabajador Test 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:23.806-06	2026-11-13 05:28:23.468-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6fe5e8b7-4bf9-4e52-bb48-81974fcb42b0	Trabajador Licencia 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:24.788-06	2026-11-13 05:28:24.776-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
44019b9c-1e36-4c84-a739-a3cca3355a76	Trabajador Test 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:25.852-06	2026-11-13 05:28:25.847-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
41b97e0d-e25a-40cc-be22-11a424035584	Con identidad 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:27.341-06	2026-11-13 05:28:27.329-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
17e65792-88cf-4a60-8472-7d429bd13646	Carrera B 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:29.585-06	2026-11-13 05:28:29.574-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
cba87e07-e2d8-4e94-b1c5-fa59649e0c52	Carrera A 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:30.568-06	2026-11-13 05:28:29.509-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2354e8c4-0527-4f44-bc36-a838a99a7d7b	Hueco alta 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:31.945-06	2026-11-13 05:28:31.939-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
be7d6678-29b8-4e0d-975e-658c57c3fede	Trabajador Test 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:33.08-06	2026-11-13 05:28:33.068-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e1929bf1-fb7a-44f5-95fe-05d1243887e0	Rosa	Marin	\N	\N	\N	jefe-inttest-81f5ddf2@svr-erp.local	5598765432	\N	\N	\N	\N	t	2026-11-13 05:28:33.903-06	2026-11-13 05:28:33.901-06	\N	\N	\N
b4e10abe-3fc1-47b4-847f-2d64195b8b61	Integration	Tester	\N	\N	\N	inttest-81f5ddf2@svr-erp.local	5512345678	\N	\N	\N	\N	t	2026-11-13 05:28:22.1-06	2026-11-12 23:28:34.711746-06	\N	\N	\N
c4eccae7-eef2-4162-a6de-69b1ba3c62fc	Trabajador Test 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:34.733-06	2026-11-13 05:28:34.721-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
12ceade6-5814-42c9-ac5a-d7cc23e36fa5	Trabajador Test 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:36.407-06	2026-11-13 05:28:36.401-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
fb80fe51-6838-4be2-94ce-8ec727908f2a	Trabajador Test 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:37.811-06	2026-11-13 05:28:37.8-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
465daed9-5022-46c6-b8d5-5dd538f475b3	Trabajador Test 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:38.829-06	2026-11-13 05:28:38.825-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a7700134-8926-4394-9ffd-af48aac7e23e	Trabajador Test 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:39.674-06	2026-11-13 05:28:39.669-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7a4a1a4a-2560-4503-84aa-8275a6e90347	Trabajador Test 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:40.501-06	2026-11-13 05:28:40.496-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
0c50929c-3e5f-49ba-a02c-5fda955d8873	Trabajador Test 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:41.337-06	2026-11-13 05:28:41.331-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b1d2e739-7727-4370-921e-08cc5ead8ae7	Cambio rol 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:42.262-06	2026-11-13 05:28:42.256-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
611c18cf-54db-478b-a102-6482752c8781	Tecnico torre 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:44.32-06	2026-11-13 05:28:44.314-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
158d6cda-88af-4dec-8db6-f6be34395d50	Cambio puesto 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:45.637-06	2026-11-13 05:28:45.632-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
72dc7dde-7083-46de-bffb-c1a8cd500c09	Alta por puesto 741c4ff3	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:28:46.925-06	2026-11-13 05:28:46.854-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d0000dee-9b44-4218-bf37-5ad6bdaf441e	Trabajador Test ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:15.62-06	2026-11-13 05:29:15.593-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
8500b286-c282-4a2b-a93d-88006ff806fc	Trabajador Licencia ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:17.215-06	2026-11-13 05:29:17.194-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7f5d900c-f3af-4b29-a627-c5e7e23ae7cc	PinInt	679273d6	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-13 05:29:18.414-06	2026-11-13 05:29:18.36-06	\N	\N	\N
5ab6c865-7bac-4d96-a680-ddcf06b7218d	Trabajador Test ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:18.994-06	2026-11-13 05:29:18.987-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
556a10e2-2fd2-47aa-a246-a4d113edd2d0	Con identidad ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:20.481-06	2026-11-13 05:29:20.468-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a73edb97-ecce-4e37-8dd0-f400e268cce7	Carrera B ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:22.588-06	2026-11-13 05:29:22.58-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
d8890df1-fc45-4445-b020-ebf3575aea29	Carrera A ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:22.79-06	2026-11-13 05:29:22.502-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2601037c-23f4-464f-aea7-12fd4ecca8d5	Hueco alta ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:24.21-06	2026-11-13 05:29:24.204-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
2ebd9406-75d3-433d-8cbb-7c24fa3bcbe3	Trabajador Test ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:25.318-06	2026-11-13 05:29:25.308-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
1a206e69-1cc5-4422-b4cc-19e2f4457edc	Trabajador Test ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:26.433-06	2026-11-13 05:29:26.423-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f0373a3d-0632-447c-8df1-96de4de2d918	Trabajador Test ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:27.589-06	2026-11-13 05:29:27.583-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7e3f3b8a-2d65-4a7d-9ef9-af68f9a72edf	Rosa	Marin	\N	\N	\N	jefe-inttest-d3f818a5@svr-erp.local	5598765432	\N	\N	\N	\N	t	2026-11-13 05:29:27.901-06	2026-11-13 05:29:27.9-06	\N	\N	\N
46975835-75ff-4860-8809-eb030656157b	Integration	Tester	\N	\N	\N	inttest-d3f818a5@svr-erp.local	5512345678	\N	\N	\N	\N	t	2026-11-13 05:29:18.604-06	2026-11-12 23:29:28.512174-06	\N	\N	\N
e17cf36a-c076-4782-8b6e-aec48a83dba1	Trabajador Test ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:29.022-06	2026-11-13 05:29:29.006-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
8f360e03-6c47-48f3-aa99-4e5084438cfa	Trabajador Test ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:30.517-06	2026-11-13 05:29:30.493-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
5ade2ff8-4520-4b9b-a738-862bb5d73c48	Trabajador Test ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:32.059-06	2026-11-13 05:29:32.052-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
17698c0c-c312-4988-81c1-ff9808675712	Trabajador Test ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:33.5-06	2026-11-13 05:29:33.494-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f7219dd8-1a57-4d54-95f4-e98bdf13d6e4	Trabajador Test ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:35.137-06	2026-11-13 05:29:35.131-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b3895a73-ce12-4394-a10d-8e154e09af36	Cambio rol ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:36.745-06	2026-11-13 05:29:36.737-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a7deb80c-dce2-48ee-95ad-da681085dff9	Con identidad 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:56:32.054-06	2026-11-18 21:56:31.63-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
f73d501f-c17f-4017-abc8-3605eed27866	Tecnico torre ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:39.937-06	2026-11-13 05:29:39.923-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
7a0c931b-c3fb-4988-996d-865c4c066414	Cambio puesto ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:41.49-06	2026-11-13 05:29:41.456-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a915a626-85e0-4dab-b847-10fd5ef5b1c1	Alta por puesto ba9424db	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-13 05:29:43.055-06	2026-11-13 05:29:43.048-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
b4e27116-8bfb-4514-b097-b40bbd86acfb	PinInt	89609f7a	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-13 05:30:28.87-06	2026-11-13 05:30:28.66-06	\N	\N	\N
95f2c261-185e-455c-ba39-fed28a693e3d	Carrera A 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:56:41.184-06	2026-11-18 21:56:40.69-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
e953f0fb-9868-4a38-8459-c2bb5a854315	Carrera B 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:57:07.87-06	2026-11-18 21:56:44.173-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
3a81759d-dffe-4d9d-ae1a-6cd9e4376cbb	Hueco alta 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:57:10.516-06	2026-11-18 21:57:10.453-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
14eda363-6075-4506-aa9b-8f0d4a497507	Trabajador Test 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:57:13.252-06	2026-11-18 21:57:13.225-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c2efe9ee-f067-4953-a88b-c410b537cef0	Trabajador Test 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:57:14.344-06	2026-11-18 21:57:14.335-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
8f35b55f-3a99-48c0-919b-b53d14b22465	Trabajador Test 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:57:16.739-06	2026-11-18 21:57:16.734-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
a4782a8e-c0b9-484b-affe-38d5e6662443	Trabajador Test 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:57:21.846-06	2026-11-18 21:57:21.841-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
6b39dafd-d41d-435d-9ead-69722433fe03	Trabajador Test 038e6847	\N	\N	\N	\N	\N	55 0000 0000	\N	\N	\N	\N	t	2026-11-18 21:57:22.993-06	2026-11-18 21:57:22.985-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
c544fe9a-102d-46e7-8a68-2bec8697adb5	Smoke Fase1	Test	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-11-14 07:42:18.375-06	2026-11-14 07:42:18.374-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N
\.


--
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proveedores (id, codigo, nombre, rfc, correo, telefono, direccion, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en, categoria) FROM stdin;
22d61153-008b-479f-bd4b-3df58f7f5b2f	\N	CAT México	\N	\N	\N	\N	t	2026-08-21 02:14:58.945-06	2026-08-21 02:14:58.945-06	\N	\N	\N	Otros
bd7a0bff-6245-4c61-ab32-69f698abc750	\N	Lubricantes Especializados	\N	\N	\N	\N	t	2026-08-21 02:14:58.946-06	2026-08-21 02:14:58.946-06	\N	\N	\N	Otros
53e3ab7a-8296-4344-a36e-8b5a3e3fc7d3	\N	Michelin	\N	\N	\N	\N	t	2026-08-21 02:14:58.947-06	2026-08-21 02:14:58.947-06	\N	\N	\N	Otros
ae4d9a88-22c9-48e4-aa7e-ad0f28e37275	\N	Proveedor 1fcd8a91-0da9	\N	\N	\N	\N	t	2026-11-06 17:46:46.821-06	2026-11-06 17:46:46.767-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
dcc6302b-9191-47f5-a586-ed8a19d02195	\N	Prov-OC 1fcd8a91-e2fa	\N	\N	\N	\N	t	2026-11-06 17:46:46.999-06	2026-11-06 17:46:46.998-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
330399c6-0817-41d5-941b-885c1a912e4e	\N	Prov-PAG 1fcd8a91-946a	\N	\N	\N	\N	t	2026-11-06 17:46:47.085-06	2026-11-06 17:46:47.085-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
f6c321de-8e7c-4319-8501-bcc3c0d73d2d	\N	Prov-FAIL 1fcd8a91-f724	\N	\N	\N	\N	t	2026-11-06 17:46:47.18-06	2026-11-06 17:46:47.18-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
f2010b93-df86-4346-95e0-f6b3f5797a6c	\N	Prov-BLK5 1fcd8a91-81c7	\N	\N	\N	\N	t	2026-11-06 17:46:47.245-06	2026-11-06 17:46:47.244-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
10a3530f-bd1b-4b4e-b364-19e4b346a2fd	\N	Prov-RFC 1fcd8a91	RFC1fcd8a91CC11	\N	\N	\N	t	2026-11-06 17:46:47.31-06	2026-11-06 17:46:47.309-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
0dc20abd-3b38-444f-a523-ca70e2099dd2	\N	Prov-Recepcion 1fcd8a91	\N	recepcion-1fcd8a91@test.local	555-0000	\N	t	2026-11-06 17:46:47.497-06	2026-11-06 17:46:47.496-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
ab12b48b-7fd8-46ff-94af-55e4ca83b0b6	\N	Prov-Recepcion2 1fcd8a91	\N	recepcion2-1fcd8a91@test.local	555-0001	\N	t	2026-11-06 17:46:47.591-06	2026-11-06 17:46:47.59-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
a4eef9f1-222f-4499-bf06-51dba84ad59c	\N	Proveedor 66c1e509-819e	\N	\N	\N	\N	t	2026-11-06 17:47:11.269-06	2026-11-06 17:47:11.223-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
3c4591b5-9c69-4191-8541-53a55b02a622	\N	Prov-OC 66c1e509-2906	\N	\N	\N	\N	t	2026-11-06 17:47:11.418-06	2026-11-06 17:47:11.418-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
6e236272-b4eb-4e78-8f8d-46b820225b09	\N	Prov-PAG 66c1e509-9158	\N	\N	\N	\N	t	2026-11-06 17:47:11.488-06	2026-11-06 17:47:11.487-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
b8367877-37a6-4f24-91d7-1b33fc72b435	\N	Prov-FAIL 66c1e509-2e21	\N	\N	\N	\N	t	2026-11-06 17:47:11.577-06	2026-11-06 17:47:11.577-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
eef0999a-f84a-4949-b8bf-7ae1a3be1470	\N	Prov-BLK5 66c1e509-17b9	\N	\N	\N	\N	t	2026-11-06 17:47:11.648-06	2026-11-06 17:47:11.648-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
98b87d64-66f2-42bf-a5e2-8f65e5a33d84	\N	Prov-RFC 66c1e509	RFC66c1e509AFE8	\N	\N	\N	t	2026-11-06 17:47:11.719-06	2026-11-06 17:47:11.717-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
5bbf2c65-86ef-450e-a314-334df568987d	\N	Prov-Recepcion 66c1e509	\N	recepcion-66c1e509@test.local	555-0000	\N	t	2026-11-06 17:47:11.891-06	2026-11-06 17:47:11.889-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
9286bc42-3af7-48f0-8b6b-1189b75f0204	\N	Prov-Recepcion2 66c1e509	\N	recepcion2-66c1e509@test.local	555-0001	\N	t	2026-11-06 17:47:11.977-06	2026-11-06 17:47:11.976-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
3079cd6c-e903-441e-afef-cac8a23307ce	\N	Proveedor dd26e54b-54d3	\N	\N	\N	\N	t	2026-11-06 17:48:13.811-06	2026-11-06 17:48:13.768-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
cb5f29f2-fdea-4c9f-80b6-0a49f0d3b539	\N	Prov-OC dd26e54b-084c	\N	\N	\N	\N	t	2026-11-06 17:48:13.943-06	2026-11-06 17:48:13.943-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
f1b059fe-4591-4a62-864f-967661489018	\N	Prov-PAG dd26e54b-36fd	\N	\N	\N	\N	t	2026-11-06 17:48:14.011-06	2026-11-06 17:48:14.011-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
76d9f12e-697c-434e-b26d-35418ea015ea	\N	Prov-FAIL dd26e54b-75ff	\N	\N	\N	\N	t	2026-11-06 17:48:14.098-06	2026-11-06 17:48:14.098-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
53c03100-92df-4443-81cf-5249592ee916	\N	Prov-BLK5 dd26e54b-f454	\N	\N	\N	\N	t	2026-11-06 17:48:14.162-06	2026-11-06 17:48:14.162-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
521865af-2209-427c-9cfc-4f532ef81b54	\N	Prov-RFC dd26e54b	RFCdd26e54b590F	\N	\N	\N	t	2026-11-06 17:48:14.226-06	2026-11-06 17:48:14.225-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
64606f6f-db8c-42f1-a5fd-e8fd6a08a954	\N	Prov-Recepcion dd26e54b	\N	recepcion-dd26e54b@test.local	555-0000	\N	t	2026-11-06 17:48:14.394-06	2026-11-06 17:48:14.392-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
014d5302-8cd5-499b-ba6d-7d24adf1fab1	\N	Prov-Recepcion2 dd26e54b	\N	recepcion2-dd26e54b@test.local	555-0001	\N	t	2026-11-06 17:48:14.479-06	2026-11-06 17:48:14.478-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
cc9b584d-3034-4147-b924-666934c2eb7b	\N	Proveedor d4de074c-9b3e	\N	\N	\N	\N	t	2026-11-06 17:48:40.172-06	2026-11-06 17:48:40.128-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
0e6b7f2c-f6e8-488b-ae29-d1a0181fafbc	\N	Prov-OC d4de074c-357e	\N	\N	\N	\N	t	2026-11-06 17:48:40.315-06	2026-11-06 17:48:40.314-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
912c34cb-c7a3-43f0-a27c-259abe4eb997	\N	Prov-PAG d4de074c-c40b	\N	\N	\N	\N	t	2026-11-06 17:48:40.383-06	2026-11-06 17:48:40.382-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
7f9c9d08-a3e5-44e6-9fb2-87dacb5526b0	\N	Prov-FAIL d4de074c-90ce	\N	\N	\N	\N	t	2026-11-06 17:48:40.472-06	2026-11-06 17:48:40.472-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
24422e5b-65a2-402c-982d-eb203ed45ff8	\N	Prov-BLK5 d4de074c-9f9f	\N	\N	\N	\N	t	2026-11-06 17:48:40.539-06	2026-11-06 17:48:40.539-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
f29e8aa0-eb48-4e57-bcfa-6f97284c3d2d	\N	Prov-RFC d4de074c	RFCd4de074c05B8	\N	\N	\N	t	2026-11-06 17:48:40.608-06	2026-11-06 17:48:40.606-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
9078590e-e43d-4de7-b079-2ca81eb89d16	\N	Prov-Recepcion d4de074c	\N	recepcion-d4de074c@test.local	555-0000	\N	t	2026-11-06 17:48:40.776-06	2026-11-06 17:48:40.775-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
71f01384-aef6-4d0f-89d5-092c3b7eb012	\N	Prov-Recepcion2 d4de074c	\N	recepcion2-d4de074c@test.local	555-0001	\N	t	2026-11-06 17:48:40.862-06	2026-11-06 17:48:40.862-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
9cd45446-49d5-4656-8faf-f97d7f66285a	\N	Proveedor 1ec8a387-ef9c	\N	\N	\N	\N	t	2026-11-06 17:49:03.504-06	2026-11-06 17:49:03.457-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
91040894-5876-422a-b39c-6f941f1b44db	\N	Prov-OC 1ec8a387-3cbb	\N	\N	\N	\N	t	2026-11-06 17:49:03.655-06	2026-11-06 17:49:03.655-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
f8ed8a5e-ae2f-4a39-b07e-e4e69122772d	\N	Prov-PAG 1ec8a387-9f15	\N	\N	\N	\N	t	2026-11-06 17:49:03.719-06	2026-11-06 17:49:03.719-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
28f15aa4-9b9f-4f82-8a28-d282f1d80b82	\N	Prov-FAIL 1ec8a387-08fe	\N	\N	\N	\N	t	2026-11-06 17:49:03.811-06	2026-11-06 17:49:03.81-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
b76deab4-de03-4078-a979-152e35bde5dc	\N	Prov-BLK5 1ec8a387-92bb	\N	\N	\N	\N	t	2026-11-06 17:49:03.876-06	2026-11-06 17:49:03.875-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
806040fa-3f1b-41cb-859a-e2bcf49c5224	\N	Prov-RFC 1ec8a387	RFC1ec8a387AFBF	\N	\N	\N	t	2026-11-06 17:49:03.944-06	2026-11-06 17:49:03.942-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
fe840c2e-0302-4e5d-8461-196b18f07c1c	\N	Prov-Recepcion 1ec8a387	\N	recepcion-1ec8a387@test.local	555-0000	\N	t	2026-11-06 17:49:04.117-06	2026-11-06 17:49:04.115-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
ccdd6975-6a3a-4fa0-930e-ad24c7a93b30	\N	Prov-Recepcion2 1ec8a387	\N	recepcion2-1ec8a387@test.local	555-0001	\N	t	2026-11-06 17:49:04.201-06	2026-11-06 17:49:04.2-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
dc547fc1-7eb8-4eb8-a068-bfb03a2e48de	\N	Proveedor d1eb4989-38dc	\N	\N	\N	\N	t	2026-11-06 17:49:25.9-06	2026-11-06 17:49:25.858-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
b0e683ed-e0a9-4e06-a3e9-9b5468c50517	\N	Prov-OC d1eb4989-cf7d	\N	\N	\N	\N	t	2026-11-06 17:49:26.153-06	2026-11-06 17:49:26.153-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
b840b7c1-9d94-4b06-897f-bb7e31332636	\N	Prov-PAG d1eb4989-0931	\N	\N	\N	\N	t	2026-11-06 17:49:26.223-06	2026-11-06 17:49:26.222-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
4bc4346d-077c-42cf-ac88-f9dfaa04238a	\N	Prov-FAIL d1eb4989-3348	\N	\N	\N	\N	t	2026-11-06 17:49:26.311-06	2026-11-06 17:49:26.311-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
5175a40c-de01-4e40-b979-8835f6e0684d	\N	Prov-BLK5 d1eb4989-2e5e	\N	\N	\N	\N	t	2026-11-06 17:49:26.377-06	2026-11-06 17:49:26.376-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
cd26b682-46c2-46d4-baf1-bed135de520d	\N	Prov-RFC d1eb4989	RFCd1eb4989909F	\N	\N	\N	t	2026-11-06 17:49:26.449-06	2026-11-06 17:49:26.448-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
0bb1fff0-fdbd-4848-8d80-13db54143ce0	\N	TestProv-34193423	\N	\N	\N	\N	t	2026-11-18 22:19:38.407-06	2026-11-18 22:19:38.405-06	\N	\N	\N	Otros
0f313293-870f-469c-8dcd-548008b238af	\N	Prov-Recepcion d1eb4989	\N	recepcion-d1eb4989@test.local	555-0000	\N	t	2026-11-06 17:49:26.61-06	2026-11-06 17:49:26.609-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
33df534c-2c57-400d-b304-2e4490f88bf0	\N	Prov-Recepcion2 d1eb4989	\N	recepcion2-d1eb4989@test.local	555-0001	\N	t	2026-11-06 17:49:26.699-06	2026-11-06 17:49:26.699-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
49938315-653d-4721-9052-786b2038d71b	\N	Proveedor d12af529-05fd	\N	\N	\N	\N	t	2026-11-06 17:50:56.607-06	2026-11-06 17:50:56.559-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
d7519d01-11ed-4f39-8d97-152c0fcf5382	\N	Prov-OC d12af529-430d	\N	\N	\N	\N	t	2026-11-06 17:50:56.75-06	2026-11-06 17:50:56.749-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
2876e9e8-cd01-4cbc-a1a4-9485e843ade9	\N	Prov-PAG d12af529-2e4d	\N	\N	\N	\N	t	2026-11-06 17:50:56.819-06	2026-11-06 17:50:56.818-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
ebe50130-b82c-4d71-bf3b-16d61f9de1c3	\N	Prov-FAIL d12af529-c03e	\N	\N	\N	\N	t	2026-11-06 17:50:56.906-06	2026-11-06 17:50:56.905-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
e3209dc2-86d5-42b1-9b8b-aba0a58d61d5	\N	Prov-BLK5 d12af529-917c	\N	\N	\N	\N	t	2026-11-06 17:50:56.974-06	2026-11-06 17:50:56.974-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
a2140450-c067-4d5a-ae5a-f44483d8ec2a	\N	Prov-RFC d12af529	RFCd12af529D363	\N	\N	\N	t	2026-11-06 17:50:57.043-06	2026-11-06 17:50:57.042-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
1110745e-244d-4717-90ff-07d2bf2fbae2	\N	Prov-Recepcion d12af529	\N	recepcion-d12af529@test.local	555-0000	\N	t	2026-11-06 17:50:57.212-06	2026-11-06 17:50:57.211-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
1adcbdc6-a2f3-4d06-9002-672192e172e9	\N	Prov-Recepcion2 d12af529	\N	recepcion2-d12af529@test.local	555-0001	\N	t	2026-11-06 17:50:57.299-06	2026-11-06 17:50:57.299-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
6d46eab7-26df-43b2-b0d7-0c4b36e704ff	\N	Proveedor 9eb2ddeb-fa53	\N	\N	\N	\N	t	2026-11-06 17:51:20.158-06	2026-11-06 17:51:20.114-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
05cc74b2-d08c-4bbb-b4f4-313b30f9287b	\N	Prov-OC 9eb2ddeb-35a3	\N	\N	\N	\N	t	2026-11-06 17:51:20.29-06	2026-11-06 17:51:20.29-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
743779ec-3a9a-4a34-887f-02f1296f2af1	\N	Prov-PAG 9eb2ddeb-2b33	\N	\N	\N	\N	t	2026-11-06 17:51:20.361-06	2026-11-06 17:51:20.361-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
d4291a6e-553c-4c87-a27f-ba13965d985e	\N	Prov-FAIL 9eb2ddeb-24d9	\N	\N	\N	\N	t	2026-11-06 17:51:20.456-06	2026-11-06 17:51:20.456-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
396aad2b-9593-423c-b2ba-2da10c845c00	\N	Prov-BLK5 9eb2ddeb-4c2b	\N	\N	\N	\N	t	2026-11-06 17:51:20.521-06	2026-11-06 17:51:20.521-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
98ca10b2-1fef-45a9-ba48-77ebfc93cce4	\N	Prov-RFC 9eb2ddeb	RFC9eb2ddebB14B	\N	\N	\N	t	2026-11-06 17:51:20.59-06	2026-11-06 17:51:20.588-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
04fe631a-36bc-48cf-b013-5c96987c743a	\N	Prov-Recepcion 9eb2ddeb	\N	recepcion-9eb2ddeb@test.local	555-0000	\N	t	2026-11-06 17:51:20.856-06	2026-11-06 17:51:20.854-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
bb24a179-2aff-4730-ace8-0570f34bfe78	\N	Prov-Recepcion2 9eb2ddeb	\N	recepcion2-9eb2ddeb@test.local	555-0001	\N	t	2026-11-06 17:51:20.945-06	2026-11-06 17:51:20.944-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
41684b09-fb25-45c3-91c6-58756b0e9fd1	\N	Proveedor e3c4e9f9-e74e	\N	\N	\N	\N	t	2026-11-06 17:52:28.085-06	2026-11-06 17:52:28.041-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
fcad0788-b9fe-4d97-879c-303168e5be4f	\N	Prov-OC e3c4e9f9-4767	\N	\N	\N	\N	t	2026-11-06 17:52:28.225-06	2026-11-06 17:52:28.224-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
36e5dec1-1b47-459d-94ef-430c28b7d0bd	\N	Prov-PAG e3c4e9f9-45cb	\N	\N	\N	\N	t	2026-11-06 17:52:28.295-06	2026-11-06 17:52:28.294-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
34a625c9-b41b-40d3-a928-60c5053529d7	\N	Prov-FAIL e3c4e9f9-d23d	\N	\N	\N	\N	t	2026-11-06 17:52:28.383-06	2026-11-06 17:52:28.383-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
9ddfe2a9-a65d-4106-9f1d-87f999f9bfc8	\N	Prov-BLK5 e3c4e9f9-baad	\N	\N	\N	\N	t	2026-11-06 17:52:28.45-06	2026-11-06 17:52:28.45-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
53f6ab2a-cf7b-4402-98e2-888cd9fe5674	\N	Prov-RFC e3c4e9f9	RFCe3c4e9f9100E	\N	\N	\N	t	2026-11-06 17:52:28.518-06	2026-11-06 17:52:28.516-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
4957ca7a-9b0c-459c-a8f3-9b7c427ae21f	\N	Prov-Recepcion e3c4e9f9	\N	recepcion-e3c4e9f9@test.local	555-0000	\N	t	2026-11-06 17:52:28.679-06	2026-11-06 17:52:28.677-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
f1417a44-3ba3-4c65-9b2c-1b8d18a4771c	\N	Prov-Recepcion2 e3c4e9f9	\N	recepcion2-e3c4e9f9@test.local	555-0001	\N	t	2026-11-06 17:52:28.767-06	2026-11-06 17:52:28.766-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Materiales
ff9609d5-14e6-4f0f-9ba1-99846d3bdfe2	\N	PruebaDiagnostico X	\N	\N	\N	\N	t	2026-11-06 18:17:40.662-06	2026-11-06 18:17:40.661-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
635fe5a7-5aae-4939-944b-65a0d3dcb7e9	\N	Prueba RFC	\N	\N	\N	\N	t	2026-11-06 18:22:42.051-06	2026-11-06 18:22:42.051-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
b8b690d4-3617-4852-9f02-5cf466e9e030	\N	eeee	\N	\N	2222222	\N	t	2026-11-06 18:45:53.468-06	2026-11-06 18:45:53.467-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Refacciones
fd7d2458-8c15-4fbf-8dd5-9c1060c5bf1e	\N	Prov Sanitizacion X	\N	\N	\N	\N	t	2026-11-06 19:39:07.016-06	2026-11-06 19:39:07.014-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
c845bf98-f0b9-4e30-9cf5-45f3f380660e	\N	Prov Sanit Y	\N	\N	\N	\N	t	2026-11-06 19:39:24.8-06	2026-11-06 19:39:24.799-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
56497d32-4d29-4b50-aaeb-346eaa4aec4d	\N	Prov Sanit Y2	\N	\N	\N	\N	t	2026-11-06 19:40:17.543-06	2026-11-06 19:40:17.542-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
2718c4b8-f7d9-45b2-a5dc-f4521866997b	\N	Prov Sanit Y2	\N	\N	\N	\N	t	2026-11-06 19:55:46.852-06	2026-11-06 19:55:46.851-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	Otros
e49e388a-7f84-4a6a-9d12-ac6ae5764479	\N	TestProv-5a17ee2d	\N	\N	\N	\N	t	2026-11-13 05:28:05.83-06	2026-11-13 05:28:05.828-06	\N	\N	\N	Otros
d7dd6b2c-ca17-4d5c-a23e-007f39f991e7	\N	TestProv-6a37c69a	\N	\N	\N	\N	t	2026-11-13 05:29:35.986-06	2026-11-13 05:29:35.985-06	\N	\N	\N	Otros
d4ec4481-e206-4069-b1ae-c88b69378a5f	\N	TestProv-b7a92e38	\N	\N	\N	\N	t	2026-11-14 05:21:39.765-06	2026-11-14 05:21:39.763-06	\N	\N	\N	Otros
0ee4b84d-a5be-40c8-aa66-95264de06d74	\N	TestProv-c0252b7c	\N	\N	\N	\N	t	2026-11-14 05:27:16.917-06	2026-11-14 05:27:16.91-06	\N	\N	\N	Otros
b8da6f3a-7159-4681-917c-f09c8184c0f6	\N	TestProv-81fcbc23	\N	\N	\N	\N	t	2026-11-18 21:56:32.159-06	2026-11-18 21:56:32.158-06	\N	\N	\N	Otros
9cdb3ff4-f52e-4ee7-8fb1-8008dba7f1cd	\N	TestProv-81496f01	\N	\N	\N	\N	t	2026-11-18 22:14:26.942-06	2026-11-18 22:14:26.94-06	\N	\N	\N	Otros
4c9e89b2-bbd9-4a31-bc5d-8c9b915c2285	\N	TestProv-f6b40283	\N	\N	\N	\N	t	2026-11-18 22:15:23.015-06	2026-11-18 22:15:23.014-06	\N	\N	\N	Otros
\.


--
-- Data for Name: proyectos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proyectos (id, codigo, nombre, cliente_id, presupuesto, progreso, estado, fecha_inicio, fecha_fin, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, ingreso_cobrado, gastado, calle, colonia, ciudad, estado_ubicacion, codigo_postal, municipio) FROM stdin;
368d2d07-6c87-4c57-99f6-b149fab5785e	\N	Fraccionamiento centro	e0ee77c3-441b-4dfb-82c4-225611e0815c	20000000.00	0.00	EN_PROCESO	2026-12-01	2027-12-01	t	2026-11-13 02:56:54.206-06	2026-11-13 02:56:54.2-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	0.00	0.00	Calle Independencia 4	Col. Centro	Puerto Vallardo	Nayarit	54545	\N
ba8d114e-78b2-4224-9bde-c086d19d68e0	\N	Ampliación Hospital General Tepic	ff2b4f34-2003-42aa-b72f-9e015c281293	18500000.00	35.00	EN_PROCESO	2026-01-15	2026-12-20	t	2026-11-13 03:38:29.299-06	2026-11-13 03:38:29.295-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	0.00	0.00	Av. Insurgentes Sur 1200	Col. Centro	Tepic	Nayarit	63000	\N
43486b54-daf0-44d9-b63e-66671c795994	\N	Bodega logística Corredor Industrial	e0ee77c3-441b-4dfb-82c4-225611e0815c	7250000.00	20.00	EN_PROCESO	2026-02-01	2026-10-30	t	2026-11-13 03:38:29.397-06	2026-11-13 03:38:29.394-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	0.00	0.00	Blvd. Industrial 45	Parque Industrial	Bahía de Banderas	Nayarit	63732	\N
01ab9a70-2eb2-43fe-8e24-0225da37bb6e	\N	Rehabilitación drenaje Col. Emiliano Zapata	ff2b4f34-2003-42aa-b72f-9e015c281293	3400000.00	10.00	EN_PROCESO	2026-03-02	2026-08-28	t	2026-11-13 03:38:29.452-06	2026-11-13 03:38:29.449-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	0.00	0.00	Calle Morelos 210	Col. Emiliano Zapata	Tepic	Nayarit	63175	\N
8b9c79a2-2352-412c-b368-f0e4fc97211e	\N	Parque Lineal Río Mololoa	ff2b4f34-2003-42aa-b72f-9e015c281293	6100000.00	100.00	FINALIZADO	2025-03-03	2025-11-28	t	2026-11-13 03:38:29.489-06	2026-11-13 03:38:29.486-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	6100000.00	5400000.00	Av. Mololoa 88	Col. Lagos del Country	Tepic	Nayarit	63177	\N
cd0e297f-4eb9-45a2-aa81-c1a7a93d5da0	\N	Estacionamiento	f600f831-a44a-4930-9fc0-8e5ec1ee9450	2000000.00	0.00	EN_PROCESO	2027-01-30	2027-08-15	t	2026-11-13 04:19:27.609-06	2026-11-13 04:19:27.606-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	0.00	0.00	Av. Revoluión 5	Col. La loma	Tepic	Nayarit	63000	\N
949bce82-7516-4e52-a53c-db976e71c9fa	\N	Edificio de oficinas	3a05641a-c5eb-4676-8ec3-720b3e2d7ba1	5000000.00	0.00	EN_PROCESO	2026-11-17	2029-06-12	t	2026-11-13 04:30:31.57-06	2026-11-13 04:30:31.567-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	0.00	0.00	Av. Insurgentes 221	Col. Sur	Puerto Vallarta	Nayarit	44333	Bahía de Banderas
3e7bfc6f-7298-4ba7-89bb-165cdb79f884	P004	Urbanización Vista Xalisco	f600f831-a44a-4930-9fc0-8e5ec1ee9450	4200000.00	15.00	EN_PROCESO	2026-11-02	2027-06-30	t	2026-11-04 23:53:37.260122-06	2026-11-04 23:53:37.260122-06	\N	\N	\N	0.00	630000.00	Av. Cuauhtémoc 892, Lote 12	Fraccionamiento Xalisco	Xalisco	Nayarit	63778	\N
36cc8b6d-3f61-42ca-9e7b-3b006dc156b5	P005	Nave industrial Parque Tepic	cc2f4d26-2ef8-4579-8ca6-6a8e5006daae	12500000.00	5.00	EN_PROCESO	2026-11-05	2027-08-20	t	2026-11-04 23:53:37.260122-06	2026-11-04 23:53:37.260122-06	\N	\N	\N	0.00	0.00	Parque Industrial 220, Lote 8 (Nave C)	Ciudad Industrial de Tepic	Tepic	Nayarit	63173	\N
38f84e5c-aa38-4f41-8073-23cfa6090344	P006	Planta de agua potable Mezcales	3a05641a-c5eb-4676-8ec3-720b3e2d7ba1	8700000.00	40.00	EN_PROCESO	2026-07-10	2027-03-31	t	2026-11-04 23:53:37.260122-06	2026-11-04 23:53:37.260122-06	\N	\N	\N	3480000.00	3412600.00	Benito Juárez 45	Mezcales	Bahía de Banderas	Nayarit	63730	\N
874fbf97-5eaf-43fa-96aa-8f3e8dcd0de7	P007	Oficinas distribuidora Tokio	f600f831-a44a-4930-9fc0-8e5ec1ee9450	2300000.00	0.00	PAUSADO	2026-09-01	2027-01-15	t	2026-11-04 23:53:37.260122-06	2026-11-04 23:53:37.260122-06	\N	\N	\N	0.00	405000.00	Blvd. Avila Camacho 1563, Nave 3	Ciudad del Valle	Tepic	Nayarit	63157	\N
1b7a0953-b5eb-4230-af83-ccf090ea4690	P008	Pavimentación Av. Bahía (etapa II)	cf8c9e99-7dac-4337-a50f-82db43546a6a	5400000.00	100.00	FINALIZADO	2025-10-01	2026-09-30	t	2026-11-04 23:53:37.260122-06	2026-11-04 23:53:37.260122-06	\N	\N	\N	5400000.00	5250000.00	Av. Bahía de Banderas, tramos 2-14	Mirador de la Bahía	San Blas	Nayarit	63740	\N
41e0730e-45fb-4585-aa99-9a2045415969	\N	Escuela Secundaria	cc2f4d26-2ef8-4579-8ca6-6a8e5006daae	5000000.00	0.00	EN_PROCESO	2026-11-05	2027-08-28	t	2026-11-05 06:00:02.039-06	2026-11-05 06:00:02.033-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	0.00	0.00	Calle xd 67	tuntunutun sahur	Roba un Brainrot	Lo soñe	67676	\N
00692bdb-27d2-4e7b-be62-16c2977e1650	P001	Fraccionamiento Valle Sur	f600f831-a44a-4930-9fc0-8e5ec1ee9450	1200000.00	85.00	EN_PROCESO	2025-01-10	2025-05-30	t	2026-08-21 02:14:59.021-06	2026-11-06 14:28:38.52984-06	\N	\N	\N	0.00	0.00	\N	\N	\N	\N	\N	\N
21b6cf72-c07c-40e8-aac6-b538511f5127	P002	Remodelación Centro Histórico	3a05641a-c5eb-4676-8ec3-720b3e2d7ba1	4500000.00	32.00	EN_PROCESO	2025-03-01	2025-12-15	t	2026-08-21 02:14:59.027-06	2026-11-06 14:28:38.52984-06	\N	\N	\N	0.00	0.00	\N	\N	\N	\N	\N	\N
caf3c621-4982-4b27-bef3-02c362cb96a6	P003	Puente Atizapán	cf8c9e99-7dac-4337-a50f-82db43546a6a	8900000.00	100.00	FINALIZADO	2024-06-15	2025-04-20	t	2026-08-21 02:14:59.033-06	2026-11-06 14:28:38.52984-06	\N	\N	\N	0.00	0.00	\N	\N	\N	\N	\N	\N
8e39db1d-db8b-486b-8da1-22010e5d6932	\N	SMOKE estado temporal	ff2b4f34-2003-42aa-b72f-9e015c281293	1000.00	0.00	PAUSADO	2026-11-20	2026-12-20	f	2026-11-13 04:41:09.782-06	2026-11-12 22:41:10.267954-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-13 04:41:10.267-06	0.00	0.00	\N	\N	\N	\N	\N	\N
de96d47c-14b5-4130-a640-e1360fcfac6e	\N	SMOKE municipio temporal	ff2b4f34-2003-42aa-b72f-9e015c281293	1000.00	0.00	EN_PROCESO	2026-11-20	2026-12-20	f	2026-11-13 04:27:29.804-06	2026-11-12 22:27:30.005473-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-13 04:27:30.003-06	0.00	0.00	Calle Smoke 1	Col. Prueba	Tepic	Nayarit	63000	Xalisco
\.


--
-- Data for Name: rastreo_gps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rastreo_gps (id, maquina_id, fecha_hora, lat, lng, altitud, velocidad_kmh, heading, precision_metros, ignition, odometro, horometro, proveedor_gps, dispositivo_id, activo, creado_en, creado_por, temperatura_motor) FROM stdin;
6ecd213c-acc9-4bbb-bc25-4d917a6e44d4	27800748-89c1-4900-8b5d-31926fc63836	2026-11-13 05:28:10.34-06	19.428400	-99.127600	\N	0.00	10.16	8.00	f	\N	890.20	SIMULADO	\N	t	2026-11-13 05:28:10.345-06	c0000000-0000-0000-0000-000000000001	26.21
9b68e3bf-a90e-47f7-835c-4f33333f8cb0	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-13 05:28:10.34-06	19.423777	-99.126724	\N	38.00	32.89	5.29	t	\N	3421.12	SIMULADO	\N	t	2026-11-13 05:28:10.345-06	c0000000-0000-0000-0000-000000000001	73.27
fa858fde-91b8-4872-a0e5-5c3054f1484e	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-13 05:28:10.34-06	19.431915	-99.135634	\N	16.00	253.39	3.79	t	\N	1245.52	SIMULADO	\N	t	2026-11-13 05:28:10.345-06	c0000000-0000-0000-0000-000000000001	93.66
f5ed39f0-2bc8-4a19-bfcb-397e36cad27d	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-13 05:28:10.34-06	19.435000	-99.141200	\N	0.00	61.92	4.42	f	\N	456.80	SIMULADO	\N	t	2026-11-13 05:28:10.345-06	c0000000-0000-0000-0000-000000000001	26.04
6c67e045-ffb7-49f1-826a-9ea942e9f4dd	27800748-89c1-4900-8b5d-31926fc63836	2026-11-13 05:28:10.581-06	19.428400	-99.127600	\N	0.00	27.53	3.70	f	\N	890.20	SIMULADO	\N	t	2026-11-13 05:28:10.585-06	c0000000-0000-0000-0000-000000000001	23.29
6643bbb7-133f-4e90-b7cf-d19c7434599a	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-13 05:28:10.581-06	19.426663	-99.124197	\N	25.00	39.54	5.01	t	\N	3421.14	SIMULADO	\N	t	2026-11-13 05:28:10.585-06	c0000000-0000-0000-0000-000000000001	87.17
80d224db-780d-4150-a3d6-1b648cbb8004	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-13 05:28:10.581-06	19.430395	-99.138910	\N	23.00	243.80	4.55	t	\N	1245.54	SIMULADO	\N	t	2026-11-13 05:28:10.585-06	c0000000-0000-0000-0000-000000000001	75.67
97f1fcbc-2082-4917-9454-323a368d086a	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-13 05:28:10.581-06	19.435000	-99.141200	\N	0.00	68.29	5.55	f	\N	456.80	SIMULADO	\N	t	2026-11-13 05:28:10.585-06	c0000000-0000-0000-0000-000000000001	24.90
49a712c0-5eb6-4acf-ac89-0d68172895a9	27800748-89c1-4900-8b5d-31926fc63836	2026-11-13 05:29:14.871-06	19.428400	-99.127600	\N	0.00	31.49	7.22	f	\N	890.20	SIMULADO	\N	t	2026-11-13 05:29:14.891-06	c0000000-0000-0000-0000-000000000001	22.21
ffe91623-3e1c-45cd-b653-7f18b207ddd7	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-13 05:29:14.871-06	19.431692	-99.121050	\N	39.00	30.55	4.18	t	\N	3421.16	SIMULADO	\N	t	2026-11-13 05:29:14.891-06	c0000000-0000-0000-0000-000000000001	86.84
bf9bd266-d6af-4a2e-a0b2-20be83e961e0	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-13 05:29:14.871-06	19.429875	-99.141227	\N	15.00	256.61	6.04	t	\N	1245.56	SIMULADO	\N	t	2026-11-13 05:29:14.891-06	c0000000-0000-0000-0000-000000000001	93.36
4496173d-78a6-4faa-bd5b-8ff495c44530	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-13 05:29:14.871-06	19.435000	-99.141200	\N	0.00	84.21	7.72	f	\N	456.80	SIMULADO	\N	t	2026-11-13 05:29:14.891-06	c0000000-0000-0000-0000-000000000001	25.29
c3b02d5d-7731-4ccf-ad05-3b21cd64f9c5	27800748-89c1-4900-8b5d-31926fc63836	2026-11-13 05:29:15.188-06	19.428400	-99.127600	\N	0.00	17.18	3.14	f	\N	890.20	SIMULADO	\N	t	2026-11-13 05:29:15.192-06	c0000000-0000-0000-0000-000000000001	25.31
1e3ad20d-851d-432e-b458-af35e38b8cae	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-13 05:29:15.188-06	19.432827	-99.120644	\N	8.00	18.63	6.35	t	\N	3421.18	SIMULADO	\N	t	2026-11-13 05:29:15.192-06	c0000000-0000-0000-0000-000000000001	78.08
5074258c-e69e-4122-8a8b-ae26177285ba	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-13 05:29:15.188-06	19.429276	-99.146747	\N	35.00	263.43	6.54	t	\N	1245.58	SIMULADO	\N	t	2026-11-13 05:29:15.192-06	c0000000-0000-0000-0000-000000000001	91.24
6d268974-0ecb-41c5-8dea-128342d8ec7f	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-13 05:29:15.188-06	19.435000	-99.141200	\N	0.00	96.59	5.28	f	\N	456.80	SIMULADO	\N	t	2026-11-13 05:29:15.192-06	c0000000-0000-0000-0000-000000000001	28.79
06a4a29c-f3eb-435a-89b3-1f36b78cb744	27800748-89c1-4900-8b5d-31926fc63836	2026-11-18 21:56:22.835-06	19.428400	-99.127600	\N	0.00	28.46	6.50	f	\N	890.20	SIMULADO	\N	t	2026-11-18 21:56:22.843-06	c0000000-0000-0000-0000-000000000001	25.05
c6acc75d-3e32-49ca-b004-d325c77e03a2	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-18 21:56:22.835-06	19.436304	-99.119174	\N	25.00	21.74	4.57	t	\N	3421.20	SIMULADO	\N	t	2026-11-18 21:56:22.843-06	c0000000-0000-0000-0000-000000000001	74.24
12a8ef77-a91e-4e1c-81bc-f1d7ce751bce	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-18 21:56:22.835-06	19.427764	-99.151232	\N	30.00	250.33	3.87	t	\N	1245.60	SIMULADO	\N	t	2026-11-18 21:56:22.843-06	c0000000-0000-0000-0000-000000000001	91.38
6e1d1c40-d1c3-4365-9ab6-73b274258937	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-18 21:56:22.835-06	19.435000	-99.141200	\N	0.00	108.44	5.41	f	\N	456.80	SIMULADO	\N	t	2026-11-18 21:56:22.843-06	c0000000-0000-0000-0000-000000000001	29.64
e18086d4-b6ec-46e1-bf96-137749620a4f	27800748-89c1-4900-8b5d-31926fc63836	2026-11-18 21:56:23.062-06	19.428400	-99.127600	\N	0.00	10.04	3.96	f	\N	890.20	SIMULADO	\N	t	2026-11-18 21:56:23.065-06	c0000000-0000-0000-0000-000000000001	20.52
ea6dfe16-44d1-4eb6-9bf7-4fefec3a036c	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-18 21:56:23.062-06	19.438661	-99.118720	\N	16.00	10.31	3.18	t	\N	3421.22	SIMULADO	\N	t	2026-11-18 21:56:23.065-06	c0000000-0000-0000-0000-000000000001	77.81
7e3bfc19-529b-4e03-8ccd-0638b3e39470	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-18 21:56:23.062-06	19.426196	-99.154660	\N	24.00	244.12	7.75	t	\N	1245.62	SIMULADO	\N	t	2026-11-18 21:56:23.065-06	c0000000-0000-0000-0000-000000000001	70.34
b7c23a3d-d628-400f-bc3d-358edbb63eda	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-18 21:56:23.062-06	19.435000	-99.141200	\N	0.00	106.07	3.80	f	\N	456.80	SIMULADO	\N	t	2026-11-18 21:56:23.065-06	c0000000-0000-0000-0000-000000000001	29.40
945a82a3-0d0f-44e0-b36e-e9cb1d31c8e6	27800748-89c1-4900-8b5d-31926fc63836	2026-11-18 22:02:36.615-06	19.428400	-99.127600	\N	0.00	22.56	7.29	f	\N	890.20	SIMULADO	\N	t	2026-11-18 22:02:36.622-06	c0000000-0000-0000-0000-000000000001	24.17
ae2b5cf8-868e-41ae-9303-04da42accb49	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-18 22:02:36.615-06	19.442963	-99.118099	\N	29.00	7.75	7.42	t	\N	3421.24	SIMULADO	\N	t	2026-11-18 22:02:36.622-06	c0000000-0000-0000-0000-000000000001	83.76
9f87fe5a-3de8-44b3-adf9-9b779bdcf6a0	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-18 22:02:36.615-06	19.425987	-99.155749	\N	7.00	258.49	4.64	t	\N	1245.64	SIMULADO	\N	t	2026-11-18 22:02:36.622-06	c0000000-0000-0000-0000-000000000001	89.71
934bb3ff-d06f-44ef-ab40-84cf4b94648e	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-18 22:02:36.615-06	19.435000	-99.141200	\N	0.00	104.28	6.54	f	\N	456.80	SIMULADO	\N	t	2026-11-18 22:02:36.622-06	c0000000-0000-0000-0000-000000000001	25.44
6eea5782-77c1-4c0f-ac26-b6226f1fddac	27800748-89c1-4900-8b5d-31926fc63836	2026-11-18 22:02:36.785-06	19.428400	-99.127600	\N	0.00	12.16	5.23	f	\N	890.20	SIMULADO	\N	t	2026-11-18 22:02:36.788-06	c0000000-0000-0000-0000-000000000001	28.45
4154b35e-b57c-42cf-a04e-6092d8945c11	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-18 22:02:36.785-06	19.446650	-99.118782	\N	25.00	350.09	3.03	t	\N	3421.26	SIMULADO	\N	t	2026-11-18 22:02:36.788-06	c0000000-0000-0000-0000-000000000001	84.52
8eede3f9-fc1f-456e-b8dc-aa8f81d46db8	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-18 22:02:36.785-06	19.424279	-99.158919	\N	23.00	240.25	6.47	t	\N	1245.66	SIMULADO	\N	t	2026-11-18 22:02:36.788-06	c0000000-0000-0000-0000-000000000001	89.77
45a8ea00-36d2-441a-8736-35f4058175f3	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-18 22:02:36.785-06	19.435000	-99.141200	\N	0.00	96.86	5.77	f	\N	456.80	SIMULADO	\N	t	2026-11-18 22:02:36.788-06	c0000000-0000-0000-0000-000000000001	29.26
f5e0b3ca-4595-43c9-9638-165ef99a517f	27800748-89c1-4900-8b5d-31926fc63836	2026-11-18 22:10:01.524-06	19.428400	-99.127600	\N	0.00	353.05	5.00	f	\N	890.20	SIMULADO	\N	t	2026-11-18 22:10:01.533-06	c0000000-0000-0000-0000-000000000001	21.75
bfd14326-aee9-4026-8f1e-8e50ddb7b18a	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-18 22:10:01.524-06	19.451137	-99.118986	\N	30.00	357.54	3.56	t	\N	3421.28	SIMULADO	\N	t	2026-11-18 22:10:01.533-06	c0000000-0000-0000-0000-000000000001	88.66
9eb5665e-b239-443c-b9c0-a7838d026c90	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-18 22:10:01.524-06	19.422095	-99.164317	\N	37.00	246.78	3.11	t	\N	1245.68	SIMULADO	\N	t	2026-11-18 22:10:01.533-06	c0000000-0000-0000-0000-000000000001	86.71
23c9283b-4af8-415e-89db-498615bc60d1	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-18 22:10:01.524-06	19.435000	-99.141200	\N	0.00	89.18	5.47	f	\N	456.80	SIMULADO	\N	t	2026-11-18 22:10:01.533-06	c0000000-0000-0000-0000-000000000001	24.86
41e8c83e-4dfa-4580-9649-b0625fa307c4	27800748-89c1-4900-8b5d-31926fc63836	2026-11-18 22:10:01.706-06	19.428400	-99.127600	\N	0.00	11.11	6.23	f	\N	890.20	SIMULADO	\N	t	2026-11-18 22:10:01.709-06	c0000000-0000-0000-0000-000000000001	26.53
df2dc558-3f50-4209-ac3e-2238218b4cd5	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-18 22:10:01.706-06	19.452332	-99.119075	\N	8.00	355.96	4.85	t	\N	3421.30	SIMULADO	\N	t	2026-11-18 22:10:01.709-06	c0000000-0000-0000-0000-000000000001	70.09
79204709-c70f-49d5-b917-c16b106da018	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-18 22:10:01.706-06	19.420523	-99.166440	\N	17.00	231.86	4.60	t	\N	1245.70	SIMULADO	\N	t	2026-11-18 22:10:01.709-06	c0000000-0000-0000-0000-000000000001	74.29
c598e501-2db2-4392-bdbe-af53f97aad97	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-18 22:10:01.706-06	19.435000	-99.141200	\N	0.00	80.40	3.40	f	\N	456.80	SIMULADO	\N	t	2026-11-18 22:10:01.709-06	c0000000-0000-0000-0000-000000000001	23.21
725d1496-336c-4cb2-beea-f6ddc29ca29f	27800748-89c1-4900-8b5d-31926fc63836	2026-11-18 22:14:04.273-06	19.428400	-99.127600	\N	0.00	19.62	5.74	f	\N	890.20	SIMULADO	\N	t	2026-11-18 22:14:04.28-06	c0000000-0000-0000-0000-000000000001	28.60
6d491071-aa1f-47f3-82f8-9171fcf63cfc	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-18 22:14:04.273-06	19.455788	-99.120598	\N	25.00	337.43	3.91	t	\N	3421.32	SIMULADO	\N	t	2026-11-18 22:14:04.28-06	c0000000-0000-0000-0000-000000000001	70.88
0964de63-ab70-4ad9-b267-acfce0dcb204	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-18 22:14:04.273-06	19.417447	-99.171515	\N	38.00	237.27	6.09	t	\N	1245.72	SIMULADO	\N	t	2026-11-18 22:14:04.28-06	c0000000-0000-0000-0000-000000000001	77.54
248c4ae9-5120-4908-8681-210dbe5d6437	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-18 22:14:04.273-06	19.435000	-99.141200	\N	0.00	67.89	3.84	f	\N	456.80	SIMULADO	\N	t	2026-11-18 22:14:04.28-06	c0000000-0000-0000-0000-000000000001	24.36
af91b04c-d25a-4f6a-854e-ae2f7e40e332	27800748-89c1-4900-8b5d-31926fc63836	2026-11-18 22:14:04.495-06	19.428400	-99.127600	\N	0.00	15.34	4.40	f	\N	890.20	SIMULADO	\N	t	2026-11-18 22:14:04.498-06	c0000000-0000-0000-0000-000000000001	21.89
dcba02b4-c937-4db3-aaa8-60464d4a731d	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-18 22:14:04.495-06	19.460378	-99.123595	\N	36.00	328.38	5.66	t	\N	3421.34	SIMULADO	\N	t	2026-11-18 22:14:04.498-06	c0000000-0000-0000-0000-000000000001	82.11
f7793536-fa01-4432-8ea1-c050460f474f	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-18 22:14:04.495-06	19.416878	-99.172810	\N	9.00	245.03	4.97	t	\N	1245.74	SIMULADO	\N	t	2026-11-18 22:14:04.498-06	c0000000-0000-0000-0000-000000000001	84.40
9883275f-828d-4e1b-922b-06f598640dac	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-18 22:14:04.495-06	19.435000	-99.141200	\N	0.00	66.34	4.00	f	\N	456.80	SIMULADO	\N	t	2026-11-18 22:14:04.498-06	c0000000-0000-0000-0000-000000000001	21.20
8af7946f-0b8c-4349-aa27-391559f1eee3	27800748-89c1-4900-8b5d-31926fc63836	2026-11-18 22:15:28.026-06	19.428400	-99.127600	\N	0.00	19.23	4.42	f	\N	890.20	SIMULADO	\N	t	2026-11-18 22:15:28.031-06	c0000000-0000-0000-0000-000000000001	29.69
715a1ab6-642b-42cc-9951-253bb6d5ed83	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-18 22:15:28.026-06	19.464432	-99.124726	\N	28.00	345.26	5.11	t	\N	3421.36	SIMULADO	\N	t	2026-11-18 22:15:28.031-06	c0000000-0000-0000-0000-000000000001	87.06
73835481-bb5d-4f87-a75e-12b449e48e4a	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-18 22:15:28.026-06	19.415760	-99.176431	\N	24.00	251.87	7.35	t	\N	1245.76	SIMULADO	\N	t	2026-11-18 22:15:28.031-06	c0000000-0000-0000-0000-000000000001	86.65
b4a3babe-402a-4ce9-823b-ad8241066315	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-18 22:15:28.026-06	19.435000	-99.141200	\N	0.00	59.70	6.32	f	\N	456.80	SIMULADO	\N	t	2026-11-18 22:15:28.031-06	c0000000-0000-0000-0000-000000000001	29.78
6d8031ad-e7c8-435d-9875-99b09db17bd5	27800748-89c1-4900-8b5d-31926fc63836	2026-11-18 22:15:28.257-06	19.428400	-99.127600	\N	0.00	11.62	5.18	f	\N	890.20	SIMULADO	\N	t	2026-11-18 22:15:28.261-06	c0000000-0000-0000-0000-000000000001	22.36
352086ca-2a3a-4e63-8844-8fefe3fd9094	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-18 22:15:28.257-06	19.469645	-99.125292	\N	35.00	354.15	4.13	t	\N	3421.38	SIMULADO	\N	t	2026-11-18 22:15:28.261-06	c0000000-0000-0000-0000-000000000001	84.89
1dc863e8-7502-4633-81a7-c8c2dcd6446d	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-18 22:15:28.257-06	19.415839	-99.180716	\N	27.00	271.12	4.20	t	\N	1245.78	SIMULADO	\N	t	2026-11-18 22:15:28.261-06	c0000000-0000-0000-0000-000000000001	93.16
03eb8ef9-b85a-42fa-9726-3dbaba308b41	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-18 22:15:28.257-06	19.435000	-99.141200	\N	0.00	72.79	4.30	f	\N	456.80	SIMULADO	\N	t	2026-11-18 22:15:28.261-06	c0000000-0000-0000-0000-000000000001	20.55
6933de06-d469-4170-9ecc-250fbd0cddb0	27800748-89c1-4900-8b5d-31926fc63836	2026-11-18 22:19:24.054-06	19.428400	-99.127600	\N	0.00	4.11	4.41	f	\N	890.20	SIMULADO	\N	t	2026-11-18 22:19:24.062-06	c0000000-0000-0000-0000-000000000001	24.32
4db74287-8ca4-48b7-b78e-833b8df58108	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-18 22:19:24.054-06	19.474511	-99.124382	\N	33.00	10.00	6.06	t	\N	3421.40	SIMULADO	\N	t	2026-11-18 22:19:24.062-06	c0000000-0000-0000-0000-000000000001	87.29
ea9d5f4a-82b6-411d-9882-0eebe053ad49	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-18 22:19:24.054-06	19.414932	-99.186671	\N	38.00	260.82	7.32	t	\N	1245.80	SIMULADO	\N	t	2026-11-18 22:19:24.062-06	c0000000-0000-0000-0000-000000000001	79.12
c7e6e07f-b32f-49f3-8394-44e2746d76fe	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-18 22:19:24.054-06	19.435000	-99.141200	\N	0.00	85.97	6.80	f	\N	456.80	SIMULADO	\N	t	2026-11-18 22:19:24.062-06	c0000000-0000-0000-0000-000000000001	28.60
8d084330-923d-4785-8829-d1906034cc42	27800748-89c1-4900-8b5d-31926fc63836	2026-11-18 22:19:24.21-06	19.428400	-99.127600	\N	0.00	358.15	3.98	f	\N	890.20	SIMULADO	\N	t	2026-11-18 22:19:24.214-06	c0000000-0000-0000-0000-000000000001	21.43
a36b57b2-fa18-4b45-b984-6e8486a9dfce	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-18 22:19:24.21-06	19.476379	-99.123373	\N	14.00	27.00	7.56	t	\N	3421.42	SIMULADO	\N	t	2026-11-18 22:19:24.214-06	c0000000-0000-0000-0000-000000000001	86.12
be7992d0-0098-49af-ae07-5da1249fa3da	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-18 22:19:24.21-06	19.413563	-99.190704	\N	27.00	250.20	3.71	t	\N	1245.82	SIMULADO	\N	t	2026-11-18 22:19:24.214-06	c0000000-0000-0000-0000-000000000001	73.54
7b117996-305d-424d-a6e8-2f5f7bbc342a	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-18 22:19:24.21-06	19.435000	-99.141200	\N	0.00	102.75	5.59	f	\N	456.80	SIMULADO	\N	t	2026-11-18 22:19:24.214-06	c0000000-0000-0000-0000-000000000001	28.62
\.


--
-- Data for Name: registros_asistencia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros_asistencia (id, codigo, trabajador_id, fecha, estado, ubicacion, lat_entrada, lng_entrada, lat_salida, lng_salida, salida_ubicacion, obra_asignada, lat_obra, lng_obra, distancia_metros, radio_permitido_metros, en_sitio, precision_gps_metros, dispositivo, horas_trabajadas_ordinarias, salida_anticipada, motivo_salida_anticipada, bateria, notas, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, obra_id, hora_entrada, hora_salida, hora_marcaje_exacta, hora_salida_exacta, omision_motivo, omision_resuelta_en, omision_resuelta_por) FROM stdin;
2dc12a6b-60bf-4f4c-b8d4-2baa1fad2b6b	A001	d69e3ac7-f268-4533-a7ed-780c000f4ad7	2025-04-27	PUNTUAL	Fracc. Valle Sur (Frente a Manzana 4)	19.342300	-99.184100	19.342500	-99.184000	Fracc. Valle Sur (Caseta de Salida)	Fraccionamiento Valle Sur	19.342100	-99.184300	28.00	2000.00	t	6.00	Samsung Galaxy A54 · GPS Activo	8.00	f	\N	92	Marcaje verificado dentro del polígono de obra (radio 2km).	t	2026-08-21 02:14:59.089-06	2026-08-21 02:14:59.089-06	\N	\N	\N	0fe88d91-fac1-4923-a804-e6e9d30b7f17	07:05:00	17:00:00	07:04:48	17:00:15	\N	\N	\N
4b2a99c1-a97c-4505-84ec-989221a655a0	A002	ea344f07-0905-4881-a64b-b7315f0bfe97	2025-04-27	PUNTUAL	Centro Histórico (Acceso Calle Madero)	19.432800	-99.133000	19.432700	-99.133100	Centro Histórico (Salida Madero)	Remodelación Centro Histórico	19.432600	-99.133200	35.00	2000.00	t	8.00	Xiaomi Redmi Note 12 · GPS Activo	8.50	f	\N	87	Marcaje verificado en punto de control de acceso.	t	2026-08-21 02:14:59.094-06	2026-08-21 02:14:59.094-06	\N	\N	\N	4d7ad209-71ed-4bb4-838c-fd59b7d9c32c	06:58:00	16:30:00	06:58:12	16:30:20	\N	\N	\N
216295c6-5501-48a9-a8f6-f3f4e9a79ca4	A003	fe2ec7b7-7fda-4c09-af19-279f41215d06	2025-04-27	RETARDO	Av. Insurgentes Sur #1420 (Fuera de radio 2km)	19.378000	-99.172000	\N	\N	\N	Fraccionamiento Valle Sur	19.342100	-99.184300	4210.00	2000.00	f	14.00	Motorola Moto G84 · GPS Activo	7.00	f	\N	48	ALERTA DE GEOCERCA: El marcaje se realizó a 4.2 km de distancia, superando el radio de 2 km de la obra.	t	2026-08-21 02:14:59.097-06	2026-08-21 02:14:59.097-06	\N	\N	\N	0fe88d91-fac1-4923-a804-e6e9d30b7f17	08:15:00	\N	08:15:33	\N	\N	\N	\N
4fc83c88-d56b-4736-bb65-7746565e33fb	A004	f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	2025-04-27	SALIDA_ANTICIPADA	Oficina Central SVR (Recepción)	19.410600	-99.167700	\N	\N	\N	Oficina Central SVR	19.410500	-99.167800	15.00	500.00	t	4.00	iPhone 13 · iOS 17.4	5.75	t	Cita médica programada en clínica IMSS.	95	ALERTA: Retiro anticipado registrado con motivo médico.	t	2026-08-21 02:14:59.1-06	2026-08-21 02:14:59.1-06	\N	\N	\N	\N	08:30:00	14:15:00	08:29:50	14:15:40	\N	\N	\N
\.


--
-- Data for Name: registros_criba; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros_criba (id, codigo, fecha, turno, operador_id, tipo_material, material_producido, horas_trabajadas, material_al_banco, observaciones, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, maquina_id, proyecto_id, material_criba_id, inventario_en) FROM stdin;
f3e26d9d-0925-4227-8ea1-6917d1790295	\N	2026-11-14	MATUTINO	f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	Arena lavada	60.00	8.00	55.00	\N	t	2026-11-14 04:19:36.387-06	2026-11-13 22:19:36.439878-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N	\N	b007c692-c0df-4e44-a379-168e4a725aa3	2026-11-14 04:19:36.436-06
ea7c14a7-2a91-4bd6-b78b-4634e44e9c92	\N	2026-11-14	MATUTINO	f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	Criba fina	120.00	8.00	110.00	\N	t	2026-11-14 01:09:45.339-06	2026-11-13 22:40:31.994398-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	b7bb9152-0851-4372-9e55-b393fa7da463	949bce82-7516-4e52-a53c-db976e71c9fa	d5ca7fab-d319-422d-815e-5dc06fa63a5a	2026-11-14 04:40:31.992-06
959b85d6-29d6-41e0-9172-df0af5e45afd	CR004	2026-08-14	VESPERTINO	ea344f07-0905-4881-a64b-b7315f0bfe97	Arena lavada	20.00	6.00	15.00	Paro por 2h - falla en faja	t	2026-08-21 02:14:59.191-06	2026-11-13 22:40:52.610945-06	c0000000-0000-0000-0000-000000000001	\N	\N	\N	\N	b007c692-c0df-4e44-a379-168e4a725aa3	2026-11-14 04:40:52.609-06
f486fe46-53e3-4877-a9a2-82fc7c4dbae3	\N	2026-11-06	MATUTINO	99ef344b-2f95-4dec-8f4f-dccc4bb43351	Criba fina	350.00	9.00	300.00	\N	t	2026-11-06 18:15:22.754-06	2026-11-13 22:41:12.378765-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N	\N	d5ca7fab-d319-422d-815e-5dc06fa63a5a	2026-11-14 04:41:12.377-06
e5fcf381-abfa-4556-af30-30e950b51c66	\N	2026-11-14	MATUTINO	d69e3ac7-f268-4533-a7ed-780c000f4ad7	Criba gruesa	70.00	6.00	59.00	\N	t	2026-11-14 00:43:15.21-06	2026-11-13 20:47:06.008388-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N	\N	99739f72-861b-436f-991d-61bba63e605a	\N
c4e9df55-b0e9-4ca3-8a71-4b4d9a6ed256	CR002	2026-08-15	VESPERTINO	d69e3ac7-f268-4533-a7ed-780c000f4ad7	Criba gruesa	30.00	7.00	25.00		t	2026-08-21 02:14:59.189-06	2026-11-13 20:47:06.008388-06	\N	\N	\N	\N	\N	99739f72-861b-436f-991d-61bba63e605a	\N
7531ffa8-81c2-4f5b-977d-75ebec4de956	CR005	2026-08-13	MATUTINO	fe2ec7b7-7fda-4c09-af19-279f41215d06	Criba fina	52.00	8.00	52.00		t	2026-08-21 02:14:59.193-06	2026-11-13 20:47:06.008388-06	\N	\N	\N	\N	\N	d5ca7fab-d319-422d-815e-5dc06fa63a5a	\N
f5c700d9-9a7b-4915-81cc-2f70a6de35cb	CR003	2026-08-14	MATUTINO	fe2ec7b7-7fda-4c09-af19-279f41215d06	Criba fina	50.00	8.00	50.00	Producción completa al banco	t	2026-08-21 02:14:59.19-06	2026-11-13 20:47:06.008388-06	\N	\N	\N	\N	\N	d5ca7fab-d319-422d-815e-5dc06fa63a5a	\N
c2c3d7d4-cc06-4449-b9db-e14921c5d22b	CR001	2026-08-15	MATUTINO	fe2ec7b7-7fda-4c09-af19-279f41215d06	Criba fina	45.00	8.00	38.00	Operación normal	t	2026-08-21 02:14:59.187-06	2026-11-13 20:47:06.008388-06	\N	\N	\N	\N	\N	d5ca7fab-d319-422d-815e-5dc06fa63a5a	\N
\.


--
-- Data for Name: registros_mantenimiento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros_mantenimiento (id, codigo, maquina_id, tipo, descripcion, fecha, horas_servicio, costo, proximo_servicio_horas, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, mecanico_id, refacciones_usadas) FROM stdin;
2b188a63-c66c-4826-84c5-43dd761cd85b	S001	b7bb9152-0851-4372-9e55-b393fa7da463	PREVENTIVO	Cambio de aceite y filtros de motor	2025-04-10	1200.00	5500.00	1450.00	t	2026-08-21 02:14:59.062-06	2026-08-21 02:14:59.062-06	\N	\N	\N	\N	\N
fbf99dff-1986-4621-acbf-3152d9efb683	S002	27800748-89c1-4900-8b5d-31926fc63836	CORRECTIVO	Reparación de manguera hidráulica	2025-04-20	880.00	2200.00	1100.00	t	2026-08-21 02:14:59.064-06	2026-08-21 02:14:59.064-06	\N	\N	\N	\N	\N
\.


--
-- Data for Name: reportes_actividades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reportes_actividades (id, reporte_id, texto, autor_nombre, creado_en) FROM stdin;
96ca43a9-8006-4510-9bc7-206b91ad0ab7	84f8ad25-58d2-4921-bb80-8ea9f3bd71c1	Revision inicial por el responsable	Pedro S.	2026-11-08 22:41:57.56-06
c73a3793-61e9-4784-b1fb-489f8e65b978	84f8ad25-58d2-4921-bb80-8ea9f3bd71c1	asasasfdfdfdf	Pedro S.	2026-11-08 23:23:50.828-06
26c3b90a-a4cd-4ae1-bc96-dae4e8f7f485	79efd175-0b8a-43da-8c22-b9cd1d4a0610	se pidio la bomba de gasolina, llega en 2 dias	Carlos SVR	2026-11-09 04:28:52.108-06
1f9c563d-2a6a-46e1-88f7-4ac04ca2cb28	e3104d1b-67c5-4f3e-b4c8-c610ff241394	se inicio con el reporte	María López Hernández	2026-11-13 23:19:52.812-06
\.


--
-- Data for Name: reportes_campo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reportes_campo (id, codigo, tipo, usuario, maquina_id, fecha, descripcion, estado, prioridad, detalles, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, obra_id, obra_texto, usuario_id, hora, asignado_a_id, asignado_en, asignado_nombre, cerrado_en, categoria, latitud, longitud, subcategoria_id, proyecto_id, asignado_user_id) FROM stdin;
17fd1b88-e45a-4a55-b1c7-087677b449b5	INC0002	INCIDENTE	sistema	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	Fuga de aceite hidráulico — Se detectó fuga en manguera principal	EN_CURSO	ALTA	\N	t	2026-08-21 02:14:59.156-06	2026-11-08 15:18:29.527953-06	\N	\N	\N	\N	Valle Sur	\N	00:00:00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4b2cb305-35c6-4250-8f71-9c4b376677ff	INC0004	INCIDENTE	sistema	\N	2025-04-26	Retraso por clima — Lluvia intensa impidió colado de losa	NUEVO	BAJA	\N	t	2026-08-21 02:14:59.158-06	2026-11-08 15:18:29.527953-06	\N	\N	\N	\N	Remodelación Centro	\N	00:00:00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c84bd1dd-ac9e-4a7c-8989-8f1863a1c2f7	INC0005	OPERADOR	Juan P.	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	Reporte matutino: Aceite OK, Agua OK, Diésel 65%. Listo para trabajar.	EN_CURSO	\N	\N	t	2026-08-21 02:14:59.169-06	2026-11-08 15:18:29.527953-06	\N	\N	\N	\N	Valle Sur	\N	07:15:00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
31e0b97f-81d0-4657-9d88-4caaf698ce20	INC0006	INCIDENTE	Ricardo M.	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	Se detectó fuga en manguera hidráulica principal. Equipo detenido hasta reparación.	EN_CURSO	ALTA	\N	t	2026-08-21 02:14:59.171-06	2026-11-08 15:18:29.527953-06	c0000000-0000-0000-0000-000000000001	\N	\N	\N	Valle Sur	\N	11:00:00	7ae68a33-6be6-46f3-8344-2dbf7389540d	2026-11-04 23:31:06.828-06	\N	\N	\N	\N	\N	\N	\N	\N
9956f12c-cb84-4387-a753-7d6c611b788a	INC0007	INCIDENTE	Ing. López	\N	2025-04-26	Lluvia intensa impidió colado de losa. Se reprograma para mañana.	CERRADO	BAJA	\N	t	2026-08-21 02:14:59.172-06	2026-11-08 15:18:29.527953-06	\N	\N	\N	\N	Remodelación Centro	\N	15:00:00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ab4085a6-91df-454d-b649-a66100a363b3	INC0010	MECANICO	Ricardo M.	b7bb9152-0851-4372-9e55-b393fa7da463	2026-11-03	Reparación de neumático delantero izquierdo. Balanceo listo.	EN_CURSO	MEDIA	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:18:29.572078-06	\N	\N	\N	\N	Taller mecánico	\N	07:30:00	ea344f07-0905-4881-a64b-b7315f0bfe97	2026-11-04 18:38:04.067759-06	\N	\N	MECANICO	\N	\N	\N	\N	\N
6459d7c7-f7db-44d6-b9fe-b2f17a38cbf1	INC0011	MECANICO	Ricardo M.	dba9c3c3-e696-4ce7-aaec-87970b37392d	2026-11-04	Cambio de filtros y aceite del motor (servicio preventivo).	EN_CURSO	BAJA	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:18:29.572078-06	\N	\N	\N	\N	Taller mecánico	\N	16:05:00	ea344f07-0905-4881-a64b-b7315f0bfe97	2026-11-04 18:38:04.067759-06	\N	\N	MECANICO	\N	\N	\N	\N	\N
0b274290-7980-4bb6-b818-92638fa14f48	INC0008	ADMINISTRATIVO	Laura M.	\N	2026-11-03	Alta de nuevo cliente: Constructora del Bajío. Documentos en orden.	NUEVO	MEDIA	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:18:29.574362-06	\N	\N	\N	\N	Oficina central	\N	09:15:00	\N	\N	\N	\N	ADMINISTRATIVO	\N	\N	\N	\N	\N
1001ee33-a3ea-4250-b4de-3522283c947a	INC0009	ADMINISTRATIVO	Laura M.	\N	2026-11-04	Cotización pendiente de firma por el cliente Valle de Bravo.	NUEVO	BAJA	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:18:29.574362-06	\N	\N	\N	\N	Oficina central	\N	12:40:00	\N	\N	\N	\N	ADMINISTRATIVO	\N	\N	\N	\N	\N
b07a8466-3c33-48ad-a9f7-227f69b9fdab	INC0003	PIPERO	Marcos G.	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2025-04-27	Suministro de 200L de diésel. Tanque lleno.	EN_CURSO	\N	{"costo": 4600, "litros": 200}	t	2026-08-21 02:14:59.167-06	2026-11-08 15:18:29.575137-06	c0000000-0000-0000-0000-000000000001	\N	\N	\N	Valle Sur	\N	14:15:00	\N	\N	\N	\N	DIESEL	\N	\N	\N	\N	\N
f8ee1caf-0bb1-4287-96fa-8f3e27373417	INC0014	PIPERO	Marcos G.	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2026-11-03	Suministro de 350L de diésel en obra. Tanque lleno.	NUEVO	\N	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:18:29.575137-06	\N	\N	\N	\N	Valle Sur	\N	10:30:00	\N	\N	\N	\N	DIESEL	\N	\N	\N	\N	\N
b3ec7fe6-63e8-41c9-8464-57eef1a65dfc	INC0012	OPERADOR	Pedro S.	27800748-89c1-4900-8b5d-31926fc63836	2026-11-03	Reporte matutino: nivel de combustible 90%, sin novedades.	NUEVO	\N	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:18:29.527953-06	\N	\N	\N	\N	Fraccionamiento Valle Sur	\N	08:00:00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3b62f4df-ad86-4c73-b616-0d7c4684e410	INC0013	OPERADOR	Pedro S.	\N	2026-11-04	Traslado de material del banco de préstamo a la obra terminado.	EN_CURSO	BAJA	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:18:29.527953-06	c0000000-0000-0000-0000-000000000001	\N	\N	\N	Fraccionamiento Valle Sur	\N	17:20:00	f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	2026-11-05 19:30:33.409-06	\N	\N	\N	\N	\N	\N	\N	\N
43168eaf-4c62-4651-8d4f-af811eaf0dcc	INC0016	CHECADOR	Sofía R.	\N	2026-11-03	Checador de asistencia funcionando; 18 trabajadores en sitio.	NUEVO	\N	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:18:29.527953-06	\N	\N	\N	\N	Fraccionamiento Valle Sur	\N	06:45:00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cbb1b2a7-9d09-4969-9b80-9c77095acd63	INC0018	INCIDENTE	Ricardo M.	\N	2026-11-04	Fuga de agua en radiador. Máquina detenida hasta revisión.	EN_CURSO	ALTA	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:18:29.527953-06	\N	\N	\N	\N	Taller mecánico	\N	09:05:00	f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	2026-11-04 18:38:04.067759-06	\N	\N	\N	\N	\N	\N	\N	\N
cbd59555-1dbf-459f-8788-9873ec3d83ac	INC0022	TRABAJADOR	Juan D.	\N	2026-11-03	Solicitud de herramienta nueva: desarmadores aislados.	NUEVO	BAJA	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:18:29.527953-06	\N	\N	\N	\N	Fraccionamiento Valle Sur	\N	13:10:00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4b047807-7c1d-4242-89ce-8cc091cb2ab2	INC0023	TRABAJADOR	Juan D.	\N	2026-11-04	Limpieza de área de descanso completada conforme a plan.	CERRADO	\N	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:18:29.527953-06	\N	\N	\N	\N	Fraccionamiento Valle Sur	\N	11:25:00	ea344f07-0905-4881-a64b-b7315f0bfe97	2026-11-04 18:38:04.067759-06	\N	2026-11-04 18:38:04.067759-06	\N	\N	\N	\N	\N	\N
3c4acb70-89f4-45af-b46f-730fc5e79f5e	INC0015	PIPERO	Marcos G.	\N	2026-11-04	Abastecimiento de maquinaria en segundo frente.	EN_CURSO	BAJA	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:18:29.575137-06	\N	\N	\N	\N	Valle Sur	\N	08:50:00	\N	\N	\N	\N	DIESEL	\N	\N	\N	\N	\N
1ad858c5-acfe-412c-a544-712f356cb944	INC0020	INGENIERO	Ing. Alberto Ruiz	\N	2026-11-03	Revisión de resistencia de concreto: muestra de losa de cimiento en rango.	CERRADO	\N	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:18:29.575856-06	\N	\N	\N	\N	Fraccionamiento Valle Sur	\N	11:00:00	f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	2026-11-04 18:38:04.067759-06	\N	2026-11-04 18:38:04.067759-06	RESIDENTE	\N	\N	\N	\N	\N
cb186259-3052-4937-8963-b5483b71d490	INC0021	INGENIERO	Ing. Alberto Ruiz	\N	2026-11-04	Supervisión de instalaciones hidrosanitarias: 80% completado.	EN_CURSO	MEDIA	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:18:29.575856-06	c0000000-0000-0000-0000-000000000001	\N	\N	\N	Valle Sur	\N	15:45:00	\N	\N	\N	\N	RESIDENTE	\N	\N	\N	\N	\N
3a2d9aca-9182-4633-9dfa-4b72a174a5b8	INC0024	INCIDENTE	Prueba Agente	\N	2026-11-08	Verificacion de folio INC y categoria (prueba de agente)	NUEVO	\N	\N	f	2026-11-08 21:25:22.169-06	2026-11-08 15:25:38.008715-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-08 21:25:38.005-06	\N	Test folio	c0000000-0000-0000-0000-000000000001	18:00:00	\N	\N	\N	\N	MANTENIMIENTO	\N	\N	\N	\N	\N
c898b664-640b-4dc9-b220-533b3bd031fd	INC0017	CHECADOR	Sofía R.	\N	2026-11-04	Falta justificada por incapacidad: Juan D., 1 día.	EN_CURSO	BAJA	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 15:51:21.480466-06	c0000000-0000-0000-0000-000000000001	\N	\N	\N	Fraccionamiento Valle Sur	\N	06:50:00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
84f8ad25-58d2-4921-bb80-8ea9f3bd71c1	INC0019	INCIDENTE	Pedro S.	\N	2026-11-04	Luminaria trasera sin funcionar, riesgo por trabajo nocturno.	EN_CURSO	MEDIA	\N	t	2026-11-04 18:38:04.067759-06	2026-11-08 16:41:57.60533-06	c0000000-0000-0000-0000-000000000001	\N	\N	\N	Fraccionamiento Valle Sur	\N	14:35:00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
16424ec4-2d97-4e98-a03d-ac7be27ddee9	INC0027	INCIDENTE	Prueba fecha auto	\N	2026-11-08	fecha y hora automaticas (borrar despues)	NUEVO	\N	\N	f	2026-11-08 23:31:19.841-06	2026-11-08 17:31:19.908248-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-08 23:31:19.905-06	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	23:31:00	\N	\N	\N	\N	MANTENIMIENTO	\N	\N	\N	\N	\N
7d4d3805-f6b4-47d1-9791-7990815a95b1	INC0030	MECANICO	Carlos SVR	\N	2026-11-08	wwaaaaaa	NUEVO	MEDIA	\N	t	2026-11-08 23:54:36.281-06	2026-11-08 23:54:36.27-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	23:54:00	\N	\N	\N	\N	SOLDADOR	\N	\N	9fd2e2f1-3a2a-4e32-8eb9-1f662a93aab3	\N	\N
a45d5890-6ed0-4eda-88f5-03c2e9fe30e5	INC0037	DIESEL	Prueba sin tipo	\N	2026-11-09	tipo derivado de torre (borrar)	NUEVO	\N	\N	f	2026-11-09 02:01:31.865-06	2026-11-08 20:01:32.150259-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-09 02:01:32.144-06	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	02:01:00	\N	\N	\N	\N	DIESEL	\N	\N	\N	\N	\N
40a45132-e439-41f8-8ec4-1717e6205900	INC0059	DIESEL	Carlos SVR	\N	2026-11-10	prueba body limit	NUEVO	\N	\N	f	2026-11-10 18:24:24.126-06	2026-11-10 12:24:24.238452-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-10 18:24:24.236-06	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	18:24:00	\N	\N	\N	\N	DIESEL	\N	\N	\N	\N	\N
e3104d1b-67c5-4f3e-b4c8-c610ff241394	INC0063	ADMINISTRATIVO	Carlos SVR	\N	2026-11-13	sssssssss	CERRADO	BAJA	\N	t	2026-11-13 23:18:43.998-06	2026-11-13 17:20:26.255627-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	17:18:43	\N	2026-11-13 23:19:10.088-06	María López Hernández	2026-11-13 23:20:26.248-06	ADMINISTRATIVO	21.6472103	-105.1189666	f6a82849-0b10-48ab-99eb-02ec9ef14a57	\N	\N
fe444c2b-46ab-4d1d-a2ee-4fe385b19d44	INC0051	MECANICO	Carlos SVR	\N	2026-11-09	cerrar solo admin (borrar)	EN_CURSO	\N	\N	f	2026-11-09 08:07:02.147-06	2026-11-09 02:07:03.040554-06	e2000000-0000-0000-0000-0000000000a3	c0000000-0000-0000-0000-000000000001	2026-11-09 08:07:03.038-06	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	08:07:00	\N	\N	\N	\N	MECANICO	\N	\N	\N	\N	\N
11e3a902-6480-47c4-a871-f533e56f1254	INC0039	MECANICO	Carlos SVR	\N	2026-11-09	bombas del taller - para tecnico (demo)	EN_CURSO	\N	\N	t	2026-11-09 04:11:57.269-06	2026-11-09 20:18:56.39818-06	e2000000-0000-0000-0000-0000000000a3	c0000000-0000-0000-0000-000000000001	\N	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	04:11:00	\N	2026-11-09 04:11:57.965-06	Rubén Técnico de Flota	\N	MECANICO	\N	\N	\N	\N	\N
b55d5150-19f9-4555-a5b4-1211040f1cef	INC0001	MECANICO	Ricardo M.	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	Se completó reparación de cadena izquierda. Tensor ajustado.	EN_CURSO	\N	\N	t	2026-08-21 02:14:59.163-06	2026-11-09 20:18:41.833887-06	e2000000-0000-0000-0000-0000000000a3	\N	\N	\N	Valle Sur	\N	10:30:00	\N	2026-11-10 02:18:39.933-06	Rubén Técnico de Flota	\N	MECANICO	\N	\N	\N	\N	\N
77bcc118-0a93-4335-bd22-d96bfb92c30d	INC0066	ADMINISTRATIVO	Carlos SVR	\N	2026-11-13	jhgfsdf g yg  itui  i	NUEVO	ALTA	\N	t	2026-11-13 23:35:37.503-06	2026-11-13 23:35:37.499-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	17:35:37	\N	\N	\N	\N	ADMINISTRATIVO	\N	\N	f6a82849-0b10-48ab-99eb-02ec9ef14a57	\N	\N
d83b0b01-e7a3-4104-ad28-8dd3e929110d	INC0055	ADMINISTRATIVO	Carlos SVR	\N	2026-11-10	falta aceite	EN_CURSO	MEDIA	\N	t	2026-11-10 00:36:11.254-06	2026-11-12 13:25:09.948702-06	f0000000-0000-0000-0000-000000000020	c0000000-0000-0000-0000-000000000001	\N	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	00:36:00	\N	2026-11-12 19:25:05.098-06	María López Hernández	\N	ADMINISTRATIVO	\N	\N	f6a82849-0b10-48ab-99eb-02ec9ef14a57	\N	\N
df63be3a-d72c-430a-abd9-579a2440ecc1	INC0028	INCIDENTE	Prueba alta con imagen	\N	2026-11-08	Bomba de agua rota (prueba, borrar)	NUEVO	\N	\N	f	2026-11-08 23:41:58.083-06	2026-11-08 17:41:58.217135-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-08 23:41:58.215-06	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	23:41:00	\N	\N	\N	\N	MANTENIMIENTO	\N	\N	\N	\N	\N
69fdf4e6-ea87-42c8-9044-082b7b176bb8	INC0040	MECANICO	Carlos SVR	\N	2026-11-09	rbac aceptar (borrar)	NUEVO	\N	\N	f	2026-11-09 04:12:36.524-06	2026-11-08 22:12:37.653348-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-09 04:12:37.647-06	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	04:12:00	\N	\N	\N	\N	MECANICO	\N	\N	\N	\N	\N
1b3029d3-85f1-4d64-8386-71db77899244	INC0052	MANTENIMIENTO	Juan Trabajador de Campo	\N	2026-11-09	Fuga en manguera del camion (demo equipo)	NUEVO	\N	\N	t	2026-11-09 09:01:54.854-06	2026-11-09 09:01:54.847-06	e2000000-0000-0000-0000-0000000000a5	e2000000-0000-0000-0000-0000000000a5	\N	\N	Sin obra asociada	e2000000-0000-0000-0000-0000000000a5	09:01:00	\N	\N	\N	\N	MANTENIMIENTO	\N	\N	\N	\N	\N
d4ee0b13-c63b-44b5-bf4a-807daaa17e5b	INC0064	ADMINISTRATIVO	María López Hernández	\N	2026-11-13	dddddddddd	NUEVO	CRITICA	\N	t	2026-11-13 23:21:57.364-06	2026-11-13 23:21:57.36-06	f0000000-0000-0000-0000-000000000020	f0000000-0000-0000-0000-000000000020	\N	\N	Sin obra asociada	f0000000-0000-0000-0000-000000000020	17:21:57	\N	\N	\N	\N	ADMINISTRATIVO	\N	\N	f6a82849-0b10-48ab-99eb-02ec9ef14a57	21b6cf72-c07c-40e8-aac6-b538511f5127	\N
85a1d1b8-26cd-41a2-8d1c-3679904a96e9	INC0032	INCIDENTE	Prueba misma area con torre	\N	2026-11-09	misma area con torre asignada (borrar)	NUEVO	\N	\N	t	2026-11-09 00:10:18.45-06	2026-11-09 00:10:18.445-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	00:10:00	\N	\N	\N	\N	ADMINISTRATIVO	\N	\N	\N	\N	\N
8f433b71-8290-4a3a-af21-4389c14688be	INC0034	INCIDENTE	Prueba misma area torre	\N	2026-11-09	verificar torre resuelta (borrar)	NUEVO	\N	\N	f	2026-11-09 00:14:44.543-06	2026-11-08 18:14:44.867238-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-09 00:14:44.864-06	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	00:14:00	\N	\N	\N	\N	RESIDENTE	\N	\N	\N	\N	\N
98ca30e3-f502-4a34-804e-fb334cf43091	INC0031	PIPERO	Carlos SVR	\N	2026-11-08	wwwwww	NUEVO	MEDIA	\N	t	2026-11-08 23:55:01.734-06	2026-11-08 18:27:07.371714-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	23:55:00	\N	\N	\N	\N	SOLDADOR	\N	\N	1657a369-378b-4357-9576-34425b7299e6	\N	\N
f6aea44a-c5a7-4879-ac4e-86e00e0795ba	INC0036	MECANICO	Ruben Tecnico	\N	2026-11-09	misma area por rol tecnico (borrar)	EN_CURSO	\N	\N	f	2026-11-09 01:06:54.694-06	2026-11-08 19:07:18.252467-06	e2000000-0000-0000-0000-0000000000a3	e2000000-0000-0000-0000-0000000000a3	2026-11-09 01:07:18.245-06	\N	Sin obra asociada	e2000000-0000-0000-0000-0000000000a3	01:06:00	\N	\N	\N	\N	MECANICO	\N	\N	\N	\N	\N
c8d180e6-786a-4d28-9cc9-ca9d8ea66aa1	INC0038	DIESEL	Prueba ubicacion proyecto	\N	2026-11-09	ubicacion por proyecto (borrar)	NUEVO	\N	\N	f	2026-11-09 02:25:14.248-06	2026-11-08 20:25:14.290235-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-09 02:25:14.287-06	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	02:25:00	\N	\N	\N	\N	DIESEL	\N	\N	\N	\N	\N
02180f88-11b5-445c-b653-f14faf940f11	INC0053	MECANICO	Pedro Chofer de Obra	\N	2026-11-09	Frenos del pipero revisados (demo equipo)	EN_CURSO	\N	\N	t	2026-11-09 09:01:55.452-06	2026-11-09 20:00:39.929101-06	e2000000-0000-0000-0000-0000000000a3	e2000000-0000-0000-0000-0000000000c1	\N	\N	Sin obra asociada	e2000000-0000-0000-0000-0000000000c1	09:01:00	\N	2026-11-10 02:00:37.648-06	Rubén Técnico de Flota	\N	MECANICO	\N	\N	\N	\N	\N
a8ce0c6c-53f8-4043-b91e-516c603eb9b3	INC0056	MECANICO	Carlos Soldador de Planta	\N	2026-11-10	cambio de aceite	CERRADO	MEDIA	\N	t	2026-11-10 00:39:40.406-06	2026-11-09 20:03:02.758439-06	c0000000-0000-0000-0000-000000000001	e2000000-0000-0000-0000-0000000000b1	\N	\N	Sin obra asociada	e2000000-0000-0000-0000-0000000000b1	00:39:00	\N	2026-11-10 00:41:52.009-06	Rubén Técnico de Flota	2026-11-10 02:03:02.756-06	MECANICO	\N	\N	169c6d14-edd3-4efb-b97d-e0ae4f8dd3a5	\N	\N
e1ca2c37-fde3-4830-b363-61825173c818	INC0046	SOLDADOR	Carlos Soldador de Planta	\N	2026-11-09	soldar varilla	EN_CURSO	BAJA	\N	t	2026-11-09 06:42:34.499-06	2026-11-09 20:17:48.843701-06	e2000000-0000-0000-0000-0000000000b1	c0000000-0000-0000-0000-000000000001	\N	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	06:42:00	\N	2026-11-09 06:43:09.133-06	Carlos SVR	\N	SOLDADOR	\N	\N	1657a369-378b-4357-9576-34425b7299e6	\N	\N
7037cd8d-802f-4726-bd47-7dc421cabaee	INC0042	MECANICO	Carlos SVR	\N	2026-11-09	prueba aceptar POST	NUEVO	\N	\N	f	2026-11-09 05:28:08.721-06	2026-11-08 23:28:09.385704-06	e2000000-0000-0000-0000-0000000000a3	c0000000-0000-0000-0000-000000000001	2026-11-09 05:28:09.383-06	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	05:28:00	\N	2026-11-09 05:28:09.285-06	Rubén Técnico de Flota	\N	MECANICO	\N	\N	\N	\N	\N
b5a2d25d-2591-4769-91e8-011dcce29b13	INC0044	MECANICO	Ruben Tecnico	\N	2026-11-09	misma area con rol descriptivo	NUEVO	\N	\N	f	2026-11-09 06:12:27.936-06	2026-11-09 00:12:50.635631-06	e2000000-0000-0000-0000-0000000000a3	e2000000-0000-0000-0000-0000000000a3	2026-11-09 06:12:50.631-06	\N	Sin obra asociada	e2000000-0000-0000-0000-0000000000a3	06:12:00	\N	\N	\N	\N	MECANICO	\N	\N	\N	\N	\N
8f674427-b051-4ce1-aa4c-39d7a7410256	INC0049	DIESEL	Denis Repartidor de Diesel	\N	2026-11-09	me quede sin diesel a medio camino frente al oxxo	NUEVO	MEDIA	\N	t	2026-11-09 07:39:57.859-06	2026-11-09 07:39:57.85-06	e2000000-0000-0000-0000-0000000000b2	e2000000-0000-0000-0000-0000000000b2	\N	\N	Sin obra asociada	e2000000-0000-0000-0000-0000000000b2	07:39:00	\N	\N	\N	\N	DIESEL	21.6472376	-105.1188890	28e99e7c-9466-4e00-bd71-47514a572721	\N	\N
42ff7c09-9491-4742-8c45-50c0c72d0447	INC0062	ADMINISTRATIVO	María López Hernández	\N	2026-11-12	wwwwwwww	NUEVO	ALTA	\N	t	2026-11-12 19:00:55.21-06	2026-11-12 19:00:55.204-06	f0000000-0000-0000-0000-000000000020	f0000000-0000-0000-0000-000000000020	\N	\N	Sin obra asociada	f0000000-0000-0000-0000-000000000020	13:00:55	\N	\N	\N	\N	ADMINISTRATIVO	21.6472117	-105.1189496	f6a82849-0b10-48ab-99eb-02ec9ef14a57	\N	\N
6ebe49d6-86c4-4f1a-8759-1b69e912fe78	INC0060	DIESEL	Carlos SVR	\N	2026-11-10	prueba body limit	NUEVO	\N	\N	f	2026-11-10 18:25:39.659-06	2026-11-10 13:03:13.863797-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-10 18:25:39.766-06	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	18:25:00	\N	\N	\N	\N	DIESEL	\N	\N	\N	\N	\N
818266d2-2fff-43dc-a07b-3e9fb51ef1b0	INC0058	DIESEL	Carlos SVR	\N	2026-11-10	Me quede sin diesel, frente al oxxo, en el centro	NUEVO	MEDIA	\N	t	2026-11-10 18:06:18.971-06	2026-11-10 18:06:18.963-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	18:06:00	\N	\N	\N	\N	DIESEL	21.6472363	-105.1188890	28e99e7c-9466-4e00-bd71-47514a572721	\N	\N
7eeeffcb-49f1-4f32-9ed7-6d69053b45ee	INC0057	MECANICO	Rubén Técnico de Flota	\N	2026-11-10	aaaaaaaa	CERRADO	MEDIA	\N	t	2026-11-10 00:41:44.68-06	2026-11-13 16:33:44.850513-06	c0000000-0000-0000-0000-000000000001	e2000000-0000-0000-0000-0000000000a3	\N	\N	Sin obra asociada	e2000000-0000-0000-0000-0000000000a3	00:41:00	\N	2026-11-10 02:18:32.205-06	Rubén Técnico de Flota	2026-11-13 22:33:44.845-06	MECANICO	\N	\N	169c6d14-edd3-4efb-b97d-e0ae4f8dd3a5	\N	\N
f11f0ef5-2cd7-4b32-a5f4-7fa7cbc204b2	INC0054	DIESEL	Luis Operador de Patio	\N	2026-11-09	Nivel de diesel bajo en excavadora (demo equipo)	NUEVO	\N	\N	t	2026-11-09 09:01:55.989-06	2026-11-09 09:01:55.985-06	e2000000-0000-0000-0000-0000000000c2	e2000000-0000-0000-0000-0000000000c2	\N	\N	Sin obra asociada	e2000000-0000-0000-0000-0000000000c2	09:01:00	\N	\N	\N	\N	DIESEL	\N	\N	\N	\N	\N
4ec48078-ce72-4223-a819-c9243d8d09c6	INC0029	INCIDENTE	Carlos SVR	\N	2026-11-08	las balatas	EN_CURSO	MEDIA	\N	t	2026-11-08 23:47:32.549-06	2026-11-09 20:02:25.910313-06	e2000000-0000-0000-0000-0000000000a3	c0000000-0000-0000-0000-000000000001	\N	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	23:47:00	\N	2026-11-10 02:02:23.584-06	Rubén Técnico de Flota	\N	MECANICO	\N	\N	169c6d14-edd3-4efb-b97d-e0ae4f8dd3a5	\N	\N
3b1fef8a-90d2-4bff-9b83-63a5a4dece99	INC0047	SOLDADOR	Carlos Soldador de Planta	\N	2026-11-09	aaaaaa	EN_CURSO	ALTA	\N	t	2026-11-09 06:45:28.362-06	2026-11-09 20:17:44.307029-06	e2000000-0000-0000-0000-0000000000b1	c0000000-0000-0000-0000-000000000001	\N	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	06:45:00	\N	2026-11-09 06:45:39.654-06	Carlos SVR	\N	SOLDADOR	\N	\N	1657a369-378b-4357-9576-34425b7299e6	\N	\N
eacb1025-7144-42c8-acda-c2281b52d6c1	INC0043	SOLDADOR	Carlos SVR	\N	2026-11-09	se necesitan soldar 5 vigas para un techo	EN_CURSO	MEDIA	\N	t	2026-11-09 05:42:51.614-06	2026-11-09 20:17:54.282689-06	e2000000-0000-0000-0000-0000000000b1	c0000000-0000-0000-0000-000000000001	\N	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	05:42:00	\N	2026-11-10 02:17:52.674-06	Carlos Soldador de Planta	\N	SOLDADOR	\N	\N	1657a369-378b-4357-9576-34425b7299e6	\N	\N
ec537896-fe37-45e4-a342-9646c8015675	INC0025	INCIDENTE	Prueba Misma Area	\N	2026-11-08	Verificacion misma area (borrar despues)	NUEVO	\N	\N	f	2026-11-08 23:11:17.845-06	2026-11-08 17:11:32.481732-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-08 23:11:32.479-06	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	21:30:00	\N	\N	\N	\N	ADMINISTRATIVO	\N	\N	\N	\N	\N
211b8ca6-7c7c-48e4-af9b-72d10a11f1b6	INC0026	INCIDENTE	Prueba Torre	\N	2026-11-08	Verificacion torre explicita (borrar despues)	NUEVO	\N	\N	f	2026-11-08 23:11:17.889-06	2026-11-08 17:11:32.536593-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-08 23:11:32.535-06	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	21:31:00	\N	\N	\N	\N	MECANICO	\N	\N	\N	\N	\N
04ea54d2-6be7-49d3-b239-63593f8e067a	INC0045	SOLDADOR	Carlos SVR	\N	2026-11-09	Soldadura del domo de la cancha	EN_CURSO	MEDIA	\N	t	2026-11-09 06:22:21.494-06	2026-11-09 00:23:25.420935-06	e2000000-0000-0000-0000-0000000000b1	c0000000-0000-0000-0000-000000000001	\N	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	06:22:00	\N	2026-11-09 06:23:19.261-06	Carlos Soldador de Planta	\N	SOLDADOR	\N	\N	1657a369-378b-4357-9576-34425b7299e6	\N	\N
d4a7ba4c-6873-4afd-93e1-ff861ce0bbd1	INC0035	INCIDENTE	Prueba payload grande	\N	2026-11-09	body limit grande (borrar)	NUEVO	\N	\N	f	2026-11-09 00:15:17.593-06	2026-11-08 18:15:17.829308-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-09 00:15:17.827-06	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	00:15:00	\N	\N	\N	\N	DIESEL	\N	\N	\N	\N	\N
14d61dd4-d130-4bd0-aae9-c027eaca4306	INC0041	MECANICO	Juan Trabajador	\N	2026-11-09	reporte del trabajador (demo jefe)	NUEVO	\N	\N	f	2026-11-09 04:55:27.552-06	2026-11-08 22:55:44.057918-06	e2000000-0000-0000-0000-0000000000a5	e2000000-0000-0000-0000-0000000000a5	2026-11-09 04:55:44.048-06	\N	Sin obra asociada	e2000000-0000-0000-0000-0000000000a5	04:55:00	\N	\N	\N	\N	MECANICO	\N	\N	\N	\N	\N
0b5fc257-625a-428a-8028-151dce1f5a6e	INC0048	SOLDADOR	Carlos Soldador de Planta	\N	2026-11-09	Soldar varillas	CERRADO	MEDIA	\N	t	2026-11-09 07:11:21.94-06	2026-11-09 01:13:41.067364-06	e2000000-0000-0000-0000-0000000000b1	e2000000-0000-0000-0000-0000000000b1	\N	\N	Sin obra asociada	e2000000-0000-0000-0000-0000000000b1	07:11:00	\N	2026-11-09 07:11:29.986-06	Carlos Soldador de Planta	2026-11-09 07:13:41.065-06	SOLDADOR	\N	\N	1657a369-378b-4357-9576-34425b7299e6	\N	\N
79efd175-0b8a-43da-8c22-b9cd1d4a0610	INC0033	ADMINISTRATIVO	Carlos SVR	\N	2026-11-09	misma area con torre asignada (borrar)misma area con torre asignada (borrar)misma area con torre asignada (borrar)misma area con torre asignada (borrar)misma area con torre asignada (borrar)misma area con torre asignada (borrar)misma area con torre asignada (borrar)misma area con torre asignada (borrar)misma area con torre asignada (borrar)misma area con torre asignada (borrar)	CERRADO	\N	\N	t	2026-11-09 00:12:32.959-06	2026-11-08 23:26:50.324785-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	\N	Sin obra asociada	c0000000-0000-0000-0000-000000000001	00:12:00	99ef344b-2f95-4dec-8f4f-dccc4bb43351	2026-11-09 01:19:15.99-06	\N	2026-11-09 05:26:50.322-06	ADMINISTRATIVO	\N	\N	f6a82849-0b10-48ab-99eb-02ec9ef14a57	\N	\N
f561fc69-74e3-4b10-8736-8c4842df3f82	INC0050	DIESEL	Denis Repartidor de Diesel	\N	2026-11-09	me quede sin diesel	NUEVO	MEDIA	\N	t	2026-11-09 07:41:10.858-06	2026-11-09 07:41:10.854-06	e2000000-0000-0000-0000-0000000000b2	e2000000-0000-0000-0000-0000000000b2	\N	\N	Sin obra asociada	e2000000-0000-0000-0000-0000000000b2	07:41:00	\N	\N	\N	\N	DIESEL	\N	\N	28e99e7c-9466-4e00-bd71-47514a572721	\N	\N
13244eac-d22e-4096-b34e-12b9ba3b64f9	INC0061	MANTENIMIENTO	María López Hernández	\N	2026-11-12	Falta cambiar unos focos en la oficina	NUEVO	MEDIA	\N	t	2026-11-12 19:00:30.982-06	2026-11-12 19:00:30.976-06	f0000000-0000-0000-0000-000000000020	f0000000-0000-0000-0000-000000000020	\N	\N	Sin obra asociada	f0000000-0000-0000-0000-000000000020	13:00:30	\N	\N	\N	\N	MANTENIMIENTO	21.6472117	-105.1189496	10d30443-90d3-425e-8f40-c45e58b257f0	\N	\N
\.


--
-- Data for Name: retiros_caja; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.retiros_caja (id, concepto, monto, autorizado_por, cajero, fecha, hora, creado_en, actualizado_en, creado_por, eliminado_en) FROM stdin;
dc2b7893-3f74-4a66-a04b-101be4de4e45	ddd	2222.00	yo	Carlos SVR	2026-11-05	02:38 p.m.	2026-11-05 20:38:18.657-06	2026-11-05 20:38:18.65-06	c0000000-0000-0000-0000-000000000001	\N
78be87a8-43a5-484c-97f8-73ab2d6e0f8c	[DEMO] Gasolina operador camioneta	350.00	Carlos SVR	Carlos SVR	2026-11-08	07:13 p.m.	2026-11-08 01:13:42.162-06	2026-11-08 01:13:42.16-06	c0000000-0000-0000-0000-000000000001	\N
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (rol_id, permiso_id, creado_en) FROM stdin;
a0000000-0000-0000-0000-000000000001	aa000001-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000002-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000002-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000002-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000002-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000002-0000-0000-0000-000000000005	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000003-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000003-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000003-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000003-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000004-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000004-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000004-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000004-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000004-0000-0000-0000-000000000005	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000005-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000005-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000005-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000005-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000006-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000006-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000006-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000007-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000007-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000007-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000007-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000008-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000008-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000008-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000008-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000009-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000009-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000a-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000a-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000a-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000a-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000b-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000b-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000b-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000b-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000c-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000c-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000c-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000d-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000d-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000d-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000d-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000d-0000-0000-0000-000000000005	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000e-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000e-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000e-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000e-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000f-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000f-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000f-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00000f-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000010-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000010-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000010-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000010-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000010-0000-0000-0000-000000000005	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000011-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000011-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000011-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000011-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000012-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000012-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000012-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000012-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000013-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000013-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000013-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000013-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000014-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000014-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000014-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000014-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000015-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000015-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000015-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000015-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000016-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000016-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000017-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000017-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000018-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000018-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000018-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000018-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000018-0000-0000-0000-000000000005	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000019-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000019-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000019-0000-0000-0000-000000000003	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa000019-0000-0000-0000-000000000004	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00001a-0000-0000-0000-000000000001	2026-11-03 18:51:00.051-06
a0000000-0000-0000-0000-000000000001	aa00001a-0000-0000-0000-000000000002	2026-11-03 18:51:00.051-06
f0000000-0000-0000-0000-000000000001	aa000001-0000-0000-0000-000000000001	2026-11-03 18:51:00.08-06
f0000000-0000-0000-0000-000000000001	aa000002-0000-0000-0000-000000000001	2026-11-03 18:51:00.08-06
f0000000-0000-0000-0000-000000000001	aa000002-0000-0000-0000-000000000002	2026-11-03 18:51:00.08-06
f0000000-0000-0000-0000-000000000001	aa000002-0000-0000-0000-000000000003	2026-11-03 18:51:00.08-06
f0000000-0000-0000-0000-000000000001	aa000002-0000-0000-0000-000000000004	2026-11-03 18:51:00.08-06
f0000000-0000-0000-0000-000000000001	aa000002-0000-0000-0000-000000000005	2026-11-03 18:51:00.08-06
f0000000-0000-0000-0000-000000000001	aa000003-0000-0000-0000-000000000001	2026-11-03 18:51:00.081-06
f0000000-0000-0000-0000-000000000001	aa000003-0000-0000-0000-000000000002	2026-11-03 18:51:00.081-06
f0000000-0000-0000-0000-000000000001	aa000003-0000-0000-0000-000000000003	2026-11-03 18:51:00.081-06
f0000000-0000-0000-0000-000000000001	aa000003-0000-0000-0000-000000000004	2026-11-03 18:51:00.081-06
f0000000-0000-0000-0000-000000000001	aa000004-0000-0000-0000-000000000001	2026-11-03 18:51:00.081-06
f0000000-0000-0000-0000-000000000001	aa000004-0000-0000-0000-000000000002	2026-11-03 18:51:00.081-06
f0000000-0000-0000-0000-000000000001	aa000004-0000-0000-0000-000000000003	2026-11-03 18:51:00.081-06
f0000000-0000-0000-0000-000000000001	aa000004-0000-0000-0000-000000000004	2026-11-03 18:51:00.081-06
f0000000-0000-0000-0000-000000000001	aa000004-0000-0000-0000-000000000005	2026-11-03 18:51:00.081-06
a0000000-0000-0000-0000-000000000001	aa000007-0000-0000-0000-000000000005	2026-11-03 18:51:00.194-06
a0000000-0000-0000-0000-000000000001	aa000008-0000-0000-0000-000000000005	2026-11-03 18:51:00.194-06
a0000000-0000-0000-0000-000000000001	11bfe0fb-513e-40e7-8307-a87ef3530d0c	2026-11-03 18:51:00.271-06
a0000000-0000-0000-0000-000000000001	276283c0-1f65-41ac-8095-6a493b7e5c71	2026-11-03 18:51:00.272-06
a0000000-0000-0000-0000-000000000001	a9e09d91-65c5-4580-ad5f-1d964b22ffe3	2026-11-03 18:51:00.274-06
a0000000-0000-0000-0000-000000000001	aa00001c-0000-0000-0000-000000000001	2026-11-03 18:53:54.463-06
a0000000-0000-0000-0000-000000000001	aa00001c-0000-0000-0000-000000000002	2026-11-03 18:53:54.463-06
a0000000-0000-0000-0000-000000000001	aa00001c-0000-0000-0000-000000000003	2026-11-03 18:53:54.463-06
a0000000-0000-0000-0000-000000000001	aa00001c-0000-0000-0000-000000000004	2026-11-03 18:53:54.463-06
a0000000-0000-0000-0000-000000000001	aa00001c-0000-0000-0000-000000000005	2026-11-03 18:53:54.463-06
e0000000-0000-0000-0000-0000000000a1	aa000001-0000-0000-0000-000000000001	2026-11-08 18:57:26.5543-06
e0000000-0000-0000-0000-0000000000a1	aa00000b-0000-0000-0000-000000000001	2026-11-08 18:57:26.5543-06
e0000000-0000-0000-0000-0000000000a1	aa00000b-0000-0000-0000-000000000002	2026-11-08 18:57:26.5543-06
e0000000-0000-0000-0000-0000000000a1	aa00000b-0000-0000-0000-000000000003	2026-11-08 18:57:26.5543-06
e0000000-0000-0000-0000-0000000000a1	aa00000b-0000-0000-0000-000000000004	2026-11-08 18:57:26.5543-06
e0000000-0000-0000-0000-0000000000a2	aa000001-0000-0000-0000-000000000001	2026-11-08 18:57:26.5543-06
e0000000-0000-0000-0000-0000000000a2	aa00000b-0000-0000-0000-000000000001	2026-11-08 18:57:26.5543-06
e0000000-0000-0000-0000-0000000000a2	aa00000b-0000-0000-0000-000000000003	2026-11-08 18:57:26.5543-06
e0000000-0000-0000-0000-0000000000a4	aa000001-0000-0000-0000-000000000001	2026-11-08 18:57:26.5543-06
e0000000-0000-0000-0000-0000000000a4	aa00000b-0000-0000-0000-000000000001	2026-11-08 18:57:26.5543-06
e0000000-0000-0000-0000-0000000000a5	aa000001-0000-0000-0000-000000000001	2026-11-08 18:57:26.5543-06
e0000000-0000-0000-0000-0000000000a5	aa00000b-0000-0000-0000-000000000001	2026-11-08 18:57:26.5543-06
e0000000-0000-0000-0000-0000000000a5	aa00000b-0000-0000-0000-000000000002	2026-11-08 18:57:26.5543-06
e0000000-0000-0000-0000-0000000000a4	aa00000c-0000-0000-0000-000000000001	2026-11-08 19:43:45.32749-06
e0000000-0000-0000-0000-0000000000a4	aa000013-0000-0000-0000-000000000002	2026-11-08 19:43:45.32749-06
e0000000-0000-0000-0000-0000000000a4	aa000013-0000-0000-0000-000000000001	2026-11-08 19:43:45.32749-06
e0000000-0000-0000-0000-0000000000a4	aa00000b-0000-0000-0000-000000000002	2026-11-08 22:51:45.916996-06
e0000000-0000-0000-0000-0000000000b4	aa000001-0000-0000-0000-000000000001	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b3	aa00000b-0000-0000-0000-000000000001	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b3	aa00000b-0000-0000-0000-000000000003	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b4	aa00000b-0000-0000-0000-000000000003	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b1	aa00000b-0000-0000-0000-000000000002	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b3	aa000001-0000-0000-0000-000000000001	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b2	aa00000b-0000-0000-0000-000000000002	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b4	aa00000b-0000-0000-0000-000000000001	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b2	aa00000b-0000-0000-0000-000000000003	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b1	aa00000b-0000-0000-0000-000000000001	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b4	aa00000b-0000-0000-0000-000000000002	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b1	aa00000b-0000-0000-0000-000000000003	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b2	aa00000b-0000-0000-0000-000000000001	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b3	aa00000b-0000-0000-0000-000000000002	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b2	aa000001-0000-0000-0000-000000000001	2026-11-09 00:08:59.287035-06
e0000000-0000-0000-0000-0000000000b1	aa000001-0000-0000-0000-000000000001	2026-11-09 00:08:59.287035-06
82eb4e1b-8676-48b2-a42d-236707587af5	aa000001-0000-0000-0000-000000000001	2026-11-11 23:40:58.034756-06
82eb4e1b-8676-48b2-a42d-236707587af5	aa00000b-0000-0000-0000-000000000001	2026-11-11 23:40:58.034756-06
82eb4e1b-8676-48b2-a42d-236707587af5	aa00000b-0000-0000-0000-000000000002	2026-11-11 23:40:58.034756-06
82eb4e1b-8676-48b2-a42d-236707587af5	aa00000b-0000-0000-0000-000000000003	2026-11-11 23:40:58.034756-06
e0000000-0000-0000-0000-0000000000a1	aa000002-0000-0000-0000-000000000001	2026-11-11 23:40:58.062677-06
e0000000-0000-0000-0000-0000000000a1	aa000002-0000-0000-0000-000000000002	2026-11-11 23:40:58.062677-06
e0000000-0000-0000-0000-0000000000a1	aa000002-0000-0000-0000-000000000003	2026-11-11 23:40:58.062677-06
e0000000-0000-0000-0000-0000000000a1	aa000002-0000-0000-0000-000000000004	2026-11-11 23:40:58.062677-06
e0000000-0000-0000-0000-0000000000a1	aa000002-0000-0000-0000-000000000005	2026-11-11 23:40:58.062677-06
e0000000-0000-0000-0000-0000000000a1	aa000003-0000-0000-0000-000000000001	2026-11-11 23:40:58.062677-06
e0000000-0000-0000-0000-0000000000a1	aa000003-0000-0000-0000-000000000002	2026-11-11 23:40:58.062677-06
e0000000-0000-0000-0000-0000000000a1	aa000003-0000-0000-0000-000000000003	2026-11-11 23:40:58.062677-06
e0000000-0000-0000-0000-0000000000a1	aa000003-0000-0000-0000-000000000004	2026-11-11 23:40:58.062677-06
e0000000-0000-0000-0000-0000000000a1	aa000004-0000-0000-0000-000000000001	2026-11-11 23:40:58.062677-06
e0000000-0000-0000-0000-0000000000a1	aa000004-0000-0000-0000-000000000002	2026-11-11 23:40:58.062677-06
e0000000-0000-0000-0000-0000000000a1	aa000004-0000-0000-0000-000000000003	2026-11-11 23:40:58.062677-06
e0000000-0000-0000-0000-0000000000a1	aa000004-0000-0000-0000-000000000004	2026-11-11 23:40:58.062677-06
e0000000-0000-0000-0000-0000000000a1	aa000004-0000-0000-0000-000000000005	2026-11-11 23:40:58.062677-06
e0000000-0000-0000-0000-0000000000a1	aa00001d-0000-0000-0000-000000000001	2026-11-13 14:27:08.102315-06
e0000000-0000-0000-0000-0000000000a5	aa00001d-0000-0000-0000-000000000001	2026-11-13 14:27:08.102315-06
a0000000-0000-0000-0000-000000000001	aa00001d-0000-0000-0000-000000000001	2026-11-13 14:27:08.102315-06
e0000000-0000-0000-0000-0000000000a2	aa00001d-0000-0000-0000-000000000001	2026-11-13 14:27:08.102315-06
82eb4e1b-8676-48b2-a42d-236707587af5	aa00001d-0000-0000-0000-000000000001	2026-11-13 14:27:08.102315-06
e0000000-0000-0000-0000-0000000000a4	aa00001d-0000-0000-0000-000000000001	2026-11-13 14:27:08.102315-06
95d8a0e3-32f5-4fcd-9e4c-f08d9c1ba27b	aa00000c-0000-0000-0000-000000000001	2026-11-14 17:39:14.071-06
\.


--
-- Data for Name: role_vistas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, asignado_en, asignado_por, activo) FROM stdin;
b59e7782-912d-48d2-9a01-c1de75d8e96d	a0000000-0000-0000-0000-000000000001	bb000001-0000-0000-0000-000000000001	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
cf415373-a252-41cf-af40-059010fe48c2	a0000000-0000-0000-0000-000000000001	bb000002-0000-0000-0000-000000000001	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
73a89821-f017-493d-9adf-bf3057d6e451	a0000000-0000-0000-0000-000000000001	bb000002-0000-0000-0000-000000000002	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
bd173cd4-6e93-4782-8df4-a096814b95e7	a0000000-0000-0000-0000-000000000001	bb000002-0000-0000-0000-000000000003	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
bf19a63d-659b-409f-b8f4-f14402f4d62f	a0000000-0000-0000-0000-000000000001	bb000003-0000-0000-0000-000000000001	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
218eab9d-ae2c-40c6-b84a-3cf38be357f3	a0000000-0000-0000-0000-000000000001	bb000003-0000-0000-0000-000000000002	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
34e6caca-769c-48c9-8a61-6724720ccb3d	a0000000-0000-0000-0000-000000000001	bb000003-0000-0000-0000-000000000003	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
fd5e2f97-dcf6-47e6-9532-e2f6dcf4fb9d	a0000000-0000-0000-0000-000000000001	bb000003-0000-0000-0000-000000000004	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
e387ea63-9cdc-49ed-83dd-9d99eacfaa14	a0000000-0000-0000-0000-000000000001	bb000003-0000-0000-0000-000000000005	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
d340b898-1b7b-4915-ad59-3b9ec0d0cb6f	a0000000-0000-0000-0000-000000000001	bb000004-0000-0000-0000-000000000001	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
24a0b48d-47a0-4ede-8a1d-c97778b41c6d	a0000000-0000-0000-0000-000000000001	bb000004-0000-0000-0000-000000000003	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
d2c778fe-9df1-42b2-abf0-ce30d335737c	a0000000-0000-0000-0000-000000000001	bb000004-0000-0000-0000-000000000004	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
9839322f-6e0f-4fd1-b14c-e0043a2fc60e	a0000000-0000-0000-0000-000000000001	bb000004-0000-0000-0000-000000000005	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
29d7ba88-a035-4c70-a858-bb4b06a55008	a0000000-0000-0000-0000-000000000001	bb000005-0000-0000-0000-000000000001	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
bec242fa-0658-4ad1-aaf1-719bdee80d12	a0000000-0000-0000-0000-000000000001	bb000005-0000-0000-0000-000000000002	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
41e2e306-6541-4072-916f-9f62363b96cb	a0000000-0000-0000-0000-000000000001	bb000005-0000-0000-0000-000000000003	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
158ba03e-cd23-4e3c-ad3a-a36eb1f1623e	a0000000-0000-0000-0000-000000000001	bb000005-0000-0000-0000-000000000004	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
9efdc437-dfc4-4535-a18f-764a90d5f359	a0000000-0000-0000-0000-000000000001	bb000005-0000-0000-0000-000000000005	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
0e418982-c621-4ae5-bc73-9f10dbcdbd26	a0000000-0000-0000-0000-000000000001	bb000005-0000-0000-0000-000000000006	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
a5b808c0-e434-41ea-a5a4-35417cbd7124	a0000000-0000-0000-0000-000000000001	bb000006-0000-0000-0000-000000000001	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
81832b82-ead7-404c-94f0-7fb331c877d1	a0000000-0000-0000-0000-000000000001	bb000006-0000-0000-0000-000000000002	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
0b5d5bec-7528-471a-bf96-4d04641711f3	a0000000-0000-0000-0000-000000000001	bb000006-0000-0000-0000-000000000004	t	t	t	t	t	2026-11-03 18:51:00.065-06	\N	t
f0000000-0000-0000-0000-000000000040	f0000000-0000-0000-0000-000000000001	bb000001-0000-0000-0000-000000000001	t	f	f	f	f	2026-11-03 18:51:00.082-06	\N	t
f0000000-0000-0000-0000-000000000041	f0000000-0000-0000-0000-000000000001	bb000002-0000-0000-0000-000000000001	t	t	t	t	t	2026-11-03 18:51:00.083-06	\N	t
f0000000-0000-0000-0000-000000000042	f0000000-0000-0000-0000-000000000001	bb000002-0000-0000-0000-000000000002	t	t	t	f	t	2026-11-03 18:51:00.083-06	\N	t
f0000000-0000-0000-0000-000000000043	f0000000-0000-0000-0000-000000000001	bb000002-0000-0000-0000-000000000003	t	t	t	f	t	2026-11-03 18:51:00.084-06	\N	t
60bfd2cb-c2af-48a0-af67-ca27ff25b6b9	a0000000-0000-0000-0000-000000000001	bb000005-0000-0000-0000-000000000007	t	t	t	t	t	2026-11-03 18:53:53.962-06	\N	t
cdfc84e3-b26b-4452-a658-841eb195bbce	a0000000-0000-0000-0000-000000000001	bb000005-0000-0000-0000-000000000008	t	t	t	t	t	2026-11-03 18:53:54.479-06	\N	t
c4dde432-f3da-48b9-8868-1e55f8605a32	e0000000-0000-0000-0000-0000000000b3	bb000001-0000-0000-0000-000000000001	t	t	t	f	f	2026-11-09 00:08:59.294101-06	\N	t
f927661c-faaa-4029-b0a6-7f31b8138142	e0000000-0000-0000-0000-0000000000b3	bb000006-0000-0000-0000-000000000002	t	t	t	f	f	2026-11-09 00:08:59.294101-06	\N	t
cfa47a92-fa18-4f71-b266-1d6e69fc5371	e0000000-0000-0000-0000-0000000000a1	bb000001-0000-0000-0000-000000000001	t	f	f	f	f	2026-11-08 18:57:26.5543-06	\N	t
07e42fdf-3112-4e96-8c21-1f8edf7432d7	e0000000-0000-0000-0000-0000000000a4	bb000001-0000-0000-0000-000000000001	t	f	f	f	f	2026-11-08 18:57:26.5543-06	\N	t
ab546cb8-31e4-4dbb-8f65-3e2f200109e1	e0000000-0000-0000-0000-0000000000a5	bb000001-0000-0000-0000-000000000001	t	f	f	f	f	2026-11-08 18:57:26.5543-06	\N	t
6abb4927-07cc-4adf-92e2-adb7ea31b2b6	e0000000-0000-0000-0000-0000000000a5	bb000006-0000-0000-0000-000000000002	t	t	f	f	f	2026-11-08 18:57:26.5543-06	\N	t
07eeb90f-c456-49ed-aeb1-45ac26dea0ec	e0000000-0000-0000-0000-0000000000a4	bb000005-0000-0000-0000-000000000007	t	f	f	f	f	2026-11-08 19:42:50.579747-06	\N	t
5aa112b0-edce-4389-a87b-441d375e6018	e0000000-0000-0000-0000-0000000000a4	bb000005-0000-0000-0000-000000000005	t	f	f	f	f	2026-11-08 19:42:50.579747-06	\N	t
535bd054-bfca-428d-916f-ceff60a280ba	e0000000-0000-0000-0000-0000000000a4	bb000004-0000-0000-0000-000000000003	t	f	f	f	f	2026-11-08 19:42:50.579747-06	\N	t
b57ec00a-bfbe-4f87-9a11-2f5d36bb93f2	e0000000-0000-0000-0000-0000000000a4	bb000006-0000-0000-0000-000000000002	t	t	f	f	f	2026-11-08 18:57:26.5543-06	\N	t
a8d6ef5a-24d6-4bfb-a386-86edc455ec3f	e0000000-0000-0000-0000-0000000000b4	bb000001-0000-0000-0000-000000000001	t	t	t	f	f	2026-11-09 00:08:59.294101-06	\N	t
dadad0d6-4206-412f-8801-fd27eb4f98fd	e0000000-0000-0000-0000-0000000000b4	bb000006-0000-0000-0000-000000000002	t	t	t	f	f	2026-11-09 00:08:59.294101-06	\N	t
06349f56-14ea-4d16-8f4e-9c043ff228f1	e0000000-0000-0000-0000-0000000000b2	bb000006-0000-0000-0000-000000000002	t	t	t	f	f	2026-11-09 00:08:59.294101-06	\N	t
9e2cc3ce-4f9b-4ad4-8217-6123ebe05b51	e0000000-0000-0000-0000-0000000000b2	bb000001-0000-0000-0000-000000000001	t	t	t	f	f	2026-11-09 00:08:59.294101-06	\N	t
a40271d7-c669-439d-a933-b05d271a130d	e0000000-0000-0000-0000-0000000000b1	bb000001-0000-0000-0000-000000000001	t	t	t	f	f	2026-11-09 00:08:59.294101-06	\N	t
49faf64a-4b2f-4399-820b-4b28d7d54a54	e0000000-0000-0000-0000-0000000000b1	bb000006-0000-0000-0000-000000000002	t	t	t	f	f	2026-11-09 00:08:59.294101-06	\N	t
8bba31a4-74b0-4185-9768-5fe599d67d2a	e0000000-0000-0000-0000-0000000000a5	90000000-0000-0000-0000-000000000001	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
37bc9289-7d07-4925-8c5b-a8439baef2f0	e0000000-0000-0000-0000-0000000000a5	90000000-0000-0000-0000-000000000002	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
52033c0f-9f29-47a4-b63b-d6d82b41b230	e0000000-0000-0000-0000-0000000000a5	90000000-0000-0000-0000-000000000003	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
1df64a2b-29b7-4655-910f-ff3aeafe4406	e0000000-0000-0000-0000-0000000000a5	90000000-0000-0000-0000-000000000004	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
68acc9c1-46ff-4573-805a-776240f2aae1	e0000000-0000-0000-0000-0000000000a5	90000000-0000-0000-0000-000000000005	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
507600a3-837f-4c17-985c-0fcd6715110a	e0000000-0000-0000-0000-0000000000b1	90000000-0000-0000-0000-000000000001	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
cb26c3e3-40f9-4324-8ec3-d68b77e20aa5	e0000000-0000-0000-0000-0000000000b1	90000000-0000-0000-0000-000000000002	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
bdcfc3a1-eae5-47ca-820c-c15c42820ecd	e0000000-0000-0000-0000-0000000000b1	90000000-0000-0000-0000-000000000003	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
b8024a92-a446-4eb3-b6b3-1d4fba1cdb5f	e0000000-0000-0000-0000-0000000000b1	90000000-0000-0000-0000-000000000007	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
7924279e-d54a-4c80-9462-ec462be5dd50	e0000000-0000-0000-0000-0000000000b1	90000000-0000-0000-0000-000000000008	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
e516d310-ee14-4387-83ed-4460ac37db38	e0000000-0000-0000-0000-0000000000b2	90000000-0000-0000-0000-000000000001	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
11bd01f4-1c37-4205-afbe-59ccc66be394	e0000000-0000-0000-0000-0000000000b2	90000000-0000-0000-0000-000000000002	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
504c669a-6c35-4ada-b4f0-cb8ad155791d	e0000000-0000-0000-0000-0000000000b2	90000000-0000-0000-0000-000000000003	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
2105205b-9c32-4086-9251-03febc3caaa7	e0000000-0000-0000-0000-0000000000b2	90000000-0000-0000-0000-000000000007	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
9f92916b-8988-4696-9399-47f5be49a7ac	e0000000-0000-0000-0000-0000000000b2	90000000-0000-0000-0000-000000000008	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
7b4c2124-e2d5-4834-9eb8-c239c6a58340	e0000000-0000-0000-0000-0000000000b3	90000000-0000-0000-0000-000000000001	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
10419b3b-8d8b-4ac0-81cb-463d4f3d5e41	e0000000-0000-0000-0000-0000000000b3	90000000-0000-0000-0000-000000000002	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
fa377079-e691-4270-8ec2-e890261d0266	e0000000-0000-0000-0000-0000000000b3	90000000-0000-0000-0000-000000000003	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
20c8f0c1-09b4-4920-9998-9cbd9b68f29a	e0000000-0000-0000-0000-0000000000b3	90000000-0000-0000-0000-000000000007	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
e6589c24-a032-4141-a2d5-4834367888c6	e0000000-0000-0000-0000-0000000000b3	90000000-0000-0000-0000-000000000008	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
24cb96b6-f6dc-4887-b483-d376968f7d2f	e0000000-0000-0000-0000-0000000000b3	90000000-0000-0000-0000-000000000009	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
27bd5a1c-609d-49c8-9ab2-769b5477dc04	e0000000-0000-0000-0000-0000000000b4	90000000-0000-0000-0000-000000000001	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
62830825-bf38-41fb-b833-d0f80f58b3b6	e0000000-0000-0000-0000-0000000000b4	90000000-0000-0000-0000-000000000002	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
daedcaaf-298b-4746-a99f-715d7e9a4842	e0000000-0000-0000-0000-0000000000b4	90000000-0000-0000-0000-000000000003	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
c2c1ab22-8d50-4929-a4c6-f7074f46742e	e0000000-0000-0000-0000-0000000000b4	90000000-0000-0000-0000-000000000007	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
1b9b5c5f-16de-49a4-b09f-45c5a2aa7b20	e0000000-0000-0000-0000-0000000000b4	90000000-0000-0000-0000-000000000008	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
b4ade027-3874-4150-a794-23fb4ef5d941	e0000000-0000-0000-0000-0000000000a4	90000000-0000-0000-0000-000000000001	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
04e9e818-06a6-43c9-8efd-c874cf4f0f11	e0000000-0000-0000-0000-0000000000a4	90000000-0000-0000-0000-000000000002	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
99808d10-0a2a-497e-9279-b6f632cf9946	e0000000-0000-0000-0000-0000000000a4	90000000-0000-0000-0000-000000000010	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
edcd9daa-39d2-4aa7-bcfe-120b2be8e150	e0000000-0000-0000-0000-0000000000a4	90000000-0000-0000-0000-000000000011	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
117cef11-fc7c-4def-839f-2e9b245cb712	a0000000-0000-0000-0000-000000000001	90000000-0000-0000-0000-000000000001	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
6e293010-d22a-40c6-804c-8a8c89fce228	a0000000-0000-0000-0000-000000000001	90000000-0000-0000-0000-000000000003	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
431b9530-5b75-4eee-bfce-8179fefb8818	a0000000-0000-0000-0000-000000000001	90000000-0000-0000-0000-000000000012	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
e25fb3e7-7d8c-4d23-8689-3582f0a815b8	a0000000-0000-0000-0000-000000000001	90000000-0000-0000-0000-000000000013	t	f	f	f	f	2026-11-10 20:25:24.23425-06	\N	t
6b0d18ad-b7ce-4d48-afd9-9dc1f220111c	82eb4e1b-8676-48b2-a42d-236707587af5	90000000-0000-0000-0000-000000000003	t	f	f	f	f	2026-11-11 23:40:58.092091-06	\N	t
04130bc7-0b0e-4785-a2ad-59ed4b5ede1e	82eb4e1b-8676-48b2-a42d-236707587af5	90000000-0000-0000-0000-000000000009	t	f	f	f	f	2026-11-11 23:40:58.092091-06	\N	t
3fc67ef7-6ec4-4fe9-89c9-b06cdffaae19	82eb4e1b-8676-48b2-a42d-236707587af5	90000000-0000-0000-0000-000000000002	t	f	f	f	f	2026-11-11 23:40:58.092091-06	\N	t
b6f39aa4-a0c9-4769-94de-e4e55107c64c	82eb4e1b-8676-48b2-a42d-236707587af5	90000000-0000-0000-0000-000000000008	t	f	f	f	f	2026-11-11 23:40:58.092091-06	\N	t
0b41dff7-2d58-4193-9a10-88b951d3c0d2	82eb4e1b-8676-48b2-a42d-236707587af5	90000000-0000-0000-0000-000000000007	t	f	f	f	f	2026-11-11 23:40:58.092091-06	\N	t
a677a65c-ca54-48ab-b729-90613bf58727	82eb4e1b-8676-48b2-a42d-236707587af5	bb000006-0000-0000-0000-000000000002	t	t	t	f	f	2026-11-11 23:40:58.092091-06	\N	t
7fc7537b-3461-4fad-98c1-326be0ff0923	82eb4e1b-8676-48b2-a42d-236707587af5	bb000001-0000-0000-0000-000000000001	t	t	t	f	f	2026-11-11 23:40:58.092091-06	\N	t
b0dc42e8-59ae-43d4-ab61-f3e255410646	82eb4e1b-8676-48b2-a42d-236707587af5	90000000-0000-0000-0000-000000000001	t	f	f	f	f	2026-11-11 23:40:58.092091-06	\N	t
bdafe93e-0cab-4f84-90f3-ed2beab0349b	e0000000-0000-0000-0000-0000000000a1	bb000002-0000-0000-0000-000000000001	t	t	t	t	t	2026-11-11 23:40:58.275474-06	\N	t
6d36df2e-55aa-466a-88c8-ba2922dcd959	e0000000-0000-0000-0000-0000000000a1	bb000002-0000-0000-0000-000000000002	t	t	t	f	t	2026-11-11 23:40:58.275474-06	\N	t
019cca14-a931-4f50-986f-fe73ae94d396	e0000000-0000-0000-0000-0000000000a1	bb000002-0000-0000-0000-000000000003	t	t	t	f	t	2026-11-11 23:40:58.275474-06	\N	t
95a4cd88-e218-49c5-bdc6-f9112fe603ba	e0000000-0000-0000-0000-0000000000a1	bb000006-0000-0000-0000-000000000002	t	t	t	f	t	2026-11-08 18:57:26.5543-06	\N	t
bb700006-0000-0000-0000-000000000005	a0000000-0000-0000-0000-000000000001	bb000006-0000-0000-0000-000000000005	t	t	t	t	f	2026-11-14 01:23:19.386983-06	\N	t
bb700006-0000-0000-0000-000000000006	a0000000-0000-0000-0000-000000000001	bb000006-0000-0000-0000-000000000006	t	f	t	f	f	2026-11-14 01:55:07.470101-06	\N	t
bb700006-0000-0000-0000-000000000007	a0000000-0000-0000-0000-000000000001	bb000006-0000-0000-0000-000000000007	t	t	t	t	f	2026-11-14 11:16:35.955265-06	\N	t
5d48edd8-50ad-4895-98c9-9c8e1611bca5	95d8a0e3-32f5-4fcd-9e4c-f08d9c1ba27b	bb000001-0000-0000-0000-000000000001	t	t	f	f	f	2026-11-14 17:39:13.951-06	c0000000-0000-0000-0000-000000000001	t
ffd345af-37f2-4e84-8d28-cd2081c97e81	e0000000-0000-0000-0000-0000000000a2	bb000001-0000-0000-0000-000000000001	t	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
4a892d97-09e4-4653-8967-857f51aeff4f	e0000000-0000-0000-0000-0000000000a2	bb000002-0000-0000-0000-000000000001	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
e503a51c-4f65-4819-86d4-897dfd9c17e6	e0000000-0000-0000-0000-0000000000a2	bb000002-0000-0000-0000-000000000002	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
e6585334-fb7b-4242-8703-31314ae5b178	e0000000-0000-0000-0000-0000000000a2	bb000002-0000-0000-0000-000000000003	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
15da899e-b41b-4941-a6ec-a27ca27dab54	e0000000-0000-0000-0000-0000000000a2	bb000003-0000-0000-0000-000000000001	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
9c2a9893-17d1-48e4-97d4-304b6205c598	e0000000-0000-0000-0000-0000000000a2	bb000003-0000-0000-0000-000000000002	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
62dd7906-67ed-44c9-8da3-bc6f5805ad47	e0000000-0000-0000-0000-0000000000a2	bb000003-0000-0000-0000-000000000003	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
825cb5e4-3c5a-4dd1-a027-5614ddd73a90	e0000000-0000-0000-0000-0000000000a2	bb000003-0000-0000-0000-000000000004	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
6915159d-171b-4c9a-b628-f4ccf583154c	e0000000-0000-0000-0000-0000000000a2	bb000003-0000-0000-0000-000000000005	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
4918bdbf-8bcd-41e4-ad6e-d8b499e4b95e	e0000000-0000-0000-0000-0000000000a2	bb000006-0000-0000-0000-000000000002	t	f	t	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
4cd112bc-d357-4d96-9fec-5b0cdc28e04a	e0000000-0000-0000-0000-0000000000a2	bb000004-0000-0000-0000-000000000001	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
7dae50b6-f1a0-4bb3-9022-345a4cdddef8	e0000000-0000-0000-0000-0000000000a2	bb000004-0000-0000-0000-000000000003	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
2757fa73-b4e7-4469-992e-d69506408658	e0000000-0000-0000-0000-0000000000a2	bb000004-0000-0000-0000-000000000004	t	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
6da6ba68-7f03-4b75-9b67-8906e15eac87	e0000000-0000-0000-0000-0000000000a2	bb000004-0000-0000-0000-000000000005	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
3808cb8e-b898-4e5b-b950-f1464440dd70	e0000000-0000-0000-0000-0000000000a2	bb000005-0000-0000-0000-000000000001	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
53b70726-beef-4e6b-84a9-4fc6230cde7a	e0000000-0000-0000-0000-0000000000a2	bb000005-0000-0000-0000-000000000002	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
42360aa7-56ef-433a-b56e-04f99d269423	e0000000-0000-0000-0000-0000000000a2	bb000005-0000-0000-0000-000000000003	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
ad06a36d-37d8-4410-86a3-1a4a84e7d4a3	e0000000-0000-0000-0000-0000000000a2	bb000005-0000-0000-0000-000000000004	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
cf5ff6ed-277f-4aea-8fdd-e9b71a069f05	e0000000-0000-0000-0000-0000000000a2	bb000005-0000-0000-0000-000000000005	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
234ffa42-573c-4f44-af6f-f23ad48a4c3e	e0000000-0000-0000-0000-0000000000a2	bb000005-0000-0000-0000-000000000006	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
b3b64b2e-1414-4ebb-82c6-0db57d202de0	e0000000-0000-0000-0000-0000000000a2	bb000005-0000-0000-0000-000000000007	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
26ca131b-2c96-48b8-a5e1-22e1f05d1f49	e0000000-0000-0000-0000-0000000000a2	bb000005-0000-0000-0000-000000000008	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
a7512c5a-28e5-46a0-839e-ae2c96e61009	e0000000-0000-0000-0000-0000000000a2	bb000006-0000-0000-0000-000000000001	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
d5b2e877-51ec-49cb-9f0b-15394a3734bd	e0000000-0000-0000-0000-0000000000a2	bb000006-0000-0000-0000-000000000005	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
9a0261af-df74-4fa3-9bd5-17a70a2888c2	e0000000-0000-0000-0000-0000000000a2	bb000006-0000-0000-0000-000000000006	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
a1b89c98-cabc-4dcf-907e-61387a2d8171	e0000000-0000-0000-0000-0000000000a2	bb000006-0000-0000-0000-000000000004	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
ee8421c2-f0fc-4e1b-9859-34f084a5fb10	e0000000-0000-0000-0000-0000000000a2	bb000006-0000-0000-0000-000000000007	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
656f09e2-257e-41f6-92a8-9d156293fa84	e0000000-0000-0000-0000-0000000000a2	90000000-0000-0000-0000-000000000001	t	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
6bd2bb36-abe0-4933-a8fb-2e0a5ee3321e	e0000000-0000-0000-0000-0000000000a2	90000000-0000-0000-0000-000000000002	t	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
2918f0b1-e1dc-4c52-b7f6-1100769fd50f	e0000000-0000-0000-0000-0000000000a2	90000000-0000-0000-0000-000000000003	t	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
5367b566-0d82-4881-bd0b-278f00141c30	e0000000-0000-0000-0000-0000000000a2	90000000-0000-0000-0000-000000000004	t	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
3391d6cc-d92b-4566-aba1-948b94d32a9a	e0000000-0000-0000-0000-0000000000a2	90000000-0000-0000-0000-000000000005	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
018c1126-ef5c-41dc-b042-7487ce269259	e0000000-0000-0000-0000-0000000000a2	90000000-0000-0000-0000-000000000006	t	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
252a5ac3-e6a1-4fbd-a8ab-1775ed056f80	e0000000-0000-0000-0000-0000000000a2	90000000-0000-0000-0000-000000000007	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
c51dabe5-24f8-4ad3-8065-fe204b5606e0	e0000000-0000-0000-0000-0000000000a2	90000000-0000-0000-0000-000000000008	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
516d424b-5f71-48ba-8555-2e7bb31bc152	e0000000-0000-0000-0000-0000000000a2	90000000-0000-0000-0000-000000000009	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
aa0ddc08-6b53-498f-bc8f-d8b2ca201de3	e0000000-0000-0000-0000-0000000000a2	90000000-0000-0000-0000-000000000010	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
ad98e1ea-25af-46d7-86e9-eca75568fea2	e0000000-0000-0000-0000-0000000000a2	90000000-0000-0000-0000-000000000011	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
c5e43813-6903-47dc-93e3-73a93b154fc6	e0000000-0000-0000-0000-0000000000a2	90000000-0000-0000-0000-000000000012	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
e163ec7f-b2a7-45ea-afa9-427a5155fb24	e0000000-0000-0000-0000-0000000000a2	90000000-0000-0000-0000-000000000013	f	f	f	f	f	2026-11-15 07:34:07.706-06	c0000000-0000-0000-0000-000000000001	t
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, nombre, descripcion, nivel, es_sistema, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en, torre) FROM stdin;
95d8a0e3-32f5-4fcd-9e4c-f08d9c1ba27b	F3 Smoke	smoke fase 3	50	f	f	2026-11-14 17:39:13.871-06	2026-11-14 11:39:14.523627-06	c0000000-0000-0000-0000-000000000001	\N	2026-11-14 17:39:14.521-06	\N
a0000000-0000-0000-0000-000000000001	Administrador	Acceso total al sistema.	100	t	t	2026-11-03 18:51:00.004-06	2026-11-08 18:57:26.5543-06	\N	\N	\N	ADMINISTRATIVO
e0000000-0000-0000-0000-0000000000a1	Administrativo	Jefes y personas en oficina	80	f	t	2026-11-08 18:57:26.5543-06	2026-11-08 18:57:26.5543-06	\N	\N	\N	ADMINISTRATIVO
e0000000-0000-0000-0000-0000000000a2	Residente	Ingenieros encargados de obra	90	f	t	2026-11-08 18:57:26.5543-06	2026-11-08 18:57:26.5543-06	\N	\N	\N	RESIDENTE
e0000000-0000-0000-0000-0000000000a4	Cobrador	Cobro de criba y punto de venta	60	f	t	2026-11-08 18:57:26.5543-06	2026-11-08 18:57:26.5543-06	\N	\N	\N	ADMINISTRATIVO
e0000000-0000-0000-0000-0000000000a5	Trabajador	Operadores, choferes y demás personal de campo	20	f	t	2026-11-08 18:57:26.5543-06	2026-11-08 18:57:26.5543-06	\N	\N	\N	\N
82eb4e1b-8676-48b2-a42d-236707587af5	Tecnico	\N	70	f	t	2026-11-11 23:39:59.18665-06	2026-11-11 23:39:59.18665-06	\N	\N	\N	\N
f0000000-0000-0000-0000-000000000001	Encargado de RRHH	Gestión de trabajadores, asistencia y nómina. Sin acceso a otros módulos.	30	f	f	2026-11-03 18:51:00.077-06	2026-11-11 23:40:58.386882-06	\N	\N	2026-11-11 23:40:58.386882-06	ADMINISTRATIVO
e0000000-0000-0000-0000-0000000000b1	Tecnico Mecanico	Tecnico mecanico de flota	70	f	f	2026-11-09 00:08:59.282736-06	2026-11-11 23:40:58.386882-06	\N	\N	2026-11-11 23:40:58.386882-06	MECANICO
e0000000-0000-0000-0000-0000000000b2	Tecnico Soldador	Tecnico soldador	70	f	f	2026-11-09 00:08:59.282736-06	2026-11-11 23:40:58.386882-06	\N	\N	2026-11-11 23:40:58.386882-06	SOLDADOR
e0000000-0000-0000-0000-0000000000b3	Tecnico Diesel	Tecnico de diesel (suministro/reparto)	70	f	f	2026-11-09 00:08:59.282736-06	2026-11-11 23:40:58.386882-06	\N	\N	2026-11-11 23:40:58.386882-06	DIESEL
e0000000-0000-0000-0000-0000000000b4	Tecnico Mantenimiento	Tecnico de mantenimiento general	70	f	f	2026-11-09 00:08:59.282736-06	2026-11-11 23:40:58.386882-06	\N	\N	2026-11-11 23:40:58.386882-06	MANTENIMIENTO
\.


--
-- Data for Name: subcategorias_reporte; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subcategorias_reporte (id, categoria, nombre, activo, creado_en, actualizado_en) FROM stdin;
28e99e7c-9466-4e00-bd71-47514a572721	DIESEL	150 litros de diésel	t	2026-11-08 16:13:21.309742-06	2026-11-08 16:13:21.309742-06
f6a82849-0b10-48ab-99eb-02ec9ef14a57	ADMINISTRATIVO	Cubeta de aceite	t	2026-11-08 16:13:21.309742-06	2026-11-08 16:13:21.309742-06
169c6d14-edd3-4efb-b97d-e0ae4f8dd3a5	MECANICO	Cambio de refacción	t	2026-11-08 16:13:21.309742-06	2026-11-08 16:13:21.309742-06
fe9754ea-7cf3-4938-834c-1f705c7b8010	MECANICO	Servicio preventivo	t	2026-11-08 16:13:21.309742-06	2026-11-08 16:13:21.309742-06
1657a369-378b-4357-9576-34425b7299e6	SOLDADOR	Soldadura de pieza	t	2026-11-08 16:13:21.309742-06	2026-11-08 16:13:21.309742-06
9fd2e2f1-3a2a-4e32-8eb9-1f662a93aab3	SOLDADOR	Fabricación de estructura	t	2026-11-08 16:13:21.309742-06	2026-11-08 16:13:21.309742-06
10d30443-90d3-425e-8f40-c45e58b257f0	MANTENIMIENTO	Reparación de luminaria	t	2026-11-08 16:13:21.309742-06	2026-11-08 16:13:21.309742-06
68b6c59d-c2c6-44c6-8268-8369196b9d10	MANTENIMIENTO	Instalación hidrosanitaria	t	2026-11-08 16:13:21.309742-06	2026-11-08 16:13:21.309742-06
3f6f64eb-0723-451d-accf-a55f15ace284	RESIDENTE	Supervisión de obra	t	2026-11-08 16:13:21.309742-06	2026-11-08 16:13:21.309742-06
\.


--
-- Data for Name: tipos_maquina; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipos_maquina (id, nombre, descripcion, activo, creado_en, actualizado_en) FROM stdin;
ee7d04d7-e77a-4875-b179-94a921fc5261	Excavadora	\N	t	2026-08-21 02:14:58.923-06	2026-08-21 02:14:58.923-06
c1d7c6fb-3644-443e-a61f-fac9ac1f04ca	Retroexcavadora	\N	t	2026-08-21 02:14:58.928-06	2026-08-21 02:14:58.928-06
f3b26935-7ef1-4105-a890-0c9fa6be4212	Grúa	\N	t	2026-08-21 02:14:58.929-06	2026-08-21 02:14:58.929-06
f0b44546-5e25-40ab-aea8-ad2fa5482c26	Transporte	\N	t	2026-08-21 02:14:58.929-06	2026-08-21 02:14:58.929-06
\.


--
-- Data for Name: trabajadores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trabajadores (id, codigo, nombre, puesto, estado, telefono, avatar, sueldo_fiscal, sueldo_efectivo, metodo_pago, estado_renta, cliente_renta_actual_id, fecha_contratacion, vacaciones_dias, horas_extra_semana, tarifa_hora_extra, descuentos_semana, concepto_descuento, activo, creado_en, actualizado_en, actualizado_por, categoria_puesto_id, creado_por, eliminado_en, entrada, usuario_id) FROM stdin;
ea344f07-0905-4881-a64b-b7315f0bfe97	T002	Pedro Gómez	Operador de Retroexcavadora	ACTIVO	55 8765 4321	PG	2200.00	3200.00	MIXTO	RENTADO_CLIENTE	3a05641a-c5eb-4676-8ec3-720b3e2d7ba1	2023-07-01	6	4.50	75.00	0.00	\N	t	2026-08-21 02:14:58.984-06	2026-08-21 02:14:58.984-06	\N	923aa0cd-8e76-43e6-95a9-3be3c96ca14e	\N	\N	07:00:00	\N
f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	T003	Ana Martínez	Administradora de Obra	ACTIVO	55 2345 6789	AM	5000.00	2000.00	MIXTO	EN_OBRA_PROPIA	\N	2022-01-10	12	0.00	0.00	0.00	\N	t	2026-08-21 02:14:58.989-06	2026-08-21 02:14:58.989-06	\N	e71fb890-67e3-4e62-8cc1-b5170a4f0606	\N	\N	08:30:00	\N
fe2ec7b7-7fda-4c09-af19-279f41215d06	T004	Luis Torres	Chofer de Camión Volteo	ACTIVO	55 3456 7890	LT	2000.00	2800.00	MIXTO	RENTADO_CLIENTE	cc2f4d26-2ef8-4579-8ca6-6a8e5006daae	2023-11-20	6	0.00	65.00	0.00	\N	t	2026-08-21 02:14:58.993-06	2026-08-21 02:14:58.993-06	\N	457083fb-f806-47f5-bf2e-46d75b6bd610	\N	\N	06:30:00	\N
99ef344b-2f95-4dec-8f4f-dccc4bb43351	T005	Carlos Ruiz	Mecánico Diésel Especialista	ACTIVO	55 4567 8901	CR	3000.00	4000.00	MIXTO	EN_OBRA_PROPIA	\N	2021-05-18	14	2.00	90.00	0.00	\N	t	2026-08-21 02:14:58.998-06	2026-08-21 02:14:58.998-06	\N	c1c154bb-be3a-4694-9273-f07c64d2dec1	\N	\N	07:30:00	\N
7ae68a33-6be6-46f3-8344-2dbf7389540d	T006	Ing. Jorge Valenzuela	Ingeniero Residente de Obra	ACTIVO	55 5678 9012	JV	6500.00	4500.00	MIXTO	EN_OBRA_PROPIA	\N	2020-02-01	15	0.00	0.00	0.00	\N	t	2026-08-21 02:14:59.004-06	2026-08-21 02:14:59.004-06	\N	3f66ae71-7d0d-45b6-8e2f-eb9e5aa5715b	\N	\N	07:00:00	\N
d69e3ac7-f268-4533-a7ed-780c000f4ad7	T001	Juan Pérez	Operador de Excavadora	ACTIVO	55 1234 5678	JP	2500.00	3500.00	MIXTO	RENTADO_CLIENTE	f600f831-a44a-4930-9fc0-8e5ec1ee9450	2023-03-15	8	6.50	80.00	0.00	\N	t	2026-08-21 02:14:58.977-06	2026-08-20 20:15:22.938-06	\N	923aa0cd-8e76-43e6-95a9-3be3c96ca14e	\N	\N	07:00:00	\N
82d653ca-5dd2-45e8-89e3-ab089fd21547	\N	Juan Perez Garcia	Mecanico	ACTIVO	3113456543	JP	0.00	3000.00	EFECTIVO	EN_OBRA_PROPIA	\N	2026-11-11	\N	\N	\N	\N	\N	t	2026-11-11 21:27:27.185-06	2026-11-15 01:20:23.395918-06	c0000000-0000-0000-0000-000000000001	c1c154bb-be3a-4694-9273-f07c64d2dec1	c0000000-0000-0000-0000-000000000001	\N	08:00:00	9dd11e5a-c4d3-4c37-8fc0-57a2370cb42b
3e73d919-7485-45dc-89b3-5d032ee30cd4	\N	Juan Garcia Perez	Encargado punto de ventas	ACTIVO	3231013548	JG	0.00	3500.00	EFECTIVO	EN_OBRA_PROPIA	\N	2026-11-11	\N	\N	\N	\N	\N	t	2026-11-12 05:20:54.367-06	2026-11-15 01:20:23.395918-06	c0000000-0000-0000-0000-000000000001	e71fb890-67e3-4e62-8cc1-b5170a4f0606	c0000000-0000-0000-0000-000000000001	\N	07:00:00	d6eaccc8-8d75-47fe-9658-bfcbe97b2890
\.


--
-- Data for Name: trabajadores_proyectos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trabajadores_proyectos (trabajador_id, proyecto_id, asignado_en, activo, actualizado_por, creado_por, eliminado_en) FROM stdin;
d69e3ac7-f268-4533-a7ed-780c000f4ad7	00692bdb-27d2-4e7b-be62-16c2977e1650	2026-08-21 02:14:59.039-06	t	\N	\N	\N
ea344f07-0905-4881-a64b-b7315f0bfe97	21b6cf72-c07c-40e8-aac6-b538511f5127	2026-08-21 02:14:59.04-06	t	\N	\N	\N
fe2ec7b7-7fda-4c09-af19-279f41215d06	caf3c621-4982-4b27-bef3-02c362cb96a6	2026-08-21 02:14:59.042-06	t	\N	\N	\N
7ae68a33-6be6-46f3-8344-2dbf7389540d	00692bdb-27d2-4e7b-be62-16c2977e1650	2026-08-21 02:14:59.043-06	t	\N	\N	\N
7ae68a33-6be6-46f3-8344-2dbf7389540d	caf3c621-4982-4b27-bef3-02c362cb96a6	2026-08-21 02:14:59.044-06	t	\N	\N	\N
\.


--
-- Data for Name: transacciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transacciones (id, codigo, tipo, categoria, monto, fecha, descripcion, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, entidad_id, entidad_tipo, otra_categoria) FROM stdin;
a5866596-55a6-4d31-9a4a-4e8b9b3c7338	TX001	EGRESO	Combustible	4600.00	2025-04-27	Carga diésel M004	t	2026-08-21 02:14:59.128-06	2026-08-21 02:14:59.128-06	\N	\N	\N	\N	\N	\N
5d3a2de5-c432-4845-813a-7a15bfbfe218	TX003	EGRESO	Nómina	45000.00	2025-04-25	Pago semana 16 - Operadores	t	2026-08-21 02:14:59.13-06	2026-08-21 02:14:59.13-06	\N	\N	\N	\N	\N	\N
64497715-7e08-40db-99e4-30b446ba4927	TX002	INGRESO	Servicios	125000.00	2025-04-26	Anticipo Renta Excavadora	t	2026-08-21 02:14:59.129-06	2026-11-13 11:46:20.319107-06	c0000000-0000-0000-0000-000000000001	\N	\N	\N	\N	\N
307c4f28-df85-46f6-b5ba-fe700046472e	TRA-20261113-61F55A	EGRESO	PROVEEDORES	100.00	2026-11-13	Abono a OC-INT2-e3c4e9f9 — Prov-Recepcion2 e3c4e9f9	t	2026-11-13 17:51:11.384-06	2026-11-13 17:51:10.979-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	f1417a44-3ba3-4c65-9b2c-1b8d18a4771c	PROVEEDOR	\N
c652ca7f-7e73-406e-86f3-b7f5dd3eefdb	TRA-20261113-13B237	EGRESO	PROVEEDORES	80.00	2026-11-13	Abono a OC-2026-057 — CAT México	t	2026-11-13 19:28:22.741-06	2026-11-13 19:28:22.72-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	PROVEEDOR	\N
fe7d55fc-bab4-4154-8115-fb2714bf39eb	TRA-20261113-6D4727	EGRESO	PROVEEDORES	7.00	2026-11-13	Abono a OC-2026-057 — CAT México	t	2026-11-13 19:37:08.621-06	2026-11-13 19:37:08.597-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	PROVEEDOR	\N
e5abf655-c100-441f-919e-8297bbf0cdab	TRA-20261106-BEF9A1	EGRESO	PROVEEDORES	21600.00	2026-11-06	Abono a OC-2026-055 — CAT México	t	2026-11-06 20:22:12.542-06	2026-11-06 20:22:12.509-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	PROVEEDOR	\N
53a85014-0c2e-48a4-a7d5-6f3169709c80	TRA-20261106-BAB69C	EGRESO	PROVEEDORES	500.00	2026-11-07	Abono a OC-2026-045 — Prov-FAIL 9eb2ddeb-24d9	t	2026-11-07 04:48:49.565-06	2026-11-07 04:48:49.543-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	d4291a6e-553c-4c87-a27f-ba13965d985e	PROVEEDOR	\N
e6570d18-681c-403d-877e-be5213bb1925	TRA-20261106-B2482F	EGRESO	PROVEEDORES	500.00	2026-11-07	Abono a OC-2026-045 — Prov-FAIL 9eb2ddeb-24d9	t	2026-11-07 04:48:56.73-06	2026-11-07 04:48:56.718-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	d4291a6e-553c-4c87-a27f-ba13965d985e	PROVEEDOR	\N
48f17f90-3d1e-4c01-a888-7fe12f5f1107	TRA-20261107-F475EE	INGRESO	COBRANZA	40000.00	2026-11-04	Cobro PAG-CXC-2026-001 — Minera Santa Fe	t	2026-11-07 20:34:16.632-06	2026-11-07 20:34:16.6-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	6b0b910f-cf9c-425a-9926-a5579b27f4ae	COBRO	\N
c295a588-6c37-479b-a928-b9de0c93f2b7	TRA-20261107-417A3F	INGRESO	COBRANZA	50000.00	2026-09-28	Cobro PAG-CXC-2026-002 — Ferrocarriles del Sur	t	2026-11-07 20:34:16.746-06	2026-11-07 20:34:16.729-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	976d3812-869f-4c26-ac7b-53cc67b6c6f2	COBRO	\N
1a979892-3279-453a-bfd4-8953126454a1	TRA-20261107-638AA0	INGRESO	COBRANZA	30000.00	2026-10-28	Cobro PAG-CXC-2026-003 — Ferrocarriles del Sur	t	2026-11-07 20:34:16.771-06	2026-11-07 20:34:16.761-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	188f6a3a-478e-423f-a1ff-aa6f36bc5dfd	COBRO	\N
36a20ec0-4ece-4d02-acf9-9be756087e8a	TRA-20261107-5A80F0	INGRESO	COBRANZA	30000.00	2026-10-26	Cobro PAG-CXC-2026-004 — Gobierno Municipal	t	2026-11-07 20:34:16.804-06	2026-11-07 20:34:16.796-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	296b39b1-125b-43ed-bbf5-cce40532fda4	COBRO	\N
b1e21af5-81ac-4b7e-a865-fb8ef78c2ad5	TRA-20261107-05C187	INGRESO	COBRANZA	37400.00	2026-11-05	Cobro PAG-CXC-2026-005 — Gobierno Municipal	t	2026-11-07 20:34:16.829-06	2026-11-07 20:34:16.815-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	547fcd2d-bf81-4be6-a0a3-d945e390a431	COBRO	\N
5ca9509d-73cf-491b-af37-e86ef110c8ac	TRA-20261107-42A47B	INGRESO	COBRANZA	124800.00	2026-11-02	Cobro PAG-CXC-2026-006 — Constructora Pirámide	t	2026-11-07 20:34:16.872-06	2026-11-07 20:34:16.863-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	12dd9b73-fa16-4a87-8565-617509d60fe9	COBRO	\N
7a2c598c-07eb-47c5-a23c-c8e6c4515b01	TRA-20261112-CA8CE6	INGRESO	Pago de Obra	1500.00	2026-08-20	Transaccion test b998f799 2k8w	f	2026-11-13 05:28:16.58-06	2026-11-12 23:28:16.590843-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-13 05:28:16.588-06	\N	\N	\N
9e76a943-100b-469b-bb92-77b9e8ba815b	TRA-20261113-9725A9	EGRESO	PROVEEDORES	23.00	2026-11-13	Abono a OC-2026-057 — CAT México	t	2026-11-13 19:31:06.315-06	2026-11-13 19:31:06.292-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	PROVEEDOR	\N
159b1e89-0da9-4e3c-93d6-12b336d5571a	TRA-20261113-C3FE59	EGRESO	PROVEEDORES	1500.00	2026-11-13	Abono a OC-2026-044 — Prov-PAG 9eb2ddeb-2b33	t	2026-11-13 21:28:28.833-06	2026-11-13 21:28:28.807-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	743779ec-3a9a-4a34-887f-02f1296f2af1	PROVEEDOR	\N
700a882c-e514-4994-9b2f-12f09724b40f	TRA-20261118-5FCC03	INGRESO	Pago de Obra	1500.00	2026-08-20	Transaccion test 88194697 pjj6	f	2026-11-18 22:15:31.818-06	2026-11-18 16:15:31.83079-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-18 22:15:31.826-06	\N	\N	\N
3dc8ccab-4129-4429-b200-f57b9d250af9	TRA-20261118-9B1EC3	INGRESO	Pago de Obra	1500.00	2026-08-20	Transaccion test 008d614f ka83	f	2026-11-18 21:57:25.401-06	2026-11-18 15:57:25.411519-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-18 21:57:25.407-06	\N	\N	\N
3375db4b-07c4-4e9d-9035-150a94d2e39e	TRA-20261113-4025B4	EGRESO	PROVEEDORES	300.00	2026-11-13	Abono a OC-2026-056 — Prov Sanit Y2	t	2026-11-13 19:20:38.282-06	2026-11-13 19:20:38.257-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	2718c4b8-f7d9-45b2-a5dc-f4521866997b	PROVEEDOR	\N
3ea05b03-444d-41ec-9e67-0750e6837c87	TRA-20261113-5C1C45	EGRESO	PROVEEDORES	11.00	2026-11-13	Abono a OC-INT2-dd26e54b — Prov-Recepcion2 dd26e54b	t	2026-11-13 19:31:13.895-06	2026-11-13 19:31:13.881-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	014d5302-8cd5-499b-ba6d-7d24adf1fab1	PROVEEDOR	\N
26923450-a899-4b37-aa2b-7d9a3a91d3df	TRA-20261112-CEA7B2	INGRESO	Pago de Obra	1500.00	2026-08-20	Transaccion test b6afd8ab e8tf	f	2026-11-13 05:29:43.038-06	2026-11-12 23:29:43.053916-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-13 05:29:43.045-06	\N	\N	\N
2faa2082-d52b-44d8-b935-98af6e387b72	TRA-20261118-2B80E5	INGRESO	Pago de Obra	1500.00	2026-08-20	Transaccion test a60e038c rbg9	f	2026-11-18 22:14:29.918-06	2026-11-18 16:14:29.927367-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-18 22:14:29.925-06	\N	\N	\N
b99fd039-9622-4101-b203-ca4c08e43fcb	TRA-20261118-DF0AFC	INGRESO	Pago de Obra	1500.00	2026-08-20	Transaccion test 838c16f9 t0hl	f	2026-11-18 22:19:39.635-06	2026-11-18 16:19:39.646267-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-18 22:19:39.642-06	\N	\N	\N
\.


--
-- Data for Name: unidades_medida; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.unidades_medida (id, codigo, nombre, categoria, activo, creado_en, actualizado_en) FROM stdin;
936fbba3-8af5-4bb8-ba36-ab99d462ae05	Pza	Pza	\N	t	2026-08-21 02:14:58.936-06	2026-08-21 02:14:58.936-06
7ef1227e-8879-4ed7-ae09-3497610b5d02	Galones	Galones	\N	t	2026-08-21 02:14:58.937-06	2026-08-21 02:14:58.937-06
ff1462a0-24da-4cc9-ae87-fe4552063dbf	m²	m²	\N	t	2026-08-21 02:14:58.938-06	2026-08-21 02:14:58.938-06
859c80fa-b812-409b-8a73-df80b792a132	m³	m³	\N	t	2026-08-21 02:14:58.938-06	2026-08-21 02:14:58.938-06
cddac107-cf7a-4d94-9344-57b22a508c26	pt	pt	\N	t	2026-08-21 02:14:58.939-06	2026-08-21 02:14:58.939-06
d6118e1e-11c0-4e53-8725-1f1b801d9841	jor	jor	\N	t	2026-08-21 02:14:58.94-06	2026-08-21 02:14:58.94-06
9256e1ce-cc2c-4ec3-a268-6b41240f2471	hr	hr	\N	t	2026-08-21 02:14:58.94-06	2026-08-21 02:14:58.94-06
20c20a29-da38-4fc7-a50d-3aed186c429e	%mo	%mo	\N	t	2026-08-21 02:14:58.941-06	2026-08-21 02:14:58.941-06
0f042f87-bebf-4c10-b591-6de9f369b3e6	pza	pza	\N	t	2026-08-21 02:14:58.941-06	2026-08-21 02:14:58.941-06
3c735df8-1cd3-4ba9-a8d6-cda84f8d98a0	día	día	\N	t	2026-08-21 02:14:58.942-06	2026-08-21 02:14:58.942-06
d1000000-0000-4000-8000-000000000001	tonelada	tonelada	\N	t	2026-11-03 18:53:54.173-06	2026-11-08 14:06:15.735233-06
d1000000-0000-4000-8000-000000000005	bolsa	bolsa	\N	t	2026-11-03 18:53:54.173-06	2026-11-08 14:06:15.735233-06
d1000000-0000-4000-8000-000000000003	bulto	bulto	\N	t	2026-11-03 18:53:54.173-06	2026-11-08 14:06:15.735233-06
d1000000-0000-4000-8000-000000000004	pieza	pieza	\N	t	2026-11-03 18:53:54.173-06	2026-11-08 14:06:15.735233-06
d1000000-0000-4000-8000-000000000002	viaje	viaje	\N	t	2026-11-03 18:53:54.173-06	2026-11-08 14:06:15.735233-06
d2aba40c-2f0d-490e-86f4-5562eeff71da	T5a17ee2d	TestUnidad-5a17ee2d	\N	t	2026-11-13 05:28:05.835-06	2026-11-13 05:28:05.833-06
04593cf9-368d-4f32-978d-983078c05879	T6a37c69a	TestUnidad-6a37c69a	\N	t	2026-11-13 05:29:35.991-06	2026-11-13 05:29:35.989-06
23b86eb5-4fd1-40f8-99fb-23bb8aa966be	Tb7a92e38	TestUnidad-b7a92e38	\N	t	2026-11-14 05:21:39.91-06	2026-11-14 05:21:39.909-06
159429fe-b598-49d6-b26f-7037f2c3b309	Tc0252b7c	TestUnidad-c0252b7c	\N	t	2026-11-14 05:27:16.97-06	2026-11-14 05:27:16.967-06
40b6c06f-b616-43ac-8781-e50825b76c40	T81fcbc23	TestUnidad-81fcbc23	\N	t	2026-11-18 21:56:32.164-06	2026-11-18 21:56:32.163-06
8eba26ce-1fe4-4f39-9d84-6cec4c1a7914	T81496f01	TestUnidad-81496f01	\N	t	2026-11-18 22:14:26.947-06	2026-11-18 22:14:26.946-06
fbcd9ed5-e112-4bfa-a350-52ab31a144ac	Tf6b40283	TestUnidad-f6b40283	\N	t	2026-11-18 22:15:23.02-06	2026-11-18 22:15:23.019-06
79f72c12-34bb-402c-90e5-0d72d2ba5921	T34193423	TestUnidad-34193423	\N	t	2026-11-18 22:19:38.412-06	2026-11-18 22:19:38.41-06
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, persona_id, email, password_hash, email_verificado, telefono_verificado, factor_doble_habilitado, ultimo_login, preferencias, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en, torre, jefe_user_id, numero_empleado, pin_hash, pin_temporal_hasta, pin_cambiado_en, pin_historial, intentos_pin, cuenta_bloqueada_en) FROM stdin;
ad3502aa-7030-4755-85eb-80d4aa8d6950	101fbfcd-ae22-4752-9799-6907df2ff4d0	pinint-b0f6feda@svr-erp.local	$2b$04$HdUmFRrV2NeaVeD0jvyJXuQbePPnVTcA7LFSIfaJY3.QqJwaNSbt6	f	f	f	2026-11-18 22:03:01.687-06	{}	t	2026-11-18 22:02:57.39-06	2026-11-18 16:03:03.237177-06	\N	\N	\N	\N	\N	TRA-93793	$2b$12$qf0g3qKrKPi2QMK4ilMY..hmx9zWO3t0Od0SLf5udGw/XhLWffEke	\N	2026-11-18 22:03:03.236-06	["$2b$04$l8MQCapdLgD68uUo7mca9u0mrH4Cq2Qop1Z7UfGzSPALA03NV61Da", "$2b$12$XYVf3.BcZvpEFHJNHKOeqecIZ5Wnm.JgZKRDz0FW3GfWTC8.1IC3K"]	0	\N
4975abb7-e1bd-4e0a-989d-7fe6522f0111	7df6f379-836f-4703-a796-c26b6f03bcde	inttest-e337a65b@svr-erp.local	$2b$12$w0n2RrM7AaBdJolyqXn/juuIwgB11F1Pofz4inq.0MbEFKqsC4KAa	f	f	f	\N	{}	f	2026-11-11 19:21:14.702-06	2026-11-11 20:00:59.413948-06	\N	\N	2026-11-11 19:21:15.363-06	\N	\N	EMP-e337a65b	\N	\N	2026-11-11 20:00:31.726698-06	[]	0	\N
e2000000-0000-0000-0000-0000000000a2	e1000000-0000-0000-0000-0000000000a2	residente@svr-constructora.com	$2b$10$1EhoXDUUZhKSI/SD.7dT6e0fN6kRVsRScy2j6oZKTvjMgvnnrDrYe	t	f	f	2026-11-15 07:34:52.797-06	{}	t	2026-11-08 18:57:26.5543-06	2026-11-15 01:34:52.801869-06	\N	\N	\N	RESIDENTE	\N	RES-014	$2b$12$0a.huPkMZZmDrkC6Fc/MHOE/xOEEyttspAqtAk2TSfyQBiDgdRR/S	\N	2026-11-10 22:26:13.453848-06	[]	0	\N
e2000000-0000-0000-0000-0000000000a3	e1000000-0000-0000-0000-0000000000a3	tecnico@svr-constructora.com	$2b$10$0hUObSVRKOf1q822D6sY1OeIkoHRqFFumRZdwQYFXRvKVxMTXfl16	t	f	f	2026-11-13 23:38:49.013-06	{}	t	2026-11-08 18:57:26.5543-06	2026-11-13 17:38:49.015106-06	\N	\N	\N	MECANICO	\N	TEC-007	$2b$12$0a.huPkMZZmDrkC6Fc/MHOE/xOEEyttspAqtAk2TSfyQBiDgdRR/S	\N	2026-11-10 22:26:13.453848-06	[]	0	\N
705ccfe4-0df1-4833-95a9-ef5f9f615768	4fd46bfb-6dfd-4b9b-be66-8efa22069faa	pinint-48df7c6b@svr-erp.local	$2b$04$hj9.xGVnYbIR.QQF.9V4Ee0rHn7Qtp6ld2Cf1vt31tzntU3Qnx8B2	f	f	f	2026-11-18 22:11:25.044-06	{}	t	2026-11-18 22:11:21.015-06	2026-11-18 16:11:26.703392-06	\N	\N	\N	\N	\N	TRA-96152	$2b$12$3D/gLf75Oew5EwFIRMi3a.UCmmW1UTmTiAccOCGXQ0GE7gEq.smny	\N	2026-11-18 22:11:26.699-06	["$2b$04$37ct9Os/7bLVBq/.4dSOeO76OHrJMVXF4l5Dov5fYsT5pOMFyIaoG", "$2b$12$JdS6.rg9xDpTLdBVCtIMZ.VBzr7dknZY6iPMMkaEB2t/wzl5bsayy"]	0	\N
e2000000-0000-0000-0000-0000000000a1	e1000000-0000-0000-0000-0000000000a1	administrativo@svr-constructora.com	$2b$10$kTxPe.w2joWkNickhX9FZub0NCBHjTOim1FoyIWvjvz3eBH2MuFQy	t	f	f	\N	{}	t	2026-11-08 18:57:26.5543-06	2026-11-11 23:40:58.277091-06	\N	\N	\N	ADMINISTRATIVO	\N	\N	\N	\N	\N	[]	0	\N
e2000000-0000-0000-0000-0000000000c1	e1000000-0000-0000-0000-0000000000c1	pedro.chofer@svr-constructora.com	$2b$10$Se6q8ljVOkd4AyIv9pQSNeoJVyA5bhv9aROJbYBmF/vSH1IQp8FD6	t	f	f	2026-11-09 09:01:55.421-06	{}	f	2026-11-09 03:01:24.026247-06	2026-11-14 03:10:58.067444-06	\N	c0000000-0000-0000-0000-000000000001	2026-11-14 09:10:58.065-06	\N	e2000000-0000-0000-0000-0000000000a2	\N	\N	\N	\N	[]	0	\N
c0000000-0000-0000-0000-000000000001	b0000000-0000-0000-0000-000000000001	admin@svr-constructora.com	$2b$10$nXLFI4c2jybkPBaB0TI2eeBjkgGeleg/2P3rXsuUo0cCvFX90rJoC	t	f	f	2026-11-18 20:55:32.02-06	{}	t	2026-11-03 18:51:00.016-06	2026-11-18 14:55:32.037714-06	\N	c0000000-0000-0000-0000-000000000001	\N	ADMINISTRATIVO	e2000000-0000-0000-0000-0000000000a2	ADM-01	$2b$12$0a.huPkMZZmDrkC6Fc/MHOE/xOEEyttspAqtAk2TSfyQBiDgdRR/S	\N	2026-11-10 22:26:13.453848-06	[]	0	\N
6b8d4695-5db7-4aa4-823e-7fe5bd06c802	aa7f9249-ab9a-42c8-9b64-21eec13de260	pinint-dcc182f0@svr-erp.local	$2b$04$oyud/9vKc6C4Uane3.a70.VO0fSkDccAPWqFHBMM8nF6qNk0sdGa.	f	f	f	2026-11-18 22:12:27.496-06	{}	t	2026-11-18 22:12:23.463-06	2026-11-18 16:12:29.087233-06	\N	\N	\N	\N	\N	TRA-98721	$2b$12$JS7.IjQR71Lvm9rJ2iSI7OJoeY/CmbwP2zzHT5.BZFDrmN/kfCp2i	\N	2026-11-18 22:12:29.087-06	["$2b$04$6wE9dq1N3YLN0c3Ik2I5cO2/URwL4/VPshyBjOzUg.AnYVw7BBY0u", "$2b$12$cQ6bDBIaRCH.TkIHLJCfUukiQuMarPKPJFPHJev7UTCy9hkAtf/QC"]	0	\N
e2000000-0000-0000-0000-0000000000a5	e1000000-0000-0000-0000-0000000000a5	trabajador@svr-constructora.com	$2b$10$Se6q8ljVOkd4AyIv9pQSNeoJVyA5bhv9aROJbYBmF/vSH1IQp8FD6	t	f	f	2026-11-12 03:37:02.14-06	{}	t	2026-11-08 18:57:26.5543-06	2026-11-14 12:30:53.470248-06	\N	\N	\N	\N	e2000000-0000-0000-0000-0000000000a2	TRA-0142	$2b$12$MQQkRX6Lj85ORvv985SqEe/Qyx.g1.bF2BUKr3iAZN4Wwn/jVh2QG	2026-11-15 18:30:53.461-06	2026-11-14 18:30:53.473-06	["$2b$12$0a.huPkMZZmDrkC6Fc/MHOE/xOEEyttspAqtAk2TSfyQBiDgdRR/S"]	0	\N
e2000000-0000-0000-0000-0000000000a4	e1000000-0000-0000-0000-0000000000a4	cobrador@svr-constructora.com	$2b$10$uP.snRJaeAyi0lt1PxYh9ugO79TGV2rJY2DIt25QETVRgwyqhuZjy	t	f	f	2026-11-11 19:31:59.568-06	{}	t	2026-11-08 18:57:26.5543-06	2026-11-11 23:40:58.277091-06	\N	\N	\N	ADMINISTRATIVO	\N	COB-003	$2b$12$0a.huPkMZZmDrkC6Fc/MHOE/xOEEyttspAqtAk2TSfyQBiDgdRR/S	\N	2026-11-10 22:26:13.453848-06	[]	0	\N
dd1392d7-e0dd-42f6-8d10-18270aab39a7	dc69f9cd-4977-457e-be12-7cb97e790fd8	pinint-680ba1d9@svr-erp.local	$2b$04$Ag.E0aI/LZg1ShMp1fLE6e7/xHr0vem/rnlYNqSDnKcM4gr16brV2	f	f	f	\N	{}	t	2026-11-11 03:35:07.779-06	2026-11-14 02:24:35.743491-06	\N	c0000000-0000-0000-0000-000000000001	\N	\N	e2000000-0000-0000-0000-0000000000a2	TRA-9680b	$2b$12$vC5uEqODrKl1tTBULB4lau0IopqDqLZmTZxyFsHpjlZGCxVa6NLvO	2026-11-12 03:35:10.142-06	2026-11-11 03:35:10.143-06	["$2b$04$Qm.n5qu71IkDFe.1HHKyteiFNTj2OrAu2rGZpX.CZzCbLzIUehn5a"]	0	\N
2116d123-cdc7-499f-bf42-d60628950fcd	2a08770e-632c-48b3-9f06-a6f64416abd2	inttest-2e52be7c@svr-erp.local	$2b$12$UJrgg4d7b13943yeTucavOvR50SncVEZk3lMCDA82BtTHZTHppCFK	f	f	f	2026-11-10 00:06:11.771-06	{}	f	2026-11-10 00:06:05.354-06	2026-11-09 18:06:12.200466-06	\N	\N	2026-11-10 00:06:12.194-06	\N	\N	\N	\N	\N	\N	[]	0	\N
f0000000-0000-0000-0000-000000000020	f0000000-0000-0000-0000-000000000010	rrhh@svr-constructora.com	$2b$10$d8E/iD6ikOg2YpKe6blDsenJhw19jJI6NFQJT5V03B.8tUQ5rN4Hy	t	f	f	2026-11-13 23:39:07.312-06	{}	t	2026-11-03 18:51:00.078-06	2026-11-13 17:39:07.313167-06	\N	\N	\N	ADMINISTRATIVO	\N	\N	\N	\N	\N	[]	0	\N
2476caa6-6732-456f-bcb2-f1bb5be31ebb	199a8a2b-f664-4b9e-aa1d-1c5ded13798f	pinint-bb95bf0d@svr-erp.local	$2b$04$qV7gPg.0Bb8MA5Wk9dB9wuV8O46vwsSYWUjlEu9sZBYZKoyookaum	f	f	f	2026-11-11 05:55:18.739-06	{}	t	2026-11-11 05:55:18.619-06	2026-11-14 02:24:39.82711-06	\N	c0000000-0000-0000-0000-000000000001	\N	\N	67abc405-e871-41b8-b3f8-a520c6b62a64	TRA-91574	$2b$12$HZECQM.vN/i2Vnm0Njbgpe8zYz4cIAE1s7XO.CGTmpXy/bmmExfPS	2026-11-12 05:55:22.411-06	2026-11-11 05:55:22.414-06	["$2b$04$Uso/hHdgpnHpFboE9hscI.dzxdUjf797MGAG5ByEA2Wvk2wzlc73O"]	0	\N
eda79d19-f22b-4422-a068-4df057f91e15	098aa1e1-0cc5-4513-8022-87e09bb51852	pinint-37e025bd@svr-erp.local	$2b$04$XnohPhkCYz3E3i1x0kqn2eg1Q60kGocueVQlkmixDH0epyUptk.Ki	f	f	f	2026-11-11 03:37:50.838-06	{}	t	2026-11-11 03:37:50.803-06	2026-11-10 21:37:53.073582-06	\N	\N	\N	\N	\N	TRA-93191	$2b$12$qSN/JU1PnCyve0NzSdFbJuLWETxRU2UXJxSdmWWqR/qmr7UWNNijm	2026-11-12 03:37:53.071-06	2026-11-11 03:37:53.073-06	["$2b$04$PsHSCsih.pxUMv.GH.MHX.HqiNbjNcm6AZqpzEAYdJxz2rBA.nmpu"]	0	\N
f9b9a79b-033a-4a3f-8057-70fe9eb17c08	bf05390d-bdf2-4359-b378-8c0caf69e28e	pinint-77d0d743@svr-erp.local	$2b$04$zf5.uE8oKdszP3D4rxxyKu19G7dJB92bCptdveQV/O0Q2nHRkhx2e	f	f	f	2026-11-11 06:02:37.424-06	{}	t	2026-11-11 06:02:37.378-06	2026-11-11 00:02:39.82001-06	\N	\N	\N	\N	\N	TRA-94031	$2b$12$dP62fwIOgz/Sr.X2E6w72uEMuueheMAD5JM/CvDCS13BkCW4M35gy	2026-11-12 06:02:39.818-06	2026-11-11 06:02:39.82-06	["$2b$04$6xRIdRsDA4ddoVdSPw.Q3.q3egMno4gGrhQQQsI9Zhq4.7P2VlgG."]	0	\N
e2000000-0000-0000-0000-0000000000b2	e1000000-0000-0000-0000-0000000000b2	diesel@svr-constructora.com	$2b$10$0hUObSVRKOf1q822D6sY1OeIkoHRqFFumRZdwQYFXRvKVxMTXfl16	t	f	f	2026-11-11 19:31:18.371-06	{}	t	2026-11-08 23:51:01.470143-06	2026-11-11 13:31:18.384074-06	\N	\N	\N	DIESEL	\N	TEC-009	$2b$12$0a.huPkMZZmDrkC6Fc/MHOE/xOEEyttspAqtAk2TSfyQBiDgdRR/S	\N	2026-11-10 22:26:13.453848-06	[]	0	\N
af077be9-1d1e-4f5d-b8ea-084dfb21f366	e8662c97-2a18-4023-94e8-c72ffa4f9cd5	pinint-fadba26f@svr-erp.local	$2b$04$kUtPStKtx7g0.9Agw6xQquNo.kmnLtAD/.Q.RRuMnL/Tzfh/0Hhxu	f	f	f	\N	{}	t	2026-11-11 03:36:38.438-06	2026-11-10 21:36:40.295995-06	\N	\N	\N	\N	\N	TRA-9fadb	$2b$12$80U.NATnd40Hv8jq.bfFruUDBZ4m1tgJetP69PsNIz3zltYtWx5uC	2026-11-12 03:36:40.295-06	2026-11-11 03:36:40.297-06	["$2b$04$gyvGKnSditJPpzc5wsu8x.MXRlrcYW2k2Rr4pmr/t40SmkkZ/D/uG"]	0	\N
e2000000-0000-0000-0000-0000000000c2	e1000000-0000-0000-0000-0000000000c2	luis.operador@svr-constructora.com	$2b$10$Se6q8ljVOkd4AyIv9pQSNeoJVyA5bhv9aROJbYBmF/vSH1IQp8FD6	t	f	f	2026-11-09 09:01:55.953-06	{}	f	2026-11-09 03:01:24.026247-06	2026-11-14 03:10:42.764152-06	\N	c0000000-0000-0000-0000-000000000001	\N	\N	fbbf58c3-7c88-4787-9dfd-e039a03fb3b0	\N	\N	\N	\N	[]	0	\N
e2000000-0000-0000-0000-0000000000b3	e1000000-0000-0000-0000-0000000000b3	mantenimiento@svr-constructora.com	$2b$10$0hUObSVRKOf1q822D6sY1OeIkoHRqFFumRZdwQYFXRvKVxMTXfl16	t	f	f	2026-11-11 19:31:49.466-06	{}	t	2026-11-08 23:51:01.470143-06	2026-11-11 13:31:49.468516-06	\N	\N	\N	MANTENIMIENTO	\N	TEC-010	$2b$12$0a.huPkMZZmDrkC6Fc/MHOE/xOEEyttspAqtAk2TSfyQBiDgdRR/S	\N	2026-11-10 22:26:13.453848-06	[]	0	\N
6cb399b7-0676-48c7-9863-da24aea82d63	dbb11f95-493d-4c62-88a5-5769c183e2e5	pinint-2622bfd4@svr-erp.local	$2b$04$U6ivHHsjF6IdH7A5LZBr/OjWzv0eov6LY1xlZdafJtvOCblrN10nK	f	f	f	2026-11-11 05:23:08.847-06	{}	t	2026-11-11 05:23:08.801-06	2026-11-10 23:23:13.028807-06	\N	\N	\N	\N	\N	TRA-91609	$2b$12$vpSJkF5mwXzMzSHoNOosC.4BWvYUeeRGuGveKl9l95EMcyqT2s7yO	2026-11-12 05:23:13.028-06	2026-11-11 05:23:13.031-06	["$2b$04$mzWGMUN70PuXEO5DFIL0JecuFOdQiQQY4c.65QdSM8te48LxMmJJ6"]	0	\N
90e6b179-20b3-4646-8935-5ed15c3ca135	238612d4-514f-4565-be6d-21f801d8f6f7	jefe-inttest-e337a65b@svr-erp.local	$2b$12$LbiyAoleqRcFeQTSklDzDOFECh5KxxlXyunvGfpYGzCfQsUg9Z3Iy	f	f	f	\N	{}	f	2026-11-11 19:21:15.104-06	2026-11-11 13:21:15.252689-06	\N	\N	2026-11-11 19:21:15.248-06	\N	\N	\N	\N	\N	\N	[]	0	\N
e2000000-0000-0000-0000-0000000000b1	e1000000-0000-0000-0000-0000000000b1	soldador@svr-constructora.com	$2b$10$0hUObSVRKOf1q822D6sY1OeIkoHRqFFumRZdwQYFXRvKVxMTXfl16	t	f	f	2026-11-11 19:30:52.617-06	{}	t	2026-11-08 23:51:01.470143-06	2026-11-11 13:30:52.618966-06	\N	\N	\N	SOLDADOR	\N	TEC-008	$2b$12$0a.huPkMZZmDrkC6Fc/MHOE/xOEEyttspAqtAk2TSfyQBiDgdRR/S	\N	2026-11-10 22:26:13.453848-06	[]	0	\N
17b8e737-5e4f-4163-8273-31968af61972	abc54bba-9620-4122-8a62-6872525b98a2	telefono-smoke@test.mx	$2b$12$7ak.k4hAnVFHN4LgYl0LFeRoKtc3EXN7xT79Nq/SwCNB.nyvTWO92	f	f	f	\N	{}	f	2026-11-14 08:39:55.848-06	2026-11-14 02:39:56.034607-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-14 08:39:56.023-06	RESIDENTE	\N	\N	\N	\N	\N	[]	0	\N
b84c55d8-bfd3-4c9a-a2f9-dddd7cb64029	f73d501f-c17f-4017-abc8-3605eed27866	tec-017@pwa.svr-constructora.com	$2b$12$Upb9dV3v4U5/v7dT82dkU.s1/8TdehOFkEJCo8iQ0zrnbcwmcWH9e	f	f	f	\N	{}	t	2026-11-13 05:29:39.943-06	2026-11-13 05:29:39.923-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-017	$2b$12$P6W9UU5Q3WbvGIScDmqtL.X3axv0SaWN69RaT/iZ0PjqtE393J006	2026-11-14 05:29:39.078-06	2026-11-13 05:29:39.923-06	[]	0	\N
3fe478e4-fd65-4739-8711-38c12891c735	cb1dcd21-080a-4497-baa4-4d33cb190292	pinint-b9bd1bad@svr-erp.local	$2b$04$4umTmmWz/0gE2cpGvOp4X.w33hYVXjn3GcIIpo4XIiyoJgD55Z9yO	f	f	f	2026-11-12 03:33:01.62-06	{}	t	2026-11-12 03:32:57.404-06	2026-11-11 21:33:03.148586-06	\N	\N	\N	\N	\N	TRA-95645	$2b$12$ze1Ay9xDSjDI6DOXULUpwuJhxpezlsdjUtk0UnBDOA0oLqPqtoB1.	\N	2026-11-12 03:33:03.143-06	["$2b$04$cOKmOlsn95xjG3xPLjunAeZoT2rAPqyPKh1M8AMEX08Y10zPQ4rW6", "$2b$12$MNuT66YD3jJbMdY.IXE0A.G5xuB6K2YEzCq5P2OGepyOcoZEz9Z0O"]	0	\N
46c9ee82-eb98-4bac-a882-6c6e75c1af1e	b1ae8002-e36a-498f-9d59-c267f0bf0e7a	jefe-inttest-4c1577d0@svr-erp.local	$2b$12$BQFCl0ufFJ4.VgcFNlVcSejhUw0TTliQvW7A6D3j0DV91QsevRo7e	f	f	f	\N	{}	f	2026-11-18 22:19:19.536-06	2026-11-18 16:19:19.566724-06	\N	\N	2026-11-18 22:19:19.563-06	\N	\N	\N	\N	\N	\N	[]	0	\N
801c39ff-929e-4fff-a79d-aa741af7c216	a915a626-85e0-4dab-b847-10fd5ef5b1c1	tec-018@pwa.svr-constructora.com	$2b$12$2PucpK3kXmBnRfmZ6HnFyu6UTheASag.IJDhLb/aUaqB0TVG9wabW	f	f	f	\N	{}	t	2026-11-13 05:29:43.058-06	2026-11-13 05:29:43.048-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-018	$2b$12$RUhP5Y4otfmTfAjrACy79OTvCFnohn9/I7RWzS2cU/zxSliFb0V1C	2026-11-14 05:29:42.274-06	2026-11-13 05:29:43.048-06	[]	0	\N
033da7e2-9328-4eb5-b752-b07926902f88	7f5d900c-f3af-4b29-a627-c5e7e23ae7cc	pinint-679273d6@svr-erp.local	$2b$04$Ybw3v5c1cB75vhol6xIjIuGfr0b.is7YOHsGScVDfgtVrYPuqjKOi	f	f	f	2026-11-13 05:29:24.409-06	{}	t	2026-11-13 05:29:18.59-06	2026-11-12 23:29:26.593248-06	\N	\N	\N	\N	\N	TRA-97519	$2b$12$bD3.ILnD5A8YevSCkicsXOJGCi6NB6qGEVtpCRMaovspMbxLkXdKO	\N	2026-11-13 05:29:26.588-06	["$2b$04$RSXS5SesPzgZkzQ3pkZJi.aB9qqPK3DwGpvpmMwMovutogrVnUAja", "$2b$12$jPgyBQ7g1DGCQcD6106koO5qbdH2FD3sn5jpjNaLOzywYf/KBoYcm"]	0	\N
ff3c99d4-4244-4e11-bfde-c5e7c6ba53c6	e9ef1537-d482-40d5-8f23-6548346602e6	monorol@test.mx	$2b$12$.NQwkacZ3m2yyMbMc2dvy.VjSzbAx/fBoJAexsrOU6S93DhYjx9ma	f	f	f	\N	{}	f	2026-11-14 09:07:33.918-06	2026-11-14 03:07:34.782475-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-14 09:07:34.777-06	MANTENIMIENTO	\N	\N	\N	\N	\N	[]	0	\N
13580b45-482c-4fa0-a53d-a6012f0d2ca3	611c18cf-54db-478b-a102-6482752c8781	tec-015@pwa.svr-constructora.com	$2b$12$DnJbT/1bTPfm3X30s1LfE.ks4HfEg1uEidKJbPUTRPKTXTV50qh4q	f	f	f	\N	{}	t	2026-11-13 05:28:44.325-06	2026-11-13 05:28:44.314-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-015	$2b$12$yaVeczBOBV0Dkuv3P8xyWuRg657oZ5lH5A3sX4e7PgB4Yo9.foN9.	2026-11-14 05:28:43.783-06	2026-11-13 05:28:44.314-06	[]	0	\N
0c52a04a-a7e3-4237-b900-f98ffc3640aa	b0d3d615-8ca6-4be4-be2d-bfcbb7eb152e	tec-023@pwa.svr-constructora.com	$2b$12$Syn/wxiNx12xOtYRgEVxKeF6KOUTTu3L9rSkt1W0RHVG5Vr7KOHEe	f	f	f	\N	{}	t	2026-11-18 22:11:53.063-06	2026-11-18 22:11:53.053-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-023	$2b$12$oyW/U0JyVED77WAckBYrG.SbOY9XNjslvS7ZZPjajSmomWzclkPqW	2026-11-19 22:11:52.682-06	2026-11-18 22:11:53.053-06	[]	0	\N
97ced020-5540-4c86-a8c4-961073eadf51	1d94deb5-0a82-49ec-8082-1c1c25d0802f	pinint-46f93465@svr-erp.local	$2b$04$2ghuKhl.jMJHE8JwHpjSzufqKacSG7Ozy7lcjgRK4cM1mME/Jw/YS	f	f	f	2026-11-18 21:56:26.224-06	{}	t	2026-11-18 21:56:19.076-06	2026-11-18 15:56:27.968924-06	\N	\N	\N	\N	\N	TRA-92681	$2b$12$IYzjvT7T/RYUxo/F2Ew0GOO56a6pTmmhW3cX9Dwi93V2O.QrZJ6PW	\N	2026-11-18 21:56:27.969-06	["$2b$04$Q3yNTVtDYaIdNOjpCA6JVOAAnd8E6O.J6jjGlNyNX0beS8VzJ/6jC", "$2b$12$KhWVlfPH8QZQ22o/6vm3GOoavM9sz9.ARxFIKJajBz4VtQwqw8sTW"]	0	\N
6bc70c28-36e8-49e2-a17a-274ea93064b8	c544fe9a-102d-46e7-8a68-2bec8697adb5	smoke-fase1@test.mx	$2b$12$PckeS9lWMbKv7fPwQIU4/OXJZoQGdHVd0U/v.i7HtopkO4eIIgjti	f	f	f	\N	{}	f	2026-11-14 07:42:18.794-06	2026-11-14 01:42:19.168549-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	2026-11-14 07:42:19.152-06	RESIDENTE	\N	\N	\N	\N	\N	[]	0	\N
390b8c2e-3cce-4999-bbc5-bb5507b92b01	60de16cb-a0ef-4bba-a749-ec84e16f249a	pinint-40fab53c@svr-erp.local	$2b$04$KTr/W1QhFxq5puAcLUwxV.3cVco9PcsE6BOIGMV4Kf49jvLawjL0C	f	f	f	2026-11-13 05:28:29.519-06	{}	t	2026-11-13 05:28:23.099-06	2026-11-12 23:28:31.903203-06	\N	\N	\N	\N	\N	TRA-95881	$2b$12$DnivMHakHUZkCyLyeLE9Pe/Wm4u2obZdv07vAcZA9vj3QD8kuNpZG	\N	2026-11-13 05:28:31.904-06	["$2b$04$3c.RNCXzRVcHWK323ENRfeOH883uprRtwGJ/cpZcZIhD4KkXIRM8W", "$2b$12$t/vcT8QGMazZpqCRLVI.P.jX5kvaw5pTa5xltmNpa/PPRavFbbuz6"]	0	\N
cebcaa3e-1296-47a8-9464-c1088b76dc6c	a3503827-5c9d-4de7-a0ed-9f7bb35b62d0	jefe-inttest-5708df43@svr-erp.local	$2b$12$K.YOOvGpcXiPEKUWQB1q..oOk9EmxYIlRIplXprWg7ErwAWPcgnii	f	f	f	\N	{}	f	2026-11-18 21:57:04.478-06	2026-11-18 15:57:04.584054-06	\N	\N	2026-11-18 21:57:04.581-06	\N	\N	\N	\N	\N	\N	[]	0	\N
1636215e-f649-4570-944a-27094da35e0b	2c3e481f-6b4a-460f-80f6-6d4eef8c3b9e	inttest-5708df43@svr-erp.local	$2b$12$dYmKBAygN6gP9sCJf/PnB.siOC6iicJCWv18J0K6Sgo4JhsXjdfY2	f	f	f	2026-11-18 21:57:03.663-06	{}	f	2026-11-18 21:56:57.058-06	2026-11-18 15:57:04.594639-06	\N	\N	2026-11-18 21:57:04.593-06	\N	\N	EMP-5708df43	\N	\N	\N	[]	0	\N
86069759-4e61-4d55-ac13-aa0c0defeeac	8a2bd7e7-e459-4500-b048-08d917dad0d1	tec-019@pwa.svr-constructora.com	$2b$12$IomqnGB0aZOmcq1DtnIr7uZIlzJMe.tqcYp.h2eXMCNwfFXdLXzq.	f	f	f	\N	{}	t	2026-11-18 21:57:26.226-06	2026-11-18 21:57:26.217-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-019	$2b$12$nZFlEDo4anvPp8CMs8UpgOEVclZD3VjRpnc6RQrLdVJpUHSaVPE6m	2026-11-19 21:57:25.552-06	2026-11-18 21:57:26.217-06	[]	0	\N
85257b98-6be0-432d-bfbc-e0876d916fbe	7e33c7bb-50c6-4cca-a6d2-7b2d05acdebc	inttest-7f56d79b@svr-erp.local	$2b$12$kI1k4SMTib6cJdZXpp49We5jBikzIguFjC/AVkT5YTbXGmRwzDsyS	f	f	f	2026-11-11 21:37:08.78-06	{}	f	2026-11-11 21:36:58.275-06	2026-11-11 20:00:59.413948-06	\N	\N	2026-11-11 21:37:09.67-06	\N	\N	EMP-7f56d79b	\N	\N	2026-11-11 20:00:31.726698-06	[]	0	\N
2ef9bfd8-70f0-4cca-9994-6ddeb0f71835	b4e27116-8bfb-4514-b097-b40bbd86acfb	pinint-89609f7a@svr-erp.local	$2b$04$ZXmmdHvN.P97tFUZvmkDEOqjOsArm3cCmwAQBrJxe47uMF3HJew7q	f	f	f	2026-11-13 05:30:33.159-06	{}	t	2026-11-13 05:30:28.996-06	2026-11-12 23:30:34.722747-06	\N	\N	\N	\N	\N	TRA-98273	$2b$12$s6Y.VyuW6arrMYbqSGBwP.gIjs3TpZ.WuH6kmvewct.UcGelE5XgW	\N	2026-11-13 05:30:34.723-06	["$2b$04$XlHKKw/O10PlnnFmwqM.JeQEbKb9IuNwBdb8yyHp2TpqSgsLxavN6", "$2b$12$XPPIhzss33OjynUzFvw4XuM8Ixc0akMBrK11/CflRYiYP1D.D/qhO"]	0	\N
be44db3f-7b29-4478-9f42-46b49ef4954e	e2a31b35-9b6c-4ae4-a779-ad81370b8f91	jefe-inttest-daf59d98@svr-erp.local	$2b$12$H793mDfyEOJILQ/VAvPQNOte70S6tDjp/NqgT05ewgEGt5ajd7BGG	f	f	f	\N	{}	f	2026-11-18 22:15:10.869-06	2026-11-18 16:15:10.904294-06	\N	\N	2026-11-18 22:15:10.9-06	\N	\N	\N	\N	\N	\N	[]	0	\N
7108b4b4-4d2e-4530-9037-c82eb8513f19	8a065937-0e00-40d1-b152-ac673659114d	tec-012@pwa.svr-constructora.com	$2b$12$npyxByHEeG8NEUQBT8Yqm.xAUtfH98mI5RSLkiZCEMHuew/QRDLXy	f	f	f	\N	{}	t	2026-11-12 05:49:02.643-06	2026-11-12 05:49:02.634-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-012	$2b$12$8UN1bSBx2WfjuQsxQoIrYeEFN4Sqr6us6tNrLprDuPptycpIRw5Pu	2026-11-13 05:49:02.217-06	2026-11-12 05:49:02.634-06	[]	0	\N
3c4f2707-0134-4b1b-b055-1763f787bff1	7e3f3b8a-2d65-4a7d-9ef9-af68f9a72edf	jefe-inttest-d3f818a5@svr-erp.local	$2b$12$aVd.xil5Ot3GSfd8GklF8ezjl9qMN.PVuuXpK2LDNXpLyxi26m/.K	f	f	f	\N	{}	f	2026-11-13 05:29:28.501-06	2026-11-12 23:29:28.543722-06	\N	\N	2026-11-13 05:29:28.534-06	\N	\N	\N	\N	\N	\N	[]	0	\N
07c4522d-09c5-4770-bf09-645a1efd63bd	46975835-75ff-4860-8809-eb030656157b	inttest-d3f818a5@svr-erp.local	$2b$12$6kMR8K..oPv5x6w/tD8y3.a1aT2eJSGFFnz65Xj8P9BpayNOAhr6O	f	f	f	2026-11-13 05:29:27.277-06	{}	f	2026-11-13 05:29:19.552-06	2026-11-12 23:29:28.558346-06	\N	\N	2026-11-13 05:29:28.55-06	\N	\N	EMP-d3f818a5	\N	\N	\N	[]	0	\N
d6eaccc8-8d75-47fe-9658-bfcbe97b2890	bc2fd32b-6bd8-4fb3-9a0c-b69da6015897	adm-002@pwa.svr-constructora.com	$2b$12$LP2q13y4h18Qw6mLOjuqHu2YM5kh4KIxNr3OxP9QGJI4t8.szcJUu	f	f	f	\N	{}	t	2026-11-12 05:20:54.394-06	2026-11-11 23:40:58.277091-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	ADMINISTRATIVO	\N	ADM-002	$2b$12$3xlneoNOA6OExz2hBMP7butl8oYrf.uxqeCSfhO8Ia0kGc.iVxmQm	2026-11-13 05:20:53.95-06	2026-11-12 05:20:54.359-06	[]	0	\N
9dd11e5a-c4d3-4c37-8fc0-57a2370cb42b	6130dee0-2457-4015-8041-ddd8e555da7b	tec-005@pwa.svr-constructora.com	$2b$12$9jce4NWPUzcokkXH9iq4HO7r3UWBQfccGlcX6urkNM5V2cyGpu1Cq	f	f	f	2026-11-11 21:29:21.016-06	{}	t	2026-11-11 21:27:27.194-06	2026-11-11 23:40:58.277091-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MANTENIMIENTO	\N	TEC-005	$2b$12$S0M6puVq36r4pkGPAFKjaungsPQ8tkGsYveX/atim6/v1J7S3.iy.	\N	2026-11-11 21:32:31.699-06	["$2b$12$cCYAbQXUgMChNGHNiDY7zeA5scXmHlLC61ugKYfRq7Ddti2SwhRJ6"]	0	\N
67abc405-e871-41b8-b3f8-a520c6b62a64	0f9b1d74-c46d-474c-bb43-d5d05aa18c20	ramiro.angulo@svr-constructora.com	$2b$12$bLN2ckkTKm6jbKPhJ/4LXeyVxf3xdxO.OF3.rIowffgEdk7dsTuti	f	f	f	\N	{}	t	2026-11-14 08:16:14.49-06	2026-11-14 02:33:15.197073-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	RESIDENTE	\N	\N	\N	\N	\N	[]	0	\N
fbbf58c3-7c88-4787-9dfd-e039a03fb3b0	660c06cb-2d8c-4e5f-8402-cc7ae874290a	saul.osuna@svr-constructora.com	$2b$12$GoFDVCHhbbmUH7BMRxSeAuWdlyBO5wq3ciR6Ae6Tynl1MMg.jrudW	f	f	f	\N	{}	t	2026-11-14 08:16:14.903-06	2026-11-14 02:33:36.756385-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	RESIDENTE	\N	\N	\N	\N	\N	[]	0	\N
e5d4f838-bf6f-4483-b739-283551ab2cfe	970119f7-ea07-41a8-8893-6caec445ef9a	tec-022@pwa.svr-constructora.com	$2b$12$1RhSmDPygan7lZSlJ6AEu.1a5k4LJAFf.7xSoQnISXAJW2RXG2csK	f	f	f	\N	{}	t	2026-11-18 22:03:46.88-06	2026-11-18 22:03:46.873-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-022	$2b$12$HRumXc3hnCHhRXfTEPqP1uNrBgmRzY0ygiqm56jTpBAE6uJ8qPKEK	2026-11-19 22:03:46.467-06	2026-11-18 22:03:46.873-06	[]	0	\N
9e85047e-6c73-49b4-82aa-62290362e50a	199cb9dc-6470-4b2c-925f-b794869d7e1f	tec-013@pwa.svr-constructora.com	$2b$12$S9AggPf1qL7zvmrq.TEJy.m.Gfxx9kaqWoEqVG/12sRAgm1Vxzg42	f	f	f	\N	{}	t	2026-11-12 19:15:12.764-06	2026-11-12 19:15:12.753-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-013	$2b$12$3MbuDsLd5PCK8NetpNU3UOZWJbcOOQfJjrbZe49fYgd9Z04UvcBMO	2026-11-13 19:15:11.993-06	2026-11-12 19:15:12.753-06	[]	0	\N
f3479841-5780-4e92-86ad-640fd7c0796a	3b85a293-49fe-4028-8136-0b05d3d56069	pinint-947460cb@svr-erp.local	$2b$04$JHxOb4pi8315ePuxeTPx6.eG6ns9AM1.h1C7W9vQrHsBTzDXKcbDy	f	f	f	2026-11-12 04:02:31.183-06	{}	t	2026-11-12 04:02:26.964-06	2026-11-11 22:02:32.883264-06	\N	\N	\N	\N	\N	TRA-99415	$2b$12$0kr7GX4R.0KuARrLhZZ5BuxYNT/ytDms.SEeSBxkGY5.YMXnA6Tkq	\N	2026-11-12 04:02:32.873-06	["$2b$04$xOW2LzIMTeXZ8vzylCYEfebepqjpZOWjRqWXdUkc9MNalgpFH9AiG", "$2b$12$PTQ/WPeioNIpK3B0E0yrX.q4HHnVssRdR7YqcJDbuqcBnhtKGGL8S"]	0	\N
f390eeeb-52d1-4f41-bfc7-d1466b5ce8aa	c5c6adb3-4409-4f03-b0ef-a42721d1f3ba	pinint-4480b4b2@svr-erp.local	$2b$04$19jE.MK9N/o4NmEGep5wYegvtmeaGuxzb4T/rviyKqMWfNmgwN1fG	f	f	f	2026-11-11 21:37:03.848-06	{}	t	2026-11-11 21:37:03.746-06	2026-11-14 12:23:04.077979-06	\N	c0000000-0000-0000-0000-000000000001	\N	\N	4ee778b6-b41e-4fce-a5d4-cc36f46177aa	TRA-97260	$2b$12$A6RzfR3fMlUjO2J0.KmaiebWpx5uTeDih8.lsYEbXPA4apqA3vVfa	2026-11-12 21:37:06.522-06	2026-11-11 21:37:06.524-06	["$2b$04$6.goImhaFZ8ZKYf.IkAZv.4R6OAupzhNiTDyt09RRi2Sij2bzpn1i"]	0	\N
cff9d408-3d73-4626-bb2e-b82bb5e1f270	6fba1767-ee0c-4d17-bde8-b0bd1f9c27a5	tec-011@pwa.svr-constructora.com	$2b$12$XAkT8S9T5mYZJwXifHblpuzA4Kwzl6.xfuSBau0g9scJmCCFh0vyy	f	f	f	\N	{}	t	2026-11-12 05:47:37.724-06	2026-11-12 05:47:37.713-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-011	$2b$12$wrunCOzlwOX1igAU30M5deZ8Xvj1fjRk2DBu/e59OGHpKUKk.sD2e	2026-11-13 05:47:37.326-06	2026-11-12 05:47:37.713-06	[]	0	\N
2c6c7827-aeae-4d7a-942c-e6c56e972a14	b0de4f92-1a30-44db-ab1c-73204ee6fde6	inttest-daf59d98@svr-erp.local	$2b$12$DUsHYgUhqp.2zE9fxPDM3uyqkHGuN34UciWZ6LX5U7xlbGGmwElEq	f	f	f	2026-11-18 22:15:09.782-06	{}	f	2026-11-18 22:15:01.952-06	2026-11-18 16:15:10.916129-06	\N	\N	2026-11-18 22:15:10.913-06	\N	\N	EMP-daf59d98	\N	\N	\N	[]	0	\N
e7a2a012-17f5-4ce8-ad22-a5e8cef9b6f4	f1eafcef-bf36-4793-9ba7-562a2c6bd1f1	tec-014@pwa.svr-constructora.com	$2b$12$mfY6ixDrXJKDicM/8Xu31eaoJHMrup7us/C5U4i0RU7jLyLEZ/A9i	f	f	f	\N	{}	t	2026-11-12 19:15:14.633-06	2026-11-12 19:15:14.626-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-014	$2b$12$ZIW4VsXGBrju29qAobA/7OraLzmhyxJNq8ZjsVSaJ3A/4NzuiAsXG	2026-11-13 19:15:14.209-06	2026-11-12 19:15:14.626-06	[]	0	\N
88d0b0da-6b5f-4f3f-8e25-6134aa57dadd	ba3ebb19-bfb5-45f4-a5cb-9255dc156dd3	pinint-145dc769@svr-erp.local	$2b$04$PMJIFfz3T0NIVxHFUd2JCO5JE5IgewAduNvPjnfLLg49hmQ7I1l9i	f	f	f	2026-11-12 02:29:36.763-06	{}	t	2026-11-12 02:29:35.816-06	2026-11-11 20:29:38.759151-06	\N	\N	\N	\N	\N	TRA-97660	$2b$12$2tBA8Z5dzajI9O3g/QN8M.1nteXrmLOeP/4jmhN.V2DgnrvfAEYJG	2026-11-13 02:29:38.758-06	2026-11-12 02:29:38.76-06	["$2b$04$OKyfurR.DvwigYCAU.DYJeK75NZrtStEQyTtloi8vqFanY82TzNPa"]	0	\N
a3be81f0-2a2d-4be9-8b94-7bcafc575cca	6fcded52-39a8-4116-90aa-8a076ae50fa8	inttest-4c1577d0@svr-erp.local	$2b$12$XqtKaoNXrkz72BzrZ4P.OuCLlZV8JZrm8w6Xts2cjp0O2wzNKFWZ6	f	f	f	2026-11-18 22:19:18.643-06	{}	f	2026-11-18 22:19:12.203-06	2026-11-18 16:19:19.579064-06	\N	\N	2026-11-18 22:19:19.577-06	\N	\N	EMP-4c1577d0	\N	\N	\N	[]	0	\N
35572e18-63ff-4831-908a-fc6db0bc3e63	7192b160-07f1-4b74-9588-3ba499431ef3	jefe-inttest-7f56d79b@svr-erp.local	$2b$12$M9OwazW7OAV/eWNI19uvCOykY/xL63pgTqqj5a0Zj6rfmknEhh99u	f	f	f	\N	{}	f	2026-11-11 21:37:09.628-06	2026-11-11 15:37:09.66071-06	\N	\N	2026-11-11 21:37:09.657-06	\N	\N	\N	\N	\N	\N	[]	0	\N
cc2ae4d7-08f0-4b24-9aff-d56e9e8de5a4	e1929bf1-fb7a-44f5-95fe-05d1243887e0	jefe-inttest-81f5ddf2@svr-erp.local	$2b$12$FeL2j84Ja/8jjJAoESI4SOdUkoiEPcBNG0aEp4JpvPDJafV8oNqAi	f	f	f	\N	{}	f	2026-11-13 05:28:34.687-06	2026-11-12 23:28:35.420285-06	\N	\N	2026-11-13 05:28:35.416-06	\N	\N	\N	\N	\N	\N	[]	0	\N
32a1a850-36e1-4ef8-a191-b3184eae9b97	b4e10abe-3fc1-47b4-847f-2d64195b8b61	inttest-81f5ddf2@svr-erp.local	$2b$12$tpXsnboSdQNrOVkT5rHb8egGmY7R8Ayg/hBvKaPCzeNqy6YI9dszG	f	f	f	2026-11-13 05:28:32.764-06	{}	f	2026-11-13 05:28:23.338-06	2026-11-12 23:28:35.432699-06	\N	\N	2026-11-13 05:28:35.43-06	\N	\N	EMP-81f5ddf2	\N	\N	\N	[]	0	\N
4ee778b6-b41e-4fce-a5d4-cc36f46177aa	10767030-6a27-4d63-b8a1-e92b6f8c1765	enrique.lugo@svr-constructora.com	$2b$12$v3E6saU.iMPskC9KVxQIE.5HCZSexKnZ9A9xZnirQ/lsRpyesGshC	f	f	f	\N	{}	t	2026-11-14 08:16:15.295-06	2026-11-14 03:18:29.605745-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	RESIDENTE	\N	\N	\N	\N	\N	[]	0	\N
9c681b42-0cd0-4217-9420-73fa487b1edf	72dc7dde-7083-46de-bffb-c1a8cd500c09	tec-016@pwa.svr-constructora.com	$2b$12$1MAbjQ4WE5Y9Mr7Hfvct1elpbiBpmY4r4.eZDsaLzqXZ9P2uMvmuK	f	f	f	\N	{}	t	2026-11-13 05:28:47.056-06	2026-11-13 05:28:46.854-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-016	$2b$12$x.gwlwDGMGtqvyo.KlRUG.P0lm5xdjUF.KHhm7lMCObM/o9QtEWNm	2026-11-14 05:28:46.284-06	2026-11-13 05:28:46.854-06	[]	0	\N
248e36e4-7ead-4f90-bba3-d2048a6000e5	6e1625dc-d34c-46ad-9e66-ef6ca38fa3d9	tec-021@pwa.svr-constructora.com	$2b$12$m47oUhZpNFTP824TqgW3j.nOeHHwyEc/oyUQggqwIhJyNYN9l0GXC	f	f	f	\N	{}	t	2026-11-18 22:03:45.218-06	2026-11-18 22:03:45.21-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-021	$2b$12$B2FTUNxym4TxK69RDimOL.3qGOSYBtZxm1zR2du2JYU.OJDS1sk.K	2026-11-19 22:03:44.828-06	2026-11-18 22:03:45.21-06	[]	0	\N
dfee621c-582b-43f5-a6d9-2d847f66af43	c020e3f7-b19f-4b59-b253-331b859f0476	tec-020@pwa.svr-constructora.com	$2b$12$0P26eraacTka1SwKv.SZnOy0aj4uGF/eBK0pkSmXTtZO7aNHFgbr.	f	f	f	\N	{}	t	2026-11-18 21:57:28.243-06	2026-11-18 21:57:28.235-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-020	$2b$12$ISHdS1C6vqvw4AKL7rmWIOAEz5rd6vKF5gAeA/68HEQa43LF5wLlq	2026-11-19 21:57:27.842-06	2026-11-18 21:57:28.235-06	[]	0	\N
9a4529a7-87d7-42c6-83d1-2560ee57b51b	316f81a4-70a8-4b6b-8c36-a36e654ba6a9	tec-024@pwa.svr-constructora.com	$2b$12$ZVqULCEDSPVePveBFPhjg.1uvzhcFWBtzvoSaY65MZ/l.CY2uojPi	f	f	f	\N	{}	t	2026-11-18 22:11:54.697-06	2026-11-18 22:11:54.691-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-024	$2b$12$VMbiSqvrwIPFkz7EhwaYNuBzIb8RwHqEFKInYjYbkhiZSiQyK6rcy	2026-11-19 22:11:54.307-06	2026-11-18 22:11:54.691-06	[]	0	\N
03c7c8a7-e4e7-4362-b51b-72c3da427534	0a6f75fa-64d4-4a7b-8f1c-b2a734182202	pinint-53cefceb@svr-erp.local	$2b$04$vXp.y1/6QBy9qhTKL7hWoOxzmakvie2E9WRf/LlSNmb1zQhVY131G	f	f	f	2026-11-18 22:13:25.537-06	{}	t	2026-11-18 22:13:21.391-06	2026-11-18 16:13:27.120263-06	\N	\N	\N	\N	\N	TRA-94933	$2b$12$QmJBWQmXvgT3ngli6kLxzunZg9gGKdWdeg/4EmD15F8xJh5mOUszG	\N	2026-11-18 22:13:27.12-06	["$2b$04$Wc3U9U/M0D.EkE.44sROEOk61tSFCqigxJ4KVdkWACFEiAmmP2a4e", "$2b$12$DZF09Kj/IoPmN2a511AJ/O42uo3zyuZ3zHkH2WQm6EXkH7m1ekUZ2"]	0	\N
cb8995da-ac6d-48a8-a890-55b6c9110350	f45986ee-328a-4c87-ae5d-edea35330d83	tec-028@pwa.svr-constructora.com	$2b$12$YQBkBLPMdys1VOvSSLfju.KPiohD4YnvTyqDKYJue56jrnwLDcHO.	f	f	f	\N	{}	t	2026-11-18 22:15:24.019-06	2026-11-18 22:15:24.009-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-028	$2b$12$UMqhzCJfULjRj0PyoDcfTuvO/n93Us4rY12JgSEcevkoUACTXfyJK	2026-11-19 22:15:23.318-06	2026-11-18 22:15:24.009-06	[]	0	\N
25414317-97b2-447d-83d2-0d09750dfc77	85b03832-68e8-4b20-b731-d67e2108f7d1	pinint-f5ffd367@svr-erp.local	$2b$04$zkdPC3sp1Yy2q/K6AZ2icOV8pP7l6idlUFdY9DMvZ9grhvMBBrg6W	f	f	f	2026-11-18 22:10:15.953-06	{}	t	2026-11-18 22:10:11.958-06	2026-11-18 16:10:17.470268-06	\N	\N	\N	\N	\N	TRA-92355	$2b$12$ewcWGENJLoRrjGNUalDcb.14OPfP6Qs6rK3WYmDKpUPs2aH6V4Kt.	\N	2026-11-18 22:10:17.47-06	["$2b$04$twQTxT0yZ.57UrUEnD6zHOYu74JKyaoMTPAd4Vx56F2R8BHP.LkWK", "$2b$12$NyHL7Y2TorpE2Chzbm4EfeUFBL4wp/40SFgYGEjH6xa4JjNxNYxdm"]	0	\N
578b9231-001f-43b5-8367-b4ed78b0d25f	9757f966-6236-45c7-8f34-bf074cca0396	pinint-4fa95c63@svr-erp.local	$2b$04$7A.l.kQAyFog/EmrjEKmwuIYHBhMNlpQAz6GpleIQJsrlfQAfFBJi	f	f	f	2026-11-18 22:13:56.002-06	{}	t	2026-11-18 22:13:49.854-06	2026-11-18 16:13:58.201989-06	\N	\N	\N	\N	\N	TRA-92015	$2b$12$b8Xl5M0nILYxkhtISeYxa.yOPXZCIN3qE5ppCcmGExHAlSjij/WRG	\N	2026-11-18 22:13:58.202-06	["$2b$04$eBcruCq3EIx6YivEt0yKP.E79EqZhHTTMQNv2A5Uz9AUBT/C.Nxt.", "$2b$12$Pam1UmsaRXzLSueItiHSaeCzYIJM5vA0tRD91XIo9uMwndfFciAQ6"]	0	\N
aa906de7-893d-4e2e-9a63-3b404a1623b1	d2a891b2-23d6-477d-89e9-1ea8639823bc	pinint-8beda5f9@svr-erp.local	$2b$04$nnOiTn1d3p7AbI4gJsJy4OsOQ.cSm6ioBrdS4fGTkJU.mqb.eEV3q	f	f	f	2026-11-18 22:19:17.836-06	{}	t	2026-11-18 22:19:13.428-06	2026-11-18 16:19:19.588324-06	\N	\N	\N	\N	\N	TRA-93608	$2b$12$DKZg.a8w1hPVT8CywAwJ3OfTPdnp7uJHDnfEsTJMtjwnFoVoi4fEu	\N	2026-11-18 22:19:19.587-06	["$2b$04$KDEaBXDBr47n./ziGHOYI.YQjFZso0JldVUqjqL2N7xd6VHbTea2q", "$2b$12$/qnpzGVSsrgv//rJfgRqguo1SURG2VZi1PxidGhrzwBUjIyIB4EgC"]	0	\N
70f47661-017b-4252-9afb-c9f55936edba	d468b18a-cc37-4556-bd0d-a14881cb64c0	tec-027@pwa.svr-constructora.com	$2b$12$Ue.sKOPkQKzbCh0JloT1.eR4cwRHcUcxCbDaC1.2VgkduxQ4MvpSy	f	f	f	\N	{}	t	2026-11-18 22:15:21.07-06	2026-11-18 22:15:21.057-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-027	$2b$12$pTyUhIpJCEkjRxKr6rd6IuEAn8LGEH2B0AzzhYO81AY5NitmAjXv2	2026-11-19 22:15:20.19-06	2026-11-18 22:15:21.057-06	[]	0	\N
37f6cdef-9250-4ba4-95d1-b0b2c23f656f	6a67fc81-fff7-4bc7-b671-6a5964a09ac3	tec-030@pwa.svr-constructora.com	$2b$12$yN0Qb3SpW9xQy4oKo2YfBOB6VUfWbFWAuAC6e56Yj1tDTnrM/L/Ka	f	f	f	\N	{}	t	2026-11-18 22:19:32.684-06	2026-11-18 22:19:32.674-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-030	$2b$12$G900dEa8H7HrxRtysTFpy.jVaVMONR3Nc1Mkso3Rp63VMO1xk3o0e	2026-11-19 22:19:32.075-06	2026-11-18 22:19:32.674-06	[]	0	\N
91e80e61-2106-4dfe-8180-4b08e2279e27	a487bfee-2232-4dd1-b1d0-10dff104bd9f	inttest-4e6df254@svr-erp.local	$2b$12$D220181w/jm5OwFldl3zxu2DNyQoKXZepu2VBtE8Z6IaYrdJA8pwi	f	f	f	2026-11-18 22:14:12.966-06	{}	f	2026-11-18 22:14:05.805-06	2026-11-18 16:14:14.222404-06	\N	\N	2026-11-18 22:14:14.221-06	\N	\N	EMP-4e6df254	\N	\N	\N	[]	0	\N
926ab1bd-6747-4e53-971b-8f6e74dad9fe	200ef9ae-3b79-41f7-8399-866335e16678	tec-026@pwa.svr-constructora.com	$2b$12$2IrzfLaQrwQL/PzCuujkTOIFGAZjg.YdUQEezxw1UI/bfUzQHO6UG	f	f	f	\N	{}	t	2026-11-18 22:14:16.534-06	2026-11-18 22:14:16.517-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-026	$2b$12$48kQ4etf5F.XH4lQJ3md4.z5bQMJGSxelcHCf8dwEcjDB8mKEo7Zu	2026-11-19 22:14:15.748-06	2026-11-18 22:14:16.517-06	[]	0	\N
a4bae114-1ebd-4958-a4fe-08faef451d57	6f22df4a-061c-4efd-9a7c-5b3a4fca5cf2	tec-029@pwa.svr-constructora.com	$2b$12$UsUXwXkEuCczxlaJ1vSKk.xbSNGiRf41Shvy8byZ2mA0dLpGDT40K	f	f	f	\N	{}	t	2026-11-18 22:19:29.782-06	2026-11-18 22:19:29.772-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-029	$2b$12$oHcLChOIwpYTPzYOXsk45uO218kw3BkdX4CoGRwx2KbyPd3bUjU16	2026-11-19 22:19:29.02-06	2026-11-18 22:19:29.772-06	[]	0	\N
6e7b06b7-a1e7-4389-baa7-731a9b85b1ba	c621cc22-f70e-4d6c-8027-4d7a8c9c8e2f	tec-025@pwa.svr-constructora.com	$2b$12$BID9zUuVxXpj.y/OVb0bKOnKYX7xVO7uJ/pA1XczoZZTrBASbFe5e	f	f	f	\N	{}	t	2026-11-18 22:14:13.574-06	2026-11-18 22:14:13.564-06	c0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	\N	MECANICO	\N	TEC-025	$2b$12$9y0W6jiZOgrYVw77DG1dw.PB/tlR.tuoFArFxtmQzml8YiX/8IM72	2026-11-19 22:14:13.01-06	2026-11-18 22:14:13.564-06	[]	0	\N
9062fa7b-0dc2-48b0-8794-ce347dae8283	23bf7875-c6bb-40f7-9ca3-c01316444fa0	jefe-inttest-4e6df254@svr-erp.local	$2b$12$kD6HIDomvVY0fyExwz00ueN8MDxvq6FXrpEqr1OmvPfs7COliaUli	f	f	f	\N	{}	f	2026-11-18 22:14:14.177-06	2026-11-18 16:14:14.209438-06	\N	\N	2026-11-18 22:14:14.206-06	\N	\N	\N	\N	\N	\N	[]	0	\N
84badd53-38e0-476c-981b-1844ebc7aafc	2fd2e132-8409-490c-a238-fcdc81514bc6	pinint-3b394eb9@svr-erp.local	$2b$04$W/4nJBuQip0YAbVwnnkiQuQe1IRnR/l6Bf0Lx2HGajfCUFBI3WykS	f	f	f	2026-11-18 22:15:05.557-06	{}	t	2026-11-18 22:14:59.627-06	2026-11-18 16:15:07.82942-06	\N	\N	\N	\N	\N	TRA-98929	$2b$12$KZTRrsBVJOwtri6Oavxucur1bVqF25LLV3vlVlSUuHqL2FWhDIPX2	\N	2026-11-18 22:15:07.83-06	["$2b$04$uyzslf2BCsOrj0rKk06CseDvHSDgbeGCnSJI9rUVFs7N5.nhzMisu", "$2b$12$9NSs2M0OaWIvNMq3EzJPh.HJxdOjmgzqs6UZ3TCwe/wuBLLPv0hAC"]	0	\N
\.


--
-- Data for Name: users_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users_roles (id, user_id, rol_id, es_principal, asignado_en, asignado_por, activo) FROM stdin;
d0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000001	a0000000-0000-0000-0000-000000000001	t	2026-11-03 18:51:00.023-06	\N	t
da305432-b861-472f-949d-1845c5f49c61	e2000000-0000-0000-0000-0000000000a1	e0000000-0000-0000-0000-0000000000a1	t	2026-11-08 18:57:26.5543-06	\N	t
76671957-07be-445e-83be-f1b9f41b7989	e2000000-0000-0000-0000-0000000000a2	e0000000-0000-0000-0000-0000000000a2	t	2026-11-08 18:57:26.5543-06	\N	t
3ef10880-1c74-4774-8135-c4d9b3737ca6	ff3c99d4-4244-4e11-bfde-c5e7c6ba53c6	e0000000-0000-0000-0000-0000000000a2	t	2026-11-14 09:07:33.918-06	c0000000-0000-0000-0000-000000000001	f
dd86ceaf-9d8e-4158-8901-59e53aea77db	e2000000-0000-0000-0000-0000000000a4	e0000000-0000-0000-0000-0000000000a4	t	2026-11-08 18:57:26.5543-06	\N	t
86eb55ed-3717-4e77-a279-bb75365a414c	e2000000-0000-0000-0000-0000000000a5	e0000000-0000-0000-0000-0000000000a5	t	2026-11-08 18:57:26.5543-06	\N	t
45a77eb7-c623-4c42-bc54-0950a71ad1f9	ff3c99d4-4244-4e11-bfde-c5e7c6ba53c6	e0000000-0000-0000-0000-0000000000a4	t	2026-11-14 09:07:34.05-06	c0000000-0000-0000-0000-000000000001	t
a3912b18-dd2f-4973-af25-e948b4ef239a	e2000000-0000-0000-0000-0000000000c1	e0000000-0000-0000-0000-0000000000a5	t	2026-11-09 03:01:24.029896-06	\N	t
8ae638c2-3794-4620-a572-502bc1946126	e2000000-0000-0000-0000-0000000000c2	e0000000-0000-0000-0000-0000000000a5	t	2026-11-09 03:01:24.029896-06	\N	t
724fa3b9-f368-4bc8-9756-5fa6ea4a2218	7108b4b4-4d2e-4530-9037-c82eb8513f19	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-12 05:49:02.645-06	c0000000-0000-0000-0000-000000000001	t
bf199411-0fea-4b7b-88b2-e8fa0485dd63	6bc70c28-36e8-49e2-a17a-274ea93064b8	e0000000-0000-0000-0000-0000000000a2	t	2026-11-14 07:42:18.794-06	c0000000-0000-0000-0000-000000000001	t
ddbe7931-41f2-4ba6-a439-742e16146668	6bc70c28-36e8-49e2-a17a-274ea93064b8	e0000000-0000-0000-0000-0000000000a1	f	2026-11-14 07:42:19.043-06	c0000000-0000-0000-0000-000000000001	f
82ec4230-2630-436d-ac2e-0ee7fafb85cf	0c52a04a-a7e3-4237-b900-f98ffc3640aa	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-18 22:11:53.065-06	c0000000-0000-0000-0000-000000000001	t
76d5892c-6f84-432e-933b-88c1910c8151	9a4529a7-87d7-42c6-83d1-2560ee57b51b	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-18 22:11:54.7-06	c0000000-0000-0000-0000-000000000001	t
9f75f98b-110d-4e59-b70b-e01891d79a41	dfee621c-582b-43f5-a6d9-2d847f66af43	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-18 21:57:28.245-06	c0000000-0000-0000-0000-000000000001	t
f1302aa3-c6ac-4375-bd27-cd92b085350a	9e85047e-6c73-49b4-82aa-62290362e50a	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-12 19:15:12.768-06	c0000000-0000-0000-0000-000000000001	t
f4711a25-270d-4c05-8863-65aa34ec18e2	e7a2a012-17f5-4ce8-ad22-a5e8cef9b6f4	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-12 19:15:14.636-06	c0000000-0000-0000-0000-000000000001	t
64451201-e7ff-4b59-94ad-3f84b064cd23	d6eaccc8-8d75-47fe-9658-bfcbe97b2890	e0000000-0000-0000-0000-0000000000a1	t	2026-11-12 05:20:54.398-06	c0000000-0000-0000-0000-000000000001	t
89720490-06bb-404c-8387-33c493484f33	e2000000-0000-0000-0000-0000000000b1	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-09 00:11:52.972976-06	\N	t
7b08bef2-3c6e-4ec2-b130-92885b23e00a	e2000000-0000-0000-0000-0000000000b2	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-09 00:11:52.972976-06	\N	t
a330c49f-2784-49c6-93ca-9d4f43c63fa7	e2000000-0000-0000-0000-0000000000b3	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-09 00:11:52.972976-06	\N	t
1f274104-3a24-450f-b01c-1d66d997d4ae	e2000000-0000-0000-0000-0000000000a3	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-09 00:11:52.972976-06	\N	t
aaf1c646-a29c-4cfe-9c0e-5c7cce584e41	9dd11e5a-c4d3-4c37-8fc0-57a2370cb42b	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-11 21:27:27.197-06	c0000000-0000-0000-0000-000000000001	t
f0000000-0000-0000-0000-000000000030	f0000000-0000-0000-0000-000000000020	e0000000-0000-0000-0000-0000000000a1	t	2026-11-03 18:51:00.079-06	\N	t
bdcbfeee-d881-4a20-9532-f369e63917ba	a4bae114-1ebd-4958-a4fe-08faef451d57	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-18 22:19:29.784-06	c0000000-0000-0000-0000-000000000001	t
69de867f-9aa9-4a6d-ae5e-4a686d9c82f6	37f6cdef-9250-4ba4-95d1-b0b2c23f656f	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-18 22:19:32.686-06	c0000000-0000-0000-0000-000000000001	t
6f342dca-1dd1-4dd5-83dc-1c31dcd39bca	67abc405-e871-41b8-b3f8-a520c6b62a64	e0000000-0000-0000-0000-0000000000a2	t	2026-11-14 08:16:14.49-06	c0000000-0000-0000-0000-000000000001	t
82cb4ea7-8462-46ab-b8ac-9832598ab0ce	fbbf58c3-7c88-4787-9dfd-e039a03fb3b0	e0000000-0000-0000-0000-0000000000a2	t	2026-11-14 08:16:14.903-06	c0000000-0000-0000-0000-000000000001	t
cd091425-2c3e-4321-96ec-e7425c16225e	4ee778b6-b41e-4fce-a5d4-cc36f46177aa	e0000000-0000-0000-0000-0000000000a2	t	2026-11-14 08:16:15.295-06	c0000000-0000-0000-0000-000000000001	t
4265e566-3086-4c1e-a7fe-0295cb897a19	17b8e737-5e4f-4163-8273-31968af61972	e0000000-0000-0000-0000-0000000000a2	t	2026-11-14 08:39:55.848-06	c0000000-0000-0000-0000-000000000001	t
236b68a3-f93d-4a3f-bf49-4ff8726ed03b	6e7b06b7-a1e7-4389-baa7-731a9b85b1ba	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-18 22:14:13.576-06	c0000000-0000-0000-0000-000000000001	t
6e6e47ff-be1a-4383-b034-b4a61061887e	13580b45-482c-4fa0-a53d-a6012f0d2ca3	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-13 05:28:44.327-06	c0000000-0000-0000-0000-000000000001	t
deedb8da-dfb6-40ca-8b7f-b5cbdda4d553	cff9d408-3d73-4626-bb2e-b82bb5e1f270	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-12 05:47:37.727-06	c0000000-0000-0000-0000-000000000001	t
5f9c0195-e8a0-448b-966c-65c47a335e4b	9c681b42-0cd0-4217-9420-73fa487b1edf	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-13 05:28:47.069-06	c0000000-0000-0000-0000-000000000001	t
c681c5b9-dcba-41b1-a036-0e5efa783e51	86069759-4e61-4d55-ac13-aa0c0defeeac	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-18 21:57:26.228-06	c0000000-0000-0000-0000-000000000001	t
134d6a0c-7ace-4a2a-8e49-44b9080836bf	926ab1bd-6747-4e53-971b-8f6e74dad9fe	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-18 22:14:16.537-06	c0000000-0000-0000-0000-000000000001	t
df8d9826-a1b2-4a69-8877-4513ff7a6b8c	b84c55d8-bfd3-4c9a-a2f9-dddd7cb64029	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-13 05:29:39.946-06	c0000000-0000-0000-0000-000000000001	t
e88d0391-4756-48ba-b560-e334bfe3beae	801c39ff-929e-4fff-a79d-aa741af7c216	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-13 05:29:43.06-06	c0000000-0000-0000-0000-000000000001	t
30e88496-4147-4d82-9367-f15782be4b7f	248e36e4-7ead-4f90-bba3-d2048a6000e5	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-18 22:03:45.22-06	c0000000-0000-0000-0000-000000000001	t
7f0482f5-9985-4878-8114-89d94caa099e	e5d4f838-bf6f-4483-b739-283551ab2cfe	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-18 22:03:46.882-06	c0000000-0000-0000-0000-000000000001	t
87a3ca84-d181-45ba-8a7b-514c41db7b1f	70f47661-017b-4252-9afb-c9f55936edba	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-18 22:15:21.072-06	c0000000-0000-0000-0000-000000000001	t
1daf3bd2-5894-47d1-a8b0-99ce62695493	cb8995da-ac6d-48a8-a890-55b6c9110350	82eb4e1b-8676-48b2-a42d-236707587af5	t	2026-11-18 22:15:24.022-06	c0000000-0000-0000-0000-000000000001	t
\.


--
-- Data for Name: ventas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ventas (id, folio, ticket, terminal, caja, cliente, cajero, subtotal, iva, ieps, total, metodo, efectivo_recibido, cambio, descuento_pct, descuento_total, autorizado_por, items_count, creado_en, actualizado_en, creado_por, eliminado_en, idempotencia_key, cliente_id) FROM stdin;
4a6dd2db-a9bc-4d4c-bb2a-0f89468b3816	S17941004220715557	1	TER-01	CAJA-PV	Público en general	Carlos SVR	1293.60	246.40	0.00	1540.00	EFECTIVO	1424.00	500.00	\N	\N	\N	2	2026-11-08 01:13:42.107-06	2026-11-08 01:13:42.071-06	c0000000-0000-0000-0000-000000000001	\N	DEMO-F6-venta-hoy	\N
dc20f301-5f75-483d-883d-39d4df701453	S17941687194023490	2	TER-01	CAJA-PV	Público en general	Carlos SVR	739.20	140.80	0.00	880.00	EFECTIVO	1000.00	120.00	\N	\N	\N	1	2026-11-08 20:11:59.43-06	2026-11-08 20:11:59.402-06	c0000000-0000-0000-0000-000000000001	\N	f0be2bb8-bf8e-4ae3-9058-16dd96b37a2d	\N
da59df97-4967-4eff-993c-ca8356a5b2ac	S17945542587725703	1	TER-01	CAJA-PV	Peluqueria Smoke	Smoke B3	294.00	56.00	0.00	350.00	EFECTIVO	\N	\N	\N	\N	\N	1	2026-11-13 07:17:38.793-06	2026-11-13 07:17:38.772-06	c0000000-0000-0000-0000-000000000001	\N	d2fe3557-d7bd-49aa-b339-ef6316006ee0	a8185226-0a28-4b32-8858-d0ba902d38d2
74111a36-21f5-4e76-bfc3-9e474ac0c02b	S17945542588551599	2	TER-01	CAJA-PV	Público en general	Smoke B3	294.00	56.00	0.00	350.00	EFECTIVO	\N	\N	\N	\N	\N	1	2026-11-13 07:17:38.858-06	2026-11-13 07:17:38.855-06	c0000000-0000-0000-0000-000000000001	\N	5037e730-912e-4529-8115-83efcf9474a9	\N
f21b2c3b-eef1-4cf3-ab23-1e5b767e9b67	S17945551499275925	3	TER-01	CAJA-PV	Público en general	Carlos SVR	302.40	57.60	0.00	360.00	EFECTIVO	500.00	140.00	\N	\N	\N	1	2026-11-13 07:32:29.935-06	2026-11-13 07:32:29.927-06	c0000000-0000-0000-0000-000000000001	\N	8b2451e8-9563-4689-89e8-396fe44c9e4d	\N
\.


--
-- Data for Name: ventas_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ventas_items (id, venta_id, articulo_id, nombre, cantidad, medida, precio_unitario, subtotal, descuento_pct, creado_en) FROM stdin;
c6e3c3b6-9261-4371-b4cd-0954d33d569b	4a6dd2db-a9bc-4d4c-bb2a-0f89468b3816	c2000000-0000-0000-0000-000000000001	Arena de río	2.00	m³	350.00	700.00	\N	2026-11-08 01:13:42.107-06
7374aeb8-3069-475f-8dd5-53179707ed67	4a6dd2db-a9bc-4d4c-bb2a-0f89468b3816	c2000000-0000-0000-0000-000000000002	Grava 3/4"	2.00	m³	420.00	840.00	\N	2026-11-08 01:13:42.107-06
39f10d02-20ed-4bf2-95ff-f10b044dd389	dc20f301-5f75-483d-883d-39d4df701453	c2000000-0000-0000-0000-000000000012	Cal hidratada (bolsa)	16.00	bolsa	55.00	880.00	\N	2026-11-08 20:11:59.43-06
ebef2bc1-c782-4153-b862-894b159a6229	da59df97-4967-4eff-993c-ca8356a5b2ac	c2000000-0000-0000-0000-000000000001	Arena de río	1.00	m³	350.00	350.00	\N	2026-11-13 07:17:38.793-06
c892d4f8-536d-4447-8a89-f7800a067742	74111a36-21f5-4e76-bfc3-9e474ac0c02b	c2000000-0000-0000-0000-000000000001	Arena de río	1.00	m³	350.00	350.00	\N	2026-11-13 07:17:38.858-06
5b817e6f-6da3-4403-9202-8f135fa17aab	f21b2c3b-eef1-4cf3-ab23-1e5b767e9b67	c2000000-0000-0000-0000-000000000007	Tepetate	2.00	m³	180.00	360.00	\N	2026-11-13 07:32:29.935-06
\.


--
-- Data for Name: ventas_pagos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ventas_pagos (id, venta_id, metodo, monto, creado_en) FROM stdin;
443d5b66-e4d1-4b14-b03e-06693f357920	4a6dd2db-a9bc-4d4c-bb2a-0f89468b3816	EFECTIVO	924.00	2026-11-08 01:13:42.107-06
c7a7f037-c63d-4e56-98dd-e47ee9c69c42	4a6dd2db-a9bc-4d4c-bb2a-0f89468b3816	TARJETA	616.00	2026-11-08 01:13:42.107-06
0ef5db24-7779-4a6e-8a4c-d8cb3cf73c58	dc20f301-5f75-483d-883d-39d4df701453	EFECTIVO	880.00	2026-11-08 20:11:59.43-06
f783b489-739c-4324-bfc7-fe3e7f0b3c9f	da59df97-4967-4eff-993c-ca8356a5b2ac	EFECTIVO	350.00	2026-11-13 07:17:38.793-06
cb3c2179-58aa-4b3f-b8b8-04c44ffae9fd	74111a36-21f5-4e76-bfc3-9e474ac0c02b	EFECTIVO	350.00	2026-11-13 07:17:38.858-06
481f6580-518b-435d-b552-2c6015ca281c	f21b2c3b-eef1-4cf3-ab23-1e5b767e9b67	EFECTIVO	360.00	2026-11-13 07:32:29.935-06
\.


--
-- Data for Name: vistas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vistas (id, nombre, descripcion, ruta, icono, orden, vista_padre_id, es_menu, es_visible, requiere_auth, target, badges, metadata, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
bb000001-0000-0000-0000-000000000001	Dashboard	\N	/dashboard	LayoutDashboard	1	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000002-0000-0000-0000-000000000001	Trabajadores	\N	/trabajadores	Users	10	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000002-0000-0000-0000-000000000002	Asistencia	\N	/asistencia	Clock	11	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000002-0000-0000-0000-000000000003	Nomina	\N	/nomina	Banknote	12	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000003-0000-0000-0000-000000000001	Flota	\N	/maquinaria	Truck	20	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000003-0000-0000-0000-000000000002	Horometro	\N	/horometro	Timer	21	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000003-0000-0000-0000-000000000003	Mantenimiento	\N	/mantenimiento	Wrench	22	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000003-0000-0000-0000-000000000004	Combustible	\N	/combustible	Fuel	23	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000003-0000-0000-0000-000000000005	GPS	\N	/gps	MapPin	24	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000004-0000-0000-0000-000000000001	Operaciones	\N	/operaciones	ClipboardList	30	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000004-0000-0000-0000-000000000003	Criba	\N	/criba	Layers	32	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000004-0000-0000-0000-000000000004	Inventario	\N	/inventario	Package	33	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000005-0000-0000-0000-000000000001	Clientes	\N	/clientes	Building2	40	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000005-0000-0000-0000-000000000002	Cotizaciones	\N	/cotizaciones	FileText	41	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000005-0000-0000-0000-000000000003	Finanzas	\N	/finanzas	Banknote	42	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000005-0000-0000-0000-000000000004	Proveedores	\N	/proveedores	Truck	43	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000005-0000-0000-0000-000000000005	Punto de Venta	\N	/ventas	ShoppingCart	44	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000005-0000-0000-0000-000000000006	Cobranza	\N	/cobranza	CreditCard	45	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000006-0000-0000-0000-000000000001	Documentacion	\N	/documentos	FileBadge	50	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000006-0000-0000-0000-000000000004	Configuracion	\N	/configuracion	Settings	53	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-03 18:51:00.057-06	\N	\N	\N
bb000005-0000-0000-0000-000000000007	Cierre de Caja	\N	/ventas/corte	ReceiptText	46	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:53:53.959-06	2026-11-03 18:53:53.959-06	\N	\N	\N
bb000005-0000-0000-0000-000000000008	Facturas	\N	/facturas	Receipt	47	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:53:54.478-06	2026-11-03 18:53:54.478-06	\N	\N	\N
bb000006-0000-0000-0000-000000000002	Reportes	\N	/reportes	AlertTriangle	26	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-04 16:59:56.580532-06	\N	\N	\N
90000000-0000-0000-0000-000000000011	Corte del día (móvil)	Corte de caja del día	/m/corte	Calculator	910	\N	f	t	t	_self	[]	{}	t	2026-11-10 20:25:24.225768-06	2026-11-10 20:25:24.225768-06	\N	\N	\N
90000000-0000-0000-0000-000000000007	Flota y obras (móvil)	Flota y obras con ubicación	/m/flota-obras	Truck	906	\N	f	t	t	_self	[]	{}	t	2026-11-10 20:25:24.225768-06	2026-11-10 20:25:24.225768-06	\N	\N	\N
90000000-0000-0000-0000-000000000004	Contactos (móvil)	Contactos y mesa de ayuda	/m/contactos	Phone	903	\N	f	t	t	_self	[]	{}	t	2026-11-10 20:25:24.225768-06	2026-11-10 20:25:24.225768-06	\N	\N	\N
90000000-0000-0000-0000-000000000010	Punto de venta (móvil)	POS de la criba	/m/pos	CreditCard	909	\N	f	t	t	_self	[]	{}	t	2026-11-10 20:25:24.225768-06	2026-11-10 20:25:24.225768-06	\N	\N	\N
90000000-0000-0000-0000-000000000013	Módulos (móvil)	Todos los módulos del sistema	/m/modulos	LayoutGrid	912	\N	f	t	t	_self	[]	{}	t	2026-11-10 20:25:24.225768-06	2026-11-10 20:25:24.225768-06	\N	\N	\N
90000000-0000-0000-0000-000000000003	Reportes (móvil)	Reportes de campo del rol	/m/reportes	AlertTriangle	902	\N	f	t	t	_self	[]	{}	t	2026-11-10 20:25:24.225768-06	2026-11-10 20:25:24.225768-06	\N	\N	\N
90000000-0000-0000-0000-000000000012	Finanzas (móvil)	Flujo y movimientos	/m/finanzas	Wallet	911	\N	f	t	t	_self	[]	{}	t	2026-11-10 20:25:24.225768-06	2026-11-10 20:25:24.225768-06	\N	\N	\N
90000000-0000-0000-0000-000000000001	Inicio (móvil)	Pantalla de inicio del rol	/m	Home	900	\N	f	t	t	_self	[]	{}	t	2026-11-10 20:25:24.225768-06	2026-11-10 20:25:24.225768-06	\N	\N	\N
90000000-0000-0000-0000-000000000002	Asistencia (móvil)	Marcaje con foto y GPS	/m/asistencia	ClipboardCheck	901	\N	f	t	t	_self	[]	{}	t	2026-11-10 20:25:24.225768-06	2026-11-10 20:25:24.225768-06	\N	\N	\N
90000000-0000-0000-0000-000000000009	Diésel (móvil)	Reparto y cargas de diésel	/m/diesel	Fuel	908	\N	f	t	t	_self	[]	{}	t	2026-11-10 20:25:24.225768-06	2026-11-10 20:25:24.225768-06	\N	\N	\N
90000000-0000-0000-0000-000000000005	Mi perfil (móvil)	Perfil y documentos personales	/m/perfil	User	904	\N	f	t	t	_self	[]	{}	t	2026-11-10 20:25:24.225768-06	2026-11-10 20:25:24.225768-06	\N	\N	\N
90000000-0000-0000-0000-000000000008	Inventario (móvil)	Inventario con tabs y stock	/m/inventario	Boxes	907	\N	f	t	t	_self	[]	{}	t	2026-11-10 20:25:24.225768-06	2026-11-10 20:25:24.225768-06	\N	\N	\N
90000000-0000-0000-0000-000000000006	Obras (móvil)	Obras con ubicación	/m/obras	Building2	905	\N	f	t	t	_self	[]	{}	t	2026-11-10 20:25:24.225768-06	2026-11-10 20:25:24.225768-06	\N	\N	\N
bb000004-0000-0000-0000-000000000005	Obras	\N	/proyectos	HardHat	34	\N	t	t	t	_self	[]	{}	t	2026-11-03 18:51:00.057-06	2026-11-12 22:53:15.169735-06	\N	\N	\N
bb000006-0000-0000-0000-000000000005	Usuarios	Alta y gestión de usuarios con acceso a la app de escritorio	/usuarios	UserCog	51	\N	t	t	t	_self	[]	{}	t	2026-11-14 01:23:19.386983-06	2026-11-14 01:23:19.386983-06	\N	\N	\N
bb000006-0000-0000-0000-000000000006	Equipos	Enlace de residentes con sus trabajadores (jefe_user_id)	/equipos	UsersRound	52	\N	t	t	t	_self	[]	{}	t	2026-11-14 01:55:07.470101-06	2026-11-14 01:55:07.470101-06	\N	\N	\N
bb000006-0000-0000-0000-000000000007	Gestión de Identidad	Roles, vistas, permisos, áreas, PIN y sesiones por usuario	/roles	ShieldCheck	54	\N	t	t	t	_self	[]	{}	t	2026-11-14 11:16:35.955265-06	2026-11-14 11:16:35.955265-06	\N	\N	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: alertas_gps alertas_gps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertas_gps
    ADD CONSTRAINT alertas_gps_pkey PRIMARY KEY (id);


--
-- Name: aperturas_caja aperturas_caja_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aperturas_caja
    ADD CONSTRAINT aperturas_caja_pkey PRIMARY KEY (id);


--
-- Name: apu_items apu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apu_items
    ADD CONSTRAINT apu_items_pkey PRIMARY KEY (id);


--
-- Name: apu_templates apu_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apu_templates
    ADD CONSTRAINT apu_templates_pkey PRIMARY KEY (id);


--
-- Name: articulos_inventario articulos_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos_inventario
    ADD CONSTRAINT articulos_inventario_pkey PRIMARY KEY (id);


--
-- Name: articulos_precio articulos_precio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos_precio
    ADD CONSTRAINT articulos_precio_pkey PRIMARY KEY (id);


--
-- Name: asistencias_semanales asistencias_semanales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias_semanales
    ADD CONSTRAINT asistencias_semanales_pkey PRIMARY KEY (id);


--
-- Name: bancos bancos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bancos
    ADD CONSTRAINT bancos_pkey PRIMARY KEY (id);


--
-- Name: bitacoras_operacion bitacoras_operacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacoras_operacion
    ADD CONSTRAINT bitacoras_operacion_pkey PRIMARY KEY (id);


--
-- Name: bitacoras_renta_diaria bitacoras_renta_diaria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacoras_renta_diaria
    ADD CONSTRAINT bitacoras_renta_diaria_pkey PRIMARY KEY (id);


--
-- Name: cargas_combustible cargas_combustible_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cargas_combustible
    ADD CONSTRAINT cargas_combustible_pkey PRIMARY KEY (id);


--
-- Name: categorias_inventario categorias_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_inventario
    ADD CONSTRAINT categorias_inventario_pkey PRIMARY KEY (id);


--
-- Name: categorias_puesto categorias_puesto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_puesto
    ADD CONSTRAINT categorias_puesto_pkey PRIMARY KEY (id);


--
-- Name: checklists_preoperacionales checklists_preoperacionales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists_preoperacionales
    ADD CONSTRAINT checklists_preoperacionales_pkey PRIMARY KEY (id);


--
-- Name: cierres_caja cierres_caja_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cierres_caja
    ADD CONSTRAINT cierres_caja_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: configuracion_sistema configuracion_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_sistema
    ADD CONSTRAINT configuracion_sistema_pkey PRIMARY KEY (clave);


--
-- Name: contactos_emergencia contactos_emergencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contactos_emergencia
    ADD CONSTRAINT contactos_emergencia_pkey PRIMARY KEY (id);


--
-- Name: cotizacion_items cotizacion_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizacion_items
    ADD CONSTRAINT cotizacion_items_pkey PRIMARY KEY (id);


--
-- Name: cotizaciones cotizaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_pkey PRIMARY KEY (id);


--
-- Name: cuentas_bancarias cuentas_bancarias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_bancarias
    ADD CONSTRAINT cuentas_bancarias_pkey PRIMARY KEY (id);


--
-- Name: cuentas_por_cobrar cuentas_por_cobrar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_por_cobrar
    ADD CONSTRAINT cuentas_por_cobrar_pkey PRIMARY KEY (id);


--
-- Name: cuentas_por_pagar cuentas_por_pagar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_por_pagar
    ADD CONSTRAINT cuentas_por_pagar_pkey PRIMARY KEY (id);


--
-- Name: deducciones_nomina deducciones_nomina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deducciones_nomina
    ADD CONSTRAINT deducciones_nomina_pkey PRIMARY KEY (id);


--
-- Name: despachos_maquina despachos_maquina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despachos_maquina
    ADD CONSTRAINT despachos_maquina_pkey PRIMARY KEY (id);


--
-- Name: dias_asistencia_semana dias_asistencia_semana_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dias_asistencia_semana
    ADD CONSTRAINT dias_asistencia_semana_pkey PRIMARY KEY (id);


--
-- Name: documento_etiquetas documento_etiquetas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento_etiquetas
    ADD CONSTRAINT documento_etiquetas_pkey PRIMARY KEY (documento_id, etiqueta_id);


--
-- Name: documento_versiones documento_versiones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento_versiones
    ADD CONSTRAINT documento_versiones_pkey PRIMARY KEY (id);


--
-- Name: documentos documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (id);


--
-- Name: etiquetas etiquetas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etiquetas
    ADD CONSTRAINT etiquetas_pkey PRIMARY KEY (id);


--
-- Name: factura_conceptos factura_conceptos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_conceptos
    ADD CONSTRAINT factura_conceptos_pkey PRIMARY KEY (id);


--
-- Name: facturas facturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_pkey PRIMARY KEY (id);


--
-- Name: fallas_mecanicas fallas_mecanicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fallas_mecanicas
    ADD CONSTRAINT fallas_mecanicas_pkey PRIMARY KEY (id);


--
-- Name: firmas_cliente firmas_cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firmas_cliente
    ADD CONSTRAINT firmas_cliente_pkey PRIMARY KEY (id);


--
-- Name: firmas_digitales firmas_digitales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firmas_digitales
    ADD CONSTRAINT firmas_digitales_pkey PRIMARY KEY (id);


--
-- Name: geocerca_maquinas geocerca_maquinas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geocerca_maquinas
    ADD CONSTRAINT geocerca_maquinas_pkey PRIMARY KEY (id);


--
-- Name: geocercas geocercas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geocercas
    ADD CONSTRAINT geocercas_pkey PRIMARY KEY (id);


--
-- Name: hitos_progreso hitos_progreso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hitos_progreso
    ADD CONSTRAINT hitos_progreso_pkey PRIMARY KEY (id);


--
-- Name: horas_extra_asistencia horas_extra_asistencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horas_extra_asistencia
    ADD CONSTRAINT horas_extra_asistencia_pkey PRIMARY KEY (id);


--
-- Name: intentos_login intentos_login_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intentos_login
    ADD CONSTRAINT intentos_login_pkey PRIMARY KEY (id);


--
-- Name: lecturas_horometro lecturas_horometro_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecturas_horometro
    ADD CONSTRAINT lecturas_horometro_pkey PRIMARY KEY (id);


--
-- Name: licencias_trabajador licencias_trabajador_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencias_trabajador
    ADD CONSTRAINT licencias_trabajador_pkey PRIMARY KEY (id);


--
-- Name: maquina_componentes maquina_componentes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquina_componentes
    ADD CONSTRAINT maquina_componentes_pkey PRIMARY KEY (id);


--
-- Name: maquina_operadores maquina_operadores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquina_operadores
    ADD CONSTRAINT maquina_operadores_pkey PRIMARY KEY (id);


--
-- Name: maquinas maquinas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquinas
    ADD CONSTRAINT maquinas_pkey PRIMARY KEY (id);


--
-- Name: materiales_criba materiales_criba_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materiales_criba
    ADD CONSTRAINT materiales_criba_pkey PRIMARY KEY (id);


--
-- Name: movimientos_bancarios movimientos_bancarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_bancarios
    ADD CONSTRAINT movimientos_bancarios_pkey PRIMARY KEY (id);


--
-- Name: movimientos_inventario movimientos_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id);


--
-- Name: niveles_bloqueo niveles_bloqueo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niveles_bloqueo
    ADD CONSTRAINT niveles_bloqueo_pkey PRIMARY KEY (id);


--
-- Name: nominas nominas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nominas
    ADD CONSTRAINT nominas_pkey PRIMARY KEY (id);


--
-- Name: notificaciones_lecturas notificaciones_lecturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones_lecturas
    ADD CONSTRAINT notificaciones_lecturas_pkey PRIMARY KEY (notificacion_id, user_id);


--
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- Name: obras obras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_pkey PRIMARY KEY (id);


--
-- Name: ordenes_compra_items ordenes_compra_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra_items
    ADD CONSTRAINT ordenes_compra_items_pkey PRIMARY KEY (id);


--
-- Name: ordenes_compra ordenes_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: pagos_proveedor pagos_proveedor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos_proveedor
    ADD CONSTRAINT pagos_proveedor_pkey PRIMARY KEY (id);


--
-- Name: percepciones_nomina percepciones_nomina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.percepciones_nomina
    ADD CONSTRAINT percepciones_nomina_pkey PRIMARY KEY (id);


--
-- Name: periodos_nomina periodos_nomina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodos_nomina
    ADD CONSTRAINT periodos_nomina_pkey PRIMARY KEY (id);


--
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: personas personas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_pkey PRIMARY KEY (id);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- Name: proyectos proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id);


--
-- Name: rastreo_gps rastreo_gps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rastreo_gps
    ADD CONSTRAINT rastreo_gps_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: registro_auditoria registro_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registro_auditoria
    ADD CONSTRAINT registro_auditoria_pkey PRIMARY KEY (event_id);


--
-- Name: registros_asistencia registros_asistencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_asistencia
    ADD CONSTRAINT registros_asistencia_pkey PRIMARY KEY (id);


--
-- Name: registros_criba registros_criba_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_criba
    ADD CONSTRAINT registros_criba_pkey PRIMARY KEY (id);


--
-- Name: registros_mantenimiento registros_mantenimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_mantenimiento
    ADD CONSTRAINT registros_mantenimiento_pkey PRIMARY KEY (id);


--
-- Name: reportes_actividades reportes_actividades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_actividades
    ADD CONSTRAINT reportes_actividades_pkey PRIMARY KEY (id);


--
-- Name: reportes_adjuntos reportes_adjuntos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_adjuntos
    ADD CONSTRAINT reportes_adjuntos_pkey PRIMARY KEY (id);


--
-- Name: reportes_campo reportes_campo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_campo
    ADD CONSTRAINT reportes_campo_pkey PRIMARY KEY (id);


--
-- Name: retiros_caja retiros_caja_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retiros_caja
    ADD CONSTRAINT retiros_caja_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (rol_id, permiso_id);


--
-- Name: role_vistas role_vistas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_vistas
    ADD CONSTRAINT role_vistas_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: subcategorias_reporte subcategorias_reporte_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategorias_reporte
    ADD CONSTRAINT subcategorias_reporte_pkey PRIMARY KEY (id);


--
-- Name: tipos_maquina tipos_maquina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_maquina
    ADD CONSTRAINT tipos_maquina_pkey PRIMARY KEY (id);


--
-- Name: token_blacklist token_blacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_blacklist
    ADD CONSTRAINT token_blacklist_pkey PRIMARY KEY (id);


--
-- Name: trabajadores trabajadores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores
    ADD CONSTRAINT trabajadores_pkey PRIMARY KEY (id);


--
-- Name: trabajadores_proyectos trabajadores_proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores_proyectos
    ADD CONSTRAINT trabajadores_proyectos_pkey PRIMARY KEY (trabajador_id, proyecto_id);


--
-- Name: transacciones transacciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacciones
    ADD CONSTRAINT transacciones_pkey PRIMARY KEY (id);


--
-- Name: unidades_medida unidades_medida_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_medida
    ADD CONSTRAINT unidades_medida_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_roles users_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_roles
    ADD CONSTRAINT users_roles_pkey PRIMARY KEY (id);


--
-- Name: usuarios_bloqueados usuarios_bloqueados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_bloqueados
    ADD CONSTRAINT usuarios_bloqueados_pkey PRIMARY KEY (id);


--
-- Name: ventas_items ventas_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas_items
    ADD CONSTRAINT ventas_items_pkey PRIMARY KEY (id);


--
-- Name: ventas_pagos ventas_pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas_pagos
    ADD CONSTRAINT ventas_pagos_pkey PRIMARY KEY (id);


--
-- Name: ventas ventas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);


--
-- Name: vistas vistas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistas
    ADD CONSTRAINT vistas_pkey PRIMARY KEY (id);


--
-- Name: alertas_gps_atendida_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX alertas_gps_atendida_idx ON public.alertas_gps USING btree (atendida);


--
-- Name: alertas_gps_maquina_id_fecha_hora_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX alertas_gps_maquina_id_fecha_hora_idx ON public.alertas_gps USING btree (maquina_id, fecha_hora DESC);


--
-- Name: aperturas_caja_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX aperturas_caja_fecha_idx ON public.aperturas_caja USING btree (fecha);


--
-- Name: aperturas_caja_fecha_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX aperturas_caja_fecha_key ON public.aperturas_caja USING btree (fecha);


--
-- Name: apu_items_apu_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX apu_items_apu_template_id_idx ON public.apu_items USING btree (apu_template_id);


--
-- Name: apu_templates_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX apu_templates_codigo_key ON public.apu_templates USING btree (codigo);


--
-- Name: articulos_inventario_categoria_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articulos_inventario_categoria_id_idx ON public.articulos_inventario USING btree (categoria_id);


--
-- Name: articulos_inventario_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX articulos_inventario_codigo_key ON public.articulos_inventario USING btree (codigo);


--
-- Name: articulos_inventario_proveedor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articulos_inventario_proveedor_id_idx ON public.articulos_inventario USING btree (proveedor_id);


--
-- Name: articulos_precio_articulo_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articulos_precio_articulo_id_idx ON public.articulos_precio USING btree (articulo_id);


--
-- Name: articulos_precio_articulo_id_medida_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX articulos_precio_articulo_id_medida_key ON public.articulos_precio USING btree (articulo_id, medida);


--
-- Name: asistencias_semanales_trabajador_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX asistencias_semanales_trabajador_id_idx ON public.asistencias_semanales USING btree (trabajador_id);


--
-- Name: bancos_activo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bancos_activo_idx ON public.bancos USING btree (activo);


--
-- Name: bancos_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX bancos_nombre_key ON public.bancos USING btree (nombre);


--
-- Name: bitacoras_operacion_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX bitacoras_operacion_codigo_key ON public.bitacoras_operacion USING btree (codigo);


--
-- Name: bitacoras_operacion_maquina_id_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bitacoras_operacion_maquina_id_fecha_idx ON public.bitacoras_operacion USING btree (maquina_id, fecha);


--
-- Name: bitacoras_renta_diaria_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bitacoras_renta_diaria_fecha_idx ON public.bitacoras_renta_diaria USING btree (fecha);


--
-- Name: bitacoras_renta_diaria_folio_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX bitacoras_renta_diaria_folio_key ON public.bitacoras_renta_diaria USING btree (folio);


--
-- Name: bitacoras_renta_diaria_maquina_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bitacoras_renta_diaria_maquina_id_idx ON public.bitacoras_renta_diaria USING btree (maquina_id);


--
-- Name: bitacoras_renta_diaria_trabajador_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bitacoras_renta_diaria_trabajador_id_idx ON public.bitacoras_renta_diaria USING btree (trabajador_id);


--
-- Name: cargas_combustible_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cargas_combustible_codigo_key ON public.cargas_combustible USING btree (codigo);


--
-- Name: cargas_combustible_maquina_id_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cargas_combustible_maquina_id_fecha_idx ON public.cargas_combustible USING btree (maquina_id, fecha);


--
-- Name: categorias_inventario_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categorias_inventario_nombre_key ON public.categorias_inventario USING btree (nombre);


--
-- Name: categorias_puesto_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categorias_puesto_nombre_key ON public.categorias_puesto USING btree (nombre);


--
-- Name: checklists_preoperacionales_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX checklists_preoperacionales_codigo_key ON public.checklists_preoperacionales USING btree (codigo);


--
-- Name: checklists_preoperacionales_maquina_id_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX checklists_preoperacionales_maquina_id_fecha_idx ON public.checklists_preoperacionales USING btree (maquina_id, fecha);


--
-- Name: cierres_caja_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cierres_caja_fecha_idx ON public.cierres_caja USING btree (fecha);


--
-- Name: cierres_caja_fecha_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cierres_caja_fecha_key ON public.cierres_caja USING btree (fecha);


--
-- Name: clientes_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clientes_codigo_key ON public.clientes USING btree (codigo);


--
-- Name: contactos_emergencia_trabajador_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contactos_emergencia_trabajador_id_key ON public.contactos_emergencia USING btree (trabajador_id);


--
-- Name: cotizacion_items_cotizacion_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cotizacion_items_cotizacion_id_idx ON public.cotizacion_items USING btree (cotizacion_id);


--
-- Name: cotizaciones_cliente_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cotizaciones_cliente_id_idx ON public.cotizaciones USING btree (cliente_id);


--
-- Name: cotizaciones_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cotizaciones_codigo_key ON public.cotizaciones USING btree (codigo);


--
-- Name: cuentas_bancarias_banco_id_activo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cuentas_bancarias_banco_id_activo_idx ON public.cuentas_bancarias USING btree (banco_id, activo);


--
-- Name: cuentas_bancarias_numero_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cuentas_bancarias_numero_key ON public.cuentas_bancarias USING btree (numero);


--
-- Name: cuentas_por_cobrar_cliente_id_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cuentas_por_cobrar_cliente_id_estado_idx ON public.cuentas_por_cobrar USING btree (cliente_id, estado);


--
-- Name: cuentas_por_cobrar_factura_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cuentas_por_cobrar_factura_id_key ON public.cuentas_por_cobrar USING btree (factura_id);


--
-- Name: cuentas_por_cobrar_proyecto_id_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cuentas_por_cobrar_proyecto_id_estado_idx ON public.cuentas_por_cobrar USING btree (proyecto_id, estado);


--
-- Name: cuentas_por_pagar_orden_compra_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cuentas_por_pagar_orden_compra_id_key ON public.cuentas_por_pagar USING btree (orden_compra_id);


--
-- Name: cuentas_por_pagar_proveedor_id_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cuentas_por_pagar_proveedor_id_estado_idx ON public.cuentas_por_pagar USING btree (proveedor_id, estado);


--
-- Name: despachos_maquina_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX despachos_maquina_codigo_key ON public.despachos_maquina USING btree (codigo);


--
-- Name: despachos_maquina_maquina_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX despachos_maquina_maquina_id_idx ON public.despachos_maquina USING btree (maquina_id);


--
-- Name: despachos_maquina_proyecto_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX despachos_maquina_proyecto_id_idx ON public.despachos_maquina USING btree (proyecto_id);


--
-- Name: dias_asistencia_semana_asistencia_semanal_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dias_asistencia_semana_asistencia_semanal_id_idx ON public.dias_asistencia_semana USING btree (asistencia_semanal_id);


--
-- Name: documento_versiones_documento_id_numero_version_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documento_versiones_documento_id_numero_version_idx ON public.documento_versiones USING btree (documento_id, numero_version DESC);


--
-- Name: documento_versiones_documento_id_numero_version_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX documento_versiones_documento_id_numero_version_key ON public.documento_versiones USING btree (documento_id, numero_version);


--
-- Name: documentos_categoria_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documentos_categoria_idx ON public.documentos USING btree (categoria);


--
-- Name: documentos_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX documentos_codigo_key ON public.documentos USING btree (codigo);


--
-- Name: documentos_propietario_tipo_propietario_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documentos_propietario_tipo_propietario_id_idx ON public.documentos USING btree (propietario_tipo, propietario_id);


--
-- Name: documentos_tipo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documentos_tipo_idx ON public.documentos USING btree (tipo);


--
-- Name: documentos_trabajador_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documentos_trabajador_id_idx ON public.documentos USING btree (trabajador_id);


--
-- Name: etiquetas_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX etiquetas_nombre_key ON public.etiquetas USING btree (nombre);


--
-- Name: facturas_cliente_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX facturas_cliente_id_idx ON public.facturas USING btree (cliente_id);


--
-- Name: facturas_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX facturas_codigo_key ON public.facturas USING btree (codigo);


--
-- Name: facturas_cotizacion_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX facturas_cotizacion_id_key ON public.facturas USING btree (cotizacion_id);


--
-- Name: facturas_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX facturas_estado_idx ON public.facturas USING btree (estado);


--
-- Name: facturas_serie_folio_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX facturas_serie_folio_key ON public.facturas USING btree (serie, folio);


--
-- Name: facturas_uuid_cfdi_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX facturas_uuid_cfdi_key ON public.facturas USING btree (uuid_cfdi);


--
-- Name: fallas_mecanicas_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX fallas_mecanicas_codigo_key ON public.fallas_mecanicas USING btree (codigo);


--
-- Name: fallas_mecanicas_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fallas_mecanicas_estado_idx ON public.fallas_mecanicas USING btree (estado);


--
-- Name: fallas_mecanicas_maquina_id_fecha_reporte_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fallas_mecanicas_maquina_id_fecha_reporte_idx ON public.fallas_mecanicas USING btree (maquina_id, fecha_reporte DESC);


--
-- Name: firmas_cliente_bitacora_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX firmas_cliente_bitacora_id_key ON public.firmas_cliente USING btree (bitacora_id);


--
-- Name: firmas_digitales_documento_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX firmas_digitales_documento_id_idx ON public.firmas_digitales USING btree (documento_id);


--
-- Name: geocerca_maquinas_geocerca_id_maquina_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX geocerca_maquinas_geocerca_id_maquina_id_key ON public.geocerca_maquinas USING btree (geocerca_id, maquina_id);


--
-- Name: hitos_progreso_proyecto_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hitos_progreso_proyecto_id_idx ON public.hitos_progreso USING btree (proyecto_id);


--
-- Name: horas_extra_asistencia_registro_asistencia_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX horas_extra_asistencia_registro_asistencia_id_key ON public.horas_extra_asistencia USING btree (registro_asistencia_id);


--
-- Name: idx_clientes_nombre_fts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_nombre_fts ON public.clientes USING gin (to_tsvector('spanish'::regconfig, ((nombre || ' '::text) || COALESCE(empresa, ''::text))));


--
-- Name: idx_configuracion_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_configuracion_categoria ON public.configuracion_sistema USING btree (categoria);


--
-- Name: idx_documentos_nombre_fts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_nombre_fts ON public.documentos USING gin (to_tsvector('spanish'::regconfig, ((nombre || ' '::text) || COALESCE(descripcion, ''::text))));


--
-- Name: idx_documentos_palabras_clave; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_palabras_clave ON public.documentos USING gin (palabras_clave);


--
-- Name: idx_proyectos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proyectos_estado ON public.proyectos USING btree (estado);


--
-- Name: idx_proyectos_nombre_fts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proyectos_nombre_fts ON public.proyectos USING gin (to_tsvector('spanish'::regconfig, nombre));


--
-- Name: idx_reportes_campo_detalles; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reportes_campo_detalles ON public.reportes_campo USING gin (detalles);


--
-- Name: idx_role_vistas_rol; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_vistas_rol ON public.role_vistas USING btree (rol_id, activo, puede_ver);


--
-- Name: idx_trabajadores_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trabajadores_estado ON public.trabajadores USING btree (estado);


--
-- Name: idx_trabajadores_nombre_fts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trabajadores_nombre_fts ON public.trabajadores USING gin (to_tsvector('spanish'::regconfig, ((nombre || ' '::text) || COALESCE(puesto, ''::text))));


--
-- Name: idx_vistas_activas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vistas_activas ON public.vistas USING btree (activo, es_menu, es_visible);


--
-- Name: intentos_login_email_intentado_creado_en_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX intentos_login_email_intentado_creado_en_idx ON public.intentos_login USING btree (email_intentado, creado_en DESC);


--
-- Name: intentos_login_user_id_creado_en_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX intentos_login_user_id_creado_en_idx ON public.intentos_login USING btree (user_id, creado_en DESC);


--
-- Name: lecturas_horometro_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX lecturas_horometro_codigo_key ON public.lecturas_horometro USING btree (codigo);


--
-- Name: lecturas_horometro_maquina_id_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lecturas_horometro_maquina_id_fecha_idx ON public.lecturas_horometro USING btree (maquina_id, fecha);


--
-- Name: licencias_trabajador_trabajador_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX licencias_trabajador_trabajador_id_key ON public.licencias_trabajador USING btree (trabajador_id);


--
-- Name: maquina_operadores_maquina_id_es_actual_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maquina_operadores_maquina_id_es_actual_idx ON public.maquina_operadores USING btree (maquina_id, es_actual);


--
-- Name: maquina_operadores_trabajador_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maquina_operadores_trabajador_id_idx ON public.maquina_operadores USING btree (trabajador_id);


--
-- Name: maquinas_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX maquinas_codigo_key ON public.maquinas USING btree (codigo);


--
-- Name: maquinas_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maquinas_estado_idx ON public.maquinas USING btree (estado);


--
-- Name: maquinas_operador_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maquinas_operador_id_idx ON public.maquinas USING btree (operador_id);


--
-- Name: maquinas_tipo_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maquinas_tipo_id_idx ON public.maquinas USING btree (tipo_id);


--
-- Name: materiales_criba_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX materiales_criba_nombre_key ON public.materiales_criba USING btree (nombre);


--
-- Name: movimientos_bancarios_conciliado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX movimientos_bancarios_conciliado_idx ON public.movimientos_bancarios USING btree (conciliado);


--
-- Name: movimientos_bancarios_cuenta_id_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX movimientos_bancarios_cuenta_id_fecha_idx ON public.movimientos_bancarios USING btree (cuenta_id, fecha);


--
-- Name: movimientos_bancarios_dedupe_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX movimientos_bancarios_dedupe_key ON public.movimientos_bancarios USING btree (cuenta_id, fecha, descripcion, COALESCE(deposito, (0)::numeric), COALESCE(retiro, (0)::numeric));


--
-- Name: movimientos_bancarios_transaccion_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX movimientos_bancarios_transaccion_id_key ON public.movimientos_bancarios USING btree (transaccion_id);


--
-- Name: movimientos_inventario_articulo_id_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX movimientos_inventario_articulo_id_fecha_idx ON public.movimientos_inventario USING btree (articulo_id, fecha);


--
-- Name: niveles_bloqueo_nivel_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX niveles_bloqueo_nivel_key ON public.niveles_bloqueo USING btree (nivel);


--
-- Name: nominas_periodo_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX nominas_periodo_id_idx ON public.nominas USING btree (periodo_id);


--
-- Name: nominas_trabajador_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX nominas_trabajador_id_idx ON public.nominas USING btree (trabajador_id);


--
-- Name: notificaciones_audiencia_rol_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notificaciones_audiencia_rol_id_idx ON public.notificaciones USING btree (audiencia_rol_id);


--
-- Name: notificaciones_audiencia_torre_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notificaciones_audiencia_torre_idx ON public.notificaciones USING btree (audiencia_torre);


--
-- Name: notificaciones_creado_en_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notificaciones_creado_en_idx ON public.notificaciones USING btree (creado_en);


--
-- Name: notificaciones_destinatario_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notificaciones_destinatario_user_id_idx ON public.notificaciones USING btree (destinatario_user_id);


--
-- Name: notificaciones_lecturas_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notificaciones_lecturas_user_id_idx ON public.notificaciones_lecturas USING btree (user_id);


--
-- Name: obras_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX obras_codigo_key ON public.obras USING btree (codigo);


--
-- Name: obras_proyecto_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX obras_proyecto_id_key ON public.obras USING btree (proyecto_id);


--
-- Name: ordenes_compra_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ordenes_compra_fecha_idx ON public.ordenes_compra USING btree (fecha);


--
-- Name: ordenes_compra_folio_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ordenes_compra_folio_key ON public.ordenes_compra USING btree (folio);


--
-- Name: ordenes_compra_items_articulo_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ordenes_compra_items_articulo_id_idx ON public.ordenes_compra_items USING btree (articulo_id);


--
-- Name: ordenes_compra_items_orden_compra_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ordenes_compra_items_orden_compra_id_idx ON public.ordenes_compra_items USING btree (orden_compra_id);


--
-- Name: ordenes_compra_proveedor_id_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ordenes_compra_proveedor_id_estado_idx ON public.ordenes_compra USING btree (proveedor_id, estado);


--
-- Name: pagos_cliente_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_cliente_id_idx ON public.pagos USING btree (cliente_id);


--
-- Name: pagos_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pagos_codigo_key ON public.pagos USING btree (codigo);


--
-- Name: pagos_cuenta_por_cobrar_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_cuenta_por_cobrar_id_idx ON public.pagos USING btree (cuenta_por_cobrar_id);


--
-- Name: pagos_proveedor_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pagos_proveedor_codigo_key ON public.pagos_proveedor USING btree (codigo);


--
-- Name: pagos_proveedor_proveedor_id_fecha_pago_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_proveedor_proveedor_id_fecha_pago_idx ON public.pagos_proveedor USING btree (proveedor_id, fecha_pago);


--
-- Name: periodos_nomina_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX periodos_nomina_codigo_key ON public.periodos_nomina USING btree (codigo);


--
-- Name: permisos_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permisos_codigo_key ON public.permisos USING btree (codigo);


--
-- Name: permisos_trabajador_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX permisos_trabajador_id_idx ON public.permisos USING btree (trabajador_id);


--
-- Name: permissions_modulo_recurso_accion_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_modulo_recurso_accion_key ON public.permissions USING btree (modulo, recurso, accion);


--
-- Name: personas_correo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX personas_correo_key ON public.personas USING btree (correo);


--
-- Name: proveedores_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX proveedores_codigo_key ON public.proveedores USING btree (codigo);


--
-- Name: proveedores_rfc_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX proveedores_rfc_key ON public.proveedores USING btree (rfc);


--
-- Name: proyectos_cliente_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX proyectos_cliente_id_idx ON public.proyectos USING btree (cliente_id);


--
-- Name: proyectos_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX proyectos_codigo_key ON public.proyectos USING btree (codigo);


--
-- Name: rastreo_gps_fecha_hora_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rastreo_gps_fecha_hora_idx ON public.rastreo_gps USING btree (fecha_hora DESC);


--
-- Name: rastreo_gps_maquina_id_fecha_hora_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rastreo_gps_maquina_id_fecha_hora_idx ON public.rastreo_gps USING btree (maquina_id, fecha_hora DESC);


--
-- Name: refresh_tokens_jti_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX refresh_tokens_jti_key ON public.refresh_tokens USING btree (jti);


--
-- Name: refresh_tokens_reemplazado_por_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX refresh_tokens_reemplazado_por_key ON public.refresh_tokens USING btree (reemplazado_por);


--
-- Name: registro_auditoria_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registro_auditoria_action_idx ON public.registro_auditoria USING btree (action);


--
-- Name: registro_auditoria_actor_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registro_auditoria_actor_user_id_idx ON public.registro_auditoria USING btree (actor_user_id);


--
-- Name: registro_auditoria_correlation_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registro_auditoria_correlation_id_idx ON public.registro_auditoria USING btree (correlation_id);


--
-- Name: registro_auditoria_entity_type_entity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registro_auditoria_entity_type_entity_id_idx ON public.registro_auditoria USING btree (entity_type, entity_id);


--
-- Name: registro_auditoria_result_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registro_auditoria_result_idx ON public.registro_auditoria USING btree (result);


--
-- Name: registro_auditoria_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registro_auditoria_timestamp_idx ON public.registro_auditoria USING btree ("timestamp" DESC);


--
-- Name: registros_asistencia_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX registros_asistencia_codigo_key ON public.registros_asistencia USING btree (codigo);


--
-- Name: registros_asistencia_obra_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registros_asistencia_obra_id_idx ON public.registros_asistencia USING btree (obra_id);


--
-- Name: registros_asistencia_trabajador_id_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registros_asistencia_trabajador_id_fecha_idx ON public.registros_asistencia USING btree (trabajador_id, fecha);


--
-- Name: registros_criba_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX registros_criba_codigo_key ON public.registros_criba USING btree (codigo);


--
-- Name: registros_criba_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registros_criba_fecha_idx ON public.registros_criba USING btree (fecha);


--
-- Name: registros_criba_inventario_en_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registros_criba_inventario_en_idx ON public.registros_criba USING btree (inventario_en);


--
-- Name: registros_criba_maquina_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registros_criba_maquina_id_idx ON public.registros_criba USING btree (maquina_id);


--
-- Name: registros_criba_material_criba_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registros_criba_material_criba_id_idx ON public.registros_criba USING btree (material_criba_id);


--
-- Name: registros_criba_proyecto_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registros_criba_proyecto_id_idx ON public.registros_criba USING btree (proyecto_id);


--
-- Name: registros_mantenimiento_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX registros_mantenimiento_codigo_key ON public.registros_mantenimiento USING btree (codigo);


--
-- Name: registros_mantenimiento_maquina_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registros_mantenimiento_maquina_id_idx ON public.registros_mantenimiento USING btree (maquina_id);


--
-- Name: reportes_actividades_reporte_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reportes_actividades_reporte_id_idx ON public.reportes_actividades USING btree (reporte_id);


--
-- Name: reportes_adjuntos_reporte_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reportes_adjuntos_reporte_id_idx ON public.reportes_adjuntos USING btree (reporte_id);


--
-- Name: reportes_campo_asignado_a_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reportes_campo_asignado_a_id_idx ON public.reportes_campo USING btree (asignado_a_id);


--
-- Name: reportes_campo_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reportes_campo_codigo_key ON public.reportes_campo USING btree (codigo);


--
-- Name: reportes_campo_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reportes_campo_fecha_idx ON public.reportes_campo USING btree (fecha);


--
-- Name: reportes_campo_maquina_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reportes_campo_maquina_id_idx ON public.reportes_campo USING btree (maquina_id);


--
-- Name: reportes_campo_proyecto_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reportes_campo_proyecto_id_idx ON public.reportes_campo USING btree (proyecto_id);


--
-- Name: reportes_campo_subcategoria_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reportes_campo_subcategoria_id_idx ON public.reportes_campo USING btree (subcategoria_id);


--
-- Name: reportes_campo_tipo_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reportes_campo_tipo_estado_idx ON public.reportes_campo USING btree (tipo, estado);


--
-- Name: retiros_caja_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX retiros_caja_fecha_idx ON public.retiros_caja USING btree (fecha);


--
-- Name: role_vistas_rol_id_vista_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX role_vistas_rol_id_vista_id_key ON public.role_vistas USING btree (rol_id, vista_id);


--
-- Name: role_vistas_vista_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_vistas_vista_id_idx ON public.role_vistas USING btree (vista_id);


--
-- Name: roles_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_nombre_key ON public.roles USING btree (nombre);


--
-- Name: sessions_refresh_token_jti_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sessions_refresh_token_jti_key ON public.sessions USING btree (refresh_token_jti);


--
-- Name: subcategorias_reporte_categoria_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subcategorias_reporte_categoria_idx ON public.subcategorias_reporte USING btree (categoria);


--
-- Name: subcategorias_reporte_categoria_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX subcategorias_reporte_categoria_nombre_key ON public.subcategorias_reporte USING btree (categoria, nombre);


--
-- Name: tipos_maquina_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tipos_maquina_nombre_key ON public.tipos_maquina USING btree (nombre);


--
-- Name: token_blacklist_expira_en_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX token_blacklist_expira_en_idx ON public.token_blacklist USING btree (expira_en);


--
-- Name: token_blacklist_jti_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX token_blacklist_jti_idx ON public.token_blacklist USING btree (jti);


--
-- Name: token_blacklist_jti_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX token_blacklist_jti_key ON public.token_blacklist USING btree (jti);


--
-- Name: trabajadores_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX trabajadores_codigo_key ON public.trabajadores USING btree (codigo);


--
-- Name: trabajadores_usuario_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX trabajadores_usuario_id_key ON public.trabajadores USING btree (usuario_id);


--
-- Name: transacciones_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX transacciones_codigo_key ON public.transacciones USING btree (codigo);


--
-- Name: transacciones_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transacciones_fecha_idx ON public.transacciones USING btree (fecha);


--
-- Name: unidades_medida_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unidades_medida_codigo_key ON public.unidades_medida USING btree (codigo);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_jefe_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_jefe_user_id_idx ON public.users USING btree (jefe_user_id);


--
-- Name: users_numero_empleado_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_numero_empleado_key ON public.users USING btree (numero_empleado);


--
-- Name: users_persona_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_persona_id_key ON public.users USING btree (persona_id);


--
-- Name: users_roles_user_id_rol_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_roles_user_id_rol_id_key ON public.users_roles USING btree (user_id, rol_id);


--
-- Name: usuarios_bloqueados_ip_address_activo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX usuarios_bloqueados_ip_address_activo_idx ON public.usuarios_bloqueados USING btree (ip_address, activo);


--
-- Name: usuarios_bloqueados_user_id_activo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX usuarios_bloqueados_user_id_activo_idx ON public.usuarios_bloqueados USING btree (user_id, activo);


--
-- Name: ventas_cliente_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ventas_cliente_id_idx ON public.ventas USING btree (cliente_id);


--
-- Name: ventas_creado_en_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ventas_creado_en_idx ON public.ventas USING btree (creado_en);


--
-- Name: ventas_folio_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ventas_folio_key ON public.ventas USING btree (folio);


--
-- Name: ventas_idempotencia_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ventas_idempotencia_key_key ON public.ventas USING btree (idempotencia_key);


--
-- Name: ventas_items_articulo_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ventas_items_articulo_id_idx ON public.ventas_items USING btree (articulo_id);


--
-- Name: ventas_items_venta_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ventas_items_venta_id_idx ON public.ventas_items USING btree (venta_id);


--
-- Name: ventas_pagos_venta_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ventas_pagos_venta_id_idx ON public.ventas_pagos USING btree (venta_id);


--
-- Name: ventas_ticket_creado_en_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ventas_ticket_creado_en_idx ON public.ventas USING btree (ticket, creado_en);


--
-- Name: vistas_ruta_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vistas_ruta_key ON public.vistas USING btree (ruta);


--
-- Name: vistas_vista_padre_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vistas_vista_padre_id_idx ON public.vistas USING btree (vista_padre_id);


--
-- Name: alertas_gps trg_alertas_gps_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_alertas_gps_updated_at BEFORE UPDATE ON public.alertas_gps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: apu_items trg_apu_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_apu_items_updated_at BEFORE UPDATE ON public.apu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: apu_templates trg_apu_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_apu_templates_updated_at BEFORE UPDATE ON public.apu_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: articulos_inventario trg_articulos_inventario_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_articulos_inventario_updated_at BEFORE UPDATE ON public.articulos_inventario FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: asistencias_semanales trg_asistencias_semanales_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_asistencias_semanales_updated_at BEFORE UPDATE ON public.asistencias_semanales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: registro_auditoria trg_audit_immutable_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_immutable_delete BEFORE DELETE ON public.registro_auditoria FOR EACH ROW EXECUTE FUNCTION public.audit_immutable_guard();


--
-- Name: registro_auditoria trg_audit_immutable_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_immutable_update BEFORE UPDATE ON public.registro_auditoria FOR EACH ROW EXECUTE FUNCTION public.audit_immutable_guard();


--
-- Name: bitacoras_operacion trg_bitacoras_operacion_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_bitacoras_operacion_updated_at BEFORE UPDATE ON public.bitacoras_operacion FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bitacoras_renta_diaria trg_bitacoras_renta_diaria_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_bitacoras_renta_diaria_updated_at BEFORE UPDATE ON public.bitacoras_renta_diaria FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cargas_combustible trg_cargas_combustible_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cargas_combustible_updated_at BEFORE UPDATE ON public.cargas_combustible FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: categorias_inventario trg_categorias_inventario_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_categorias_inventario_updated_at BEFORE UPDATE ON public.categorias_inventario FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: categorias_puesto trg_categorias_puesto_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_categorias_puesto_updated_at BEFORE UPDATE ON public.categorias_puesto FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: checklists_preoperacionales trg_checklists_preoperacionales_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_checklists_preoperacionales_updated_at BEFORE UPDATE ON public.checklists_preoperacionales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clientes trg_clientes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contactos_emergencia trg_contactos_emergencia_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_contactos_emergencia_updated_at BEFORE UPDATE ON public.contactos_emergencia FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cotizaciones trg_cotizaciones_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cotizaciones_updated_at BEFORE UPDATE ON public.cotizaciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cuentas_por_cobrar trg_cuentas_por_cobrar_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cuentas_por_cobrar_updated_at BEFORE UPDATE ON public.cuentas_por_cobrar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: deducciones_nomina trg_deducciones_nomina_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_deducciones_nomina_updated_at BEFORE UPDATE ON public.deducciones_nomina FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: despachos_maquina trg_despachos_maquina_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_despachos_maquina_updated_at BEFORE UPDATE ON public.despachos_maquina FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dias_asistencia_semana trg_dias_asistencia_semana_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dias_asistencia_semana_updated_at BEFORE UPDATE ON public.dias_asistencia_semana FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documentos trg_documentos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_documentos_updated_at BEFORE UPDATE ON public.documentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: etiquetas trg_etiquetas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_etiquetas_updated_at BEFORE UPDATE ON public.etiquetas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: facturas trg_facturas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_facturas_updated_at BEFORE UPDATE ON public.facturas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: fallas_mecanicas trg_fallas_mecanicas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fallas_mecanicas_updated_at BEFORE UPDATE ON public.fallas_mecanicas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: firmas_cliente trg_firmas_cliente_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_firmas_cliente_updated_at BEFORE UPDATE ON public.firmas_cliente FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: firmas_digitales trg_firmas_digitales_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_firmas_digitales_updated_at BEFORE UPDATE ON public.firmas_digitales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: geocercas trg_geocercas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_geocercas_updated_at BEFORE UPDATE ON public.geocercas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hitos_progreso trg_hitos_progreso_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_hitos_progreso_updated_at BEFORE UPDATE ON public.hitos_progreso FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: horas_extra_asistencia trg_horas_extra_asistencia_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_horas_extra_asistencia_updated_at BEFORE UPDATE ON public.horas_extra_asistencia FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lecturas_horometro trg_lecturas_horometro_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lecturas_horometro_updated_at BEFORE UPDATE ON public.lecturas_horometro FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: licencias_trabajador trg_licencias_trabajador_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_licencias_trabajador_updated_at BEFORE UPDATE ON public.licencias_trabajador FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: maquina_componentes trg_maquina_componentes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_maquina_componentes_updated_at BEFORE UPDATE ON public.maquina_componentes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: maquina_operadores trg_maquina_operadores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_maquina_operadores_updated_at BEFORE UPDATE ON public.maquina_operadores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: maquinas trg_maquinas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_maquinas_updated_at BEFORE UPDATE ON public.maquinas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: niveles_bloqueo trg_niveles_bloqueo_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_niveles_bloqueo_updated_at BEFORE UPDATE ON public.niveles_bloqueo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: nominas trg_nominas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_nominas_updated_at BEFORE UPDATE ON public.nominas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: obras trg_obras_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_obras_updated_at BEFORE UPDATE ON public.obras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pagos trg_pagos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pagos_updated_at BEFORE UPDATE ON public.pagos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: percepciones_nomina trg_percepciones_nomina_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_percepciones_nomina_updated_at BEFORE UPDATE ON public.percepciones_nomina FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: periodos_nomina trg_periodos_nomina_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_periodos_nomina_updated_at BEFORE UPDATE ON public.periodos_nomina FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: permissions trg_permissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: personas trg_personas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_personas_updated_at BEFORE UPDATE ON public.personas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: proveedores trg_proveedores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_proveedores_updated_at BEFORE UPDATE ON public.proveedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: proyectos trg_proyectos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_proyectos_updated_at BEFORE UPDATE ON public.proyectos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: registros_asistencia trg_registros_asistencia_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_registros_asistencia_updated_at BEFORE UPDATE ON public.registros_asistencia FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: registros_criba trg_registros_criba_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_registros_criba_updated_at BEFORE UPDATE ON public.registros_criba FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: registros_mantenimiento trg_registros_mantenimiento_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_registros_mantenimiento_updated_at BEFORE UPDATE ON public.registros_mantenimiento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reportes_campo trg_reportes_campo_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_reportes_campo_updated_at BEFORE UPDATE ON public.reportes_campo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: roles trg_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sessions trg_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tipos_maquina trg_tipos_maquina_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tipos_maquina_updated_at BEFORE UPDATE ON public.tipos_maquina FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: trabajadores trg_trabajadores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_trabajadores_updated_at BEFORE UPDATE ON public.trabajadores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transacciones trg_transacciones_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_transacciones_updated_at BEFORE UPDATE ON public.transacciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: unidades_medida trg_unidades_medida_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_unidades_medida_updated_at BEFORE UPDATE ON public.unidades_medida FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: usuarios_bloqueados trg_usuarios_bloqueados_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_usuarios_bloqueados_updated_at BEFORE UPDATE ON public.usuarios_bloqueados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vistas trg_vistas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vistas_updated_at BEFORE UPDATE ON public.vistas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: alertas_gps alertas_gps_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertas_gps
    ADD CONSTRAINT alertas_gps_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: apu_items apu_items_apu_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apu_items
    ADD CONSTRAINT apu_items_apu_template_id_fkey FOREIGN KEY (apu_template_id) REFERENCES public.apu_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: apu_items apu_items_unidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apu_items
    ADD CONSTRAINT apu_items_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades_medida(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: apu_templates apu_templates_unidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apu_templates
    ADD CONSTRAINT apu_templates_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades_medida(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: articulos_inventario articulos_inventario_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos_inventario
    ADD CONSTRAINT articulos_inventario_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_inventario(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: articulos_inventario articulos_inventario_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos_inventario
    ADD CONSTRAINT articulos_inventario_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: articulos_inventario articulos_inventario_unidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos_inventario
    ADD CONSTRAINT articulos_inventario_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades_medida(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: articulos_precio articulos_precio_articulo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos_precio
    ADD CONSTRAINT articulos_precio_articulo_id_fkey FOREIGN KEY (articulo_id) REFERENCES public.articulos_inventario(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: asistencias_semanales asistencias_semanales_trabajador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias_semanales
    ADD CONSTRAINT asistencias_semanales_trabajador_id_fkey FOREIGN KEY (trabajador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bitacoras_operacion bitacoras_operacion_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacoras_operacion
    ADD CONSTRAINT bitacoras_operacion_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bitacoras_operacion bitacoras_operacion_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacoras_operacion
    ADD CONSTRAINT bitacoras_operacion_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bitacoras_renta_diaria bitacoras_renta_diaria_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacoras_renta_diaria
    ADD CONSTRAINT bitacoras_renta_diaria_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bitacoras_renta_diaria bitacoras_renta_diaria_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacoras_renta_diaria
    ADD CONSTRAINT bitacoras_renta_diaria_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bitacoras_renta_diaria bitacoras_renta_diaria_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacoras_renta_diaria
    ADD CONSTRAINT bitacoras_renta_diaria_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bitacoras_renta_diaria bitacoras_renta_diaria_trabajador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacoras_renta_diaria
    ADD CONSTRAINT bitacoras_renta_diaria_trabajador_id_fkey FOREIGN KEY (trabajador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cargas_combustible cargas_combustible_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cargas_combustible
    ADD CONSTRAINT cargas_combustible_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cargas_combustible cargas_combustible_operador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cargas_combustible
    ADD CONSTRAINT cargas_combustible_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: categorias_puesto categorias_puesto_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_puesto
    ADD CONSTRAINT categorias_puesto_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- Name: checklists_preoperacionales checklists_preoperacionales_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists_preoperacionales
    ADD CONSTRAINT checklists_preoperacionales_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: checklists_preoperacionales checklists_preoperacionales_operador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists_preoperacionales
    ADD CONSTRAINT checklists_preoperacionales_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contactos_emergencia contactos_emergencia_trabajador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contactos_emergencia
    ADD CONSTRAINT contactos_emergencia_trabajador_id_fkey FOREIGN KEY (trabajador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cotizacion_items cotizacion_items_cotizacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizacion_items
    ADD CONSTRAINT cotizacion_items_cotizacion_id_fkey FOREIGN KEY (cotizacion_id) REFERENCES public.cotizaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cotizaciones cotizaciones_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cuentas_bancarias cuentas_bancarias_banco_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_bancarias
    ADD CONSTRAINT cuentas_bancarias_banco_id_fkey FOREIGN KEY (banco_id) REFERENCES public.bancos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cuentas_por_cobrar cuentas_por_cobrar_bitacora_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_por_cobrar
    ADD CONSTRAINT cuentas_por_cobrar_bitacora_id_fkey FOREIGN KEY (bitacora_id) REFERENCES public.bitacoras_renta_diaria(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cuentas_por_cobrar cuentas_por_cobrar_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_por_cobrar
    ADD CONSTRAINT cuentas_por_cobrar_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cuentas_por_cobrar cuentas_por_cobrar_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_por_cobrar
    ADD CONSTRAINT cuentas_por_cobrar_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.facturas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cuentas_por_cobrar cuentas_por_cobrar_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_por_cobrar
    ADD CONSTRAINT cuentas_por_cobrar_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cuentas_por_pagar cuentas_por_pagar_orden_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_por_pagar
    ADD CONSTRAINT cuentas_por_pagar_orden_compra_id_fkey FOREIGN KEY (orden_compra_id) REFERENCES public.ordenes_compra(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cuentas_por_pagar cuentas_por_pagar_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_por_pagar
    ADD CONSTRAINT cuentas_por_pagar_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: deducciones_nomina deducciones_nomina_nomina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deducciones_nomina
    ADD CONSTRAINT deducciones_nomina_nomina_id_fkey FOREIGN KEY (nomina_id) REFERENCES public.nominas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: despachos_maquina despachos_maquina_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despachos_maquina
    ADD CONSTRAINT despachos_maquina_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: despachos_maquina despachos_maquina_operador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despachos_maquina
    ADD CONSTRAINT despachos_maquina_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: despachos_maquina despachos_maquina_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despachos_maquina
    ADD CONSTRAINT despachos_maquina_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: dias_asistencia_semana dias_asistencia_semana_asistencia_semanal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dias_asistencia_semana
    ADD CONSTRAINT dias_asistencia_semana_asistencia_semanal_id_fkey FOREIGN KEY (asistencia_semanal_id) REFERENCES public.asistencias_semanales(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documento_etiquetas documento_etiquetas_documento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento_etiquetas
    ADD CONSTRAINT documento_etiquetas_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documentos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documento_etiquetas documento_etiquetas_etiqueta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento_etiquetas
    ADD CONSTRAINT documento_etiquetas_etiqueta_id_fkey FOREIGN KEY (etiqueta_id) REFERENCES public.etiquetas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documento_versiones documento_versiones_documento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento_versiones
    ADD CONSTRAINT documento_versiones_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documentos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documentos documentos_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documentos documentos_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documentos documentos_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documentos documentos_trabajador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_trabajador_id_fkey FOREIGN KEY (trabajador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: factura_conceptos factura_conceptos_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_conceptos
    ADD CONSTRAINT factura_conceptos_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.facturas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: facturas facturas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: facturas facturas_cotizacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_cotizacion_id_fkey FOREIGN KEY (cotizacion_id) REFERENCES public.cotizaciones(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fallas_mecanicas fallas_mecanicas_mantenimiento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fallas_mecanicas
    ADD CONSTRAINT fallas_mecanicas_mantenimiento_id_fkey FOREIGN KEY (mantenimiento_id) REFERENCES public.registros_mantenimiento(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fallas_mecanicas fallas_mecanicas_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fallas_mecanicas
    ADD CONSTRAINT fallas_mecanicas_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fallas_mecanicas fallas_mecanicas_reporto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fallas_mecanicas
    ADD CONSTRAINT fallas_mecanicas_reporto_id_fkey FOREIGN KEY (reporto_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: firmas_cliente firmas_cliente_bitacora_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firmas_cliente
    ADD CONSTRAINT firmas_cliente_bitacora_id_fkey FOREIGN KEY (bitacora_id) REFERENCES public.bitacoras_renta_diaria(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: firmas_digitales firmas_digitales_documento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firmas_digitales
    ADD CONSTRAINT firmas_digitales_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documentos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alertas_gps fk_alertas_gps_atendida_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertas_gps
    ADD CONSTRAINT fk_alertas_gps_atendida_por FOREIGN KEY (atendida_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: apu_items fk_apu_items_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apu_items
    ADD CONSTRAINT fk_apu_items_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: apu_items fk_apu_items_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apu_items
    ADD CONSTRAINT fk_apu_items_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: apu_templates fk_apu_templates_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apu_templates
    ADD CONSTRAINT fk_apu_templates_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: apu_templates fk_apu_templates_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apu_templates
    ADD CONSTRAINT fk_apu_templates_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: articulos_inventario fk_articulos_inventario_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos_inventario
    ADD CONSTRAINT fk_articulos_inventario_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: articulos_inventario fk_articulos_inventario_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos_inventario
    ADD CONSTRAINT fk_articulos_inventario_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: asistencias_semanales fk_asistencias_semanales_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias_semanales
    ADD CONSTRAINT fk_asistencias_semanales_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: asistencias_semanales fk_asistencias_semanales_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias_semanales
    ADD CONSTRAINT fk_asistencias_semanales_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: bitacoras_operacion fk_bitacoras_operacion_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacoras_operacion
    ADD CONSTRAINT fk_bitacoras_operacion_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: bitacoras_operacion fk_bitacoras_operacion_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacoras_operacion
    ADD CONSTRAINT fk_bitacoras_operacion_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: bitacoras_renta_diaria fk_bitacoras_renta_diaria_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacoras_renta_diaria
    ADD CONSTRAINT fk_bitacoras_renta_diaria_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: bitacoras_renta_diaria fk_bitacoras_renta_diaria_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacoras_renta_diaria
    ADD CONSTRAINT fk_bitacoras_renta_diaria_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: cargas_combustible fk_cargas_combustible_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cargas_combustible
    ADD CONSTRAINT fk_cargas_combustible_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: cargas_combustible fk_cargas_combustible_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cargas_combustible
    ADD CONSTRAINT fk_cargas_combustible_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: checklists_preoperacionales fk_checklists_preoperacionales_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists_preoperacionales
    ADD CONSTRAINT fk_checklists_preoperacionales_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: checklists_preoperacionales fk_checklists_preoperacionales_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists_preoperacionales
    ADD CONSTRAINT fk_checklists_preoperacionales_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: clientes fk_clientes_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT fk_clientes_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: clientes fk_clientes_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT fk_clientes_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: contactos_emergencia fk_contactos_emergencia_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contactos_emergencia
    ADD CONSTRAINT fk_contactos_emergencia_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: contactos_emergencia fk_contactos_emergencia_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contactos_emergencia
    ADD CONSTRAINT fk_contactos_emergencia_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: cotizacion_items fk_cotizacion_items_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizacion_items
    ADD CONSTRAINT fk_cotizacion_items_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: cotizacion_items fk_cotizacion_items_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizacion_items
    ADD CONSTRAINT fk_cotizacion_items_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: cotizaciones fk_cotizaciones_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT fk_cotizaciones_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: cotizaciones fk_cotizaciones_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT fk_cotizaciones_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: cotizaciones fk_cotizaciones_vendedor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT fk_cotizaciones_vendedor FOREIGN KEY (vendedor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: despachos_maquina fk_despachos_maquina_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despachos_maquina
    ADD CONSTRAINT fk_despachos_maquina_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: despachos_maquina fk_despachos_maquina_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despachos_maquina
    ADD CONSTRAINT fk_despachos_maquina_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: dias_asistencia_semana fk_dias_asistencia_semana_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dias_asistencia_semana
    ADD CONSTRAINT fk_dias_asistencia_semana_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: dias_asistencia_semana fk_dias_asistencia_semana_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dias_asistencia_semana
    ADD CONSTRAINT fk_dias_asistencia_semana_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: documento_versiones fk_documento_versiones_subido_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento_versiones
    ADD CONSTRAINT fk_documento_versiones_subido_por FOREIGN KEY (subido_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: documentos fk_documentos_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT fk_documentos_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: documentos fk_documentos_subido_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT fk_documentos_subido_por FOREIGN KEY (subido_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: facturas fk_facturas_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT fk_facturas_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: facturas fk_facturas_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT fk_facturas_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: fallas_mecanicas fk_fallas_mecanicas_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fallas_mecanicas
    ADD CONSTRAINT fk_fallas_mecanicas_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: fallas_mecanicas fk_fallas_mecanicas_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fallas_mecanicas
    ADD CONSTRAINT fk_fallas_mecanicas_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: firmas_cliente fk_firmas_cliente_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firmas_cliente
    ADD CONSTRAINT fk_firmas_cliente_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: firmas_cliente fk_firmas_cliente_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firmas_cliente
    ADD CONSTRAINT fk_firmas_cliente_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: geocercas fk_geocercas_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geocercas
    ADD CONSTRAINT fk_geocercas_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: geocercas fk_geocercas_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geocercas
    ADD CONSTRAINT fk_geocercas_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: hitos_progreso fk_hitos_progreso_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hitos_progreso
    ADD CONSTRAINT fk_hitos_progreso_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: hitos_progreso fk_hitos_progreso_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hitos_progreso
    ADD CONSTRAINT fk_hitos_progreso_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: horas_extra_asistencia fk_horas_extra_aprobador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horas_extra_asistencia
    ADD CONSTRAINT fk_horas_extra_aprobador FOREIGN KEY (aprobador_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: horas_extra_asistencia fk_horas_extra_asistencia_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horas_extra_asistencia
    ADD CONSTRAINT fk_horas_extra_asistencia_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: horas_extra_asistencia fk_horas_extra_asistencia_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horas_extra_asistencia
    ADD CONSTRAINT fk_horas_extra_asistencia_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lecturas_horometro fk_lecturas_horometro_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecturas_horometro
    ADD CONSTRAINT fk_lecturas_horometro_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lecturas_horometro fk_lecturas_horometro_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecturas_horometro
    ADD CONSTRAINT fk_lecturas_horometro_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: licencias_trabajador fk_licencias_trabajador_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencias_trabajador
    ADD CONSTRAINT fk_licencias_trabajador_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: licencias_trabajador fk_licencias_trabajador_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencias_trabajador
    ADD CONSTRAINT fk_licencias_trabajador_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: maquina_componentes fk_maquina_componentes_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquina_componentes
    ADD CONSTRAINT fk_maquina_componentes_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: maquina_componentes fk_maquina_componentes_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquina_componentes
    ADD CONSTRAINT fk_maquina_componentes_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: maquina_operadores fk_maquina_operadores_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquina_operadores
    ADD CONSTRAINT fk_maquina_operadores_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: maquina_operadores fk_maquina_operadores_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquina_operadores
    ADD CONSTRAINT fk_maquina_operadores_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: maquinas fk_maquinas_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquinas
    ADD CONSTRAINT fk_maquinas_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: maquinas fk_maquinas_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquinas
    ADD CONSTRAINT fk_maquinas_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: movimientos_inventario fk_movimientos_inventario_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT fk_movimientos_inventario_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: nominas fk_nominas_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nominas
    ADD CONSTRAINT fk_nominas_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: nominas fk_nominas_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nominas
    ADD CONSTRAINT fk_nominas_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notificaciones fk_notificaciones_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT fk_notificaciones_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notificaciones fk_notificaciones_destinatario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT fk_notificaciones_destinatario FOREIGN KEY (destinatario_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notificaciones_lecturas fk_notificaciones_lecturas_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones_lecturas
    ADD CONSTRAINT fk_notificaciones_lecturas_usuario FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: obras fk_obras_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT fk_obras_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: obras fk_obras_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT fk_obras_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ordenes_compra fk_ordenes_compra_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT fk_ordenes_compra_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ordenes_compra fk_ordenes_compra_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT fk_ordenes_compra_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: pagos fk_pagos_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT fk_pagos_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: pagos fk_pagos_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT fk_pagos_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: pagos_proveedor fk_pagos_proveedor_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos_proveedor
    ADD CONSTRAINT fk_pagos_proveedor_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: periodos_nomina fk_periodos_nomina_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodos_nomina
    ADD CONSTRAINT fk_periodos_nomina_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: periodos_nomina fk_periodos_nomina_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodos_nomina
    ADD CONSTRAINT fk_periodos_nomina_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: permisos fk_permisos_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT fk_permisos_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: permisos fk_permisos_aprobador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT fk_permisos_aprobador FOREIGN KEY (aprobador_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: permisos fk_permisos_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT fk_permisos_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: personas fk_personas_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT fk_personas_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: personas fk_personas_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT fk_personas_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: proveedores fk_proveedores_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT fk_proveedores_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: proveedores fk_proveedores_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT fk_proveedores_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: proyectos fk_proyectos_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT fk_proyectos_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: proyectos fk_proyectos_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT fk_proyectos_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: rastreo_gps fk_rastreo_gps_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rastreo_gps
    ADD CONSTRAINT fk_rastreo_gps_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: registros_asistencia fk_registros_asistencia_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_asistencia
    ADD CONSTRAINT fk_registros_asistencia_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: registros_asistencia fk_registros_asistencia_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_asistencia
    ADD CONSTRAINT fk_registros_asistencia_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: registros_criba fk_registros_criba_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_criba
    ADD CONSTRAINT fk_registros_criba_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: registros_criba fk_registros_criba_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_criba
    ADD CONSTRAINT fk_registros_criba_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: registros_mantenimiento fk_registros_mantenimiento_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_mantenimiento
    ADD CONSTRAINT fk_registros_mantenimiento_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: registros_mantenimiento fk_registros_mantenimiento_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_mantenimiento
    ADD CONSTRAINT fk_registros_mantenimiento_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reportes_campo fk_reportes_campo_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_campo
    ADD CONSTRAINT fk_reportes_campo_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reportes_campo fk_reportes_campo_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_campo
    ADD CONSTRAINT fk_reportes_campo_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reportes_campo fk_reportes_campo_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_campo
    ADD CONSTRAINT fk_reportes_campo_usuario FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: role_vistas fk_role_vistas_asignado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_vistas
    ADD CONSTRAINT fk_role_vistas_asignado_por FOREIGN KEY (asignado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: roles fk_roles_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT fk_roles_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: roles fk_roles_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT fk_roles_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: trabajadores fk_trabajadores_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores
    ADD CONSTRAINT fk_trabajadores_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: trabajadores fk_trabajadores_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores
    ADD CONSTRAINT fk_trabajadores_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: trabajadores_proyectos fk_trabajadores_proyectos_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores_proyectos
    ADD CONSTRAINT fk_trabajadores_proyectos_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: trabajadores_proyectos fk_trabajadores_proyectos_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores_proyectos
    ADD CONSTRAINT fk_trabajadores_proyectos_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: trabajadores fk_trabajadores_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores
    ADD CONSTRAINT fk_trabajadores_usuario FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transacciones fk_transacciones_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacciones
    ADD CONSTRAINT fk_transacciones_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: transacciones fk_transacciones_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacciones
    ADD CONSTRAINT fk_transacciones_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users fk_users_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users fk_users_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users_roles fk_users_roles_asignado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_roles
    ADD CONSTRAINT fk_users_roles_asignado_por FOREIGN KEY (asignado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: usuarios_bloqueados fk_usuarios_bloqueados_desbloqueado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_bloqueados
    ADD CONSTRAINT fk_usuarios_bloqueados_desbloqueado_por FOREIGN KEY (desbloqueado_manualmente_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: vistas fk_vistas_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistas
    ADD CONSTRAINT fk_vistas_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: vistas fk_vistas_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistas
    ADD CONSTRAINT fk_vistas_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: geocerca_maquinas geocerca_maquinas_geocerca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geocerca_maquinas
    ADD CONSTRAINT geocerca_maquinas_geocerca_id_fkey FOREIGN KEY (geocerca_id) REFERENCES public.geocercas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: geocerca_maquinas geocerca_maquinas_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geocerca_maquinas
    ADD CONSTRAINT geocerca_maquinas_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: hitos_progreso hitos_progreso_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hitos_progreso
    ADD CONSTRAINT hitos_progreso_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: horas_extra_asistencia horas_extra_asistencia_registro_asistencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horas_extra_asistencia
    ADD CONSTRAINT horas_extra_asistencia_registro_asistencia_id_fkey FOREIGN KEY (registro_asistencia_id) REFERENCES public.registros_asistencia(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: intentos_login intentos_login_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intentos_login
    ADD CONSTRAINT intentos_login_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: lecturas_horometro lecturas_horometro_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecturas_horometro
    ADD CONSTRAINT lecturas_horometro_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lecturas_horometro lecturas_horometro_operador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecturas_horometro
    ADD CONSTRAINT lecturas_horometro_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: licencias_trabajador licencias_trabajador_trabajador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencias_trabajador
    ADD CONSTRAINT licencias_trabajador_trabajador_id_fkey FOREIGN KEY (trabajador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: maquina_componentes maquina_componentes_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquina_componentes
    ADD CONSTRAINT maquina_componentes_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: maquina_operadores maquina_operadores_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquina_operadores
    ADD CONSTRAINT maquina_operadores_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: maquina_operadores maquina_operadores_trabajador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquina_operadores
    ADD CONSTRAINT maquina_operadores_trabajador_id_fkey FOREIGN KEY (trabajador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: maquinas maquinas_operador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquinas
    ADD CONSTRAINT maquinas_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: maquinas maquinas_tipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquinas
    ADD CONSTRAINT maquinas_tipo_id_fkey FOREIGN KEY (tipo_id) REFERENCES public.tipos_maquina(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: materiales_criba materiales_criba_articulo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materiales_criba
    ADD CONSTRAINT materiales_criba_articulo_id_fkey FOREIGN KEY (articulo_id) REFERENCES public.articulos_inventario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: movimientos_bancarios movimientos_bancarios_cuenta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_bancarios
    ADD CONSTRAINT movimientos_bancarios_cuenta_id_fkey FOREIGN KEY (cuenta_id) REFERENCES public.cuentas_bancarias(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: movimientos_bancarios movimientos_bancarios_transaccion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_bancarios
    ADD CONSTRAINT movimientos_bancarios_transaccion_id_fkey FOREIGN KEY (transaccion_id) REFERENCES public.transacciones(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: movimientos_inventario movimientos_inventario_articulo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_articulo_id_fkey FOREIGN KEY (articulo_id) REFERENCES public.articulos_inventario(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: nominas nominas_periodo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nominas
    ADD CONSTRAINT nominas_periodo_id_fkey FOREIGN KEY (periodo_id) REFERENCES public.periodos_nomina(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: nominas nominas_trabajador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nominas
    ADD CONSTRAINT nominas_trabajador_id_fkey FOREIGN KEY (trabajador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notificaciones notificaciones_audiencia_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_audiencia_rol_id_fkey FOREIGN KEY (audiencia_rol_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notificaciones_lecturas notificaciones_lecturas_notificacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones_lecturas
    ADD CONSTRAINT notificaciones_lecturas_notificacion_id_fkey FOREIGN KEY (notificacion_id) REFERENCES public.notificaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: obras obras_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ordenes_compra_items ordenes_compra_items_articulo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra_items
    ADD CONSTRAINT ordenes_compra_items_articulo_id_fkey FOREIGN KEY (articulo_id) REFERENCES public.articulos_inventario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ordenes_compra_items ordenes_compra_items_orden_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra_items
    ADD CONSTRAINT ordenes_compra_items_orden_compra_id_fkey FOREIGN KEY (orden_compra_id) REFERENCES public.ordenes_compra(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ordenes_compra ordenes_compra_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pagos pagos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pagos pagos_cuenta_por_cobrar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_cuenta_por_cobrar_id_fkey FOREIGN KEY (cuenta_por_cobrar_id) REFERENCES public.cuentas_por_cobrar(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pagos pagos_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.facturas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pagos_proveedor pagos_proveedor_orden_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos_proveedor
    ADD CONSTRAINT pagos_proveedor_orden_compra_id_fkey FOREIGN KEY (orden_compra_id) REFERENCES public.ordenes_compra(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pagos_proveedor pagos_proveedor_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos_proveedor
    ADD CONSTRAINT pagos_proveedor_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: percepciones_nomina percepciones_nomina_nomina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.percepciones_nomina
    ADD CONSTRAINT percepciones_nomina_nomina_id_fkey FOREIGN KEY (nomina_id) REFERENCES public.nominas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: permisos permisos_trabajador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_trabajador_id_fkey FOREIGN KEY (trabajador_id) REFERENCES public.trabajadores(id) ON DELETE RESTRICT;


--
-- Name: proyectos proyectos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rastreo_gps rastreo_gps_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rastreo_gps
    ADD CONSTRAINT rastreo_gps_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_reemplazado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_reemplazado_por_fkey FOREIGN KEY (reemplazado_por) REFERENCES public.refresh_tokens(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: registro_auditoria registro_auditoria_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registro_auditoria
    ADD CONSTRAINT registro_auditoria_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registros_asistencia registros_asistencia_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_asistencia
    ADD CONSTRAINT registros_asistencia_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registros_asistencia registros_asistencia_trabajador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_asistencia
    ADD CONSTRAINT registros_asistencia_trabajador_id_fkey FOREIGN KEY (trabajador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: registros_criba registros_criba_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_criba
    ADD CONSTRAINT registros_criba_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registros_criba registros_criba_material_criba_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_criba
    ADD CONSTRAINT registros_criba_material_criba_id_fkey FOREIGN KEY (material_criba_id) REFERENCES public.materiales_criba(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registros_criba registros_criba_operador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_criba
    ADD CONSTRAINT registros_criba_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registros_criba registros_criba_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_criba
    ADD CONSTRAINT registros_criba_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registros_mantenimiento registros_mantenimiento_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_mantenimiento
    ADD CONSTRAINT registros_mantenimiento_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: registros_mantenimiento registros_mantenimiento_mecanico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_mantenimiento
    ADD CONSTRAINT registros_mantenimiento_mecanico_id_fkey FOREIGN KEY (mecanico_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reportes_actividades reportes_actividades_reporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_actividades
    ADD CONSTRAINT reportes_actividades_reporte_id_fkey FOREIGN KEY (reporte_id) REFERENCES public.reportes_campo(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reportes_adjuntos reportes_adjuntos_reporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_adjuntos
    ADD CONSTRAINT reportes_adjuntos_reporte_id_fkey FOREIGN KEY (reporte_id) REFERENCES public.reportes_campo(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reportes_campo reportes_campo_asignado_a_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_campo
    ADD CONSTRAINT reportes_campo_asignado_a_id_fkey FOREIGN KEY (asignado_a_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reportes_campo reportes_campo_asignado_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_campo
    ADD CONSTRAINT reportes_campo_asignado_user_id_fkey FOREIGN KEY (asignado_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reportes_campo reportes_campo_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_campo
    ADD CONSTRAINT reportes_campo_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reportes_campo reportes_campo_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_campo
    ADD CONSTRAINT reportes_campo_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reportes_campo reportes_campo_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_campo
    ADD CONSTRAINT reportes_campo_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reportes_campo reportes_campo_subcategoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_campo
    ADD CONSTRAINT reportes_campo_subcategoria_id_fkey FOREIGN KEY (subcategoria_id) REFERENCES public.subcategorias_reporte(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permiso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_vistas role_vistas_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_vistas
    ADD CONSTRAINT role_vistas_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_vistas role_vistas_vista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_vistas
    ADD CONSTRAINT role_vistas_vista_id_fkey FOREIGN KEY (vista_id) REFERENCES public.vistas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trabajadores trabajadores_categoria_puesto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores
    ADD CONSTRAINT trabajadores_categoria_puesto_id_fkey FOREIGN KEY (categoria_puesto_id) REFERENCES public.categorias_puesto(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: trabajadores trabajadores_cliente_renta_actual_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores
    ADD CONSTRAINT trabajadores_cliente_renta_actual_id_fkey FOREIGN KEY (cliente_renta_actual_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: trabajadores_proyectos trabajadores_proyectos_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores_proyectos
    ADD CONSTRAINT trabajadores_proyectos_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trabajadores_proyectos trabajadores_proyectos_trabajador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores_proyectos
    ADD CONSTRAINT trabajadores_proyectos_trabajador_id_fkey FOREIGN KEY (trabajador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_jefe_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_jefe_user_id_fkey FOREIGN KEY (jefe_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_persona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.personas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users_roles users_roles_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_roles
    ADD CONSTRAINT users_roles_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users_roles users_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_roles
    ADD CONSTRAINT users_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: usuarios_bloqueados usuarios_bloqueados_nivel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_bloqueados
    ADD CONSTRAINT usuarios_bloqueados_nivel_id_fkey FOREIGN KEY (nivel_id) REFERENCES public.niveles_bloqueo(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: usuarios_bloqueados usuarios_bloqueados_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_bloqueados
    ADD CONSTRAINT usuarios_bloqueados_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ventas ventas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ventas_items ventas_items_articulo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas_items
    ADD CONSTRAINT ventas_items_articulo_id_fkey FOREIGN KEY (articulo_id) REFERENCES public.articulos_inventario(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ventas_items ventas_items_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas_items
    ADD CONSTRAINT ventas_items_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ventas_pagos ventas_pagos_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas_pagos
    ADD CONSTRAINT ventas_pagos_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vistas vistas_vista_padre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistas
    ADD CONSTRAINT vistas_vista_padre_id_fkey FOREIGN KEY (vista_padre_id) REFERENCES public.vistas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict KLMYbBa3Iy85jRhLyhgpzQpaOozHgrwhwnPVaU2usW8vzhFmgC1Mc24wnXIYfLn

