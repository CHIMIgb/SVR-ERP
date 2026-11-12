"use client";

import PantallaPlaceholder from "@/components/pwa/PantallaPlaceholder";
import { Phone } from "lucide-react";

/** Placeholder de la base (plan §8.5) — el módulo real llega con su fase. */
export default function ContactosMovilPage() {
  return (
    <PantallaPlaceholder
      titulo="Contactos"
      subtitulo="El directorio de contactos y la mesa de ayuda llegan con su fase"
      icono={<Phone className="w-10 h-10" />}
    />
  );
}
