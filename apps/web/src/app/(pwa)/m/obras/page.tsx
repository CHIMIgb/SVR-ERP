"use client";

import PantallaPlaceholder from "@/components/pwa/PantallaPlaceholder";
import { Building2 } from "lucide-react";

/** Placeholder de la base (plan §8.5) — el módulo real llega con su fase. */
export default function ObrasMovilPage() {
  return (
    <PantallaPlaceholder
      titulo="Obras"
      subtitulo="Tus obras con ubicación llegan con la fase de obras"
      icono={<Building2 className="w-10 h-10" />}
    />
  );
}
