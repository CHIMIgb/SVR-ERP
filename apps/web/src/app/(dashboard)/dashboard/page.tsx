"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Truck, Fuel, Banknote, TrendingUp, TrendingDown, 
  Clock, MapPin, ShieldAlert, AlertTriangle, Layers, Wrench,
  Compass, ChevronRight, Activity, ArrowUpRight, DollarSign,
  Calendar, CheckCircle2, ShieldCheck, Flame, Smartphone,
  Printer, Zap, Eye, Building2, HardHat, FileText
} from 'lucide-react';
import { useToast } from '@/components/layout/Toast';
import { 
  maquinaria, trabajadores, incidentes, registrosCriba, 
  proyectos, registrosAsistencia, cargasCombustible,
  checklistsPreoperacionales
} from '@/lib/data';

export default function DashboardPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

  // Selected work site in Satellite Radar
  const [selectedObraIndex, setSelectedObraIndex] = useState(0);

  // ── KPIs Calculados en Tiempo Real ──────────────────────────────────────────
  const maqActivas = maquinaria.filter(m => m.estado === 'Encendida' || m.estado === 'Movimiento').length;
  const maqTotal = maquinaria.length;
  const alertasOrdena = cargasCombustible.filter(c => c.alertaOrdena).length;
  
  const trabActivos = trabajadores.filter(t => t.estado === 'Activo').length;
  const asistenciasEnSitio = registrosAsistencia.filter(r => r.enSitio).length;
  const salidasAnticipadas = registrosAsistencia.filter(r => r.salidaAnticipada).length;
  const totalHorasExtras = registrosAsistencia.reduce((s, r) => s + (r.horasExtra?.horasCalculadas ?? 0), 0);

  const cribaHoyM3 = registrosCriba.reduce((s, r) => s + r.materialProducido, 0);
  const cribaValorEstimado = cribaHoyM3 * 340; // $340 MXN promedio por m3 triturado

  const presupuestoTotalObras = proyectos.reduce((s, p) => s + p.presupuesto, 0);
  const ingresoCobradoObras = proyectos.reduce((s, p) => s + (p.ingresoCobrado ?? p.presupuesto * 0.8), 0);
  const utilidadTotalObras = proyectos.reduce((s, p) => s + (p.utilidadReal ?? 100000), 0);
  const margenPromedio = ((utilidadTotalObras / Math.max(1, ingresoCobradoObras)) * 100).toFixed(1);

  const incidentesCriticos = incidentes.filter(i => i.estado !== 'Resuelto');
  const checklistFallas = checklistsPreoperacionales.filter(c => c.estado === 'Con Falla');

  const obraActiva = proyectos[selectedObraIndex] ?? proyectos[0];

  return (
    <div className="space-y-8">
      
      {/* ── 1. HEADER EJECUTIVO ULTRA-PREMIUM ── */}
      <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl overflow-hidden border border-slate-800">
        
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Operaciones al 98% de Capacidad
              </span>
              <span className="text-xs text-slate-400 font-bold">
                Semana 17 · SVR Constructora
              </span>
            </div>
            
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              Centro de Mando Ejecutivo
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl font-medium">
              Vigilancia en tiempo real de frentes de obra, telemetría de maquinaria, geocercas satelitales y rentabilidad financiera.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => router.push('/asistencia')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-white/10 backdrop-blur-md"
            >
              <Compass className="w-4 h-4 text-emerald-400" /> Asistencia GPS
            </button>
            <button
              onClick={() => router.push('/nomina')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-white/10 backdrop-blur-md"
            >
              <Banknote className="w-4 h-4 text-orange-400" /> Nómina y Sobres
            </button>
            <button
              onClick={() => router.push('/reportes-campo')}
              className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              <FileText className="w-4 h-4" /> Reportes de Campo
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. CUATRO PABELLONES VITALES DE LA EMPRESA ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* PABELLÓN 1: Flota & Telemetría Diésel */}
        <div 
          onClick={() => router.push('/maquinaria')}
          className="card group cursor-pointer hover:border-orange-300 transition-all border p-5 relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Flota &amp; Telemetría</p>
              <h3 className="text-2xl font-black text-slate-900">
                {maqActivas} <span className="text-sm font-bold text-slate-400">/ {maqTotal} activas</span>
              </h3>
            </div>
            <div className="w-11 h-11 bg-orange-50 text-primary rounded-2xl flex items-center justify-center border border-orange-200/60 group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            {alertasOrdena > 0 ? (
              <span className="text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-500" /> {alertasOrdena} alerta de ordeña
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Consumo diésel normal
              </span>
            )}
            <span className="text-slate-400 font-mono">14.2 L/hr prom.</span>
          </div>
        </div>

        {/* PABELLÓN 2: Asistencia Satelital & Personal */}
        <div 
          onClick={() => router.push('/asistencia')}
          className="card group cursor-pointer hover:border-blue-300 transition-all border p-5 relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Personal en Obra (GPS)</p>
              <h3 className="text-2xl font-black text-slate-900">
                {asistenciasEnSitio} <span className="text-sm font-bold text-slate-400">/ {trabActivos} en sitio</span>
              </h3>
            </div>
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-200/60 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-orange-600 flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-500" /> +{totalHorasExtras}h extras hoy
            </span>
            <span className="text-slate-400">Radio 2km OK</span>
          </div>
        </div>

        {/* PABELLÓN 3: Producción de Criba */}
        <div 
          onClick={() => router.push('/criba')}
          className="card group cursor-pointer hover:border-amber-300 transition-all border p-5 relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Producción Criba Hoy</p>
              <h3 className="text-2xl font-black text-slate-900">
                {cribaHoyM3.toLocaleString()} <span className="text-sm font-bold text-slate-400">m³</span>
              </h3>
            </div>
            <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-200/60 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-emerald-600">
              Valor: {fmt.format(cribaValorEstimado)}
            </span>
            <span className="text-slate-400">Grava y Arena</span>
          </div>
        </div>

        {/* PABELLÓN 4: Rentabilidad & Cobranza */}
        <div 
          onClick={() => router.push('/proyectos')}
          className="card group cursor-pointer hover:border-emerald-300 transition-all border p-5 relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/30"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Rentabilidad Obras</p>
              <h3 className="text-2xl font-black text-slate-900">
                +{margenPromedio}% <span className="text-xs font-bold text-emerald-600">margen</span>
              </h3>
            </div>
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-200 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-slate-600">Cobrado: {fmt.format(ingresoCobradoObras)}</span>
            <span className="text-emerald-700 font-mono">3 Obras</span>
          </div>
        </div>

      </div>

      {/* ── 3. MATRIZ OPERATIVA (2 COLUMNAS: 65% / 35%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA (65%): Radar Satelital & Obras Vivas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* RADAR SATELITAL DE FLOTA Y FRENTES DE OBRA */}
          <div className="card p-0 overflow-hidden border border-slate-200 shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-base">Radar Satelital de Frentes de Obra y Flota</h3>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    GPS En Vivo
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Monitoreo geográfico con polígono de tolerancia de 2 km a la redonda por proyecto.
                </p>
              </div>

              {/* Work site tabs selector */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {proyectos.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedObraIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      selectedObraIndex === idx 
                        ? 'bg-slate-900 text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {p.nombre.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Topographic Visual Map Canvas */}
            <div className="h-72 w-full bg-slate-950 relative overflow-hidden flex items-center justify-center select-none group">
              
              {/* Radar circular sweep grid */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)`,
                  backgroundSize: '28px 28px'
                }}
              />

              {/* Highway / Contour lines */}
              <svg className="absolute inset-0 w-full h-full opacity-25 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <path d="M -50 140 Q 200 80 400 200 T 800 120" fill="none" stroke="#64748b" strokeWidth="8" />
                <path d="M 300 0 L 300 350" fill="none" stroke="#64748b" strokeWidth="6" />
                <path d="M 550 0 L 550 350" fill="none" stroke="#64748b" strokeWidth="4" strokeDasharray="6 6" />
              </svg>

              {/* 2km Geofence Area Zone */}
              <div 
                className="absolute rounded-full border-2 border-emerald-400/80 bg-emerald-500/10 backdrop-blur-[1px] flex items-center justify-center transition-all animate-pulse"
                style={{
                  width: '260px',
                  height: '260px',
                  top: 'calc(50% - 130px)',
                  left: 'calc(50% - 130px)',
                }}
              >
                <span className="text-[8px] font-black uppercase text-emerald-300 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Geocerca Obra (2 km radio)
                </span>
              </div>

              {/* Project Center Anchor */}
              <div 
                className="absolute flex flex-col items-center z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ top: '50%', left: '50%' }}
              >
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl shadow-xl flex items-center justify-center border-2 border-white ring-4 ring-emerald-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="mt-1.5 bg-slate-900/95 text-white text-[9px] font-black px-2.5 py-0.5 rounded-md border border-slate-700 whitespace-nowrap shadow-lg">
                  {obraActiva.nombre}
                </div>
              </div>

              {/* Machinery Pin 1 (CAT 320) */}
              <div 
                className="absolute flex flex-col items-center z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
                style={{ top: '38%', left: '42%' }}
                onClick={() => router.push('/maquinaria')}
              >
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xs font-black shadow-lg border-2 border-white">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="mt-1 text-[8px] font-black bg-slate-900/90 text-orange-300 px-1.5 py-0.5 rounded border border-orange-500/40 whitespace-nowrap">
                  M001 · CAT 320 (65%)
                </span>
              </div>

              {/* Machinery Pin 2 (Volteo Kenworth con Alerta) */}
              <div 
                className="absolute flex flex-col items-center z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
                style={{ top: '68%', left: '58%' }}
                onClick={() => router.push('/combustible')}
              >
                <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center text-xs font-black shadow-lg border-2 border-white animate-bounce">
                  <Fuel className="w-4 h-4" />
                </div>
                <span className="mt-1 text-[8px] font-black bg-red-950 text-red-300 px-1.5 py-0.5 rounded border border-red-500 whitespace-nowrap">
                  M004 · ⚠️ Alerta Ordeña
                </span>
              </div>

              {/* Worker Pin */}
              <div 
                className="absolute flex flex-col items-center z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
                style={{ top: '48%', left: '57%' }}
                onClick={() => router.push('/asistencia')}
              >
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-lg border border-white">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="mt-1 text-[8px] font-black bg-slate-900/90 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/40 whitespace-nowrap">
                  📱 Cuadrilla 1 (6 ops)
                </span>
              </div>

              {/* Bottom HUD Bar */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between bg-slate-950/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-[10px] font-bold text-slate-300 z-30">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {obraActiva.ubicacion} · Cliente: <strong className="text-white">{obraActiva.cliente}</strong>
                </span>
                <span className="text-emerald-400 font-mono font-black">
                  Progreso Físico: {obraActiva.progreso}%
                </span>
              </div>
            </div>
          </div>

          {/* MATRIZ DE RENTABILIDAD Y AVANCE DE OBRAS */}
          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Rendimiento Financiero por Proyecto</h3>
                <p className="text-xs text-slate-400 font-medium">Comparativa de avance físico vs costos reales incurridos.</p>
              </div>
              <button 
                onClick={() => router.push('/proyectos')}
                className="text-xs font-black text-primary hover:underline flex items-center gap-1"
              >
                Ver Todas las Obras <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {proyectos.map((p) => {
                const margen = p.margenUtilidadPorcentaje ?? 15;
                return (
                  <div 
                    key={p.id}
                    onClick={() => router.push('/proyectos')}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                          {p.id}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm group-hover:text-primary transition-colors">
                            {p.nombre}
                          </h4>
                          <p className="text-[11px] font-bold text-slate-400">{p.cliente} · {p.ubicacion}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          margen >= 20 ? 'bg-emerald-100 text-emerald-800' :
                          margen > 0 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          Margen: +{margen}%
                        </span>
                        <span className="text-xs font-black text-slate-900">{fmt.format(p.presupuesto)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Avance Físico: <strong className="text-slate-800">{p.progreso}%</strong></span>
                        <span>Gastado Real: <strong className="text-slate-800">{fmt.format(p.gastado)}</strong></span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-1000"
                          style={{ width: `${p.progreso}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA (35%): Feed de Alertas & Accesos Rápidos */}
        <div className="space-y-6">
          
          {/* FEED DE ALERTAS CRÍTICAS */}
          <div className="card p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Alertas Operativas ({alertasOrdena + incidentesCriticos.length + salidasAnticipadas})
              </h3>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>

            <div className="space-y-3">
              
              {/* Alerta de Ordeña Diésel */}
              {alertasOrdena > 0 && (
                <div 
                  onClick={() => router.push('/combustible')}
                  className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-950 space-y-1 cursor-pointer hover:bg-red-100/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-red-700 flex items-center gap-1">
                      <Fuel className="w-3 h-3 text-red-600" /> Telemetría Diésel
                    </span>
                    <span className="text-[9px] font-mono font-bold text-red-600">Hoy</span>
                  </div>
                  <p className="text-xs font-black text-red-900">
                    Posible ordeña en Volteo Kenworth (M004)
                  </p>
                  <p className="text-[11px] text-red-700 font-medium">
                    Consumo anormal de 23.5 L/hr (+96% vs estándar).
                  </p>
                </div>
              )}

              {/* Alerta de Salida Anticipada */}
              {salidasAnticipadas > 0 && (
                <div 
                  onClick={() => router.push('/asistencia')}
                  className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1 cursor-pointer hover:bg-amber-100/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-amber-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> Asistencia Satelital
                    </span>
                    <span className="text-[9px] font-mono font-bold text-amber-700">02:15 PM</span>
                  </div>
                  <p className="text-xs font-black text-amber-900">
                    Salida Anticipada: Ana Martínez
                  </p>
                  <p className="text-[11px] text-amber-800 font-medium">
                    Retiro anticipado (5.75h). Motivo: Cita médica IMSS.
                  </p>
                </div>
              )}

              {/* Alerta de Checklist Pre-operacional con Falla */}
              {checklistFallas.length > 0 && (
                <div 
                  onClick={() => router.push('/maquinaria')}
                  className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 space-y-1 cursor-pointer hover:bg-orange-100/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-orange-800 flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-orange-600" /> Checklist Pre-operacional
                    </span>
                    <span className="text-[9px] font-mono font-bold text-orange-700">07:10 AM</span>
                  </div>
                  <p className="text-xs font-black text-orange-900">
                    Goteo hidráulico en Retro JD 310L
                  </p>
                  <p className="text-[11px] text-orange-800 font-medium">
                    Operador reportó fuga en cilindro de levante.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* ACCESOS RÁPIDOS DEL DIRECTOR */}
          <div className="card p-6 space-y-3 bg-slate-900 text-white border-none shadow-xl shadow-slate-900/10">
            <h3 className="font-black text-white/70 text-xs uppercase tracking-widest border-b border-white/10 pb-2">
              Acciones Rápidas
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => router.push('/nomina')}
                className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-between transition-all border border-white/5 group"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" /> Sincronizar Asistencia a Nómina
                </span>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={() => router.push('/nomina')}
                className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-between transition-all border border-white/5 group"
              >
                <span className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-orange-400" /> Imprimir Sobres de Efectivo
                </span>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={() => router.push('/maquinaria')}
                className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-between transition-all border border-white/5 group"
              >
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-400" /> Despachar Maquinaria a Obra
                </span>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={() => router.push('/criba')}
                className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-between transition-all border border-white/5 group"
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" /> Registro Producción de Criba
                </span>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
