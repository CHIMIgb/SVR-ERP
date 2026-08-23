"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Wrench, Timer, AlertCircle, CheckCircle, Search, Filter, History, AlertTriangle, Loader2 } from 'lucide-react';
import type { RegistroMantenimiento, Maquina } from '@svr-erp/shared';
import { apiClient } from '@/lib/api';
import Modal, { ModalField, inputClass, selectClass } from '@/components/layout/Modal';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';

/** Dentro de este margen de horas antes de la meta, el servicio ya se considera "próximo". */
const UMBRAL_SERVICIO_PROXIMO_HRS = 50;

export default function MantenimientoPage() {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  const [mantenimiento, setMantenimiento] = useState<RegistroMantenimiento[]>([]);
  const [maquinaria, setMaquinaria] = useState<Maquina[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [search, setSearch] = useState('');
  const [soloProximos, setSoloProximos] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    maquinaId: '',
    tipo: 'Preventivo' as 'Preventivo' | 'Correctivo',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    horasServicio: '',
    costo: '',
    proximoServicioHoras: '',
  });

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    const [resMantenimiento, resMaquinas] = await Promise.all([
      apiClient.get<RegistroMantenimiento[]>('/mantenimiento'),
      apiClient.get<Maquina[]>('/maquinas'),
    ]);

    if (!resMantenimiento.success || !resMaquinas.success) {
      setErrorCarga(
        (!resMantenimiento.success && resMantenimiento.error.message) ||
        (!resMaquinas.success && resMaquinas.error.message) ||
        'No se pudo cargar la información de mantenimiento.'
      );
      setCargando(false);
      return;
    }

    setMantenimiento(resMantenimiento.data);
    setMaquinaria(resMaquinas.data);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (maquinaria.length > 0 && !form.maquinaId) {
      setForm((f) => ({ ...f, maquinaId: maquinaria[0].id }));
    }
  }, [maquinaria, form.maquinaId]);

  // Último registro de mantenimiento por máquina, para proyectar próximo servicio vs horómetro actual.
  const ultimoServicioPorMaquina = new Map<string, RegistroMantenimiento>();
  for (const m of mantenimiento) {
    const actual = ultimoServicioPorMaquina.get(m.maquinaId);
    if (!actual || m.fecha > actual.fecha) ultimoServicioPorMaquina.set(m.maquinaId, m);
  }

  const maquinasProximas = maquinaria.filter((maq) => {
    const ultimo = ultimoServicioPorMaquina.get(maq.id);
    if (!ultimo) return false;
    return maq.horometro >= ultimo.proximoServicioHoras - UMBRAL_SERVICIO_PROXIMO_HRS;
  });

  const promedioHorasServicio = mantenimiento.length > 0
    ? mantenimiento.reduce((acc, m) => acc + m.horasServicio, 0) / mantenimiento.length
    : 0;

  const equiposOptimos = Math.max(0, maquinaria.length - maquinasProximas.length);

  const filtered = mantenimiento.filter((m) => {
    const maq = maquinaria.find((x) => x.id === m.maquinaId);
    const matchSearch =
      m.maquinaId.toLowerCase().includes(search.toLowerCase()) ||
      m.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      (maq?.nombre.toLowerCase().includes(search.toLowerCase()) ?? false);

    if (!matchSearch) return false;
    if (soloProximos && !maquinasProximas.some((p) => p.id === m.maquinaId)) return false;
    return true;
  });

  const handleSubmit = async () => {
    if (!form.maquinaId || !form.descripcion.trim() || !form.horasServicio || !form.proximoServicioHoras) {
      showToast('Máquina, descripción, horas de servicio y próximo servicio son obligatorios.', 'error');
      return;
    }

    setGuardando(true);
    const res = await apiClient.post<RegistroMantenimiento>('/mantenimiento', {
      maquinaId: form.maquinaId,
      tipo: form.tipo,
      descripcion: form.descripcion.trim(),
      fecha: form.fecha,
      horasServicio: parseFloat(form.horasServicio) || 0,
      costo: parseFloat(form.costo) || 0,
      proximoServicioHoras: parseFloat(form.proximoServicioHoras) || 0,
    });
    setGuardando(false);

    if (!res.success) {
      showToast(`Error: ${res.error.message}`, 'error');
      return;
    }

    setMantenimiento((prev) => [res.data, ...prev]);
    setModalOpen(false);
    setForm((f) => ({ ...f, descripcion: '', horasServicio: '', costo: '', proximoServicioHoras: '' }));

    showToast(`✅ Servicio de ${res.data.tipo.toLowerCase()} registrado para ${res.data.maquinaId}.`, 'success');
    addNotification({
      titulo: `🔧 Mantenimiento Registrado: ${res.data.maquinaId}`,
      mensaje: `${res.data.descripcion} — ${formatter.format(res.data.costo)}. Próximo servicio a las ${res.data.proximoServicioHoras} hrs.`,
      tipo: 'info',
    });
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Mantenimiento de Flota</h1>
          <p className="text-slate-500 font-medium">Programación de servicios preventivos y registro de reparaciones correctivas.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 w-fit" onClick={() => setModalOpen(true)}>
          <Plus className="w-5 h-5" />
          Programar Servicio
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div
          onClick={() => setSoloProximos(!soloProximos)}
          className={`card flex items-center gap-4 py-6 border-l-4 cursor-pointer transition-all ${
            soloProximos ? 'border-l-orange-500 bg-orange-50/40' : 'border-l-orange-500'
          }`}
        >
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servicios Próximos</p>
            <h4 className="text-xl font-black text-slate-900">
              {maquinasProximas.length} <span className="text-xs text-slate-400 font-medium">máquinas {soloProximos && '(filtrado)'}</span>
            </h4>
          </div>
        </div>
        <div className="card flex items-center gap-4 py-6 border-l-4 border-l-blue-500">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prom. Horas/Servicio</p>
            <h4 className="text-xl font-black text-slate-900">{promedioHorasServicio.toFixed(0)} <span className="text-xs text-slate-400 font-medium">hrs</span></h4>
          </div>
        </div>
        <div className="card flex items-center gap-4 py-6 border-l-4 border-l-green-500">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipos en Óptimo Estado</p>
            <h4 className="text-xl font-black text-slate-900">{equiposOptimos} / {maquinaria.length}</h4>
          </div>
        </div>
      </div>

      {/* Maintenance History */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
             <History className="w-5 h-5 text-slate-400" />
             Historial de Servicios Realizados
          </h3>
          <div className="flex gap-2">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por máquina o descripción..."
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none"
                />
             </div>
             <button
               onClick={() => setSoloProximos(!soloProximos)}
               className={`p-2 border rounded-lg transition-colors ${
                 soloProximos ? 'border-orange-300 bg-orange-50 text-orange-600' : 'border-slate-200 hover:bg-slate-50 text-slate-500'
               }`}
               title="Filtrar solo máquinas con servicio próximo"
             >
                <Filter className="w-4 h-4" />
             </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID Máquina</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo / Descripción</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Horas en Servicio</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Próximo Servicio</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Costo Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => {
                const maquina = maquinaria.find(x => x.id === m.maquinaId);
                const esProximo = maquinasProximas.some((p) => p.id === m.maquinaId) && ultimoServicioPorMaquina.get(m.maquinaId)?.id === m.id;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900">{m.maquinaId}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{maquina?.nombre}</div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-1 inline-block ${
                         m.tipo === 'Preventivo' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                       }`}>
                          {m.tipo}
                       </span>
                       <div className="text-sm font-semibold text-slate-600">{m.descripcion}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{m.fecha}</td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-slate-300" />
                          <span className="text-sm font-black text-slate-900">{m.horasServicio} hrs</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${esProximo ? 'bg-orange-100 text-orange-700' : 'text-slate-500'}`}>
                        {m.proximoServicioHoras} hrs {esProximo && '⚠️'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                       {formatter.format(m.costo)}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">Sin registros que coincidan con la búsqueda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Programar Servicio */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSubmit}
        title="Programar Servicio de Mantenimiento"
        confirmLabel={guardando ? 'Guardando…' : 'Guardar Servicio'}
      >
        <ModalField label="Máquina *">
          <select
            className={selectClass}
            value={form.maquinaId}
            onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
          >
            {maquinaria.map(m => (
              <option key={m.id} value={m.id}>{m.id} — {m.nombre} ({m.horometro.toLocaleString()} hrs)</option>
            ))}
          </select>
        </ModalField>

        <ModalField label="Tipo de Servicio *">
          <select
            className={selectClass}
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as 'Preventivo' | 'Correctivo' })}
          >
            <option value="Preventivo">Preventivo</option>
            <option value="Correctivo">Correctivo</option>
          </select>
        </ModalField>

        <ModalField label="Descripción *">
          <input
            className={inputClass}
            placeholder="Ej: Cambio de aceite y filtros de motor"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </ModalField>

        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Fecha">
            <input
              type="date"
              className={inputClass}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </ModalField>

          <ModalField label="Costo (MXN)">
            <input
              type="number"
              className={inputClass}
              placeholder="5500"
              value={form.costo}
              onChange={(e) => setForm({ ...form, costo: e.target.value })}
            />
          </ModalField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Horas de Servicio (horómetro actual) *">
            <input
              type="number"
              step="0.1"
              className={inputClass}
              placeholder="1200"
              value={form.horasServicio}
              onChange={(e) => setForm({ ...form, horasServicio: e.target.value })}
            />
          </ModalField>

          <ModalField label="Próximo Servicio (hrs) *">
            <input
              type="number"
              step="0.1"
              className={inputClass}
              placeholder="1450"
              value={form.proximoServicioHoras}
              onChange={(e) => setForm({ ...form, proximoServicioHoras: e.target.value })}
            />
          </ModalField>
        </div>
      </Modal>
    </div>
  );
}
