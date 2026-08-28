"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus, FileText, SlidersHorizontal, X,
  Loader2, Eye, Clock, CheckCircle2, XCircle, CalendarDays,
  Building2, TrendingUp, ThumbsDown,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar, type ActiveFilter } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import {
  FormModal, Modal, ModalHeader, ModalBody, ModalFooter,
  ModalField, modalInputClass, modalSelectClass,
} from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { formatCurrency, formatFechaSolo } from '@/lib/formatters';
import {
  cotizacionesApi,
  clientesApi,
  type CotizacionDTO,
  type CotizacionesStats,
  type ClienteDTO,
  type EstadoCotizacionApi,
} from '@/lib/api';

// ── Constantes ──
const PAGE_SIZE = 10;

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
  fecha: new Date().toISOString().split('T')[0],
};

// ── Helpers ──
function estadoBadge(estado: CotizacionDTO['estado']) {
  if (estado === 'Aceptada') {
    return <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3" />Aceptada</Badge>;
  }
  if (estado === 'Rechazada') {
    return <Badge variant="error" size="sm"><XCircle className="w-3 h-3" />Rechazada</Badge>;
  }
  return <Badge variant="warning" size="sm"><Clock className="w-3 h-3" />Pendiente</Badge>;
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
  const [detailOpen, setDetailOpen] = useState(false);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState<'ACEPTADA' | 'RECHAZADA'>('ACEPTADA');
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
    fetchData(1);
    fetchStats();
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
    setEstadoOpen(true);
  }, []);

  const refresh = useCallback(() => {
    fetchData(pagination.page, search, filterValues);
    fetchStats();
  }, [fetchData, pagination.page, search, filterValues, fetchStats]);

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
    const monto = Number(form.monto);
    if (isNaN(monto) || monto <= 0) {
      showToast('Ingresa un monto válido.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await clientesApi.crearCotizacion(form.clienteId, {
        descripcion: form.descripcion.trim(),
        monto,
        fecha: form.fecha,
      });
      if (res.success) {
        showToast(`Cotización ${res.data.codigo ?? ''} creada por ${formatCurrency(monto)}.`, 'success');
        setCreateOpen(false);
        refresh();
      } else {
        showToast(res.error?.message || 'Error al crear cotización.', 'error');
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
    setSubmitting(true);
    const actionLabel = selectedEstado === 'ACEPTADA' ? 'aceptada' : 'rechazada';
    try {
      const res = await cotizacionesApi.cambiarEstado(selected.id, selectedEstado);
      if (res.success) {
        showToast(`Cotización ${selected.codigo ?? ''} ${actionLabel}.`, 'success');
        setEstadoOpen(false);
        setSelected(null);
        refresh();
      } else {
        showToast(res.error?.message || `Error al ${actionLabel === 'aceptada' ? 'aceptar' : 'rechazar'} la cotización.`, 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar el estado.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selected, selectedEstado, showToast, refresh]);

  // ── Columnas de DataTable ──
  const columns: Column<CotizacionDTO>[] = [
    {
      key: 'cliente',
      header: 'Código / Cliente',
      render: (item) => (
        <div>
          <div className="font-black text-slate-900">{item.codigo || '—'}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {item.clienteEmpresa || (item.clienteNombre ?? 'Cliente')}
          </div>
        </div>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (item) => (
        <span className="font-semibold text-slate-600 min-w-0 truncate max-w-[260px] block">
          {item.descripcion}
        </span>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (item) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-500 whitespace-nowrap">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
          {formatFechaSolo(item.fecha)}
        </span>
      ),
    },
    {
      key: 'monto',
      header: 'Monto',
      align: 'right',
      render: (item) => (
        <span className="font-black text-slate-900">{formatCurrency(item.monto)}</span>
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
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); openDetail(item); }}
          >
            Ver
          </Button>
          {puedeEditar && item.estado === 'Pendiente' && (
            <>
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
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Cotizaciones"
        subtitle="Presupuestos enviados, seguimiento y cierre de ventas por contratar."
        action={
          puedeCrear ? (
            <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openCrear}>
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
        />
        <StatsCard
          icon={<Clock className="w-6 h-6" />}
          value={`${stats.pendientes} pendientes`}
          label="En Espera"
          color="warning"
          onClick={stats.pendientes > 0 ? () => handleFilterChange('estado', 'PENDIENTE') : undefined}
        />
        <StatsCard
          icon={<TrendingUp className="w-6 h-6" />}
          value={formatCurrency(stats.montoAceptado)}
          label={`${stats.aceptadas} Aceptadas`}
          color="success"
          onClick={stats.aceptadas > 0 ? () => handleFilterChange('estado', 'ACEPTADA') : undefined}
        />
        <StatsCard
          icon={<ThumbsDown className="w-6 h-6" />}
          value={`${stats.rechazadas} rechazadas`}
          label="Rechazadas"
          color="neutral"
          onClick={stats.rechazadas > 0 ? () => handleFilterChange('estado', 'RECHAZADA') : undefined}
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
            <span className="ml-1 inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
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
              className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors ml-1"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}

      {showFilters && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</label>
              <select
                value={filterValues.estado || ''}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:border-primary/50"
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="ACEPTADA">Aceptada</option>
                <option value="RECHAZADA">Rechazada</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-full sm:w-64">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente</label>
              <select
                value={filterValues.clienteId || ''}
                onChange={(e) => handleFilterChange('clienteId', e.target.value)}
                className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:border-primary/50"
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
          {refreshing && !initialLoading && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center transition-opacity">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          )}
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

          <ModalField label="Monto (MXN)" required>
            <input
              type="number"
              className={modalInputClass}
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.monto}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
            />
          </ModalField>

          <ModalField label="Fecha" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      {/* ═══ Detalle de cotización ═══ */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                  {estadoBadge(selected.estado)}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</p>
                  <p className="font-black text-2xl text-slate-900">{formatCurrency(selected.monto)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                    <p className="text-sm font-black text-slate-900">{selected.clienteEmpresa || '—'}</p>
                    <p className="text-xs font-medium text-slate-500">{selected.clienteNombre || ''}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDays className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</p>
                    <p className="text-sm font-bold text-slate-700">{formatFechaSolo(selected.fecha)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción</p>
                <p className="text-sm font-semibold text-slate-700">{selected.descripcion}</p>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {selected && selected.estado === 'Pendiente' && puedeEditar && (
            <>
              <Button
                variant="success"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => openEstado(selected, 'ACEPTADA')}
              >
                Aceptar
              </Button>
              <Button
                variant="danger"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => openEstado(selected, 'RECHAZADA')}
              >
                Rechazar
              </Button>
            </>
          )}
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
            <div className="flex flex-col items-center text-center py-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                selectedEstado === 'ACEPTADA' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {selectedEstado === 'ACEPTADA'
                  ? <CheckCircle2 className="w-7 h-7 text-green-500" />
                  : <XCircle className="w-7 h-7 text-red-500" />}
              </div>
              <p className="text-sm text-slate-700 mb-1">
                ¿Estás seguro de {selectedEstado === 'ACEPTADA' ? 'aceptar' : 'rechazar'} la cotización?
              </p>
              <p className="font-black text-slate-900 text-lg mb-1">{selected.descripcion}</p>
              <p className="text-xs text-slate-500">
                {selected.clienteEmpresa || 'Cliente'} — {formatCurrency(selected.monto)}
              </p>
            </div>
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
