"use client";

import PantallaPlaceholder from "@/components/pwa/PantallaPlaceholder";
import { ClipboardCheck } from "lucide-react";

/** Placeholder de la base (plan §8.5) — el módulo real llega con su fase. */
export default function AsistenciaMovilPage() {
  return (
    <PantallaPlaceholder
      titulo="Asistencia"
      subtitulo="El marcaje con foto y GPS llega con el módulo de asistencia"
      icono={<ClipboardCheck className="w-10 h-10" />}
    />
  );
}
