"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Clock, Truck, Timer, Wrench, 
  Fuel, MapPin, ClipboardList, Package, HardHat, 
  Building2, FileText, Banknote, FileBadge, ShieldAlert, 
  BarChart3, Settings, LogOut,
  ShoppingCart, CreditCard, Layers, X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSidebar } from './SidebarContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  live?: boolean;
  warn?: string;
}

interface SidebarGroup {
  group: string;
  items: SidebarItem[];
}

const navItems: SidebarGroup[] = [
  { group: "Principal", items: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ]},
  { group: "Recursos Humanos", items: [
    { name: "Trabajadores", href: "/trabajadores", icon: Users, badge: "24" },
    { name: "Asistencia", href: "/asistencia", icon: Clock },
    { name: "Nómina", href: "/nomina", icon: Banknote },
  ]},
  { group: "Maquinaria", items: [
    { name: "Flota", href: "/maquinaria", icon: Truck, live: true },
    { name: "Horómetro", href: "/horometro", icon: Timer },
    { name: "Mantenimiento", href: "/mantenimiento", icon: Wrench, warn: "3" },
    { name: "Combustible", href: "/combustible", icon: Fuel },
    { name: "GPS", href: "/gps", icon: MapPin, live: true },
  ]},
  { group: "Operaciones", items: [
    { name: "Operaciones", href: "/operaciones", icon: ClipboardList },
    { name: "Reportes de Campo", href: "/reportes-campo", icon: ShieldAlert, warn: "1" },
    { name: "Criba", href: "/criba", icon: Layers },
    { name: "Inventario", href: "/inventario", icon: Package },
    { name: "Proyectos", href: "/proyectos", icon: HardHat },
  ]},
  { group: "Comercial", items: [
    { name: "Clientes", href: "/clientes", icon: Building2 },
    { name: "Cotizaciones", href: "/cotizaciones", icon: FileText },
    { name: "Finanzas", href: "/finanzas", icon: Banknote },
    { name: "Proveedores", href: "/proveedores", icon: Truck, badge: "NUEVO" },
    { name: "Punto de Venta", href: "/ventas", icon: ShoppingCart, badge: "NUEVO" },
    { name: "Cobranza", href: "/cobranza", icon: CreditCard, badge: "NUEVO" },
  ]},
  { group: "Sistema", items: [
    { name: "Documentación", href: "/documentos", icon: FileBadge, warn: "2" },
    { name: "Reportes", href: "/reportes", icon: BarChart3 },
    { name: "Simulador App", href: "/simulador-movil", icon: LayoutDashboard, badge: "PROTOTIPO" },
    { name: "Configuración", href: "/configuracion", icon: Settings },
  ]},
];

function SidebarContent() {
  const pathname = usePathname();

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
            <div className="text-[10px] text-primary-light font-bold tracking-widest uppercase">Constructora</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none">
        {navItems.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              {group.group}
            </div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                  pathname === item.href 
                    ? "bg-primary text-white shadow-lg shadow-primary/25" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-white/10 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {item.live && (
                  <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50" />
                )}
                {item.warn && (
                  <span className="ml-auto bg-yellow-500 text-secondary text-[10px] font-black px-2 py-0.5 rounded-full">
                    {item.warn}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
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
