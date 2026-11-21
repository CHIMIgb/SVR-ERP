"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Camera, LogOut, ClipboardCheck, ClipboardList, TriangleAlert, Phone, RefreshCw, UserX, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { asistenciaApi, reportesCampoApi, type EquipoAsistenciaDTO, type MiAsistenciaDTO } from "@/lib/api";
import { formatHora12 } from "@/lib/formatters";
import { guardarDatos, leerDatos } from "@/lib/pwa/datos-cache";
import { navDelRol } from "@/lib/pwa/rol-nav";
import {
  GRUPOS_FALTAN,
  GRUPOS_LLEGARON,
  clasificarMiembro,
  fechaLarga,
  mensajeDeApi,
  puedeVerEquipo,
  varianteEstado,
} from "@/lib/pwa/asistencia-propia";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatsCard } from "@/components/ui/StatsCard";
import { AvisoSinConexion } from "@/components/pwa/AvisoSinConexion";
import { PanelEmpresa, puedeVerPanelEmpresa } from "./PanelEmpresa";

/**
 * Inicio de la PWA (rebanada 2): saludo, estado de la asistencia de hoy, conteo de la semana y accesos
 * rápidos. Lo de asistencia es de todos los roles (la asistencia es universal); los bloques propios de cada
 * rol (equipo del residente, torre del técnico, caja del cobrador, KPIs del administrador) llegan en sus
 * rebanadas. Las acciones solo se muestran si el rol tiene esa vista (`navDelRol`, desde role_vistas).
 */

type Carga =
  | { tipo: "cargando" }
  | { tipo: "ok"; datos: MiAsistenciaDTO }
  | { tipo: "sin-enlace" }
  | { tipo: "error"; mensaje: string };

export default function InicioMovilPage() {
  const { user } = useAuth();
  const [carga, setCarga] = useState<Carga>({ tipo: "cargando" });
  const solicitudRef = useRef(0);
  const hoy = new Date();
  const rutas = new Set(navDelRol(user).map((r) => r.ruta));
  // Sin /m/asistencia en su menú (p. ej. el Administrador, como en el diseño) no se pide ni se muestra su asistencia.
  const conAsistencia = rutas.has("/m/asistencia");

  // Sin setState antes del await: el estado inicial ya es "cargando" (regla react-hooks/set-state-in-effect).
  const cargar = useCallback(async () => {
    const solicitud = ++solicitudRef.current;
    const res = await asistenciaApi.mia();
    if (solicitud !== solicitudRef.current) return;
    if (res.success) setCarga({ tipo: "ok", datos: res.data });
    else if (res.error.code === "NOT_FOUND") setCarga({ tipo: "sin-enlace" });
    else setCarga({ tipo: "error", mensaje: mensajeDeApi(res.error, "No se pudo cargar tu asistencia.") });
  }, []);

  useEffect(() => {
    if (!conAsistencia) return;
    (async () => {
      await cargar();
    })();
  }, [cargar, conAsistencia]);

  const reintentar = () => {
    setCarga({ tipo: "cargando" });
    void cargar();
  };

  const datos = carga.tipo === "ok" ? carga.datos : null;
  const nombre = (user?.persona?.nombre ?? "").split(" ").filter(Boolean)[0] ?? "";
  const iniciales = [user?.persona?.nombre, user?.persona?.apellidoPaterno]
    .map((p) => p?.trim()?.[0]?.toUpperCase())
    .filter(Boolean)
    .join("");
  const subtitulo = datos
    ? [
        datos.trabajador.puesto,
        datos.trabajador.entradaProgramada ? `Entrada ${formatHora12(datos.trabajador.entradaProgramada)}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : [user?.roles?.[0]?.nombre, conAsistencia ? null : fechaLarga(hoy)].filter(Boolean).join(" · ");
  const jefe = user?.jefe ?? null;
  const semana = datos?.semana ?? null;
  const esResidente = user?.roles?.some((r) => r.nombre === "Residente") ?? false;

  return (
    <section className="max-w-md mx-auto w-full flex flex-col gap-4 pb-2">
      <div className="flex items-center gap-3">
        <span className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-black shrink-0">
          {iniciales || "S"}
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-display font-bold text-ui-900 truncate">Hola{nombre ? `, ${nombre}` : ""}</h1>
          <p className="text-sm text-ui-500 truncate">{subtitulo}</p>
        </div>
      </div>

      {conAsistencia && (
        <TarjetaHoy carga={carga} hoy={hoy} puedeIrAAsistencia onReintentar={reintentar} />
      )}

      {conAsistencia && semana && (
        <div className="grid grid-cols-3 gap-2">
          <StatsCard label="Asistencias" value={semana.totalDiasAsistidos} hint="esta semana" />
          <StatsCard label="Retardos" value={semana.totalRetardos} hint="esta semana" />
          <StatsCard label="Faltas" value={semana.totalFaltas} hint="esta semana" />
        </div>
      )}

      {puedeVerPanelEmpresa(user) && <PanelEmpresa user={user} rutas={rutas} />}

      {(rutas.has("/m/reportes") || jefe) && (
        <div className="grid grid-cols-2 gap-2">
          {rutas.has("/m/reportes") && (
            <Link
              href="/m/reportes"
              className="bg-surface border border-ui-200 rounded-2xl p-4 flex flex-col gap-2 hover:bg-ui-50 active:bg-ui-100 transition-colors"
            >
              <span className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
                <TriangleAlert className="w-5 h-5" />
              </span>
              <span className="text-sm font-black text-ui-900 leading-tight">Reportar problema</span>
              <span className="text-xs text-ui-500">Avisa a tu técnico</span>
            </Link>
          )}
          {jefe && <AccesoEncargado nombre={jefe.nombre} telefono={jefe.telefono ?? null} />}
        </div>
      )}

      {puedeVerEquipo(user?.permisos) && (
        <EquipoHoy esResidente={user?.roles?.some((r) => r.nombre === "Residente") ?? false} />
      )}

      {esResidente && rutas.has("/m/reportes") && <ReportesResidente />}
    </section>
  );
}

type CargaEquipo =
  | { tipo: "cargando" }
  | { tipo: "ok"; datos: EquipoAsistenciaDTO }
  | { tipo: "error"; mensaje: string };

/** Stats de reportes_campo en la forma que comparte el snapshot de /m/reportes. */
interface StatsReportes {
  nuevos: number;
  enCurso: number;
  cerrados: number;
  criticos: number;
}

type CargaReportes =
  | { tipo: "cargando" }
  | { tipo: "ok"; datos: StatsReportes }
  | { tipo: "offline"; datos: StatsReportes; fecha: string }
  | { tipo: "error" };

/** "Reportes abiertos" + "Requieren tu atención" (Inicio del RESIDENTE).
 *  El ámbito lo resuelve el server (sus reportes + los de sus trabajadores
 *  vía jefe_user_id): aquí solo se muestran los números y el acceso. Sin
 *  señal sirve el snapshot que /m/reportes guarda con la MISMA clave. */
function ReportesResidente() {
  const { user } = useAuth();
  const userId = user?.id; // plano: el React Compiler no preserva deps con `user?.id`
  const [carga, setCarga] = useState<CargaReportes>({ tipo: "cargando" });

  const cargar = useCallback(async () => {
    try {
      const res = await reportesCampoApi.stats();
      if (res.success) {
        const stats: StatsReportes = {
          nuevos: res.data.nuevos,
          enCurso: res.data.enCurso,
          cerrados: res.data.cerrados,
          criticos: res.data.criticosActivos,
        };
        setCarga({ tipo: "ok", datos: stats });
        if (userId) guardarDatos(userId, "stats", stats);
      } else {
        setCarga({ tipo: "error" });
      }
    } catch {
      // Sin señal: el snapshot que /m/reportes guarda (misma clave y forma);
      // sin snapshot el bloque no existe (el reporte de error vive en su pantalla)
      const snapshot = userId ? leerDatos<StatsReportes>(userId, "stats") : null;
      setCarga(
        snapshot
          ? { tipo: "offline", datos: snapshot.datos, fecha: snapshot.fechaGuardada }
          : { tipo: "error" },
      );
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      await cargar();
    })();
  }, [cargar]);

  if (carga.tipo === "error") return null; // sin datos: el bloque no existe

  if (carga.tipo === "cargando") return <Skeleton variant="card" />;

  const d = carga.datos;
  const abiertos = d.nuevos + d.enCurso;
  const conCriticos = d.criticos > 0;

  return (
    <div className="flex flex-col gap-2">
      {carga.tipo === "offline" && <AvisoSinConexion fechaDatos={carga.fecha} />}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/m/reportes"
          className="bg-surface border border-ui-200 rounded-2xl p-4 flex flex-col gap-1.5 hover:bg-ui-50 active:bg-ui-100 transition-colors"
        >
          <span className="flex items-center gap-1.5 text-xs font-black text-ui-500 uppercase tracking-wide">
            <ClipboardList className="w-4 h-4 text-ui-400" aria-hidden />
            Reportes abiertos
          </span>
          <span className="text-3xl font-display font-black text-ui-900 leading-none">{abiertos}</span>
          <span className="text-xs text-ui-500">Nuevos + en curso de tu obra</span>
        </Link>
        <Link
          href="/m/reportes"
          className={`rounded-2xl p-4 flex flex-col gap-1.5 border transition-colors ${
            conCriticos
              ? "bg-red-50 border-red-200 hover:bg-red-100/70 active:bg-red-100"
              : "bg-surface border-ui-200 hover:bg-ui-50 active:bg-ui-100"
          }`}
        >
          <span
            className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wide ${
              conCriticos ? "text-red-700" : "text-ui-500"
            }`}
          >
            <TriangleAlert className={`w-4 h-4 ${conCriticos ? "text-red-600" : "text-ui-400"}`} aria-hidden />
            Requieren tu atención
          </span>
          <span
            className={`text-3xl font-display font-black leading-none ${
              conCriticos ? "text-red-700" : "text-ui-400"
            }`}
          >
            {d.criticos}
          </span>
          <span className={`text-xs ${conCriticos ? "text-red-600" : "text-ui-500"}`}>
            {conCriticos ? "Críticos sin cerrar" : "Sin críticos abiertos"}
          </span>
        </Link>
      </div>
    </div>
  );
}

/** "Mi equipo hoy" (Residente; también Administrador si tiene gente a su cargo). */
function EquipoHoy({ esResidente }: { esResidente: boolean }) {
  const [carga, setCarga] = useState<CargaEquipo>({ tipo: "cargando" });
  const solicitudRef = useRef(0);

  const cargar = useCallback(async () => {
    const solicitud = ++solicitudRef.current;
    const res = await asistenciaApi.equipo();
    if (solicitud !== solicitudRef.current) return;
    if (res.success) setCarga({ tipo: "ok", datos: res.data });
    else setCarga({ tipo: "error", mensaje: mensajeDeApi(res.error, "No se pudo cargar tu equipo.") });
  }, []);

  useEffect(() => {
    (async () => {
      await cargar();
    })();
  }, [cargar]);

  const miembros = carga.tipo === "ok" ? carga.datos.miembros : [];
  // El administrador sin gente a su cargo no ve el bloque; al residente se le explica por qué está vacío.
  if (carga.tipo === "ok" && miembros.length === 0 && !esResidente) return null;

  const grupos = miembros.map((m) => clasificarMiembro(m.dia, m.estadoTrabajador).grupo);
  const llegaron = grupos.filter((g) => GRUPOS_LLEGARON.includes(g)).length;
  const tarde = grupos.filter((g) => g === "tarde").length;
  const faltan = grupos.filter((g) => GRUPOS_FALTAN.includes(g)).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-black text-ui-900">Mi equipo hoy</h2>
        {miembros.length > 0 && (
          <Link href="/m/asistencia?vista=equipo" className="text-sm font-bold text-primary flex items-center gap-0.5">
            Ver lista
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {carga.tipo === "cargando" && <Skeleton variant="card" />}

      {carga.tipo === "error" && (
        <div className="bg-surface border border-ui-200 rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-sm text-error">{carga.mensaje}</p>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            className="self-start"
            onClick={() => {
              setCarga({ tipo: "cargando" });
              void cargar();
            }}
          >
            Reintentar
          </Button>
        </div>
      )}

      {carga.tipo === "ok" && miembros.length === 0 && (
        <p className="bg-surface border border-ui-200 rounded-2xl p-4 text-sm text-ui-500">
          Aún no tienes trabajadores a tu cargo. La oficina los asigna en Equipos.
        </p>
      )}

      {carga.tipo === "ok" && miembros.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <StatsCard label="Presentes" value={llegaron} hint={`de ${miembros.length}`} />
          <StatsCard label="Retardos" value={tarde} hint="llegaron tarde" />
          <StatsCard label="Faltan" value={faltan} hint="no han llegado" />
        </div>
      )}
    </div>
  );
}

function TarjetaHoy({
  carga,
  hoy,
  puedeIrAAsistencia,
  onReintentar,
}: {
  carga: Carga;
  hoy: Date;
  puedeIrAAsistencia: boolean;
  onReintentar: () => void;
}) {
  // Fondo oscuro a propósito (como en el diseño): se queda en slate en ambos temas.
  const marco = "rounded-2xl bg-slate-800 border border-slate-700 text-white p-4 flex flex-col gap-3";
  const fecha = (
    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Hoy · {fechaLarga(hoy)}</p>
  );

  if (carga.tipo === "cargando") {
    return (
      <div className={marco} aria-busy="true">
        {fecha}
        <Skeleton variant="title" className="bg-slate-700" />
        <Skeleton variant="text" className="bg-slate-700" />
      </div>
    );
  }

  if (carga.tipo === "sin-enlace") {
    return (
      <div className={marco}>
        {fecha}
        <p className="flex items-start gap-2 text-base font-bold">
          <UserX className="w-5 h-5 shrink-0 mt-0.5" />
          Tu cuenta aún no está enlazada a tu registro de trabajador.
        </p>
        <p className="text-sm text-slate-300">Pide a la oficina que la enlace para poder checar.</p>
      </div>
    );
  }

  if (carga.tipo === "error") {
    return (
      <div className={marco}>
        {fecha}
        <p className="text-base font-bold">No se pudo cargar tu asistencia</p>
        <p className="text-sm text-slate-300">{carga.mensaje}</p>
        <Button variant="secondary" size="md" icon={<RefreshCw className="w-4 h-4" />} onClick={onReintentar}>
          Reintentar
        </Button>
      </div>
    );
  }

  const { trabajador, registroHoy } = carga.datos;
  const turno = trabajador.entradaProgramada ? `Turno ${formatHora12(trabajador.entradaProgramada)}` : null;

  if (trabajador.estado !== "ACTIVO") {
    return (
      <div className={marco}>
        {fecha}
        <p className="text-xl font-display font-bold">
          {trabajador.estado === "VACACIONES" ? "Estás de vacaciones" : "Tu registro está dado de baja"}
        </p>
        <p className="text-sm text-slate-300">Mientras tanto no se registra asistencia.</p>
      </div>
    );
  }

  const sinEntrada = !registroHoy?.horaEntrada;
  const cerrada = Boolean(registroHoy?.horaSalida);
  const titulo = sinEntrada
    ? "Aún no registras tu entrada"
    : cerrada
      ? "Jornada cerrada"
      : `Entrada ${formatHora12(registroHoy?.horaEntrada ?? "")}`;
  const accion = sinEntrada
    ? { texto: "Registrar asistencia", icono: <Camera className="w-5 h-5" /> }
    : cerrada
      ? { texto: "Ver mi asistencia", icono: <ClipboardCheck className="w-5 h-5" /> }
      : { texto: "Registrar salida", icono: <LogOut className="w-5 h-5" /> };

  return (
    <div className={marco}>
      {fecha}
      <p className="text-xl font-display font-bold leading-tight">{titulo}</p>
      <div className="flex flex-wrap items-center gap-2">
        {turno && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-100">
            <Clock className="w-3.5 h-3.5" />
            {turno}
          </span>
        )}
        {registroHoy && !sinEntrada && (
          <Badge variant={varianteEstado(registroHoy.estado)} size="sm">
            {registroHoy.estado}
          </Badge>
        )}
      </div>
      {puedeIrAAsistencia && (
        <Link
          href="/m/asistencia?vista=mia"
          className="mt-1 h-12 rounded-xl bg-primary hover:bg-primary-dark active:bg-primary-dark text-white font-bold text-base flex items-center justify-center gap-2 transition-colors"
        >
          {accion.icono}
          {accion.texto}
        </Link>
      )}
    </div>
  );
}

function AccesoEncargado({ nombre, telefono }: { nombre: string; telefono: string | null }) {
  const contenido = (
    <>
      <span className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center">
        <Phone className="w-5 h-5" />
      </span>
      <span className="text-sm font-black text-ui-900 leading-tight">Llamar a mi encargado</span>
      <span className="text-xs text-ui-500 truncate">{telefono ? nombre : `${nombre} · sin teléfono`}</span>
    </>
  );
  const clase = "bg-surface border border-ui-200 rounded-2xl p-4 flex flex-col gap-2 min-w-0";
  if (!telefono) {
    return (
      <div className={clase} aria-disabled="true">
        {contenido}
      </div>
    );
  }
  return (
    <a href={`tel:${telefono.replace(/[^\d+]/g, "")}`} className={`${clase} hover:bg-ui-50 active:bg-ui-100 transition-colors`}>
      {contenido}
    </a>
  );
}
