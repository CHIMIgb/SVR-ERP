"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, UserCheck, UserMinus, Truck, Wrench, Compass, Building2, FileText,
  ClipboardList, CheckCircle2, AlertCircle, Loader2, Calendar,
} from 'lucide-react';
import type { Maquina } from '@svr-erp/shared';
import { apiClient } from '@/lib/api';
import { trabajadoresApi, bitacorasRentaApi, type TrabajadorDTO, type TrabajadorCreateInput, type BitacoraRentaDTO } from '@/lib/api';
import WorkerCard from '@/components/workers/WorkerCard';
import BitacorasRentaModal from '@/components/workers/BitacorasRentaModal';
import LiquidacionModal from '@/components/workers/LiquidacionModal';
import Modal, { ModalField, inputClass, selectClass } from '@/components/layout/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { formatCurrency } from '@/lib/formatters';

const CATEGORIAS = [
  { id: 'Todos', label: 'Todos los Puestos', icon: UserCheck },
  { id: 'Operador', label: '🚜 Operadores de Maquinaria', icon: Truck },
  { id: 'Chofer', label: '🚚 Choferes de Transporte', icon: Compass },
  { id: 'Mecanico', label: '🔧 Mecánicos de Taller', icon: Wrench },
  { id: 'Ingeniero', label: '📐 Ingenieros y Encargados', icon: Building2 },
  { id: 'Administrativo', label: '💼 Administración', icon: FileText },
] as const;

const emptyForm = {
  nombre: '',
  puesto: '',
  categoriaPuesto: 'Operador' as TrabajadorCreateInput['categoriaPuesto'],
  telefono: '',
  entrada: '07:00',
  proyecto: '',
  sueldoFiscal: '2500',
  sueldoEfectivo: '3500',
  metodoPago: 'Mixto' as TrabajadorCreateInput['metodoPago'],
  maquinaId: '',
};

export default function TrabajadoresPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const vista = user?.vistas?.find((v) => v.ruta === '/trabajadores');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  const [trabajadores, setTrabajadores] = useState<TrabajadorDTO[]>([]);
  const [maquinaria, setMaquinaria] = useState<Maquina[]>([]);
  const [proyectos, setProyectos] = useState<{ id: string; nombre: string }[]>([]);
  const [bitacorasCountPorTrabajador, setBitacorasCountPorTrabajador] = useState<Record<string, number>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const [activeMainTab, setActiveMainTab] = useState<'plantilla' | 'bitacoras_renta'>('plantilla');
  const [selectedRole, setSelectedRole] = useState<(typeof CATEGORIAS)[number]['id']>('Todos');
  const [search, setSearch] = useState('');

  const [bitacorasConcentrado, setBitacorasConcentrado] = useState<BitacoraRentaDTO[]>([]);
  const [bitacorasLoading, setBitacorasLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bitacorasModalOpen, setBitacorasModalOpen] = useState(false);
  const [selectedWorkerForBitacora, setSelectedWorkerForBitacora] = useState<TrabajadorDTO | null>(null);
  const [liquidacionModalOpen, setLiquidacionModalOpen] = useState(false);
  const [selectedWorkerForLiquidacion, setSelectedWorkerForLiquidacion] = useState<TrabajadorDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const fetchTrabajadores = useCallback(async () => {
    const res = await trabajadoresApi.listar({ limit: 100 });
    if (res.success) {
      setTrabajadores(res.data.items);
      setErrorCarga(null);

      // Conteo de bitácoras por operador — para el badge del botón en cada card.
      const operadores = res.data.items.filter((t) => t.categoriaPuesto === 'Operador' || t.categoriaPuesto === 'Chofer');
      const conteos = await Promise.all(
        operadores.map((t) => bitacorasRentaApi.listar({ trabajadorId: t.id, limit: 1 })),
      );
      const mapa: Record<string, number> = {};
      operadores.forEach((t, i) => {
        const res2 = conteos[i];
        mapa[t.id] = res2.success ? res2.data.pagination.total : 0;
      });
      setBitacorasCountPorTrabajador(mapa);
    } else {
      setErrorCarga(res.error.message);
    }
    hasLoaded.current = true;
    setInitialLoading(false);
  }, []);

  const fetchBitacorasConcentrado = useCallback(async () => {
    setBitacorasLoading(true);
    const res = await bitacorasRentaApi.listar({ search, limit: 100 });
    if (res.success) setBitacorasConcentrado(res.data.items);
    setBitacorasLoading(false);
  }, [search]);

  useEffect(() => {
    apiClient.get<Maquina[]>('/maquinas').then((res) => {
      if (res.success) setMaquinaria(res.data);
    });
    apiClient.get<{ id: string; nombre: string }[]>('/catalogos/proyectos').then((res) => {
      if (res.success) setProyectos(res.data);
    });
    fetchTrabajadores();
  }, [fetchTrabajadores]);

  useEffect(() => {
    if (activeMainTab === 'bitacoras_renta') fetchBitacorasConcentrado();
  }, [activeMainTab, fetchBitacorasConcentrado]);

  useEffect(() => {
    if (maquinaria.length > 0 && !form.maquinaId) {
      setForm((f) => ({ ...f, maquinaId: maquinaria[0].id }));
    }
  }, [maquinaria, form.maquinaId]);

  const filteredTrabajadores = trabajadores.filter((t) => {
    const matchSearch =
      t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      t.puesto.toLowerCase().includes(search.toLowerCase()) ||
      (t.clienteRentaActual?.toLowerCase().includes(search.toLowerCase()) ?? false);
    if (!matchSearch) return false;
    if (selectedRole !== 'Todos' && t.categoriaPuesto !== selectedRole) return false;
    return true;
  });

  const countByRole = (role: string) => trabajadores.filter((t) => t.categoriaPuesto === role).length;

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, maquinaId: maquinaria[0]?.id ?? '' });
    setModalOpen(true);
  };

  const openEdit = (t: TrabajadorDTO) => {
    setEditingId(t.id);
    setForm({
      nombre: t.nombre,
      puesto: t.puesto,
      categoriaPuesto: t.categoriaPuesto as TrabajadorCreateInput['categoriaPuesto'],
      telefono: t.telefono,
      entrada: t.entrada,
      proyecto: t.proyectos[0] ?? '',
      sueldoFiscal: String(t.sueldoFiscal),
      sueldoEfectivo: String(t.sueldoEfectivo),
      metodoPago: t.metodoPago,
      maquinaId: maquinaria.find((m) => m.id === t.maquinaAsignadaId)?.id ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.puesto.trim()) {
      showToast('Por favor completa nombre y puesto.', 'error');
      return;
    }

    const payload: TrabajadorCreateInput = {
      nombre: form.nombre.trim(),
      puesto: form.puesto.trim(),
      categoriaPuesto: form.categoriaPuesto,
      telefono: form.telefono || '55 0000 0000',
      entrada: form.entrada,
      sueldoFiscal: parseFloat(form.sueldoFiscal) || 2000,
      sueldoEfectivo: parseFloat(form.sueldoEfectivo) || 3000,
      metodoPago: form.metodoPago,
      proyecto: form.proyecto || undefined,
      maquinaId: form.categoriaPuesto === 'Operador' || form.categoriaPuesto === 'Chofer' ? form.maquinaId || undefined : undefined,
    };

    setSubmitting(true);
    const res = editingId ? await trabajadoresApi.actualizar(editingId, payload) : await trabajadoresApi.crear(payload);
    setSubmitting(false);

    if (res.success) {
      showToast(`✅ ${res.data.nombre} ${editingId ? 'actualizado' : 'dado de alta'} correctamente.`, 'success');
      setModalOpen(false);
      fetchTrabajadores();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  const handleOpenBitacorasModal = (worker: TrabajadorDTO) => {
    setSelectedWorkerForBitacora(worker);
    setBitacorasModalOpen(true);
  };

  const handleOpenLiquidacion = (worker: TrabajadorDTO) => {
    setSelectedWorkerForLiquidacion(worker);
    setLiquidacionModalOpen(true);
  };

  if (errorCarga && !hasLoaded.current) {
    return (
      <div className="card p-8 text-center space-y-3 border border-red-200 bg-red-50">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm font-bold text-red-700">{errorCarga}</p>
        <button onClick={fetchTrabajadores} className="btn-primary text-xs">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Gestión de Personal &amp; Operadores</h1>
          <p className="text-slate-500 font-medium">Control de plantilla por categorías, asignación de maquinaria y bitácoras de renta diaria.</p>
        </div>
        {puedeCrear && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedWorkerForLiquidacion(null); setLiquidacionModalOpen(true); }}
              className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
            >
              <UserMinus className="w-4 h-4 text-red-600" /> ⚖️ Liquidar / Finiquito
            </button>
            <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-xs font-black uppercase tracking-wider">
              <Plus className="w-4 h-4" /> Alta de Empleado
            </button>
          </div>
        )}
      </div>

      {/* MAIN TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveMainTab('plantilla')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${activeMainTab === 'plantilla' ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <UserCheck className="w-4 h-4" /> Plantilla de Personal ({trabajadores.length})
        </button>
        <button
          onClick={() => setActiveMainTab('bitacoras_renta')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${activeMainTab === 'bitacoras_renta' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <ClipboardList className="w-4 h-4 text-orange-500" /> Bitácoras de Renta Diaria
        </button>
      </div>

      {initialLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : activeMainTab === 'plantilla' ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIAS.map((r) => {
              const Icon = r.icon;
              const count = r.id === 'Todos' ? trabajadores.length : countByRole(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${selectedRole === r.id ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{r.label}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${selectedRole === r.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>{count}</span>
                </button>
              );
            })}
          </div>

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
                  bitacorasCount={bitacorasCountPorTrabajador[t.id] ?? 0}
                  puedeEditar={puedeEditar}
                  puedeEliminar={puedeEliminar}
                  onOpenBitacoras={handleOpenBitacorasModal}
                  onEdit={openEdit}
                  onLiquidar={handleOpenLiquidacion}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full border border-orange-400/20">
                Soporte Diario de Cobro a Clientes
              </span>
              <h3 className="text-2xl font-black mt-2">Hojas de Bitácora Diaria y Tareo de Maquinaria</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Partes de trabajo que entregan los operadores con horas efectivas, horómetros y firma del cliente para facturación.
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente u operador..."
                className="pl-9 pr-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white placeholder:text-slate-400 focus:outline-none w-64"
              />
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            {bitacorasLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
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
                    {bitacorasConcentrado.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-black text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">{b.folio}</span>
                          <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{b.fecha}</p>
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
                          <div className="text-xs font-black text-slate-900">{b.horasEfectivas + b.horasExtras} hrs</div>
                          <p className="text-[9px] text-slate-400 font-mono">{b.horometroInicial} ➔ {b.horometroFinal}</p>
                        </td>
                        <td className="px-6 py-4">
                          {b.firmaCliente.firmado ? (
                            <div className="text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span>{b.firmaCliente.nombreResidente}</span>
                            </div>
                          ) : (
                            <div className="text-amber-700 text-xs font-bold flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /><span>Pendiente de Firma</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">{formatCurrency(b.importeTotalRenta)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${b.estadoCobro === 'Facturado' ? 'bg-blue-100 text-blue-800' : b.estadoCobro === 'Listo para Facturar' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {b.estadoCobro}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {bitacorasConcentrado.length === 0 && (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">Sin bitácoras registradas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL ALTA/EDICIÓN DE EMPLEADO */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSubmit}
        title={editingId ? 'Editar Empleado' : 'Alta de Empleado por Puesto'}
        confirmLabel={submitting ? 'Guardando…' : editingId ? 'Guardar Cambios' : 'Dar de Alta'}
      >
        <div className="space-y-3">
          <ModalField label="Nombre Completo *">
            <input className={inputClass} placeholder="Juan Pérez García" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </ModalField>

          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Categoría de Puesto *">
              <select className={selectClass} value={form.categoriaPuesto} onChange={(e) => setForm({ ...form, categoriaPuesto: e.target.value as TrabajadorCreateInput['categoriaPuesto'] })}>
                <option value="Operador">🚜 Operador de Maquinaria</option>
                <option value="Chofer">🚚 Chofer de Transporte</option>
                <option value="Mecanico">🔧 Mecánico de Taller</option>
                <option value="Ingeniero">📐 Ingeniero / Encargado</option>
                <option value="Administrativo">💼 Personal Administrativo</option>
              </select>
            </ModalField>
            <ModalField label="Puesto Específico *">
              <input className={inputClass} placeholder="Ej: Operador de Excavadora CAT" value={form.puesto} onChange={(e) => setForm({ ...form, puesto: e.target.value })} />
            </ModalField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Teléfono de Contacto">
              <input className={inputClass} placeholder="55 1234 5678" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </ModalField>
            <ModalField label="Hora de Entrada">
              <input type="time" className={inputClass} value={form.entrada} onChange={(e) => setForm({ ...form, entrada: e.target.value })} />
            </ModalField>
          </div>

          <ModalField label="Obra Asignada">
            <select className={selectClass} value={form.proyecto} onChange={(e) => setForm({ ...form, proyecto: e.target.value })}>
              <option value="">Sin asignar</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.nombre}>{p.nombre}</option>
              ))}
            </select>
          </ModalField>

          {(form.categoriaPuesto === 'Operador' || form.categoriaPuesto === 'Chofer') && (
            <ModalField label="Máquina Asignada">
              <select className={selectClass} value={form.maquinaId} onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}>
                <option value="">Sin asignar</option>
                {maquinaria.map((m) => (
                  <option key={m.id} value={m.id}>{m.id} — {m.nombre}</option>
                ))}
              </select>
            </ModalField>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <ModalField label="Sueldo Fiscal (SPEI Tarjeta)">
              <input type="number" className={inputClass} value={form.sueldoFiscal} onChange={(e) => setForm({ ...form, sueldoFiscal: e.target.value })} />
            </ModalField>
            <ModalField label="Complemento Efectivo (Sobre)">
              <input type="number" className={inputClass} value={form.sueldoEfectivo} onChange={(e) => setForm({ ...form, sueldoEfectivo: e.target.value })} />
            </ModalField>
          </div>
        </div>
      </Modal>

      {/* MODAL BITÁCORAS DE RENTA */}
      {bitacorasModalOpen && selectedWorkerForBitacora && (
        <BitacorasRentaModal
          isOpen={bitacorasModalOpen}
          onClose={() => setBitacorasModalOpen(false)}
          trabajador={selectedWorkerForBitacora}
          maquinaria={maquinaria}
          puedeCrear={puedeCrear}
          onBitacoraCreada={fetchTrabajadores}
        />
      )}

      {/* MODAL LIQUIDACIÓN Y FINIQUITO */}
      {liquidacionModalOpen && (
        <LiquidacionModal
          isOpen={liquidacionModalOpen}
          onClose={() => setLiquidacionModalOpen(false)}
          trabajador={selectedWorkerForLiquidacion}
          trabajadores={trabajadores}
          onLiquidado={fetchTrabajadores}
        />
      )}
    </div>
  );
}
