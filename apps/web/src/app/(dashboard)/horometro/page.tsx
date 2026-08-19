"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Timer, ArrowUpRight, ArrowDownRight, Search, Filter, 
  Calendar, Plus, Gauge, DollarSign, Wrench, ShieldCheck,
  AlertTriangle, Truck, User, Building2, ChevronRight,
  Printer, CheckCircle2, Clock, Activity, Zap
} from 'lucide-react';
import { 
  lecturasHorometro as initialLecturas, 
  maquinaria, 
  proyectos 
} from '@/lib/data';
import Modal, { ModalField, inputClass, selectClass } from '@/components/layout/Modal';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';

export default function HorometroPage() {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const router = useRouter();
  const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  // State
  const [lecturas, setLecturas] = useState(initialLecturas);
  const [activeTab, setActiveTab] = useState<'hoy' | 'historial' | 'ciclos'>('hoy');
  const [search, setSearch] = useState('');
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('Todas');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    maquinaId: maquinaria[0]?.id ?? 'M001',
    fecha: new Date().toISOString().split('T')[0],
    lecturaInicial: '1240.0',
    lecturaFinal: '1248.5',
    operador: 'Juan Pérez',
    cliente: 'Inmobiliaria ARCO',
    obra: 'Fraccionamiento Valle Sur',
    tarifaHora: '1450',
    notas: 'Jornada ordinaria de excavación y carga.'
  });

  // Rates by machine type for billing
  const getTarifaHora = (maquinaId: string) => {
    switch (maquinaId) {
      case 'M001': return 1450; // CAT 320
      case 'M002': return 950;  // Retro JD 310L
      case 'M003': return 1800; // Grúa Grove
      case 'M004': return 850;  // Kenworth Volteo
      default: return 1000;
    }
  };

  // Calculations
  const totalHorasHoy = lecturas.reduce((s, h) => s + h.horasTrabajadas, 0);
  const totalImporteHoy = lecturas.reduce((s, h) => s + (h.horasTrabajadas * getTarifaHora(h.maquinaId)), 0);

  // Filtered readings
  const filteredLecturas = lecturas.filter(h => {
    const maq = maquinaria.find(m => m.id === h.maquinaId);
    const matchSearch = 
      h.maquinaId.toLowerCase().includes(search.toLowerCase()) ||
      (maq?.nombre && maq.nombre.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;
    if (selectedMachineFilter !== 'Todas' && h.maquinaId !== selectedMachineFilter) return false;
    return true;
  });

  // Submit New Reading
  const handleSubmit = () => {
    const lIni = parseFloat(form.lecturaInicial) || 0;
    const lFin = parseFloat(form.lecturaFinal) || 0;

    if (lFin < lIni) {
      showToast('Error: La lectura final no puede ser menor a la lectura inicial.', 'error');
      return;
    }

    const hrs = +(lFin - lIni).toFixed(1);
    const tarifa = parseFloat(form.tarifaHora) || getTarifaHora(form.maquinaId);
    const importe = hrs * tarifa;

    const nuevaLectura = {
      id: `H${Date.now()}`,
      maquinaId: form.maquinaId,
      fecha: form.fecha,
      lecturaInicial: lIni,
      lecturaFinal: lFin,
      horasTrabajadas: hrs
    };

    setLecturas(prev => [nuevaLectura, ...prev]);
    setModalOpen(false);

    showToast(`✅ Lectura registrada: ${form.maquinaId} (+${hrs} hrs = ${fmt.format(importe)} facturables).`, 'success');
    addNotification({
      titulo: `⏱️ Horómetro Registrado: ${form.maquinaId}`,
      mensaje: `Lectura ${lIni} ➔ ${lFin} (+${hrs} hrs). Valor facturable: ${fmt.format(importe)}.`,
      tipo: 'info'
    });
  };

  return (
    <div className="space-y-8">
      
      {/* ── 1. HEADER EJECUTIVO ULTRA-PREMIUM ── */}
      <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl overflow-hidden border border-slate-800">
        
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Telemetría de Horómetros en Vivo
              </span>
              <span className="text-xs text-slate-400 font-bold">
                Hoy: <strong className="text-emerald-400">{totalHorasHoy} hrs operadas</strong> · {fmt.format(totalImporteHoy)} facturables
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              Control y Telemetría de Horómetros
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl font-medium">
              Seguimiento exacto de horas máquina trabajadas, cálculo automático de cobro en renta y programación de servicios preventivos.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => router.push('/maquinaria')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-white/10 backdrop-blur-md"
            >
              <Truck className="w-4 h-4 text-orange-400" /> Ver Flota
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="btn-primary flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> + Nueva Lectura
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. PABELLONES DE MÉTRICAS CLAVE (KPIS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Horas Totales del Día */}
        <div className="card group hover:border-orange-300 transition-all border p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Horas Operadas Hoy</p>
              <h3 className="text-2xl font-black text-slate-900">
                {totalHorasHoy} <span className="text-sm font-bold text-slate-400">HRS</span>
              </h3>
            </div>
            <div className="w-11 h-11 bg-orange-50 text-primary rounded-2xl flex items-center justify-center border border-orange-200/60 group-hover:scale-110 transition-transform">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-emerald-600 font-mono">4 Equipos en Operación</span>
            <span className="text-slate-400">Promedio 8.1h/máq</span>
          </div>
        </div>

        {/* Importe Generado en Renta */}
        <div className="card group hover:border-emerald-300 transition-all border p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Facturable en Renta Hoy</p>
              <h3 className="text-2xl font-black text-emerald-700">
                {fmt.format(totalImporteHoy)}
              </h3>
            </div>
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-200/60 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-emerald-700">Soporte con Bitácora</span>
            <span className="text-slate-400">Listo para Cobro</span>
          </div>
        </div>

        {/* Próximo Servicio en Horómetro */}
        <div className="card group hover:border-purple-300 transition-all border p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Próx. Servicio (Horómetro)</p>
              <h3 className="text-2xl font-black text-slate-900">En 10 hrs</h3>
            </div>
            <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-200/60 group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-purple-700">CAT 320 @ 1,250 hrs</span>
            <span className="text-slate-400">Aceite &amp; Filtros</span>
          </div>
        </div>

        {/* Utilización de Flota */}
        <div className="card group hover:border-blue-300 transition-all border p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Índice de Utilización</p>
              <h3 className="text-2xl font-black text-slate-900">96.5%</h3>
            </div>
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-200/60 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-blue-700">0 Equipos Parados</span>
            <span className="text-slate-400">Alta Productividad</span>
          </div>
        </div>

      </div>

      {/* ── 3. PESTAÑAS DE CONTROL OPERATIVO ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('hoy')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'hoy'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Gauge className="w-4 h-4" /> Lecturas de Hoy ({lecturas.length})
        </button>

        <button
          onClick={() => setActiveTab('historial')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'historial'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-500" /> Historial de Horómetros &amp; Cobranza
        </button>

        <button
          onClick={() => setActiveTab('ciclos')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'ciclos'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Wrench className="w-4 h-4 text-purple-500" /> Ciclos Preventivos (250h / 500h / 1000h)
        </button>
      </div>

      {/* ── VISTA 1: LECTURAS DE HOY & TACÓMETROS DIGITALES ── */}
      {activeTab === 'hoy' && (
        <div className="space-y-6">
          
          {/* Machine Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedMachineFilter('Todas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedMachineFilter === 'Todas'
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Todas ({maquinaria.length})
              </button>
              {maquinaria.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMachineFilter(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    selectedMachineFilter === m.id
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m.id}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar máquina..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary/50 w-60 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLecturas.map(h => {
              const maq = maquinaria.find(m => m.id === h.maquinaId);
              const tarifa = getTarifaHora(h.maquinaId);
              const importe = h.horasTrabajadas * tarifa;

              return (
                <div 
                  key={h.id} 
                  className="card p-6 space-y-4 border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all relative overflow-hidden bg-white"
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-md">
                        {h.maquinaId}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">{maq?.nombre}</h4>
                        <p className="text-[10px] text-slate-400 font-bold">{h.fecha} · Operador: {maq?.operador}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ✓ Registrado
                    </span>
                  </div>

                  {/* Digital Horometer Gauge Display */}
                  <div className="p-4 bg-slate-950 rounded-2xl text-white space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>Lectura Inicial: <strong className="text-slate-200 font-mono">{h.lecturaInicial} hrs</strong></span>
                      <span>Lectura Final: <strong className="text-emerald-400 font-mono">{h.lecturaFinal} hrs</strong></span>
                    </div>

                    <div className="flex items-end justify-between pt-1">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Horas del Turno</span>
                        <div className="text-3xl font-black text-white flex items-baseline gap-1">
                          +{h.horasTrabajadas} <span className="text-xs text-slate-400 font-bold">HRS</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Importe Facturable</span>
                        <div className="text-xl font-black text-emerald-400">
                          {fmt.format(importe)}
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">(${tarifa}/hr)</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer Info */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> Fracc. Valle Sur
                    </span>
                    <button
                      onClick={() => router.push('/maquinaria')}
                      className="text-primary font-black text-xs hover:underline flex items-center gap-1"
                    >
                      Ver Máquina <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ── VISTA 2: HISTORIAL DE LECTURAS & COBRANZA ── */}
      {activeTab === 'historial' && (
        <div className="card p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Historial Completo de Horómetros</h3>
              <p className="text-xs text-slate-400 font-medium">Registro cronológico de horas trabajadas y montos facturables en renta.</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por máquina..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary/50 w-64 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Máquina &amp; Equipo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Lectura Inicial</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Lectura Final</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Horas Efectivas</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Tarifa ($/hr)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Importe Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...lecturas].reverse().map(h => {
                  const maq = maquinaria.find(m => m.id === h.maquinaId);
                  const tarifa = getTarifaHora(h.maquinaId);
                  const importe = h.horasTrabajadas * tarifa;

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-black text-slate-900 text-sm">{h.maquinaId}</span>
                        <div className="text-xs text-slate-500 font-medium">{maq?.nombre}</div>
                      </td>

                      <td className="px-6 py-4 text-xs font-bold text-slate-700">
                        {h.fecha}
                      </td>

                      <td className="px-6 py-4 text-right text-xs font-mono text-slate-600">
                        {h.lecturaInicial.toLocaleString()} hrs
                      </td>

                      <td className="px-6 py-4 text-right text-xs font-mono font-bold text-slate-900">
                        {h.lecturaFinal.toLocaleString()} hrs
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-black">
                          +{h.horasTrabajadas} HRS
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right text-xs font-semibold text-slate-600">
                        ${tarifa}/hr
                      </td>

                      <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                        {fmt.format(importe)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VISTA 3: CICLOS DE MANTENIMIENTO PREVENTIVO ── */}
      {activeTab === 'ciclos' && (
        <div className="space-y-4">
          <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-purple-600" />
                Ciclos de Mantenimiento Preventivo por Horómetro
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Seguimiento de intervalos de 250h (cambio de aceite motor), 500h (filtros primarios) y 1,000h (aceite hidráulico).
              </p>
            </div>
            
            <button
              onClick={() => router.push('/mantenimiento')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md"
            >
              Ver Órdenes de Taller <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {maquinaria.map(m => {
              const intervalo = 250;
              const horasRestantes = intervalo - (m.horometro % intervalo);
              const porcentajeCiclo = Math.round(((intervalo - horasRestantes) / intervalo) * 100);

              return (
                <div key={m.id} className="card p-6 space-y-4 border border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-black text-xs">
                        {m.id}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">{m.nombre}</h4>
                        <p className="text-xs text-slate-500 font-medium">Horómetro: <strong>{m.horometro.toLocaleString()} hrs</strong></p>
                      </div>
                    </div>

                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                      horasRestantes <= 20 ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-purple-100 text-purple-800'
                    }`}>
                      Faltan {horasRestantes.toFixed(1)} hrs
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Ciclo de Servicio 250 hrs:</span>
                      <span>{porcentajeCiclo}% completado</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          horasRestantes <= 20 ? 'bg-red-500' : 'bg-purple-600'
                        }`}
                        style={{ width: `${porcentajeCiclo}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs flex items-center justify-between text-slate-600">
                    <span>Próximo Servicio Programado:</span>
                    <strong className="text-slate-900">{m.proximoMantenimiento}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL NUEVA LECTURA DE HORÓMETRO ── */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={handleSubmit}
          title="Registrar Lectura de Horómetro"
          confirmLabel="Guardar Lectura"
        >
          <div className="space-y-3">
            
            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Seleccionar Maquinaria *">
                <select
                  className={selectClass}
                  value={form.maquinaId}
                  onChange={e => {
                    const m = maquinaria.find(maq => maq.id === e.target.value);
                    setForm({
                      ...form,
                      maquinaId: e.target.value,
                      operador: m?.operador ?? '',
                      tarifaHora: String(getTarifaHora(e.target.value))
                    });
                  }}
                >
                  {maquinaria.map(m => (
                    <option key={m.id} value={m.id}>{m.id} — {m.nombre}</option>
                  ))}
                </select>
              </ModalField>

              <ModalField label="Fecha de Lectura">
                <input
                  type="date"
                  className={inputClass}
                  value={form.fecha}
                  onChange={e => setForm({ ...form, fecha: e.target.value })}
                />
              </ModalField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Lectura Inicial (hrs) *">
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  value={form.lecturaInicial}
                  onChange={e => setForm({ ...form, lecturaInicial: e.target.value })}
                />
              </ModalField>

              <ModalField label="Lectura Final (hrs) *">
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  value={form.lecturaFinal}
                  onChange={e => setForm({ ...form, lecturaFinal: e.target.value })}
                />
              </ModalField>
            </div>

            {/* Calculated hours badge */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">Horas Trabajadas Calculadas:</span>
              <strong className="text-primary font-black text-sm">
                +{Math.max(0, (parseFloat(form.lecturaFinal) || 0) - (parseFloat(form.lecturaInicial) || 0)).toFixed(1)} hrs
              </strong>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Operador">
                <input
                  className={inputClass}
                  value={form.operador}
                  onChange={e => setForm({ ...form, operador: e.target.value })}
                />
              </ModalField>

              <ModalField label="Tarifa Renta ($/hr)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.tarifaHora}
                  onChange={e => setForm({ ...form, tarifaHora: e.target.value })}
                />
              </ModalField>
            </div>

            <ModalField label="Notas de Trabajo / Frente de Obra">
              <input
                className={inputClass}
                placeholder="Ej: Excavación de zanja en Fracc. Valle Sur"
                value={form.notas}
                onChange={e => setForm({ ...form, notas: e.target.value })}
              />
            </ModalField>

          </div>
        </Modal>
      )}

    </div>
  );
}
