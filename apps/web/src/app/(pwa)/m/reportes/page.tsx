"use client";

import PantallaPlaceholder from "@/components/pwa/PantallaPlaceholder";
import { AlertTriangle } from "lucide-react";

/** Placeholder de la base (plan §8.5) — el módulo real llega con su fase. */
export default function ReportesMovilPage() {
  return (
    <PantallaPlaceholder
      titulo="Reportes"
      subtitulo="Tus reportes de campo llegan con la fase de reportes móvil"
      icono={<AlertTriangle className="w-10 h-10" />}
    />
  );
}
