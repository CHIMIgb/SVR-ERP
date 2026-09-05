"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  Truck,
  Timer,
  Wrench,
  Fuel,
  MapPin,
  ClipboardList,
  Package,
  HardHat,
  Building2,
  FileText,
  Banknote,
  FileBadge,
  ShieldAlert,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  ShoppingCart,
  CreditCard,
  Layers,
  X,
  Loader2,
  Shield,
  ReceiptText,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSidebar } from "./SidebarContext";
import { useAuth } from "@/hooks/useAuth";
import type { VistaAuth } from "@svr-erp/shared";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Clock,
  Truck,
  Timer,
  Wrench,
  Fuel,
  MapPin,
  ClipboardList,
  Package,
  HardHat,
  Building2,
  FileText,
  Banknote,
  FileBadge,
  ShieldAlert,
  AlertTriangle,
  BarChart3,
  Settings,
  ShoppingCart,
  CreditCard,
  Layers,
  ReceiptText,
};

interface RouteMeta {
  group: string;
  badge?: string;
  live?: boolean;
  warn?: string;
}

const ROUTE_META: Record<string, RouteMeta> = {
  "/dashboard": { group: "Principal" },
  "/trabajadores": { group: "Recursos Humanos", badge: "24" },
  "/asistencia": { group: "Recursos Humanos" },
  "/nomina": { group: "Recursos Humanos" },
  "/maquinaria": { group: "Maquinaria", live: true },
  "/horometro": { group: "Maquinaria" },
  "/mantenimiento": { group: "Maquinaria", warn: "3" },
  "/combustible": { group: "Maquinaria" },
  "/gps": { group: "Maquinaria", live: true },
  "/operaciones": { group: "Operaciones" },
  "/reportes-campo": { group: "Operaciones" },
  "/criba": { group: "Operaciones" },
  "/inventario": { group: "Operaciones" },
  "/proyectos": { group: "Operaciones" },
  "/incidentes": { group: "Operaciones" },
  "/clientes": { group: "Comercial" },
  "/cotizaciones": { group: "Comercial" },
  "/finanzas": { group: "Comercial" },
  "/proveedores": { group: "Comercial", badge: "NUEVO" },
  "/ventas": { group: "Comercial" },
  "/ventas/corte": { group: "Comercial" },
  "/cobranza": { group: "Comercial", badge: "NUEVO" },
  "/documentos": { group: "Sistema", warn: "2" },
  "/reportes": { group: "Sistema" },
  "/simulador-movil": { group: "Sistema", badge: "PROTOTIPO" },
  "/configuracion": { group: "Sistema" },
};

const GROUP_ORDER: Record<string, number> = {
  Principal: 0,
  "Recursos Humanos": 1,
  Maquinaria: 2,
  Operaciones: 3,
  Comercial: 4,
  Sistema: 5,
};

interface SidebarGroup {
  group: string;
  items: VistaAuth[];
}

function buildGroups(vistas: VistaAuth[]): SidebarGroup[] {
  const visible = vistas
    .filter((v) => v.puedeVer)
    .sort((a, b) => a.orden - b.orden);

  const grouped = new Map<string, VistaAuth[]>();

  visible.forEach((vista) => {
    const meta = ROUTE_META[vista.ruta];
    const group = meta?.group || "General";

    if (!grouped.has(group)) {
      grouped.set(group, []);
    }
    grouped.get(group)!.push(vista);
  });

  return Array.from(grouped.entries())
    .map(([group, items]) => ({ group, items }))
    .sort((a, b) => (GROUP_ORDER[a.group] ?? 99) - (GROUP_ORDER[b.group] ?? 99));
}

function SidebarItemLink({ item }: { item: VistaAuth }) {
  const pathname = usePathname();
  const meta = ROUTE_META[item.ruta];
  const Icon = iconMap[item.icono || ""] || Shield;
  const isActive = pathname === item.ruta;

  return (
    <Link
      href={item.ruta}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
        isActive
          ? "bg-primary text-white shadow-lg shadow-primary/25"
          : "text-slate-400 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-sm font-medium">{item.nombre}</span>
      {meta?.badge && (
        <span className="ml-auto bg-white/10 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {meta.badge}
        </span>
      )}
      {meta?.live && (
        <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50" />
      )}
      {meta?.warn && (
        <span className="ml-auto bg-yellow-500 text-secondary text-[10px] font-black px-2 py-0.5 rounded-full">
          {meta.warn}
        </span>
      )}
    </Link>
  );
}

function SidebarContent() {
  const { user, isInitialized, logout } = useAuth();
  const groups = React.useMemo(
    () => (user ? buildGroups(user.vistas) : []),
    [user],
  );

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-black text-xl italic shadow-lg shadow-primary/20">
            SVR
          </div>
          <div>
            <div className="font-bold text-lg leading-none">SVR</div>
            <div className="text-[10px] text-primary-light font-bold tracking-widest uppercase">
              Constructora
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none">
        {!isInitialized && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
          </div>
        )}

        {isInitialized && groups.length === 0 && (
          <div className="px-3 py-8 text-center">
            <Shield className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">
              No tienes vistas asignadas
            </p>
            <p className="text-[10px] text-slate-600 mt-1">
              Contacta al administrador
            </p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.group} className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              {group.group}
            </div>
            {group.items.map((item) => (
              <SidebarItemLink key={item.id} item={item} />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-semibold">Cerrar Sesión</span>
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const { mobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 bg-sidebar text-white z-50 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar — overlay when opened */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 md:hidden animate-[fadeIn_0.2s_ease-out]"
            onClick={closeMobile}
          />

          {/* Panel */}
          <aside className="fixed left-0 top-0 h-screen w-72 bg-sidebar text-white z-50 flex flex-col md:hidden animate-[slideInLeft_0.2s_ease-out]">
            {/* Close button */}
            <button
              onClick={closeMobile}
              className="absolute top-5 right-5 p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
