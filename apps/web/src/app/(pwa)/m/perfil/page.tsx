"use client";

import PantallaPlaceholder from "@/components/pwa/PantallaPlaceholder";
import { User } from "lucide-react";

/** Placeholder de la base (plan §8.5) — el módulo real llega con su fase. */
export default function MiperfilMovilPage() {
  return (
    <PantallaPlaceholder
      titulo="Mi perfil"
      subtitulo="Tu perfil y documentos personales llegan con la fase de perfil"
      icono={<User className="w-10 h-10" />}
    />
  );
}
