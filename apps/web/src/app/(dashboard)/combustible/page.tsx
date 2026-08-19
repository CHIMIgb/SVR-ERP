"use client";

import React, { useState } from 'react';
import { 
  Plus, Fuel, DollarSign, BarChart2, Search, Filter, 
  AlertTriangle, ShieldAlert, ShieldCheck, TrendingUp,
  Activity, ArrowUpRight, CheckCircle2, Droplets
} from 'lucide-react';
import { cargasCombustible as initialCargas, maquinaria, CargaCombustible } from '@/lib/data';
import Modal, { ModalField, inputClass, selectClass } from '@/components/layout/Modal';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';

export default function CombustiblePage() {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  const [cargas, setCargas] = useState<CargaCombustible[]>(initialCargas);
  const [search, setSearch] = useState('');
  const [filterAlertsOnly, setFilterAlertsOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [form, setForm] = useState({ 
    maquinaId: maquinaria[0]?.id ?? '', 
    litros: '120', 
    costo: '2760', 
    lugar: 'Autoconsumo en Obra', 
    operador: '',
    horasTrabajadas: '8.0'
  });

  const totalLitros = cargas.reduce((acc, curr) => acc + curr.litros, 0);
  const totalCosto = cargas.reduce((acc, curr) => acc + curr.costo, 0);
  const totalAlertasOrdena = cargas.filter(c => c.alertaOrdena).length;

  const filtered = cargas.filter((c) => {
    const maq = maquinaria.find(m => m.id === c.maquinaId);
    const matchSearch = 
      c.maquinaId.toLowerCase().includes(search.toLowerCase()) ||
      c.operador.toLowerCase().includes(search.toLowerCase()) ||
      maq?.nombre.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (filterAlertsOnly && !c.alertaOrdena) return false;
    return true;
  });

  const handleSubmit = () => {
    if (!form.maquinaId || !form.litros) {
      showToast('Máquina y litros son obligatorios.', 'error');
      return;
    }

    const maq = maquinaria.find(m => m.id === form.maquinaId);
    const lts = parseFloat(form.litros) || 0;
    const hrs = parseFloat(form.horasTrabajadas) || 8.0;
    const esperado = maq?.consumoEsperadoLtsHora ?? 14.0;
    const rendimientoCalculado = hrs > 0 ? lts / hrs : esperado;
    const desviacion = ((rendimientoCalculado - esperado) / esperado) * 100;
    const esAlerta = desviacion > 35; // Más del 35% de sobreconsumo

    const nueva: CargaCombustible = {
      id: `F${Date.now()}`,
      maquinaId: form.maquinaId,
      fecha: new Date().toISOString().split('T')[0],
      litros: lts,
      costo: parseFloat(form.costo) || lts * 23,
      operador: form.operador || maq?.operador || 'Sin registrar',
      lugar: form.lugar || 'Autoconsumo Obra',
      horometroActual: (maq?.horometro ?? 1000) + hrs,
      horasTrabajadasPeriodo: hrs,
      consumoEsperadoLtsHora: esperado,
      rendimientoLtsHora: parseFloat(rendimientoCalculado.toFixed(2)),
      alertaOrdena: esAlerta,
      desviacionPorcentaje: parseFloat(desviacion.toFixed(1))
    };

    setCargas((prev) => [nueva, ...prev]);
    setModalOpen(false);

    if (esAlerta) {
      showToast(`🚨 ALERTA: Rendimiento anormal de ${rendimientoCalculado.toFixed(1)} L/hr (+${desviacion.toFixed(0)}%) en ${maq?.nombre}.`, 'error');
      addNotification({
        titulo: `🚨 Alerta de Ordeña/Sobreconsumo: ${maq?.nombre}`,
        mensaje: `Registró ${rendimientoCalculado.toFixed(1)} L/hr (+${desviacion.toFixed(0)}% vs esperado de ${esperado} L/hr). Operador: ${nueva.operador}.`,
        tipo: 'alerta'
      });
    } else {
      showToast(`✅ Carga de ${nueva.litros}L registrada. Rendimiento óptimo (${rendimientoCalculado.toFixed(1)} L/hr).`, 'success');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Control de Combustible y Rendimiento</h1>
            {totalAlertasOrdena > 0 && (
              <span className="flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-red-200 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> {totalAlertasOrdena} Alerta(s) de Ordeña
              </span>
            )}
          </div>
          <p className="text-slate-500 font-medium">Telemetría de consumo en Litros/Hora, detección de fugas, ordeña y costos operativos.</p>
        </div>

        <div className="flex gap-2">
          <button className="btn-primary flex items-center gap-2 text-xs font-black uppercase tracking-wider" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" /> Registrar Carga Diésel
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="card flex items-center gap-4 py-5">
          <div className="w-12 h-12 bg-orange-50 text-primary rounded-2xl flex items-center justify-center border border-orange-200/60">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Litros Totales</p>
            <h4 className="text-xl font-black text-slate-900">{totalLitros.toLocaleString()} L</h4>
          </div>
        </div>

        <div className="card flex items-center gap-4 py-5">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-200/60">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gasto Total Diésel</p>
            <h4 className="text-xl font-black text-slate-900">{formatter.format(totalCosto)}</h4>
          </div>
        </div>

        <div className="card flex items-center gap-4 py-5">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-200/60">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rendimiento Promedio</p>
            <h4 className="text-xl font-black text-slate-900">14.2 L/hr</h4>
          </div>
        </div>

        <div 
          onClick={() => setFilterAlertsOnly(!filterAlertsOnly)}
          className={`card flex items-center gap-4 py-5 cursor-pointer transition-all border ${
            totalAlertasOrdena > 0 
              ? filterAlertsOnly ? 'border-red-500 bg-red-50 shadow-md' : 'border-red-200 bg-red-50/40 hover:border-red-300' 
              : 'border-slate-200'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
            totalAlertasOrdena > 0 ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-slate-100 text-slate-400'
          }`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">Alertas de Ordeña</p>
            <h4 className={`text-xl font-black ${totalAlertasOrdena > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {totalAlertasOrdena} {filterAlertsOnly && '(Filtrado)'}
            </h4>
          </div>
        </div>

      </div>

      {/* Recent Loads Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Historial de Cargas y Telemetría Litros/Hora</h3>
            <p className="text-xs text-slate-400 font-medium">Cruza horas trabajadas de horómetro vs litros cargados para detectar anomalías.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar máquina u operador..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary/50 w-60 bg-slate-50 focus:bg-white"
              />
            </div>

            <button
              onClick={() => setFilterAlertsOnly(!filterAlertsOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                filterAlertsOnly ? 'bg-red-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {filterAlertsOnly ? 'Ver Todas' : 'Solo Alertas'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Máquina</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha &amp; Lugar</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Litros &amp; Costo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Horas Periodo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Rendimiento (L/hr)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado Telemetría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((carga) => {
                const maquina = maquinaria.find(m => m.id === carga.maquinaId);
                return (
                  <tr key={carga.id} className={`hover:bg-slate-50/50 transition-colors ${carga.alertaOrdena ? 'bg-red-50/30' : ''}`}>
                    
                    {/* Machine */}
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900 text-sm">{carga.maquinaId} — {maquina?.nombre}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Operador: {carga.operador}</div>
                    </td>

                    {/* Date & Location */}
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-slate-800">{carga.fecha}</div>
                      <div className="text-[10px] text-slate-500 font-medium truncate max-w-[180px]">{carga.lugar}</div>
                    </td>

                    {/* Liters and Cost */}
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-black text-slate-900">{carga.litros} L</div>
                      <div className="text-xs font-bold text-primary">{formatter.format(carga.costo)}</div>
                    </td>

                    {/* Hours worked */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {carga.horasTrabajadasPeriodo ?? 8.0} hrs
                      </span>
                    </td>

                    {/* Telemetry Rendimiento L/hr */}
                    <td className="px-6 py-4">
                      <div>
                        <span className={`text-sm font-black ${carga.alertaOrdena ? 'text-red-600' : 'text-slate-900'}`}>
                          {carga.rendimientoLtsHora ?? 14.0} L/hr
                        </span>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Esperado: {carga.consumoEsperadoLtsHora ?? 14.0} L/hr
                        </div>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      {carga.alertaOrdena ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-100 text-red-800 border border-red-200 text-xs font-black animate-pulse">
                          <ShieldAlert className="w-4 h-4 text-red-600" />
                          <span>🚨 Posible Ordeña (+{carga.desviacionPorcentaje}%)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-green-50 text-green-800 border border-green-200 text-xs font-bold">
                          <ShieldCheck className="w-4 h-4 text-green-600" />
                          <span>Rendimiento Normal</span>
                        </div>
                      )}
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

      {/* Modal Registrar Carga con Telemetría */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSubmit}
        title="Registrar Carga de Diésel con Telemetría"
        confirmLabel="Validar y Guardar Carga"
      >
        <ModalField label="Máquina Asignada *">
          <select 
            className={selectClass} 
            value={form.maquinaId} 
            onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
          >
            {maquinaria.map(m => (
              <option key={m.id} value={m.id}>
                {m.id} — {m.nombre} (Consumo normal: {m.consumoEsperadoLtsHora ?? 14} L/hr)
              </option>
            ))}
          </select>
        </ModalField>

        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Litros Cargados *">
            <input 
              type="number" 
              className={inputClass} 
              placeholder="120" 
              value={form.litros} 
              onChange={(e) => setForm({ ...form, litros: e.target.value, costo: String((parseFloat(e.target.value) || 0) * 23) })} 
            />
          </ModalField>

          <ModalField label="Horas Operadas en Periodo">
            <input 
              type="number" 
              step="0.5"
              className={inputClass} 
              placeholder="8.0" 
              value={form.horasTrabajadas} 
              onChange={(e) => setForm({ ...form, horasTrabajadas: e.target.value })} 
            />
          </ModalField>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-500">Rendimiento Estimado:</span>
          <span className="font-black text-slate-900 text-sm">
            {((parseFloat(form.litros) || 0) / (parseFloat(form.horasTrabajadas) || 1)).toFixed(2)} L/hr
          </span>
        </div>

        <ModalField label="Costo Total Diésel (MXN)">
          <input 
            type="number" 
            className={inputClass} 
            placeholder="2760" 
            value={form.costo} 
            onChange={(e) => setForm({ ...form, costo: e.target.value })} 
          />
        </ModalField>

        <ModalField label="Punto de Carga / Gasolinera">
          <input 
            className={inputClass} 
            placeholder="Autoconsumo en Obra Valle Sur" 
            value={form.lugar} 
            onChange={(e) => setForm({ ...form, lugar: e.target.value })} 
          />
        </ModalField>

        <ModalField label="Operador que Recibió">
          <input 
            className={inputClass} 
            placeholder="Juan Pérez" 
            value={form.operador} 
            onChange={(e) => setForm({ ...form, operador: e.target.value })} 
          />
        </ModalField>
      </Modal>

    </div>
  );
}
