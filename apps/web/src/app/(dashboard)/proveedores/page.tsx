"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, FileText, Pencil, Trash2, CreditCard, AlertCircle, XCircle, Eye, CheckCircle2,
  Truck, ClipboardList, Wallet, ShoppingCart,
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
import { FormModal, Modal, ModalHeader, ModalBody, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import {
  proveedoresApi, ordenesCompraApi,
  type ProveedorDTO, type OrdenCompraDTO, type EstadoCuentaResumenDTO,
  type LedgerDetalleDTO, type EstadoOrdenApi,
} from '@/lib/api';

// ─── Tipos UI ────────────────────────────────────────────────────────────────
type CategoriaProveedor = 'Refacciones' | 'Combustible' | 'Materiales' | 'Servicios' | 'Otros';
type EstadoOrden = 'Pendiente' | 'Aprobada' | 'Recibida' | 'Cancelada';

/** Mapeo estado API (backend) → etiqueta UI (es-MX). */
const ESTADO_LABEL: Record<EstadoOrdenApi, EstadoOrden> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECIBIDA: 'Recibida',
  CANCELADA: 'Cancelada',
};

// ─── Constantes ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

const CATEGORIAS: CategoriaProveedor[] = ['Refacciones', 'Combustible', 'Materiales', 'Servicios', 'Otros'];
const MEDIOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'MIXTO'] as const;

const badgeVariant: Record<CategoriaProveedor, 'info' | 'warning' | 'success' | 'neutral' | 'primary'> = {
  Refacciones: 'info',
  Combustible: 'warning',
  Materiales: 'success',
  Servicios: 'neutral',
  Otros: 'primary',
};

const estadoVariant: Record<EstadoOrden, 'warning' | 'info' | 'success' | 'error'> = {
  Pendiente: 'warning',
  Aprobada: 'info',
  Recibida: 'success',
  Cancelada: 'error',
};

// ─── Estado inicial de formularios ────────────────────────────────────────────
const emptyProvForm = {
  nombre: '',
  rfc: '',
  telefono: '',
  correo: '',
  categoria: 'Refacciones' as CategoriaProveedor,
};

const emptyOcForm = {
  proveedorId: '',
  descripcion: '',
  monto: '',
};

export default function ProveedoresPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === '/proveedores');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Datos ──
  const [proveedores, setProveedores] = useState<ProveedorDTO[]>([]);
  const [paginationProv, setPaginationProv] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [ordenes, setOrdenes] = useState<OrdenCompraDTO[]>([]);
  const [paginationOC, setPaginationOC] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [resumen, setResumen] = useState<EstadoCuentaResumenDTO[]>([]);
  const [proveedoresCatalogo, setProveedoresCatalogo] = useState<ProveedorDTO[]>([]);
  const [ledger, setLedger] = useState<LedgerDetalleDTO | null>(null);
  const [stats, setStats] = useState({ porPagar: 0, ordenesActivas: 0, totalCompras: 0 });

  // ── UI state ──
  const [tab, setTab] = useState<'proveedores' | 'ordenes' | 'estados'>('proveedores');
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [pageEstados, setPageEstados] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Modales ──
  const [provModal, setProvModal] = useState(false);
  const [editProvId, setEditProvId] = useState<string | null>(null);
  const [provForm, setProvForm] = useState(emptyProvForm);
  const [deleteProv, setDeleteProv] = useState<ProveedorDTO | null>(null);
  const [ocModal, setOcModal] = useState(false);
  const [ocForm, setOcForm] = useState(emptyOcForm);
  const [abonoOC, setAbonoOC] = useState<OrdenCompraDTO | null>(null);
  const [abonoForm, setAbonoForm] = useState({ monto: '', metodoPago: 'EFECTIVO' as string });
  const [cancelOC, setCancelOC] = useState<OrdenCompraDTO | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [confirmCambio, setConfirmCambio] = useState<{ orden: OrdenCompraDTO; estado: 'APROBADA' | 'RECIBIDA' } | null>(null);
  const [deleteOC, setDeleteOC] = useState<OrdenCompraDTO | null>(null);
  const [detalleProv, setDetalleProv] = useState<EstadoCuentaResumenDTO | null>(null);

  // ── Helpers de datos (resumen por proveedor) ──
  const resumenPorProv = useMemo(() => {
    const map = new Map<string, EstadoCuentaResumenDTO>();
    resumen.forEach((r) => map.set(r.proveedorId, r));
    return map;
  }, [resumen]);

  const saldoProveedor = (proveedorId: string) => resumenPorProv.get(proveedorId)?.saldo ?? 0;
  const totalComprado = (proveedorId: string) => resumenPorProv.get(proveedorId)?.total ?? 0;

  // ── Estados de cuenta: búsqueda + filtro + paginación client-side ──
  // (el endpoint /estados-cuenta devuelve todo el resumen; se filtra en el cliente)
  const resumenFiltrado = useMemo(() => {
    let rows = resumen;
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) => r.proveedor.toLowerCase().includes(q));
    const situacion = filterValues.situacion;
    if (situacion === 'con_saldo') rows = rows.filter((r) => r.saldo > 0);
    else if (situacion === 'saldado') rows = rows.filter((r) => r.saldo === 0);
    return rows;
  }, [resumen, search, filterValues]);

  const resumenPagina = useMemo(() => {
    const start = (pageEstados - 1) * PAGE_SIZE;
    return resumenFiltrado.slice(start, start + PAGE_SIZE);
  }, [resumenFiltrado, pageEstados]);

  const totalPagesEstados = Math.max(1, Math.ceil(resumenFiltrado.length / PAGE_SIZE));

  // ── Carga de datos (patrón /inventario: initialLoading + refreshing) ──
  const fetchProveedores = useCallback(async (page = 1, searchVal?: string, filters?: Record<string, string>) => {
    const res = await proveedoresApi.listar({
      search: searchVal || undefined,
      categoria: filters?.categoria || undefined,
      page,
      limit: PAGE_SIZE,
    });
    if (res.success && res.data) {
      setProveedores(res.data.items);
      setPaginationProv(res.data.pagination);
    } else {
      showToast('Error al cargar proveedores.', 'error');
    }
  }, [showToast]);

  const fetchOrdenes = useCallback(async (page = 1, searchVal?: string, filters?: Record<string, string>) => {
    const res = await ordenesCompraApi.listar({
      search: searchVal || undefined,
      estado: filters?.estado as EstadoOrdenApi | undefined,
      page,
      limit: PAGE_SIZE,
    });
    if (res.success && res.data) {
      setOrdenes(res.data.items);
      setPaginationOC(res.data.pagination);
    } else {
      showToast('Error al cargar órdenes de compra.', 'error');
    }
  }, [showToast]);

  const fetchResumen = useCallback(async () => {
    const res = await proveedoresApi.estadosCuenta();
    if (res.success && res.data) setResumen(res.data);
  }, []);

  const fetchCatalogo = useCallback(async () => {
    const res = await proveedoresApi.listar({ page: 1, limit: 100 });
    if (res.success && res.data) setProveedoresCatalogo(res.data.items);
  }, []);

  const fetchStats = useCallback(async () => {
    const [res, pend, aprob] = await Promise.all([
      proveedoresApi.estadosCuenta(),
      ordenesCompraApi.listar({ estado: 'PENDIENTE', page: 1, limit: 1 }),
      ordenesCompraApi.listar({ estado: 'APROBADA', page: 1, limit: 1 }),
    ]);
    const suma = (rows: EstadoCuentaResumenDTO[], key: 'total' | 'pagado' | 'saldo') =>
      rows.reduce((acc, r) => acc + r[key], 0);
    setStats({
      porPagar: res.success && res.data ? suma(res.data, 'saldo') : 0,
      totalCompras: res.success && res.data ? suma(res.data, 'total') : 0,
      ordenesActivas:
        (pend.success ? pend.data.pagination.total : 0) +
        (aprob.success ? aprob.data.pagination.total : 0),
    });
  }, []);

  useEffect(() => {
    const inicial = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          fetchProveedores(1),
          fetchOrdenes(1),
          fetchResumen(),
          fetchCatalogo(),
          fetchStats(),
        ]);
      } catch {
        showToast('No se pudo conectar con el servidor.', 'error');
      } finally {
        hasLoaded.current = true;
        setInitialLoading(false);
      }
    };
    inicial();
  }, [fetchProveedores, fetchOrdenes, fetchResumen, fetchCatalogo, fetchStats, showToast]);

  /** Refetch tras una mutación: datos visibles + resumen + stats. */
  const refetchAll = useCallback(async () => {
    if (!hasLoaded.current) return;
    setRefreshing(true);
    try {
      await Promise.all([
        fetchProveedores(paginationProv.page, search, filterValues),
        fetchOrdenes(paginationOC.page, search, filterValues),
        fetchResumen(),
        fetchCatalogo(),
        fetchStats(),
      ]);
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [fetchProveedores, fetchOrdenes, fetchResumen, fetchCatalogo, fetchStats,
    paginationProv.page, paginationOC.page, search, filterValues, showToast]);

  // ── Filtros por tab ──
  const activeFilters: ActiveFilter[] = useMemo(
    () =>
      Object.entries(filterValues)
        .filter(([, v]) => v)
        .map(([key, value]) => ({
          key,
          label: key === 'categoria' ? 'Categoría' : key === 'estado' ? 'Estado' : 'Situación',
          value,
        })),
    [filterValues],
  );

  const filterFields: FilterField[] =
    tab === 'proveedores'
      ? [{ key: 'categoria', label: 'Categoría', type: 'select', options: CATEGORIAS.map((c) => ({ value: c, label: c })) }]
      : tab === 'ordenes'
        ? [{ key: 'estado', label: 'Estado', type: 'select', options: (Object.keys(ESTADO_LABEL) as EstadoOrdenApi[]).map((e) => ({ value: e, label: ESTADO_LABEL[e] })) }]
        : [{ key: 'situacion', label: 'Situación', type: 'select', options: [{ value: 'con_saldo', label: 'Con saldo' }, { value: 'saldado', label: 'Saldado' }] }];

  const handleSearch = (val?: string) => {
    const q = val ?? search;
    if (tab === 'proveedores') fetchProveedores(1, q, filterValues);
    else if (tab === 'ordenes') fetchOrdenes(1, q, filterValues);
    else setPageEstados(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    const next = { ...filterValues };
    if (value) next[key] = value;
    else delete next[key];
    setFilterValues(next);
    if (tab === 'proveedores') fetchProveedores(1, search, next);
    else if (tab === 'ordenes') fetchOrdenes(1, search, next);
    else setPageEstados(1);
  };

  const handleClearFilters = () => {
    setFilterValues({});
    if (tab === 'proveedores') fetchProveedores(1, search, {});
    else if (tab === 'ordenes') fetchOrdenes(1, search, {});
    else setPageEstados(1);
  };

  // ── Handlers: proveedor ──
  const openCreateProv = () => {
    setEditProvId(null);
    setProvForm(emptyProvForm);
    setProvModal(true);
  };

  const openEditProv = (p: ProveedorDTO) => {
    setEditProvId(p.id);
    setProvForm({
      nombre: p.nombre,
      rfc: p.rfc ?? '',
      telefono: p.telefono ?? '',
      correo: p.correo ?? '',
      categoria: (p.categoria as CategoriaProveedor) || 'Otros',
    });
    setProvModal(true);
  };

  const handleGuardarProveedor = useCallback(async () => {
    if (!provForm.nombre.trim()) {
      showToast('El nombre del proveedor es obligatorio.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        nombre: provForm.nombre.trim(),
        rfc: provForm.rfc.trim() || undefined,
        telefono: provForm.telefono.trim() || undefined,
        correo: provForm.correo.trim() || undefined,
        categoria: provForm.categoria,
      };
      const res = editProvId
        ? await proveedoresApi.actualizar(editProvId, payload)
        : await proveedoresApi.crear(payload);
      if (res.success) {
        showToast(
          editProvId ? 'Proveedor actualizado correctamente.' : 'Proveedor agregado correctamente.',
          'success',
        );
        setProvModal(false);
        refetchAll();
      } else {
        showToast(res.error?.message || 'Error al guardar proveedor.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [provForm, editProvId, showToast, refetchAll]);

  const handleEliminarProveedor = useCallback(async () => {
    if (!deleteProv) return;
    setSubmitting(true);
    try {
      const res = await proveedoresApi.eliminar(deleteProv.id);
      if (res.success) {
        showToast('Proveedor eliminado.', 'success');
        setDeleteProv(null);
        refetchAll();
      } else {
        showToast(res.error?.message || 'Error al eliminar proveedor.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [deleteProv, showToast, refetchAll]);

  // ── Handlers: órdenes de compra ──
  const handleCrearOrden = useCallback(async () => {
    if (!ocForm.proveedorId || !ocForm.descripcion.trim() || !ocForm.monto) {
      showToast('Todos los campos son obligatorios.', 'error');
      return;
    }
    const monto = parseFloat(ocForm.monto);
    if (!monto || monto <= 0) {
      showToast('Ingresa un monto válido.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await ordenesCompraApi.crear({
        proveedorId: ocForm.proveedorId,
        descripcion: ocForm.descripcion.trim(),
        monto,
      });
      if (res.success) {
        showToast('Orden de compra creada correctamente.', 'success');
        setOcModal(false);
        setOcForm(emptyOcForm);
        refetchAll();
      } else {
        showToast(res.error?.message || 'Error al crear la orden.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [ocForm, showToast, refetchAll]);

  const handleAbono = useCallback(async () => {
    if (!abonoOC) return;
    const abono = parseFloat(abonoForm.monto);
    if (!abono || abono <= 0) {
      showToast('Ingresa un monto válido.', 'error');
      return;
    }
    if (abono > abonoOC.saldo) {
      showToast(`El abono no puede superar el saldo pendiente (${formatCurrency(abonoOC.saldo)}).`, 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await proveedoresApi.abonar(abonoOC.proveedorId, {
        ordenCompraId: abonoOC.id,
        monto: abono,
        metodoPago: abonoForm.metodoPago,
      });
      if (res.success) {
        showToast(`Abono de ${formatCurrency(abono)} registrado.`, 'success');
        setAbonoOC(null);
        setAbonoForm({ monto: '', metodoPago: 'EFECTIVO' });
        refetchAll();
      } else {
        showToast(res.error?.message || 'Error al registrar el abono.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [abonoOC, abonoForm, showToast, refetchAll]);

  const handleCambiarEstado = useCallback(
    async (orden: OrdenCompraDTO, estado: EstadoOrdenApi, motivo?: string) => {
      setSubmitting(true);
      try {
        const res = await ordenesCompraApi.cambiarEstado(orden.id, { estado, motivo });
        if (res.success) {
          showToast(`Orden ${res.data.folio} marcada como ${ESTADO_LABEL[estado]}.`, 'success');
          setCancelOC(null);
          setConfirmCambio(null);
          setMotivoCancelacion('');
          refetchAll();
        } else {
          showToast(res.error?.message || 'Error al cambiar el estado.', 'error');
        }
      } catch {
        showToast('No se pudo conectar con el servidor.', 'error');
      } finally {
        setSubmitting(false);
      }
    },
    [showToast, refetchAll],
  );

  const handleEliminarOrden = useCallback(async () => {
    if (!deleteOC) return;
    setSubmitting(true);
    try {
      const res = await ordenesCompraApi.eliminar(deleteOC.id);
      if (res.success) {
        showToast('Orden de compra eliminada.', 'success');
        setDeleteOC(null);
        refetchAll();
      } else {
        showToast(res.error?.message || 'Error al eliminar la orden.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [deleteOC, showToast, refetchAll]);

  // ── Handler: ledger (estados de cuenta) ──
  // La modal se abre SOLO cuando el ledger ya fue cargado: evita el
  // parpadeo de "modal vacía" que se veía al abrirla durante el fetch.
  const openLedger = useCallback(async (r: EstadoCuentaResumenDTO) => {
    try {
      const res = await proveedoresApi.ledger(r.proveedorId);
      if (!res.success) {
        showToast(res.error?.message || 'Error al cargar el estado de cuenta.', 'error');
        return;
      }
      setLedger(res.data);
      setDetalleProv(r);
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    }
  }, [showToast]);

  // ── Columnas DataTable: proveedores ──
  const proveedorColumns: Column<ProveedorDTO>[] = [
    {
      key: 'nombre',
      header: 'Proveedor',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0">
            {p.nombre[0]}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-xs truncate">{p.nombre}</p>
            <p className="text-[10px] text-slate-500 font-medium truncate">{p.correo || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'rfc', header: 'RFC', render: (p) => <span className="text-xs font-medium text-slate-500">{p.rfc ?? '—'}</span> },
    { key: 'telefono', header: 'Teléfono', render: (p) => <span className="text-xs font-medium text-slate-600">{p.telefono ?? '—'}</span> },
    {
      key: 'categoria',
      header: 'Categoría',
      render: (p) => (
        <Badge variant={badgeVariant[(p.categoria as CategoriaProveedor)] ?? 'neutral'} size="sm">
          {p.categoria}
        </Badge>
      ),
    },
    {
      key: 'saldo',
      header: 'Saldo Pendiente',
      align: 'right',
      render: (p) => {
        const saldo = saldoProveedor(p.id);
        return (
          <span className={`text-xs font-black ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(saldo)}
          </span>
        );
      },
    },
    {
      key: 'total',
      header: 'Total Compras',
      align: 'right',
      render: (p) => <span className="text-xs font-black text-slate-700">{formatCurrency(totalComprado(p.id))}</span>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center',
      minWidth: '180px',
      nowrap: true,
      render: (p) => (
        <div className="flex items-center justify-center gap-1">
          {puedeEditar && (
            <Button variant="warning" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEditProv(p)}>
              Editar
            </Button>
          )}
          {puedeEliminar && (
            <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleteProv(p)}>
              Eliminar
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Columnas DataTable: órdenes ──
  const ordenColumns: Column<OrdenCompraDTO>[] = [
    { key: 'folio', header: 'Folio', render: (o) => <span className="font-black text-primary text-xs">{o.folio}</span> },
    {
      key: 'proveedor',
      header: 'Proveedor',
      render: (o) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs shrink-0">
            {(o.proveedor ?? '?')[0]}
          </div>
          <span className="font-bold text-slate-700 text-xs">{o.proveedor ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (o) => <p className="text-xs text-slate-600 font-medium max-w-[220px] truncate">{o.descripcion}</p>,
    },
    { key: 'fecha', header: 'Fecha', render: (o) => <span className="text-xs font-medium text-slate-500">{o.fecha.slice(0, 10)}</span> },
    { key: 'monto', header: 'Monto', align: 'right', render: (o) => <span className="text-xs font-black text-slate-900">{formatCurrency(o.monto)}</span> },
    {
      key: 'pagado',
      header: 'Pagado',
      align: 'right',
      render: (o) => (
        <div>
          <div className="font-black text-green-600 text-xs">{formatCurrency(o.pagado)}</div>
          {o.saldo > 0 && (
            <div className="text-[10px] text-red-500 font-bold">Resta: {formatCurrency(o.saldo)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'center',
      render: (o) => (
        <div className="flex justify-center">
          <Badge variant={estadoVariant[ESTADO_LABEL[o.estado]]} size="sm">
            {ESTADO_LABEL[o.estado]}
          </Badge>
        </div>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center',
      minWidth: '340px',
      nowrap: true,
      render: (o) => {
        const activa = o.estado === 'PENDIENTE' || o.estado === 'APROBADA';
        return (
          <div className="flex items-center justify-center gap-1">
            {o.saldo > 0 && puedeEditar && (
              <Button
                variant="outline"
                size="sm"
                icon={<CreditCard className="w-3.5 h-3.5" />}
                onClick={() => {
                  setAbonoForm({ monto: '', metodoPago: 'EFECTIVO' });
                  setAbonoOC(o);
                }}
              >
                Abonar
              </Button>
            )}
            {o.estado === 'PENDIENTE' && puedeEditar && (
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={() => setConfirmCambio({ orden: o, estado: 'APROBADA' })}
              >
                Aprobar
              </Button>
            )}
            {o.estado === 'APROBADA' && puedeEditar && (
              <Button
                variant="success"
                size="sm"
                icon={<Truck className="w-3.5 h-3.5" />}
                onClick={() => setConfirmCambio({ orden: o, estado: 'RECIBIDA' })}
              >
                Recibir
              </Button>
            )}
            {puedeEditar && (
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="w-3.5 h-3.5" />}
                disabled={o.pagado > 0 || !activa}
                title={
                  o.pagado > 0
                    ? 'No se puede cancelar: la orden ya tiene abonos registrados.'
                    : !activa
                      ? 'No se puede cancelar: la orden ya fue recibida o cancelada.'
                      : 'Cancelar orden de compra'
                }
                onClick={() => {
                  setMotivoCancelacion('');
                  setCancelOC(o);
                }}
              >
                Cancelar
              </Button>
            )}
            {puedeEliminar && (
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                disabled={o.pagado > 0}
                title={
                  o.pagado > 0
                    ? 'No se puede eliminar: la orden ya tiene abonos registrados.'
                    : 'Eliminar orden de compra'
                }
                onClick={() => setDeleteOC(o)}
              >
                Eliminar
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // ── Columnas DataTable: estados de cuenta (resumen por proveedor) ──
  const estadoResumenColumns: Column<EstadoCuentaResumenDTO>[] = [
    {
      key: 'proveedor',
      header: 'Proveedor',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0">
            {r.proveedor[0]}
          </div>
          <p className="font-bold text-slate-900 text-xs truncate">{r.proveedor}</p>
        </div>
      ),
    },
    {
      key: 'operaciones',
      header: 'Estado de Cuenta',
      align: 'center',
      minWidth: '140px',
      nowrap: true,
      render: (r) => (
        <div className="flex justify-center">
          <Button variant="info" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => openLedger(r)}>
            Ver
          </Button>
        </div>
      ),
    },
    { key: 'total', header: 'Total Compras', align: 'right', render: (r) => <span className="text-xs font-black text-slate-700">{formatCurrency(r.total)}</span> },
    { key: 'pagado', header: 'Pagado', align: 'right', render: (r) => <span className="text-xs font-black text-green-600">{formatCurrency(r.pagado)}</span> },
    {
      key: 'saldo',
      header: 'Saldo Pendiente',
      align: 'right',
      render: (r) => (
        <span className={`text-xs font-black ${r.saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(r.saldo)}
        </span>
      ),
    },
  ];

  // ── Columnas DataTable: ledger detalle de un proveedor ──
  const ledgerColumns: Column<LedgerDetalleDTO['movimientos'][number]>[] = [
    { key: 'fecha', header: 'Fecha', render: (r) => <span className="text-xs font-medium text-slate-500">{r.fecha.slice(0, 10)}</span> },
    { key: 'folio', header: 'Folio', render: (r) => <span className="font-black text-primary text-xs">{r.folio}</span> },
    { key: 'concepto', header: 'Concepto', render: (r) => <p className="text-xs text-slate-600 font-medium max-w-[200px] truncate">{r.concepto}</p> },
    { key: 'cargo', header: 'Cargo', align: 'right', render: (r) => <span className="text-xs font-bold text-slate-700">{formatCurrency(r.cargo)}</span> },
    { key: 'abono', header: 'Abono', align: 'right', render: (r) => <span className="text-xs font-bold text-green-600">{formatCurrency(r.abono)}</span> },
    {
      key: 'saldo',
      header: 'Saldo',
      align: 'right',
      render: (r) => (
        <span className={`text-xs font-black ${r.saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(r.saldo)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Proveedores"
        subtitle="Órdenes de compra, pagos y estados de cuenta."
        action={
          puedeCrear ? (
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" icon={<FileText className="w-4 h-4" />} onClick={() => { setOcForm(emptyOcForm); setOcModal(true); }}>
                Nueva Orden
              </Button>
              <Button variant="outline" icon={<Plus className="w-4 h-4" />} onClick={openCreateProv}>
                Proveedor
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          icon={<Wallet className="w-6 h-6" />}
          value={formatCurrency(stats.porPagar)}
          label="Por Pagar"
          color={stats.porPagar > 0 ? 'error' : 'success'}
        />
        <StatsCard
          icon={<ClipboardList className="w-6 h-6" />}
          value={`${stats.ordenesActivas} activas`}
          label="Órdenes Activas"
          color="info"
        />
        <StatsCard
          icon={<ShoppingCart className="w-6 h-6" />}
          value={formatCurrency(stats.totalCompras)}
          label="Total Compras"
          color="neutral"
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { key: 'proveedores', label: 'Proveedores', icon: <Truck className="w-4 h-4" />, count: paginationProv.total },
          { key: 'ordenes', label: 'Órdenes de Compra', icon: <FileText className="w-4 h-4" />, count: paginationOC.total },
          { key: 'estados', label: 'Estados de Cuenta', icon: <Wallet className="w-4 h-4" />, count: resumen.length },
        ]}
        value={tab}
        onChange={(key) => {
          setTab(key as 'proveedores' | 'ordenes' | 'estados');
          setSearch('');
          setFilterValues({});
          setPageEstados(1);
        }}
      >
        {/* ─── PROVEEDORES ─────────────────────────────────────────────── */}
        <TabPanel tabKey="proveedores">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                onSearch={handleSearch}
                placeholder="Buscar proveedor por nombre o RFC..."
                className="flex-1"
                filters={filterFields}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>

            {initialLoading ? (
              <EmptyState title="Cargando proveedores..." subtitle="Espera un momento." />
            ) : proveedores.length === 0 ? (
              <EmptyState
                title="Sin proveedores"
                subtitle="No se encontraron proveedores para la búsqueda o filtros aplicados."
              />
            ) : (
              <>
                <DataTable
                  columns={proveedorColumns}
                  data={proveedores}
                  keyExtractor={(p) => p.id}
                  emptyText="No se encontraron proveedores."
                  maxBodyHeight="500px"
                />
                <Pagination
                  currentPage={paginationProv.page}
                  totalPages={paginationProv.totalPages}
                  totalRecords={paginationProv.total}
                  pageSize={PAGE_SIZE}
                  onPageChange={(page) => fetchProveedores(page, search, filterValues)}
                />
              </>
            )}
          </div>
        </TabPanel>

        {/* ─── ÓRDENES DE COMPRA ───────────────────────────────────────── */}
        <TabPanel tabKey="ordenes">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                onSearch={handleSearch}
                placeholder="Buscar folio, proveedor o descripción..."
                className="flex-1"
                filters={filterFields}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>

            {initialLoading ? (
              <EmptyState title="Cargando órdenes..." subtitle="Espera un momento." />
            ) : ordenes.length === 0 ? (
              <EmptyState
                title="Sin órdenes de compra"
                subtitle="No se encontraron órdenes para la búsqueda o filtros aplicados."
              />
            ) : (
              <>
                <DataTable
                  columns={ordenColumns}
                  data={ordenes}
                  keyExtractor={(o) => o.id}
                  emptyText="No se encontraron órdenes de compra."
                  maxBodyHeight="500px"
                />
                <Pagination
                  currentPage={paginationOC.page}
                  totalPages={paginationOC.totalPages}
                  totalRecords={paginationOC.total}
                  pageSize={PAGE_SIZE}
                  onPageChange={(page) => fetchOrdenes(page, search, filterValues)}
                />
              </>
            )}
          </div>
        </TabPanel>

        {/* ─── ESTADOS DE CUENTA ───────────────────────────────────────── */}
        <TabPanel tabKey="estados">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                onSearch={handleSearch}
                placeholder="Buscar proveedor..."
                className="flex-1"
                filters={filterFields}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>

            {resumenFiltrado.length === 0 ? (
              <EmptyState
                title="Sin estados de cuenta"
                subtitle="No se encontraron proveedores con operaciones para la búsqueda o filtros aplicados."
              />
            ) : (
              <>
                <p className="text-xs text-slate-500 font-medium">
                  Usa el botón <span className="font-bold">Ver</span> de cada proveedor para consultar su estado de cuenta completo (saldo corrido por operación).
                </p>
                <DataTable
                  columns={estadoResumenColumns}
                  data={resumenPagina}
                  keyExtractor={(r) => r.proveedorId}
                  emptyText="Sin proveedores con operaciones."
                  maxBodyHeight="500px"
                />
                <Pagination
                  currentPage={pageEstados}
                  totalPages={totalPagesEstados}
                  totalRecords={resumenFiltrado.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPageEstados}
                />
              </>
            )}
          </div>
        </TabPanel>
      </Tabs>

      {/* Indicador de refetch */}
      {refreshing && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg">
          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Sincronizando...
        </div>
      )}

      {/* ─── Modal Nuevo/Editar Proveedor ───────────────────────────────── */}
      <FormModal
        open={provModal}
        onClose={() => setProvModal(false)}
        onCancel={() => setProvModal(false)}
        title={editProvId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        subtitle={editProvId ? 'Actualiza los datos del proveedor.' : 'Registrar un nuevo proveedor.'}
        submitLabel={editProvId ? 'Guardar Cambios' : 'Agregar Proveedor'}
        cancelLabel="Cancelar"
        isSubmitting={submitting}
        onSubmit={handleGuardarProveedor}
      >
        <ModalField label="Nombre / Razón social" required>
          <input
            type="text"
            className={modalInputClass}
            placeholder="Refacciones CAT México"
            value={provForm.nombre}
            onChange={(e) => setProvForm({ ...provForm, nombre: e.target.value })}
          />
        </ModalField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="RFC">
            <input
              type="text"
              className={modalInputClass}
              placeholder="XXX000000XX0"
              value={provForm.rfc}
              onChange={(e) => setProvForm({ ...provForm, rfc: e.target.value })}
            />
          </ModalField>
          <ModalField label="Categoría">
            <select
              className={modalSelectClass}
              value={provForm.categoria}
              onChange={(e) => setProvForm({ ...provForm, categoria: e.target.value as CategoriaProveedor })}
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </ModalField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Teléfono">
            <input
              type="text"
              className={modalInputClass}
              placeholder="555-0000"
              value={provForm.telefono}
              onChange={(e) => setProvForm({ ...provForm, telefono: e.target.value })}
            />
          </ModalField>
          <ModalField label="Correo">
            <input
              type="email"
              className={modalInputClass}
              placeholder="correo@empresa.com"
              value={provForm.correo}
              onChange={(e) => setProvForm({ ...provForm, correo: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      {/* ─── Modal Nueva Orden de Compra ───────────────────────────────── */}
      <FormModal
        open={ocModal}
        onClose={() => setOcModal(false)}
        onCancel={() => setOcModal(false)}
        title="Nueva Orden de Compra"
        subtitle="Registrar una nueva orden para un proveedor."
        submitLabel="Crear Orden"
        cancelLabel="Cancelar"
        isSubmitting={submitting}
        onSubmit={handleCrearOrden}
      >
        <ModalField label="Proveedor" required>
          <select
            className={modalSelectClass}
            value={ocForm.proveedorId}
            onChange={(e) => setOcForm({ ...ocForm, proveedorId: e.target.value })}
          >
            <option value="">Seleccionar proveedor...</option>
            {proveedoresCatalogo.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Descripción" required>
          <input
            type="text"
            className={modalInputClass}
            placeholder="Filtros de aceite x12, aceite SAE 15W-40..."
            value={ocForm.descripcion}
            onChange={(e) => setOcForm({ ...ocForm, descripcion: e.target.value })}
          />
        </ModalField>
        <ModalField label="Monto Total (MXN)" required>
          <input
            type="number"
            min="0"
            step="0.01"
            className={modalInputClass}
            placeholder="5000"
            value={ocForm.monto}
            onChange={(e) => setOcForm({ ...ocForm, monto: e.target.value })}
          />
        </ModalField>
      </FormModal>

      {/* ─── Modal Abono ────────────────────────────────────────────────── */}
      <FormModal
        open={!!abonoOC}
        onClose={() => { setAbonoOC(null); setAbonoForm({ monto: '', metodoPago: 'EFECTIVO' }); }}
        onCancel={() => { setAbonoOC(null); setAbonoForm({ monto: '', metodoPago: 'EFECTIVO' }); }}
        title="Registrar Abono"
        subtitle="Aplicar un pago parcial o total a la orden."
        submitLabel="Registrar Pago"
        cancelLabel="Cancelar"
        isSubmitting={submitting}
        onSubmit={handleAbono}
      >
        {abonoOC && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-1 text-sm">
            <p className="font-bold text-slate-700">{abonoOC.proveedor ?? '—'}</p>
            <p className="text-slate-500 text-xs">{abonoOC.folio} — {abonoOC.descripcion}</p>
            <div className="flex justify-between mt-2 pt-2 border-t border-slate-200">
              <span className="text-slate-500 text-xs">Pendiente por pagar</span>
              <span className="font-black text-red-600">{formatCurrency(abonoOC.saldo)}</span>
            </div>
          </div>
        )}
        <ModalField label="Monto a Abonar (MXN)" required>
          <input
            type="number"
            min="0"
            step="0.01"
            className={modalInputClass}
            placeholder="0.00"
            value={abonoForm.monto}
            onChange={(e) => setAbonoForm({ ...abonoForm, monto: e.target.value })}
          />
        </ModalField>
        <ModalField label="Método de Pago">
          <select
            className={modalSelectClass}
            value={abonoForm.metodoPago}
            onChange={(e) => setAbonoForm({ ...abonoForm, metodoPago: e.target.value })}
          >
            {MEDIOS_PAGO.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </ModalField>
      </FormModal>

      {/* ─── Modal Confirmar Aprobar / Recibir ─────────────────────────── */}
      <FormModal
        open={!!confirmCambio}
        onClose={() => setConfirmCambio(null)}
        onCancel={() => setConfirmCambio(null)}
        title={confirmCambio?.estado === 'APROBADA' ? 'Aprobar Orden de Compra' : 'Recibir Orden de Compra'}
        subtitle={
          confirmCambio?.estado === 'APROBADA'
            ? 'Autoriza el compromiso de pago con el proveedor.'
            : 'Punto sin retorno: se genera la cuenta por pagar.'
        }
        submitLabel={confirmCambio?.estado === 'APROBADA' ? 'Sí, Aprobar' : 'Sí, Recibir'}
        cancelLabel="Volver"
        isSubmitting={submitting}
        onSubmit={() => {
          if (confirmCambio) handleCambiarEstado(confirmCambio.orden, confirmCambio.estado);
        }}
      >
        {confirmCambio && (
          <div className="flex flex-col items-center text-center py-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                confirmCambio.estado === 'APROBADA' ? 'bg-blue-100' : 'bg-amber-100'
              }`}
            >
              {confirmCambio.estado === 'APROBADA' ? (
                <CheckCircle2 className="w-7 h-7 text-blue-600" />
              ) : (
                <Truck className="w-7 h-7 text-amber-600" />
              )}
            </div>
            {confirmCambio.estado === 'APROBADA' ? (
              <>
                <p className="text-sm text-slate-700 mb-1">¿Confirmas la aprobación de la orden?</p>
                <p className="font-black text-slate-900 text-lg mb-1">{confirmCambio.orden.folio}</p>
                <p className="font-black text-red-600 text-xl mb-2">{formatCurrency(confirmCambio.orden.monto)}</p>
                <p className="text-xs text-slate-500">
                  Se autoriza el compromiso de pago. La orden podrá cancelarse antes de recibirse (si no tiene abonos).
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-700 mb-1">¿Confirmas la recepción de la mercancía?</p>
                <p className="font-black text-slate-900 text-lg mb-1">{confirmCambio.orden.folio}</p>
                <p className="font-black text-red-600 text-xl mb-2">{formatCurrency(confirmCambio.orden.monto)}</p>
                <p className="text-xs text-slate-500">
                  Esto genera la cuenta por pagar por el total y{' '}
                  <span className="font-bold">la orden ya no podrá cancelarse</span>.
                </p>
              </>
            )}
          </div>
        )}
      </FormModal>

      {/* ─── Modal Cancelar Orden ──────────────────────────────────────── */}
      <FormModal
        open={!!cancelOC}
        onClose={() => setCancelOC(null)}
        onCancel={() => setCancelOC(null)}
        title="Cancelar Orden de Compra"
        subtitle="La orden quedará cancelada y no podrá recibir abonos."
        submitLabel="Sí, Cancelar"
        cancelLabel="Volver"
        isSubmitting={submitting}
        onSubmit={() => cancelOC && handleCambiarEstado(cancelOC, 'CANCELADA', motivoCancelacion.trim() || undefined)}
      >
        {cancelOC && (
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-slate-700 mb-1">¿Estás seguro de cancelar la orden?</p>
            <p className="font-black text-slate-900 text-lg mb-3">{cancelOC.folio}</p>
            <ModalField label="Motivo de cancelación" required>
              <input
                type="text"
                className={modalInputClass}
                placeholder="Ej. Error en la requisición, proveedor sin stock..."
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
              />
            </ModalField>
          </div>
        )}
      </FormModal>

      {/* ─── Modal Confirmar Eliminación de Proveedor ──────────────────── */}
      <FormModal
        open={!!deleteProv}
        onClose={() => setDeleteProv(null)}
        onCancel={() => setDeleteProv(null)}
        title="Eliminar Proveedor"
        subtitle="Esta acción no se puede deshacer."
        submitLabel="Sí, Eliminar"
        cancelLabel="Cancelar"
        isSubmitting={submitting}
        onSubmit={handleEliminarProveedor}
      >
        {deleteProv && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-slate-700 mb-1">¿Estás seguro de eliminar el proveedor?</p>
            <p className="font-black text-slate-900 text-lg mb-2">{deleteProv.nombre}</p>
            <p className="text-xs text-slate-500">
              El proveedor no podrá eliminarse si tiene cuentas por pagar pendientes.
            </p>
          </div>
        )}
      </FormModal>

      {/* ─── Modal Confirmar Eliminación de Orden ──────────────────────── */}
      <FormModal
        open={!!deleteOC}
        onClose={() => setDeleteOC(null)}
        onCancel={() => setDeleteOC(null)}
        title="Eliminar Orden de Compra"
        subtitle="Esta acción no se puede deshacer."
        submitLabel="Sí, Eliminar"
        cancelLabel="Cancelar"
        isSubmitting={submitting}
        onSubmit={handleEliminarOrden}
      >
        {deleteOC && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-slate-700 mb-1">¿Estás seguro de eliminar la orden?</p>
            <p className="font-black text-slate-900 text-lg mb-2">{deleteOC.folio}</p>
            <p className="text-xs text-slate-500">
              Solo pueden eliminarse órdenes sin pagos registrados.
            </p>
          </div>
        )}
      </FormModal>

      {/* ─── Modal Estado de Cuenta (ledger detalle) ───────────────────── */}
      <Modal open={!!detalleProv} onClose={() => setDetalleProv(null)} size="lg">
        {detalleProv && (
          <>
            <ModalHeader
              title={detalleProv.proveedor}
              subtitle="Estado de cuenta — saldo corrido por operación."
              onClose={() => setDetalleProv(null)}
            />
            <ModalBody>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total compras</p>
                    <p className="text-lg font-black text-slate-900">
                      {formatCurrency(ledger?.totales.cargo ?? detalleProv.total)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Pagado</p>
                    <p className="text-lg font-black text-green-700">
                      {formatCurrency(ledger?.totales.abono ?? detalleProv.pagado)}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Saldo pendiente</p>
                    <p className={`text-lg font-black ${detalleProv.saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(ledger?.totales.saldo ?? detalleProv.saldo)}
                    </p>
                  </div>
                </div>
                {ledger ? (
                  <DataTable
                    columns={ledgerColumns}
                    data={ledger.movimientos}
                    keyExtractor={(r) => r.folio}
                    emptyText="Sin operaciones registradas."
                    maxBodyHeight="320px"
                  />
                ) : null}
              </div>
            </ModalBody>
          </>
        )}
      </Modal>
    </div>
  );
}