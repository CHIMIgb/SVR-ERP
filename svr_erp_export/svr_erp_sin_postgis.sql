--
-- PostgreSQL database dump
--

\restrict dTye1UQgeWBhEF0RvVWtpkCxeTx2tLBY2G9WSnQQsDiVQDSFolWa3xbC55oGX6n

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--



--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--



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
    'ERROR_SISTEMA'
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
    'SALIDA_ANTICIPADA'
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
    'ABIERTO',
    'EN_REVISION',
    'RESUELTO'
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
-- Name: EstadoReporteCampo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoReporteCampo" AS ENUM (
    'PENDIENTE',
    'VISTO',
    'ATENDIDO',
    'EN_REVISION',
    'RESUELTO'
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
    'MIXTO'
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
    'TRABAJADOR'
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
    fecha_hora timestamp(3) without time zone NOT NULL,
    descripcion text,
    atendida boolean DEFAULT false NOT NULL,
    atendida_por uuid,
    atendida_en timestamp(3) without time zone,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    CONSTRAINT chk_alertas_gps_severidad CHECK ((severidad = ANY (ARRAY['BAJA'::text, 'MEDIA'::text, 'ALTA'::text, 'CRITICA'::text]))),
    CONSTRAINT chk_alertas_gps_tipo CHECK ((tipo = ANY (ARRAY['EXCESO_VELOCIDAD'::text, 'ENTRADA_GEOCERCA'::text, 'SALIDA_GEOCERCA'::text, 'ENCENDIDO_FUERA_HORARIO'::text, 'APAGADO_INESPERADO'::text, 'SOS'::text, 'BATERIA_BAJA'::text])))
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
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    categoria_id uuid NOT NULL,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
    proveedor_id uuid NOT NULL,
    unidad_id uuid NOT NULL
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    codigo text,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
    hora time(0) without time zone NOT NULL
);


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id uuid NOT NULL,
    codigo text,
    nombre text NOT NULL,
    empresa text NOT NULL,
    correo text NOT NULL,
    telefono text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    direccion_fiscal jsonb,
    eliminado_en timestamp(3) without time zone,
    rfc text
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
    vendedor_id uuid
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    CONSTRAINT chk_cxc_estado CHECK ((estado = ANY (ARRAY['PENDIENTE'::text, 'PARCIAL'::text, 'PAGADO'::text, 'VENCIDO'::text])))
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
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
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    codigo text,
    actualizado_por uuid,
    descripcion text,
    eliminado_en timestamp(3) without time zone,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
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
    timbrado_en timestamp(3) without time zone,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp(3) without time zone,
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
    fecha_reporte timestamp(3) without time zone NOT NULL,
    fecha_resolucion timestamp(3) without time zone,
    costo_reparacion numeric(12,2),
    mantenimiento_id uuid,
    imagenes jsonb DEFAULT '[]'::jsonb NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp(3) without time zone,
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
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    archivo_firma text,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
    fecha_firma timestamp(3) without time zone
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
    fecha_firma timestamp(3) without time zone NOT NULL,
    ip_firma text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
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
    ultima_entrada timestamp(3) without time zone,
    ultima_salida timestamp(3) without time zone
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp(3) without time zone,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    descripcion text,
    eliminado_en timestamp(3) without time zone,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    actualizado_por uuid,
    aprobador_id uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
    inicio time(0) without time zone NOT NULL,
    fin time(0) without time zone
);


--
-- Name: incidentes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incidentes (
    id uuid NOT NULL,
    codigo text,
    titulo text NOT NULL,
    descripcion text NOT NULL,
    prioridad public."Prioridad" NOT NULL,
    estado public."EstadoIncidente" DEFAULT 'ABIERTO'::public."EstadoIncidente" NOT NULL,
    fecha date NOT NULL,
    maquina_id uuid,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
    obra_id uuid,
    obra_texto text NOT NULL,
    reporto_id uuid
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    codigo text,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    actualizado_por uuid,
    archivo_url text,
    categoria public."CategoriaLicencia" NOT NULL,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp(3) without time zone,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp(3) without time zone
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    anio integer,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
    modelo text,
    placas text,
    serie text,
    tipo_id uuid NOT NULL,
    CONSTRAINT chk_lat_lng CHECK ((((lat >= ('-90'::integer)::numeric) AND (lat <= (90)::numeric)) AND ((lng >= ('-180'::integer)::numeric) AND (lng <= (180)::numeric))))
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
    fecha timestamp(3) without time zone NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp(3) without time zone,
    CONSTRAINT chk_nominas_estado CHECK ((estado = ANY (ARRAY['PENDIENTE'::text, 'PAGADA'::text, 'CANCELADA'::text])))
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp(3) without time zone
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp(3) without time zone,
    CONSTRAINT chk_pagos_estado CHECK ((estado = ANY (ARRAY['PENDIENTE'::text, 'CONFIRMADO'::text, 'RECHAZADO'::text])))
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp(3) without time zone,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    codigo text,
    actualizado_por uuid,
    aprobador_id uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
    CONSTRAINT chk_permiso_fechas CHECK ((fecha_fin >= fecha_inicio))
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp(3) without time zone
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp(3) without time zone
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
    CONSTRAINT chk_proyecto_fechas CHECK ((fecha_fin >= fecha_inicio)),
    CONSTRAINT chk_proyecto_progreso CHECK (((progreso >= (0)::numeric) AND (progreso <= (100)::numeric)))
);


--
-- Name: rastreo_gps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rastreo_gps (
    id uuid NOT NULL,
    maquina_id uuid NOT NULL,
    fecha_hora timestamp(3) without time zone NOT NULL,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por uuid
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    jti uuid NOT NULL,
    token_hash text NOT NULL,
    emitido_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expira_en timestamp(3) without time zone NOT NULL,
    usado_en timestamp(3) without time zone,
    reemplazado_por uuid,
    revocado_en timestamp(3) without time zone,
    motivo_revocado text,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: registro_auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registro_auditoria (
    event_id uuid NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
    obra_id uuid,
    hora_entrada time(0) without time zone,
    hora_salida time(0) without time zone,
    hora_marcaje_exacta time(0) without time zone,
    hora_salida_exacta time(0) without time zone
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
    mecanico_id uuid,
    refacciones_usadas jsonb
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
    estado public."EstadoReporteCampo" DEFAULT 'PENDIENTE'::public."EstadoReporteCampo" NOT NULL,
    prioridad public."Prioridad",
    detalles jsonb,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
    obra_id uuid,
    obra_texto text NOT NULL,
    usuario_id uuid,
    hora time(0) without time zone NOT NULL
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    rol_id uuid NOT NULL,
    permiso_id uuid NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    asignado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp(3) without time zone
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
    iniciada_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ultima_actividad timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expira_en timestamp(3) without time zone NOT NULL,
    cerrada_en timestamp(3) without time zone,
    motivo_cierre text,
    activa boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
);


--
-- Name: tipos_maquina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_maquina (
    id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
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
    expira_en timestamp(3) without time zone NOT NULL,
    agregado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    categoria_puesto_id uuid NOT NULL,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
    entrada time(0) without time zone NOT NULL,
    CONSTRAINT chk_sueldos CHECK (((sueldo_fiscal >= (0)::numeric) AND (sueldo_efectivo >= (0)::numeric)))
);


--
-- Name: trabajadores_proyectos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trabajadores_proyectos (
    trabajador_id uuid NOT NULL,
    proyecto_id uuid NOT NULL,
    asignado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    actualizado_por uuid,
    creado_por uuid,
    eliminado_en timestamp(3) without time zone,
    entidad_id uuid,
    entidad_tipo text,
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
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
    ultimo_login timestamp(3) without time zone,
    preferencias jsonb DEFAULT '{}'::jsonb NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp(3) without time zone
);


--
-- Name: users_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users_roles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    rol_id uuid NOT NULL,
    es_principal boolean DEFAULT false NOT NULL,
    asignado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    asignado_por uuid,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: usuarios_bloqueados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios_bloqueados (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    nivel_id uuid,
    nivel_numero integer NOT NULL,
    intentos_fallidos_consecutivos integer NOT NULL,
    bloqueado_desde timestamp(3) without time zone NOT NULL,
    bloqueado_hasta timestamp(3) without time zone NOT NULL,
    desbloqueado_en timestamp(3) without time zone,
    desbloqueado_manualmente_por uuid,
    motivo text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    CONSTRAINT chk_usuarios_bloqueados_fechas CHECK ((bloqueado_hasta >= bloqueado_desde)),
    CONSTRAINT chk_usuarios_bloqueados_intentos CHECK ((intentos_fallidos_consecutivos >= 5))
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
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_en timestamp(3) without time zone
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
01654924-34c4-4aa1-a75e-52476e00b316	c71e163ff37ee24bd449350eb4b04dc0c291c331b502644076bfb624ccb880ec	2026-08-20 20:07:39.312022-06	20260818225731_init	\N	\N	2026-08-20 20:07:39.025428-06	1
75cceacf-2c11-4be5-a365-3a7d710e5f5b	9b18a8632276cc1b1e2f7ec25a8e0b0ebc9dcef016e1c6e641c50ee0ac6f2a18	2026-08-20 20:07:39.323063-06	20260818225808_remove_redundant_relation	\N	\N	2026-08-20 20:07:39.31236-06	1
d1dd567f-f65f-4745-87fa-83e8b33957b1	9f775d4f9c96cac5680f3ef202c123a1d70dc187da4e662bf290652227fa2b85	2026-08-20 20:07:39.33704-06	20260818231500_schema_fixes_verificacion	\N	\N	2026-08-20 20:07:39.323496-06	1
08078ec5-9707-4b93-a1e8-45156b65e8a2	f629da4041082a8555c420a864148f7f9052b1941ef9ecc963af249f4c55c07e	2026-08-20 20:08:10.78035-06	20260820200000_esquema_v2_completo	\N	\N	2026-08-20 20:08:10.335763-06	1
8594cd0f-00f2-4b28-9bf8-1514479bf2bf	b2fb6f4581b8cbf9d1caec8d4af90d6b75a4d8b055d11adbf8afc907c15feaf9	\N	20260820203000_reglas_sql_y_auditoria	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260820203000_reglas_sql_y_auditoria\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: la restricción «fk_documentos_actualizado_por» para la relación «documentos» ya existe\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "la restricción «fk_documentos_actualizado_por» para la relación «documentos» ya existe", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(9015), routine: Some("ATExecAddConstraint") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260820203000_reglas_sql_y_auditoria"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260820203000_reglas_sql_y_auditoria"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:255	2026-08-20 20:11:11.700761-06	2026-08-20 20:10:30.513701-06	0
725f61b7-f687-4f20-9576-457b3ff02687	27154daf95ff4bb27b4e681705fe746c13e62f600c50731427fd8644fdd77394	2026-08-20 20:11:17.916648-06	20260820203000_reglas_sql_y_auditoria	\N	\N	2026-08-20 20:11:17.771115-06	1
d4e10e28-3cf2-44a4-a070-a000f4801abd	56c7ca1bc23ff484b0e8175b1d504198a37bd8cdaf9b252164ffcdd6c4608bfd	2026-08-20 21:01:27.932373-06	20260821000000_bloqueo_cuentas	\N	\N	2026-08-20 21:01:27.875688-06	1
fdf15eb4-c70d-4e87-847c-a01e9283b159	22d46d67d6e0cdc612a10f4761f73c963d7d625f7330e59e6701a262002b027a	2026-08-20 21:12:00.241448-06	20260821010000_postgis_geometrias	\N	\N	2026-08-20 21:12:00.175301-06	1
\.


--
-- Data for Name: alertas_gps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alertas_gps (id, maquina_id, tipo, severidad, lat, lng, fecha_hora, descripcion, atendida, atendida_por, atendida_en, activo, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: apu_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.apu_items (id, apu_template_id, categoria, nombre, cantidad, costo_unitario, activo, actualizado_en, actualizado_por, creado_en, creado_por, eliminado_en, unidad_id) FROM stdin;
19ce67b2-680c-4b0c-a94e-f0062ae4a222	dfa9a24b-4b4c-478b-a68c-4585ca7cab25	MATERIAL	Concreto Premezclado f'c=250	0.1200	2200.00	t	2026-08-21 02:14:59.176	\N	2026-08-21 02:14:59.176	\N	\N	859c80fa-b812-409b-8a73-df80b792a132
5d6614b9-77ca-4bbc-89bd-3ffb7690f99f	dfa9a24b-4b4c-478b-a68c-4585ca7cab25	MATERIAL	Malla Electrosoldada 6-6/10-10	1.1500	45.00	t	2026-08-21 02:14:59.176	\N	2026-08-21 02:14:59.176	\N	\N	ff1462a0-24da-4cc9-ae87-fe4552063dbf
085936ad-da7b-4c70-9ba4-104a375c8721	dfa9a24b-4b4c-478b-a68c-4585ca7cab25	MATERIAL	Madera para Cimbra (Uso)	2.5000	18.00	t	2026-08-21 02:14:59.176	\N	2026-08-21 02:14:59.176	\N	\N	cddac107-cf7a-4d94-9344-57b22a508c26
e2bc67d8-f90e-42a8-b8d5-973064eeb124	dfa9a24b-4b4c-478b-a68c-4585ca7cab25	MANO_DE_OBRA	Cuadrilla de Albañilería (1 Oficial + 2 Ayudantes)	0.0500	1800.00	t	2026-08-21 02:14:59.176	\N	2026-08-21 02:14:59.176	\N	\N	d6118e1e-11c0-4e53-8725-1f1b801d9841
e5e843f3-6036-4018-a404-fbecc1562557	dfa9a24b-4b4c-478b-a68c-4585ca7cab25	MANO_DE_OBRA	Cabo de Oficios	0.0050	2200.00	t	2026-08-21 02:14:59.176	\N	2026-08-21 02:14:59.176	\N	\N	d6118e1e-11c0-4e53-8725-1f1b801d9841
5d77b114-097a-4fe9-aafe-226652e6def4	dfa9a24b-4b4c-478b-a68c-4585ca7cab25	MAQUINARIA	Vibrador para Concreto 4HP	0.2000	150.00	t	2026-08-21 02:14:59.176	\N	2026-08-21 02:14:59.176	\N	\N	9256e1ce-cc2c-4ec3-a268-6b41240f2471
77ea17e2-bf8d-48a1-8e25-73c5f25092a6	dfa9a24b-4b4c-478b-a68c-4585ca7cab25	MAQUINARIA	Herramienta Menor (3% Mano de Obra)	1.0000	3.50	t	2026-08-21 02:14:59.176	\N	2026-08-21 02:14:59.176	\N	\N	20c20a29-da38-4fc7-a50d-3aed186c429e
fdb265de-6b1d-4952-ac8d-1c41b59707c7	fded9146-5b46-4739-8e36-4306f20998ad	MANO_DE_OBRA	Cuadrilla de Operación (1 Operador + 1 Ayudante)	0.0200	2000.00	t	2026-08-21 02:14:59.181	\N	2026-08-21 02:14:59.181	\N	\N	d6118e1e-11c0-4e53-8725-1f1b801d9841
90c880ee-6888-4c07-839e-6c177aa2abee	fded9146-5b46-4739-8e36-4306f20998ad	MANO_DE_OBRA	Ayudante general (limpieza)	0.0400	700.00	t	2026-08-21 02:14:59.181	\N	2026-08-21 02:14:59.181	\N	\N	d6118e1e-11c0-4e53-8725-1f1b801d9841
53d0c255-a4eb-4894-8291-ec5740bd50b8	fded9146-5b46-4739-8e36-4306f20998ad	MAQUINARIA	Excavadora CAT 320 (incluye diésel)	0.1500	850.00	t	2026-08-21 02:14:59.181	\N	2026-08-21 02:14:59.181	\N	\N	9256e1ce-cc2c-4ec3-a268-6b41240f2471
e3cb0608-ec22-49c2-b72d-16f33ebacfcc	fded9146-5b46-4739-8e36-4306f20998ad	MAQUINARIA	Herramienta Menor	1.0000	2.00	t	2026-08-21 02:14:59.181	\N	2026-08-21 02:14:59.181	\N	\N	20c20a29-da38-4fc7-a50d-3aed186c429e
c94c9698-31ca-450d-aa9a-fa48ada8a441	493aaccf-1234-4ec3-b7f4-f2e6c43e5461	MATERIAL	Block de Concreto 15x20x40	12.5000	14.00	t	2026-08-21 02:14:59.184	\N	2026-08-21 02:14:59.184	\N	\N	0f042f87-bebf-4c10-b591-6de9f369b3e6
a60f75f1-549b-44cd-b05c-8a6d71205626	493aaccf-1234-4ec3-b7f4-f2e6c43e5461	MATERIAL	Mortero Cemento-Arena 1:5	0.0150	1600.00	t	2026-08-21 02:14:59.184	\N	2026-08-21 02:14:59.184	\N	\N	859c80fa-b812-409b-8a73-df80b792a132
01c9ce42-08f9-4749-b694-cb797520e158	493aaccf-1234-4ec3-b7f4-f2e6c43e5461	MATERIAL	Andamios (Renta)	0.1000	50.00	t	2026-08-21 02:14:59.184	\N	2026-08-21 02:14:59.184	\N	\N	3c735df8-1cd3-4ba9-a8d6-cda84f8d98a0
beb937da-1e3d-41ba-9400-c1b446da1301	493aaccf-1234-4ec3-b7f4-f2e6c43e5461	MANO_DE_OBRA	Cuadrilla de Albañiles (1 Oficial + 1 Ayudante)	0.0800	1400.00	t	2026-08-21 02:14:59.184	\N	2026-08-21 02:14:59.184	\N	\N	d6118e1e-11c0-4e53-8725-1f1b801d9841
e7a17a2e-e195-4cde-8f4d-333def3e47ea	493aaccf-1234-4ec3-b7f4-f2e6c43e5461	MAQUINARIA	Revolvedora de Concreto 1 saco	0.1000	80.00	t	2026-08-21 02:14:59.184	\N	2026-08-21 02:14:59.184	\N	\N	9256e1ce-cc2c-4ec3-a268-6b41240f2471
\.


--
-- Data for Name: apu_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.apu_templates (id, codigo, nombre, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, unidad_id) FROM stdin;
dfa9a24b-4b4c-478b-a68c-4585ca7cab25	APU001	Colado de Losa de Concreto f'c=250 kg/cm²	t	2026-08-21 02:14:59.176	2026-08-21 02:14:59.176	\N	\N	\N	ff1462a0-24da-4cc9-ae87-fe4552063dbf
fded9146-5b46-4739-8e36-4306f20998ad	APU002	Excavación Mecánica en Terreno Tipo B	t	2026-08-21 02:14:59.181	2026-08-21 02:14:59.181	\N	\N	\N	859c80fa-b812-409b-8a73-df80b792a132
493aaccf-1234-4ec3-b7f4-f2e6c43e5461	APU003	Muro de Block de Concreto 15x20x40 cm	t	2026-08-21 02:14:59.184	2026-08-21 02:14:59.184	\N	\N	\N	ff1462a0-24da-4cc9-ae87-fe4552063dbf
\.


--
-- Data for Name: articulos_inventario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.articulos_inventario (id, codigo, nombre, stock, stock_minimo, precio_unitario, activo, creado_en, actualizado_en, actualizado_por, categoria_id, creado_por, eliminado_en, proveedor_id, unidad_id) FROM stdin;
372d5385-6846-46de-bc2e-e15663ab8fc6	I001	Filtro de Aceite CAT	12.00	5.00	450.00	t	2026-08-21 02:14:59.121	2026-08-21 02:14:59.121	\N	fb2240f1-776d-404f-9eb9-778c05e57fad	\N	\N	22d61153-008b-479f-bd4b-3df58f7f5b2f	936fbba3-8af5-4bb8-ba36-ab99d462ae05
5c3afc42-0623-46ad-988d-55b227a48673	I002	Aceite Hidráulico SAE 10W	45.00	100.00	1200.00	t	2026-08-21 02:14:59.122	2026-08-21 02:14:59.122	\N	824c9e7e-30e1-43d8-868b-205b6403ead8	\N	\N	bd7a0bff-6245-4c61-ab32-69f698abc750	7ef1227e-8879-4ed7-ae09-3497610b5d02
b0a74063-1fd6-4b7e-ac55-bc3d8a56e0a9	I003	Llanta para Volteo 11R22.5	4.00	4.00	8500.00	t	2026-08-21 02:14:59.124	2026-08-21 02:14:59.124	\N	af90f6f0-334d-4a06-8adb-5a0622f131d8	\N	\N	53e3ab7a-8296-4344-a36e-8b5a3e3fc7d3	936fbba3-8af5-4bb8-ba36-ab99d462ae05
\.


--
-- Data for Name: asistencias_semanales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asistencias_semanales (id, trabajador_id, semana, total_dias_asistidos, total_faltas, total_retardos, total_horas_ordinarias, total_horas_extra, creado_en, actualizado_en, activo, actualizado_por, creado_por, eliminado_en) FROM stdin;
9ae6581e-43c8-4578-aadf-ecddb50198e2	d69e3ac7-f268-4533-a7ed-780c000f4ad7	Semana 17 (21 Abr - 26 Abr 2025)	6	0	1	48.00	6.50	2026-08-21 02:14:59.104	2026-08-21 02:14:59.104	t	\N	\N	\N
511a9fcd-b046-4f24-84c0-74d9ba1f995b	ea344f07-0905-4881-a64b-b7315f0bfe97	Semana 17 (21 Abr - 26 Abr 2025)	6	0	0	48.00	4.50	2026-08-21 02:14:59.109	2026-08-21 02:14:59.109	t	\N	\N	\N
6194964e-9325-4213-9cdf-3902c62c54bc	fe2ec7b7-7fda-4c09-af19-279f41215d06	Semana 17 (21 Abr - 26 Abr 2025)	5	1	2	40.00	0.00	2026-08-21 02:14:59.114	2026-08-21 02:14:59.114	t	\N	\N	\N
9f60d932-a357-42e2-a7c3-d9532738df5b	f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	Semana 17 (21 Abr - 26 Abr 2025)	6	0	0	45.75	0.00	2026-08-21 02:14:59.118	2026-08-21 02:14:59.118	t	\N	\N	\N
\.


--
-- Data for Name: bitacoras_operacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bitacoras_operacion (id, maquina_id, actividad, horas, fecha, activo, creado_en, actualizado_en, codigo, actualizado_por, creado_por, eliminado_en, obra_id, obra_texto) FROM stdin;
e8e8a795-df1d-42f9-a666-e713532de405	b7bb9152-0851-4372-9e55-b393fa7da463	Excavación para cimentación profunda	8.00	2025-04-27	t	2026-08-21 02:14:59.159	2026-08-21 02:14:59.159	B001	\N	\N	\N	\N	Valle Sur
393a36d5-b70c-4e1f-b899-1c2e097c10f3	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	Acarreo de escombro a tiro autorizado	6.00	2025-04-27	t	2026-08-21 02:14:59.162	2026-08-21 02:14:59.162	B002	\N	\N	\N	\N	Valle Sur
\.


--
-- Data for Name: bitacoras_renta_diaria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bitacoras_renta_diaria (id, folio, trabajador_id, maquina_id, fecha, cliente_id, obra_ubicacion, horas_efectivas, horas_extras, horometro_inicial, horometro_final, actividad_realizada, estado_cobro, tarifa_hora_renta, importe_total_renta, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, obra_id, hora_inicio, hora_fin) FROM stdin;
e71db8bb-8c68-488b-92f1-cc4b6b9f3115	BIT-2025-042	d69e3ac7-f268-4533-a7ed-780c000f4ad7	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	f600f831-a44a-4930-9fc0-8e5ec1ee9450	Fraccionamiento Valle Sur (Manzana 4)	8.00	2.50	1238.50	1249.00	Excavación de zanja pluvial 80m lineales, afine de talud y carga de material sobrante a camiones de volteo.	LISTO_FACTURAR	1450.00	15225.00	t	2026-08-21 02:14:59.076	2026-08-21 02:14:59.076	\N	\N	\N	\N	07:00:00	17:30:00
972b3c29-cf18-4de3-af2e-774941f8116e	BIT-2025-041	ea344f07-0905-4881-a64b-b7315f0bfe97	27800748-89c1-4900-8b5d-31926fc63836	2025-04-27	a298e1f4-5cfb-478b-b0ad-5e7e7e25308d	Remodelación Centro Histórico (Calle 5 de Mayo)	8.00	0.00	885.00	893.00	Demolición de banquetas dañadas, retiro de escombro y apertura de cajas para tubería de gas natural.	FACTURADO	950.00	7600.00	t	2026-08-21 02:14:59.08	2026-08-21 02:14:59.08	\N	\N	\N	\N	07:00:00	15:00:00
18a90b16-13de-454d-80d4-d05f8d03928d	BIT-2025-040	fe2ec7b7-7fda-4c09-af19-279f41215d06	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2025-04-26	cc2f4d26-2ef8-4579-8ca6-6a8e5006daae	Tramo Carretero Atizapán Km 14+200	8.00	3.50	3410.00	3421.50	12 viajes de acarreo de base hidráulica y tepetate desde banco de tiro a terraplén principal.	PENDIENTE_FIRMA	850.00	9775.00	t	2026-08-21 02:14:59.084	2026-08-21 02:14:59.084	\N	\N	\N	\N	06:30:00	18:00:00
\.


--
-- Data for Name: cargas_combustible; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cargas_combustible (id, codigo, maquina_id, fecha, litros, costo, operador_id, lugar, horometro_actual, horas_trabajadas_periodo, consumo_esperado_lts_hora, rendimiento_lts_hora, alerta_ordena, desviacion_porcentaje, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en) FROM stdin;
4002b850-9511-4901-be63-bb3715c38bad	F001	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	110.00	2530.00	d69e3ac7-f268-4533-a7ed-780c000f4ad7	Gasolinera Norte	1245.50	8.00	14.00	13.75	f	-1.80	t	2026-08-21 02:14:59.053	2026-08-21 02:14:59.053	\N	\N	\N
12947003-b903-4cb3-8841-47327c60580c	F002	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2025-04-27	200.00	4600.00	fe2ec7b7-7fda-4c09-af19-279f41215d06	Autoconsumo Obra Valle Sur	3421.10	8.50	12.00	23.53	t	96.10	t	2026-08-21 02:14:59.056	2026-08-21 02:14:59.056	\N	\N	\N
b5530433-43c1-4d96-8355-261553cd1960	F003	27800748-89c1-4900-8b5d-31926fc63836	2025-04-26	45.00	1035.00	ea344f07-0905-4881-a64b-b7315f0bfe97	Gasolinera Centro	890.20	4.80	9.50	9.38	f	-1.20	t	2026-08-21 02:14:59.059	2026-08-21 02:14:59.059	\N	\N	\N
\.


--
-- Data for Name: categorias_inventario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorias_inventario (id, nombre, descripcion, activo, creado_en, actualizado_en) FROM stdin;
fb2240f1-776d-404f-9eb9-778c05e57fad	Refacciones	\N	t	2026-08-21 02:14:58.942	2026-08-21 02:14:58.942
824c9e7e-30e1-43d8-868b-205b6403ead8	Lubricantes	\N	t	2026-08-21 02:14:58.943	2026-08-21 02:14:58.943
af90f6f0-334d-4a06-8adb-5a0622f131d8	Neumáticos	\N	t	2026-08-21 02:14:58.944	2026-08-21 02:14:58.944
\.


--
-- Data for Name: categorias_puesto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorias_puesto (id, nombre, descripcion, salario_base_sugerido, activo, creado_en, actualizado_en) FROM stdin;
923aa0cd-8e76-43e6-95a9-3be3c96ca14e	Operador	\N	\N	t	2026-08-21 02:14:58.931	2026-08-21 02:14:58.931
e71fb890-67e3-4e62-8cc1-b5170a4f0606	Administrativo	\N	\N	t	2026-08-21 02:14:58.932	2026-08-21 02:14:58.932
457083fb-f806-47f5-bf2e-46d75b6bd610	Chofer	\N	\N	t	2026-08-21 02:14:58.933	2026-08-21 02:14:58.933
c1c154bb-be3a-4694-9273-f07c64d2dec1	Mecanico	\N	\N	t	2026-08-21 02:14:58.934	2026-08-21 02:14:58.934
3f66ae71-7d0d-45b6-8e2f-eb9e5aa5715b	Ingeniero	\N	\N	t	2026-08-21 02:14:58.935	2026-08-21 02:14:58.935
\.


--
-- Data for Name: checklists_preoperacionales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.checklists_preoperacionales (id, codigo, maquina_id, fecha, operador_id, horometro_inicial, nivel_aceite_motor, nivel_hidraulico, fugas_visibles, estado_llantas_orugas, luces_y_alarmas, sistema_frenos, estado, observaciones, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, hora) FROM stdin;
bea53cc7-5bd1-4462-a8d6-d93d6281dee7	CHK-001	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	d69e3ac7-f268-4533-a7ed-780c000f4ad7	1239.20	CORRECTO	CORRECTO	f	CORRECTO	CORRECTO	CORRECTO	APROBADO	Equipo en óptimas condiciones para inicio de jornada.	t	2026-08-21 02:14:59.045	2026-08-21 02:14:59.045	\N	\N	\N	06:50:00
5d366a55-7036-44f7-8600-a024bdeaba81	CHK-002	27800748-89c1-4900-8b5d-31926fc63836	2025-04-27	ea344f07-0905-4881-a64b-b7315f0bfe97	885.40	CORRECTO	BAJO	t	CORRECTO	CORRECTO	CORRECTO	CON_FALLA	Goteo visible en manguera de cilindro de elevación. Requiere reapriete de niple.	t	2026-08-21 02:14:59.048	2026-08-21 02:14:59.048	\N	\N	\N	07:10:00
dfbe08c7-a662-4ed6-9fd0-b929ae60c7fc	CHK-004	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2025-04-27	fe2ec7b7-7fda-4c09-af19-279f41215d06	3412.60	CORRECTO	CORRECTO	f	CORRECTO	CORRECTO	CORRECTO	APROBADO	Inspección pre-operacional conforme.	t	2026-08-21 02:14:59.051	2026-08-21 02:14:59.051	\N	\N	\N	06:45:00
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clientes (id, codigo, nombre, empresa, correo, telefono, activo, creado_en, actualizado_en, actualizado_por, creado_por, direccion_fiscal, eliminado_en, rfc) FROM stdin;
f600f831-a44a-4930-9fc0-8e5ec1ee9450	C001	Ing. Alberto Ruiz	Inmobiliaria ARCO	aruiz@arco.com	555-9988	t	2026-08-21 02:14:58.948	2026-08-21 02:14:58.948	\N	\N	\N	\N	\N
3a05641a-c5eb-4676-8ec3-720b3e2d7ba1	C002	Lic. Martha Silva	Gobierno CDMX	msilva@gob.mx	555-1122	t	2026-08-21 02:14:58.951	2026-08-21 02:14:58.951	\N	\N	\N	\N	\N
cf8c9e99-7dac-4337-a50f-82db43546a6a	\N	SCT	SCT			t	2026-08-21 02:14:58.952	2026-08-21 02:14:58.952	\N	\N	\N	\N	\N
cc2f4d26-2ef8-4579-8ca6-6a8e5006daae	\N	Constructora ABC / SCT	Constructora ABC / SCT			t	2026-08-21 02:14:58.953	2026-08-21 02:14:58.953	\N	\N	\N	\N	\N
a298e1f4-5cfb-478b-b0ad-5e7e7e25308d	\N	Gobierno CDMX - Obras Públicas	Gobierno CDMX - Obras Públicas			t	2026-08-21 02:14:58.954	2026-08-21 02:14:58.954	\N	\N	\N	\N	\N
\.


--
-- Data for Name: contactos_emergencia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contactos_emergencia (id, trabajador_id, nombre, telefono, parentesco, creado_en, actualizado_en, activo, actualizado_por, creado_por, eliminado_en) FROM stdin;
44160b89-de8b-4593-af72-61ea392bc038	d69e3ac7-f268-4533-a7ed-780c000f4ad7	María Gómez	55 9876 5432	Esposa	2026-08-21 02:14:58.977	2026-08-21 02:14:58.977	t	\N	\N	\N
2d72e0bf-299c-4ace-b64b-e105b635e234	ea344f07-0905-4881-a64b-b7315f0bfe97	Rosa Pérez	55 1122 3344	Madre	2026-08-21 02:14:58.984	2026-08-21 02:14:58.984	t	\N	\N	\N
8f3ed4c6-35c4-4747-9c2f-3eeaf5bb4244	f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	Carlos Martínez	55 5566 7788	Hermano	2026-08-21 02:14:58.989	2026-08-21 02:14:58.989	t	\N	\N	\N
3aeda245-5659-463c-a437-cb25546a6766	fe2ec7b7-7fda-4c09-af19-279f41215d06	Lucía Torres	55 9988 7766	Esposa	2026-08-21 02:14:58.993	2026-08-21 02:14:58.993	t	\N	\N	\N
fae8dc6a-1a28-47a5-9a30-006e56447bde	99ef344b-2f95-4dec-8f4f-dccc4bb43351	Laura Soto	55 4433 2211	Esposa	2026-08-21 02:14:58.998	2026-08-21 02:14:58.998	t	\N	\N	\N
3b99582c-b911-4a63-aaec-f99a1282e30a	7ae68a33-6be6-46f3-8344-2dbf7389540d	Patricia Valenzuela	55 7788 9900	Hermana	2026-08-21 02:14:59.004	2026-08-21 02:14:59.004	t	\N	\N	\N
\.


--
-- Data for Name: cotizaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cotizaciones (id, codigo, cliente_id, descripcion, monto, fecha, estado, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, vendedor_id) FROM stdin;
c4d700e7-b55b-45e4-8d3e-faec0ac44bd2	Q001	f600f831-a44a-4930-9fc0-8e5ec1ee9450	Renta de Excavadora 320 por 100 horas	125000.00	2025-04-25	ACEPTADA	t	2026-08-21 02:14:59.125	2026-08-21 02:14:59.125	\N	\N	\N	\N
10039415-ed0a-4c40-a1a6-7b6b639dc62f	Q002	f600f831-a44a-4930-9fc0-8e5ec1ee9450	Movimiento de tierras Valle Sur - Fase 2	450000.00	2025-04-27	PENDIENTE	t	2026-08-21 02:14:59.127	2026-08-21 02:14:59.127	\N	\N	\N	\N
\.


--
-- Data for Name: cuentas_por_cobrar; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cuentas_por_cobrar (id, cliente_id, factura_id, bitacora_id, monto, monto_pagado, fecha_vencimiento, estado, activo, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: deducciones_nomina; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deducciones_nomina (id, nomina_id, concepto, tipo, monto, activo, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: despachos_maquina; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.despachos_maquina (id, codigo, maquina_id, proyecto_id, fecha_inicio, fecha_fin, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, operador_id) FROM stdin;
c00b78c6-8312-4868-8737-56f64da2a3cb	DSP001	b7bb9152-0851-4372-9e55-b393fa7da463	00692bdb-27d2-4e7b-be62-16c2977e1650	2025-04-20	2025-05-02	t	2026-08-21 02:14:59.07	2026-08-21 02:14:59.07	\N	\N	\N	\N
23f62901-8acf-4baf-acc0-016eb3137deb	DSP002	27800748-89c1-4900-8b5d-31926fc63836	21b6cf72-c07c-40e8-aac6-b538511f5127	2025-04-25	2025-04-29	t	2026-08-21 02:14:59.071	2026-08-21 02:14:59.071	\N	\N	\N	\N
e7fc1ff4-96d1-4460-a680-1469eb8e338d	DSP004	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	00692bdb-27d2-4e7b-be62-16c2977e1650	2025-04-22	2025-04-30	t	2026-08-21 02:14:59.072	2026-08-21 02:14:59.072	\N	\N	\N	\N
\.


--
-- Data for Name: dias_asistencia_semana; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dias_asistencia_semana (id, asistencia_semanal_id, dia, estado, horas_trabajadas, horas_extra, en_sitio_gps, motivo, activo, actualizado_en, actualizado_por, creado_en, creado_por, eliminado_en, fecha, hora_entrada, hora_salida) FROM stdin;
a7b3162e-44d4-495f-9705-e8306314b16f	9ae6581e-43c8-4578-aadf-ecddb50198e2	LUN	PUNTUAL	8.00	2.00	t	\N	t	2026-08-21 02:14:59.104	\N	2026-08-21 02:14:59.104	\N	\N	2025-04-21	06:55:00	17:00:00
fef3091c-d103-4056-a688-ea266728ac41	9ae6581e-43c8-4578-aadf-ecddb50198e2	MAR	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.104	\N	2026-08-21 02:14:59.104	\N	\N	2025-04-22	07:00:00	17:00:00
5893f49d-23af-41d9-b465-87095c881b79	9ae6581e-43c8-4578-aadf-ecddb50198e2	MIE	RETARDO	8.00	1.00	t	\N	t	2026-08-21 02:14:59.104	\N	2026-08-21 02:14:59.104	\N	\N	2025-04-23	07:22:00	17:00:00
5198b34b-8d3b-48c7-9425-47b24af8a826	9ae6581e-43c8-4578-aadf-ecddb50198e2	JUE	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.104	\N	2026-08-21 02:14:59.104	\N	\N	2025-04-24	06:58:00	17:00:00
e1daf998-988e-46e3-b008-8b6903addae2	9ae6581e-43c8-4578-aadf-ecddb50198e2	VIE	PUNTUAL	8.00	3.50	t	\N	t	2026-08-21 02:14:59.104	\N	2026-08-21 02:14:59.104	\N	\N	2025-04-25	07:02:00	17:00:00
6a6737bd-1f61-408d-97bc-22162a57b42b	9ae6581e-43c8-4578-aadf-ecddb50198e2	SAB	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.104	\N	2026-08-21 02:14:59.104	\N	\N	2025-04-26	07:00:00	15:00:00
592115c3-e772-47de-a40e-af4a780470a7	511a9fcd-b046-4f24-84c0-74d9ba1f995b	LUN	PUNTUAL	8.00	2.00	t	\N	t	2026-08-21 02:14:59.109	\N	2026-08-21 02:14:59.109	\N	\N	2025-04-21	06:50:00	17:00:00
7d7213bc-fbbf-46b1-a4c2-c608259a9acf	511a9fcd-b046-4f24-84c0-74d9ba1f995b	MAR	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.109	\N	2026-08-21 02:14:59.109	\N	\N	2025-04-22	06:55:00	17:00:00
dfcf807c-379c-4582-b172-949e7873750e	511a9fcd-b046-4f24-84c0-74d9ba1f995b	MIE	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.109	\N	2026-08-21 02:14:59.109	\N	\N	2025-04-23	06:58:00	17:00:00
be3e053e-68e1-4a97-9252-96166c051bb5	511a9fcd-b046-4f24-84c0-74d9ba1f995b	JUE	PUNTUAL	8.00	2.50	t	\N	t	2026-08-21 02:14:59.109	\N	2026-08-21 02:14:59.109	\N	\N	2025-04-24	06:52:00	17:00:00
edce9426-6767-4191-bae4-150a92d73522	511a9fcd-b046-4f24-84c0-74d9ba1f995b	VIE	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.109	\N	2026-08-21 02:14:59.109	\N	\N	2025-04-25	06:58:00	17:00:00
406e0076-948f-4d3b-8537-5f5414884977	511a9fcd-b046-4f24-84c0-74d9ba1f995b	SAB	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.109	\N	2026-08-21 02:14:59.109	\N	\N	2025-04-26	07:00:00	15:00:00
c39d04bf-cecb-424d-94df-4fe7a741ed7b	6194964e-9325-4213-9cdf-3902c62c54bc	LUN	RETARDO	8.00	0.00	t	\N	t	2026-08-21 02:14:59.114	\N	2026-08-21 02:14:59.114	\N	\N	2025-04-21	07:45:00	17:00:00
6b2331dc-7268-4467-9121-29ffc9fd7ba8	6194964e-9325-4213-9cdf-3902c62c54bc	MAR	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.114	\N	2026-08-21 02:14:59.114	\N	\N	2025-04-22	07:05:00	17:00:00
f5a5c3c3-7908-4253-be41-144948e4e636	6194964e-9325-4213-9cdf-3902c62c54bc	MIE	FALTA	0.00	0.00	f	Inasistencia no justificada	t	2026-08-21 02:14:59.114	\N	2026-08-21 02:14:59.114	\N	\N	2025-04-23	\N	\N
ecd86727-5796-402f-acb7-71a491d2ef12	6194964e-9325-4213-9cdf-3902c62c54bc	JUE	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.114	\N	2026-08-21 02:14:59.114	\N	\N	2025-04-24	07:00:00	17:00:00
38480b90-564d-4291-b743-abb0751e3553	6194964e-9325-4213-9cdf-3902c62c54bc	VIE	RETARDO	8.00	0.00	f	Marcaje fuera de geocerca	t	2026-08-21 02:14:59.114	\N	2026-08-21 02:14:59.114	\N	\N	2025-04-25	08:15:00	17:00:00
f1990084-3c3f-4b3a-b8b2-c5e4bb27fa6b	6194964e-9325-4213-9cdf-3902c62c54bc	SAB	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.114	\N	2026-08-21 02:14:59.114	\N	\N	2025-04-26	07:00:00	15:00:00
5f6f685b-1962-4ca7-a268-817959c0248b	9f60d932-a357-42e2-a7c3-d9532738df5b	LUN	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.118	\N	2026-08-21 02:14:59.118	\N	\N	2025-04-21	08:30:00	17:00:00
5832fd24-3bbc-4cdb-8dcd-f22d00252aec	9f60d932-a357-42e2-a7c3-d9532738df5b	MAR	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.118	\N	2026-08-21 02:14:59.118	\N	\N	2025-04-22	08:28:00	17:00:00
5baf8eab-7f3d-4d1f-8bdc-8fe04e8072f0	9f60d932-a357-42e2-a7c3-d9532738df5b	MIE	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.118	\N	2026-08-21 02:14:59.118	\N	\N	2025-04-23	08:30:00	17:00:00
78036009-0791-469d-a297-9da4514bb5d9	9f60d932-a357-42e2-a7c3-d9532738df5b	JUE	PUNTUAL	8.00	0.00	t	\N	t	2026-08-21 02:14:59.118	\N	2026-08-21 02:14:59.118	\N	\N	2025-04-24	08:25:00	17:00:00
462ca95b-cf9a-4b3f-9f84-1528a28fab01	9f60d932-a357-42e2-a7c3-d9532738df5b	VIE	SALIDA_ANTICIPADA	5.75	0.00	t	Cita médica IMSS	t	2026-08-21 02:14:59.118	\N	2026-08-21 02:14:59.118	\N	\N	2025-04-25	08:30:00	14:15:00
a05f8140-495d-4f0a-a19b-5d4aacd6a9b9	9f60d932-a357-42e2-a7c3-d9532738df5b	SAB	PUNTUAL	6.00	0.00	t	\N	t	2026-08-21 02:14:59.118	\N	2026-08-21 02:14:59.118	\N	\N	2025-04-26	08:30:00	14:30:00
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
270c52eb-715a-4612-a5ec-fd53c66f3041	Contrato_Laboral_Juan_Perez.pdf	CONTRATO	PERSONAL	1887437	Juan Pérez	d69e3ac7-f268-4533-a7ed-780c000f4ad7	(pendiente de carga — metadata heredada del mock, D001)	t	2026-08-21 02:14:59.133	2026-08-21 02:14:59.133	D001	\N	\N	\N	f	PUBLICADO	\N	2022-03-15	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
63ff5445-2e4d-45f9-89bd-9ce56311ffa3	INE_Juan_Perez.jpg	IDENTIFICACION	PERSONAL	1258291	Juan Pérez	d69e3ac7-f268-4533-a7ed-780c000f4ad7	(pendiente de carga — metadata heredada del mock, D002)	t	2026-08-21 02:14:59.137	2026-08-21 02:14:59.137	D002	\N	\N	\N	f	PUBLICADO	\N	2022-03-15	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
c97bfcff-2b18-4bac-8414-640a6d0bd0d2	Contrato_Laboral_Pedro_Gomez.pdf	CONTRATO	PERSONAL	1782579	Pedro Gómez	ea344f07-0905-4881-a64b-b7315f0bfe97	(pendiente de carga — metadata heredada del mock, D003)	t	2026-08-21 02:14:59.138	2026-08-21 02:14:59.138	D003	\N	\N	\N	f	PUBLICADO	\N	2021-08-01	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
0f64c2ca-f286-4df5-91f9-23997e642ba6	INE_Ana_Martinez.jpg	IDENTIFICACION	PERSONAL	943718	Ana Martínez	f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	(pendiente de carga — metadata heredada del mock, D004)	t	2026-08-21 02:14:59.139	2026-08-21 02:14:59.139	D004	\N	\N	\N	f	PUBLICADO	\N	2020-01-10	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
3e6085fa-05ef-4a1c-b63b-6a6b972535c8	Contrato_Laboral_Luis_Torres.pdf	CONTRATO	PERSONAL	1677722	Luis Torres	fe2ec7b7-7fda-4c09-af19-279f41215d06	(pendiente de carga — metadata heredada del mock, D005)	t	2026-08-21 02:14:59.14	2026-08-21 02:14:59.14	D005	\N	\N	\N	f	PUBLICADO	\N	2023-06-20	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
f0252a77-cff1-4d80-b32a-3c0f32fcc625	Contrato_Valle_Sur_Fase1.pdf	CONTRATO	PROYECTOS	2516582	Inmobiliaria ARCO	\N	(pendiente de carga — metadata heredada del mock, D006)	t	2026-08-21 02:14:59.142	2026-08-21 02:14:59.142	D006	\N	\N	\N	f	PUBLICADO	\N	2025-01-10	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
648170d1-3436-4f3d-9928-577dc2dfdf9d	Permiso_Obra_Valle_Sur.pdf	PERMISO	PROYECTOS	734003	Inmobiliaria ARCO	\N	(pendiente de carga — metadata heredada del mock, D007)	t	2026-08-21 02:14:59.144	2026-08-21 02:14:59.144	D007	\N	\N	\N	f	PUBLICADO	\N	2025-01-05	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
0505bb5f-e488-435d-84e4-3d306b8c26c8	Contrato_Centro_Historico.pdf	CONTRATO	PROYECTOS	3250586	Gobierno CDMX	\N	(pendiente de carga — metadata heredada del mock, D008)	t	2026-08-21 02:14:59.146	2026-08-21 02:14:59.146	D008	\N	\N	\N	f	PUBLICADO	\N	2025-03-01	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
44286777-a655-46c1-9251-fe53ff2906d9	Factura_Excavadora_CAT320.pdf	FACTURA	MAQUINARIA	1153434	SVR Constructora	\N	(pendiente de carga — metadata heredada del mock, D009)	t	2026-08-21 02:14:59.147	2026-08-21 02:14:59.147	D009	\N	\N	\N	f	PUBLICADO	\N	2023-05-10	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
faf652e7-3897-4b3c-b22d-f93717d9fedd	Poliza_Seguro_Flota_2025.pdf	POLIZA	MAQUINARIA	2097152	SVR Constructora	\N	(pendiente de carga — metadata heredada del mock, D010)	t	2026-08-21 02:14:59.149	2026-08-21 02:14:59.149	D010	\N	\N	\N	f	PUBLICADO	\N	2025-01-01	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
aa82c9e6-7b7f-481c-a2c0-6cd45ba3734a	Manual_Liebherr_LTM.pdf	MANUAL	MAQUINARIA	14680064	SVR Constructora	\N	(pendiente de carga — metadata heredada del mock, D011)	t	2026-08-21 02:14:59.151	2026-08-21 02:14:59.151	D011	\N	\N	\N	f	PUBLICADO	\N	2022-11-20	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
761f8197-8dd2-4cd1-a2e1-5952f0bfc4bd	Factura_Diesel_Abril_2025.pdf	FACTURA	CONTABILIDAD	524288	SVR Constructora	\N	(pendiente de carga — metadata heredada del mock, D012)	t	2026-08-21 02:14:59.153	2026-08-21 02:14:59.153	D012	\N	\N	\N	f	PUBLICADO	\N	2025-04-27	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
b83de370-fd38-4899-b691-29cd5318a4be	Estado_Cuenta_Abril_2025.pdf	FACTURA	CONTABILIDAD	838861	SVR Constructora	\N	(pendiente de carga — metadata heredada del mock, D013)	t	2026-08-21 02:14:59.154	2026-08-21 02:14:59.154	D013	\N	\N	\N	f	PUBLICADO	\N	2025-04-30	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1
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
\.


--
-- Data for Name: facturas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.facturas (id, codigo, serie, folio, uuid_cfdi, cliente_id, periodo_inicio, periodo_fin, subtotal, impuestos, total, moneda, tipo_cambio, forma_pago, metodo_pago, uso_cfdi, estado, xml_url, pdf_url, timbrado_en, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
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
3d8d3463-3b38-43ab-8593-8422c8b64b24	e71db8bb-8c68-488b-92f1-cc4b6b9f3115	t	Ing. Roberto Garza	Residente de Obra · Inmobiliaria ARCO	t	2026-08-21 02:14:59.076	\N	\N	2026-08-21 02:14:59.076	\N	\N	2025-04-27 17:45:00
9dcab8b0-be1a-48c0-878c-61bada6a8c85	972b3c29-cf18-4de3-af2e-774941f8116e	t	Arq. Manuel Morales	Supervisor Obras CDMX	t	2026-08-21 02:14:59.08	\N	\N	2026-08-21 02:14:59.08	\N	\N	2025-04-27 15:15:00
16d7303f-c696-4c04-834c-d0a0dea92d0b	18a90b16-13de-454d-80d4-d05f8d03928d	f	Ing. Fernando Silva	Jefe de Frente SCT	t	2026-08-21 02:14:59.084	\N	\N	2026-08-21 02:14:59.084	\N	\N	\N
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
77de7e9b-61d4-462f-92d8-40798fe14a15	00692bdb-27d2-4e7b-be62-16c2977e1650	10.00	8.00	2026-08-21 02:14:59.021	t	2026-08-21 02:14:59.021	\N	\N	\N	\N	\N	Ene	\N
45ae5e34-ef14-4a72-a8c3-e87afa828a1b	00692bdb-27d2-4e7b-be62-16c2977e1650	30.00	25.00	2026-08-21 02:14:59.021	t	2026-08-21 02:14:59.021	\N	\N	\N	\N	\N	Feb	\N
810a1850-c6bd-4fb7-b1de-139963ca88d2	00692bdb-27d2-4e7b-be62-16c2977e1650	50.00	48.00	2026-08-21 02:14:59.021	t	2026-08-21 02:14:59.021	\N	\N	\N	\N	\N	Mar	\N
0f0744a4-310c-4d2d-8aa4-a26b019a4793	00692bdb-27d2-4e7b-be62-16c2977e1650	75.00	72.00	2026-08-21 02:14:59.021	t	2026-08-21 02:14:59.021	\N	\N	\N	\N	\N	Abr	\N
261b2c9e-cd53-48b0-9bef-c3ae6b5ba8ed	00692bdb-27d2-4e7b-be62-16c2977e1650	90.00	85.00	2026-08-21 02:14:59.021	t	2026-08-21 02:14:59.021	\N	\N	\N	\N	\N	May	\N
5dda2431-e232-481f-8f00-87f05e025fc5	21b6cf72-c07c-40e8-aac6-b538511f5127	15.00	10.00	2026-08-21 02:14:59.027	t	2026-08-21 02:14:59.027	\N	\N	\N	\N	\N	Mar	\N
b80804ea-cf11-4c93-969c-ff71b6195e36	21b6cf72-c07c-40e8-aac6-b538511f5127	30.00	28.00	2026-08-21 02:14:59.027	t	2026-08-21 02:14:59.027	\N	\N	\N	\N	\N	Abr	\N
210cad5b-896c-4f4d-b015-a66f60c5dbc4	21b6cf72-c07c-40e8-aac6-b538511f5127	45.00	32.00	2026-08-21 02:14:59.027	t	2026-08-21 02:14:59.027	\N	\N	\N	\N	\N	May	\N
5a0fdb74-16cf-4675-80cb-f4a7d958880c	caf3c621-4982-4b27-bef3-02c362cb96a6	20.00	20.00	2026-08-21 02:14:59.033	t	2026-08-21 02:14:59.033	\N	\N	\N	\N	\N	Nov	\N
f1122aa7-f9e0-45b3-8375-73d4c56900e9	caf3c621-4982-4b27-bef3-02c362cb96a6	45.00	40.00	2026-08-21 02:14:59.033	t	2026-08-21 02:14:59.033	\N	\N	\N	\N	\N	Dic	\N
d0063fc0-089d-4a5c-a3cb-f4d783e7bcb0	caf3c621-4982-4b27-bef3-02c362cb96a6	70.00	72.00	2026-08-21 02:14:59.033	t	2026-08-21 02:14:59.033	\N	\N	\N	\N	\N	Ene	\N
b081dd2f-79de-49be-9d16-ac7b81e26135	caf3c621-4982-4b27-bef3-02c362cb96a6	90.00	88.00	2026-08-21 02:14:59.033	t	2026-08-21 02:14:59.033	\N	\N	\N	\N	\N	Feb	\N
4e80ad43-4012-438b-ac08-7bd4666cf7e5	caf3c621-4982-4b27-bef3-02c362cb96a6	100.00	100.00	2026-08-21 02:14:59.033	t	2026-08-21 02:14:59.033	\N	\N	\N	\N	\N	Mar	\N
\.


--
-- Data for Name: horas_extra_asistencia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.horas_extra_asistencia (id, registro_asistencia_id, horas_calculadas, tarifa_por_hora, monto_total, estado, motivo, lat_inicio, lng_inicio, lat_fin, lng_fin, creado_en, actualizado_en, activo, actualizado_por, aprobador_id, creado_por, eliminado_en, inicio, fin) FROM stdin;
aff9cced-a98f-456d-8a15-1bdb032078c7	2dc12a6b-60bf-4f4c-b8d4-2baa1fad2b6b	3.50	80.00	280.00	APROBADO	Colado continuo de cimentación y losa	19.342300	-99.184100	19.342600	-99.184200	2026-08-21 02:14:59.089	2026-08-21 02:14:59.089	t	\N	\N	\N	\N	17:00:00	20:30:00
fe430fc4-2089-4749-9bfb-86374522e2cf	4b2a99c1-a97c-4505-84ec-989221a655a0	2.50	75.00	187.50	APROBADO	Nivelación nocturna de terreno para pavimentación	19.432800	-99.133000	\N	\N	2026-08-21 02:14:59.094	2026-08-21 02:14:59.094	t	\N	\N	\N	\N	16:30:00	19:00:00
\.


--
-- Data for Name: incidentes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incidentes (id, codigo, titulo, descripcion, prioridad, estado, fecha, maquina_id, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, obra_id, obra_texto, reporto_id) FROM stdin;
17fd1b88-e45a-4a55-b1c7-087677b449b5	IN001	Fuga de aceite hidráulico	Se detectó fuga en manguera principal	ALTA	EN_REVISION	2025-04-27	b7bb9152-0851-4372-9e55-b393fa7da463	t	2026-08-21 02:14:59.156	2026-08-21 02:14:59.156	\N	\N	\N	\N	Valle Sur	\N
4b2cb305-35c6-4250-8f71-9c4b376677ff	IN002	Retraso por clima	Lluvia intensa impidió colado de losa	BAJA	ABIERTO	2025-04-26	\N	t	2026-08-21 02:14:59.158	2026-08-21 02:14:59.158	\N	\N	\N	\N	Remodelación Centro	\N
\.


--
-- Data for Name: intentos_login; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.intentos_login (id, user_id, email_intentado, exitoso, motivo_fallo, ip_address, user_agent, creado_en) FROM stdin;
\.


--
-- Data for Name: lecturas_horometro; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lecturas_horometro (id, maquina_id, fecha, lectura_inicial, lectura_final, horas_trabajadas, activo, creado_en, actualizado_en, codigo, actualizado_por, creado_por, eliminado_en, operador_id) FROM stdin;
d833b29d-310e-4baa-9728-d1e729398a5f	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	1237.50	1245.50	8.00	t	2026-08-21 02:14:59.065	2026-08-21 02:14:59.065	\N	\N	\N	\N	\N
9ee93fd3-627e-42fb-94fd-8bdd8771b59c	27800748-89c1-4900-8b5d-31926fc63836	2025-04-27	885.20	890.20	5.00	t	2026-08-21 02:14:59.067	2026-08-21 02:14:59.067	\N	\N	\N	\N	\N
b21b64ab-52b4-428f-9457-bc45d41a5aa0	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2025-04-27	3415.10	3421.10	6.00	t	2026-08-21 02:14:59.069	2026-08-21 02:14:59.069	\N	\N	\N	\N	\N
\.


--
-- Data for Name: licencias_trabajador; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.licencias_trabajador (id, trabajador_id, tipo, folio, creado_en, actualizado_en, activo, actualizado_por, archivo_url, categoria, creado_por, eliminado_en, vigencia_indefinida, vigencia) FROM stdin;
8c920828-94d3-45c6-878a-6380699234b8	d69e3ac7-f268-4533-a7ed-780c000f4ad7	Certificación DC-3 Excavadora Hidráulica	DC3-CAT-8921	2026-08-21 02:14:58.977	2026-08-21 02:14:58.977	t	\N	\N	DC3	\N	\N	f	2026-11-30
75181013-7651-4f34-bb96-f128dced9019	ea344f07-0905-4881-a64b-b7315f0bfe97	Certificación DC-3 Retroexcavadora	DC3-JD-4412	2026-08-21 02:14:58.984	2026-08-21 02:14:58.984	t	\N	\N	DC3	\N	\N	f	2026-08-15
5a159a7a-fdc1-4277-b69e-14ede24641b3	fe2ec7b7-7fda-4c09-af19-279f41215d06	Licencia Federal de Chofer Tipo E	SCT-FED-99882	2026-08-21 02:14:58.993	2026-08-21 02:14:58.993	t	\N	\N	LICENCIA_FEDERAL	\N	\N	f	2027-02-28
61e2c476-08f6-435d-bf52-e57a8d86d171	99ef344b-2f95-4dec-8f4f-dccc4bb43351	Certificado Diagnóstico Hidráulico CAT/JD	MEC-CAT-3321	2026-08-21 02:14:58.998	2026-08-21 02:14:58.998	t	\N	\N	CERTIFICADO_TECNICO	\N	\N	f	2027-10-15
c84c8205-b602-47ee-bb4c-cda67daa47ce	7ae68a33-6be6-46f3-8344-2dbf7389540d	Cédula Profesional Ing. Civil	CED-CIV-8849102	2026-08-21 02:14:59.004	2026-08-21 02:14:59.004	t	\N	\N	CEDULA_PROFESIONAL	\N	\N	t	\N
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
b7bb9152-0851-4372-9e55-b393fa7da463	M001	Excavadora CAT 320	ENCENDIDA	65.00	1245.50	d69e3ac7-f268-4533-a7ed-780c000f4ad7	19.432600	-99.133200	85.00	2026-05-20	\N	14.00	13.50	f	6.30	t	2026-08-21 02:14:59.008	2026-08-21 02:14:59.008	\N	\N	\N	\N	\N	\N	\N	ee7d04d7-e77a-4875-b179-94a921fc5261
27800748-89c1-4900-8b5d-31926fc63836	M002	Retroexcavadora JD 310L	MANTENIMIENTO	42.00	890.20	ea344f07-0905-4881-a64b-b7315f0bfe97	19.428400	-99.127600	45.00	2026-04-28	\N	9.50	9.20	f	4.80	t	2026-08-21 02:14:59.01	2026-08-21 02:14:59.01	\N	\N	\N	\N	\N	\N	\N	c1d7c6fb-3644-443e-a61f-fac9ac1f04ca
dba9c3c3-e696-4ce7-aaec-87970b37392d	M003	Grúa Liebherr LTM	APAGADA	88.00	456.80	\N	19.435000	-99.141200	0.00	2026-06-15	\N	16.00	15.80	f	0.00	t	2026-08-21 02:14:59.012	2026-08-21 02:14:59.012	\N	\N	\N	\N	\N	\N	\N	f3b26935-7ef1-4105-a890-0c9fa6be4212
9c9760e5-66c9-4fbc-bf1f-b90745fd459d	M004	Camión Volteo Kenworth	MOVIMIENTO	15.00	3421.10	fe2ec7b7-7fda-4c09-af19-279f41215d06	19.419000	-99.130000	200.00	2026-05-05	\N	12.00	23.50	t	8.50	t	2026-08-21 02:14:59.014	2026-08-21 02:14:59.014	\N	\N	\N	\N	\N	\N	\N	f0b44546-5e25-40ab-aea8-ad2fa5482c26
\.


--
-- Data for Name: movimientos_inventario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movimientos_inventario (id, articulo_id, tipo, cantidad, stock_resultante, referencia_tipo, referencia_id, motivo, fecha, activo, creado_en, creado_por) FROM stdin;
\.


--
-- Data for Name: niveles_bloqueo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.niveles_bloqueo (id, nivel, duracion_minutos, descripcion, activo, creado_en, actualizado_en) FROM stdin;
8e7c3dfd-096a-4373-94f5-d9cde50afc3f	1	5	Primer bloqueo: 5 intentos fallidos consecutivos	t	2026-08-20 21:01:27.931	2026-08-20 21:01:27.931
82bff625-b64a-4b92-8465-684fd32464f4	2	15	Segundo bloqueo: reincidencia tras el primero	t	2026-08-20 21:01:27.931	2026-08-20 21:01:27.931
121c0aa6-c666-46e2-90ae-d06939ab1065	3	30	Tercer bloqueo	t	2026-08-20 21:01:27.931	2026-08-20 21:01:27.931
018ac55e-2845-4123-bc60-c5486f7965ae	4	60	Cuarto bloqueo	t	2026-08-20 21:01:27.931	2026-08-20 21:01:27.931
41d530dd-3dd2-4920-a56c-b086ce3c6fa2	5	1440	Quinto bloqueo en adelante: 24 horas	t	2026-08-20 21:01:27.931	2026-08-20 21:01:27.931
\.


--
-- Data for Name: nominas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nominas (id, periodo_id, trabajador_id, dias_trabajados, dias_faltas, horas_ordinarias, horas_extra, sueldo_fiscal, sueldo_efectivo, total_percepciones, total_deducciones, total_neto, metodo_pago, estado, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
\.


--
-- Data for Name: obras; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.obras (id, codigo, nombre, proyecto_id, ubicacion, lat, lng, radio_permitido_metros, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
0fe88d91-fac1-4923-a804-e6e9d30b7f17	\N	Fraccionamiento Valle Sur	00692bdb-27d2-4e7b-be62-16c2977e1650	Querétaro, Qro.	\N	\N	\N	t	2026-08-21 02:14:59.024	2026-08-21 02:14:59.024	\N	\N	\N
4d7ad209-71ed-4bb4-838c-fd59b7d9c32c	\N	Remodelación Centro Histórico	21b6cf72-c07c-40e8-aac6-b538511f5127	Centro, CDMX	\N	\N	\N	t	2026-08-21 02:14:59.03	2026-08-21 02:14:59.03	\N	\N	\N
970e6a8f-9729-462b-bd8e-3d97bc90b229	\N	Puente Atizapán	caf3c621-4982-4b27-bef3-02c362cb96a6	Atizapán, EdoMex	\N	\N	\N	t	2026-08-21 02:14:59.037	2026-08-21 02:14:59.037	\N	\N	\N
\.


--
-- Data for Name: pagos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pagos (id, codigo, cliente_id, factura_id, monto, fecha_pago, metodo_pago, referencia, banco, cuenta_destino, comprobante_url, estado, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
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
\.


--
-- Data for Name: personas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.personas (id, nombre, apellido_paterno, apellido_materno, rfc, curp, correo, telefono, fecha_nacimiento, genero, direccion, avatar_url, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
\.


--
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proveedores (id, codigo, nombre, rfc, correo, telefono, direccion, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
22d61153-008b-479f-bd4b-3df58f7f5b2f	\N	CAT México	\N	\N	\N	\N	t	2026-08-21 02:14:58.945	2026-08-21 02:14:58.945	\N	\N	\N
bd7a0bff-6245-4c61-ab32-69f698abc750	\N	Lubricantes Especializados	\N	\N	\N	\N	t	2026-08-21 02:14:58.946	2026-08-21 02:14:58.946	\N	\N	\N
53e3ab7a-8296-4344-a36e-8b5a3e3fc7d3	\N	Michelin	\N	\N	\N	\N	t	2026-08-21 02:14:58.947	2026-08-21 02:14:58.947	\N	\N	\N
\.


--
-- Data for Name: proyectos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proyectos (id, codigo, nombre, cliente_id, presupuesto, progreso, estado, fecha_inicio, fecha_fin, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en) FROM stdin;
00692bdb-27d2-4e7b-be62-16c2977e1650	P001	Fraccionamiento Valle Sur	f600f831-a44a-4930-9fc0-8e5ec1ee9450	1200000.00	85.00	EN_PROCESO	2025-01-10	2025-05-30	t	2026-08-21 02:14:59.021	2026-08-21 02:14:59.021	\N	\N	\N
21b6cf72-c07c-40e8-aac6-b538511f5127	P002	Remodelación Centro Histórico	3a05641a-c5eb-4676-8ec3-720b3e2d7ba1	4500000.00	32.00	EN_PROCESO	2025-03-01	2025-12-15	t	2026-08-21 02:14:59.027	2026-08-21 02:14:59.027	\N	\N	\N
caf3c621-4982-4b27-bef3-02c362cb96a6	P003	Puente Atizapán	cf8c9e99-7dac-4337-a50f-82db43546a6a	8900000.00	100.00	FINALIZADO	2024-06-15	2025-04-20	t	2026-08-21 02:14:59.033	2026-08-21 02:14:59.033	\N	\N	\N
\.


--
-- Data for Name: rastreo_gps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rastreo_gps (id, maquina_id, fecha_hora, lat, lng, altitud, velocidad_kmh, heading, precision_metros, ignition, odometro, horometro, proveedor_gps, dispositivo_id, activo, creado_en, creado_por) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, session_id, jti, token_hash, emitido_en, expira_en, usado_en, reemplazado_por, revocado_en, motivo_revocado, activo) FROM stdin;
\.


--
-- Data for Name: registro_auditoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registro_auditoria (event_id, "timestamp", actor_user_id, actor_role, actor_type, action, entity_type, entity_id, result, severity, ip_address, user_agent, session_id, request_id, correlation_id, error_code, previous_value, new_value, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: registros_asistencia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros_asistencia (id, codigo, trabajador_id, fecha, estado, ubicacion, lat_entrada, lng_entrada, lat_salida, lng_salida, salida_ubicacion, obra_asignada, lat_obra, lng_obra, distancia_metros, radio_permitido_metros, en_sitio, precision_gps_metros, dispositivo, horas_trabajadas_ordinarias, salida_anticipada, motivo_salida_anticipada, bateria, notas, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, obra_id, hora_entrada, hora_salida, hora_marcaje_exacta, hora_salida_exacta) FROM stdin;
2dc12a6b-60bf-4f4c-b8d4-2baa1fad2b6b	A001	d69e3ac7-f268-4533-a7ed-780c000f4ad7	2025-04-27	PUNTUAL	Fracc. Valle Sur (Frente a Manzana 4)	19.342300	-99.184100	19.342500	-99.184000	Fracc. Valle Sur (Caseta de Salida)	Fraccionamiento Valle Sur	19.342100	-99.184300	28.00	2000.00	t	6.00	Samsung Galaxy A54 · GPS Activo	8.00	f	\N	92	Marcaje verificado dentro del polígono de obra (radio 2km).	t	2026-08-21 02:14:59.089	2026-08-21 02:14:59.089	\N	\N	\N	0fe88d91-fac1-4923-a804-e6e9d30b7f17	07:05:00	17:00:00	07:04:48	17:00:15
4b2a99c1-a97c-4505-84ec-989221a655a0	A002	ea344f07-0905-4881-a64b-b7315f0bfe97	2025-04-27	PUNTUAL	Centro Histórico (Acceso Calle Madero)	19.432800	-99.133000	19.432700	-99.133100	Centro Histórico (Salida Madero)	Remodelación Centro Histórico	19.432600	-99.133200	35.00	2000.00	t	8.00	Xiaomi Redmi Note 12 · GPS Activo	8.50	f	\N	87	Marcaje verificado en punto de control de acceso.	t	2026-08-21 02:14:59.094	2026-08-21 02:14:59.094	\N	\N	\N	4d7ad209-71ed-4bb4-838c-fd59b7d9c32c	06:58:00	16:30:00	06:58:12	16:30:20
216295c6-5501-48a9-a8f6-f3f4e9a79ca4	A003	fe2ec7b7-7fda-4c09-af19-279f41215d06	2025-04-27	RETARDO	Av. Insurgentes Sur #1420 (Fuera de radio 2km)	19.378000	-99.172000	\N	\N	\N	Fraccionamiento Valle Sur	19.342100	-99.184300	4210.00	2000.00	f	14.00	Motorola Moto G84 · GPS Activo	7.00	f	\N	48	ALERTA DE GEOCERCA: El marcaje se realizó a 4.2 km de distancia, superando el radio de 2 km de la obra.	t	2026-08-21 02:14:59.097	2026-08-21 02:14:59.097	\N	\N	\N	0fe88d91-fac1-4923-a804-e6e9d30b7f17	08:15:00	\N	08:15:33	\N
4fc83c88-d56b-4736-bb65-7746565e33fb	A004	f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	2025-04-27	SALIDA_ANTICIPADA	Oficina Central SVR (Recepción)	19.410600	-99.167700	\N	\N	\N	Oficina Central SVR	19.410500	-99.167800	15.00	500.00	t	4.00	iPhone 13 · iOS 17.4	5.75	t	Cita médica programada en clínica IMSS.	95	ALERTA: Retiro anticipado registrado con motivo médico.	t	2026-08-21 02:14:59.1	2026-08-21 02:14:59.1	\N	\N	\N	\N	08:30:00	14:15:00	08:29:50	14:15:40
\.


--
-- Data for Name: registros_criba; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros_criba (id, codigo, fecha, turno, operador_id, tipo_material, material_producido, horas_trabajadas, material_al_banco, observaciones, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en) FROM stdin;
c2c3d7d4-cc06-4449-b9db-e14921c5d22b	CR001	2026-08-15	MATUTINO	fe2ec7b7-7fda-4c09-af19-279f41215d06	Criba fina	45.00	8.00	38.00	Operación normal	t	2026-08-21 02:14:59.187	2026-08-21 02:14:59.187	\N	\N	\N
c4e9df55-b0e9-4ca3-8a71-4b4d9a6ed256	CR002	2026-08-15	VESPERTINO	d69e3ac7-f268-4533-a7ed-780c000f4ad7	Criba gruesa	30.00	7.00	25.00		t	2026-08-21 02:14:59.189	2026-08-21 02:14:59.189	\N	\N	\N
f5c700d9-9a7b-4915-81cc-2f70a6de35cb	CR003	2026-08-14	MATUTINO	fe2ec7b7-7fda-4c09-af19-279f41215d06	Criba fina	50.00	8.00	50.00	Producción completa al banco	t	2026-08-21 02:14:59.19	2026-08-21 02:14:59.19	\N	\N	\N
959b85d6-29d6-41e0-9172-df0af5e45afd	CR004	2026-08-14	VESPERTINO	ea344f07-0905-4881-a64b-b7315f0bfe97	Arena lavada	20.00	6.00	15.00	Paro por 2h - falla en faja	t	2026-08-21 02:14:59.191	2026-08-21 02:14:59.191	\N	\N	\N
7531ffa8-81c2-4f5b-977d-75ebec4de956	CR005	2026-08-13	MATUTINO	fe2ec7b7-7fda-4c09-af19-279f41215d06	Criba fina	52.00	8.00	52.00		t	2026-08-21 02:14:59.193	2026-08-21 02:14:59.193	\N	\N	\N
\.


--
-- Data for Name: registros_mantenimiento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros_mantenimiento (id, codigo, maquina_id, tipo, descripcion, fecha, horas_servicio, costo, proximo_servicio_horas, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, mecanico_id, refacciones_usadas) FROM stdin;
2b188a63-c66c-4826-84c5-43dd761cd85b	S001	b7bb9152-0851-4372-9e55-b393fa7da463	PREVENTIVO	Cambio de aceite y filtros de motor	2025-04-10	1200.00	5500.00	1450.00	t	2026-08-21 02:14:59.062	2026-08-21 02:14:59.062	\N	\N	\N	\N	\N
fbf99dff-1986-4621-acbf-3152d9efb683	S002	27800748-89c1-4900-8b5d-31926fc63836	CORRECTIVO	Reparación de manguera hidráulica	2025-04-20	880.00	2200.00	1100.00	t	2026-08-21 02:14:59.064	2026-08-21 02:14:59.064	\N	\N	\N	\N	\N
\.


--
-- Data for Name: reportes_campo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reportes_campo (id, codigo, tipo, usuario, maquina_id, fecha, descripcion, estado, prioridad, detalles, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, obra_id, obra_texto, usuario_id, hora) FROM stdin;
b55d5150-19f9-4555-a5b4-1211040f1cef	RC001	MECANICO	Ricardo M.	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	Se completó reparación de cadena izquierda. Tensor ajustado.	PENDIENTE	\N	\N	t	2026-08-21 02:14:59.163	2026-08-21 02:14:59.163	\N	\N	\N	\N	Valle Sur	\N	10:30:00
b07a8466-3c33-48ad-a9f7-227f69b9fdab	RC002	PIPERO	Marcos G.	9c9760e5-66c9-4fbc-bf1f-b90745fd459d	2025-04-27	Suministro de 200L de diésel. Tanque lleno.	VISTO	\N	{"costo": 4600, "litros": 200}	t	2026-08-21 02:14:59.167	2026-08-21 02:14:59.167	\N	\N	\N	\N	Valle Sur	\N	14:15:00
c84bd1dd-ac9e-4a7c-8989-8f1863a1c2f7	RC003	OPERADOR	Juan P.	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	Reporte matutino: Aceite OK, Agua OK, Diésel 65%. Listo para trabajar.	ATENDIDO	\N	\N	t	2026-08-21 02:14:59.169	2026-08-21 02:14:59.169	\N	\N	\N	\N	Valle Sur	\N	07:15:00
31e0b97f-81d0-4657-9d88-4caaf698ce20	RC004	INCIDENTE	Ricardo M.	b7bb9152-0851-4372-9e55-b393fa7da463	2025-04-27	Se detectó fuga en manguera hidráulica principal. Equipo detenido hasta reparación.	EN_REVISION	ALTA	\N	t	2026-08-21 02:14:59.171	2026-08-21 02:14:59.171	\N	\N	\N	\N	Valle Sur	\N	11:00:00
9956f12c-cb84-4387-a753-7d6c611b788a	RC005	INCIDENTE	Ing. López	\N	2025-04-26	Lluvia intensa impidió colado de losa. Se reprograma para mañana.	RESUELTO	BAJA	\N	t	2026-08-21 02:14:59.172	2026-08-21 02:14:59.172	\N	\N	\N	\N	Remodelación Centro	\N	15:00:00
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (rol_id, permiso_id, creado_en) FROM stdin;
\.


--
-- Data for Name: role_vistas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_vistas (id, rol_id, vista_id, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar, asignado_en, asignado_por, activo) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, nombre, descripcion, nivel, es_sistema, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, refresh_token_jti, ip_address, user_agent, dispositivo, ubicacion, iniciada_en, ultima_actividad, expira_en, cerrada_en, motivo_cierre, activa, creado_en, actualizado_en) FROM stdin;
\.




--
-- Data for Name: tipos_maquina; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipos_maquina (id, nombre, descripcion, activo, creado_en, actualizado_en) FROM stdin;
ee7d04d7-e77a-4875-b179-94a921fc5261	Excavadora	\N	t	2026-08-21 02:14:58.923	2026-08-21 02:14:58.923
c1d7c6fb-3644-443e-a61f-fac9ac1f04ca	Retroexcavadora	\N	t	2026-08-21 02:14:58.928	2026-08-21 02:14:58.928
f3b26935-7ef1-4105-a890-0c9fa6be4212	Grúa	\N	t	2026-08-21 02:14:58.929	2026-08-21 02:14:58.929
f0b44546-5e25-40ab-aea8-ad2fa5482c26	Transporte	\N	t	2026-08-21 02:14:58.929	2026-08-21 02:14:58.929
\.


--
-- Data for Name: token_blacklist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.token_blacklist (id, jti, token_hash, tipo, user_id, razon, expira_en, agregado_en) FROM stdin;
\.


--
-- Data for Name: trabajadores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trabajadores (id, codigo, nombre, puesto, estado, telefono, avatar, sueldo_fiscal, sueldo_efectivo, metodo_pago, estado_renta, cliente_renta_actual_id, fecha_contratacion, vacaciones_dias, horas_extra_semana, tarifa_hora_extra, descuentos_semana, concepto_descuento, activo, creado_en, actualizado_en, actualizado_por, categoria_puesto_id, creado_por, eliminado_en, entrada) FROM stdin;
ea344f07-0905-4881-a64b-b7315f0bfe97	T002	Pedro Gómez	Operador de Retroexcavadora	ACTIVO	55 8765 4321	PG	2200.00	3200.00	MIXTO	RENTADO_CLIENTE	3a05641a-c5eb-4676-8ec3-720b3e2d7ba1	2023-07-01	6	4.50	75.00	0.00	\N	t	2026-08-21 02:14:58.984	2026-08-21 02:14:58.984	\N	923aa0cd-8e76-43e6-95a9-3be3c96ca14e	\N	\N	07:00:00
f89c4fe0-2388-4da5-aa74-5d0eb3fbde4c	T003	Ana Martínez	Administradora de Obra	ACTIVO	55 2345 6789	AM	5000.00	2000.00	MIXTO	EN_OBRA_PROPIA	\N	2022-01-10	12	0.00	0.00	0.00	\N	t	2026-08-21 02:14:58.989	2026-08-21 02:14:58.989	\N	e71fb890-67e3-4e62-8cc1-b5170a4f0606	\N	\N	08:30:00
fe2ec7b7-7fda-4c09-af19-279f41215d06	T004	Luis Torres	Chofer de Camión Volteo	ACTIVO	55 3456 7890	LT	2000.00	2800.00	MIXTO	RENTADO_CLIENTE	cc2f4d26-2ef8-4579-8ca6-6a8e5006daae	2023-11-20	6	0.00	65.00	0.00	\N	t	2026-08-21 02:14:58.993	2026-08-21 02:14:58.993	\N	457083fb-f806-47f5-bf2e-46d75b6bd610	\N	\N	06:30:00
99ef344b-2f95-4dec-8f4f-dccc4bb43351	T005	Carlos Ruiz	Mecánico Diésel Especialista	ACTIVO	55 4567 8901	CR	3000.00	4000.00	MIXTO	EN_OBRA_PROPIA	\N	2021-05-18	14	2.00	90.00	0.00	\N	t	2026-08-21 02:14:58.998	2026-08-21 02:14:58.998	\N	c1c154bb-be3a-4694-9273-f07c64d2dec1	\N	\N	07:30:00
7ae68a33-6be6-46f3-8344-2dbf7389540d	T006	Ing. Jorge Valenzuela	Ingeniero Residente de Obra	ACTIVO	55 5678 9012	JV	6500.00	4500.00	MIXTO	EN_OBRA_PROPIA	\N	2020-02-01	15	0.00	0.00	0.00	\N	t	2026-08-21 02:14:59.004	2026-08-21 02:14:59.004	\N	3f66ae71-7d0d-45b6-8e2f-eb9e5aa5715b	\N	\N	07:00:00
d69e3ac7-f268-4533-a7ed-780c000f4ad7	T001	Juan Pérez	Operador de Excavadora	ACTIVO	55 1234 5678	JP	2500.00	3500.00	MIXTO	RENTADO_CLIENTE	f600f831-a44a-4930-9fc0-8e5ec1ee9450	2023-03-15	8	6.50	80.00	0.00	\N	t	2026-08-21 02:14:58.977	2026-08-20 20:15:22.938	\N	923aa0cd-8e76-43e6-95a9-3be3c96ca14e	\N	\N	07:00:00
\.


--
-- Data for Name: trabajadores_proyectos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trabajadores_proyectos (trabajador_id, proyecto_id, asignado_en, activo, actualizado_por, creado_por, eliminado_en) FROM stdin;
d69e3ac7-f268-4533-a7ed-780c000f4ad7	00692bdb-27d2-4e7b-be62-16c2977e1650	2026-08-21 02:14:59.039	t	\N	\N	\N
ea344f07-0905-4881-a64b-b7315f0bfe97	21b6cf72-c07c-40e8-aac6-b538511f5127	2026-08-21 02:14:59.04	t	\N	\N	\N
fe2ec7b7-7fda-4c09-af19-279f41215d06	caf3c621-4982-4b27-bef3-02c362cb96a6	2026-08-21 02:14:59.042	t	\N	\N	\N
7ae68a33-6be6-46f3-8344-2dbf7389540d	00692bdb-27d2-4e7b-be62-16c2977e1650	2026-08-21 02:14:59.043	t	\N	\N	\N
7ae68a33-6be6-46f3-8344-2dbf7389540d	caf3c621-4982-4b27-bef3-02c362cb96a6	2026-08-21 02:14:59.044	t	\N	\N	\N
\.


--
-- Data for Name: transacciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transacciones (id, codigo, tipo, categoria, monto, fecha, descripcion, activo, creado_en, actualizado_en, actualizado_por, creado_por, eliminado_en, entidad_id, entidad_tipo) FROM stdin;
a5866596-55a6-4d31-9a4a-4e8b9b3c7338	TX001	EGRESO	Combustible	4600.00	2025-04-27	Carga diésel M004	t	2026-08-21 02:14:59.128	2026-08-21 02:14:59.128	\N	\N	\N	\N	\N
64497715-7e08-40db-99e4-30b446ba4927	TX002	INGRESO	Pago Cliente	125000.00	2025-04-26	Anticipo Renta Excavadora	t	2026-08-21 02:14:59.129	2026-08-21 02:14:59.129	\N	\N	\N	\N	\N
5d3a2de5-c432-4845-813a-7a15bfbfe218	TX003	EGRESO	Nómina	45000.00	2025-04-25	Pago semana 16 - Operadores	t	2026-08-21 02:14:59.13	2026-08-21 02:14:59.13	\N	\N	\N	\N	\N
\.


--
-- Data for Name: unidades_medida; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.unidades_medida (id, codigo, nombre, categoria, activo, creado_en, actualizado_en) FROM stdin;
936fbba3-8af5-4bb8-ba36-ab99d462ae05	Pza	Pza	\N	t	2026-08-21 02:14:58.936	2026-08-21 02:14:58.936
7ef1227e-8879-4ed7-ae09-3497610b5d02	Galones	Galones	\N	t	2026-08-21 02:14:58.937	2026-08-21 02:14:58.937
ff1462a0-24da-4cc9-ae87-fe4552063dbf	m²	m²	\N	t	2026-08-21 02:14:58.938	2026-08-21 02:14:58.938
859c80fa-b812-409b-8a73-df80b792a132	m³	m³	\N	t	2026-08-21 02:14:58.938	2026-08-21 02:14:58.938
cddac107-cf7a-4d94-9344-57b22a508c26	pt	pt	\N	t	2026-08-21 02:14:58.939	2026-08-21 02:14:58.939
d6118e1e-11c0-4e53-8725-1f1b801d9841	jor	jor	\N	t	2026-08-21 02:14:58.94	2026-08-21 02:14:58.94
9256e1ce-cc2c-4ec3-a268-6b41240f2471	hr	hr	\N	t	2026-08-21 02:14:58.94	2026-08-21 02:14:58.94
20c20a29-da38-4fc7-a50d-3aed186c429e	%mo	%mo	\N	t	2026-08-21 02:14:58.941	2026-08-21 02:14:58.941
0f042f87-bebf-4c10-b591-6de9f369b3e6	pza	pza	\N	t	2026-08-21 02:14:58.941	2026-08-21 02:14:58.941
3c735df8-1cd3-4ba9-a8d6-cda84f8d98a0	día	día	\N	t	2026-08-21 02:14:58.942	2026-08-21 02:14:58.942
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, persona_id, email, password_hash, email_verificado, telefono_verificado, factor_doble_habilitado, ultimo_login, preferencias, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
\.


--
-- Data for Name: users_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users_roles (id, user_id, rol_id, es_principal, asignado_en, asignado_por, activo) FROM stdin;
\.


--
-- Data for Name: usuarios_bloqueados; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios_bloqueados (id, user_id, nivel_id, nivel_numero, intentos_fallidos_consecutivos, bloqueado_desde, bloqueado_hasta, desbloqueado_en, desbloqueado_manualmente_por, motivo, activo, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: vistas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vistas (id, nombre, descripcion, ruta, icono, orden, vista_padre_id, es_menu, es_visible, requiere_auth, target, badges, metadata, activo, creado_en, actualizado_en, creado_por, actualizado_por, eliminado_en) FROM stdin;
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
-- Name: asistencias_semanales asistencias_semanales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias_semanales
    ADD CONSTRAINT asistencias_semanales_pkey PRIMARY KEY (id);


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
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: contactos_emergencia contactos_emergencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contactos_emergencia
    ADD CONSTRAINT contactos_emergencia_pkey PRIMARY KEY (id);


--
-- Name: cotizaciones cotizaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_pkey PRIMARY KEY (id);


--
-- Name: cuentas_por_cobrar cuentas_por_cobrar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_por_cobrar
    ADD CONSTRAINT cuentas_por_cobrar_pkey PRIMARY KEY (id);


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
-- Name: incidentes incidentes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidentes
    ADD CONSTRAINT incidentes_pkey PRIMARY KEY (id);


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
-- Name: obras obras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


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
-- Name: reportes_campo reportes_campo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_campo
    ADD CONSTRAINT reportes_campo_pkey PRIMARY KEY (id);


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
-- Name: asistencias_semanales_trabajador_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX asistencias_semanales_trabajador_id_idx ON public.asistencias_semanales USING btree (trabajador_id);


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
-- Name: clientes_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clientes_codigo_key ON public.clientes USING btree (codigo);


--
-- Name: contactos_emergencia_trabajador_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contactos_emergencia_trabajador_id_key ON public.contactos_emergencia USING btree (trabajador_id);


--
-- Name: cotizaciones_cliente_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cotizaciones_cliente_id_idx ON public.cotizaciones USING btree (cliente_id);


--
-- Name: cotizaciones_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cotizaciones_codigo_key ON public.cotizaciones USING btree (codigo);


--
-- Name: cuentas_por_cobrar_cliente_id_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cuentas_por_cobrar_cliente_id_estado_idx ON public.cuentas_por_cobrar USING btree (cliente_id, estado);


--
-- Name: cuentas_por_cobrar_factura_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cuentas_por_cobrar_factura_id_key ON public.cuentas_por_cobrar USING btree (factura_id);


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
-- Name: facturas_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX facturas_estado_idx ON public.facturas USING btree (estado);


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
-- Name: idx_documentos_nombre_fts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_nombre_fts ON public.documentos USING gin (to_tsvector('spanish'::regconfig, ((nombre || ' '::text) || COALESCE(descripcion, ''::text))));


--
-- Name: idx_documentos_palabras_clave; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_palabras_clave ON public.documentos USING gin (palabras_clave);


--
-- Name: idx_geocercas_geometria; Type: INDEX; Schema: public; Owner: -
--



--
-- Name: idx_proyectos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proyectos_estado ON public.proyectos USING btree (estado);


--
-- Name: idx_proyectos_nombre_fts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proyectos_nombre_fts ON public.proyectos USING gin (to_tsvector('spanish'::regconfig, nombre));


--
-- Name: idx_rastreo_gps_posicion; Type: INDEX; Schema: public; Owner: -
--



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
-- Name: incidentes_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX incidentes_codigo_key ON public.incidentes USING btree (codigo);


--
-- Name: incidentes_maquina_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX incidentes_maquina_id_idx ON public.incidentes USING btree (maquina_id);


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
-- Name: obras_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX obras_codigo_key ON public.obras USING btree (codigo);


--
-- Name: obras_proyecto_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX obras_proyecto_id_idx ON public.obras USING btree (proyecto_id);


--
-- Name: pagos_cliente_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_cliente_id_idx ON public.pagos USING btree (cliente_id);


--
-- Name: pagos_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pagos_codigo_key ON public.pagos USING btree (codigo);


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
-- Name: registros_mantenimiento_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX registros_mantenimiento_codigo_key ON public.registros_mantenimiento USING btree (codigo);


--
-- Name: registros_mantenimiento_maquina_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registros_mantenimiento_maquina_id_idx ON public.registros_mantenimiento USING btree (maquina_id);


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
-- Name: users_persona_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_persona_id_key ON public.users USING btree (persona_id);


--
-- Name: users_roles_user_id_rol_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_roles_user_id_rol_id_key ON public.users_roles USING btree (user_id, rol_id);


--
-- Name: usuarios_bloqueados_user_id_activo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX usuarios_bloqueados_user_id_activo_idx ON public.usuarios_bloqueados USING btree (user_id, activo);


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
-- Name: incidentes trg_incidentes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_incidentes_updated_at BEFORE UPDATE ON public.incidentes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


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
-- Name: permisos trg_permisos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_permisos_updated_at BEFORE UPDATE ON public.permisos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


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
-- Name: cotizaciones cotizaciones_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: incidentes fk_incidentes_actualizado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidentes
    ADD CONSTRAINT fk_incidentes_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incidentes fk_incidentes_creado_por; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidentes
    ADD CONSTRAINT fk_incidentes_creado_por FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incidentes fk_incidentes_reporto; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidentes
    ADD CONSTRAINT fk_incidentes_reporto FOREIGN KEY (reporto_id) REFERENCES public.trabajadores(id) ON DELETE SET NULL;


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
-- Name: incidentes incidentes_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidentes
    ADD CONSTRAINT incidentes_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: incidentes incidentes_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidentes
    ADD CONSTRAINT incidentes_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: obras obras_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pagos pagos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pagos pagos_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.facturas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: percepciones_nomina percepciones_nomina_nomina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.percepciones_nomina
    ADD CONSTRAINT percepciones_nomina_nomina_id_fkey FOREIGN KEY (nomina_id) REFERENCES public.nominas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: permisos permisos_trabajador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_trabajador_id_fkey FOREIGN KEY (trabajador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: registros_criba registros_criba_operador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_criba
    ADD CONSTRAINT registros_criba_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: vistas vistas_vista_padre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistas
    ADD CONSTRAINT vistas_vista_padre_id_fkey FOREIGN KEY (vista_padre_id) REFERENCES public.vistas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict dTye1UQgeWBhEF0RvVWtpkCxeTx2tLBY2G9WSnQQsDiVQDSFolWa3xbC55oGX6n

