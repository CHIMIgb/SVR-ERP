"use client";

import PantallaPlaceholder from "@/components/pwa/PantallaPlaceholder";
import { LayoutGrid } from "lucide-react";

/** Placeholder de la base (plan §8.5) — el módulo real llega con su fase. */
export default function MdulosMovilPage() {
  return (
    <PantallaPlaceholder
      titulo="Módulos"
      subtitulo="El acceso a todos los módulos llega con su fase"
      icono={<LayoutGrid className="w-10 h-10" />}
    />
  );
}
