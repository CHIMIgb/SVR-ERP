"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CreditCard, Wallet, Download, CheckCircle2,
  Printer, Clock, Zap,
  AlertCircle, Edit3,
  ChevronRight,
} from 'lucide-react';
import { nominaApi, type NominaRowDTO, type PeriodoNominaDTO, type RegistrarAjusteInput } from '@/lib/api';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import RecibosNominaModal from '@/components/layout/RecibosNominaModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatsCard } from '@/components/ui/StatsCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { LoadingState } from '@/components/ui/LoadingState';
import { FormModal, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';

const CATEGORIA_PILLS = [
  { id: 'Todos', label: 'Todos los Puestos' },
  { id: 'Operador', label: 'Operadores' },
  { id: 'Chofer', label: 'Choferes' },
  { id: 'Mecanico', label: 'Mecánicos' },
  { id: 'Ingeniero', label: 'Ingenieros' },
  { id: 'Administrativo', label: 'Administración' },
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
    concepto: '',
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
        `Asistencia sincronizada: se importaron ${res.data.totalHorasExtraSincronizadas}h extras y ${res.data.totalFaltasAplicadas} falta(s).`,
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
      nuevoEstado === 'Pagado' ? `Pago de ${item.trabajadorNombre} confirmado.` : `Pago de ${item.trabajadorNombre} marcado como pendiente.`,
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
    showToast(`Toda la nómina de ${periodo.nombre} ha sido marcada como pagada.`, 'success');
  };

  const handleOpenAdjust = (item: NominaRowDTO) => {
    setSelectedWorkerForAdjust(item);
    setAdjustForm({ tipo: 'Bono', monto: 500, concepto: '' });
    setAdjustModalOpen(true);
  };

  const handleApplyAdjust = async () => {
    if (!selectedWorkerForAdjust) return;
    if (!adjustForm.concepto.trim()) {
      showToast('Describe el concepto del ajuste.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await nominaApi.registrarAjuste(selectedWorkerForAdjust.id, adjustForm);
      if (!res.success) throw new Error(res.error.message);
      setItems((prev) => prev.map((i) => (i.id === res.data.id ? res.data : i)));
      setAdjustModalOpen(false);
      showToast(`Ajuste de ${fmt.format(adjustForm.monto)} aplicado a ${selectedWorkerForAdjust.trabajadorNombre}.`, 'success');
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

    showToast('Layout bancario SPEI generado y descargado correctamente.', 'success');
  };

  const columns: Column<NominaRowDTO>[] = [
    {
      key: 'trabajador',
      header: 'Trabajador & Rol',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-secondary text-white rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
            {item.avatar}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm leading-tight">{item.trabajadorNombre}</div>
            <div className="text-[10px] font-bold text-primary mt-0.5">{item.puesto} ({item.categoriaPuesto})</div>
          </div>
        </div>
      ),
    },
    {
      key: 'esquema',
      header: 'Esquema',
      align: 'center',
      render: (item) => (
        <Badge variant={item.metodoPago === 'Tarjeta' ? 'info' : item.metodoPago === 'Mixto' ? 'primary' : 'warning'} size="sm">
          {item.metodoPago}
        </Badge>
      ),
    },
    {
      key: 'fiscal',
      header: 'Fiscal (SPEI)',
      align: 'right',
      render: (item) => <span className="text-sm font-semibold text-slate-600">{fmt.format(item.sueldoFiscal)}</span>,
    },
    {
      key: 'efectivo',
      header: 'Efectivo (Sobre)',
      align: 'right',
      render: (item) => <span className="text-sm font-black text-primary">{item.sueldoEfectivo > 0 ? fmt.format(item.sueldoEfectivo) : '—'}</span>,
    },
    {
      key: 'percepciones',
      header: 'Percepciones',
      align: 'right',
      render: (item) => item.totalPercepciones > 0 ? (
        <div>
          <span className="text-sm font-black text-emerald-600">+{fmt.format(item.totalPercepciones)}</span>
          {item.horasExtra > 0 && <div className="text-[9px] text-emerald-700 font-bold">({item.horasExtra} hrs extras)</div>}
        </div>
      ) : <span className="text-slate-300 text-sm font-medium">—</span>,
    },
    {
      key: 'deducciones',
      header: 'Deducciones',
      align: 'right',
      render: (item) => item.totalDeducciones > 0 ? (
        <div>
          <span className="text-sm font-black text-red-500">−{fmt.format(item.totalDeducciones)}</span>
          <div className="text-[9px] text-red-600 font-medium truncate max-w-[140px]" title={item.deducciones.map((d) => d.concepto).join(', ')}>
            {item.deducciones.map((d) => d.concepto).join(', ')}
          </div>
        </div>
      ) : <span className="text-slate-300 text-sm font-medium">—</span>,
    },
    {
      key: 'neto',
      header: 'Total Neto',
      align: 'right',
      render: (item) => <span className="text-sm font-black text-slate-900">{fmt.format(item.totalNeto)}</span>,
    },
    {
      key: 'ajustes',
      header: 'Ajustes',
      align: 'center',
      render: (item) => puedeCrear ? (
        <button
          onClick={() => handleOpenAdjust(item)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Ajustar Bono o Descuento"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      ) : null,
    },
    {
      key: 'estatus',
      header: 'Estatus',
      align: 'right',
      render: (item) => {
        const isPagado = item.estado === 'Pagado';
        return (
          <Button
            variant={isPagado ? 'success' : 'secondary'}
            size="sm"
            icon={<CheckCircle2 size={14} />}
            disabled={!puedeEditar}
            onClick={() => togglePagado(item)}
          >
            {isPagado ? 'Pagado' : 'Pendiente'}
          </Button>
        );
      },
    },
  ];

  if (errorCarga && !hasLoaded.current) {
    return (
      <div className="card p-8 text-center space-y-3 border border-red-200 bg-red-50">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm font-bold text-red-700">{errorCarga}</p>
        <Button onClick={fetchNomina}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión y Dispersión de Nómina"
        subtitle={`${periodo ? `${periodo.nombre} · ` : ''}Esquema mixto (Sueldo fiscal por SPEI + Complemento en sobre de efectivo), cálculo satelital de horas extras y deducciones por inasistencia.`}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {puedeEditar && (
              <Button
                variant="success"
                icon={<Zap size={16} className={isSyncing ? 'animate-spin' : ''} />}
                onClick={handleSincronizarAsistencia}
                disabled={isSyncing || !periodo}
              >
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Asistencia'}
              </Button>
            )}
            <Button variant="secondary" icon={<Printer size={16} />} onClick={() => setRecibosModalOpen(true)}>
              Sobres con Firma
            </Button>
            {puedeExportar && (
              <Button icon={<Download size={16} />} onClick={handleDownloadSpeiLayout}>
                Layout SPEI BBVA
              </Button>
            )}
          </div>
        }
      />

      {initialLoading ? (
        <LoadingState text="Cargando nómina..." size="lg" />
      ) : (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<CreditCard size={22} />} value={fmt.format(totalFiscal)} label="Dispersión SPEI (Fiscal)" color="info" />
        <StatsCard icon={<Wallet size={22} />} value={fmt.format(totalEfectivo)} label="Efectivo para Sobres" color="primary" />
        <StatsCard icon={<Clock size={22} />} value={`+${totalHorasExtraHoras}h`} label={`Horas Extras GPS (${fmt.format(totalPercepciones)})`} color="success" />
        <StatsCard
          icon={<CheckCircle2 size={22} />}
          value={`${pagadosCount} / ${items.length}`}
          label="Estatus de Liquidación"
          color={pagadosCount === items.length && items.length > 0 ? 'success' : 'neutral'}
          onClick={pagadosCount < items.length && puedeEditar ? handleMarcarTodosPagados : undefined}
        />
      </div>

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

      <SearchBar value={search} onChange={setSearch} placeholder="Filtrar por empleado..." />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        emptyText="Sin trabajadores para los filtros seleccionados."
      />

      {items.length > 0 && (
        <div className="card bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-black">
          <span className="uppercase tracking-widest text-slate-400">Totales {periodo?.nombre}</span>
          <div className="flex flex-wrap items-center gap-4">
            <span>Fiscal: {fmt.format(totalFiscal)}</span>
            <span className="text-orange-400">Efectivo: {fmt.format(totalEfectivo)}</span>
            <span className="text-emerald-400">+{fmt.format(totalPercepciones)}</span>
            <span className="text-red-400">−{fmt.format(totalDescs)}</span>
            <span className="text-emerald-400 text-base">{fmt.format(totalNeto)}</span>
            <span className="text-slate-400 flex items-center gap-1">
              {pagadosCount} de {items.length} liquidados <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      )}
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

      {/* MODAL AJUSTE DE NÓMINA (BONO / DESCUENTO / PRÉSTAMO) */}
      {selectedWorkerForAdjust && (
        <FormModal
          open={adjustModalOpen}
          onClose={() => setAdjustModalOpen(false)}
          onSubmit={handleApplyAdjust}
          title={`Ajuste de Nómina: ${selectedWorkerForAdjust.trabajadorNombre}`}
          submitLabel={submitting ? 'Aplicando...' : 'Aplicar Ajuste'}
          isSubmitting={submitting}
        >
          <div className="space-y-3">
            <ModalField label="Tipo de Ajuste">
              <select
                className={modalSelectClass}
                value={adjustForm.tipo}
                onChange={(e) => setAdjustForm({ ...adjustForm, tipo: e.target.value as RegistrarAjusteInput['tipo'] })}
              >
                <option value="Bono">Bono de Productividad / Asistencia (+ Efectivo)</option>
                <option value="Descuento">Descuento por Falta o Daño (− Deducción)</option>
                <option value="Prestamo">Cobro de Anticipo / Préstamo (− Deducción)</option>
              </select>
            </ModalField>

            <ModalField label="Monto del Ajuste ($ MXN)">
              <input
                type="number"
                className={modalInputClass}
                placeholder="500"
                value={adjustForm.monto}
                onChange={(e) => setAdjustForm({ ...adjustForm, monto: parseFloat(e.target.value) || 0 })}
              />
            </ModalField>

            <ModalField label="Concepto / Justificación" required>
              <input
                type="text"
                className={modalInputClass}
                placeholder="Ej: Bono por colado nocturno / Descuento préstamo"
                value={adjustForm.concepto}
                onChange={(e) => setAdjustForm({ ...adjustForm, concepto: e.target.value })}
              />
            </ModalField>
          </div>
        </FormModal>
      )}

    </div>
  );
}
