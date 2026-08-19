"use client";

import React, { useState } from 'react';
import { 
  Plus, FileText, DollarSign, Clock, Search, Filter, 
  CheckCircle, XCircle, ArrowLeft, Trash2, Edit2, Info, Calculator 
} from 'lucide-react';
import { 
  cotizaciones as initialCotizaciones, 
  clientes, 
  apuTemplates, 
  APUItem, 
  Cotizacion 
} from '@/lib/data';
import { useToast } from '@/components/layout/Toast';

export default function CotizacionesPage() {
  const { showToast } = useToast();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(initialCotizaciones);
  const [search, setSearch] = useState('');
  
  // Navigation states
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'materiales' | 'manoDeObra' | 'maquinaria'>('materiales');

  // Form states
  const [clienteId, setClienteId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [usarApu, setUsarApu] = useState(true);
  const [manualMonto, setManualMonto] = useState('');
  const [apuTemplateId, setApuTemplateId] = useState('');

  // APU items
  const [apuMateriales, setApuMateriales] = useState<APUItem[]>([]);
  const [apuManoDeObra, setApuManoDeObra] = useState<APUItem[]>([]);
  const [apuMaquinaria, setApuMaquinaria] = useState<APUItem[]>([]);
  const [cantidadObra, setCantidadObra] = useState<number>(1);
  const [pctIndirectos, setPctIndirectos] = useState<number>(12);
  const [pctUtilidad, setPctUtilidad] = useState<number>(10);
  const [pctFinanciamiento, setPctFinanciamiento] = useState<number>(2);

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

  const handleApuTemplateChange = (templateId: string) => {
    const template = apuTemplates.find(t => t.id === templateId);
    if (template) {
      setApuMateriales(template.materiales.map(m => ({ ...m })));
      setApuManoDeObra(template.manoDeObra.map(m => ({ ...m })));
      setApuMaquinaria(template.maquinaria.map(m => ({ ...m })));
      setApuTemplateId(templateId);
      setDescripcion(template.nombre);
      showToast(`📋 Plantilla "${template.nombre}" cargada.`, 'info');
    } else {
      setApuMateriales([]);
      setApuManoDeObra([]);
      setApuMaquinaria([]);
      setApuTemplateId('');
    }
  };

  // Math Calculations for APU
  const costoMateriales = apuMateriales.reduce((sum, item) => sum + (item.cantidad * item.costoUnitario), 0);
  const costoManoDeObra = apuManoDeObra.reduce((sum, item) => sum + (item.cantidad * item.costoUnitario), 0);
  const costoMaquinaria = apuMaquinaria.reduce((sum, item) => sum + (item.cantidad * item.costoUnitario), 0);
  const costoDirectoUnitario = costoMateriales + costoManoDeObra + costoMaquinaria;

  const mtoIndirectos = costoDirectoUnitario * (pctIndirectos / 100);
  const mtoUtilidad = costoDirectoUnitario * (pctUtilidad / 100);
  const mtoFinanciamiento = costoDirectoUnitario * (pctFinanciamiento / 100);
  const costoTotalUnitario = costoDirectoUnitario + mtoIndirectos + mtoUtilidad + mtoFinanciamiento;
  const montoTotalCalculado = costoTotalUnitario * cantidadObra;

  // Add Item to active lists
  const addApuItem = () => {
    const newItem = { nombre: 'Nuevo Concepto', unidad: 'pza', cantidad: 1, costoUnitario: 0 };
    if (activeTab === 'materiales') setApuMateriales(prev => [...prev, newItem]);
    if (activeTab === 'manoDeObra') setApuManoDeObra(prev => [...prev, newItem]);
    if (activeTab === 'maquinaria') setApuMaquinaria(prev => [...prev, newItem]);
  };

  // Update Item in active lists
  const updateApuItem = (index: number, fields: Partial<APUItem>) => {
    if (activeTab === 'materiales') {
      setApuMateriales(prev => prev.map((item, i) => i === index ? { ...item, ...fields } : item));
    }
    if (activeTab === 'manoDeObra') {
      setApuManoDeObra(prev => prev.map((item, i) => i === index ? { ...item, ...fields } : item));
    }
    if (activeTab === 'maquinaria') {
      setApuMaquinaria(prev => prev.map((item, i) => i === index ? { ...item, ...fields } : item));
    }
  };

  // Delete Item from active lists
  const deleteApuItem = (index: number) => {
    if (activeTab === 'materiales') setApuMateriales(prev => prev.filter((_, i) => i !== index));
    if (activeTab === 'manoDeObra') setApuManoDeObra(prev => prev.filter((_, i) => i !== index));
    if (activeTab === 'maquinaria') setApuMaquinaria(prev => prev.filter((_, i) => i !== index));
  };

  // Form Submit
  const handleCreateCotizacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      showToast('Selecciona un cliente.', 'error');
      return;
    }
    if (!descripcion.trim()) {
      showToast('Ingresa una descripción o concepto.', 'error');
      return;
    }

    const finalMonto = usarApu ? montoTotalCalculado : parseFloat(manualMonto);
    if (isNaN(finalMonto) || finalMonto <= 0) {
      showToast('Ingresa un monto válido.', 'error');
      return;
    }

    const nueva: Cotizacion = {
      id: `Q${Date.now()}`,
      clienteId,
      descripcion: usarApu ? `${descripcion} (${cantidadObra} ${apuTemplates.find(t => t.id === apuTemplateId)?.unidad || 'u'})` : descripcion,
      monto: finalMonto,
      fecha: new Date().toISOString().split('T')[0],
      estado: 'Pendiente'
    };

    setCotizaciones(prev => [nueva, ...prev]);
    setIsCreating(false);
    resetForm();
    showToast(`✅ Cotización registrada por ${formatter.format(finalMonto)}`, 'success');
  };

  const resetForm = () => {
    setClienteId('');
    setDescripcion('');
    setUsarApu(true);
    setManualMonto('');
    setApuTemplateId('');
    setApuMateriales([]);
    setApuManoDeObra([]);
    setApuMaquinaria([]);
    setCantidadObra(1);
  };

  const filtered = cotizaciones.filter(q => {
    const cliente = clientes.find(c => c.id === q.clienteId);
    return q.descripcion.toLowerCase().includes(search.toLowerCase()) || 
           cliente?.empresa.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            {isCreating ? 'Creador de Presupuestos APU' : 'Cotizaciones'}
          </h1>
          <p className="text-slate-500 font-medium">
            {isCreating 
              ? 'Análisis de Precios Unitarios (APU) desglosado por insumos de obra.' 
              : 'Presupuestos enviados, seguimiento de ventas y servicios por contratar.'}
          </p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => { setIsCreating(true); resetForm(); }}
            className="btn-primary flex items-center gap-2 w-fit cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Nueva Cotización
          </button>
        )}
      </div>

      {isCreating ? (
        /* ── CREATOR WORKSPACE ── */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-[fadeScaleIn_0.2s_ease-out]">
          {/* Left Column: General Configuration */}
          <div className="xl:col-span-1 space-y-6">
            <div className="card space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" /> Datos del Cliente
                </h3>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Cancelar
                </button>
              </div>

              {/* Client Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente *</label>
                <select 
                  value={clienteId} 
                  onChange={e => setClienteId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-primary/50 appearance-none"
                >
                  <option value="">Selecciona Cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.empresa} ({c.nombre})</option>
                  ))}
                </select>
              </div>

              {/* Calculation Type Toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Método de Presupuesto</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setUsarApu(true)}
                    className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${usarApu ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Análisis APU
                  </button>
                  <button 
                    type="button"
                    onClick={() => setUsarApu(false)}
                    className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${!usarApu ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Monto Manual
                  </button>
                </div>
              </div>

              {usarApu ? (
                /* APU Form Fields */
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plantilla de Concepto *</label>
                    <select 
                      value={apuTemplateId} 
                      onChange={e => handleApuTemplateChange(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-primary/50 appearance-none"
                    >
                      <option value="">-- Selecciona Plantilla --</option>
                      {apuTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.nombre} ({t.unidad})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad de Obra</label>
                      <input 
                        type="number" 
                        value={cantidadObra} 
                        onChange={e => setCantidadObra(Math.max(1, parseFloat(e.target.value) || 1))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-primary/50"
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidad</label>
                      <div className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold bg-slate-100 text-slate-500 select-none">
                        {apuTemplates.find(t => t.id === apuTemplateId)?.unidad || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Factores Indirectos</h4>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Indirectos %</label>
                        <input 
                          type="number" 
                          value={pctIndirectos}
                          onChange={e => setPctIndirectos(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Utilidad %</label>
                        <input 
                          type="number" 
                          value={pctUtilidad}
                          onChange={e => setPctUtilidad(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Financ. %</label>
                        <input 
                          type="number" 
                          value={pctFinanciamiento}
                          onChange={e => setPctFinanciamiento(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Manual Form Fields */
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción / Concepto *</label>
                    <input 
                      type="text" 
                      value={descripcion} 
                      onChange={e => setDescripcion(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-primary/50"
                      placeholder="Ej. Renta de compactadora por mes"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto Presupuestado (MXN) *</label>
                    <input 
                      type="number" 
                      value={manualMonto} 
                      onChange={e => setManualMonto(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-primary/50"
                      placeholder="125000"
                    />
                  </div>
                </>
              )}

              <button 
                onClick={handleCreateCotizacion}
                className="w-full btn-primary py-3.5 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                Crear Cotización
              </button>
            </div>
          </div>

          {/* Right Column: Interactive APU Desglose Sheet */}
          <div className="xl:col-span-2 space-y-6">
            {usarApu ? (
              <div className="card flex flex-col min-h-[500px]">
                {/* APU Breakdown Tabs */}
                <div className="flex border-b border-slate-100 shrink-0">
                  {[
                    { id: 'materiales', label: 'Materiales', count: apuMateriales.length, color: 'text-orange-500 bg-orange-50' },
                    { id: 'manoDeObra', label: 'Mano de Obra', count: apuManoDeObra.length, color: 'text-blue-500 bg-blue-50' },
                    { id: 'maquinaria', label: 'Maquinaria y Equipo', count: apuMaquinaria.length, color: 'text-purple-500 bg-purple-50' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 py-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center justify-center gap-2 transition-all ${
                        activeTab === tab.id 
                          ? 'border-primary text-primary' 
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tab.label}
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Editable Items Area */}
                <div className="flex-1 py-6 overflow-y-auto max-h-[360px] space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Insumos del Concepto</span>
                    <button 
                      onClick={addApuItem}
                      className="text-xs font-black text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Fila
                    </button>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Descripción</th>
                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">Unidad</th>
                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Cantidad</th>
                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Costo Unit.</th>
                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-28 text-right">Total</th>
                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {activeTab === 'materiales' && apuMateriales.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 pl-2">
                            <input 
                              type="text" 
                              value={item.nombre}
                              onChange={e => updateApuItem(idx, { nombre: e.target.value })}
                              className="w-full bg-transparent border-b border-transparent focus:border-slate-200 text-xs font-bold text-slate-800 outline-none"
                            />
                          </td>
                          <td className="py-2">
                            <input 
                              type="text" 
                              value={item.unidad}
                              onChange={e => updateApuItem(idx, { unidad: e.target.value })}
                              className="w-12 bg-transparent border-b border-transparent focus:border-slate-200 text-xs font-semibold text-slate-600 outline-none"
                            />
                          </td>
                          <td className="py-2">
                            <input 
                              type="number" 
                              value={item.cantidad}
                              onChange={e => updateApuItem(idx, { cantidad: parseFloat(e.target.value) || 0 })}
                              className="w-16 bg-transparent border-b border-transparent focus:border-slate-200 text-xs font-bold text-slate-800 outline-none"
                            />
                          </td>
                          <td className="py-2">
                            <input 
                              type="number" 
                              value={item.costoUnitario}
                              onChange={e => updateApuItem(idx, { costoUnitario: parseFloat(e.target.value) || 0 })}
                              className="w-20 bg-transparent border-b border-transparent focus:border-slate-200 text-xs font-bold text-slate-800 outline-none"
                            />
                          </td>
                          <td className="py-2 text-right text-xs font-black text-slate-700">
                            {formatter.format(item.cantidad * item.costoUnitario)}
                          </td>
                          <td className="py-2 text-center">
                            <button onClick={() => deleteApuItem(idx)} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {activeTab === 'manoDeObra' && apuManoDeObra.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 pl-2">
                            <input 
                              type="text" 
                              value={item.nombre}
                              onChange={e => updateApuItem(idx, { nombre: e.target.value })}
                              className="w-full bg-transparent border-b border-transparent focus:border-slate-200 text-xs font-bold text-slate-800 outline-none"
                            />
                          </td>
                          <td className="py-2">
                            <input 
                              type="text" 
                              value={item.unidad}
                              onChange={e => updateApuItem(idx, { unidad: e.target.value })}
                              className="w-12 bg-transparent border-b border-transparent focus:border-slate-200 text-xs font-semibold text-slate-600 outline-none"
                            />
                          </td>
                          <td className="py-2">
                            <input 
                              type="number" 
                              value={item.cantidad}
                              onChange={e => updateApuItem(idx, { cantidad: parseFloat(e.target.value) || 0 })}
                              className="w-16 bg-transparent border-b border-transparent focus:border-slate-200 text-xs font-bold text-slate-800 outline-none"
                            />
                          </td>
                          <td className="py-2">
                            <input 
                              type="number" 
                              value={item.costoUnitario}
                              onChange={e => updateApuItem(idx, { costoUnitario: parseFloat(e.target.value) || 0 })}
                              className="w-20 bg-transparent border-b border-transparent focus:border-slate-200 text-xs font-bold text-slate-800 outline-none"
                            />
                          </td>
                          <td className="py-2 text-right text-xs font-black text-slate-700">
                            {formatter.format(item.cantidad * item.costoUnitario)}
                          </td>
                          <td className="py-2 text-center">
                            <button onClick={() => deleteApuItem(idx)} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {activeTab === 'maquinaria' && apuMaquinaria.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 pl-2">
                            <input 
                              type="text" 
                              value={item.nombre}
                              onChange={e => updateApuItem(idx, { nombre: e.target.value })}
                              className="w-full bg-transparent border-b border-transparent focus:border-slate-200 text-xs font-bold text-slate-800 outline-none"
                            />
                          </td>
                          <td className="py-2">
                            <input 
                              type="text" 
                              value={item.unidad}
                              onChange={e => updateApuItem(idx, { unidad: e.target.value })}
                              className="w-12 bg-transparent border-b border-transparent focus:border-slate-200 text-xs font-semibold text-slate-600 outline-none"
                            />
                          </td>
                          <td className="py-2">
                            <input 
                              type="number" 
                              value={item.cantidad}
                              onChange={e => updateApuItem(idx, { cantidad: parseFloat(e.target.value) || 0 })}
                              className="w-16 bg-transparent border-b border-transparent focus:border-slate-200 text-xs font-bold text-slate-800 outline-none"
                            />
                          </td>
                          <td className="py-2">
                            <input 
                              type="number" 
                              value={item.costoUnitario}
                              onChange={e => updateApuItem(idx, { costoUnitario: parseFloat(e.target.value) || 0 })}
                              className="w-20 bg-transparent border-b border-transparent focus:border-slate-200 text-xs font-bold text-slate-800 outline-none"
                            />
                          </td>
                          <td className="py-2 text-right text-xs font-black text-slate-700">
                            {formatter.format(item.cantidad * item.costoUnitario)}
                          </td>
                          <td className="py-2 text-center">
                            <button onClick={() => deleteApuItem(idx)} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {((activeTab === 'materiales' && apuMateriales.length === 0) ||
                        (activeTab === 'manoDeObra' && apuManoDeObra.length === 0) ||
                        (activeTab === 'maquinaria' && apuMaquinaria.length === 0)) && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 text-xs font-semibold">
                            Sin insumos cargados. Haz clic en "Agregar Fila" para crear uno.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Calculations Summary Card */}
                <div className="bg-slate-50 border-t border-slate-100 p-6 rounded-b-[1.5rem] mt-auto">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Mat. Unit.</p>
                      <h5 className="text-sm font-black text-slate-800">{formatter.format(costoMateriales)}</h5>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo M.O. Unit.</p>
                      <h5 className="text-sm font-black text-slate-800">{formatter.format(costoManoDeObra)}</h5>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Maq. Unit.</p>
                      <h5 className="text-sm font-black text-slate-800">{formatter.format(costoMaquinaria)}</h5>
                    </div>
                    <div className="border-l border-slate-200 pl-4">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Costo Directo Unit.</p>
                      <h5 className="text-sm font-black text-primary">{formatter.format(costoDirectoUnitario)}</h5>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between border-t border-slate-200/60 pt-4 gap-4">
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                      <span>Indirectos: {formatter.format(mtoIndirectos)}</span>
                      <span>Utilidad: {formatter.format(mtoUtilidad)}</span>
                      <span>Financiamiento: {formatter.format(mtoFinanciamiento)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Total General ({cantidadObra} {apuTemplates.find(t => t.id === apuTemplateId)?.unidad || 'unidad'})
                      </p>
                      <h4 className="text-2xl font-black text-slate-900">{formatter.format(montoTotalCalculado)}</h4>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card h-full flex flex-col justify-center items-center text-center p-12 text-slate-400 min-h-[500px]">
                <Info className="w-16 h-16 text-slate-200 mb-4" />
                <h4 className="text-lg font-black text-slate-700 mb-2">Ingreso de Monto Manual</h4>
                <p className="text-sm max-w-sm">
                  Has seleccionado el método directo. El valor del presupuesto se tomará exactamente de lo que captures en el formulario de la izquierda.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── QUOTES LIST VIEW ── */
        <>
          {/* Search bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por concepto o cliente..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
              />
            </div>
            <button 
              onClick={() => showToast('Filtro por estado — próximamente', 'info')}
              className="flex-1 md:flex-none px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
            >
              <Filter className="w-4 h-4" /> Estado
            </button>
          </div>

          {/* List layout */}
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((q) => {
              const cliente = clientes.find(c => c.id === q.clienteId);
              return (
                <div key={q.id} className="card flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary/50 transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 leading-tight">{q.descripcion}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {cliente ? `${cliente.empresa} — ${cliente.nombre}` : 'Cliente no especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 md:gap-12 w-full md:w-auto border-t md:border-0 border-slate-100 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Total</p>
                      <p className="text-base font-black text-slate-900">{formatter.format(q.monto)}</p>
                    </div>
                    
                    <div className="text-left md:text-right min-w-[100px]">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        q.estado === 'Aceptada' ? 'bg-green-100 text-green-700' : 
                        q.estado === 'Rechazada' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {q.estado}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => showToast(`📋 Detalles de Cotización ${q.id}`, 'info')}
                        className="bg-secondary text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors"
                      >
                        Detalles
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-400 font-medium">No se encontraron cotizaciones.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
