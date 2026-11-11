"use client";

/**
 * Nav inferior por rol (plan §7b): arma las pestañas desde `user.vistas`
 * (las rutas /m/* registradas en la migración RBAC del paso 1) — PROHIBIDO
 * hardcodear el menú por rol en las pantallas.
 */
import type { UserAuth, VistaAuth } from "@svr-erp/shared";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  ClipboardCheck,
  AlertTriangle,
  CreditCard,
  Calculator,
  Truck,
  Boxes,
  Fuel,
  Building2,
  Phone,
  User,
  Wallet,
  LayoutGrid,
} from "lucide-react";

export interface RutaMovil {
  ruta: string;
  etiqueta: string;
  icono: LucideIcon;
}

/** Mapa ruta → etiqueta/ícono de las vistas móviles (complementa la BD). */
export const NAV_MOVIL: Record<string, { etiqueta: string; icono: LucideIcon }> = {
  "/m": { etiqueta: "Inicio", icono: Home },
  "/m/asistencia": { etiqueta: "Asistencia", icono: ClipboardCheck },
  "/m/reportes": { etiqueta: "Reportes", icono: AlertTriangle },
  "/m/contactos": { etiqueta: "Contactos", icono: Phone },
  "/m/perfil": { etiqueta: "Perfil", icono: User },
  "/m/obras": { etiqueta: "Obras", icono: Building2 },
  "/m/flota-obras": { etiqueta: "Flota/Obras", icono: Truck },
  "/m/inventario": { etiqueta: "Inventario", icono: Boxes },
  "/m/diesel": { etiqueta: "Diésel", icono: Fuel },
  "/m/pos": { etiqueta: "Cobro", icono: CreditCard },
  "/m/corte": { etiqueta: "Corte", icono: Calculator },
  "/m/finanzas": { etiqueta: "Finanzas", icono: Wallet },
  "/m/modulos": { etiqueta: "Módulos", icono: LayoutGrid },
};

/**
 * Pestañas del usuario: vistas /m/* con puedeVer, ordenadas por `orden`,
 * sin duplicados y con el Inicio siempre primero si existe.
 */
export function navDelRol(user: UserAuth | null): RutaMovil[] {
  const moviles = (user?.vistas ?? [])
    .filter(
      (v: VistaAuth) =>
        v.puedeVer && v.ruta.startsWith("/m") && NAV_MOVIL[v.ruta],
    )
    .sort((a, b) => a.orden - b.orden);

  const inicio = moviles.filter((v) => v.ruta === "/m");
  const resto = moviles.filter((v) => v.ruta !== "/m");

  return [...inicio, ...resto].map((v) => ({
    ruta: v.ruta,
    etiqueta: NAV_MOVIL[v.ruta].etiqueta,
    icono: NAV_MOVIL[v.ruta].icono,
  }));
}
