"use client";

import PantallaPlaceholder from "@/components/pwa/PantallaPlaceholder";
import { Truck } from "lucide-react";

/** Placeholder de la base (plan §8.5) — el módulo real llega con su fase. */
export default function FlotayobrasMovilPage() {
  return (
    <PantallaPlaceholder
      titulo="Flota y obras"
      subtitulo="La búsqueda de flota y obras con ubicación llega con su fase"
      icono={<Truck className="w-10 h-10" />}
    />
  );
}
