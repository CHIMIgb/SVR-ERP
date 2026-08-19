"use client";

import React, { useState } from 'react';
import { 
  Banknote, CreditCard, Wallet, Download, CheckCircle2, 
  Search, Printer, TrendingDown, Clock, RefreshCw, Zap,
  AlertCircle, Check, FileSpreadsheet, Plus, Edit3, DollarSign,
  ShieldCheck, ArrowUpRight, Building2, HardHat, FileText,
  ChevronRight, Users, Sparkles
} from 'lucide-react';
import { 
  trabajadores as initialTrabajadores, 
  asistenciaSemanalData, 
  Trabajador,
  CategoriaPuesto
} from '@/lib/data';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';
import RecibosNominaModal from '@/components/layout/RecibosNominaModal';
import LiquidacionModal from '@/components/workers/LiquidacionModal';
import Modal, { ModalField, inputClass, selectClass } from '@/components/layout/Modal';

export default function NominaPage() {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  const [trabajadoresList, setTrabajadoresList] = useState<Trabajador[]>(initialTrabajadores);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Todos' | CategoriaPuesto>('Todos');
  const [pagados, setPagados] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState<number | null>(null);
  const [recibosModalOpen, setRecibosModalOpen] = useState(false);
  const [liquidacionModalOpen, setLiquidacionModalOpen] = useState(false);
  const [selectedWorkerForLiquidacion, setSelectedWorkerForLiquidacion] = useState<Trabajador | null>(null);
  
  // Modal de Ajuste de Nómina / Bono / Descuento
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedWorkerForAdjust, setSelectedWorkerForAdjust] = useState<Trabajador | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    tipo: 'Bono' as 'Bono' | 'Descuento' | 'Prestamo',
    monto: '500',
    concepto: 'Bono por productividad en colado continuo'
  });

  // ── Sincronización Automática con Asistencia GPS ────────────────────────────
  const handleSincronizarAsistencia = () => {
    setIsSyncing(true);

    setTimeout(() => {
      setIsSyncing(false);
      let totalExtrasSincronizadas = 0;
      let totalFaltasAplicadas = 0;

      const updated = trabajadoresList.map(t => {
        const registroSemanal = asistenciaSemanalData.find(s => s.trabajadorId === t.id);
        if (registroSemanal) {
          totalExtrasSincronizadas += registroSemanal.totalHorasExtra;
          totalFaltasAplicadas += registroSemanal.totalFaltas;

          const valorFalta = (t.sueldoFiscal + t.sueldoEfectivo) / 6; // Descuento de 1 día de 6

          return {
            ...t,
            horasExtraSemana: registroSemanal.totalHorasExtra,
            descuentosSemana: registroSemanal.totalFaltas > 0 ? Math.round(valorFalta * registroSemanal.totalFaltas) : 0,
            conceptoDescuento: registroSemanal.totalFaltas > 0 ? `${registroSemanal.totalFaltas} inasistencia(s) detectadas` : undefined
          };
        }
        return t;
      });

      setTrabajadoresList(updated);
      setSyncedCount(updated.length);

      showToast(`⚡ ¡Asistencia Sincronizada! Se importaron ${totalExtrasSincronizadas} hrs extras y ${totalFaltasAplicadas} falta(s).`, 'success');
      addNotification({
        titulo: 'Nómina Sincronizada con Asistencia',
        mensaje: `Se actualizaron las horas extras y deducciones de la Semana 17 desde el módulo satelital.`,
        tipo: 'info'
      });
    }, 600);
  };

  // ── Cálculo real por trabajador ─────────────────────────────────────────────
  const calcNeto = (t: Trabajador) => {
    const horasExtra = (t.horasExtraSemana ?? 0) * (t.tarifaHoraExtra ?? 0);
    const descuentos = t.descuentosSemana ?? 0;
    return t.sueldoFiscal + t.sueldoEfectivo + horasExtra - descuentos;
  };

  const filtered = trabajadoresList.filter(t => {
    const matchSearch = 
      t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      t.puesto.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (selectedRole !== 'Todos' && t.categoriaPuesto !== selectedRole) return false;
    return true;
  });

  const totalFiscal   = trabajadoresList.reduce((a, t) => a + t.sueldoFiscal, 0);
  const totalEfectivo = trabajadoresList.reduce((a, t) => a + t.sueldoEfectivo, 0);
  const totalExtras   = trabajadoresList.reduce((a, t) => a + (t.horasExtraSemana ?? 0) * (t.tarifaHoraExtra ?? 0), 0);
  const totalDescs    = trabajadoresList.reduce((a, t) => a + (t.descuentosSemana ?? 0), 0);
  const totalNeto     = trabajadoresList.reduce((a, t) => a + calcNeto(t), 0);

  const togglePagado = (id: string, nombre: string) => {
    setPagados(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast(`↩️ Pago de ${nombre} marcado como pendiente.`, 'warning');
      } else {
        next.add(id);
        showToast(`✅ Pago de ${nombre} confirmado.`, 'success');
      }
      return next;
    });
  };

  const handleMarcarTodosPagados = () => {
    const allIds = new Set(trabajadoresList.map(t => t.id));
    setPagados(allIds);
    showToast(`🎉 Toda la nómina de la Semana 17 ha sido marcada como pagada.`, 'success');
  };

  const handleOpenAdjust = (t: Trabajador) => {
    setSelectedWorkerForAdjust(t);
    setAdjustForm({
      tipo: 'Bono',
      monto: '500',
      concepto: 'Bono por rendimiento y cero incidencias'
    });
    setAdjustModalOpen(true);
  };

  const handleApplyAdjust = () => {
    if (!selectedWorkerForAdjust) return;
    const monto = parseFloat(adjustForm.monto) || 0;

    setTrabajadoresList(prev => prev.map(t => {
      if (t.id === selectedWorkerForAdjust.id) {
        if (adjustForm.tipo === 'Bono') {
          return {
            ...t,
            sueldoEfectivo: t.sueldoEfectivo + monto
          };
        } else {
          return {
            ...t,
            descuentosSemana: (t.descuentosSemana ?? 0) + monto,
            conceptoDescuento: adjustForm.concepto
          };
        }
      }
      return t;
    }));

    setAdjustModalOpen(false);
    showToast(`✅ Ajuste de ${fmt.format(monto)} aplicado a ${selectedWorkerForAdjust.nombre}.`, 'success');
  };

  // Descarga de layout bancario SPEI BBVA
  const handleDownloadSpeiLayout = () => {
    const csvContent = "Cuenta_Origen,Banco_Destino,Cuenta_CLABE,Nombre_Beneficiario,Monto,Concepto\n" +
      trabajadoresList.map(t => `0123456789,BBVA,012180000000000000,"${t.nombre}",${t.sueldoFiscal},"Nomina SVR Sem 17"`).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Layout_SPEI_Nomina_Semana17_SVR.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('📥 Layout bancario SPEI generado y descargado correctamente.', 'success');
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
                Nómina Semana 17 Lista para Dispersión
              </span>
              <span className="text-xs text-slate-400 font-bold">
                Total Neto: <strong className="text-emerald-400">{fmt.format(totalNeto)}</strong>
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              Gestión y Dispersión de Nómina
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl font-medium">
              Esquema de nómina mixta (Sueldo fiscal por SPEI + Complemento en sobre de efectivo), cálculo satelital de horas extras y deducciones por inasistencia.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Botón Sincronizar Asistencia GPS */}
            <button 
              onClick={handleSincronizarAsistencia}
              disabled={isSyncing}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 text-emerald-200 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : '⚡ Sincronizar Asistencia'}
            </button>

            {/* Botón Imprimir Sobres y Recibos con Firma */}
            <button 
              onClick={() => setRecibosModalOpen(true)} 
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-white/10 backdrop-blur-md"
            >
              <Printer className="w-4 h-4 text-orange-400" /> Sobres con Firma
            </button>

            {/* Botón Liquidar / Finiquito */}
            <button 
              onClick={() => {
                setSelectedWorkerForLiquidacion(null);
                setLiquidacionModalOpen(true);
              }} 
              className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-red-500/40 backdrop-blur-md"
            >
              <Banknote className="w-4 h-4 text-red-400" /> ⚖️ Liquidar / Finiquito
            </button>

            {/* Layout SPEI */}
            <button 
              onClick={handleDownloadSpeiLayout} 
              className="btn-primary flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20"
            >
              <Download className="w-4 h-4" /> Layout SPEI BBVA
            </button>

          </div>
        </div>
      </div>

      {/* ── 2. PABELLONES DE MÉTRICAS CLAVE (KPIS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* PABELLÓN 1: Fiscal por SPEI */}
        <div className="card group hover:border-blue-300 transition-all border p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dispersión SPEI (Fiscal)</p>
              <h3 className="text-2xl font-black text-slate-900">{fmt.format(totalFiscal)}</h3>
            </div>
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-200/60 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-blue-700 font-mono">Banca BBVA / Banorte</span>
            <span className="text-slate-400">Transferencia Electrónica</span>
          </div>
        </div>

        {/* PABELLÓN 2: Efectivo en Sobres */}
        <div className="card group hover:border-orange-300 transition-all border p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Efectivo para Sobres (Rayo)</p>
              <h3 className="text-2xl font-black text-slate-900">{fmt.format(totalEfectivo)}</h3>
            </div>
            <div className="w-11 h-11 bg-orange-50 text-primary rounded-2xl flex items-center justify-center border border-orange-200/60 group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-orange-700">Retiro físico en ventanilla</span>
            <span className="text-slate-400">Entrega en sobre</span>
          </div>
        </div>

        {/* PABELLÓN 3: Horas Extras GPS */}
        <div className="card group hover:border-emerald-300 transition-all border p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Horas Extras GPS</p>
              <h3 className="text-2xl font-black text-emerald-700">+{fmt.format(totalExtras)}</h3>
            </div>
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-200/60 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-emerald-700 font-mono">13.0 hrs acumuladas</span>
            <span className="text-slate-400">Validadas en campo</span>
          </div>
        </div>

        {/* PABELLÓN 4: Progreso de Pagos */}
        <div className="card group hover:border-purple-300 transition-all border p-5 relative overflow-hidden bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estatus de Liquidación</p>
              <h3 className="text-2xl font-black text-slate-900">
                {pagados.size} <span className="text-sm font-bold text-slate-400">/ {trabajadoresList.length} pagados</span>
              </h3>
            </div>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform ${
              pagados.size === trabajadoresList.length ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-600'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            {pagados.size === trabajadoresList.length ? (
              <span className="text-emerald-600 font-black">✓ Nómina 100% Liquidada</span>
            ) : (
              <button 
                onClick={handleMarcarTodosPagados}
                className="text-primary hover:underline font-black flex items-center gap-1"
              >
                Liquidar Todos en 1 Clic <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ── 3. FILTROS POR CATEGORÍA DE PUESTO ── */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'Todos', label: 'Todos los Puestos' },
          { id: 'Operador', label: '🚜 Operadores' },
          { id: 'Chofer', label: '🚚 Choferes' },
          { id: 'Mecanico', label: '🔧 Mecánicos' },
          { id: 'Ingeniero', label: '📐 Ingenieros' },
          { id: 'Administrativo', label: '💼 Administración' },
        ].map(r => (
          <button
            key={r.id}
            onClick={() => setSelectedRole(r.id as any)}
            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
              selectedRole === r.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* ── 4. TABLA PRINCIPAL DE NÓMINA ── */}
      <div className="card p-0 overflow-hidden border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-slate-900 text-base">Detalle de Dispersión y Sobres Semanales</h3>
            <p className="text-xs text-slate-400 font-medium">Desglose transparente de sueldos mixtos, horas extras satelitales y deducciones.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Filtrar por empleado..." 
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary/50 w-60 bg-slate-50 focus:bg-white" 
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Trabajador &amp; Rol</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Esquema</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Fiscal (SPEI)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Efectivo (Sobre)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Horas Extra</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Deducciones</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total Neto</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Ajustes</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(t => {
                const extras    = (t.horasExtraSemana ?? 0) * (t.tarifaHoraExtra ?? 0);
                const descs     = t.descuentosSemana ?? 0;
                const neto      = calcNeto(t);
                const isPagado  = pagados.has(t.id);

                return (
                  <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors ${isPagado ? 'bg-emerald-50/20' : ''}`}>
                    
                    {/* Worker */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-secondary text-white rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                          {t.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm leading-tight">{t.nombre}</div>
                          <div className="text-[10px] font-bold text-primary mt-0.5">{t.puesto} ({t.categoriaPuesto})</div>
                        </div>
                      </div>
                    </td>

                    {/* Method */}
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        t.metodoPago === 'Tarjeta' ? 'bg-blue-100 text-blue-700' :
                        t.metodoPago === 'Mixto'   ? 'bg-purple-100 text-purple-700' :
                                                     'bg-orange-100 text-orange-700'
                      }`}>
                        {t.metodoPago}
                      </span>
                    </td>

                    {/* Fiscal */}
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                      {fmt.format(t.sueldoFiscal)}
                    </td>

                    {/* Cash */}
                    <td className="px-6 py-4 text-right text-sm font-black text-primary">
                      {t.sueldoEfectivo > 0 ? fmt.format(t.sueldoEfectivo) : '—'}
                    </td>

                    {/* Overtime */}
                    <td className="px-6 py-4 text-right">
                      {extras > 0 ? (
                        <div>
                          <span className="text-sm font-black text-emerald-600">+{fmt.format(extras)}</span>
                          <div className="text-[9px] text-emerald-700 font-bold">({t.horasExtraSemana} hrs extras)</div>
                        </div>
                      ) : <span className="text-slate-300 text-sm font-medium">—</span>}
                    </td>

                    {/* Deductions */}
                    <td className="px-6 py-4 text-right">
                      {descs > 0 ? (
                        <div>
                          <span className="text-sm font-black text-red-500">−{fmt.format(descs)}</span>
                          <div className="text-[9px] text-red-600 font-medium truncate max-w-[140px]" title={t.conceptoDescuento}>{t.conceptoDescuento}</div>
                        </div>
                      ) : <span className="text-slate-300 text-sm font-medium">—</span>}
                    </td>

                    {/* Net Total */}
                    <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                      {fmt.format(neto)}
                    </td>

                    {/* Adjust button */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenAdjust(t)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Ajustar Bono o Descuento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* Paid checkbox action */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => togglePagado(t.id, t.nombre)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          isPagado 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isPagado ? 'Pagado' : 'Pendiente'}
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white border-t-2 border-slate-800 font-black">
                <td colSpan={2} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Totales Semana 17</td>
                <td className="px-6 py-4 text-right text-sm">{fmt.format(totalFiscal)}</td>
                <td className="px-6 py-4 text-right text-sm text-orange-400">{fmt.format(totalEfectivo)}</td>
                <td className="px-6 py-4 text-right text-sm text-emerald-400">+{fmt.format(totalExtras)}</td>
                <td className="px-6 py-4 text-right text-sm text-red-400">−{fmt.format(totalDescs)}</td>
                <td className="px-6 py-4 text-right text-base text-emerald-400">{fmt.format(totalNeto)}</td>
                <td colSpan={2} className="px-6 py-4 text-right text-xs text-slate-400">
                  {pagados.size} de {trabajadoresList.length} liquidados
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Recibos Modal */}
      {recibosModalOpen && (
        <RecibosNominaModal
          isOpen={recibosModalOpen}
          onClose={() => setRecibosModalOpen(false)}
          workersList={trabajadoresList}
        />
      )}

      {/* ── MODAL LIQUIDACIÓN Y FINIQUITO ── */}
      {liquidacionModalOpen && (
        <LiquidacionModal
          isOpen={liquidacionModalOpen}
          onClose={() => setLiquidacionModalOpen(false)}
          trabajador={selectedWorkerForLiquidacion}
          onConfirmarBaja={(id, tipo, monto) => {
            setTrabajadoresList(prev => prev.filter(t => t.id !== id));
            showToast(`⚖️ Liquidación completada. Empleado dado de baja de la nómina activa.`, 'success');
          }}
        />
      )}

      {/* ── MODAL AJUSTE DE NÓMINA (BONO / DESCUENTO / PRÉSTAMO) ── */}
      {adjustModalOpen && selectedWorkerForAdjust && (
        <Modal
          isOpen={adjustModalOpen}
          onClose={() => setAdjustModalOpen(false)}
          onConfirm={handleApplyAdjust}
          title={`Ajuste de Nómina: ${selectedWorkerForAdjust.nombre}`}
          confirmLabel="Aplicar Ajuste"
        >
          <div className="space-y-3">
            <ModalField label="Tipo de Ajuste">
              <select
                className={selectClass}
                value={adjustForm.tipo}
                onChange={e => setAdjustForm({ ...adjustForm, tipo: e.target.value as any })}
              >
                <option value="Bono">🎁 Bono de Productividad / Asistencia (+ Efectivo)</option>
                <option value="Descuento">🔻 Descuento por Falta o Daño (− Deducción)</option>
                <option value="Prestamo">💳 Cobro de Anticipo / Préstamo (− Deducción)</option>
              </select>
            </ModalField>

            <ModalField label="Monto del Ajuste ($ MXN)">
              <input
                type="number"
                className={inputClass}
                placeholder="500"
                value={adjustForm.monto}
                onChange={e => setAdjustForm({ ...adjustForm, monto: e.target.value })}
              />
            </ModalField>

            <ModalField label="Concepto / Justificación">
              <input
                type="text"
                className={inputClass}
                placeholder="Ej: Bono por colado nocturno / Descuento préstamo"
                value={adjustForm.concepto}
                onChange={e => setAdjustForm({ ...adjustForm, concepto: e.target.value })}
              />
            </ModalField>
          </div>
        </Modal>
      )}

    </div>
  );
}
