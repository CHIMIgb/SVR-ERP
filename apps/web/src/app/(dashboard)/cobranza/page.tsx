"use client";

import React, { useMemo, useState } from 'react';
import {
  Wallet, AlertTriangle, HandCoins, Building2, CreditCard, Eye,
  SlidersHorizontal, Download, CalendarClock, ReceiptText,
} from 'lucide-react';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { SearchBar, FilterPanel, ActiveFilters, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal, Modal, ModalHeader, ModalBody, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import {
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

/** Genera un id local para el mock (el backend dará UUIDs reales). */
const generarIdCobro = () => `cbr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ─── Mock data (fase 1: contrato listo, sin backend) ──────────────────────────
const cuentasMock: CuentaPorCobrarDTO[] = [
  {
    id: 'cxc-0001', clienteId: 'cli-001', clienteNombre: 'Ing. Alberto Ruiz', empresa: 'Inmobiliaria ARCO',
    obra: 'Fraccionamiento Valle Sur', facturaFolio: 'FAC-1024', monto: 1200000, montoPagado: 950000, saldo: 250000,
    fechaEmision: '2026-07-10', fechaVencimiento: '2026-09-10', diasAtraso: 0,
    estado: 'PARCIAL', situacion: 'AL_CORRIENTE', ultimoCobroFecha: '2026-08-10',
  },
  {
    id: 'cxc-0002', clienteId: 'cli-002', clienteNombre: 'Lic. Martha Silva', empresa: 'Gobierno CDMX',
    obra: 'Remodelación Centro Histórico', facturaFolio: 'FAC-1076', monto: 4500000, montoPagado: 1200000, saldo: 3300000,
    fechaEmision: '2026-05-15', fechaVencimiento: '2026-07-15', diasAtraso: 52,
    estado: 'PARCIAL', situacion: 'ATRASO_GRAVE', ultimoCobroFecha: '2026-07-15',
  },
  {
    id: 'cxc-0003', clienteId: 'cli-003', clienteNombre: 'Arq. Fernanda Torres', empresa: 'Desarrollos Costa',
    obra: 'Residencial Lomas Norte', facturaFolio: 'FAC-0991', monto: 850000, montoPagado: 850000, saldo: 0,
    fechaEmision: '2026-06-01', fechaVencimiento: '2026-08-01', diasAtraso: 0,
    estado: 'SALDADO', situacion: 'SALDADO', ultimoCobroFecha: '2026-08-01',
  },
  {
    id: 'cxc-0004', clienteId: 'cli-004', clienteNombre: 'Ing. Marcos Linares', empresa: 'Constructora Omega',
    obra: 'Bodega Industrial Km 45', facturaFolio: 'FAC-1102', monto: 620000, montoPagado: 80000, saldo: 540000,
    fechaEmision: '2026-05-20', fechaVencimiento: '2026-06-20', diasAtraso: 77,
    estado: 'PARCIAL', situacion: 'ATRASO_GRAVE', ultimoCobroFecha: '2026-06-20',
  },
  {
    id: 'cxc-0005', clienteId: 'cli-005', clienteNombre: 'Ing. Rafael Beltrán', empresa: 'Consorcio Vía',
    obra: 'Puente Los Robles', facturaFolio: 'FAC-1048', monto: 2000000, montoPagado: 1500000, saldo: 500000,
    fechaEmision: '2026-07-28', fechaVencimiento: '2026-08-28', diasAtraso: 8,
    estado: 'PARCIAL', situacion: 'ATRASO_LEVE', ultimoCobroFecha: '2026-08-20',
  },
  {
    id: 'cxc-0006', clienteId: 'cli-006', clienteNombre: 'Lic. Sofía Herrera', empresa: 'Hotel Punta Mita',
    obra: 'Torreón de la Playa', facturaFolio: 'FAC-1115', monto: 980000, montoPagado: 0, saldo: 980000,
    fechaEmision: '2026-08-25', fechaVencimiento: '2026-09-25', diasAtraso: 0,
    estado: 'PENDIENTE', situacion: 'AL_CORRIENTE',
  },
  {
    id: 'cxc-0007', clienteId: 'cli-007', clienteNombre: 'Arq. Diego Núñez', empresa: 'Municipalidad de Compostela',
    obra: 'Plaza Cívica', facturaFolio: 'FAC-0967', monto: 300000, montoPagado: 300000, saldo: 0,
    fechaEmision: '2026-04-10', fechaVencimiento: '2026-06-10', diasAtraso: 0,
    estado: 'SALDADO', situacion: 'SALDADO', ultimoCobroFecha: '2026-06-08',
  },
];

const cobrosMock: CobroDTO[] = [
  { id: 'cbr-001', cuentaId: 'cxc-0001', clienteNombre: 'Inmobiliaria ARCO', monto: 350000, fecha: '2026-07-01', referencia: 'TRF-774400', metodoPago: 'TRANSFERENCIA' },
  { id: 'cbr-002', cuentaId: 'cxc-0001', clienteNombre: 'Inmobiliaria ARCO', monto: 200000, fecha: '2026-07-20', referencia: 'TRF-882211', metodoPago: 'TRANSFERENCIA' },
  { id: 'cbr-003', cuentaId: 'cxc-0001', clienteNombre: 'Inmobiliaria ARCO', monto: 400000, fecha: '2026-08-10', referencia: 'TRF-901299', metodoPago: 'TRANSFERENCIA' },
  { id: 'cbr-004', cuentaId: 'cxc-0002', clienteNombre: 'Gobierno CDMX', monto: 500000, fecha: '2026-06-15', referencia: 'CHQ-004412', metodoPago: 'CHEQUE' },
  { id: 'cbr-005', cuentaId: 'cxc-0002', clienteNombre: 'Gobierno CDMX', monto: 700000, fecha: '2026-07-15', referencia: 'CHQ-005033', metodoPago: 'CHEQUE' },
  { id: 'cbr-006', cuentaId: 'cxc-0003', clienteNombre: 'Desarrollos Costa', monto: 500000, fecha: '2026-07-10', referencia: 'TRF-654321', metodoPago: 'TRANSFERENCIA' },
  { id: 'cbr-007', cuentaId: 'cxc-0003', clienteNombre: 'Desarrollos Costa', monto: 350000, fecha: '2026-08-01', referencia: 'TRF-660011', metodoPago: 'TRANSFERENCIA' },
  { id: 'cbr-008', cuentaId: 'cxc-0004', clienteNombre: 'Constructora Omega', monto: 80000, fecha: '2026-06-20', referencia: 'EFE-0001', metodoPago: 'EFECTIVO' },
  { id: 'cbr-009', cuentaId: 'cxc-0005', clienteNombre: 'Consorcio Vía', monto: 900000, fecha: '2026-08-10', referencia: 'TRF-102933', metodoPago: 'TRANSFERENCIA' },
  { id: 'cbr-010', cuentaId: 'cxc-0005', clienteNombre: 'Consorcio Vía', monto: 600000, fecha: '2026-08-20', referencia: 'TRF-112244', metodoPago: 'TRANSFERENCIA' },
  { id: 'cbr-011', cuentaId: 'cxc-0007', clienteNombre: 'Municipalidad de Compostela', monto: 300000, fecha: '2026-06-08', referencia: 'CHQ-003377', metodoPago: 'CHEQUE' },
];

const hoyISO = new Date().toISOString().split('T')[0];
const mesActual = hoyISO.slice(0, 7); // YYYY-MM

// ─── Página ───────────────────────────────────────────────────────────────────
export default function CobranzaPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC (seed: comercial.cobranza) ──
  const vista = user?.vistas?.find((v) => v.ruta === '/cobranza');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeExportar = vista?.puedeExportar ?? false;

  // ── Datos (fase mock local) ──
  const [cuentas, setCuentas] = useState<CuentaPorCobrarDTO[]>(cuentasMock);
  const [cobros, setCobros] = useState<CobroDTO[]>(cobrosMock);

  // ── UI state ──
  const [tab, setTab] = useState<'cuentas' | 'cobros' | 'vencimientos'>('cuentas');
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [pageCuentas, setPageCuentas] = useState(1);
  const [pageCobros, setPageCobros] = useState(1);
  const [pageVenc, setPageVenc] = useState(1);

  // ── Modal registrar cobro ──
  const [cobroModal, setCobroModal] = useState(false);
  const [cobroForm, setCobroForm] = useState({ cuentaId: '', monto: '', fecha: hoyISO, metodoPago: 'TRANSFERENCIA' as MetodoPagoCobro, referencia: '' });

  // ── Modal estado de cuenta (ledger) ──
  const [ledgerCuenta, setLedgerCuenta] = useState<CuentaPorCobrarDTO | null>(null);

  // ── Derivados: stats ──
  const stats: CobranzaStats = useMemo(() => {
    const totalPorCobrar = cuentas.reduce((acc, c) => acc + c.saldo, 0);
    const vencido = cuentas
      .filter((c) => c.diasAtraso > 0)
      .reduce((acc, c) => acc + c.saldo, 0);
    const cobradoMes = cobros
      .filter((c) => c.fecha.startsWith(mesActual))
      .reduce((acc, c) => acc + c.monto, 0);
    const clientesConSaldo = cuentas.filter((c) => c.saldo > 0).length;
    return { totalPorCobrar, vencido, cobradoMes, clientesConSaldo };
  }, [cuentas, cobros]);

  // ── Derivados: vencimientos ──
  const vencimientos: VencimientoDTO[] = useMemo(
    () =>
      cuentas
        .filter((c) => c.saldo > 0)
        .map((c) => ({
          id: `venc-${c.id}`,
          cuentaId: c.id,
          clienteNombre: c.empresa,
          obra: c.obra,
          monto: c.saldo,
          fechaVencimiento: c.fechaVencimiento,
          diasAtraso: c.diasAtraso,
        })),
    [cuentas],
  );

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

  const filtraCuenta = useMemo(
    () =>
      cuentas.filter((c) => {
        // Búsqueda
        const q = search.toLowerCase();
        const matchQ =
          !q ||
          c.clienteNombre.toLowerCase().includes(q) ||
          c.empresa.toLowerCase().includes(q) ||
          c.obra.toLowerCase().includes(q) ||
          c.facturaFolio.toLowerCase().includes(q);
        // Filtros
        const matchEstado = !filterValues.estado || c.estado === filterValues.estado;
        const matchSituacion = !filterValues.situacion || c.situacion === filterValues.situacion;
        return matchQ && matchEstado && matchSituacion;
      }),
    [cuentas, search, filterValues],
  );

  const filtraCobro = useMemo(
    () =>
      cobros.filter((c) => {
        const q = search.toLowerCase();
        const matchQ =
          !q ||
          c.clienteNombre.toLowerCase().includes(q) ||
          c.referencia.toLowerCase().includes(q);
        const matchMetodo = !filterValues.metodo || c.metodoPago === filterValues.metodo;
        return matchQ && matchMetodo;
      }),
    [cobros, search, filterValues],
  );

  const filtraVenc = useMemo(
    () =>
      vencimientos.filter((v) => {
        const q = search.toLowerCase();
        const matchQ =
          !q ||
          v.clienteNombre.toLowerCase().includes(q) ||
          v.obra.toLowerCase().includes(q);
        const matchRango =
          !filterValues.rango ||
          (filterValues.rango === 'vencido' ? v.diasAtraso > 0 : v.diasAtraso === 0);
        return matchQ && matchRango;
      }),
    [vencimientos, search, filterValues],
  );

  // Paginación client-side (fase mock)
  const pagina = (lista: unknown[]) => Math.max(1, Math.ceil(lista.length / PAGE_SIZE));

  const cuentasPagina = useMemo(
    () => filtraCuenta.slice((pageCuentas - 1) * PAGE_SIZE, pageCuentas * PAGE_SIZE),
    [filtraCuenta, pageCuentas],
  );
  const cobrosPagina = useMemo(
    () => filtraCobro.slice((pageCobros - 1) * PAGE_SIZE, pageCobros * PAGE_SIZE),
    [filtraCobro, pageCobros],
  );
  const vencPagina = useMemo(
    () => filtraVenc.slice((pageVenc - 1) * PAGE_SIZE, pageVenc * PAGE_SIZE),
    [filtraVenc, pageVenc],
  );

  const handleSearch = (val?: string) => {
    const q = val ?? search;
    setSearch(q);
    setPageCuentas(1);
    setPageCobros(1);
    setPageVenc(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    const next = { ...filterValues };
    if (value) next[key] = value;
    else delete next[key];
    setFilterValues(next);
    setPageCuentas(1);
    setPageCobros(1);
    setPageVenc(1);
  };

  const handleClearFilters = () => {
    setFilterValues({});
    setPageCuentas(1);
    setPageCobros(1);
    setPageVenc(1);
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

  const cuentaSeleccionada = cuentas.find((c) => c.id === cobroForm.cuentaId);

  const handleRegistrarCobro = () => {
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

    const nuevo: CobroDTO = {
      id: generarIdCobro(),
      cuentaId: cuenta.id,
      clienteNombre: cuenta.empresa,
      monto,
      fecha: cobroForm.fecha || hoyISO,
      referencia: cobroForm.referencia.trim() || 'Sin referencia',
      metodoPago: cobroForm.metodoPago,
    };

    const nuevoPagado = cuenta.montoPagado + monto;
    const nuevoSaldo = Math.max(0, cuenta.saldo - monto);
    const nuevoEstado: EstadoCuentaCobranza = nuevoSaldo === 0 ? 'SALDADO' : cuenta.estado === 'PENDIENTE' ? 'PARCIAL' : 'PARCIAL';

    setCuentas((prev) =>
      prev.map((c) =>
        c.id === cuenta.id
          ? {
              ...c,
              montoPagado: nuevoPagado,
              saldo: nuevoSaldo,
              estado: nuevoEstado,
              situacion: nuevoSaldo === 0 ? 'SALDADO' : c.situacion,
              ultimoCobroFecha: nuevo.fecha,
            }
          : c,
      ),
    );
    setCobros((prev) => [nuevo, ...prev]);
    setCobroModal(false);
    showToast(`✅ Cobro de ${formatCurrency(monto)} registrado para ${cuenta.empresa}.`, 'success');
  };

  // ── Exportar CSV del tab activo (RBAC: exportar) ──
  const handleExportar = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines: (string | number)[][] =
      tab === 'cuentas'
        ? [['Cliente', 'Obra', 'Factura', 'Total', 'Pagado', 'Saldo', 'Vencimiento', 'Estado'],
           ...filtraCuenta.map((c) => [c.empresa, c.obra, c.facturaFolio, c.monto, c.montoPagado, c.saldo, c.fechaVencimiento, ESTADO_LABEL[c.estado]])]
        : tab === 'cobros'
          ? [['Fecha', 'Cliente', 'Referencia', 'Método', 'Monto'],
             ...filtraCobro.map((c) => [c.fecha, c.clienteNombre, c.referencia, metodoLabel[c.metodoPago], c.monto])]
          : [['Cliente', 'Obra', 'Vencimiento', 'Días atraso', 'Monto'],
             ...filtraVenc.map((v) => [v.clienteNombre, v.obra, v.fechaVencimiento, v.diasAtraso, v.monto])];

    const csv = lines.map((row) => row.map(esc).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cobranza-${tab}-${hoyISO}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ Reporte exportado a CSV.', 'success');
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
          <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => setLedgerCuenta(c)}>
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

  // ── Ledger (movimientos por cuenta) ──
  const ledgerMovimientos = useMemo(
    () => (ledgerCuenta ? cobros.filter((c) => c.cuentaId === ledgerCuenta.id) : []),
    [ledgerCuenta, cobros],
  );

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
          { key: 'cuentas', label: 'Cuentas por cobrar', icon: <ReceiptText className="w-4 h-4" />, count: filtraCuenta.length },
          { key: 'cobros', label: 'Movimientos de cobro', icon: <HandCoins className="w-4 h-4" />, count: filtraCobro.length },
          { key: 'vencimientos', label: 'Vencimientos', icon: <CalendarClock className="w-4 h-4" />, count: filtraVenc.length },
        ]}
        onChange={(key) => {
          setTab(key as 'cuentas' | 'cobros' | 'vencimientos');
          setSearch('');
          setFilterValues({});
          setShowFilters(false);
          setPageCuentas(1);
          setPageCobros(1);
          setPageVenc(1);
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

            <ActiveFilters filters={activeFilters} onRemove={handleRemoveFilter} onClearAll={handleClearFilters} />
            {showFilters && (
              <FilterPanel
                filters={filterFields}
                values={filterValues}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
              />
            )}

            {cuentasPagina.length === 0 ? (
              <EmptyState
                title="Sin cuentas por cobrar"
                subtitle="No se encontraron cuentas para la búsqueda o filtros aplicados."
              />
            ) : (
              <>
                <DataTable
                  columns={cuentaColumns}
                  data={cuentasPagina}
                  keyExtractor={(c) => c.id}
                  emptyText="No se encontraron cuentas."
                  maxBodyHeight="500px"
                />
                <Pagination
                  currentPage={pageCuentas}
                  totalPages={pagina(filtraCuenta)}
                  totalRecords={filtraCuenta.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPageCuentas}
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

            <ActiveFilters filters={activeFilters} onRemove={handleRemoveFilter} onClearAll={handleClearFilters} />
            {showFilters && (
              <FilterPanel
                filters={filterFields}
                values={filterValues}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
              />
            )}

            {cobrosPagina.length === 0 ? (
              <EmptyState
                title="Sin movimientos de cobro"
                subtitle="No se encontraron cobros para la búsqueda o filtros aplicados."
              />
            ) : (
              <>
                <DataTable
                  columns={cobroColumns}
                  data={cobrosPagina}
                  keyExtractor={(c) => c.id}
                  emptyText="No se encontraron cobros."
                  maxBodyHeight="500px"
                />
                <Pagination
                  currentPage={pageCobros}
                  totalPages={pagina(filtraCobro)}
                  totalRecords={filtraCobro.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPageCobros}
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

            <ActiveFilters filters={activeFilters} onRemove={handleRemoveFilter} onClearAll={handleClearFilters} />
            {showFilters && (
              <FilterPanel
                filters={filterFields}
                values={filterValues}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
              />
            )}

            {vencPagina.length === 0 ? (
              <EmptyState
                title="Sin vencimientos pendientes"
                subtitle="No hay saldos por cobrar con vencimientos para este rango."
              />
            ) : (
              <>
                <DataTable
                  columns={vencColumns}
                  data={vencPagina}
                  keyExtractor={(v) => v.id}
                  emptyText="No se encontraron vencimientos."
                  maxBodyHeight="500px"
                />
                <Pagination
                  currentPage={pageVenc}
                  totalPages={pagina(filtraVenc)}
                  totalRecords={filtraVenc.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPageVenc}
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
            {cuentas
              .filter((c) => c.saldo > 0)
              .map((c) => (
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
                  <p className="text-lg font-black text-red-600">{formatCurrency(ledgerCuenta.saldo)}</p>
                </div>
              </div>

              {ledgerMovimientos.length === 0 ? (
                <EmptyState
                  title="Sin cobros registrados"
                  subtitle="Esta cuenta aún no tiene movimientos de cobro."
                />
              ) : (
                <div className="space-y-2">
                  {ledgerMovimientos.map((m) => (
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
      </Modal>
    </div>
  );
}