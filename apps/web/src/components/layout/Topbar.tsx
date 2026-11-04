"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Mail, ShieldAlert, Check, Trash2, Clock,
  ExternalLink, CheckCheck, Search,
  Truck, HardHat, Users, FileText, Layers, X, Menu,
  Loader2
} from 'lucide-react';
import { useNotifications, Notification } from './NotificationContext';
import EmailPreviewModal from './EmailPreviewModal';
import { useSidebar } from './SidebarContext';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import { trabajadores, maquinaria, proyectos } from '@/lib/data';

const MODULOS = [
  { name: 'Dashboard', href: '/dashboard', icon: Layers, tag: 'Módulo' },
  { name: 'Trabajadores', href: '/trabajadores', icon: Users, tag: 'Módulo' },
  { name: 'Nómina', href: '/nomina', icon: FileText, tag: 'Módulo' },
  { name: 'Asistencia', href: '/asistencia', icon: Clock, tag: 'Módulo' },
  { name: 'Maquinaria', href: '/maquinaria', icon: Truck, tag: 'Módulo' },
  { name: 'Criba', href: '/criba', icon: Layers, tag: 'Módulo' },
  { name: 'Reportes de Campo', href: '/reportes-campo', icon: ShieldAlert, tag: 'Módulo' },
  { name: 'Documentación', href: '/documentos', icon: FileText, tag: 'Módulo' },
  { name: 'Proyectos', href: '/proyectos', icon: HardHat, tag: 'Módulo' },
  { name: 'Inventario', href: '/inventario', icon: FileText, tag: 'Módulo' },
  { name: 'Ventas', href: '/ventas', icon: FileText, tag: 'Módulo' },
  { name: 'Proveedores', href: '/proveedores', icon: Users, tag: 'Módulo' },
];

export default function Topbar() {
  const router = useRouter();
  const { openMobile } = useSidebar();
  const { user, isInitialized } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications 
  } = useNotifications();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // User dropdown
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    if (notif.tipo === 'correo') {
      setSelectedEmail(notif);
      setDropdownOpen(false);
    }
  };

  const handleSelectResult = (href: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    router.push(href);
  };

  // Search results
  const q = searchQuery.toLowerCase().trim();
  const matchedModulos = q ? MODULOS.filter(m => m.name.toLowerCase().includes(q)) : [];
  const matchedTrabajadores = q ? trabajadores.filter(t => t.nombre.toLowerCase().includes(q) || t.puesto.toLowerCase().includes(q)) : [];
  const matchedMaquinaria = q ? maquinaria.filter(m => m.nombre.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)) : [];
  const matchedProyectos = q ? proyectos.filter(p => p.nombre.toLowerCase().includes(q) || p.ubicacion.toLowerCase().includes(q)) : [];
  const hasResults = matchedModulos.length > 0 || matchedTrabajadores.length > 0 || matchedMaquinaria.length > 0 || matchedProyectos.length > 0;

  return (
    <header className="h-16 border-b border-ui-200 bg-surface fixed top-0 right-0 left-0 lg:left-72 z-40 px-4 md:px-8 flex items-center justify-between gap-4">
      
      {/* Hamburger — mobile only */}
      <button
        onClick={openMobile}
        className="lg:hidden p-2 hover:bg-ui-100 rounded-xl transition-colors text-ui-600"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Brand Title */}
      <div className="font-black text-ui-800 tracking-tight uppercase text-xs sm:text-sm shrink-0">
        SVR ERP <span className="text-ui-400 text-[10px] sm:text-xs font-bold font-sans lowercase">v2.0</span>
      </div>

      {/* Global Quick Search Bar */}
      <div className="relative flex-1 max-w-md hidden md:block" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ui-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Buscar módulo, empleado, máquina o proyecto..."
            className="w-full pl-10 pr-9 py-2 bg-ui-50 hover:bg-ui-100/80 focus:bg-surface border border-ui-200 focus:border-primary/50 rounded-xl text-xs font-medium focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ui-400 hover:text-ui-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchOpen && q.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-surface rounded-2xl shadow-2xl border border-ui-100 max-h-96 overflow-y-auto z-50 p-2 space-y-2 animate-[fadeScaleIn_0.12s_ease-out]">
            {!hasResults ? (
              <div className="p-4 text-center text-ui-400 text-xs font-bold">
                No se encontraron resultados para &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              <>
                {matchedModulos.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-ui-400 px-3 py-1">Módulos</p>
                    {matchedModulos.map(m => (
                      <button
                        key={m.name}
                        onClick={() => handleSelectResult(m.href)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-ui-50 transition-colors"
                      >
                        <div className="p-1.5 bg-ui-100 rounded-lg text-ui-700">
                          <m.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-ui-800">{m.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {matchedTrabajadores.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-ui-400 px-3 py-1">Personal</p>
                    {matchedTrabajadores.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleSelectResult('/trabajadores')}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-ui-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-secondary dark:bg-ui-200 text-white rounded-lg flex items-center justify-center font-black text-[10px]">
                            {t.avatar}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-ui-800">{t.nombre}</p>
                            <p className="text-[10px] text-ui-400 font-medium">{t.puesto}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">Trabajador</span>
                      </button>
                    ))}
                  </div>
                )}

                {matchedMaquinaria.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-ui-400 px-3 py-1">Maquinaria</p>
                    {matchedMaquinaria.map(m => (
                      <button
                        key={m.id}
                        onClick={() => handleSelectResult('/maquinaria')}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-ui-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg">
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-ui-800">{m.id} - {m.nombre}</p>
                            <p className="text-[10px] text-ui-400 font-medium">{m.operador}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black uppercase text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded">{m.estado}</span>
                      </button>
                    ))}
                  </div>
                )}

                {matchedProyectos.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-ui-400 px-3 py-1">Proyectos</p>
                    {matchedProyectos.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectResult('/proyectos')}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-ui-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                            <HardHat className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-ui-800">{p.nombre}</p>
                            <p className="text-[10px] text-ui-400 font-medium">{p.ubicacion}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">{p.estado}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 sm:gap-6">
        
        {/* ── TEMA (claro / oscuro / sistema) ── */}
        <ThemeToggle />

        {/* ── NOTIFICATIONS BELL ── */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-ui-50 text-ui-500 hover:bg-ui-100 hover:text-ui-900 transition-all relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Box */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-surface rounded-2xl shadow-2xl border border-ui-100 z-50 overflow-hidden animate-[fadeScaleIn_0.15s_ease-out]">
              
              {/* Dropdown Header */}
              <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wider">Centro de Alertas</h4>
                  <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">
                    {unreadCount} no leídas
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={markAllAsRead}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                    title="Marcar todo como leído"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={clearNotifications}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                    title="Limpiar todo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-ui-100 max-h-[320px] overflow-y-auto">
                {notifications.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                      n.leido ? 'bg-surface opacity-75' : 'bg-primary/5 hover:bg-primary/10'
                    }`}
                  >
                    {/* Icon base on type */}
                    <div className={`p-2 rounded-xl shrink-0 ${
                      n.tipo === 'alerta' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' :
                      n.tipo === 'correo' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                    }`}>
                      {n.tipo === 'alerta' && <ShieldAlert className="w-4.5 h-4.5" />}
                      {n.tipo === 'correo' && <Mail className="w-4.5 h-4.5" />}
                      {n.tipo === 'info' && <Check className="w-4.5 h-4.5" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between items-baseline gap-2">
                        <h5 className="text-xs font-black text-ui-800 leading-tight">
                          {n.titulo}
                        </h5>
                        <span className="text-[8px] font-bold text-ui-400 uppercase tracking-widest shrink-0">
                          {n.fecha}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-ui-500 leading-normal">
                        {n.mensaje}
                      </p>
                      {n.tipo === 'correo' && (
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/15 px-2 py-1 rounded transition-colors uppercase tracking-widest">
                            <Mail className="w-3 h-3" /> Ver Correo Enviado <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="py-12 text-center text-ui-400 font-bold text-xs flex flex-col items-center justify-center gap-2">
                    <Bell className="w-8 h-8 opacity-20" />
                    <span>Sin notificaciones</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── USER INFO (sin menú emergente: cerrar sesión vive en el sidebar) ── */}
        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-ui-200">
          <div className="text-right hidden sm:block">
            {!isInitialized ? (
              <>
                <div className="h-3.5 w-20 sm:w-24 bg-ui-200 rounded animate-pulse mb-1.5 ml-auto" />
                <div className="h-2.5 w-12 sm:w-16 bg-ui-200 rounded animate-pulse ml-auto" />
              </>
            ) : (
              <>
                <div className="text-[10px] sm:text-xs font-black text-ui-900 leading-none">
                  {user?.persona?.nombre || 'Usuario'}
                  {user?.persona?.apellidoPaterno
                    ? ` ${user.persona.apellidoPaterno}`
                    : ''}
                </div>
                <div className="text-[8px] sm:text-[9px] text-ui-500 font-bold tracking-widest uppercase mt-0.5 sm:mt-1">
                  {user?.roles?.find((r) => r.esPrincipal)?.nombre ||
                    user?.roles?.[0]?.nombre ||
                    'Sin rol'}
                </div>
              </>
            )}
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md">
            {!isInitialized ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {user?.persona?.nombre?.[0] || 'U'}
                {user?.persona?.apellidoPaterno?.[0] || ''}
              </>
            )}
          </div>
        </div>
        </div>

      </div>

      {/* Simulated Email Preview Modal */}
      {selectedEmail && (
        <EmailPreviewModal
          isOpen={!!selectedEmail}
          onClose={() => setSelectedEmail(null)}
          destinatario={selectedEmail.destinatario}
          asunto={selectedEmail.asunto}
          plantillaHtml={selectedEmail.plantillaHtml}
          fecha={selectedEmail.fecha}
        />
      )}

    </header>
  );
}

