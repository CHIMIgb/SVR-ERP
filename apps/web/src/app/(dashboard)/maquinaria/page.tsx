"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Filter, Calendar as CalendarIcon, Grid as GridIcon,
  Truck, ArrowRight, AlertTriangle, ShieldCheck, Hammer,
  ClipboardCheck, CheckCircle2, XCircle, Clock, AlertCircle,
  Wrench, Fuel, Gauge, Navigation, Building2, ChevronRight,
  Zap, CalendarDays, Award, Layers, Loader2
} from 'lucide-react';
import type { Maquina, DespachoMaquina, ChecklistPreoperacional } from '@svr-erp/shared';
import { apiClient } from '@/lib/api';
import MachineCard from '@/components/machinery/MachineCard';
import Modal, { ModalField, inputClass, selectClass } from '@/components/layout/Modal';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';

interface ProyectoLite {
  id: string;
  nombre: string;
  ubicacion: string;
}

const dateRange = [
  "2025-04-21", "2025-04-22", "2025-04-23", "2025-04-24", "2025-04-25",
  "2025-04-26", "2025-04-27", "2025-04-28", "2025-04-29", "2025-04-30"
];

const dayLabels = [
  "Lun 21", "Mar 22", "Mié 23", "Jue 24", "Vie 25", "Sáb 26", "Dom 27", "Lun 28", "Mar 29", "Mié 30"
];

export default function MaquinariaPage() {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const router = useRouter();
  
  // State
  const [maquinaria, setMaquinaria] = useState<Maquina[]>([]);
  const [despachos, setDespachos] = useState<DespachoMaquina[]>([]);
  const [checklists, setChecklists] = useState<ChecklistPreoperacional[]>([]);
  const [allProyectos, setAllProyectos] = useState<ProyectoLite[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'grid' | 'calendar' | 'checklists' | 'mantenimiento'>('grid');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'Todos' | 'Excavación' | 'Grúa' | 'Transporte'>('Todos');
  const [search, setSearch] = useState('');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    const [resMaquinas, resDespachos, resChecklists, resProyectos] = await Promise.all([
      apiClient.get<Maquina[]>('/maquinas'),
      apiClient.get<DespachoMaquina[]>('/despachos'),
      apiClient.get<ChecklistPreoperacional[]>('/checklists'),
      apiClient.get<ProyectoLite[]>('/catalogos/proyectos'),
    ]);

    const responses = [resMaquinas, resDespachos, resChecklists, resProyectos];
    const fallo = responses.find((r) => !r.success);
    if (fallo && !fallo.success) {
      setErrorCarga(fallo.error.message || 'No se pudo cargar la información de flota.');
      setCargando(false);
      return;
    }

    if (resMaquinas.success) setMaquinaria(resMaquinas.data);
    if (resDespachos.success) setDespachos(resDespachos.data);
    if (resChecklists.success) setChecklists(resChecklists.data);
    if (resProyectos.success) setAllProyectos(resProyectos.data);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Modals state
  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [guardandoMaquina, setGuardandoMaquina] = useState(false);
  const [guardandoDespacho, setGuardandoDespacho] = useState(false);
  const [guardandoChecklist, setGuardandoChecklist] = useState(false);

  // Forms state
  const [machineForm, setMachineForm] = useState({
    id: '',
    nombre: '',
    tipo: 'Excavación',
    operador: '',
    horometro: '0',
    combustible: '100',
    consumoEsperado: '14.0'
  });

  const [dispatchForm, setDispatchForm] = useState({ 
    maquinaId: '', 
    proyectoId: '', 
    fechaInicio: '2025-04-21', 
    fechaFin: '2025-04-27' 
  });

  const [checklistForm, setChecklistForm] = useState<{
    maquinaId: string;
    operador: string;
    horometroInicial: string;
    nivelAceiteMotor: 'Correcto' | 'Bajo' | 'Exceso';
    nivelHidraulico: 'Correcto' | 'Bajo';
    fugasVisibles: boolean;
    estadoLlantasOrugas: 'Correcto' | 'Desgaste Severo' | 'Daño';
    lucesYAlarmas: 'Correcto' | 'Falla';
    sistemaFrenos: 'Correcto' | 'Falla';
    observaciones: string;
  }>({
    maquinaId: '',
    operador: 'Juan Pérez',
    horometroInicial: '1240.0',
    nivelAceiteMotor: 'Correcto',
    nivelHidraulico: 'Correcto',
    fugasVisibles: false,
    estadoLlantasOrugas: 'Correcto',
    lucesYAlarmas: 'Correcto',
    sistemaFrenos: 'Correcto',
    observaciones: 'Inspección pre-operacional en orden.'
  });

  useEffect(() => {
    if (maquinaria.length > 0 && !checklistForm.maquinaId) {
      setChecklistForm((f) => ({ ...f, maquinaId: maquinaria[0].id }));
    }
  }, [maquinaria, checklistForm.maquinaId]);

  // Filtering
  const filtered = maquinaria.filter((m) => {
    const matchSearch = 
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.nombre.toLowerCase().includes(search.toLowerCase()) ||
      m.operador.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (selectedTypeFilter !== 'Todos' && m.tipo !== selectedTypeFilter) return false;
    return true;
  });

  // Telemetry KPIs
  const activasCount = maquinaria.filter(m => m.estado === 'Encendida' || m.estado === 'Movimiento').length;
  const alertasOrdenaCount = maquinaria.filter(m => m.alertaConsumoAnormal).length;
  const checklistsAprobados = checklists.filter(c => c.estado === 'Aprobado').length;
  const checklistsFallas = checklists.filter(c => c.estado === 'Con Falla').length;

  // Submit New Machine
  const handleMachineSubmit = async () => {
    if (!machineForm.id.trim() || !machineForm.nombre.trim()) {
      showToast('ID y nombre son obligatorios.', 'error');
      return;
    }

    setGuardandoMaquina(true);
    const res = await apiClient.post<Maquina>('/maquinas', {
      id: machineForm.id.toUpperCase(),
      tipo: machineForm.tipo,
      nombre: machineForm.nombre,
      operador: machineForm.operador || undefined,
      horometro: parseFloat(machineForm.horometro) || 0,
      combustible: parseFloat(machineForm.combustible) || 100,
      consumoEsperado: parseFloat(machineForm.consumoEsperado) || 14.0,
    });
    setGuardandoMaquina(false);

    if (!res.success) {
      showToast(`Error: ${res.error.message}`, 'error');
      return;
    }

    setMaquinaria((prev) => [res.data, ...prev]);
    setMachineForm({ id: '', nombre: '', tipo: 'Excavación', operador: '', horometro: '0', combustible: '100', consumoEsperado: '14.0' });
    setMachineModalOpen(false);
    showToast(`✅ Máquina ${res.data.id} dada de alta correctamente.`, 'success');
  };

  // Submit Machine Dispatch
  const handleDispatchSubmit = async () => {
    const { maquinaId, proyectoId, fechaInicio, fechaFin } = dispatchForm;
    if (!maquinaId || !proyectoId || !fechaInicio || !fechaFin) {
      showToast('Todos los campos son obligatorios.', 'error');
      return;
    }
    if (fechaInicio > fechaFin) {
      showToast('La fecha de inicio no puede ser posterior a la fecha de fin.', 'error');
      return;
    }

    setGuardandoDespacho(true);
    const res = await apiClient.post<DespachoMaquina>('/despachos', {
      maquinaId,
      proyectoId,
      fechaInicio,
      fechaFin,
    });
    setGuardandoDespacho(false);

    if (!res.success) {
      // El backend valida el traslape con datos actuales de TODA la
      // flota (409 CONFLICT), no solo con lo que ya cargó el frontend.
      showToast(`⚠️ ${res.error.message}`, 'error');
      return;
    }

    setDespachos(prev => [...prev, res.data]);
    setDispatchModalOpen(false);
    setDispatchForm({ maquinaId: '', proyectoId: '', fechaInicio: '2025-04-21', fechaFin: '2025-04-27' });
    showToast(`✅ Máquina ${maquinaId} asignada correctamente a la obra.`, 'success');
  };

  // Submit Preoperational Checklist
  const handleChecklistSubmit = async () => {
    setGuardandoChecklist(true);
    const res = await apiClient.post<ChecklistPreoperacional>('/checklists', {
      maquinaId: checklistForm.maquinaId,
      operador: checklistForm.operador,
      horometroInicial: parseFloat(checklistForm.horometroInicial) || 1240.0,
      nivelAceiteMotor: checklistForm.nivelAceiteMotor,
      nivelHidraulico: checklistForm.nivelHidraulico,
      fugasVisibles: checklistForm.fugasVisibles,
      estadoLlantasOrugas: checklistForm.estadoLlantasOrugas,
      sistemaFrenos: checklistForm.sistemaFrenos,
      observaciones: checklistForm.observaciones,
    });
    setGuardandoChecklist(false);

    if (!res.success) {
      showToast(`Error: ${res.error.message}`, 'error');
      return;
    }

    const nuevoChecklist = res.data;
    setChecklists(prev => [nuevoChecklist, ...prev]);

    // Refleja el checklist recién creado en la ficha de la máquina sin
    // esperar a un refetch completo.
    setMaquinaria(prev => prev.map(m => {
      if (m.id === checklistForm.maquinaId) {
        return {
          ...m,
          checklistHoy: {
            id: nuevoChecklist.id,
            estado: nuevoChecklist.estado,
            hora: nuevoChecklist.hora,
            operador: nuevoChecklist.operador,
            observaciones: nuevoChecklist.observaciones
          }
        };
      }
      return m;
    }));

    setChecklistModalOpen(false);

    if (nuevoChecklist.estado === 'Con Falla') {
      showToast(`⚠️ Checklist registrado CON FALLA para ${checklistForm.maquinaId}. Alerta enviada a Mantenimiento.`, 'warning');
      addNotification({
        titulo: `⚠️ Alerta Mecánica: ${checklistForm.maquinaId}`,
        mensaje: `Operador ${checklistForm.operador} reportó anomalía en checklist matutino: ${checklistForm.observaciones}`,
        tipo: 'alerta'
      });
    } else {
      showToast(`✅ Inspección pre-operacional de ${checklistForm.maquinaId} APROBADA. Lista para operar.`, 'success');
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="card p-8 text-center space-y-3 border border-red-200 bg-red-50">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm font-bold text-red-700">{errorCarga}</p>
        <button onClick={cargarDatos} className="btn-primary text-xs">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── 1. HEADER EJECUTIVO ULTRA-PREMIUM ── */}
      <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl overflow-hidden border border-slate-800">
        
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Flota Monitoreada por GPS · 94% Disponibilidad
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {activasCount} de {maquinaria.length} Equipos Activos
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              Control de Flota y Maquinaria Pesada
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl font-medium">
              Supervisión de horómetros en vivo, telemetría diésel L/hr, programación de despachos por obra e inspecciones pre-operacionales diarias.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setDispatchModalOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-white/10 backdrop-blur-md"
            >
              <Truck className="w-4 h-4 text-orange-400" /> Despachar a Obra
            </button>

            <button
              onClick={() => setChecklistModalOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-white/10 backdrop-blur-md"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-400" /> + Checklist Pre-op
            </button>

            <button
              onClick={() => setMachineModalOpen(true)}
              className="btn-primary flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> Alta de Maquinaria
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. PABELLONES DE MÉTRICAS CLAVE (KPIS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Flota en Operación */}
        <div 
          onClick={() => setActiveTab('grid')}
          className="card group cursor-pointer hover:border-orange-300 transition-all border p-5 relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Flota Operativa</p>
              <h3 className="text-2xl font-black text-slate-900">
                {activasCount} <span className="text-sm font-bold text-slate-400">/ {maquinaria.length} activas</span>
              </h3>
            </div>
            <div className="w-11 h-11 bg-orange-50 text-primary rounded-2xl flex items-center justify-center border border-orange-200/60 group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-emerald-600">🟢 0 en mantenimiento</span>
            <span className="text-slate-400 font-mono">100% Asignada</span>
          </div>
        </div>

        {/* Telemetría Diésel & Alerta de Ordeña */}
        <div 
          onClick={() => router.push('/combustible')}
          className="card group cursor-pointer hover:border-red-300 transition-all border p-5 relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Telemetría Diésel (L/hr)</p>
              <h3 className={`text-2xl font-black ${alertasOrdenaCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {alertasOrdenaCount > 0 ? `${alertasOrdenaCount} Alerta` : 'Normal'}
              </h3>
            </div>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform ${
              alertasOrdenaCount > 0 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              <Fuel className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className={alertasOrdenaCount > 0 ? 'text-red-600' : 'text-emerald-600'}>
              {alertasOrdenaCount > 0 ? '⚠️ Desvío en Volteo M004' : 'Consumo óptimo'}
            </span>
            <span className="text-slate-400 font-mono">14.2 L/hr prom.</span>
          </div>
        </div>

        {/* Checklists Pre-operacionales */}
        <div 
          onClick={() => setActiveTab('checklists')}
          className="card group cursor-pointer hover:border-emerald-300 transition-all border p-5 relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inspecciones Matutinas</p>
              <h3 className="text-2xl font-black text-slate-900">
                {checklistsAprobados} <span className="text-xs font-bold text-emerald-600">Aprobadas</span>
              </h3>
            </div>
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-200/60 group-hover:scale-110 transition-transform">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className={checklistsFallas > 0 ? 'text-orange-600' : 'text-slate-400'}>
              {checklistsFallas > 0 ? `⚠️ ${checklistsFallas} con observación` : 'Sin novedades'}
            </span>
            <span className="text-slate-400">Revisión de 30s</span>
          </div>
        </div>

        {/* Mantenimiento Preventivo */}
        <div 
          onClick={() => setActiveTab('mantenimiento')}
          className="card group cursor-pointer hover:border-purple-300 transition-all border p-5 relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Próximo Servicio Mayor</p>
              <h3 className="text-2xl font-black text-slate-900">5 Mayo</h3>
            </div>
            <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-200 group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-purple-700">Kenworth (Servicio 3,500h)</span>
            <span className="text-slate-400">Filtros y Aceite</span>
          </div>
        </div>

      </div>

      {/* ── 3. PESTAÑAS DE CONTROL OPERATIVO ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('grid')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'grid'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <GridIcon className="w-4 h-4" /> Fichas de Flota ({maquinaria.length})
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'calendar'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-blue-500" /> Cronograma de Despacho y Obras
        </button>

        <button
          onClick={() => setActiveTab('checklists')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'checklists'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-emerald-500" /> Inspecciones Pre-operacionales ({checklists.length})
        </button>

        <button
          onClick={() => setActiveTab('mantenimiento')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'mantenimiento'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Wrench className="w-4 h-4 text-purple-500" /> Semáforo Preventivo
        </button>
      </div>

      {/* ── VISTA 1: FICHAS DE FLOTA ── */}
      {activeTab === 'grid' && (
        <div className="space-y-6">
          
          {/* Equipment Type Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'Todos', label: 'Todos los Equipos' },
                { id: 'Excavación', label: '🚜 Excavación y Empuje' },
                { id: 'Grúa', label: '🏗️ Grúas y Maniobra' },
                { id: 'Transporte', label: '🚚 Transporte y Acarreo' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTypeFilter(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    selectedTypeFilter === t.id
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por ID, máquina u operador..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary/50 w-64 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Machinery Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400 font-medium">
              No se encontró maquinaria en este filtro.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((m) => (
                <MachineCard 
                  key={m.id} 
                  maquina={m}
                  onOpenChecklist={() => {
                    setChecklistForm(prev => ({ ...prev, maquinaId: m.id, operador: m.operador }));
                    setChecklistModalOpen(true);
                  }}
                  onOpenGps={() => router.push('/gps')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── VISTA 2: CRONOGRAMA DE DESPACHO Y ASIGNACIÓN ── */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                Matriz de Disponibilidad y Despacho de Flota
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Visualiza qué máquina está asignada a cada frente de obra en la línea de tiempo.
              </p>
            </div>
            
            <button
              onClick={() => setDispatchModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" /> Despachar Equipo a Obra
            </button>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs">
                    <th className="px-6 py-4 font-black uppercase tracking-wider w-64">Maquinaria &amp; Operador</th>
                    {dayLabels.map((lbl, idx) => (
                      <th key={idx} className="px-3 py-4 font-black uppercase tracking-wider text-center text-[10px]">
                        {lbl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {maquinaria.map(m => {
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-black text-slate-900 text-sm">{m.id}</div>
                          <div className="text-xs text-slate-500">{m.nombre}</div>
                          <div className="text-[10px] font-bold text-primary">{m.operador}</div>
                        </td>

                        {dateRange.map(fecha => {
                          const desp = despachos.find(d => 
                            d.maquinaId === m.id && fecha >= d.fechaInicio && fecha <= d.fechaFin
                          );
                          const proj = desp ? allProyectos.find(p => p.id === desp.proyectoId) : null;

                          return (
                            <td key={fecha} className="p-1.5 text-center">
                              {desp ? (
                                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[9px] font-black leading-tight shadow-sm truncate max-w-[80px]" title={proj?.nombre}>
                                  {proj?.nombre.split(' ')[0] ?? 'Obra'}
                                </div>
                              ) : (
                                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-300 text-[9px] font-bold">
                                  Libre
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── VISTA 3: INSPECCIONES PRE-OPERACIONALES DIARIAS ── */}
      {activeTab === 'checklists' && (
        <div className="space-y-4">
          <div className="card bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                Inspecciones Matutinas de 30 Segundos
              </span>
              <h3 className="text-2xl font-black mt-2">
                Bitácora de Checklists Pre-operacionales
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Revisión diaria obligatoria de niveles de aceite, fugas, orugas/llantas y frenos antes de arrancar.
              </p>
            </div>

            <button
              onClick={() => setChecklistModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> + Registrar Checklist
            </button>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Máquina &amp; Operador</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha &amp; Hora</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Horómetro</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aceite Motor</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hidráulico</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fugas</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Frenos</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {checklists.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-900 text-sm">{c.maquinaId}</div>
                        <div className="text-xs text-slate-500 font-medium">{c.operador}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-800">{c.fecha}</span>
                        <p className="text-[10px] text-slate-400 font-mono">{c.hora}</p>
                      </td>

                      <td className="px-6 py-4 font-black text-slate-900 text-sm">
                        {c.horometroInicial} <span className="text-[10px] text-slate-400 font-bold">HRS</span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold ${c.nivelAceiteMotor === 'Correcto' ? 'text-green-600' : 'text-red-600'}`}>
                          {c.nivelAceiteMotor}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold ${c.nivelHidraulico === 'Correcto' ? 'text-green-600' : 'text-red-600'}`}>
                          {c.nivelHidraulico}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {c.fugasVisibles ? (
                          <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            ⚠️ Fuga detectada
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-green-600">Sin fugas</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold ${c.sistemaFrenos === 'Correcto' ? 'text-green-600' : 'text-red-600'}`}>
                          {c.sistemaFrenos}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          c.estado === 'Aprobado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── VISTA 4: SEMÁFORO PREVENTIVO ── */}
      {activeTab === 'mantenimiento' && (
        <div className="space-y-4">
          <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-purple-600" />
                Semáforo de Servicios Preventivos por Horómetro
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Control de cambios de aceite de motor, aceite hidráulico, filtros de aire y revisión de tren de rodaje.
              </p>
            </div>
            
            <button
              onClick={() => router.push('/mantenimiento')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-purple-600/20"
            >
              Ir a Módulo de Mantenimiento <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maquinaria.map(m => (
              <div key={m.id} className="card p-5 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{m.id} — {m.nombre}</h4>
                      <p className="text-[11px] text-slate-500">{m.tipo} · Operador: {m.operador}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-purple-800 bg-purple-100 px-2.5 py-1 rounded-md">
                    {m.proximoMantenimiento}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Horómetro Actual:</span>
                    <strong className="text-slate-900">{m.horometro.toLocaleString()} hrs</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consumo Estándar:</span>
                    <strong className="text-slate-900">{m.consumoEsperadoLtsHora} L/hr</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estado de Telemetría:</span>
                    <span className={m.alertaConsumoAnormal ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                      {m.alertaConsumoAnormal ? "⚠️ Alerta de Sobreconsumo" : "✓ Telemetría Óptima"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL ALTA DE MAQUINARIA ── */}
      {machineModalOpen && (
        <Modal
          isOpen={machineModalOpen}
          onClose={() => setMachineModalOpen(false)}
          onConfirm={handleMachineSubmit}
          title="Alta de Maquinaria Pesada"
          confirmLabel={guardandoMaquina ? 'Guardando…' : 'Registrar Equipo'}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <ModalField label="ID o Código del Equipo *">
                <input
                  className={inputClass}
                  placeholder="Ej: M005"
                  value={machineForm.id}
                  onChange={e => setMachineForm({ ...machineForm, id: e.target.value })}
                />
              </ModalField>

              <ModalField label="Tipo de Maquinaria *">
                <select
                  className={selectClass}
                  value={machineForm.tipo}
                  onChange={e => setMachineForm({ ...machineForm, tipo: e.target.value })}
                >
                  <option value="Excavación">🚜 Excavación y Empuje</option>
                  <option value="Grúa">🏗️ Grúa y Levante</option>
                  <option value="Transporte">🚚 Transporte y Acarreo</option>
                  <option value="Criba">⛰️ Criba y Trituración</option>
                </select>
              </ModalField>
            </div>

            <ModalField label="Nombre Comercial y Modelo *">
              <input
                className={inputClass}
                placeholder="Ej: Excavadora CAT 320D3"
                value={machineForm.nombre}
                onChange={e => setMachineForm({ ...machineForm, nombre: e.target.value })}
              />
            </ModalField>

            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Horómetro Inicial">
                <input
                  type="number"
                  className={inputClass}
                  placeholder="0.0"
                  value={machineForm.horometro}
                  onChange={e => setMachineForm({ ...machineForm, horometro: e.target.value })}
                />
              </ModalField>

              <ModalField label="Consumo Esperado (Lts/Hr)">
                <input
                  type="number"
                  step="0.5"
                  className={inputClass}
                  placeholder="14.0"
                  value={machineForm.consumoEsperado}
                  onChange={e => setMachineForm({ ...machineForm, consumoEsperado: e.target.value })}
                />
              </ModalField>
            </div>

            <ModalField label="Operador Asignado">
              <input
                className={inputClass}
                placeholder="Ej: Juan Pérez"
                value={machineForm.operador}
                onChange={e => setMachineForm({ ...machineForm, operador: e.target.value })}
              />
            </ModalField>
          </div>
        </Modal>
      )}

      {/* ── MODAL DESPACHO DE MAQUINARIA A OBRA ── */}
      {dispatchModalOpen && (
        <Modal
          isOpen={dispatchModalOpen}
          onClose={() => setDispatchModalOpen(false)}
          onConfirm={handleDispatchSubmit}
          title="Despachar Maquinaria a Obra"
          confirmLabel={guardandoDespacho ? 'Guardando…' : 'Confirmar Despacho'}
        >
          <div className="space-y-3">
            <ModalField label="Seleccionar Maquinaria *">
              <select
                className={selectClass}
                value={dispatchForm.maquinaId}
                onChange={e => setDispatchForm({ ...dispatchForm, maquinaId: e.target.value })}
              >
                <option value="">Selecciona equipo...</option>
                {maquinaria.map(m => (
                  <option key={m.id} value={m.id}>{m.id} — {m.nombre} ({m.tipo})</option>
                ))}
              </select>
            </ModalField>

            <ModalField label="Obra o Proyecto Destino *">
              <select
                className={selectClass}
                value={dispatchForm.proyectoId}
                onChange={e => setDispatchForm({ ...dispatchForm, proyectoId: e.target.value })}
              >
                <option value="">Selecciona obra...</option>
                {allProyectos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.ubicacion})</option>
                ))}
              </select>
            </ModalField>

            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Fecha Inicio">
                <input
                  type="date"
                  className={inputClass}
                  value={dispatchForm.fechaInicio}
                  onChange={e => setDispatchForm({ ...dispatchForm, fechaInicio: e.target.value })}
                />
              </ModalField>

              <ModalField label="Fecha Fin">
                <input
                  type="date"
                  className={inputClass}
                  value={dispatchForm.fechaFin}
                  onChange={e => setDispatchForm({ ...dispatchForm, fechaFin: e.target.value })}
                />
              </ModalField>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL CHECKLIST PREOPERACIONAL ── */}
      {checklistModalOpen && (
        <Modal
          isOpen={checklistModalOpen}
          onClose={() => setChecklistModalOpen(false)}
          onConfirm={handleChecklistSubmit}
          title="Inspección Pre-operacional Diaria"
          confirmLabel={guardandoChecklist ? 'Guardando…' : 'Guardar Checklist'}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Máquina">
                <select
                  className={selectClass}
                  value={checklistForm.maquinaId}
                  onChange={e => setChecklistForm({ ...checklistForm, maquinaId: e.target.value })}
                >
                  {maquinaria.map(m => (
                    <option key={m.id} value={m.id}>{m.id} — {m.nombre}</option>
                  ))}
                </select>
              </ModalField>

              <ModalField label="Horómetro Inicial">
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  value={checklistForm.horometroInicial}
                  onChange={e => setChecklistForm({ ...checklistForm, horometroInicial: e.target.value })}
                />
              </ModalField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Nivel Aceite Motor">
                <select
                  className={selectClass}
                  value={checklistForm.nivelAceiteMotor}
                  onChange={e => setChecklistForm({ ...checklistForm, nivelAceiteMotor: e.target.value as any })}
                >
                  <option value="Correcto">🟢 Correcto</option>
                  <option value="Bajo">🔴 Bajo (Requiere relleno)</option>
                  <option value="Exceso">⚠️ Exceso</option>
                </select>
              </ModalField>

              <ModalField label="Nivel Hidráulico">
                <select
                  className={selectClass}
                  value={checklistForm.nivelHidraulico}
                  onChange={e => setChecklistForm({ ...checklistForm, nivelHidraulico: e.target.value as any })}
                >
                  <option value="Correcto">🟢 Correcto</option>
                  <option value="Bajo">🔴 Bajo</option>
                </select>
              </ModalField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Llantas / Orugas">
                <select
                  className={selectClass}
                  value={checklistForm.estadoLlantasOrugas}
                  onChange={e => setChecklistForm({ ...checklistForm, estadoLlantasOrugas: e.target.value as any })}
                >
                  <option value="Correcto">🟢 Correcto</option>
                  <option value="Desgaste Severo">⚠️ Desgaste Severo</option>
                  <option value="Daño">🔴 Daño / Ponchadura</option>
                </select>
              </ModalField>

              <ModalField label="Frenos y Dirección">
                <select
                  className={selectClass}
                  value={checklistForm.sistemaFrenos}
                  onChange={e => setChecklistForm({ ...checklistForm, sistemaFrenos: e.target.value as any })}
                >
                  <option value="Correcto">🟢 Operando Correctamente</option>
                  <option value="Falla">🔴 Falla / Inoperante</option>
                </select>
              </ModalField>
            </div>

            <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={checklistForm.fugasVisibles}
                onChange={e => setChecklistForm({ ...checklistForm, fugasVisibles: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span className="text-xs font-black text-slate-800">
                ¿Se detectó alguna fuga visible de aceite, anticongelante o diésel?
              </span>
            </label>

            <ModalField label="Observaciones">
              <textarea
                rows={2}
                className={inputClass}
                value={checklistForm.observaciones}
                onChange={e => setChecklistForm({ ...checklistForm, observaciones: e.target.value })}
              />
            </ModalField>
          </div>
        </Modal>
      )}

    </div>
  );
}
