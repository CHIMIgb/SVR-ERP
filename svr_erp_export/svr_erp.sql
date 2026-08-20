--
-- PostgreSQL database dump
--

\restrict 79QM1NNcoJtD4tYpbtLYhxNj6FShqR6ubO3Abc4j05Xd2NEykzFIs4m26FIUkIS

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
-- Name: CategoriaPuesto; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CategoriaPuesto" AS ENUM (
    'OPERADOR',
    'CHOFER',
    'MECANICO',
    'INGENIERO',
    'ADMINISTRATIVO'
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
-- Name: apu_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apu_items (
    id uuid NOT NULL,
    apu_template_id uuid NOT NULL,
    categoria public."CategoriaApuItem" NOT NULL,
    nombre text NOT NULL,
    unidad text NOT NULL,
    cantidad numeric(10,4) NOT NULL,
    costo_unitario numeric(12,2) NOT NULL
);


--
-- Name: apu_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apu_templates (
    id uuid NOT NULL,
    codigo text,
    nombre text NOT NULL,
    unidad text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
);


--
-- Name: articulos_inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articulos_inventario (
    id uuid NOT NULL,
    codigo text,
    nombre text NOT NULL,
    categoria text NOT NULL,
    stock numeric(10,2) NOT NULL,
    stock_minimo numeric(10,2) NOT NULL,
    unidad text NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    proveedor text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
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
    actualizado_en timestamp(3) without time zone NOT NULL
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
    obra text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    codigo text
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
    hora_inicio text NOT NULL,
    hora_fin text NOT NULL,
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
    actualizado_en timestamp(3) without time zone NOT NULL
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
    hora text NOT NULL,
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
    actualizado_en timestamp(3) without time zone NOT NULL
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
    actualizado_en timestamp(3) without time zone NOT NULL
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
    actualizado_en timestamp(3) without time zone NOT NULL
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
    actualizado_en timestamp(3) without time zone NOT NULL
);


--
-- Name: dias_asistencia_semana; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dias_asistencia_semana (
    id uuid NOT NULL,
    asistencia_semanal_id uuid NOT NULL,
    dia public."DiaSemana" NOT NULL,
    fecha text NOT NULL,
    estado public."EstadoAsistenciaDia" NOT NULL,
    hora_entrada text,
    hora_salida text,
    horas_trabajadas numeric(6,2) NOT NULL,
    horas_extra numeric(6,2),
    en_sitio_gps boolean NOT NULL,
    motivo text
);


--
-- Name: documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos (
    id uuid NOT NULL,
    nombre text NOT NULL,
    tipo public."TipoDocumento" NOT NULL,
    categoria public."CategoriaDocumento" NOT NULL,
    fecha date NOT NULL,
    tamano_bytes bigint,
    propietario text NOT NULL,
    trabajador_id uuid,
    url_archivo text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    codigo text
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
    fecha_firma text
);


--
-- Name: hitos_progreso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hitos_progreso (
    id uuid NOT NULL,
    proyecto_id uuid NOT NULL,
    fecha text NOT NULL,
    planificado numeric(5,2) NOT NULL,
    "real" numeric(5,2) NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: horas_extra_asistencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horas_extra_asistencia (
    id uuid NOT NULL,
    registro_asistencia_id uuid NOT NULL,
    inicio text NOT NULL,
    fin text,
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
    actualizado_en timestamp(3) without time zone NOT NULL
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
    obra text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
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
    codigo text
);


--
-- Name: licencias_trabajador; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licencias_trabajador (
    id uuid NOT NULL,
    trabajador_id uuid NOT NULL,
    tipo text NOT NULL,
    vigencia text NOT NULL,
    folio text NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
);


--
-- Name: maquinas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maquinas (
    id uuid NOT NULL,
    codigo text,
    nombre text NOT NULL,
    tipo text NOT NULL,
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
    actualizado_en timestamp(3) without time zone NOT NULL
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
    codigo text
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
    gastado numeric(14,2) DEFAULT 0 NOT NULL,
    progreso numeric(5,2) DEFAULT 0 NOT NULL,
    estado public."EstadoProyecto" DEFAULT 'EN_PROCESO'::public."EstadoProyecto" NOT NULL,
    ubicacion text NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    ingreso_cobrado numeric(14,2) DEFAULT 0 NOT NULL,
    gasto_nomina numeric(14,2) DEFAULT 0 NOT NULL,
    gasto_combustible numeric(14,2) DEFAULT 0 NOT NULL,
    gasto_mantenimiento numeric(14,2) DEFAULT 0 NOT NULL,
    gasto_materiales numeric(14,2) DEFAULT 0 NOT NULL,
    utilidad_real numeric(14,2) DEFAULT 0 NOT NULL,
    margen_utilidad_porcentaje numeric(5,2) DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
);


--
-- Name: registros_asistencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros_asistencia (
    id uuid NOT NULL,
    codigo text,
    trabajador_id uuid NOT NULL,
    fecha date NOT NULL,
    hora_entrada text,
    hora_salida text,
    hora_marcaje_exacta text,
    hora_salida_exacta text,
    estado public."EstadoAsistencia" NOT NULL,
    ubicacion text NOT NULL,
    lat_entrada numeric(9,6) NOT NULL,
    lng_entrada numeric(9,6) NOT NULL,
    lat_salida numeric(9,6),
    lng_salida numeric(9,6),
    salida_ubicacion text,
    proyecto_id uuid,
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
    actualizado_en timestamp(3) without time zone NOT NULL
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
    actualizado_en timestamp(3) without time zone NOT NULL
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
    actualizado_en timestamp(3) without time zone NOT NULL
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
    obra text NOT NULL,
    fecha date NOT NULL,
    hora text NOT NULL,
    descripcion text NOT NULL,
    estado public."EstadoReporteCampo" DEFAULT 'PENDIENTE'::public."EstadoReporteCampo" NOT NULL,
    prioridad public."Prioridad",
    detalles jsonb,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
);


--
-- Name: trabajadores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trabajadores (
    id uuid NOT NULL,
    codigo text,
    nombre text NOT NULL,
    puesto text NOT NULL,
    categoria_puesto public."CategoriaPuesto" NOT NULL,
    estado public."EstadoTrabajador" DEFAULT 'ACTIVO'::public."EstadoTrabajador" NOT NULL,
    entrada text NOT NULL,
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
    actualizado_en timestamp(3) without time zone NOT NULL
);


--
-- Name: trabajadores_proyectos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trabajadores_proyectos (
    trabajador_id uuid NOT NULL,
    proyecto_id uuid NOT NULL,
    asignado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    actualizado_en timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
f5552911-323c-493e-8bd4-becfc05714da	c71e163ff37ee24bd449350eb4b04dc0c291c331b502644076bfb624ccb880ec	2026-08-18 16:57:31.737128-06	20260818225731_init	\N	\N	2026-08-18 16:57:31.332474-06	1
78fa04d9-6224-4527-b56a-b0aaab39ed3b	9b18a8632276cc1b1e2f7ec25a8e0b0ebc9dcef016e1c6e641c50ee0ac6f2a18	2026-08-18 16:58:08.877024-06	20260818225808_remove_redundant_relation	\N	\N	2026-08-18 16:58:08.862384-06	1
ffb3d98e-13fa-4ae0-8fa7-03ea8fb98b6a	9f775d4f9c96cac5680f3ef202c123a1d70dc187da4e662bf290652227fa2b85	2026-08-19 09:54:53.6712-06	20260818231500_schema_fixes_verificacion	\N	\N	2026-08-19 09:54:53.564084-06	1
\.


--
-- Data for Name: apu_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.apu_items (id, apu_template_id, categoria, nombre, unidad, cantidad, costo_unitario) FROM stdin;
d7a47ced-51c5-42ce-a5c9-1f60600bbb68	32360387-368c-4958-a1b9-e2ee7f7a881c	MATERIAL	Concreto Premezclado f'c=250	m³	0.1200	2200.00
f2fa4e67-c04d-4e5c-b66d-f3c14e69c509	32360387-368c-4958-a1b9-e2ee7f7a881c	MATERIAL	Malla Electrosoldada 6-6/10-10	m²	1.1500	45.00
448e904a-a56f-4937-b145-784eb2aa9c00	32360387-368c-4958-a1b9-e2ee7f7a881c	MATERIAL	Madera para Cimbra (Uso)	pt	2.5000	18.00
1dd3028f-f5c7-4e98-9ac7-c2f4dc55acc5	32360387-368c-4958-a1b9-e2ee7f7a881c	MANO_DE_OBRA	Cuadrilla de Albañilería (1 Oficial + 2 Ayudantes)	jor	0.0500	1800.00
0802b4da-0479-4827-bbc4-34e11e424d77	32360387-368c-4958-a1b9-e2ee7f7a881c	MANO_DE_OBRA	Cabo de Oficios	jor	0.0050	2200.00
19a41a67-5f5f-4380-84ab-4d3a2f65f105	32360387-368c-4958-a1b9-e2ee7f7a881c	MAQUINARIA	Vibrador para Concreto 4HP	hr	0.2000	150.00
6f03b6a6-e607-4ca8-a215-2bd77cee6cae	32360387-368c-4958-a1b9-e2ee7f7a881c	MAQUINARIA	Herramienta Menor (3% Mano de Obra)	%mo	1.0000	3.50
a81bffc1-4820-41d4-8db4-49784fade468	332eb52b-649a-459c-9d26-9a41dc2dd747	MANO_DE_OBRA	Cuadrilla de Operación (1 Operador + 1 Ayudante)	jor	0.0200	2000.00
345e58a7-cf6f-42ea-9c17-a363b09fe587	332eb52b-649a-459c-9d26-9a41dc2dd747	MANO_DE_OBRA	Ayudante general (limpieza)	jor	0.0400	700.00
8bff8625-6f21-4521-b3c4-a00925477a77	332eb52b-649a-459c-9d26-9a41dc2dd747	MAQUINARIA	Excavadora CAT 320 (incluye diésel)	hr	0.1500	850.00
13948199-d6e9-44c6-8e8a-d14c0b80dfc8	332eb52b-649a-459c-9d26-9a41dc2dd747	MAQUINARIA	Herramienta Menor	%mo	1.0000	2.00
15ee1278-8629-4abd-9de6-f97c5ce76520	6df81ea1-802d-48ba-bdc8-01310cef92ba	MATERIAL	Block de Concreto 15x20x40	pza	12.5000	14.00
227edef0-3f9f-4207-afd7-c6d0519526d0	6df81ea1-802d-48ba-bdc8-01310cef92ba	MATERIAL	Mortero Cemento-Arena 1:5	m³	0.0150	1600.00
a2e31c37-c062-460d-a288-849b5def4b53	6df81ea1-802d-48ba-bdc8-01310cef92ba	MATERIAL	Andamios (Renta)	día	0.1000	50.00
634a727b-b347-4ad5-97a7-e2f8f262f344	6df81ea1-802d-48ba-bdc8-01310cef92ba	MANO_DE_OBRA	Cuadrilla de Albañiles (1 Oficial + 1 Ayudante)	jor	0.0800	1400.00
ece0d348-3c99-4f06-b87a-ea415bc0232f	6df81ea1-802d-48ba-bdc8-01310cef92ba	MAQUINARIA	Revolvedora de Concreto 1 saco	hr	0.1000	80.00
\.


--
-- Data for Name: apu_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.apu_templates (id, codigo, nombre, unidad, activo, creado_en, actualizado_en) FROM stdin;
32360387-368c-4958-a1b9-e2ee7f7a881c	APU001	Colado de Losa de Concreto f'c=250 kg/cm²	m²	t	2026-08-19 15:59:09.601	2026-08-19 15:59:09.601
332eb52b-649a-459c-9d26-9a41dc2dd747	APU002	Excavación Mecánica en Terreno Tipo B	m³	t	2026-08-19 15:59:09.608	2026-08-19 15:59:09.608
6df81ea1-802d-48ba-bdc8-01310cef92ba	APU003	Muro de Block de Concreto 15x20x40 cm	m²	t	2026-08-19 15:59:09.612	2026-08-19 15:59:09.612
\.


--
-- Data for Name: articulos_inventario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.articulos_inventario (id, codigo, nombre, categoria, stock, stock_minimo, unidad, precio_unitario, proveedor, activo, creado_en, actualizado_en) FROM stdin;
753a9a32-c28b-4110-a8e2-90ed38eda683	I001	Filtro de Aceite CAT	Refacciones	12.00	5.00	Pza	450.00	CAT México	t	2026-08-19 15:59:09.522	2026-08-19 15:59:09.522
06725c85-7a73-4365-8c19-e1695b5b96c3	I002	Aceite Hidráulico SAE 10W	Lubricantes	45.00	100.00	Galones	1200.00	Lubricantes Especializados	t	2026-08-19 15:59:09.525	2026-08-19 15:59:09.525
35e6d94a-2bba-43a6-9fd9-b3af297981b0	I003	Llanta para Volteo 11R22.5	Neumáticos	4.00	4.00	Pza	8500.00	Michelin	t	2026-08-19 15:59:09.526	2026-08-19 15:59:09.526
\.


--
-- Data for Name: asistencias_semanales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asistencias_semanales (id, trabajador_id, semana, total_dias_asistidos, total_faltas, total_retardos, total_horas_ordinarias, total_horas_extra, creado_en, actualizado_en) FROM stdin;
dbdb3491-e75f-4e24-8793-c8296d782b57	04674c25-10ab-4767-81c8-783ad8ac1872	Semana 17 (21 Abr - 26 Abr 2025)	6	0	1	48.00	6.50	2026-08-19 15:59:09.496	2026-08-19 15:59:09.496
74afe8cf-ea51-454b-a38e-282de1e0931f	f61c081a-b3f1-4a24-81a1-b038c4f9acb4	Semana 17 (21 Abr - 26 Abr 2025)	6	0	0	48.00	4.50	2026-08-19 15:59:09.505	2026-08-19 15:59:09.505
cc2e5bf9-1792-4f37-b809-ae62db70b01b	681536f0-d5b0-4ac5-a417-688bc5700396	Semana 17 (21 Abr - 26 Abr 2025)	5	1	2	40.00	0.00	2026-08-19 15:59:09.513	2026-08-19 15:59:09.513
f8da1203-8430-402c-a308-780362ccc660	1a5a6770-e8b5-474d-8f25-e700a82b7e89	Semana 17 (21 Abr - 26 Abr 2025)	6	0	0	45.75	0.00	2026-08-19 15:59:09.518	2026-08-19 15:59:09.518
\.


--
-- Data for Name: bitacoras_operacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bitacoras_operacion (id, maquina_id, actividad, horas, fecha, obra, activo, creado_en, actualizado_en, codigo) FROM stdin;
e1832ad2-d7b6-4946-a288-2459258e9941	09094cfd-604b-47e8-bff0-61809f2a0f25	Excavación para cimentación profunda	8.00	2025-04-27	Valle Sur	t	2026-08-19 15:59:09.577	2026-08-19 15:59:09.577	B001
e1c98f79-7283-4e67-b1e0-d0313fd1e80c	f847681b-c679-4728-9fe2-a47fe1590745	Acarreo de escombro a tiro autorizado	6.00	2025-04-27	Valle Sur	t	2026-08-19 15:59:09.581	2026-08-19 15:59:09.581	B002
\.


--
-- Data for Name: bitacoras_renta_diaria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bitacoras_renta_diaria (id, folio, trabajador_id, maquina_id, fecha, cliente_id, obra_ubicacion, hora_inicio, hora_fin, horas_efectivas, horas_extras, horometro_inicial, horometro_final, actividad_realizada, estado_cobro, tarifa_hora_renta, importe_total_renta, activo, creado_en, actualizado_en) FROM stdin;
5d67cbcd-8971-4126-83fb-9e0a6a220f06	BIT-2025-042	04674c25-10ab-4767-81c8-783ad8ac1872	09094cfd-604b-47e8-bff0-61809f2a0f25	2025-04-27	874b9b94-bca3-4d55-89dd-b32ab2366afe	Fraccionamiento Valle Sur (Manzana 4)	07:00 AM	05:30 PM	8.00	2.50	1238.50	1249.00	Excavación de zanja pluvial 80m lineales, afine de talud y carga de material sobrante a camiones de volteo.	LISTO_FACTURAR	1450.00	15225.00	t	2026-08-19 15:59:09.452	2026-08-19 15:59:09.452
e6c1bafe-cea5-4049-bd96-307f978774b1	BIT-2025-041	f61c081a-b3f1-4a24-81a1-b038c4f9acb4	1aa6ce00-74d4-4689-bfce-f942918ed7b6	2025-04-27	a393191b-fb6e-42c6-a121-2172446155fd	Remodelación Centro Histórico (Calle 5 de Mayo)	07:00 AM	03:00 PM	8.00	0.00	885.00	893.00	Demolición de banquetas dañadas, retiro de escombro y apertura de cajas para tubería de gas natural.	FACTURADO	950.00	7600.00	t	2026-08-19 15:59:09.46	2026-08-19 15:59:09.46
cb64943b-4fd4-4041-b167-e1734bee72a8	BIT-2025-040	681536f0-d5b0-4ac5-a417-688bc5700396	f847681b-c679-4728-9fe2-a47fe1590745	2025-04-26	6cfc8dc7-466c-44f5-a4da-0f39bed5e2ac	Tramo Carretero Atizapán Km 14+200	06:30 AM	06:00 PM	8.00	3.50	3410.00	3421.50	12 viajes de acarreo de base hidráulica y tepetate desde banco de tiro a terraplén principal.	PENDIENTE_FIRMA	850.00	9775.00	t	2026-08-19 15:59:09.467	2026-08-19 15:59:09.467
\.


--
-- Data for Name: cargas_combustible; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cargas_combustible (id, codigo, maquina_id, fecha, litros, costo, operador_id, lugar, horometro_actual, horas_trabajadas_periodo, consumo_esperado_lts_hora, rendimiento_lts_hora, alerta_ordena, desviacion_porcentaje, activo, creado_en, actualizado_en) FROM stdin;
e6168a2a-65bb-443d-9ef6-0f0a1887e4e8	F001	09094cfd-604b-47e8-bff0-61809f2a0f25	2025-04-27	110.00	2530.00	04674c25-10ab-4767-81c8-783ad8ac1872	Gasolinera Norte	1245.50	8.00	14.00	13.75	f	-1.80	t	2026-08-19 15:59:09.416	2026-08-19 15:59:09.416
bedadcdc-ff39-47f9-831b-909b293b683f	F002	f847681b-c679-4728-9fe2-a47fe1590745	2025-04-27	200.00	4600.00	681536f0-d5b0-4ac5-a417-688bc5700396	Autoconsumo Obra Valle Sur	3421.10	8.50	12.00	23.53	t	96.10	t	2026-08-19 15:59:09.421	2026-08-19 15:59:09.421
eb4505e9-d0a5-4831-a12d-a27e59d6140b	F003	1aa6ce00-74d4-4689-bfce-f942918ed7b6	2025-04-26	45.00	1035.00	f61c081a-b3f1-4a24-81a1-b038c4f9acb4	Gasolinera Centro	890.20	4.80	9.50	9.38	f	-1.20	t	2026-08-19 15:59:09.425	2026-08-19 15:59:09.425
\.


--
-- Data for Name: checklists_preoperacionales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.checklists_preoperacionales (id, codigo, maquina_id, fecha, hora, operador_id, horometro_inicial, nivel_aceite_motor, nivel_hidraulico, fugas_visibles, estado_llantas_orugas, luces_y_alarmas, sistema_frenos, estado, observaciones, activo, creado_en, actualizado_en) FROM stdin;
734c116c-a339-4992-b121-b485c46e561d	CHK-001	09094cfd-604b-47e8-bff0-61809f2a0f25	2025-04-27	06:50 AM	04674c25-10ab-4767-81c8-783ad8ac1872	1239.20	CORRECTO	CORRECTO	f	CORRECTO	CORRECTO	CORRECTO	APROBADO	Equipo en óptimas condiciones para inicio de jornada.	t	2026-08-19 15:59:09.403	2026-08-19 15:59:09.403
c35bf9d5-ad34-4074-820b-e02ef4577a1a	CHK-002	1aa6ce00-74d4-4689-bfce-f942918ed7b6	2025-04-27	07:10 AM	f61c081a-b3f1-4a24-81a1-b038c4f9acb4	885.40	CORRECTO	BAJO	t	CORRECTO	CORRECTO	CORRECTO	CON_FALLA	Goteo visible en manguera de cilindro de elevación. Requiere reapriete de niple.	t	2026-08-19 15:59:09.409	2026-08-19 15:59:09.409
ee22a7fc-57a7-45a3-84c9-928378d1f656	CHK-004	f847681b-c679-4728-9fe2-a47fe1590745	2025-04-27	06:45 AM	681536f0-d5b0-4ac5-a417-688bc5700396	3412.60	CORRECTO	CORRECTO	f	CORRECTO	CORRECTO	CORRECTO	APROBADO	Inspección pre-operacional conforme.	t	2026-08-19 15:59:09.412	2026-08-19 15:59:09.412
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clientes (id, codigo, nombre, empresa, correo, telefono, activo, creado_en, actualizado_en) FROM stdin;
874b9b94-bca3-4d55-89dd-b32ab2366afe	C001	Ing. Alberto Ruiz	Inmobiliaria ARCO	aruiz@arco.com	555-9988	t	2026-08-19 15:59:09.238	2026-08-19 15:59:09.238
dde17342-ac1d-4f50-8ec2-359e94421f25	C002	Lic. Martha Silva	Gobierno CDMX	msilva@gob.mx	555-1122	t	2026-08-19 15:59:09.248	2026-08-19 15:59:09.248
ce086e14-e42f-487d-a929-319117f756b1	\N	SCT	SCT			t	2026-08-19 15:59:09.25	2026-08-19 15:59:09.25
6cfc8dc7-466c-44f5-a4da-0f39bed5e2ac	\N	Constructora ABC / SCT	Constructora ABC / SCT			t	2026-08-19 15:59:09.253	2026-08-19 15:59:09.253
a393191b-fb6e-42c6-a121-2172446155fd	\N	Gobierno CDMX - Obras Públicas	Gobierno CDMX - Obras Públicas			t	2026-08-19 15:59:09.255	2026-08-19 15:59:09.255
\.


--
-- Data for Name: contactos_emergencia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contactos_emergencia (id, trabajador_id, nombre, telefono, parentesco, creado_en, actualizado_en) FROM stdin;
ed352375-492f-4ee5-a3e4-0672ef0923fc	04674c25-10ab-4767-81c8-783ad8ac1872	María Gómez	55 9876 5432	Esposa	2026-08-19 15:59:09.29	2026-08-19 15:59:09.29
36210397-db1c-4b01-8e4e-7cf992e7f447	f61c081a-b3f1-4a24-81a1-b038c4f9acb4	Rosa Pérez	55 1122 3344	Madre	2026-08-19 15:59:09.305	2026-08-19 15:59:09.305
e7352e91-c8e7-43a3-afc5-0bad49ccf25f	1a5a6770-e8b5-474d-8f25-e700a82b7e89	Carlos Martínez	55 5566 7788	Hermano	2026-08-19 15:59:09.313	2026-08-19 15:59:09.313
65dc38e6-3885-46bf-8db6-f1eb8164b276	681536f0-d5b0-4ac5-a417-688bc5700396	Lucía Torres	55 9988 7766	Esposa	2026-08-19 15:59:09.321	2026-08-19 15:59:09.321
fe1a490e-8d1e-4647-844d-db0d44fb970e	06fb5fb6-0557-48cd-880e-9704292c1a64	Laura Soto	55 4433 2211	Esposa	2026-08-19 15:59:09.33	2026-08-19 15:59:09.33
dfc2d827-7df9-4c40-9ade-7fa67f0face2	bf551c0d-2cb7-4710-b1a9-b8a1a620eabd	Patricia Valenzuela	55 7788 9900	Hermana	2026-08-19 15:59:09.337	2026-08-19 15:59:09.337
\.


--
-- Data for Name: cotizaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cotizaciones (id, codigo, cliente_id, descripcion, monto, fecha, estado, activo, creado_en, actualizado_en) FROM stdin;
668e13bb-63e4-4f04-a3ee-88aee0303761	Q001	874b9b94-bca3-4d55-89dd-b32ab2366afe	Renta de Excavadora 320 por 100 horas	125000.00	2025-04-25	ACEPTADA	t	2026-08-19 15:59:09.528	2026-08-19 15:59:09.528
f6195298-2daa-4dfd-a2f8-13e7896bc573	Q002	874b9b94-bca3-4d55-89dd-b32ab2366afe	Movimiento de tierras Valle Sur - Fase 2	450000.00	2025-04-27	PENDIENTE	t	2026-08-19 15:59:09.532	2026-08-19 15:59:09.532
\.


--
-- Data for Name: despachos_maquina; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.despachos_maquina (id, codigo, maquina_id, proyecto_id, fecha_inicio, fecha_fin, activo, creado_en, actualizado_en) FROM stdin;
53e20249-5ee6-4021-8aad-188efd7b71d9	DSP001	09094cfd-604b-47e8-bff0-61809f2a0f25	143ba85d-c020-4c84-8936-aef87b340808	2025-04-20	2025-05-02	t	2026-08-19 15:59:09.444	2026-08-19 15:59:09.444
21ebd64e-8eac-4ee3-934b-d2373253dda9	DSP002	1aa6ce00-74d4-4689-bfce-f942918ed7b6	f4a7f05c-76dd-431e-a669-bfff70185774	2025-04-25	2025-04-29	t	2026-08-19 15:59:09.447	2026-08-19 15:59:09.447
1a5543d3-9e87-4a73-81d3-f2a80233c0e5	DSP004	f847681b-c679-4728-9fe2-a47fe1590745	143ba85d-c020-4c84-8936-aef87b340808	2025-04-22	2025-04-30	t	2026-08-19 15:59:09.448	2026-08-19 15:59:09.448
\.


--
-- Data for Name: dias_asistencia_semana; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dias_asistencia_semana (id, asistencia_semanal_id, dia, fecha, estado, hora_entrada, hora_salida, horas_trabajadas, horas_extra, en_sitio_gps, motivo) FROM stdin;
3afe56bb-fa68-4eec-a487-9604e5f8c435	dbdb3491-e75f-4e24-8793-c8296d782b57	LUN	21 Abr	PUNTUAL	06:55 AM	05:00 PM	8.00	2.00	t	\N
39d342ff-1be2-4e0e-98ae-ec926f5ac6b6	dbdb3491-e75f-4e24-8793-c8296d782b57	MAR	22 Abr	PUNTUAL	07:00 AM	05:00 PM	8.00	0.00	t	\N
37ef7525-3b56-4829-a529-bbd6c6fd5ef0	dbdb3491-e75f-4e24-8793-c8296d782b57	MIE	23 Abr	RETARDO	07:22 AM	05:00 PM	8.00	1.00	t	\N
ee8983e8-615a-4ce6-8374-2d34c3d75a36	dbdb3491-e75f-4e24-8793-c8296d782b57	JUE	24 Abr	PUNTUAL	06:58 AM	05:00 PM	8.00	0.00	t	\N
fb2f0168-d8d9-4237-a64a-07a1495ebe98	dbdb3491-e75f-4e24-8793-c8296d782b57	VIE	25 Abr	PUNTUAL	07:02 AM	05:00 PM	8.00	3.50	t	\N
9b723443-0712-432f-a1eb-435669ba028e	dbdb3491-e75f-4e24-8793-c8296d782b57	SAB	26 Abr	PUNTUAL	07:00 AM	03:00 PM	8.00	0.00	t	\N
64d51429-829a-47ae-8aca-ea55544deb7f	74afe8cf-ea51-454b-a38e-282de1e0931f	LUN	21 Abr	PUNTUAL	06:50 AM	05:00 PM	8.00	2.00	t	\N
03aaf7f4-b7df-40d0-8ee7-6f2d547cee11	74afe8cf-ea51-454b-a38e-282de1e0931f	MAR	22 Abr	PUNTUAL	06:55 AM	05:00 PM	8.00	0.00	t	\N
373614da-1064-4c65-b908-2a982557647c	74afe8cf-ea51-454b-a38e-282de1e0931f	MIE	23 Abr	PUNTUAL	06:58 AM	05:00 PM	8.00	0.00	t	\N
993f4675-6050-469d-ad12-3075d1f8729a	74afe8cf-ea51-454b-a38e-282de1e0931f	JUE	24 Abr	PUNTUAL	06:52 AM	05:00 PM	8.00	2.50	t	\N
31afed9d-90fe-43d5-9ca0-0660a4650b22	74afe8cf-ea51-454b-a38e-282de1e0931f	VIE	25 Abr	PUNTUAL	06:58 AM	05:00 PM	8.00	0.00	t	\N
95b3b650-2683-4926-8278-d7bc163e2c29	74afe8cf-ea51-454b-a38e-282de1e0931f	SAB	26 Abr	PUNTUAL	07:00 AM	03:00 PM	8.00	0.00	t	\N
42129cd6-12d7-42ed-802b-42fd1df2e6fc	cc2e5bf9-1792-4f37-b809-ae62db70b01b	LUN	21 Abr	RETARDO	07:45 AM	05:00 PM	8.00	0.00	t	\N
9450ccb2-4987-49a5-9a9b-a3a8309c5832	cc2e5bf9-1792-4f37-b809-ae62db70b01b	MAR	22 Abr	PUNTUAL	07:05 AM	05:00 PM	8.00	0.00	t	\N
2b3b635b-5195-4cac-9809-b85c79f21574	cc2e5bf9-1792-4f37-b809-ae62db70b01b	MIE	23 Abr	FALTA	\N	\N	0.00	0.00	f	Inasistencia no justificada
ed1d084d-f88f-4452-846e-8f6058a16648	cc2e5bf9-1792-4f37-b809-ae62db70b01b	JUE	24 Abr	PUNTUAL	07:00 AM	05:00 PM	8.00	0.00	t	\N
4f435cca-e489-4775-bf8d-bf04b7ed25b5	cc2e5bf9-1792-4f37-b809-ae62db70b01b	VIE	25 Abr	RETARDO	08:15 AM	05:00 PM	8.00	0.00	f	Marcaje fuera de geocerca
7e40bb5f-caad-48e0-8fcb-104224b2a36d	cc2e5bf9-1792-4f37-b809-ae62db70b01b	SAB	26 Abr	PUNTUAL	07:00 AM	03:00 PM	8.00	0.00	t	\N
dd30d85e-65b7-450c-bc7b-141ff0b74f75	f8da1203-8430-402c-a308-780362ccc660	LUN	21 Abr	PUNTUAL	08:30 AM	05:00 PM	8.00	0.00	t	\N
6991481b-a999-465e-98fe-a4fefe7196b1	f8da1203-8430-402c-a308-780362ccc660	MAR	22 Abr	PUNTUAL	08:28 AM	05:00 PM	8.00	0.00	t	\N
ce85b311-3cbd-4ecd-8c24-b15d0b13ee8d	f8da1203-8430-402c-a308-780362ccc660	MIE	23 Abr	PUNTUAL	08:30 AM	05:00 PM	8.00	0.00	t	\N
cb630094-f9dc-48d7-911a-839eb6693412	f8da1203-8430-402c-a308-780362ccc660	JUE	24 Abr	PUNTUAL	08:25 AM	05:00 PM	8.00	0.00	t	\N
b9c91237-950b-4607-a9fe-8068b1ec5105	f8da1203-8430-402c-a308-780362ccc660	VIE	25 Abr	SALIDA_ANTICIPADA	08:30 AM	02:15 PM	5.75	0.00	t	Cita médica IMSS
1caa1a52-0579-40e0-9792-3509460f2444	f8da1203-8430-402c-a308-780362ccc660	SAB	26 Abr	PUNTUAL	08:30 AM	02:30 PM	6.00	0.00	t	\N
\.


--
-- Data for Name: documentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documentos (id, nombre, tipo, categoria, fecha, tamano_bytes, propietario, trabajador_id, url_archivo, activo, creado_en, actualizado_en, codigo) FROM stdin;
152bc115-f7e0-4736-a0d4-891cb24ea1e1	Contrato_Laboral_Juan_Perez.pdf	CONTRATO	PERSONAL	2022-03-15	1887437	Juan Pérez	04674c25-10ab-4767-81c8-783ad8ac1872	\N	t	2026-08-19 15:59:09.544	2026-08-19 15:59:09.544	D001
eef77a19-7431-41a5-9a32-3483c5425b24	INE_Juan_Perez.jpg	IDENTIFICACION	PERSONAL	2022-03-15	1258291	Juan Pérez	04674c25-10ab-4767-81c8-783ad8ac1872	\N	t	2026-08-19 15:59:09.547	2026-08-19 15:59:09.547	D002
1b49c1ae-bd02-4fef-bc3b-b86bb22dcd81	Contrato_Laboral_Pedro_Gomez.pdf	CONTRATO	PERSONAL	2021-08-01	1782579	Pedro Gómez	f61c081a-b3f1-4a24-81a1-b038c4f9acb4	\N	t	2026-08-19 15:59:09.549	2026-08-19 15:59:09.549	D003
91151d3d-9d7d-41a7-bc5e-2a643768987e	INE_Ana_Martinez.jpg	IDENTIFICACION	PERSONAL	2020-01-10	943718	Ana Martínez	1a5a6770-e8b5-474d-8f25-e700a82b7e89	\N	t	2026-08-19 15:59:09.551	2026-08-19 15:59:09.551	D004
01c1ab63-6df3-4158-835e-6a965885936b	Contrato_Laboral_Luis_Torres.pdf	CONTRATO	PERSONAL	2023-06-20	1677722	Luis Torres	681536f0-d5b0-4ac5-a417-688bc5700396	\N	t	2026-08-19 15:59:09.553	2026-08-19 15:59:09.553	D005
c217a7fb-4d99-4b86-b3fb-954b0c6fc856	Contrato_Valle_Sur_Fase1.pdf	CONTRATO	PROYECTOS	2025-01-10	2516582	Inmobiliaria ARCO	\N	\N	t	2026-08-19 15:59:09.555	2026-08-19 15:59:09.555	D006
7b592762-f9d3-41d8-b4dc-b9168ba74ccf	Permiso_Obra_Valle_Sur.pdf	PERMISO	PROYECTOS	2025-01-05	734003	Inmobiliaria ARCO	\N	\N	t	2026-08-19 15:59:09.557	2026-08-19 15:59:09.557	D007
fab80926-02e1-4405-9e47-c4c7f7ceffc3	Contrato_Centro_Historico.pdf	CONTRATO	PROYECTOS	2025-03-01	3250586	Gobierno CDMX	\N	\N	t	2026-08-19 15:59:09.559	2026-08-19 15:59:09.559	D008
bd4876da-d5cb-4b4c-8ed9-38e05e2ed995	Factura_Excavadora_CAT320.pdf	FACTURA	MAQUINARIA	2023-05-10	1153434	SVR Constructora	\N	\N	t	2026-08-19 15:59:09.561	2026-08-19 15:59:09.561	D009
e1fbe4cf-ee7d-46e1-9190-58db275c32df	Poliza_Seguro_Flota_2025.pdf	POLIZA	MAQUINARIA	2025-01-01	2097152	SVR Constructora	\N	\N	t	2026-08-19 15:59:09.563	2026-08-19 15:59:09.563	D010
3c3e7ed6-faba-4465-838c-f987ccad06d5	Manual_Liebherr_LTM.pdf	MANUAL	MAQUINARIA	2022-11-20	14680064	SVR Constructora	\N	\N	t	2026-08-19 15:59:09.566	2026-08-19 15:59:09.566	D011
96c7416b-c081-4f1d-83d3-71912d2c6077	Factura_Diesel_Abril_2025.pdf	FACTURA	CONTABILIDAD	2025-04-27	524288	SVR Constructora	\N	\N	t	2026-08-19 15:59:09.568	2026-08-19 15:59:09.568	D012
749e41de-fede-49f8-ae1b-175d2c20cf5b	Estado_Cuenta_Abril_2025.pdf	FACTURA	CONTABILIDAD	2025-04-30	838861	SVR Constructora	\N	\N	t	2026-08-19 15:59:09.57	2026-08-19 15:59:09.57	D013
\.


--
-- Data for Name: firmas_cliente; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.firmas_cliente (id, bitacora_id, firmado, nombre_residente, cargo_residente, fecha_firma) FROM stdin;
3878becb-38be-4fda-8794-6ec2d128dcc7	5d67cbcd-8971-4126-83fb-9e0a6a220f06	t	Ing. Roberto Garza	Residente de Obra · Inmobiliaria ARCO	2025-04-27 05:45 PM
f57e4435-4be5-4b6d-8a20-1654f2c4ac78	e6c1bafe-cea5-4049-bd96-307f978774b1	t	Arq. Manuel Morales	Supervisor Obras CDMX	2025-04-27 03:15 PM
2e7bdab4-ac10-4701-bea1-7be8356a9d6d	cb64943b-4fd4-4041-b167-e1734bee72a8	f	Ing. Fernando Silva	Jefe de Frente SCT	\N
\.


--
-- Data for Name: hitos_progreso; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hitos_progreso (id, proyecto_id, fecha, planificado, "real", creado_en) FROM stdin;
6caaf226-e894-48d3-82b2-02c76b66cf4a	143ba85d-c020-4c84-8936-aef87b340808	Ene	10.00	8.00	2026-08-19 15:59:09.365
972f83f4-3f89-4574-8fb5-ce4c44643fb8	143ba85d-c020-4c84-8936-aef87b340808	Feb	30.00	25.00	2026-08-19 15:59:09.365
1c102e6c-d081-437d-a531-9668b9d8128c	143ba85d-c020-4c84-8936-aef87b340808	Mar	50.00	48.00	2026-08-19 15:59:09.365
739f4020-2fab-4183-8cd2-ccfd03481179	143ba85d-c020-4c84-8936-aef87b340808	Abr	75.00	72.00	2026-08-19 15:59:09.365
cf96b8cc-ee49-4770-9568-98503483f8ea	143ba85d-c020-4c84-8936-aef87b340808	May	90.00	85.00	2026-08-19 15:59:09.365
90477d76-0416-4380-8cb0-082cbef0e158	f4a7f05c-76dd-431e-a669-bfff70185774	Mar	15.00	10.00	2026-08-19 15:59:09.374
33fecf65-2658-4ca8-8dbb-4b8488f33e13	f4a7f05c-76dd-431e-a669-bfff70185774	Abr	30.00	28.00	2026-08-19 15:59:09.374
16e96da0-3568-4096-b743-a65e1252a14f	f4a7f05c-76dd-431e-a669-bfff70185774	May	45.00	32.00	2026-08-19 15:59:09.374
8934d984-e89f-4b1b-bbf6-f9eba7158c55	5e63cd99-7a8f-493d-b809-8dfd5cbad85f	Nov	20.00	20.00	2026-08-19 15:59:09.381
b7e0a7fa-6619-434e-bd9a-8dabc13bcf54	5e63cd99-7a8f-493d-b809-8dfd5cbad85f	Dic	45.00	40.00	2026-08-19 15:59:09.381
eb8b2cd6-ee34-4176-ab3e-8ef4f6072511	5e63cd99-7a8f-493d-b809-8dfd5cbad85f	Ene	70.00	72.00	2026-08-19 15:59:09.381
b834e0c0-9f92-4da9-b9dd-8d378ad35f6a	5e63cd99-7a8f-493d-b809-8dfd5cbad85f	Feb	90.00	88.00	2026-08-19 15:59:09.381
3f2042e6-8b01-42e4-9579-b97e922426b4	5e63cd99-7a8f-493d-b809-8dfd5cbad85f	Mar	100.00	100.00	2026-08-19 15:59:09.381
\.


--
-- Data for Name: horas_extra_asistencia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.horas_extra_asistencia (id, registro_asistencia_id, inicio, fin, horas_calculadas, tarifa_por_hora, monto_total, estado, motivo, lat_inicio, lng_inicio, lat_fin, lng_fin, creado_en, actualizado_en) FROM stdin;
12eae244-a84a-4dc6-8707-103b58930aae	d9568a65-7dbb-49c6-bfd0-32b00c5f5fe2	05:00 PM	08:30 PM	3.50	80.00	280.00	APROBADO	Colado continuo de cimentación y losa	19.342300	-99.184100	19.342600	-99.184200	2026-08-19 15:59:09.473	2026-08-19 15:59:09.473
abd1c2f4-6221-4cc4-97ba-faa14e746f70	6955edb4-83cc-4309-9ff9-1971d7583783	04:30 PM	07:00 PM	2.50	75.00	187.50	APROBADO	Nivelación nocturna de terreno para pavimentación	19.432800	-99.133000	\N	\N	2026-08-19 15:59:09.481	2026-08-19 15:59:09.481
\.


--
-- Data for Name: incidentes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incidentes (id, codigo, titulo, descripcion, prioridad, estado, fecha, maquina_id, obra, activo, creado_en, actualizado_en) FROM stdin;
d58451b2-e0cc-4eab-b105-764b3faff007	IN001	Fuga de aceite hidráulico	Se detectó fuga en manguera principal	ALTA	EN_REVISION	2025-04-27	09094cfd-604b-47e8-bff0-61809f2a0f25	Valle Sur	t	2026-08-19 15:59:09.572	2026-08-19 15:59:09.572
b330f31c-7d40-4729-9953-97e28f82edd0	IN002	Retraso por clima	Lluvia intensa impidió colado de losa	BAJA	ABIERTO	2025-04-26	\N	Remodelación Centro	t	2026-08-19 15:59:09.575	2026-08-19 15:59:09.575
\.


--
-- Data for Name: lecturas_horometro; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lecturas_horometro (id, maquina_id, fecha, lectura_inicial, lectura_final, horas_trabajadas, activo, creado_en, actualizado_en, codigo) FROM stdin;
56cc6f4e-a68a-43f0-9e3f-436a0baa968b	09094cfd-604b-47e8-bff0-61809f2a0f25	2025-04-27	1237.50	1245.50	8.00	t	2026-08-19 15:59:09.435	2026-08-19 15:59:09.435	H001
eea70260-5d49-495e-b695-296d59582cf8	1aa6ce00-74d4-4689-bfce-f942918ed7b6	2025-04-27	885.20	890.20	5.00	t	2026-08-19 15:59:09.438	2026-08-19 15:59:09.438	H002
0be6c116-f124-483c-9e26-e87a07ba0ace	f847681b-c679-4728-9fe2-a47fe1590745	2025-04-27	3415.10	3421.10	6.00	t	2026-08-19 15:59:09.441	2026-08-19 15:59:09.441	H003
\.


--
-- Data for Name: licencias_trabajador; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.licencias_trabajador (id, trabajador_id, tipo, vigencia, folio, creado_en, actualizado_en) FROM stdin;
94a85031-9a17-423a-91c5-fd5c055f586c	04674c25-10ab-4767-81c8-783ad8ac1872	Certificación DC-3 Excavadora Hidráulica	2026-11-30	DC3-CAT-8921	2026-08-19 15:59:09.29	2026-08-19 15:59:09.29
4156d441-967e-4fdf-8357-bf732cf835d4	f61c081a-b3f1-4a24-81a1-b038c4f9acb4	Certificación DC-3 Retroexcavadora	2026-08-15	DC3-JD-4412	2026-08-19 15:59:09.305	2026-08-19 15:59:09.305
e07f077b-7c77-4fee-ae01-35445f5b8ebc	681536f0-d5b0-4ac5-a417-688bc5700396	Licencia Federal de Chofer Tipo E	2027-02-28	SCT-FED-99882	2026-08-19 15:59:09.321	2026-08-19 15:59:09.321
67bfd85f-af96-4e48-91cd-71ddc1580099	06fb5fb6-0557-48cd-880e-9704292c1a64	Certificado Diagnóstico Hidráulico CAT/JD	2027-10-15	MEC-CAT-3321	2026-08-19 15:59:09.33	2026-08-19 15:59:09.33
e46985ca-e58a-4a63-b21d-3d75a515e4af	bf551c0d-2cb7-4710-b1a9-b8a1a620eabd	Cédula Profesional Ing. Civil	Permanente	CED-CIV-8849102	2026-08-19 15:59:09.337	2026-08-19 15:59:09.337
\.


--
-- Data for Name: maquinas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maquinas (id, codigo, nombre, tipo, estado, combustible, horometro, operador_id, lat, lng, diesel_hoy, proximo_mantenimiento, imagen, consumo_esperado_lts_hora, rendimiento_actual_lts_hora, alerta_consumo_anormal, horas_operadas_hoy, activo, creado_en, actualizado_en) FROM stdin;
09094cfd-604b-47e8-bff0-61809f2a0f25	M001	Excavadora CAT 320	Excavadora	ENCENDIDA	65.00	1245.50	04674c25-10ab-4767-81c8-783ad8ac1872	19.432600	-99.133200	85.00	2026-05-20	\N	14.00	13.50	f	6.30	t	2026-08-19 15:59:09.343	2026-08-19 15:59:09.343
1aa6ce00-74d4-4689-bfce-f942918ed7b6	M002	Retroexcavadora JD 310L	Retroexcavadora	MANTENIMIENTO	42.00	890.20	f61c081a-b3f1-4a24-81a1-b038c4f9acb4	19.428400	-99.127600	45.00	2026-04-28	\N	9.50	9.20	f	4.80	t	2026-08-19 15:59:09.347	2026-08-19 15:59:09.347
84fcc37a-f923-473a-8ab9-3e647fa302d9	M003	Grúa Liebherr LTM	Grúa	APAGADA	88.00	456.80	\N	19.435000	-99.141200	0.00	2026-06-15	\N	16.00	15.80	f	0.00	t	2026-08-19 15:59:09.351	2026-08-19 15:59:09.351
f847681b-c679-4728-9fe2-a47fe1590745	M004	Camión Volteo Kenworth	Transporte	MOVIMIENTO	15.00	3421.10	681536f0-d5b0-4ac5-a417-688bc5700396	19.419000	-99.130000	200.00	2026-05-05	\N	12.00	23.50	t	8.50	t	2026-08-19 15:59:09.355	2026-08-19 15:59:09.355
\.


--
-- Data for Name: permisos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permisos (id, trabajador_id, tipo, fecha_inicio, fecha_fin, estado, motivo, dias_solicitados, activo, creado_en, actualizado_en, codigo) FROM stdin;
\.


--
-- Data for Name: proyectos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proyectos (id, codigo, nombre, cliente_id, presupuesto, gastado, progreso, estado, ubicacion, fecha_inicio, fecha_fin, ingreso_cobrado, gasto_nomina, gasto_combustible, gasto_mantenimiento, gasto_materiales, utilidad_real, margen_utilidad_porcentaje, activo, creado_en, actualizado_en) FROM stdin;
143ba85d-c020-4c84-8936-aef87b340808	P001	Fraccionamiento Valle Sur	874b9b94-bca3-4d55-89dd-b32ab2366afe	1200000.00	950000.00	85.00	EN_PROCESO	Querétaro, Qro.	2025-01-10	2025-05-30	1020000.00	380000.00	245000.00	110000.00	215000.00	70000.00	6.80	t	2026-08-19 15:59:09.365	2026-08-19 15:59:09.365
f4a7f05c-76dd-431e-a669-bfff70185774	P002	Remodelación Centro Histórico	dde17342-ac1d-4f50-8ec2-359e94421f25	4500000.00	1200000.00	32.00	EN_PROCESO	Centro, CDMX	2025-03-01	2025-12-15	1800000.00	520000.00	310000.00	90000.00	280000.00	600000.00	33.30	t	2026-08-19 15:59:09.374	2026-08-19 15:59:09.374
5e63cd99-7a8f-493d-b809-8dfd5cbad85f	P003	Puente Atizapán	ce086e14-e42f-487d-a929-319117f756b1	8900000.00	8900000.00	100.00	FINALIZADO	Atizapán, EdoMex	2024-06-15	2025-04-20	8900000.00	3400000.00	1850000.00	780000.00	1920000.00	950000.00	10.70	t	2026-08-19 15:59:09.381	2026-08-19 15:59:09.381
\.


--
-- Data for Name: registros_asistencia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros_asistencia (id, codigo, trabajador_id, fecha, hora_entrada, hora_salida, hora_marcaje_exacta, hora_salida_exacta, estado, ubicacion, lat_entrada, lng_entrada, lat_salida, lng_salida, salida_ubicacion, proyecto_id, obra_asignada, lat_obra, lng_obra, distancia_metros, radio_permitido_metros, en_sitio, precision_gps_metros, dispositivo, horas_trabajadas_ordinarias, salida_anticipada, motivo_salida_anticipada, bateria, notas, activo, creado_en, actualizado_en) FROM stdin;
d9568a65-7dbb-49c6-bfd0-32b00c5f5fe2	A001	04674c25-10ab-4767-81c8-783ad8ac1872	2025-04-27	07:05 AM	05:00 PM	07:04:48 AM	05:00:15 PM	PUNTUAL	Fracc. Valle Sur (Frente a Manzana 4)	19.342300	-99.184100	19.342500	-99.184000	Fracc. Valle Sur (Caseta de Salida)	143ba85d-c020-4c84-8936-aef87b340808	Fraccionamiento Valle Sur	19.342100	-99.184300	28.00	2000.00	t	6.00	Samsung Galaxy A54 · GPS Activo	8.00	f	\N	92	Marcaje verificado dentro del polígono de obra (radio 2km).	t	2026-08-19 15:59:09.473	2026-08-19 15:59:09.473
6955edb4-83cc-4309-9ff9-1971d7583783	A002	f61c081a-b3f1-4a24-81a1-b038c4f9acb4	2025-04-27	06:58 AM	04:30 PM	06:58:12 AM	04:30:20 PM	PUNTUAL	Centro Histórico (Acceso Calle Madero)	19.432800	-99.133000	19.432700	-99.133100	Centro Histórico (Salida Madero)	f4a7f05c-76dd-431e-a669-bfff70185774	Remodelación Centro Histórico	19.432600	-99.133200	35.00	2000.00	t	8.00	Xiaomi Redmi Note 12 · GPS Activo	8.50	f	\N	87	Marcaje verificado en punto de control de acceso.	t	2026-08-19 15:59:09.481	2026-08-19 15:59:09.481
35338600-b111-429d-9833-136e164ba2f2	A003	681536f0-d5b0-4ac5-a417-688bc5700396	2025-04-27	08:15 AM	\N	08:15:33 AM	\N	RETARDO	Av. Insurgentes Sur #1420 (Fuera de radio 2km)	19.378000	-99.172000	\N	\N	\N	143ba85d-c020-4c84-8936-aef87b340808	Fraccionamiento Valle Sur	19.342100	-99.184300	4210.00	2000.00	f	14.00	Motorola Moto G84 · GPS Activo	7.00	f	\N	48	ALERTA DE GEOCERCA: El marcaje se realizó a 4.2 km de distancia, superando el radio de 2 km de la obra.	t	2026-08-19 15:59:09.486	2026-08-19 15:59:09.486
518403eb-a415-4afe-bd45-0a76e07edd81	A004	1a5a6770-e8b5-474d-8f25-e700a82b7e89	2025-04-27	08:30 AM	02:15 PM	08:29:50 AM	02:15:40 PM	SALIDA_ANTICIPADA	Oficina Central SVR (Recepción)	19.410600	-99.167700	\N	\N	\N	\N	Oficina Central SVR	19.410500	-99.167800	15.00	500.00	t	4.00	iPhone 13 · iOS 17.4	5.75	t	Cita médica programada en clínica IMSS.	95	ALERTA: Retiro anticipado registrado con motivo médico.	t	2026-08-19 15:59:09.49	2026-08-19 15:59:09.49
\.


--
-- Data for Name: registros_criba; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros_criba (id, codigo, fecha, turno, operador_id, tipo_material, material_producido, horas_trabajadas, material_al_banco, observaciones, activo, creado_en, actualizado_en) FROM stdin;
b558c44e-8b0f-496c-a8eb-7f25c1e82286	CR001	2026-08-15	MATUTINO	681536f0-d5b0-4ac5-a417-688bc5700396	Criba fina	45.00	8.00	38.00	Operación normal	t	2026-08-19 15:59:09.619	2026-08-19 15:59:09.619
2eb49d7b-8a28-4eab-9e26-cbc3491953f2	CR002	2026-08-15	VESPERTINO	04674c25-10ab-4767-81c8-783ad8ac1872	Criba gruesa	30.00	7.00	25.00		t	2026-08-19 15:59:09.622	2026-08-19 15:59:09.622
6a1676c4-2f65-4939-a7db-d98644b33abb	CR003	2026-08-14	MATUTINO	681536f0-d5b0-4ac5-a417-688bc5700396	Criba fina	50.00	8.00	50.00	Producción completa al banco	t	2026-08-19 15:59:09.625	2026-08-19 15:59:09.625
3ef5f63f-6b55-47bf-85f2-d07aed2b75f1	CR004	2026-08-14	VESPERTINO	f61c081a-b3f1-4a24-81a1-b038c4f9acb4	Arena lavada	20.00	6.00	15.00	Paro por 2h - falla en faja	t	2026-08-19 15:59:09.628	2026-08-19 15:59:09.628
f7aa0b0e-4e7a-4264-b210-b7cf1e28e67d	CR005	2026-08-13	MATUTINO	681536f0-d5b0-4ac5-a417-688bc5700396	Criba fina	52.00	8.00	52.00		t	2026-08-19 15:59:09.631	2026-08-19 15:59:09.631
\.


--
-- Data for Name: registros_mantenimiento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros_mantenimiento (id, codigo, maquina_id, tipo, descripcion, fecha, horas_servicio, costo, proximo_servicio_horas, activo, creado_en, actualizado_en) FROM stdin;
19154e83-b1a2-4d74-93ee-ba8fb12a9ba1	S001	09094cfd-604b-47e8-bff0-61809f2a0f25	PREVENTIVO	Cambio de aceite y filtros de motor	2025-04-10	1200.00	5500.00	1450.00	t	2026-08-19 15:59:09.428	2026-08-19 15:59:09.428
02657186-0eb8-43d4-b62d-c5c79f7ac155	S002	1aa6ce00-74d4-4689-bfce-f942918ed7b6	CORRECTIVO	Reparación de manguera hidráulica	2025-04-20	880.00	2200.00	1100.00	t	2026-08-19 15:59:09.432	2026-08-19 15:59:09.432
\.


--
-- Data for Name: reportes_campo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reportes_campo (id, codigo, tipo, usuario, maquina_id, obra, fecha, hora, descripcion, estado, prioridad, detalles, activo, creado_en, actualizado_en) FROM stdin;
568ab12d-3b36-4a4a-bc5d-46da200b5de9	RC001	MECANICO	Ricardo M.	09094cfd-604b-47e8-bff0-61809f2a0f25	Valle Sur	2025-04-27	10:30 AM	Se completó reparación de cadena izquierda. Tensor ajustado.	PENDIENTE	\N	\N	t	2026-08-19 15:59:09.583	2026-08-19 15:59:09.583
ced9daf6-f314-445c-bd53-1812e20582dc	RC002	PIPERO	Marcos G.	f847681b-c679-4728-9fe2-a47fe1590745	Valle Sur	2025-04-27	02:15 PM	Suministro de 200L de diésel. Tanque lleno.	VISTO	\N	{"costo": 4600, "litros": 200}	t	2026-08-19 15:59:09.588	2026-08-19 15:59:09.588
02a6aa29-ceae-45cb-a4e5-7ba7d6b6ff55	RC003	OPERADOR	Juan P.	09094cfd-604b-47e8-bff0-61809f2a0f25	Valle Sur	2025-04-27	07:15 AM	Reporte matutino: Aceite OK, Agua OK, Diésel 65%. Listo para trabajar.	ATENDIDO	\N	\N	t	2026-08-19 15:59:09.591	2026-08-19 15:59:09.591
87ac79a1-67c2-45e9-b778-1bc9639c292c	RC004	INCIDENTE	Ricardo M.	09094cfd-604b-47e8-bff0-61809f2a0f25	Valle Sur	2025-04-27	11:00 AM	Se detectó fuga en manguera hidráulica principal. Equipo detenido hasta reparación.	EN_REVISION	ALTA	\N	t	2026-08-19 15:59:09.594	2026-08-19 15:59:09.594
cf1637ca-a48f-4f76-9c34-3a885efcaf7f	RC005	INCIDENTE	Ing. López	\N	Remodelación Centro	2025-04-26	03:00 PM	Lluvia intensa impidió colado de losa. Se reprograma para mañana.	RESUELTO	BAJA	\N	t	2026-08-19 15:59:09.596	2026-08-19 15:59:09.596
\.


--
-- Data for Name: trabajadores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trabajadores (id, codigo, nombre, puesto, categoria_puesto, estado, entrada, telefono, avatar, sueldo_fiscal, sueldo_efectivo, metodo_pago, estado_renta, cliente_renta_actual_id, fecha_contratacion, vacaciones_dias, horas_extra_semana, tarifa_hora_extra, descuentos_semana, concepto_descuento, activo, creado_en, actualizado_en) FROM stdin;
04674c25-10ab-4767-81c8-783ad8ac1872	T001	Juan Pérez	Operador de Excavadora	OPERADOR	ACTIVO	07:00 AM	55 1234 5678	JP	2500.00	3500.00	MIXTO	RENTADO_CLIENTE	874b9b94-bca3-4d55-89dd-b32ab2366afe	2023-03-15	8	6.50	80.00	0.00	\N	t	2026-08-19 15:59:09.29	2026-08-19 15:59:09.29
f61c081a-b3f1-4a24-81a1-b038c4f9acb4	T002	Pedro Gómez	Operador de Retroexcavadora	OPERADOR	ACTIVO	07:00 AM	55 8765 4321	PG	2200.00	3200.00	MIXTO	RENTADO_CLIENTE	dde17342-ac1d-4f50-8ec2-359e94421f25	2023-07-01	6	4.50	75.00	0.00	\N	t	2026-08-19 15:59:09.305	2026-08-19 15:59:09.305
1a5a6770-e8b5-474d-8f25-e700a82b7e89	T003	Ana Martínez	Administradora de Obra	ADMINISTRATIVO	ACTIVO	08:30 AM	55 2345 6789	AM	5000.00	2000.00	MIXTO	EN_OBRA_PROPIA	\N	2022-01-10	12	0.00	0.00	0.00	\N	t	2026-08-19 15:59:09.313	2026-08-19 15:59:09.313
681536f0-d5b0-4ac5-a417-688bc5700396	T004	Luis Torres	Chofer de Camión Volteo	CHOFER	ACTIVO	06:30 AM	55 3456 7890	LT	2000.00	2800.00	MIXTO	RENTADO_CLIENTE	6cfc8dc7-466c-44f5-a4da-0f39bed5e2ac	2023-11-20	6	0.00	65.00	0.00	\N	t	2026-08-19 15:59:09.321	2026-08-19 15:59:09.321
06fb5fb6-0557-48cd-880e-9704292c1a64	T005	Carlos Ruiz	Mecánico Diésel Especialista	MECANICO	ACTIVO	07:30 AM	55 4567 8901	CR	3000.00	4000.00	MIXTO	EN_OBRA_PROPIA	\N	2021-05-18	14	2.00	90.00	0.00	\N	t	2026-08-19 15:59:09.33	2026-08-19 15:59:09.33
bf551c0d-2cb7-4710-b1a9-b8a1a620eabd	T006	Ing. Jorge Valenzuela	Ingeniero Residente de Obra	INGENIERO	ACTIVO	07:00 AM	55 5678 9012	JV	6500.00	4500.00	MIXTO	EN_OBRA_PROPIA	\N	2020-02-01	15	0.00	0.00	0.00	\N	t	2026-08-19 15:59:09.337	2026-08-19 15:59:09.337
\.


--
-- Data for Name: trabajadores_proyectos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trabajadores_proyectos (trabajador_id, proyecto_id, asignado_en) FROM stdin;
04674c25-10ab-4767-81c8-783ad8ac1872	143ba85d-c020-4c84-8936-aef87b340808	2026-08-19 15:59:09.386
f61c081a-b3f1-4a24-81a1-b038c4f9acb4	f4a7f05c-76dd-431e-a669-bfff70185774	2026-08-19 15:59:09.389
681536f0-d5b0-4ac5-a417-688bc5700396	5e63cd99-7a8f-493d-b809-8dfd5cbad85f	2026-08-19 15:59:09.391
bf551c0d-2cb7-4710-b1a9-b8a1a620eabd	143ba85d-c020-4c84-8936-aef87b340808	2026-08-19 15:59:09.393
bf551c0d-2cb7-4710-b1a9-b8a1a620eabd	5e63cd99-7a8f-493d-b809-8dfd5cbad85f	2026-08-19 15:59:09.4
\.


--
-- Data for Name: transacciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transacciones (id, codigo, tipo, categoria, monto, fecha, descripcion, activo, creado_en, actualizado_en) FROM stdin;
45104fdb-d59f-430d-80b1-79481f4bfac5	TX001	EGRESO	Combustible	4600.00	2025-04-27	Carga diésel M004	t	2026-08-19 15:59:09.535	2026-08-19 15:59:09.535
8600a7b2-ac94-42fe-847a-1de1cffac78c	TX002	INGRESO	Pago Cliente	125000.00	2025-04-26	Anticipo Renta Excavadora	t	2026-08-19 15:59:09.538	2026-08-19 15:59:09.538
26fa4f22-ab44-40fd-b6f2-7df5b204bffa	TX003	EGRESO	Nómina	45000.00	2025-04-25	Pago semana 16 - Operadores	t	2026-08-19 15:59:09.541	2026-08-19 15:59:09.541
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


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
-- Name: documentos documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (id);


--
-- Name: firmas_cliente firmas_cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firmas_cliente
    ADD CONSTRAINT firmas_cliente_pkey PRIMARY KEY (id);


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
-- Name: maquinas maquinas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquinas
    ADD CONSTRAINT maquinas_pkey PRIMARY KEY (id);


--
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);


--
-- Name: proyectos proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id);


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
-- Name: apu_items_apu_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX apu_items_apu_template_id_idx ON public.apu_items USING btree (apu_template_id);


--
-- Name: apu_templates_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX apu_templates_codigo_key ON public.apu_templates USING btree (codigo);


--
-- Name: articulos_inventario_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX articulos_inventario_codigo_key ON public.articulos_inventario USING btree (codigo);


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
-- Name: documentos_categoria_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documentos_categoria_idx ON public.documentos USING btree (categoria);


--
-- Name: documentos_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX documentos_codigo_key ON public.documentos USING btree (codigo);


--
-- Name: documentos_trabajador_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documentos_trabajador_id_idx ON public.documentos USING btree (trabajador_id);


--
-- Name: firmas_cliente_bitacora_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX firmas_cliente_bitacora_id_key ON public.firmas_cliente USING btree (bitacora_id);


--
-- Name: hitos_progreso_proyecto_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hitos_progreso_proyecto_id_idx ON public.hitos_progreso USING btree (proyecto_id);


--
-- Name: horas_extra_asistencia_registro_asistencia_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX horas_extra_asistencia_registro_asistencia_id_key ON public.horas_extra_asistencia USING btree (registro_asistencia_id);


--
-- Name: incidentes_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX incidentes_codigo_key ON public.incidentes USING btree (codigo);


--
-- Name: incidentes_maquina_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX incidentes_maquina_id_idx ON public.incidentes USING btree (maquina_id);


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
-- Name: maquinas_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX maquinas_codigo_key ON public.maquinas USING btree (codigo);


--
-- Name: maquinas_operador_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maquinas_operador_id_idx ON public.maquinas USING btree (operador_id);


--
-- Name: permisos_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permisos_codigo_key ON public.permisos USING btree (codigo);


--
-- Name: permisos_trabajador_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX permisos_trabajador_id_idx ON public.permisos USING btree (trabajador_id);


--
-- Name: proyectos_cliente_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX proyectos_cliente_id_idx ON public.proyectos USING btree (cliente_id);


--
-- Name: proyectos_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX proyectos_codigo_key ON public.proyectos USING btree (codigo);


--
-- Name: registros_asistencia_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX registros_asistencia_codigo_key ON public.registros_asistencia USING btree (codigo);


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
-- Name: apu_items apu_items_apu_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apu_items
    ADD CONSTRAINT apu_items_apu_template_id_fkey FOREIGN KEY (apu_template_id) REFERENCES public.apu_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: despachos_maquina despachos_maquina_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despachos_maquina
    ADD CONSTRAINT despachos_maquina_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: documentos documentos_trabajador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_trabajador_id_fkey FOREIGN KEY (trabajador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: firmas_cliente firmas_cliente_bitacora_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firmas_cliente
    ADD CONSTRAINT firmas_cliente_bitacora_id_fkey FOREIGN KEY (bitacora_id) REFERENCES public.bitacoras_renta_diaria(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: lecturas_horometro lecturas_horometro_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecturas_horometro
    ADD CONSTRAINT lecturas_horometro_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: licencias_trabajador licencias_trabajador_trabajador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencias_trabajador
    ADD CONSTRAINT licencias_trabajador_trabajador_id_fkey FOREIGN KEY (trabajador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: maquinas maquinas_operador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maquinas
    ADD CONSTRAINT maquinas_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.trabajadores(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: registros_asistencia registros_asistencia_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_asistencia
    ADD CONSTRAINT registros_asistencia_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: reportes_campo reportes_campo_maquina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_campo
    ADD CONSTRAINT reportes_campo_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES public.maquinas(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- PostgreSQL database dump complete
--

\unrestrict 79QM1NNcoJtD4tYpbtLYhxNj6FShqR6ubO3Abc4j05Xd2NEykzFIs4m26FIUkIS

