"use client";

import { useEffect, useState } from "react";
import { contarPendientes } from "./offline";

/** Contador reactivo de la cola offline — alimenta el badge de la RoleNav. */
export function useCola(): number {
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    let vivo = true;
    const leer = () => {
      contarPendientes().then((n) => {
        if (vivo) setPendientes(n);
      });
    };
    leer();
    const intervalo = window.setInterval(leer, 30_000);
    window.addEventListener("online", leer);
    return () => {
      vivo = false;
      window.clearInterval(intervalo);
      window.removeEventListener("online", leer);
    };
  }, []);

  return pendientes;
}
