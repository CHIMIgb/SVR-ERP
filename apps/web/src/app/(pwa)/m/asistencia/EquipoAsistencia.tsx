"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Phone, RefreshCw, Users, CircleAlert } from "lucide-react";
import { asistenciaApi, type EquipoAsistenciaDTO } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatsCard } from "@/components/ui/StatsCard";
import { Tabs } from "@/components/ui/Tabs";
import {
  GRUPOS_FALTAN,
  GRUPOS_LLEGARON,
  clasificarMiembro,
  fechaLarga,
  iniciales,
  mensajeDeApi,
  type GrupoMiembro,
} from "@/lib/pwa/asistencia-propia";

/**
 * Asistencia del equipo (PWA, rol Residente). El equipo son las cuentas que tienen al usuario como jefe
 * (`users.jefe_user_id`, se arma en /equipos del escritorio): quien no tiene cuenta enlazada no aparece.
 * La API no devuelve sueldos; aquí solo se muestra contacto y estado del día.
 *
 * Sin selector de obra (a diferencia del diseño): el equipo va por persona, no por obra. Si el cliente
 * quiere ver a todos los de sus obras, el filtro cambia en la API (`findEquipo`).
 */

type Filtro = "todos" | "presentes" | "faltan";

type Carga =
  | { tipo: "cargando" }
  | { tipo: "ok"; datos: EquipoAsistenciaDTO }
  | { tipo: "error"; mensaje: string };

const COLOR_AVATAR: Record<GrupoMiembro, string> = {
  presente: "bg-success/10 text-success",
  tarde: "bg-warning/10 text-warning",
  falta: "bg-error/10 text-error",
  "sin-checar": "bg-warning/10 text-warning",
  pendiente: "bg-ui-100 text-ui-600",
  descanso: "bg-ui-100 text-ui-600",
  "sin-jornada": "bg-ui-100 text-ui-600",
};

export function EquipoAsistencia() {
  const [carga, setCarga] = useState<Carga>({ tipo: "cargando" });
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const solicitudRef = useRef(0);

  // Sin setState antes del await: el estado inicial ya es "cargando" (regla react-hooks/set-state-in-effect).
  const cargar = useCallback(async () => {
    const solicitud = ++solicitudRef.current;
    const res = await asistenciaApi.equipo();
    if (solicitud !== solicitudRef.current) return;
    if (res.success) setCarga({ tipo: "ok", datos: res.data });
    else setCarga({ tipo: "error", mensaje: mensajeDeApi(res.error, "No se pudo cargar la asistencia de tu equipo.") });
  }, []);

  useEffect(() => {
    (async () => {
      await cargar();
    })();
  }, [cargar]);

  const recargar = () => {
    setCarga({ tipo: "cargando" });
    void cargar();
  };

  const miembros = useMemo(
    () =>
      carga.tipo === "ok"
        ? carga.datos.miembros.map((m) => ({ ...m, estado: clasificarMiembro(m.dia, m.estadoTrabajador) }))
        : [],
    [carga],
  );

  if (carga.tipo === "cargando") {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton variant="card" />
        <Skeleton variant="row" />
        <Skeleton variant="row" />
      </div>
    );
  }

  if (carga.tipo === "error") {
    return (
      <EmptyState
        icon={<CircleAlert className="w-10 h-10" />}
        title="No se pudo cargar tu equipo"
        subtitle={carga.mensaje}
        action={
          <Button variant="primary" icon={<RefreshCw className="w-4 h-4" />} onClick={recargar}>
            Reintentar
          </Button>
        }
      />
    );
  }

  if (miembros.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-10 h-10" />}
        title="Aún no tienes trabajadores a tu cargo"
        subtitle="La oficina arma tu equipo en Equipos. Cuando te asigne trabajadores con cuenta, aparecerán aquí."
      />
    );
  }

  const llegaron = miembros.filter((m) => GRUPOS_LLEGARON.includes(m.estado.grupo));
  const faltan = miembros.filter((m) => GRUPOS_FALTAN.includes(m.estado.grupo));
  const tarde = miembros.filter((m) => m.estado.grupo === "tarde").length;
  const visibles = filtro === "presentes" ? llegaron : filtro === "faltan" ? faltan : miembros;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-ui-500 first-letter:uppercase">Hoy · {fechaLarga(new Date())}</p>
        <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={recargar}>
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatsCard label="Presentes" value={llegaron.length} hint={`de ${miembros.length}`} />
        <StatsCard label="Retardos" value={tarde} hint="llegaron tarde" />
        <StatsCard label="Faltan" value={faltan.length} hint="no han llegado" />
      </div>

      <Tabs
        ariaLabel="Filtrar equipo"
        value={filtro}
        onChange={(k) => setFiltro(k as Filtro)}
        tabs={[
          { key: "todos", label: "Todos", count: miembros.length },
          { key: "presentes", label: "Presentes", count: llegaron.length },
          { key: "faltan", label: "Faltan", count: faltan.length },
        ]}
      >
        {visibles.length === 0 ? (
          <p className="text-sm text-ui-500 text-center py-6">
            {filtro === "faltan" ? "Todo tu equipo ya llegó." : "Nadie ha llegado todavía."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visibles.map((m) => {
              const telefono = m.telefono?.replace(/[^\d+]/g, "") ?? "";
              const faltaLlegar = GRUPOS_FALTAN.includes(m.estado.grupo);
              return (
                <li
                  key={m.trabajadorId}
                  className="bg-surface border border-ui-200 rounded-2xl p-3 flex items-center gap-3"
                >
                  <span
                    className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center text-sm font-black shrink-0",
                      COLOR_AVATAR[m.estado.grupo],
                    )}
                    aria-hidden
                  >
                    {iniciales(m.nombre)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-ui-900 truncate">{m.nombre}</p>
                    <p className="text-xs text-ui-500 truncate">{m.puesto}</p>
                    <Badge variant={m.estado.variante} size="sm" className="mt-1">
                      {m.estado.etiqueta}
                    </Badge>
                  </div>
                  {telefono && (
                    <a
                      href={`tel:${telefono}`}
                      aria-label={`Llamar a ${m.nombre}`}
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        faltaLlegar
                          ? "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark"
                          : "bg-ui-100 text-ui-600 hover:bg-ui-200 active:bg-ui-200",
                      )}
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Tabs>
    </div>
  );
}
