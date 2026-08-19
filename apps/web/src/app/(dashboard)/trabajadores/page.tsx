"use client";

import React, { useState } from 'react';
import { 
  Plus, Search, Filter, UserCheck, UserMinus, Clock, 
  Truck, HardHat, Wrench, Compass, Building2, FileText,
  ClipboardList, CheckCircle2, AlertCircle, DollarSign,
  Calendar, Eye, ChevronRight
} from 'lucide-react';
import { 
  trabajadores as initialTrabajadores, 
  bitacorasRentaData as initialBitacoras,
  Trabajador, 
  CategoriaPuesto,
  BitacoraRentaDiaria,
  maquinaria,
  proyectos
} from '@/lib/data';
import WorkerCard from '@/components/workers/WorkerCard';
import BitacorasRentaModal from '@/components/workers/BitacorasRentaModal';
import LiquidacionModal from '@/components/workers/LiquidacionModal';
import Modal, { ModalField, inputClass, selectClass } from '@/components/layout/Modal';
import { useToast } from '@/components/layout/Toast';

export default function TrabajadoresPage() {
  const { showToast } = useToast();
  const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  // State
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>(initialTrabajadores);
  const [bitacoras, setBitacoras] = useState<BitacoraRentaDiaria[]>(initialBitacoras);
  const [activeMainTab, setActiveMainTab] = useState<'plantilla' | 'bitacoras_renta'>('plantilla');
  const [selectedRole, setSelectedRole] = useState<'Todos' | CategoriaPuesto>('Todos');
  const [search, setSearch] = useState('');
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [bitacorasModalOpen, setBitacorasModalOpen] = useState(false);
  const [selectedWorkerForBitacora, setSelectedWorkerForBitacora] = useState<Trabajador | null>(null);
  const [liquidacionModalOpen, setLiquidacionModalOpen] = useState(false);
  const [selectedWorkerForLiquidacion, setSelectedWorkerForLiquidacion] = useState<Trabajador | null>(null);

  // New Worker Form
  const [form, setForm] = useState({ 
    nombre: '', 
    puesto: '', 
    categoriaPuesto: 'Operador' as CategoriaPuesto,
    telefono: '', 
    proyecto: 'Fraccionamiento Valle Sur',
    sueldoFiscal: '2500',
    sueldoEfectivo: '3500',
    metodoPago: 'Mixto' as const,
    maquinaId: 'M001'
  });

  // Filter Workers
  const filteredTrabajadores = trabajadores.filter((t) => {
    const matchSearch = 
      t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      t.puesto.toLowerCase().includes(search.toLowerCase()) ||
      (t.clienteRentaActual && t.clienteRentaActual.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;
    if (selectedRole !== 'Todos' && t.categoriaPuesto !== selectedRole) return false;
    return true;
  });

  // Filter Bitácoras
  const filteredBitacoras = bitacoras.filter((b) => {
    return (
      b.cliente.toLowerCase().includes(search.toLowerCase()) ||
      b.trabajadorNombre.toLowerCase().includes(search.toLowerCase()) ||
      b.maquinaNombre.toLowerCase().includes(search.toLowerCase()) ||
      b.folio.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Category counts
  const countByRole = (role: CategoriaPuesto) => trabajadores.filter(t => t.categoriaPuesto === role).length;

  const handleCreateWorker = () => {
    if (!form.nombre.trim() || !form.puesto.trim()) {
      showToast('Por favor completa nombre y puesto.', 'error');
      return;
    }
    const maq = maquinaria.find(m => m.id === form.maquinaId);
    const nuevo: Trabajador = {
      id: `T${Date.now()}`,
      nombre: form.nombre,
      puesto: form.puesto,
      categoriaPuesto: form.categoriaPuesto,
      telefono: form.telefono || '55 0000 0000',
      entrada: '07:00 AM',
      estado: 'Activo',
      avatar: form.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      proyectos: form.proyecto ? [form.proyecto] : [],
      sueldoFiscal: parseFloat(form.sueldoFiscal) || 2000,
      sueldoEfectivo: parseFloat(form.sueldoEfectivo) || 3000,
      metodoPago: form.metodoPago,
      maquinaAsignadaId: form.categoriaPuesto === 'Operador' || form.categoriaPuesto === 'Chofer' ? form.maquinaId : undefined,
      maquinaAsignadaNombre: form.categoriaPuesto === 'Operador' || form.categoriaPuesto === 'Chofer' ? maq?.nombre : undefined,
      estadoRenta: 'En Obra Propia',
      fechaContratacion: new Date().toISOString().split('T')[0],
      vacacionesDias: 6,
      horasExtraSemana: 0,
      tarifaHoraExtra: 80,
      descuentosSemana: 0
    };

    setTrabajadores(prev => [nuevo, ...prev]);
    setForm({ 
      nombre: '', 
      puesto: '', 
      categoriaPuesto: 'Operador', 
      telefono: '', 
      proyecto: 'Fraccionamiento Valle Sur',
      sueldoFiscal: '2500',
      sueldoEfectivo: '3500',
      metodoPago: 'Mixto',
      maquinaId: 'M001'
    });
    setModalOpen(false);
    showToast(`✅ ${nuevo.nombre} (${nuevo.categoriaPuesto}) dado de alta correctamente.`, 'success');
  };

  const handleOpenBitacorasModal = (worker?: Trabajador) => {
    setSelectedWorkerForBitacora(worker ?? null);
    setBitacorasModalOpen(true);
  };

  const handleAgregarBitacora = (nueva: BitacoraRentaDiaria) => {
    setBitacoras(prev => [nueva, ...prev]);
  };

  const handleConfirmarBaja = (trabajadorId: string, tipo: string, monto: number) => {
    setTrabajadores(prev => prev.map(t => t.id === trabajadorId ? {
      ...t,
      estado: 'Inactivo',
      maquinaAsignadaId: undefined,
      maquinaAsignadaNombre: undefined,
      estadoRenta: undefined,
      clienteRentaActual: undefined
    } : t));
  };

  return (
    <div className="space-y-8">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Gestión de Personal &amp; Operadores</h1>
          <p className="text-slate-500 font-medium">Control de plantilla por categorías, asignación de maquinaria y bitácoras de renta diaria.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => handleOpenBitacorasModal()}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
          >
            <ClipboardList className="w-4 h-4 text-orange-400" /> Hojas de Bitácora
          </button>

          <button 
            onClick={() => {
              setSelectedWorkerForLiquidacion(null);
              setLiquidacionModalOpen(true);
            }}
            className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
          >
            <UserMinus className="w-4 h-4 text-red-600" /> ⚖️ Liquidar / Finiquito
          </button>

          <button 
            onClick={() => setModalOpen(true)}
            className="btn-primary flex items-center gap-2 text-xs font-black uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> Alta de Empleado
          </button>
        </div>
      </div>

      {/* ── MAIN TABS (PLANTILLA vs BITÁCORAS DE RENTA) ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveMainTab('plantilla')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeMainTab === 'plantilla'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <HardHat className="w-4 h-4" /> Plantilla de Personal ({trabajadores.length})
        </button>

        <button
          onClick={() => setActiveMainTab('bitacoras_renta')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeMainTab === 'bitacoras_renta'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-orange-500" /> Bitácoras de Renta Diaria ({bitacoras.length})
        </button>
      </div>

      {/* ── VISTA 1: PLANTILLA DE PERSONAL POR CATEGORÍAS ── */}
      {activeMainTab === 'plantilla' && (
        <div className="space-y-6">
          
          {/* Role Category Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'Todos', label: 'Todos los Puestos', count: trabajadores.length, icon: UserCheck },
              { id: 'Operador', label: '🚜 Operadores de Maquinaria', count: countByRole('Operador'), icon: Truck },
              { id: 'Chofer', label: '🚚 Choferes de Transporte', count: countByRole('Chofer'), icon: Compass },
              { id: 'Mecanico', label: '🔧 Mecánicos de Taller', count: countByRole('Mecanico'), icon: Wrench },
              { id: 'Ingeniero', label: '📐 Ingenieros y Encargados', count: countByRole('Ingeniero'), icon: Building2 },
              { id: 'Administrativo', label: '💼 Administración', count: countByRole('Administrativo'), icon: FileText }
            ].map(r => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id as any)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                    selectedRole === r.id
                      ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{r.label}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    selectedRole === r.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {r.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, puesto o cliente de renta..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-primary/50 text-xs font-medium"
              />
            </div>
          </div>

          {/* Workers Grid */}
          {filteredTrabajadores.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400 font-medium">
              No se encontraron empleados en esta categoría.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrabajadores.map((t) => (
                <WorkerCard 
                  key={t.id} 
                  trabajador={t} 
                  onOpenBitacoras={handleOpenBitacorasModal}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── VISTA 2: CONCENTRADO DE BITÁCORAS DE RENTA DIARIA ── */}
      {activeMainTab === 'bitacoras_renta' && (
        <div className="space-y-4">
          
          {/* Header Banner */}
          <div className="card bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full border border-orange-400/20">
                Soporte Diario de Cobro a Clientes
              </span>
              <h3 className="text-2xl font-black mt-2">
                Hojas de Bitácora Diaria y Tareo de Maquinaria
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Partes de trabajo que entregan los operadores con horas efectivas, horómetros y firma del cliente para facturación.
              </p>
            </div>
            
            <button
              onClick={() => handleOpenBitacorasModal()}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> + Capturar Hoja Diaria
            </button>
          </div>

          {/* Table */}
          <div className="card p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h4 className="font-bold text-slate-900 text-base">Registros de Trabajo en Renta</h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por cliente u operador..."
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary/50 w-64 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Folio &amp; Fecha</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operador &amp; Máquina</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente &amp; Frente de Obra</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Horas &amp; Horómetro</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vo.Bo. Residente Cliente</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Importe Cobro</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBitacoras.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-black text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                          {b.folio}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">{b.fecha}</p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">{b.trabajadorNombre}</div>
                        <p className="text-[10px] text-primary font-bold">{b.maquinaId} — {b.maquinaNombre}</p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-black text-slate-800 text-xs">{b.cliente}</div>
                        <p className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">{b.obraUbicacion}</p>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="text-xs font-black text-slate-900">
                          {b.horasEfectivas + b.horasExtras} hrs
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono">
                          {b.horometroInicial} ➔ {b.horometroFinal}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        {b.firmaCliente.firmado ? (
                          <div className="text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{b.firmaCliente.nombreResidente}</span>
                          </div>
                        ) : (
                          <div className="text-amber-700 text-xs font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Pendiente de Firma</span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">
                        {fmt.format(b.importeTotalRenta)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          b.estadoCobro === 'Facturado' ? 'bg-blue-100 text-blue-800' :
                          b.estadoCobro === 'Listo para Facturar' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {b.estadoCobro}
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

      {/* ── MODAL ALTA DE EMPLEADO POR CATEGORÍA ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleCreateWorker}
        title="Alta de Empleado por Puesto"
        confirmLabel="Dar de Alta"
      >
        <div className="space-y-3">
          
          <ModalField label="Nombre Completo *">
            <input 
              className={inputClass} 
              placeholder="Juan Pérez García" 
              value={form.nombre} 
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} 
            />
          </ModalField>

          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Categoría de Puesto *">
              <select 
                className={selectClass} 
                value={form.categoriaPuesto} 
                onChange={(e) => setForm({ ...form, categoriaPuesto: e.target.value as CategoriaPuesto })}
              >
                <option value="Operador">🚜 Operador de Maquinaria</option>
                <option value="Chofer">🚚 Chofer de Transporte</option>
                <option value="Mecanico">🔧 Mecánico de Taller</option>
                <option value="Ingeniero">📐 Ingeniero / Encargado</option>
                <option value="Administrativo">💼 Personal Administrativo</option>
              </select>
            </ModalField>

            <ModalField label="Puesto Específico *">
              <input 
                className={inputClass} 
                placeholder="Ej: Operador de Excavadora CAT" 
                value={form.puesto} 
                onChange={(e) => setForm({ ...form, puesto: e.target.value })} 
              />
            </ModalField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Teléfono de Contacto">
              <input 
                className={inputClass} 
                placeholder="55 1234 5678" 
                value={form.telefono} 
                onChange={(e) => setForm({ ...form, telefono: e.target.value })} 
              />
            </ModalField>

            <ModalField label="Obra Asignada">
              <select 
                className={selectClass} 
                value={form.proyecto} 
                onChange={(e) => setForm({ ...form, proyecto: e.target.value })}
              >
                {proyectos.map(p => (
                  <option key={p.id} value={p.nombre}>{p.nombre}</option>
                ))}
                <option value="Taller Central SVR">Taller Central SVR</option>
                <option value="Oficina Central SVR">Oficina Central SVR</option>
              </select>
            </ModalField>
          </div>

          {(form.categoriaPuesto === 'Operador' || form.categoriaPuesto === 'Chofer') && (
            <ModalField label="Máquina Asignada">
              <select 
                className={selectClass} 
                value={form.maquinaId} 
                onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
              >
                {maquinaria.map(m => (
                  <option key={m.id} value={m.id}>{m.id} — {m.nombre}</option>
                ))}
              </select>
            </ModalField>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <ModalField label="Sueldo Fiscal (SPEI Tarjeta)">
              <input 
                type="number"
                className={inputClass} 
                placeholder="2500" 
                value={form.sueldoFiscal} 
                onChange={(e) => setForm({ ...form, sueldoFiscal: e.target.value })} 
              />
            </ModalField>

            <ModalField label="Complemento Efectivo (Sobre)">
              <input 
                type="number"
                className={inputClass} 
                placeholder="3500" 
                value={form.sueldoEfectivo} 
                onChange={(e) => setForm({ ...form, sueldoEfectivo: e.target.value })} 
              />
            </ModalField>
          </div>

        </div>
      </Modal>

      {/* ── MODAL BITÁCORAS DE RENTA ── */}
      {bitacorasModalOpen && (
        <BitacorasRentaModal
          isOpen={bitacorasModalOpen}
          onClose={() => setBitacorasModalOpen(false)}
          trabajador={selectedWorkerForBitacora}
          bitacoras={bitacoras}
          onAgregarBitacora={handleAgregarBitacora}
        />
      )}

      {/* ── MODAL LIQUIDACIÓN Y FINIQUITO ── */}
      {liquidacionModalOpen && (
        <LiquidacionModal
          isOpen={liquidacionModalOpen}
          onClose={() => setLiquidacionModalOpen(false)}
          trabajador={selectedWorkerForLiquidacion}
          onConfirmarBaja={handleConfirmarBaja}
        />
      )}

    </div>
  );
}
