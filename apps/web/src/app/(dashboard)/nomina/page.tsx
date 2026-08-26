"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CreditCard, Wallet, Download, CheckCircle2,
  Search, Printer, Clock, Zap,
  AlertCircle, Edit3,
  ChevronRight, Loader2
} from 'lucide-react';
import { nominaApi, type NominaRowDTO, type PeriodoNominaDTO, type RegistrarAjusteInput } from '@/lib/api';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import RecibosNominaModal from '@/components/layout/RecibosNominaModal';
import Modal, { ModalField, inputClass, selectClass } from '@/components/layout/Modal';

const CATEGORIA_PILLS = [
  { id: 'Todos', label: 'Todos los Puestos' },
  { id: 'Operador', label: '🚜 Operadores' },
  { id: 'Chofer', label: '🚚 Choferes' },
  { id: 'Mecanico', label: '🔧 Mecánicos' },
  { id: 'Ingeniero', label: '📐 Ingenieros' },
  { id: 'Administrativo', label: '💼 Administración' },
] as const;

export default function NominaPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  const vista = user?.vistas?.find((v) => v.ruta === '/nomina');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeExportar = vista?.puedeExportar ?? false;

  const [periodo, setPeriodo] = useState<PeriodoNominaDTO | null>(null);
  const [items, setItems] = useState<NominaRowDTO[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('Todos');
  const [isSyncing, setIsSyncing] = useState(false);
  const [recibosModalOpen, setRecibosModalOpen] = useState(false);

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedWorkerForAdjust, setSelectedWorkerForAdjust] = useState<NominaRowDTO | null>(null);
  const [adjustForm, setAdjustForm] = useState<RegistrarAjusteInput>({
    tipo: 'Bono',
    monto: 500,
    concepto: 'Bono por productividad en colado continuo',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchNomina = useCallback(async () => {
    const res = await nominaApi.actual();
    if (res.success) {
      setPeriodo(res.data.periodo);
      setItems(res.data.items);
      setErrorCarga(null);
    } else {
      setErrorCarga(res.error.message);
    }
    hasLoaded.current = true;
    setInitialLoading(false);
  }, []);

  useEffect(() => {
    fetchNomina();
  }, [fetchNomina]);

  const handleSincronizarAsistencia = async () => {
    if (!periodo) return;
    setIsSyncing(true);
    try {
      const res = await nominaApi.sincronizarAsistencia(periodo.id);
      if (!res.success) throw new Error(res.error.message);
      setItems(res.data.items);
      showToast(
        `⚡ ¡Asistencia Sincronizada! Se importaron ${res.data.totalHorasExtraSincronizadas}h extras y ${res.data.totalFaltasAplicadas} falta(s).`,
        'success',
      );
      addNotification({
        titulo: 'Nómina Sincronizada con Asistencia',
        mensaje: `Se actualizaron las horas extras y deducciones de ${periodo.nombre} desde el módulo satelital.`,
        tipo: 'info',
      });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo sincronizar con asistencia.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const filtered = items.filter((i) => {
    const matchSearch =
      i.trabajadorNombre.toLowerCase().includes(search.toLowerCase()) ||
      i.puesto.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (selectedRole !== 'Todos' && i.categoriaPuesto !== selectedRole) return false;
    return true;
  });

  const totalFiscal = items.reduce((a, i) => a + i.sueldoFiscal, 0);
  const totalEfectivo = items.reduce((a, i) => a + i.sueldoEfectivo, 0);
  const totalPercepciones = items.reduce((a, i) => a + i.totalPercepciones, 0);
  const totalDescs = items.reduce((a, i) => a + i.totalDeducciones, 0);
  const totalNeto = items.reduce((a, i) => a + i.totalNeto, 0);
  const totalHorasExtraHoras = items.reduce((a, i) => a + i.horasExtra, 0);
  const pagadosCount = items.filter((i) => i.estado === 'Pagado').length;

  const togglePagado = async (item: NominaRowDTO) => {
    const nuevoEstado = item.estado === 'Pagado' ? 'Pendiente' : 'Pagado';
    const res = await nominaApi.actualizarEstado(item.id, nuevoEstado);
    if (!res.success) {
      showToast(res.error.message, 'error');
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? res.data : i)));
    showToast(
      nuevoEstado === 'Pagado' ? `✅ Pago de ${item.trabajadorNombre} confirmado.` : `↩️ Pago de ${item.trabajadorNombre} marcado como pendiente.`,
      nuevoEstado === 'Pagado' ? 'success' : 'warning',
    );
  };

  const handleMarcarTodosPagados = async () => {
    if (!periodo) return;
    const res = await nominaApi.pagarTodos(periodo.id);
    if (!res.success) {
      showToast(res.error.message, 'error');
      return;
    }
    setItems(res.data.items);
    showToast(`🎉 Toda la nómina de ${periodo.nombre} ha sido marcada como pagada.`, 'success');
  };

  const handleOpenAdjust = (item: NominaRowDTO) => {
    setSelectedWorkerForAdjust(item);
    setAdjustForm({ tipo: 'Bono', monto: 500, concepto: 'Bono por rendimiento y cero incidencias' });
    setAdjustModalOpen(true);
  };

  const handleApplyAdjust = async () => {
    if (!selectedWorkerForAdjust) return;
    setSubmitting(true);
    try {
      const res = await nominaApi.registrarAjuste(selectedWorkerForAdjust.id, adjustForm);
      if (!res.success) throw new Error(res.error.message);
      setItems((prev) => prev.map((i) => (i.id === res.data.id ? res.data : i)));
      setAdjustModalOpen(false);
      showToast(`✅ Ajuste de ${fmt.format(adjustForm.monto)} aplicado a ${selectedWorkerForAdjust.trabajadorNombre}.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo aplicar el ajuste.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadSpeiLayout = () => {
    const csvContent = "Cuenta_Origen,Banco_Destino,Cuenta_CLABE,Nombre_Beneficiario,Monto,Concepto\n" +
      items.map((i) => `0123456789,BBVA,012180000000000000,"${i.trabajadorNombre}",${i.sueldoFiscal},"Nomina SVR ${periodo?.codigo ?? ''}"`).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Layout_SPEI_Nomina_${periodo?.codigo ?? 'SVR'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('📥 Layout bancario SPEI generado y descargado correctamente.', 'success');
  };

  if (errorCarga && !hasLoaded.current) {
    return (
      <div className="card p-8 text-center space-y-3 border border-red-200 bg-red-50">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm font-bold text-red-700">{errorCarga}</p>
        <button onClick={fetchNomina} className="btn-primary text-xs">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── 1. HEADER EJECUTIVO ── */}
      <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl overflow-hidden border border-slate-800">

        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {periodo ? `Nómina ${periodo.nombre} Lista para Dispersión` : 'Cargando periodo...'}
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

          <div className="flex flex-wrap items-center gap-2.5">
            {puedeEditar && (
              <button
                onClick={handleSincronizarAsistencia}
                disabled={isSyncing || !periodo}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 text-emerald-200 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : '⚡ Sincronizar Asistencia'}
              </button>
            )}

            <button
              onClick={() => setRecibosModalOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-white/10 backdrop-blur-md"
            >
              <Printer className="w-4 h-4 text-orange-400" /> Sobres con Firma
            </button>

            {puedeExportar && (
              <button
                onClick={handleDownloadSpeiLayout}
                className="btn-primary flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20"
              >
                <Download className="w-4 h-4" /> Layout SPEI BBVA
              </button>
            )}
          </div>
        </div>
      </div>

      {initialLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
      <>
      {/* ── 2. PABELLONES DE MÉTRICAS CLAVE (KPIS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

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

        <div className="card group hover:border-emerald-300 transition-all border p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Horas Extras GPS</p>
              <h3 className="text-2xl font-black text-emerald-700">{totalHorasExtraHoras}h</h3>
            </div>
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-200/60 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-emerald-700 font-mono">Percepciones: {fmt.format(totalPercepciones)}</span>
            <span className="text-slate-400">Validadas en campo</span>
          </div>
        </div>

        <div className="card group hover:border-purple-300 transition-all border p-5 relative overflow-hidden bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estatus de Liquidación</p>
              <h3 className="text-2xl font-black text-slate-900">
                {pagadosCount} <span className="text-sm font-bold text-slate-400">/ {items.length} pagados</span>
              </h3>
            </div>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform ${
              pagadosCount === items.length && items.length > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-600'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            {pagadosCount === items.length && items.length > 0 ? (
              <span className="text-emerald-600 font-black">✓ Nómina 100% Liquidada</span>
            ) : puedeEditar ? (
              <button
                onClick={handleMarcarTodosPagados}
                className="text-primary hover:underline font-black flex items-center gap-1"
              >
                Liquidar Todos en 1 Clic <ChevronRight className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-slate-400">Pendiente de liquidar</span>
            )}
          </div>
        </div>

      </div>

      {/* ── 3. FILTROS POR CATEGORÍA DE PUESTO ── */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIA_PILLS.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRole(r.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
              selectedRole === r.id ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
                onChange={(e) => setSearch(e.target.value)}
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
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Percepciones</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Deducciones</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total Neto</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Ajustes</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                    Sin trabajadores para los filtros seleccionados.
                  </td>
                </tr>
              ) : filtered.map((item) => {
                const isPagado = item.estado === 'Pagado';

                return (
                  <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${isPagado ? 'bg-emerald-50/20' : ''}`}>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-secondary text-white rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                          {item.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm leading-tight">{item.trabajadorNombre}</div>
                          <div className="text-[10px] font-bold text-primary mt-0.5">{item.puesto} ({item.categoriaPuesto})</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        item.metodoPago === 'Tarjeta' ? 'bg-blue-100 text-blue-700' :
                        item.metodoPago === 'Mixto' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {item.metodoPago}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                      {fmt.format(item.sueldoFiscal)}
                    </td>

                    <td className="px-6 py-4 text-right text-sm font-black text-primary">
                      {item.sueldoEfectivo > 0 ? fmt.format(item.sueldoEfectivo) : '—'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {item.totalPercepciones > 0 ? (
                        <div>
                          <span className="text-sm font-black text-emerald-600">+{fmt.format(item.totalPercepciones)}</span>
                          {item.horasExtra > 0 && <div className="text-[9px] text-emerald-700 font-bold">({item.horasExtra} hrs extras)</div>}
                        </div>
                      ) : <span className="text-slate-300 text-sm font-medium">—</span>}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {item.totalDeducciones > 0 ? (
                        <div>
                          <span className="text-sm font-black text-red-500">−{fmt.format(item.totalDeducciones)}</span>
                          <div className="text-[9px] text-red-600 font-medium truncate max-w-[140px]" title={item.deducciones.map((d) => d.concepto).join(', ')}>
                            {item.deducciones.map((d) => d.concepto).join(', ')}
                          </div>
                        </div>
                      ) : <span className="text-slate-300 text-sm font-medium">—</span>}
                    </td>

                    <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                      {fmt.format(item.totalNeto)}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {puedeCrear && (
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Ajustar Bono o Descuento"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => togglePagado(item)}
                        disabled={!puedeEditar}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-70 ${
                          isPagado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
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
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white border-t-2 border-slate-800 font-black">
                  <td colSpan={2} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Totales {periodo?.nombre}</td>
                  <td className="px-6 py-4 text-right text-sm">{fmt.format(totalFiscal)}</td>
                  <td className="px-6 py-4 text-right text-sm text-orange-400">{fmt.format(totalEfectivo)}</td>
                  <td className="px-6 py-4 text-right text-sm text-emerald-400">+{fmt.format(totalPercepciones)}</td>
                  <td className="px-6 py-4 text-right text-sm text-red-400">−{fmt.format(totalDescs)}</td>
                  <td className="px-6 py-4 text-right text-base text-emerald-400">{fmt.format(totalNeto)}</td>
                  <td colSpan={2} className="px-6 py-4 text-right text-xs text-slate-400">
                    {pagadosCount} de {items.length} liquidados
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      </>
      )}

      {/* Recibos Modal */}
      {recibosModalOpen && (
        <RecibosNominaModal
          isOpen={recibosModalOpen}
          onClose={() => setRecibosModalOpen(false)}
          workersList={items}
          periodoLabel={periodo?.nombre ?? ''}
          periodoCodigo={periodo?.codigo ?? ''}
        />
      )}

      {/* ── MODAL AJUSTE DE NÓMINA (BONO / DESCUENTO / PRÉSTAMO) ── */}
      {adjustModalOpen && selectedWorkerForAdjust && (
        <Modal
          isOpen={adjustModalOpen}
          onClose={() => setAdjustModalOpen(false)}
          onConfirm={handleApplyAdjust}
          title={`Ajuste de Nómina: ${selectedWorkerForAdjust.trabajadorNombre}`}
          confirmLabel={submitting ? 'Aplicando...' : 'Aplicar Ajuste'}
        >
          <div className="space-y-3">
            <ModalField label="Tipo de Ajuste">
              <select
                className={selectClass}
                value={adjustForm.tipo}
                onChange={(e) => setAdjustForm({ ...adjustForm, tipo: e.target.value as RegistrarAjusteInput['tipo'] })}
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
                onChange={(e) => setAdjustForm({ ...adjustForm, monto: parseFloat(e.target.value) || 0 })}
              />
            </ModalField>

            <ModalField label="Concepto / Justificación">
              <input
                type="text"
                className={inputClass}
                placeholder="Ej: Bono por colado nocturno / Descuento préstamo"
                value={adjustForm.concepto}
                onChange={(e) => setAdjustForm({ ...adjustForm, concepto: e.target.value })}
              />
            </ModalField>
          </div>
        </Modal>
      )}

    </div>
  );
}
