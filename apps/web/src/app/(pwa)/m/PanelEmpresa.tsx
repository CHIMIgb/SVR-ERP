"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert, UserX, Wallet, CircleCheck, ChevronRight } from "lucide-react";
import type { ApiResponse, Maquina, UserAuth } from "@svr-erp/shared";
import {
  asistenciaApi,
  cobranzaApi,
  maquinasApi,
  reportesCampoApi,
  type AsistenciaSemanalDTO,
  type CobranzaStats,
  type ReportesCampoStats,
} from "@/lib/api";
import { fechaLocalHoy } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatsCard } from "@/components/ui/StatsCard";

/**
 * Panel de empresa del Inicio móvil (Administrador; también Administrativo cuando tenga vistas /m). Mismas
 * fuentes y permisos que el Dashboard de escritorio: cada bloque se muestra solo si el rol tiene esa vista de
 * escritorio (role_vistas) y cada fuente carga por separado, con su propio error y Reintentar.
 *
 * Del diseño quedan fuera, por falta de datos: "Ventas del mes" (no hay agregado mensual de ventas; se muestra
 * lo cobrado en el mes), "Documentos por vencer" (no hay API de documentos) y "Tanque de diésel" (no hay
 * modelo de tanque).
 */

type Fuente = "semanal" | "maquinas" | "cobranza" | "reportes";
type Estado<T> = { tipo: "cargando" } | { tipo: "ok"; datos: T } | { tipo: "error"; mensaje: string };

/** Vistas de escritorio que habilitan el panel (las mismas que usa el Dashboard). */
export function puedeVerPanelEmpresa(user: UserAuth | null): boolean {
  const ver = vistaDe(user);
  return ver("/asistencia") || ver("/maquinaria") || ver("/cobranza");
}

function vistaDe(user: UserAuth | null) {
  return (ruta: string) => (user?.vistas ?? []).some((v) => v.ruta === ruta && v.puedeVer);
}

/** "$340K", "$1.2M" como en el diseño (Intl en es-MX da "340.0 k$"). */
function monedaCompacta(n: number): string {
  const signo = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${signo}$${(a / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (a >= 1_000) return `${signo}$${Math.round(a / 1_000)}K`;
  return `${signo}$${Math.round(a).toLocaleString("es-MX")}`;
}

export function PanelEmpresa({ user, rutas }: { user: UserAuth | null; rutas: Set<string> }) {
  const ver = vistaDe(user);
  const verAsistencia = ver("/asistencia");
  const verMaquinas = ver("/maquinaria");
  const verCobranza = ver("/cobranza");
  const verReportes = ver("/reportes");

  const [semanal, setSemanal] = useState<Estado<AsistenciaSemanalDTO[]>>({ tipo: "cargando" });
  const [maquinas, setMaquinas] = useState<Estado<Maquina[]>>({ tipo: "cargando" });
  const [cobranza, setCobranza] = useState<Estado<CobranzaStats>>({ tipo: "cargando" });
  const [reportes, setReportes] = useState<Estado<ReportesCampoStats>>({ tipo: "cargando" });
  // Descarta respuestas viejas por fuente (Reintentar mientras la anterior sigue en vuelo).
  const secuencia = useRef<Partial<Record<Fuente, number>>>({});

  const cargarFuente = useCallback(
    async <T,>(fuente: Fuente, pedir: () => Promise<ApiResponse<T>>, guardar: (e: Estado<T>) => void) => {
      const n = (secuencia.current[fuente] ?? 0) + 1;
      secuencia.current[fuente] = n;
      const res = await pedir();
      if (secuencia.current[fuente] !== n) return;
      if (res.success) guardar({ tipo: "ok", datos: res.data });
      else guardar({ tipo: "error", mensaje: res.error.message || "No se pudo cargar." });
    },
    [],
  );

  const cargar = useCallback(
    (fuente: Fuente) => {
      switch (fuente) {
        case "semanal":
          return cargarFuente(fuente, () => asistenciaApi.semanal(), setSemanal);
        case "maquinas":
          return cargarFuente(fuente, maquinasApi.listar, setMaquinas);
        case "cobranza":
          return cargarFuente(fuente, cobranzaApi.stats, setCobranza);
        case "reportes":
          return cargarFuente(fuente, reportesCampoApi.stats, setReportes);
      }
    },
    [cargarFuente],
  );

  useEffect(() => {
    (async () => {
      await Promise.all([
        verAsistencia && cargar("semanal"),
        verMaquinas && cargar("maquinas"),
        verCobranza && cargar("cobranza"),
        verReportes && cargar("reportes"),
      ]);
    })();
  }, [cargar, verAsistencia, verMaquinas, verCobranza, verReportes]);

  const reintentar = (fuente: Fuente, poner: (e: { tipo: "cargando" }) => void) => {
    poner({ tipo: "cargando" });
    void cargar(fuente);
  };

  // ── Derivados ──
  const hoy = fechaLocalHoy();
  const diasHoy =
    semanal.tipo === "ok" ? semanal.datos.map((s) => s.dias.find((d) => d.fecha === hoy) ?? null) : [];
  const personalActivo = semanal.tipo === "ok" ? semanal.datos.length : 0;
  const conEntradaHoy = diasHoy.filter((d) => d?.horaEntrada).length;
  // La semana no distingue una falta ya resuelta por la oficina de una omisión vencida: se cuentan por estado.
  const faltasHoy = diasHoy.filter((d) => d?.estado === "Falta").length;
  const omisionesHoy = diasHoy.filter((d) => d?.estado === "Omisión").length;
  const flota =
    maquinas.tipo === "ok"
      ? {
          total: maquinas.datos.length,
          operando: maquinas.datos.filter((m) => m.estado === "Encendida" || m.estado === "Movimiento").length,
          mantenimiento: maquinas.datos.filter((m) => m.estado === "Mantenimiento").length,
        }
      : null;

  const alertas: { clave: string; icono: ReactNode; titulo: string; detalle: string; href?: string; tono: string }[] = [];
  if (reportes.tipo === "ok" && reportes.datos.criticosActivos > 0) {
    alertas.push({
      clave: "criticos",
      icono: <TriangleAlert className="w-5 h-5" />,
      titulo: `${reportes.datos.criticosActivos} reporte(s) crítico(s) sin cerrar`,
      detalle: "Reportes de campo",
      href: rutas.has("/m/reportes") ? "/m/reportes" : undefined,
      tono: "bg-error/10 text-error",
    });
  }
  if (reportes.tipo === "ok" && reportes.datos.nuevos > 0) {
    alertas.push({
      clave: "nuevos",
      icono: <TriangleAlert className="w-5 h-5" />,
      titulo: `${reportes.datos.nuevos} reporte(s) sin atender`,
      detalle: "Nadie los ha aceptado todavía",
      href: rutas.has("/m/reportes") ? "/m/reportes" : undefined,
      tono: "bg-warning/10 text-warning",
    });
  }
  if (semanal.tipo === "ok" && faltasHoy + omisionesHoy > 0) {
    alertas.push({
      clave: "faltas",
      icono: <UserX className="w-5 h-5" />,
      titulo: `Hoy: ${faltasHoy} falta(s) y ${omisionesHoy} omisión(es)`,
      detalle: "Se resuelven en el escritorio",
      tono: "bg-warning/10 text-warning",
    });
  }
  if (cobranza.tipo === "ok" && cobranza.datos.vencido > 0) {
    alertas.push({
      clave: "vencido",
      icono: <Wallet className="w-5 h-5" />,
      titulo: `${monedaCompacta(cobranza.datos.vencido)} de cobranza vencida`,
      detalle: `${cobranza.datos.clientesConSaldo} cliente(s) con saldo`,
      tono: "bg-error/10 text-error",
    });
  }
  const alertasCargando = [verReportes && reportes, verAsistencia && semanal, verCobranza && cobranza].some(
    (e) => e && e.tipo === "cargando",
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {verAsistencia && (
          <Kpi estado={semanal} onReintentar={() => reintentar("semanal", setSemanal)}>
            {() => (
              <StatsCard label="Personal activo" value={personalActivo} hint={`${conEntradaHoy} con asistencia hoy`} />
            )}
          </Kpi>
        )}
        {verMaquinas && (
          <Kpi estado={maquinas} onReintentar={() => reintentar("maquinas", setMaquinas)}>
            {() => (
              <StatsCard
                label="Flota operando"
                value={flota ? `${flota.operando}/${flota.total}` : "—"}
                hint={`${flota?.mantenimiento ?? 0} en mantenimiento`}
              />
            )}
          </Kpi>
        )}
        {verCobranza && (
          <Kpi estado={cobranza} onReintentar={() => reintentar("cobranza", setCobranza)}>
            {(d: CobranzaStats) => (
              <StatsCard
                label="Por cobrar"
                value={monedaCompacta(d.totalPorCobrar)}
                hint={`${d.clientesConSaldo} cliente(s)`}
              />
            )}
          </Kpi>
        )}
        {verCobranza && (
          <Kpi estado={cobranza} onReintentar={() => reintentar("cobranza", setCobranza)}>
            {(d: CobranzaStats) => (
              <StatsCard label="Cobrado del mes" value={monedaCompacta(d.cobradoMes)} hint="cobranza" />
            )}
          </Kpi>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-black text-ui-900">Alertas</h2>
        {alertasCargando && alertas.length === 0 ? (
          <Skeleton variant="row" />
        ) : alertas.length === 0 ? (
          <p className="bg-surface border border-ui-200 rounded-2xl p-4 text-sm text-ui-500 flex items-center gap-2">
            <CircleCheck className="w-5 h-5 text-success shrink-0" />
            Sin alertas por ahora.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {alertas.map((a) => {
              const contenido = (
                <>
                  <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", a.tono)}>
                    {a.icono}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-black text-ui-900">{a.titulo}</span>
                    <span className="block text-xs text-ui-500 truncate">{a.detalle}</span>
                  </span>
                  {a.href && <ChevronRight className="w-5 h-5 text-ui-400 shrink-0" />}
                </>
              );
              const clase = "bg-surface border border-ui-200 rounded-2xl p-3 flex items-center gap-3";
              return (
                <li key={a.clave}>
                  {a.href ? (
                    <Link href={a.href} className={cn(clase, "hover:bg-ui-50 active:bg-ui-100 transition-colors")}>
                      {contenido}
                    </Link>
                  ) : (
                    <div className={clase}>{contenido}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Tarjeta de una fuente: esqueleto mientras carga, error con Reintentar, o el contenido. */
function Kpi<T>({
  estado,
  onReintentar,
  children,
}: {
  estado: Estado<T>;
  onReintentar: () => void;
  children: (datos: T) => ReactNode;
}) {
  if (estado.tipo === "cargando") return <Skeleton variant="card" />;
  if (estado.tipo === "error") {
    return (
      <div className="bg-surface border border-ui-200 rounded-2xl p-4 flex flex-col gap-2 min-w-0">
        <p className="text-xs text-error line-clamp-3">{estado.mensaje}</p>
        <Button variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={onReintentar}>
          Reintentar
        </Button>
      </div>
    );
  }
  return <>{children(estado.datos)}</>;
}
