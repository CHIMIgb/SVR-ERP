"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus, FileText, SlidersHorizontal, X, Pencil,
  Eye, Clock, CheckCircle2, XCircle, CalendarDays,
  Building2, TrendingUp, ThumbsDown, User,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar, type ActiveFilter } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import {
  FormModal, Modal, ModalHeader, ModalBody, ModalFooter,
  ModalField, modalInputClass, modalSelectClass,
} from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { formatCurrency, formatFechaSolo, formatearMiles, parsearMiles, fechaLocalHoy } from '@/lib/formatters';
import {
  cotizacionesApi,
  clientesApi,
  type CotizacionDTO,
  type CotizacionesStats,
  type ClienteDTO,
  type EstadoCotizacionApi,
} from '@/lib/api';
import { RefreshOverlay } from '@/components/ui/RefreshOverlay';
import { mensajeErrorApi } from '@/lib/api';

// ── Constantes ──
const PAGE_SIZE = 10;

/** Condiciones precargadas del Word (COTIZACION 37/50): el usuario las edita. */
const CONDICIONES_PLANTILLA =
  'Estos precios no incluyen IVA.\n' +
  'El turno por día se tomará a 8 horas.\n' +
  'Vigencia de la presente cotización 8 días a partir de su elaboración.\n' +
  'Anticipar una semana antes de la fecha de inicio de trabajo para verificar disponibilidad.';

/** Renglón vacío para el editor de partidas (todo string para los inputs). */
const emptyPartida = { descripcion: '', cantidad: '', unidad: '', precio: '' };

const emptyStats: CotizacionesStats = {
  total: 0,
  pendientes: 0,
  aceptadas: 0,
  rechazadas: 0,
  montoAceptado: 0,
};

const emptyForm = {
  clienteId: '',
  descripcion: '',
  monto: '',
  fecha: fechaLocalHoy(),
  condiciones: CONDICIONES_PLANTILLA,
  items: [emptyPartida] as { descripcion: string; cantidad: string; unidad: string; precio: string }[],
};

// ── Helpers ──
/** Solo texto, sin badge de color (decisión del cliente). */
function estadoBadge(estado: CotizacionDTO['estado']) {
  return <span className="font-semibold text-ui-600">{estado}</span>;
}

export default function CotizacionesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find(v => v.ruta === '/cotizaciones');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;

  // ── Estado de datos ──
  const [cotizaciones, setCotizaciones] = useState<CotizacionDTO[]>([]);
  const [stats, setStats] = useState<CotizacionesStats>(emptyStats);
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  // ── Estado de búsqueda y filtros ──
  const [search, setSearch] = useState('');
  // ?clienteId=xxx (navegación desde /clientes) precarga el filtro de cliente.
  const [filterValues, setFilterValues] = useState<Record<string, string>>((): Record<string, string> => {
    const clienteId = searchParams.get('clienteId');
    return clienteId ? { clienteId } : {};
  });
  const [showFilters, setShowFilters] = useState(false);

  // ── Estado de modales ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  /** La cotización editada tenía partidas: el PATCH siempre envía el reemplazo. */
  const [editHasItems, setEditHasItems] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState<'ACEPTADA' | 'RECHAZADA'>('ACEPTADA');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [generarFactura, setGenerarFactura] = useState(false);
  const [selected, setSelected] = useState<CotizacionDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Cargar clientes (catálogo para el selector de "Nueva Cotización") ──
  useEffect(() => {
    clientesApi.listar({ limit: 100 }).then((res) => {
      if (res.success && res.data) setClientes(res.data.items);
    });
  }, []);

  // ── Cargar datos ──
  const fetchData = useCallback(async (page = 1, searchVal?: string, filters?: Record<string, string>) => {
    if (!hasLoaded.current) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await cotizacionesApi.listar({
        search: searchVal || undefined,
        estado: filters?.estado as EstadoCotizacionApi | undefined,
        clienteId: filters?.clienteId || undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setCotizaciones(res.data.items);
        setPagination(res.data.pagination);
      } else {
        showToast('Error al cargar cotizaciones.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      hasLoaded.current = true;
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  const fetchStats = useCallback(async () => {
    const res = await cotizacionesApi.stats();
    if (res.success && res.data) {
      setStats(res.data);
    }
  }, []);

  useEffect(() => {
    // Usa los filtros iniciales (p. ej. ?clienteId=xxx desde /clientes).
    // No se incluye filterValues en deps: los cambios manuales ya fetchean via handlers.
    fetchData(1, search, filterValues);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, fetchStats]);

  // ── Filtros activos (chips) ──
  const activeFilters: ActiveFilter[] = [];
  if (filterValues.estado) {
    const label =
      filterValues.estado === 'ACEPTADA' ? 'Aceptada' :
      filterValues.estado === 'RECHAZADA' ? 'Rechazada' : 'Pendiente';
    activeFilters.push({ key: 'estado', label: 'Estado', value: label });
  }
  if (filterValues.clienteId) {
    const cl = clientes.find(c => c.id === filterValues.clienteId);
    activeFilters.push({ key: 'clienteId', label: 'Cliente', value: cl?.empresa ?? filterValues.clienteId });
  }

  // ── Handlers de filtros ──
  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const handleSearch = useCallback(() => fetchData(1, search, filterValues), [fetchData, search, filterValues]);
  const handleFilterChange = useCallback((key: string, value: string) => {
    const next = { ...filterValues, [key]: value };
    setFilterValues(next);
    fetchData(1, search, next);
  }, [fetchData, search, filterValues]);
  const handleRemoveFilter = useCallback((key: string) => {
    const next = { ...filterValues };
    delete next[key];
    setFilterValues(next);
    fetchData(1, search, next);
  }, [fetchData, search, filterValues]);
  const handleClearFilters = useCallback(() => {
    setFilterValues({});
    fetchData(1, search, {});
  }, [fetchData, search]);
  const handlePageChange = useCallback((page: number) => {
    fetchData(page, search, filterValues);
  }, [fetchData, search, filterValues]);

  // ── Handlers de vista ──
  const openDetail = useCallback((item: CotizacionDTO) => {
    setSelected(item);
    setDetailOpen(true);
    // El listado no trae partidas: el detalle las pide al backend.
    cotizacionesApi.obtener(item.id).then((res) => {
      if (res.success && res.data) setSelected(res.data);
    });
  }, []);

  const openCrear = useCallback(() => {
    setForm({
      ...emptyForm,
      clienteId: filterValues.clienteId || '',
    });
    setCreateOpen(true);
  }, [filterValues.clienteId]);

  const openEstado = useCallback((item: CotizacionDTO, next: 'ACEPTADA' | 'RECHAZADA') => {
    setSelected(item);
    setSelectedEstado(next);
    setMotivoRechazo('');
    setGenerarFactura(false);
    setEstadoOpen(true);
  }, []);

  const openEditar = useCallback((item: CotizacionDTO) => {
    setEditId(item.id);
    setEditHasItems(Boolean(item.items?.length));
    setEditForm({
      clienteId: item.clienteId,
      descripcion: item.descripcion,
      monto: formatearMiles(String(item.monto)),
      fecha: item.fecha,
      condiciones: item.condiciones ?? CONDICIONES_PLANTILLA,
      items: item.items?.length
        ? item.items.map((it) => ({
            descripcion: it.descripcion,
            cantidad: String(it.cantidad),
            unidad: it.unidad,
            precio: String(it.precioUnitario),
          }))
        : [emptyPartida],
    });
    setDetailOpen(false);
    setEditOpen(true);
  }, []);

  const refresh = useCallback(() => {
    fetchData(pagination.page, search, filterValues);
    fetchStats();
  }, [fetchData, pagination.page, search, filterValues, fetchStats]);

  // ── Handlers del editor de partidas (crear y editar comparten el patrón) ──
  const moverPartida = (
    items: typeof emptyForm.items,
    indice: number,
    cambio: Partial<typeof emptyPartida>,
  ) => items.map((p, i) => (i === indice ? { ...p, ...cambio } : p));

  const totalPartidas = (items: typeof emptyForm.items) =>
    items.reduce((suma, p) => {
      const monto = Number(p.cantidad) * Number(p.precio);
      return suma + (isNaN(monto) ? 0 : monto);
    }, 0);

  const partidasValidas = (items: typeof emptyForm.items) =>
    items.every(
      (p) =>
        p.descripcion.trim() &&
        p.unidad.trim() &&
        Number(p.cantidad) > 0 &&
        !isNaN(Number(p.cantidad)) &&
        !isNaN(Number(p.precio)) &&
        Number(p.precio) >= 0,
    );

  // ── Crear cotización ──
  const handleCreate = useCallback(async () => {
    if (!form.clienteId) {
      showToast('Selecciona un cliente.', 'error');
      return;
    }
    if (!form.descripcion.trim()) {
      showToast('Ingresa una descripción o concepto.', 'error');
      return;
    }
    const conPartidas = form.items.some((p) => p.descripcion.trim() || p.cantidad || p.precio);
    if (conPartidas && !partidasValidas(form.items)) {
      showToast('Cada partida necesita descripción, cantidad, unidad y precio válido.', 'error');
      return;
    }
    const itemsPayload = conPartidas
      ? form.items.map((p) => ({
          descripcion: p.descripcion.trim(),
          cantidad: Number(p.cantidad),
          unidad: p.unidad.trim(),
          precioUnitario: Number(p.precio),
        }))
      : undefined;
    const monto = conPartidas ? totalPartidas(form.items) : parsearMiles(form.monto);
    if (conPartidas ? monto <= 0 : isNaN(monto) || monto <= 0) {
      showToast('Ingresa un monto válido.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await clientesApi.crearCotizacion(form.clienteId, {
        descripcion: form.descripcion.trim(),
        monto,
        fecha: form.fecha,
        ...(form.condiciones.trim() ? { condiciones: form.condiciones.trim() } : {}),
        ...(itemsPayload ? { items: itemsPayload } : {}),
      });
      if (res.success) {
        showToast(`Cotización ${res.data.codigo ?? ''} creada por ${formatCurrency(res.data.monto)}.`, 'success');
        setCreateOpen(false);
        refresh();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al crear cotización.'), 'error');
      }
    } catch {
      showToast('Error de conexión al crear cotización.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [form, showToast, refresh]);

  // ── Cambiar estado (Aceptar / Rechazar) ──
  const handleCambiarEstado = useCallback(async () => {
    if (!selected) return;
    const esRechazo = selectedEstado === 'RECHAZADA';
    const motivo = esRechazo ? motivoRechazo.trim() : '';
    if (esRechazo && !motivo) {
      showToast('Indica el motivo por el cual se rechaza la cotización.', 'error');
      return;
    }
    setSubmitting(true);
    const actionLabel = esRechazo ? 'rechazada' : 'aceptada';
    try {
      // Si el usuario marcó "Generar factura", facturar() acepta la cotización
      // y crea factura + CxC en una sola transacción.
      const res = generarFactura && !esRechazo
        ? await cotizacionesApi.facturar(selected.id)
        : await cotizacionesApi.cambiarEstado(selected.id, {
            estado: selectedEstado,
            ...(motivo ? { motivoRechazo: motivo } : {}),
          });
      if (res.success) {
        const facturada = generarFactura && !esRechazo;
        showToast(
          facturada
            ? `Cotización ${selected.codigo ?? ''} aceptada y facturada.`
            : `Cotización ${selected.codigo ?? ''} ${actionLabel}.`,
          'success',
        );
        setEstadoOpen(false);
        setSelected(null);
        refresh();
      } else {
        showToast(mensajeErrorApi(res.error, `Error al ${esRechazo ? 'rechazar' : 'aceptar'} la cotización.`), 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar el estado.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selected, selectedEstado, motivoRechazo, generarFactura, showToast, refresh]);

  // ── Editar cotización ──
  const handleEditar = useCallback(async () => {
    if (!editId) return;
    if (!editForm.descripcion.trim()) {
      showToast('Ingresa una descripción o concepto.', 'error');
      return;
    }
    const hayPartidas = editHasItems || editForm.items.some((p) => p.descripcion.trim() || p.cantidad || p.precio);
    const renglones = editForm.items.filter((p) => p.descripcion.trim() || p.cantidad || p.precio);

    let monto: number;
    if (hayPartidas && renglones.length > 0) {
      // Con partidas: cada renglón completo y el monto se recalcula.
      if (!partidasValidas(editForm.items)) {
        showToast('Cada partida necesita descripción, cantidad, unidad y precio válido.', 'error');
        return;
      }
      monto = totalPartidas(editForm.items);
      if (monto <= 0) {
        showToast('Ingresa un monto válido.', 'error');
        return;
      }
    } else {
      // Plana (sin partidas o el usuario borró todas): monto capturado a mano.
      monto = parsearMiles(editForm.monto);
      if (isNaN(monto) || monto <= 0) {
        showToast('Ingresa un monto válido.', 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await cotizacionesApi.actualizar(editId, {
        clienteId: editForm.clienteId || undefined,
        descripcion: editForm.descripcion.trim(),
        monto,
        // La fecha no se toca al editar: se captura sola al crear.
        ...(editForm.condiciones.trim() ? { condiciones: editForm.condiciones.trim() } : {}),
        // Con partidas originales el reemplazo SIEMPRE va (incluso [] = plana);
        // en una plana solo se envían si el usuario añadió renglones.
        ...(editHasItems
          ? {
              items: renglones.length > 0
                ? renglones.map((p) => ({
                    descripcion: p.descripcion.trim(),
                    cantidad: Number(p.cantidad),
                    unidad: p.unidad.trim(),
                    precioUnitario: Number(p.precio),
                  }))
                : [],
            }
          : renglones.length > 0
            ? {
                items: renglones.map((p) => ({
                  descripcion: p.descripcion.trim(),
                  cantidad: Number(p.cantidad),
                  unidad: p.unidad.trim(),
                  precioUnitario: Number(p.precio),
                })),
              }
            : {}),
      });
      if (res.success) {
        showToast('Cotización actualizada.', 'success');
        setEditOpen(false);
        setEditId(null);
        refresh();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al actualizar la cotización.'), 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar la cotización.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [editId, editForm, editHasItems, showToast, refresh]);

  // ── Columnas de DataTable ──
  const hayPartidasForm = form.items.some((p) => p.descripcion.trim() || p.cantidad || p.precio);
  const hayPartidasEdit = editHasItems || editForm.items.some((p) => p.descripcion.trim() || p.cantidad || p.precio);

  const columns: Column<CotizacionDTO>[] = [
    {
      key: 'cliente',
      header: 'Código / Cliente',
      render: (item) => (
        <div>
          <div className="font-black text-ui-900">{item.codigo || '—'}</div>
          <div className="text-[10px] font-bold text-ui-400 uppercase tracking-widest">
            {item.clienteEmpresa || (item.clienteNombre ?? 'Cliente')}
          </div>
        </div>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (item) => (
        <span className="font-semibold text-ui-600 min-w-0 truncate max-w-[260px] block">
          {item.descripcion}
        </span>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (item) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-ui-500 whitespace-nowrap">
          <CalendarDays className="w-3.5 h-3.5 text-ui-400" />
          {formatFechaSolo(item.fecha)}
        </span>
      ),
    },
    {
      key: 'monto',
      header: 'Monto',
      align: 'right',
      render: (item) => (
        <span className="font-black text-ui-900">{formatCurrency(item.monto)}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (item) => estadoBadge(item.estado),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => {
        const esPendiente = item.estado === 'Pendiente';
        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="info"
              size="sm"
              icon={<Eye className="w-3.5 h-3.5" />}
              onClick={(e) => { e.stopPropagation(); openDetail(item); }}
            >
              Ver
            </Button>
            {/* Editar/Aceptar/Rechazar solo tienen sentido en PENDIENTE: en los
                demás estados las acciones se ocultan (ver = la única operación). */}
            {puedeEditar && esPendiente && (
              <>
                <Button
                  variant="warning"
                  size="sm"
                  icon={<Pencil className="w-3.5 h-3.5" />}
                  onClick={(e) => { e.stopPropagation(); openEditar(item); }}
                >
                  Editar
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  onClick={(e) => { e.stopPropagation(); openEstado(item, 'ACEPTADA'); }}
                >
                  Aceptar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<XCircle className="w-3.5 h-3.5" />}
                  onClick={(e) => { e.stopPropagation(); openEstado(item, 'RECHAZADA'); }}
                >
                  Rechazar
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Cotizaciones"
        subtitle="Presupuestos enviados, seguimiento y cierre de ventas por contratar."
        action={
          puedeCrear ? (
            <Button
          skeleton={initialLoading} variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openCrear}>
              Nueva Cotización
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          icon={<FileText className="w-6 h-6" />}
          value={`${stats.total} totales`}
          label="Total Cotizaciones"
          color="info"
        loading={initialLoading}
        />
        <StatsCard
          icon={<Clock className="w-6 h-6" />}
          value={`${stats.pendientes} pendientes`}
          label="En Espera"
          color="warning"
          onClick={stats.pendientes > 0 ? () => handleFilterChange('estado', 'PENDIENTE') : undefined}
        loading={initialLoading}
        />
        <StatsCard
          icon={<TrendingUp className="w-6 h-6" />}
          value={formatCurrency(stats.montoAceptado)}
          label={`${stats.aceptadas} Aceptadas`}
          color="success"
          onClick={stats.aceptadas > 0 ? () => handleFilterChange('estado', 'ACEPTADA') : undefined}
        loading={initialLoading}
        />
        <StatsCard
          icon={<ThumbsDown className="w-6 h-6" />}
          value={`${stats.rechazadas} rechazadas`}
          label="Rechazadas"
          color="neutral"
          onClick={stats.rechazadas > 0 ? () => handleFilterChange('estado', 'RECHAZADA') : undefined}
        loading={initialLoading}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar por concepto, código o cliente..."
          className="flex-1"
        />
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="md"
          icon={<SlidersHorizontal className="w-4 h-4" />}
          onClick={() => setShowFilters(prev => !prev)}
          className="shrink-0 whitespace-nowrap"
        >
          <span className="whitespace-nowrap">Filtros</span>
          {activeFilters.length > 0 && (
            <span className="ml-1 inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-full bg-surface/20 text-[10px] font-bold">
              {activeFilters.length}
            </span>
          )}
        </Button>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
            >
              <span className="font-normal text-primary/70">{filter.label}:</span>
              <span>{filter.value}</span>
              <button
                onClick={() => handleRemoveFilter(filter.key)}
                className="ml-0.5 hover:text-primary-dark transition-colors"
                aria-label={`Eliminar filtro ${filter.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {activeFilters.length > 1 && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-ui-500 hover:text-red-600 transition-colors ml-1"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}

      {showFilters && (
        <div className="bg-ui-50 border border-ui-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[10px] font-black text-ui-500 uppercase tracking-widest">Estado</label>
              <select
                value={filterValues.estado || ''}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="h-10 px-3 border border-ui-200 rounded-lg text-xs font-medium bg-surface text-ui-900 focus:outline-none focus:border-primary/50"
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="ACEPTADA">Aceptada</option>
                <option value="RECHAZADA">Rechazada</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-full sm:w-64">
              <label className="text-[10px] font-black text-ui-500 uppercase tracking-widest">Cliente</label>
              <select
                value={filterValues.clienteId || ''}
                onChange={(e) => handleFilterChange('clienteId', e.target.value)}
                className="h-10 px-3 border border-ui-200 rounded-lg text-xs font-medium bg-surface text-ui-900 focus:outline-none focus:border-primary/50"
              >
                <option value="">Todos</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.empresa}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="relative">
          <RefreshOverlay show={refreshing && !initialLoading} />
          <DataTable
            columns={columns}
            data={cotizaciones}
            loading={initialLoading}
            keyExtractor={(item) => item.id}
            emptyText="No se encontraron cotizaciones que coincidan con la búsqueda."
            maxBodyHeight="500px"
          />
        </div>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalRecords={pagination.total}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      </div>

      {/* ═══ Nueva Cotización ═══ */}
      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCancel={() => setCreateOpen(false)}
        title="Nueva Cotización"
        subtitle="Registrar un presupuesto enviado a un cliente."
        submitLabel="Crear Cotización"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
        size="full"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Cliente" required className="sm:col-span-2">
            <select
              className={modalSelectClass}
              value={form.clienteId}
              onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.empresa} ({c.nombre})</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Descripción / Concepto" required className="sm:col-span-2">
            <textarea
              className={`${modalInputClass} min-h-[80px] resize-y`}
              placeholder="Ej: Renta de excavadora 320 por 100 horas"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </ModalField>

          <ModalField label="Subtotal (MXN, antes de IVA)" required>
            <input
              type="text"
              inputMode="decimal"
              className={modalInputClass}
              placeholder="30,000"
              disabled={hayPartidasForm}
              value={hayPartidasForm ? formatearMiles(String(totalPartidas(form.items))) : formatearMiles(form.monto)}
              onChange={(e) => setForm({ ...form, monto: formatearMiles(e.target.value) })}
            />
            <p className="mt-1 text-xs text-ui-500">
              {hayPartidasForm
                ? 'Calculado como la suma de las partidas (cantidad × precio).'
                : 'La factura se emite por este monto + IVA 16% (se aplica al aceptar con factura).'}
            </p>
          </ModalField>

          <ModalField label="Partidas (renglones de la cotización)" className="sm:col-span-2">
            <div className="space-y-2">
              {form.items.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input
                    className={`${modalInputClass} col-span-12 sm:col-span-5`}
                    placeholder="Concepto (ej: Vibrocompactador BOMAG)"
                    value={p.descripcion}
                    onChange={(e) => setForm({ ...form, items: moverPartida(form.items, i, { descripcion: e.target.value }) })}
                  />
                  <input
                    className={`${modalInputClass} col-span-4 sm:col-span-2`}
                    placeholder="Cant."
                    inputMode="decimal"
                    value={p.cantidad}
                    onChange={(e) => setForm({ ...form, items: moverPartida(form.items, i, { cantidad: e.target.value }) })}
                  />
                  <input
                    className={`${modalInputClass} col-span-4 sm:col-span-2`}
                    placeholder="Unidad"
                    value={p.unidad}
                    onChange={(e) => setForm({ ...form, items: moverPartida(form.items, i, { unidad: e.target.value }) })}
                  />
                  <input
                    className={`${modalInputClass} col-span-3 sm:col-span-2`}
                    placeholder="Precio"
                    inputMode="decimal"
                    value={p.precio}
                    onChange={(e) => setForm({ ...form, items: moverPartida(form.items, i, { precio: e.target.value }) })}
                  />
                  <button
                    type="button"
                    aria-label="Quitar partida"
                    className="col-span-1 h-10 min-h-[44px] sm:h-10 flex items-center justify-center rounded-lg border border-ui-200 text-ui-400 hover:text-red-500 hover:border-red-300"
                    onClick={() => setForm({ ...form, items: form.items.filter((_, j) => j !== i) })}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs font-bold text-primary hover:underline"
                onClick={() => setForm({ ...form, items: [...form.items, emptyPartida] })}
              >
                + Agregar partida
              </button>
              <p className="text-xs text-ui-500">
                Renglón = concepto + cantidad + unidad + precio unitario. Sin partidas, la cotización se captura con el subtotal de arriba.
              </p>
            </div>
          </ModalField>

          <ModalField label="Condiciones (se muestran en la cotización)" className="sm:col-span-2">
            <textarea
              className={`${modalInputClass} min-h-[180px] resize-y`}
              value={form.condiciones}
              onChange={(e) => setForm({ ...form, condiciones: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      {/* ═══ Editar Cotización ═══ */}
      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Cotización"
        subtitle="Actualiza la descripción, monto, fecha o cliente."
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEditar}
        isSubmitting={submitting}
        size="full"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Cliente" className="sm:col-span-2">
            <select
              className={modalSelectClass}
              value={editForm.clienteId}
              onChange={(e) => setEditForm({ ...editForm, clienteId: e.target.value })}
            >
              <option value="">Sin cambio de cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.empresa} ({c.nombre})</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Descripción / Concepto" required className="sm:col-span-2">
            <textarea
              className={`${modalInputClass} min-h-[80px] resize-y`}
              placeholder="Ej: Renta de excavadora 320 por 100 horas"
              value={editForm.descripcion}
              onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
            />
          </ModalField>

          <ModalField label="Subtotal (MXN, antes de IVA)" required>
            <input
              type="text"
              inputMode="decimal"
              className={modalInputClass}
              placeholder="30,000"
              disabled={hayPartidasEdit}
              value={hayPartidasEdit ? formatearMiles(String(totalPartidas(editForm.items))) : formatearMiles(editForm.monto)}
              onChange={(e) => setEditForm({ ...editForm, monto: formatearMiles(e.target.value) })}
            />
            <p className="mt-1 text-xs text-ui-500">
              {hayPartidasEdit
                ? 'Calculado como la suma de las partidas (cantidad × precio).'
                : 'La factura se emite por este monto + IVA 16%.'}
            </p>
          </ModalField>

          <ModalField label="Partidas (renglones de la cotización)" className="sm:col-span-2">
            <div className="space-y-2">
              {editForm.items.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input
                    className={`${modalInputClass} col-span-12 sm:col-span-5`}
                    placeholder="Concepto (ej: Vibrocompactador BOMAG)"
                    value={p.descripcion}
                    onChange={(e) => setEditForm({ ...editForm, items: moverPartida(editForm.items, i, { descripcion: e.target.value }) })}
                  />
                  <input
                    className={`${modalInputClass} col-span-4 sm:col-span-2`}
                    placeholder="Cant."
                    inputMode="decimal"
                    value={p.cantidad}
                    onChange={(e) => setEditForm({ ...editForm, items: moverPartida(editForm.items, i, { cantidad: e.target.value }) })}
                  />
                  <input
                    className={`${modalInputClass} col-span-4 sm:col-span-2`}
                    placeholder="Unidad"
                    value={p.unidad}
                    onChange={(e) => setEditForm({ ...editForm, items: moverPartida(editForm.items, i, { unidad: e.target.value }) })}
                  />
                  <input
                    className={`${modalInputClass} col-span-3 sm:col-span-2`}
                    placeholder="Precio"
                    inputMode="decimal"
                    value={p.precio}
                    onChange={(e) => setEditForm({ ...editForm, items: moverPartida(editForm.items, i, { precio: e.target.value }) })}
                  />
                  <button
                    type="button"
                    aria-label="Quitar partida"
                    className="col-span-1 h-10 min-h-[44px] sm:h-10 flex items-center justify-center rounded-lg border border-ui-200 text-ui-400 hover:text-red-500 hover:border-red-300"
                    onClick={() => setEditForm({ ...editForm, items: editForm.items.filter((_, j) => j !== i) })}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs font-bold text-primary hover:underline"
                onClick={() => setEditForm({ ...editForm, items: [...editForm.items, emptyPartida] })}
              >
                + Agregar partida
              </button>
              <p className="text-xs text-ui-500">
                Renglón = concepto + cantidad + unidad + precio unitario. Sin partidas, la cotización se captura con el subtotal de arriba.
              </p>
            </div>
          </ModalField>

          <ModalField label="Condiciones (se muestran en la cotización)" className="sm:col-span-2">
            <textarea
              className={`${modalInputClass} min-h-[180px] resize-y`}
              value={editForm.condiciones}
              onChange={(e) => setEditForm({ ...editForm, condiciones: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      {/* ═══ Detalle de cotización ═══ */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        size="full"
      >
        <ModalHeader
          title={selected ? `Cotización ${selected.codigo ?? ''}` : 'Detalle'}
          subtitle={selected ? selected.descripcion : undefined}
          onClose={() => setDetailOpen(false)}
        />
        <ModalBody>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-ui-400 uppercase tracking-widest">Estado</p>
                  {estadoBadge(selected.estado)}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-ui-400 uppercase tracking-widest">Monto</p>
                  <p className="font-black text-2xl text-ui-900">{formatCurrency(selected.monto)}</p>
                </div>
              </div>

              {selected.estado === 'Rechazada' && selected.motivoRechazo && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Motivo del rechazo</p>
                  <p className="text-sm font-semibold text-red-600">{selected.motivoRechazo}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-ui-50 border border-ui-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-ui-400 uppercase tracking-widest">Cliente</p>
                    <p className="text-sm font-black text-ui-900">{selected.clienteEmpresa || '—'}</p>
                    <p className="text-xs font-medium text-ui-500">{selected.clienteNombre || ''}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDays className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-ui-400 uppercase tracking-widest">Fecha</p>
                    <p className="text-sm font-bold text-ui-700">{formatFechaSolo(selected.fecha)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-ui-400 uppercase tracking-widest">Creada por</p>
                    <p className="text-sm font-bold text-ui-700">{selected.creadoPor ?? '—'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-ui-50 border border-dashed border-ui-200 rounded-xl p-4">
                <p className="text-[10px] font-black text-ui-400 uppercase tracking-widest mb-1">Descripción</p>
                <p className="text-sm font-semibold text-ui-700">{selected.descripcion}</p>
              </div>

              {selected.items && selected.items.length > 0 && (
                <div className="border border-ui-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-ui-50 text-[10px] font-black text-ui-400 uppercase tracking-widest">
                        <th className="px-3 py-2 text-left">Descripción</th>
                        <th className="px-2 py-2 text-right">Cant.</th>
                        <th className="px-2 py-2 text-left">Unidad</th>
                        <th className="px-2 py-2 text-right">P. Unitario</th>
                        <th className="px-3 py-2 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((partida) => (
                        <tr key={partida.id} className="border-t border-ui-100">
                          <td className="px-3 py-2 font-semibold text-ui-700">{partida.descripcion}</td>
                          <td className="px-2 py-2 text-right font-medium text-ui-600">{partida.cantidad}</td>
                          <td className="px-2 py-2 font-medium text-ui-500">{partida.unidad}</td>
                          <td className="px-2 py-2 text-right font-medium text-ui-600">{formatCurrency(partida.precioUnitario)}</td>
                          <td className="px-3 py-2 text-right font-black text-ui-900">{formatCurrency(partida.importe)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selected.condiciones && (
                <div className="bg-ui-50 border border-dashed border-ui-200 rounded-xl p-4">
                  <p className="text-[10px] font-black text-ui-400 uppercase tracking-widest mb-1">Condiciones</p>
                  <p className="text-xs font-semibold text-ui-600 whitespace-pre-line">{selected.condiciones}</p>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={() => setDetailOpen(false)}>
            Cerrar
          </Button>
        </ModalFooter>
      </Modal>

      {/* ═══ Confirmar cambio de estado ═══ */}
      <Modal
        open={estadoOpen}
        onClose={() => setEstadoOpen(false)}
      >
        <ModalHeader
          title={selectedEstado === 'ACEPTADA' ? 'Aceptar Cotización' : 'Rechazar Cotización'}
          subtitle={selected ? `Cotización ${selected.codigo ?? ''}` : undefined}
          onClose={() => setEstadoOpen(false)}
        />
        <ModalBody>
          {selected && (
            <>
              <div className="flex flex-col items-center text-center py-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                selectedEstado === 'ACEPTADA' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {selectedEstado === 'ACEPTADA'
                  ? <CheckCircle2 className="w-7 h-7 text-green-500" />
                  : <XCircle className="w-7 h-7 text-red-500" />}
              </div>
              <p className="text-sm text-ui-700 mb-1">
                ¿Estás seguro de {selectedEstado === 'ACEPTADA' ? 'aceptar' : 'rechazar'} la cotización?
              </p>
              <p className="font-black text-ui-900 text-lg mb-1">{selected.descripcion}</p>
              <p className="text-xs text-ui-500">
                {selected.clienteEmpresa || 'Cliente'} — {formatCurrency(selected.monto)}
              </p>
            </div>
            {selectedEstado === 'RECHAZADA' && (
              <div className="w-full mt-2 text-left">
                <ModalField label="Motivo del rechazo" required>
                  <textarea
                    className={`${modalInputClass} min-h-[80px] resize-y`}
                    placeholder="Indica el motivo por el cual se rechaza la cotización"
                    value={motivoRechazo}
                    maxLength={500}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                  />
                </ModalField>
              </div>
            )}
            {selectedEstado === 'ACEPTADA' && (
              <div className="w-full mt-2 text-left">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-ui-200 bg-ui-50 cursor-pointer hover:border-primary/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={generarFactura}
                    onChange={(e) => setGenerarFactura(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-ui-800">Generar factura</span>
                    <span className="block text-xs text-ui-500">
                      Acepta la cotización y crea la factura con su cuenta por cobrar automáticamente.
                    </span>
                  </span>
                </label>
              </div>
            )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEstadoOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant={selectedEstado === 'ACEPTADA' ? 'success' : 'danger'}
            icon={
              selectedEstado === 'ACEPTADA'
                ? <CheckCircle2 className="w-4 h-4" />
                : <XCircle className="w-4 h-4" />
            }
            loading={submitting}
            onClick={handleCambiarEstado}
          >
            {selectedEstado === 'ACEPTADA' ? 'Sí, Aceptar' : 'Sí, Rechazar'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
