"use client";

import { use, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Tabs } from "@/components/ui/Tabs";
import { puedeVerEquipo } from "@/lib/pwa/asistencia-propia";
import { MiAsistencia } from "./MiAsistencia";
import { EquipoAsistencia } from "./EquipoAsistencia";

/**
 * /m/asistencia. Todos los roles checan su propia asistencia (es universal). Quien tiene equipo
 * (rrhh.mi_equipo:ver: Residente y Administrador) ve además la pestaña "Mi equipo", que abre por defecto
 * como en el diseño del residente. `?vista=mia` o `?vista=equipo` abre una pestaña directo (el Inicio la usa).
 */
type Vista = "equipo" | "mia";

export default function AsistenciaMovilPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string | string[] }>;
}) {
  const { user } = useAuth();
  const conEquipo = puedeVerEquipo(user?.permisos);
  const pedida = use(searchParams).vista;
  const [vista, setVista] = useState<Vista>(pedida === "mia" ? "mia" : "equipo");

  if (!conEquipo) {
    return (
      <section className="max-w-md mx-auto w-full flex flex-col gap-4 pb-2">
        <MiAsistencia />
      </section>
    );
  }

  return (
    <section className="max-w-md mx-auto w-full flex flex-col gap-4 pb-2">
      <Tabs
        ariaLabel="Asistencia"
        value={vista}
        onChange={(k) => setVista(k as Vista)}
        tabs={[
          { key: "equipo", label: "Mi equipo" },
          { key: "mia", label: "Mi asistencia" },
        ]}
      >
        {vista === "equipo" ? <EquipoAsistencia /> : <MiAsistencia />}
      </Tabs>
    </section>
  );
}
