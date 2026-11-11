"use client";

import PantallaPlaceholder from "@/components/pwa/PantallaPlaceholder";
import { Boxes } from "lucide-react";

/** Placeholder de la base (plan §8.5) — el módulo real llega con su fase. */
export default function InventarioMovilPage() {
  return (
    <PantallaPlaceholder
      titulo="Inventario"
      subtitulo="El inventario con tabs y stock llega con su fase"
      icono={<Boxes className="w-10 h-10" />}
    />
  );
}
