"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet, AlertTriangle, HandCoins, Building2, CreditCard, Eye,
  SlidersHorizontal, Download, CalendarClock, ReceiptText, X,
} from 'lucide-react';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal, Modal, ModalHeader, ModalBody, ModalFooter, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import {
  cobranzaApi,
  type CuentaPorCobrarDTO, type CobroDTO, type VencimientoDTO, type CobranzaStats,
  type EstadoCuentaCobranza, type MetodoPagoCobro, type SituacionCobranza,
} from '@/lib/api';

// ─── Constantes ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

const ESTADO_LABEL: Record<EstadoCuentaCobranza, string> = {
  PENDIENTE: 'Pendiente',
  PARCIAL: 'Parcial',
  SALDADO: 'Saldado',
};

const SITUACION_LABEL: Record<SituacionCobranza, string> = {
  AL_CORRIENTE: 'Al corriente',
  ATRASO_LEVE: 'Atraso leve',
  ATRASO_GRAVE: 'Atraso grave',
  SALDADO: 'Saldado',
};

const situacionVariant: Record<SituacionCobranza, 'success' | 'warning' | 'error' | 'neutral'> = {
  AL_CORRIENTE: 'success',
  ATRASO_LEVE: 'warning',
  ATRASO_GRAVE: 'error',
  SALDADO: 'neutral',
};

const METODOS_PAGO: MetodoPagoCobro[] = ['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE'];

const metodoLabel: Record<MetodoPagoCobro, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  CHEQUE: 'Cheque',
};

const hoyISO = new Date().toISOString().split('T')[0];

// ─── Filtros (chips + panel de selects, mismo diseño que /inventario) ─────────
function FiltrosCobranza({
  fields,
  values,
  active,
  show,
  onChange,
  onRemove,
  onClear,
}: {
  fields: FilterField[];
  values: Record<string, string>;
  active: ActiveFilter[];
  show: boolean;
  onChange: (key: string, value: string) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
}) {
  return (
    <>
      {active.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {active.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
            >
              <span className="font-normal text-primary/70">{filter.label}:</span>
              <span>{filter.value}</span>
              <button
                onClick={() => onRemove(filter.key)}
                className="ml-0.5 hover:text-primary-dark transition-colors"
                aria-label={`Eliminar filtro ${filter.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {active.length > 1 && (
            <button
              onClick={onClear}
              className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors ml-1"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}

      {show && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            {fields.map((filter) => (
              <div key={filter.key} className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {filter.label}
                </label>
                <select
                  value={values[filter.key] || ''}
                  onChange={(e) => onChange(filter.key, e.target.value)}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:border-primary/50"
                >
                  <option value="">{filter.placeholder || 'Todos'}</option>
                  {filter.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function CobranzaPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC (seed: comercial.cobranza) ──
  const vista = user?.vistas?.find((v) => v.ruta === '/cobranza');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeExportar = vista?.puedeExportar ?? false;

  // ── Datos ──
  const [cuentas, setCuentas] = useState<CuentaPorCobrarDTO[]>([]);
  const [paginationCuentas, setPaginationCuentas] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [cobros, setCobros] = useState<CobroDTO[]>([]);
  const [paginationCobros, setPaginationCobros] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [vencimientos, setVencimientos] = useState<VencimientoDTO[]>([]);
  const [paginationVenc, setPaginationVenc] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [cuentasCatalogo, setCuentasCatalogo] = useState<CuentaPorCobrarDTO[]>([]);
  const [stats, setStats] = useState<CobranzaStats>({ totalPorCobrar: 0, vencido: 0, cobradoMes: 0, clientesConSaldo: 0 });

  // ── UI state ──
  const [tab, setTab] = useState<'cuentas' | 'cobros' | 'vencimientos'>('cuentas');
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Modal registrar cobro ──
  const [cobroModal, setCobroModal] = useState(false);
  const [cobroForm, setCobroForm] = useState({ cuentaId: '', monto: '', fecha: hoyISO, metodoPago: 'TRANSFERENCIA' as MetodoPagoCobro, referencia: '' });

  // ── Modal estado de cuenta (ledger) ──
  const [ledgerCuenta, setLedgerCuenta] = useState<CuentaPorCobrarDTO | null>(null);
  const [ledgerMovs, setLedgerMovs] = useState<CobroDTO[]>([]);
  const [ledgerSaldo, setLedgerSaldo] = useState(0);

  // ── Carga de datos (patrón /proveedores: fetch + initialLoading) ──
  const fetchCuentas = useCallback(async (page = 1, searchVal?: string, filters?: Record<string, string>) => {
    const res = await cobranzaApi.listar({
      search: searchVal || undefined,
      estado: filters?.estado as EstadoCuentaCobranza | undefined,
      situacion: filters?.situacion as SituacionCobranza | undefined,
      page,
      limit: PAGE_SIZE,
    });
    if (res.success && res.data) {
      setCuentas(res.data.items);
      setPaginationCuentas(res.data.pagination);
    } else {
      showToast('Error al cargar cuentas por cobrar.', 'error');
    }
  }, [showToast]);

  const fetchCobros = useCallback(async (page = 1, searchVal?: string, filters?: Record<string, string>) => {
    const res = await cobranzaApi.cobros({
      search: searchVal || undefined,
      metodoPago: filters?.metodo as MetodoPagoCobro | undefined,
      page,
      limit: PAGE_SIZE,
    });
    if (res.success && res.data) {
      setCobros(res.data.items);
      setPaginationCobros(res.data.pagination);
    } else {
      showToast('Error al cargar los movimientos de cobro.', 'error');
    }
  }, [showToast]);

  const fetchVenc = useCallback(async (page = 1, searchVal?: string, filters?: Record<string, string>) => {
    const res = await cobranzaApi.vencimientos({
      search: searchVal || undefined,
      rango: filters?.rango as 'vencido' | 'por_vencer' | undefined,
      page,
      limit: PAGE_SIZE,
    });
    if (res.success && res.data) {
      setVencimientos(res.data.items);
      setPaginationVenc(res.data.pagination);
    } else {
      showToast('Error al cargar los vencimientos.', 'error');
    }
  }, [showToast]);

  const fetchStats = useCallback(async () => {
    const res = await cobranzaApi.stats();
    if (res.success && res.data) setStats(res.data);
  }, []);

  /** Catálogo de cuentas con saldo para el select del modal de cobro. */
  const fetchCatalogo = useCallback(async () => {
    const res = await cobranzaApi.listar({ limit: 100 });
    if (res.success && res.data) setCuentasCatalogo(res.data.items.filter((c) => c.saldo > 0));
  }, []);

  useEffect(() => {
    const inicial = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          fetchCuentas(1),
          fetchCobros(1),
          fetchVenc(1),
          fetchStats(),
          fetchCatalogo(),
        ]);
      } catch {
        showToast('No se pudo conectar con el servidor.', 'error');
      } finally {
        setInitialLoading(false);
      }
    };
    inicial();
  }, [fetchCuentas, fetchCobros, fetchVenc, fetchStats, fetchCatalogo, showToast]);

  /** Refetch tras una mutación: tab visible + stats + catálogo. */
  const refetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchCuentas(paginationCuentas.page, search, filterValues),
        fetchCobros(paginationCobros.page, search, filterValues),
        fetchVenc(paginationVenc.page, search, filterValues),
        fetchStats(),
        fetchCatalogo(),
      ]);
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [fetchCuentas, fetchCobros, fetchVenc, fetchStats, fetchCatalogo,
    paginationCuentas.page, paginationCobros.page, paginationVenc.page, search, filterValues, showToast]);

  // ── Búsqueda y filtros ──
  const activeFilters: ActiveFilter[] = useMemo(
    () =>
      Object.entries(filterValues)
        .filter(([, v]) => v)
        .map(([key, value]) => ({
          key,
          label:
            key === 'estado' ? 'Estado'
            : key === 'situacion' ? 'Situación'
            : key === 'metodo' ? 'Método'
            : 'Rango',
          value:
            key === 'estado' ? (ESTADO_LABEL[value as EstadoCuentaCobranza] ?? value)
            : key === 'situacion' ? (SITUACION_LABEL[value as SituacionCobranza] ?? value)
            : key === 'metodo' ? (metodoLabel[value as MetodoPagoCobro] ?? value)
            : value === 'vencido' ? 'Vencido' : 'Por vencer',
        })),
    [filterValues],
  );

  const filterFields: FilterField[] =
    tab === 'cuentas'
      ? [
          { key: 'estado', label: 'Estado', type: 'select', options: (Object.keys(ESTADO_LABEL) as EstadoCuentaCobranza[]).map((e) => ({ value: e, label: ESTADO_LABEL[e] })) },
          { key: 'situacion', label: 'Situación', type: 'select', options: (Object.keys(SITUACION_LABEL) as SituacionCobranza[]).map((s) => ({ value: s, label: SITUACION_LABEL[s] })) },
        ]
      : tab === 'cobros'
        ? [{ key: 'metodo', label: 'Método', type: 'select', options: METODOS_PAGO.map((m) => ({ value: m, label: metodoLabel[m] })) }]
        : [{ key: 'rango', label: 'Rango', type: 'select', options: [{ value: 'vencido', label: 'Vencido' }, { value: 'por_vencer', label: 'Por vencer' }] }];

  const handleSearch = (val?: string) => {
    const q = val ?? search;
    setSearch(q);
    if (tab === 'cuentas') fetchCuentas(1, q, filterValues);
    else if (tab === 'cobros') fetchCobros(1, q, filterValues);
    else fetchVenc(1, q, filterValues);
  };

  const handleFilterChange = (key: string, value: string) => {
    const next = { ...filterValues };
    if (value) next[key] = value;
    else delete next[key];
    setFilterValues(next);
    if (tab === 'cuentas') fetchCuentas(1, search, next);
    else if (tab === 'cobros') fetchCobros(1, search, next);
    else fetchVenc(1, search, next);
  };

  const handleClearFilters = () => {
    setFilterValues({});
    if (tab === 'cuentas') fetchCuentas(1, search, {});
    else if (tab === 'cobros') fetchCobros(1, search, {});
    else fetchVenc(1, search, {});
  };

  const handleRemoveFilter = (key: string) => handleFilterChange(key, '');

  // ── Handlers: cobros ──
  const openRegistrarCobro = (cuenta?: CuentaPorCobrarDTO) => {
    setCobroForm({
      cuentaId: cuenta?.id ?? '',
      monto: '',
      fecha: hoyISO,
      metodoPago: 'TRANSFERENCIA',
      referencia: '',
    });
    setCobroModal(true);
  };

  const cuentaSeleccionada = cuentasCatalogo.find((c) => c.id === cobroForm.cuentaId);

  const handleRegistrarCobro = async () => {
    const cuenta = cuentaSeleccionada;
    if (!cuenta) {
      showToast('Selecciona una cuenta por cobrar.', 'error');
      return;
    }
    const monto = parseFloat(cobroForm.monto);
    if (!monto || monto <= 0) {
      showToast('Ingresa un monto válido.', 'error');
      return;
    }
    if (monto > cuenta.saldo) {
      showToast(`El cobro no puede superar el saldo (${formatCurrency(cuenta.saldo)}).`, 'error');
      return;
    }

    const res = await cobranzaApi.registrarCobro(cuenta.id, {
      monto,
      fecha: cobroForm.fecha || hoyISO,
      metodoPago: cobroForm.metodoPago,
      referencia: cobroForm.referencia.trim() || undefined,
    });
    if (res.success && res.data) {
      setCobroModal(false);
      showToast(`Cobro de ${formatCurrency(monto)} registrado para ${cuenta.empresa}.`, 'success');
      await refetchAll();
    } else {
      showToast('No se pudo registrar el cobro.', 'error');
    }
  };

  /** Abre el ledger de la cuenta y carga sus movimientos desde la API.
   *  La modal se abre SOLO cuando el ledger ya fue cargado: evita el
   *  parpadeo de "Cargando..." — mismo patrón que /proveedores. */
  const openLedger = async (cuenta: CuentaPorCobrarDTO) => {
    try {
      const res = await cobranzaApi.cobrosDeCuenta(cuenta.id);
      if (res.success && res.data) {
        setLedgerMovs(res.data.cobros);
        setLedgerSaldo(res.data.saldo);
        setLedgerCuenta(cuenta);
      } else {
        showToast('Error al cargar el estado de cuenta.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    }
  };

  // ── Exportar CSV del tab activo (RBAC: exportar) ──
  const handleExportar = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines: (string | number)[][] =
      tab === 'cuentas'
        ? [['Cliente', 'Obra', 'Factura', 'Total', 'Pagado', 'Saldo', 'Vencimiento', 'Estado'],
           ...cuentas.map((c) => [c.empresa, c.obra, c.facturaFolio, c.monto, c.montoPagado, c.saldo, c.fechaVencimiento, ESTADO_LABEL[c.estado]])]
        : tab === 'cobros'
          ? [['Fecha', 'Cliente', 'Referencia', 'Método', 'Monto'],
             ...cobros.map((c) => [c.fecha, c.clienteNombre, c.referencia, metodoLabel[c.metodoPago], c.monto])]
          : [['Cliente', 'Obra', 'Vencimiento', 'Días atraso', 'Monto'],
             ...vencimientos.map((v) => [v.clienteNombre, v.obra, v.fechaVencimiento, v.diasAtraso, v.monto])];

    const csv = lines.map((row) => row.map(esc).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cobranza-${tab}-${hoyISO}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Reporte exportado a CSV.', 'success');
  };

  // ── Columnas: cuentas por cobrar ──
  const cuentaColumns: Column<CuentaPorCobrarDTO>[] = [
    {
      key: 'cliente',
      header: 'Cliente',
      minWidth: '220px',
      nowrap: true,
      render: (c) => (
        <div>
          <p className="font-semibold text-slate-800 truncate">{c.empresa}</p>
          <p className="text-xs text-slate-400 truncate">{c.clienteNombre} · {c.obra}</p>
        </div>
      ),
    },
    { key: 'factura', header: 'Factura', minWidth: '110px', nowrap: true, render: (c) => <span className="text-slate-500 text-xs font-semibold">{c.facturaFolio}</span> },
    { key: 'monto', header: 'Total', align: 'right', minWidth: '120px', nowrap: true, render: (c) => <span className="text-slate-600 font-medium">{formatCurrency(c.monto)}</span> },
    { key: 'pagado', header: 'Pagado', align: 'right', minWidth: '120px', nowrap: true, render: (c) => <span className="text-green-600 font-medium">{formatCurrency(c.montoPagado)}</span> },
    { key: 'saldo', header: 'Saldo', align: 'right', minWidth: '130px', nowrap: true, render: (c) => <span className="font-black text-slate-900">{formatCurrency(c.saldo)}</span> },
    { key: 'vencimiento', header: 'Vencimiento', minWidth: '120px', nowrap: true, render: (c) => <span className="text-slate-500 text-sm">{c.fechaVencimiento}</span> },
    {
      key: 'situacion',
      header: 'Situación',
      minWidth: '130px',
      nowrap: true,
      render: (c) => <Badge variant={situacionVariant[c.situacion]} dot>{SITUACION_LABEL[c.situacion]}</Badge>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center',
      minWidth: '240px',
      nowrap: true,
      render: (c) => (
        <div className="flex items-center justify-center gap-1">
          {c.saldo > 0 && puedeCrear && (
            <Button variant="primary" size="sm" icon={<CreditCard className="w-3.5 h-3.5" />} onClick={() => openRegistrarCobro(c)}>
              Registrar cobro
            </Button>
          )}
          <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => openLedger(c)}>
            Ver estado de cuenta
          </Button>
        </div>
      ),
    },
  ];

  // ── Columnas: movimientos de cobro ──
  const cobroColumns: Column<CobroDTO>[] = [
    { key: 'fecha', header: 'Fecha', minWidth: '120px', nowrap: true, render: (c) => <span className="text-slate-600 font-medium">{c.fecha}</span> },
    { key: 'cliente', header: 'Cliente', minWidth: '220px', nowrap: true, render: (c) => <span className="font-semibold text-slate-800 truncate">{c.clienteNombre}</span> },
    { key: 'referencia', header: 'Referencia', minWidth: '130px', nowrap: true, render: (c) => <span className="text-slate-500 text-xs">{c.referencia}</span> },
    {
      key: 'metodo',
      header: 'Método',
      minWidth: '130px',
      nowrap: true,
      render: (c) => (
        <Badge variant={c.metodoPago === 'CHEQUE' ? 'info' : c.metodoPago === 'EFECTIVO' ? 'warning' : 'success'}>{metodoLabel[c.metodoPago]}</Badge>
      ),
    },
    { key: 'monto', header: 'Monto', align: 'right', minWidth: '130px', nowrap: true, render: (c) => <span className="font-black text-green-600">{formatCurrency(c.monto)}</span> },
  ];

  // ── Columnas: vencimientos ──
  const vencColumns: Column<VencimientoDTO>[] = [
    { key: 'cliente', header: 'Cliente', minWidth: '220px', nowrap: true, render: (v) => <span className="font-semibold text-slate-800 truncate">{v.clienteNombre}</span> },
    { key: 'obra', header: 'Obra', minWidth: '220px', nowrap: true, render: (v) => <span className="text-slate-500 truncate">{v.obra}</span> },
    { key: 'vencimiento', header: 'Vencimiento', minWidth: '120px', nowrap: true, render: (v) => <span className="text-slate-600 font-medium">{v.fechaVencimiento}</span> },
    {
      key: 'dias',
      header: 'Días atraso',
      minWidth: '110px',
      align: 'right',
      nowrap: true,
      render: (v) =>
        v.diasAtraso > 0 ? (
          <span className="inline-flex items-center gap-1 text-red-600 font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            {v.diasAtraso} días
          </span>
        ) : (
          <span className="text-green-600 font-semibold">Al corriente</span>
        ),
    },
    { key: 'monto', header: 'Monto', align: 'right', minWidth: '130px', nowrap: true, render: (v) => <span className="font-black text-slate-900">{formatCurrency(v.monto)}</span> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Crédito y Cobranza"
        subtitle="Saldos por cliente · Estados de cuenta · Control de cobros"
        action={
          puedeExportar && (
            <Button variant="secondary" size="md" icon={<Download className="w-4 h-4" />} onClick={handleExportar}>
              Exportar
            </Button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard icon={<Wallet className="w-5 h-5" />} label="Por cobrar" value={formatCurrency(stats.totalPorCobrar)} color="error" />
        <StatsCard icon={<AlertTriangle className="w-5 h-5" />} label="Vencido" value={formatCurrency(stats.vencido)} color="warning" />
        <StatsCard icon={<HandCoins className="w-5 h-5" />} label="Cobrado este mes" value={formatCurrency(stats.cobradoMes)} color="success" />
        <StatsCard icon={<Building2 className="w-5 h-5" />} label="Clientes con saldo" value={stats.clientesConSaldo} color="info" />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { key: 'cuentas', label: 'Cuentas por cobrar', icon: <ReceiptText className="w-4 h-4" />, count: paginationCuentas.total },
          { key: 'cobros', label: 'Movimientos de cobro', icon: <HandCoins className="w-4 h-4" />, count: paginationCobros.total },
          { key: 'vencimientos', label: 'Vencimientos', icon: <CalendarClock className="w-4 h-4" />, count: paginationVenc.total },
        ]}
        onChange={(key) => {
          setTab(key as 'cuentas' | 'cobros' | 'vencimientos');
          setSearch('');
          setFilterValues({});
          setShowFilters(false);
        }}
      >
        {/* ─── CUENTAS POR COBRAR ─────────────────────────────────────── */}
        <TabPanel tabKey="cuentas">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                onSearch={handleSearch}
                placeholder="Buscar cliente, empresa, obra o factura..."
                className="flex-1"
              />
              <Button
                variant={showFilters ? 'primary' : 'secondary'}
                size="md"
                icon={<SlidersHorizontal className="w-4 h-4" />}
                onClick={() => setShowFilters((prev) => !prev)}
                className="shrink-0 whitespace-nowrap"
              >
                Filtros
                {activeFilters.length > 0 && (
                  <span className="ml-1 inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                    {activeFilters.length}
                  </span>
                )}
              </Button>
            </div>

            <FiltrosCobranza
              fields={filterFields}
              values={filterValues}
              active={activeFilters}
              show={showFilters}
              onChange={handleFilterChange}
              onRemove={handleRemoveFilter}
              onClear={handleClearFilters}
            />

            {initialLoading || refreshing ? (
              <EmptyState title="Cargando cuentas por cobrar..." subtitle="Espera un momento." />
            ) : cuentas.length === 0 ? (
              <EmptyState
                title="Sin cuentas por cobrar"
                subtitle="No se encontraron cuentas para la búsqueda o filtros aplicados."
              />
            ) : (
              <>
                <DataTable
                  columns={cuentaColumns}
                  data={cuentas}
                  keyExtractor={(c) => c.id}
                  emptyText="No se encontraron cuentas."
                  maxBodyHeight="500px"
                />
                <Pagination
                  currentPage={paginationCuentas.page}
                  totalPages={paginationCuentas.totalPages}
                  totalRecords={paginationCuentas.total}
                  pageSize={PAGE_SIZE}
                  onPageChange={(page) => fetchCuentas(page, search, filterValues)}
                />
              </>
            )}
          </div>
        </TabPanel>

        {/* ─── MOVIMIENTOS DE COBRO ───────────────────────────────────── */}
        <TabPanel tabKey="cobros">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                onSearch={handleSearch}
                placeholder="Buscar cliente o referencia..."
                className="flex-1"
              />
              <Button
                variant={showFilters ? 'primary' : 'secondary'}
                size="md"
                icon={<SlidersHorizontal className="w-4 h-4" />}
                onClick={() => setShowFilters((prev) => !prev)}
                className="shrink-0 whitespace-nowrap"
              >
                Filtros
                {activeFilters.length > 0 && (
                  <span className="ml-1 inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                    {activeFilters.length}
                  </span>
                )}
              </Button>
            </div>

            <FiltrosCobranza
              fields={filterFields}
              values={filterValues}
              active={activeFilters}
              show={showFilters}
              onChange={handleFilterChange}
              onRemove={handleRemoveFilter}
              onClear={handleClearFilters}
            />

            {initialLoading || refreshing ? (
              <EmptyState title="Cargando movimientos de cobro..." subtitle="Espera un momento." />
            ) : cobros.length === 0 ? (
              <EmptyState
                title="Sin movimientos de cobro"
                subtitle="No se encontraron cobros para la búsqueda o filtros aplicados."
              />
            ) : (
              <>
                <DataTable
                  columns={cobroColumns}
                  data={cobros}
                  keyExtractor={(c) => c.id}
                  emptyText="No se encontraron cobros."
                  maxBodyHeight="500px"
                />
                <Pagination
                  currentPage={paginationCobros.page}
                  totalPages={paginationCobros.totalPages}
                  totalRecords={paginationCobros.total}
                  pageSize={PAGE_SIZE}
                  onPageChange={(page) => fetchCobros(page, search, filterValues)}
                />
              </>
            )}
          </div>
        </TabPanel>

        {/* ─── VENCIMIENTOS ───────────────────────────────────────────── */}
        <TabPanel tabKey="vencimientos">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                onSearch={handleSearch}
                placeholder="Buscar cliente u obra..."
                className="flex-1"
              />
              <Button
                variant={showFilters ? 'primary' : 'secondary'}
                size="md"
                icon={<SlidersHorizontal className="w-4 h-4" />}
                onClick={() => setShowFilters((prev) => !prev)}
                className="shrink-0 whitespace-nowrap"
              >
                Filtros
                {activeFilters.length > 0 && (
                  <span className="ml-1 inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                    {activeFilters.length}
                  </span>
                )}
              </Button>
            </div>

            <FiltrosCobranza
              fields={filterFields}
              values={filterValues}
              active={activeFilters}
              show={showFilters}
              onChange={handleFilterChange}
              onRemove={handleRemoveFilter}
              onClear={handleClearFilters}
            />

            {initialLoading || refreshing ? (
              <EmptyState title="Cargando vencimientos..." subtitle="Espera un momento." />
            ) : vencimientos.length === 0 ? (
              <EmptyState
                title="Sin vencimientos pendientes"
                subtitle="No hay saldos por cobrar con vencimientos para este rango."
              />
            ) : (
              <>
                <DataTable
                  columns={vencColumns}
                  data={vencimientos}
                  keyExtractor={(v) => v.id}
                  emptyText="No se encontraron vencimientos."
                  maxBodyHeight="500px"
                />
                <Pagination
                  currentPage={paginationVenc.page}
                  totalPages={paginationVenc.totalPages}
                  totalRecords={paginationVenc.total}
                  pageSize={PAGE_SIZE}
                  onPageChange={(page) => fetchVenc(page, search, filterValues)}
                />
              </>
            )}
          </div>
        </TabPanel>
      </Tabs>

      {/* ─── Modal: Registrar cobro ────────────────────────────────────── */}
      <FormModal
        open={cobroModal}
        onClose={() => setCobroModal(false)}
        onCancel={() => setCobroModal(false)}
        title="Registrar cobro"
        subtitle="Registra un pago parcial o total contra una cuenta por cobrar."
        submitLabel="Registrar Cobro"
        cancelLabel="Cancelar"
        onSubmit={handleRegistrarCobro}
      >
        <ModalField label="Cuenta por cobrar" required>
          <select
            className={modalSelectClass}
            value={cobroForm.cuentaId}
            onChange={(e) => setCobroForm({ ...cobroForm, cuentaId: e.target.value })}
          >
            <option value="">Selecciona la cuenta...</option>
            {cuentasCatalogo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.empresa} — {c.obra} (saldo {formatCurrency(c.saldo)})
              </option>
            ))}
          </select>
        </ModalField>

        {cuentaSeleccionada && (
          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
            Factura <span className="font-bold text-slate-700">{cuentaSeleccionada.facturaFolio}</span> · Saldo actual{' '}
            <span className="font-bold text-slate-700">{formatCurrency(cuentaSeleccionada.saldo)}</span>
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Monto" required>
            <input
              type="number"
              min={0}
              step="0.01"
              className={modalInputClass}
              placeholder="0.00"
              value={cobroForm.monto}
              onChange={(e) => setCobroForm({ ...cobroForm, monto: e.target.value })}
            />
          </ModalField>
          <ModalField label="Fecha" required>
            <input
              type="date"
              className={modalInputClass}
              value={cobroForm.fecha}
              onChange={(e) => setCobroForm({ ...cobroForm, fecha: e.target.value })}
            />
          </ModalField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Método de pago" required>
            <select
              className={modalSelectClass}
              value={cobroForm.metodoPago}
              onChange={(e) => setCobroForm({ ...cobroForm, metodoPago: e.target.value as MetodoPagoCobro })}
            >
              {METODOS_PAGO.map((m) => (
                <option key={m} value={m}>
                  {metodoLabel[m]}
                </option>
              ))}
            </select>
          </ModalField>
          <ModalField label="Referencia" hint="Folio de transferencia, cheque o efectivo.">
            <input
              type="text"
              className={modalInputClass}
              placeholder="TRF-000000"
              value={cobroForm.referencia}
              onChange={(e) => setCobroForm({ ...cobroForm, referencia: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      {/* ─── Modal: Estado de cuenta (ledger) ──────────────────────────── */}
      <Modal open={!!ledgerCuenta} onClose={() => setLedgerCuenta(null)} size="lg">
        <ModalHeader
          title={`Estado de cuenta — ${ledgerCuenta?.empresa ?? ''}`}
          subtitle={
            ledgerCuenta
              ? `${ledgerCuenta.obra} · Factura ${ledgerCuenta.facturaFolio}`
              : undefined
          }
          onClose={() => setLedgerCuenta(null)}
        />
        <ModalBody>
          {ledgerCuenta && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Facturado</p>
                  <p className="text-lg font-black text-slate-900">{formatCurrency(ledgerCuenta.monto)}</p>
                </div>
                <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-center">
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Pagado</p>
                  <p className="text-lg font-black text-green-700">{formatCurrency(ledgerCuenta.montoPagado)}</p>
                </div>
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-center">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Saldo</p>
                  <p className="text-lg font-black text-red-600">{formatCurrency(ledgerSaldo)}</p>
                </div>
              </div>

              {ledgerMovs.length === 0 ? (
                <EmptyState
                  title="Sin cobros registrados"
                  subtitle="Esta cuenta aún no tiene movimientos de cobro."
                />
              ) : (
                <div className="space-y-2">
                  {ledgerMovs.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{metodoLabel[m.metodoPago]}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {m.fecha} · {m.referencia}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-green-600 shrink-0">{formatCurrency(m.monto)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={() => setLedgerCuenta(null)}>
            Cerrar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}