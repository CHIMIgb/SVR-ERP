'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus, ShieldAlert, AlertTriangle, Clock,
  Pencil, Trash2, SlidersHorizontal, X, AlertCircle, Eye, Check,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { FormModal, ModalField, modalInputClass, modalSelectClass, modalTextareaClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import {
  incidentesApi,
  type IncidenteDTO,
  type IncidenteStats,
  type IncidenteCatalogos,
  type IncidenteCreateInput,
} from '@/lib/api';
import { formatDate } from '@/lib/formatters';
import type { BadgeVariant } from '@/components/ui/Badge';

// ── Constantes ──
const PAGE_SIZE = 10;

const PRIORIDADES: { value: IncidenteCreateInput['prioridad']; label: string }[] = [
  { value: 'CRITICA', label: 'Crítica' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
];

const ESTADOS: { value: IncidenteCreateInput['estado']; label: string }[] = [
  { value: 'ABIERTO', label: 'Abierto' },
  { value: 'EN_REVISION', label: 'En Revisión' },
  { value: 'RESUELTO', label: 'Resuelto' },
];

const prioridadVariant: Record<IncidenteDTO['prioridad'], BadgeVariant> = {
  Crítica: 'error',
  Alta: 'warning',
  Media: 'primary',
  Baja: 'info',
};

const estadoVariant: Record<IncidenteDTO['estado'], BadgeVariant> = {
  Abierto: 'error',
  'En Revisión': 'warning',
  Resuelto: 'success',
};

const emptyForm = {
  titulo: '',
  descripcion: '',
  prioridad: 'MEDIA' as IncidenteCreateInput['prioridad'],
  estado: 'ABIERTO' as IncidenteCreateInput['estado'],
  obraId: '',
  maquinaId: '',
  fecha: new Date().toISOString().split('T')[0],
};

export default function IncidentesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === '/incidentes');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Estado de datos ──
  const [registros, setRegistros] = useState<IncidenteDTO[]>([]);
  const [stats, setStats] = useState<IncidenteStats>({ total: 0, abiertos: 0, criticos: 0 });
  const [catalogos, setCatalogos] = useState<IncidenteCatalogos>({ maquinas: [], obras: [] });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  // ── Estado de búsqueda y filtros ──
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // ── Estado de modales ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IncidenteDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Cargar catálogos ──
  useEffect(() => {
    incidentesApi.catalogos().then((res) => {
      if (res.success && res.data) {
        setCatalogos(res.data);
      }
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
      const res = await incidentesApi.listar({
        search: searchVal || undefined,
        prioridad: (filters?.prioridad as IncidenteCreateInput['prioridad']) || undefined,
        estado: (filters?.estado as IncidenteCreateInput['estado']) || undefined,
        maquinaId: filters?.maquinaId || undefined,
        obraId: filters?.obraId || undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setRegistros(res.data.items);
        setPagination(res.data.pagination);
      } else {
        showToast('Error al cargar incidentes.', 'error');
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
    const res = await incidentesApi.stats();
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
  if (filterValues.prioridad) {
    const label = PRIORIDADES.find((p) => p.value === filterValues.prioridad)?.label ?? filterValues.prioridad;
    activeFilters.push({ key: 'prioridad', label: 'Prioridad', value: label });
  }
  if (filterValues.estado) {
    const label = ESTADOS.find((e) => e.value === filterValues.estado)?.label ?? filterValues.estado;
    activeFilters.push({ key: 'estado', label: 'Estado', value: label });
  }
  if (filterValues.maquinaId) {
    const maquina = catalogos.maquinas.find((m) => m.id === filterValues.maquinaId);
    activeFilters.push({ key: 'maquinaId', label: 'Máquina', value: maquina?.nombre ?? filterValues.maquinaId });
  }
  if (filterValues.obraId) {
    const obra = catalogos.obras.find((o) => o.id === filterValues.obraId);
    activeFilters.push({ key: 'obraId', label: 'Obra', value: obra?.nombre ?? filterValues.obraId });
  }

  // ── Filtros para SearchBar ──
  const filterFields: FilterField[] = [
    {
      key: 'prioridad',
      label: 'Prioridad',
      type: 'select',
      options: PRIORIDADES.map((p) => ({ value: p.value, label: p.label })),
      placeholder: 'Todas',
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: ESTADOS.map((e) => ({ value: e.value, label: e.label })),
      placeholder: 'Todos',
    },
    {
      key: 'maquinaId',
      label: 'Máquina',
      type: 'select',
      options: catalogos.maquinas.map((m) => ({ value: m.id, label: m.nombre })),
      placeholder: 'Todas',
    },
    {
      key: 'obraId',
      label: 'Obra',
      type: 'select',
      options: catalogos.obras.map((o) => ({ value: o.id, label: o.nombre })),
      placeholder: 'Todas',
    },
  ];

  // ── Handlers de filtros ──
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleSearch = useCallback(() => {
    fetchData(1, search, filterValues);
  }, [fetchData, search, filterValues]);

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

  const handleFilterCritical = useCallback(() => {
    const next = { prioridad: 'CRITICA', estado: 'ABIERTO' };
    setFilterValues(next);
    fetchData(1, search, next);
  }, [fetchData, search]);

  const handlePageChange = useCallback((page: number) => {
    fetchData(page, search, filterValues);
  }, [fetchData, search, filterValues]);

  // ── Handlers de modales ──
  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((item: IncidenteDTO) => {
    setSelectedItem(item);
    setForm({
      titulo: item.titulo,
      descripcion: item.descripcion,
      prioridad: prioridadToValue(item.prioridad),
      estado: estadoToValue(item.estado),
      obraId: item.obraId,
      maquinaId: item.maquinaId || '',
      fecha: item.fecha,
    });
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((item: IncidenteDTO) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  const openResolve = useCallback((item: IncidenteDTO) => {
    setSelectedItem(item);
    setResolveOpen(true);
  }, []);

  // ── Helpers de conversión label ↔ valor ──
  function prioridadToValue(label: IncidenteDTO['prioridad']): IncidenteCreateInput['prioridad'] {
    const map: Record<IncidenteDTO['prioridad'], IncidenteCreateInput['prioridad']> = {
      Crítica: 'CRITICA',
      Alta: 'ALTA',
      Media: 'MEDIA',
      Baja: 'BAJA',
    };
    return map[label];
  }

  function estadoToValue(label: IncidenteDTO['estado']): IncidenteCreateInput['estado'] {
    const map: Record<IncidenteDTO['estado'], IncidenteCreateInput['estado']> = {
      Abierto: 'ABIERTO',
      'En Revisión': 'EN_REVISION',
      Resuelto: 'RESUELTO',
    };
    return map[label];
  }

  // ── Validación ──
  const validateForm = useCallback(() => {
    if (!form.titulo.trim() || !form.obraId || !form.fecha) {
      showToast('Título, obra y fecha son obligatorios.', 'error');
      return false;
    }
    if (!form.descripcion.trim()) {
      showToast('La descripción es obligatoria.', 'error');
      return false;
    }
    return true;
  }, [form, showToast]);

  // ── CRUD Handlers ──
  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await incidentesApi.crear({
        titulo: form.titulo,
        descripcion: form.descripcion,
        prioridad: form.prioridad,
        estado: form.estado,
        fecha: form.fecha,
        obraId: form.obraId,
        maquinaId: form.maquinaId || undefined,
      });
      if (res.success) {
        showToast(`Incidente "${form.titulo}" reportado exitosamente.`, 'success');
        setCreateOpen(false);
        setForm(emptyForm);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al reportar incidente.', 'error');
      }
    } catch {
      showToast('Error de conexión al reportar incidente.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, form, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem || !validateForm()) return;
    setSubmitting(true);
    try {
      const res = await incidentesApi.actualizar(selectedItem.id, {
        titulo: form.titulo,
        descripcion: form.descripcion,
        prioridad: form.prioridad,
        estado: form.estado,
        fecha: form.fecha,
        obraId: form.obraId,
        maquinaId: form.maquinaId || undefined,
      });
      if (res.success) {
        showToast(`Incidente "${form.titulo}" actualizado exitosamente.`, 'success');
        setEditOpen(false);
        setSelectedItem(null);
        setForm(emptyForm);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al actualizar incidente.', 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar incidente.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, validateForm, form, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await incidentesApi.eliminar(selectedItem.id);
      if (res.success) {
        showToast('Incidente eliminado exitosamente.', 'success');
        setDeleteOpen(false);
        setSelectedItem(null);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al eliminar incidente.', 'error');
      }
    } catch {
      showToast('Error de conexión al eliminar incidente.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleResolve = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await incidentesApi.resolver(selectedItem.id);
      if (res.success) {
        showToast('Incidente marcado como resuelto.', 'success');
        setResolveOpen(false);
        setSelectedItem(null);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al resolver incidente.', 'error');
      }
    } catch {
      showToast('Error de conexión al resolver incidente.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  // ── Columnas de DataTable ──
  const columns: Column<IncidenteDTO>[] = [
    {
      key: 'titulo',
      header: 'Incidente / Obra',
      render: (item) => (
        <div>
          <div className="font-black text-slate-900">{item.titulo}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.obra}</div>
        </div>
      ),
    },
    {
      key: 'prioridad',
      header: 'Prioridad',
      render: (item) => (
        <Badge variant={prioridadVariant[item.prioridad]} size="sm">{item.prioridad}</Badge>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (item) => (
        <Badge variant={estadoVariant[item.estado]} size="sm">{item.estado}</Badge>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (item) => (
        <span className="whitespace-nowrap font-bold text-slate-600">{formatDate(item.fecha)}</span>
      ),
    },
    {
      key: 'maquina',
      header: 'Máquina',
      render: (item) => (
        <span className="font-semibold text-slate-600">{item.maquina || '—'}</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {puedeEditar && item.estado !== 'Resuelto' && (
            <Button
              variant="success"
              size="sm"
              icon={<Check className="w-3.5 h-3.5" />}
              onClick={(e) => { e.stopPropagation(); openResolve(item); }}
            >
              Resolver
            </Button>
          )}
          {puedeEditar && (
            <Button
              variant="warning"
              size="sm"
              icon={<Pencil className="w-3.5 h-3.5" />}
              onClick={(e) => { e.stopPropagation(); openEdit(item); }}
            >
              Editar
            </Button>
          )}
          {puedeEliminar && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={(e) => { e.stopPropagation(); openDelete(item); }}
            >
              Eliminar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Seguridad e Incidentes"
        subtitle="Registro y seguimiento de fallas, accidentes y retrasos operativos en obra."
        action={
          puedeCrear ? (
            <Button variant="danger" icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
              Reportar Incidente
            </Button>
          ) : undefined
        }
      />

      {stats.criticos > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-red-900 font-bold text-sm">Incidentes Críticos Abiertos</p>
              <p className="text-red-700 text-xs font-medium">
                Hay {stats.criticos} incidente{stats.criticos > 1 ? 's' : ''} crítico{stats.criticos > 1 ? 's' : ''} sin resolver.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={handleFilterCritical}
          >
            Ver críticos abiertos
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          icon={<ShieldAlert className="w-6 h-6" />}
          value={stats.total}
          label="Total Incidentes"
          color="info"
        />
        <StatsCard
          icon={<Clock className="w-6 h-6" />}
          value={stats.abiertos}
          label="Incidentes Abiertos"
          color={stats.abiertos > 0 ? 'warning' : 'success'}
        />
        <StatsCard
          icon={<AlertTriangle className="w-6 h-6" />}
          value={stats.criticos}
          label="Críticos Sin Resolver"
          color={stats.criticos > 0 ? 'error' : 'success'}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar incidente, obra o máquina..."
          className="flex-1"
        />
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="md"
          icon={<SlidersHorizontal className="w-4 h-4" />}
          onClick={() => setShowFilters((prev) => !prev)}
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
            {filterFields.map((filter) => (
              <div key={filter.key} className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {filter.label}
                </label>
                <select
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
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

      <div className="space-y-3">
        <div className="relative">
          {refreshing && !initialLoading && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center transition-opacity">
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <DataTable
            columns={columns}
            data={registros}
            loading={initialLoading}
            keyExtractor={(item) => item.id}
            emptyText="No se encontraron incidentes que coincidan con la búsqueda."
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

      {/* ═══════════════════════════════════════════
          MODALES
          ═══════════════════════════════════════════ */}

      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCancel={() => setCreateOpen(false)}
        title="Reportar Incidente"
        subtitle="Registra una falla, accidente o retraso operativo en obra."
        submitLabel="Reportar Incidente"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Título" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Fuga de aceite hidráulico"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </ModalField>

          <ModalField label="Descripción" required className="sm:col-span-2">
            <textarea
              className={modalTextareaClass}
              placeholder="Describe el incidente con detalle..."
              rows={4}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </ModalField>

          <ModalField label="Prioridad" required>
            <select
              className={modalSelectClass}
              value={form.prioridad}
              onChange={(e) => setForm({ ...form, prioridad: e.target.value as IncidenteCreateInput['prioridad'] })}
            >
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Estado" required>
            <select
              className={modalSelectClass}
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value as IncidenteCreateInput['estado'] })}
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Obra" required>
            <select
              className={modalSelectClass}
              value={form.obraId}
              onChange={(e) => setForm({ ...form, obraId: e.target.value })}
            >
              <option value="">Seleccionar obra...</option>
              {catalogos.obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre} {o.estado ? `(${o.estado.replace('_', ' ')})` : ''}
                </option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Máquina (opcional)">
            <select
              className={modalSelectClass}
              value={form.maquinaId}
              onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
            >
              <option value="">Seleccionar máquina...</option>
              {catalogos.maquinas.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
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

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Incidente"
        subtitle={selectedItem ? `Editando: ${selectedItem.titulo}` : undefined}
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Título" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </ModalField>

          <ModalField label="Descripción" required className="sm:col-span-2">
            <textarea
              className={modalTextareaClass}
              rows={4}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </ModalField>

          <ModalField label="Prioridad" required>
            <select
              className={modalSelectClass}
              value={form.prioridad}
              onChange={(e) => setForm({ ...form, prioridad: e.target.value as IncidenteCreateInput['prioridad'] })}
            >
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Estado" required>
            <select
              className={modalSelectClass}
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value as IncidenteCreateInput['estado'] })}
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Obra" required>
            <select
              className={modalSelectClass}
              value={form.obraId}
              onChange={(e) => setForm({ ...form, obraId: e.target.value })}
            >
              <option value="">Seleccionar obra...</option>
              {catalogos.obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre} {o.estado ? `(${o.estado.replace('_', ' ')})` : ''}
                </option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Máquina (opcional)">
            <select
              className={modalSelectClass}
              value={form.maquinaId}
              onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
            >
              <option value="">Seleccionar máquina...</option>
              {catalogos.maquinas.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
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

      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Incidente"
        subtitle="Esta acción no se puede deshacer."
        submitLabel="Sí, Eliminar"
        cancelLabel="Cancelar"
        onSubmit={handleDelete}
        isSubmitting={submitting}
      >
        {selectedItem && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-slate-700 mb-1">
              ¿Estás seguro de eliminar este incidente?
            </p>
            <p className="font-black text-slate-900 text-lg mb-2">{selectedItem.titulo}</p>
            <p className="text-xs text-slate-500">
              {selectedItem.obra} · {selectedItem.prioridad}
            </p>
          </div>
        )}
      </FormModal>

      <FormModal
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        onCancel={() => setResolveOpen(false)}
        title="Resolver Incidente"
        subtitle="Se marcará como Resuelto y se registrará en auditoría."
        submitLabel="Sí, Resolver"
        cancelLabel="Cancelar"
        onSubmit={handleResolve}
        isSubmitting={submitting}
      >
        {selectedItem && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-sm text-slate-700 mb-1">
              ¿Marcar como resuelto este incidente?
            </p>
            <p className="font-black text-slate-900 text-lg mb-2">{selectedItem.titulo}</p>
            <p className="text-xs text-slate-500">
              {selectedItem.obra} · {selectedItem.prioridad}
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}
