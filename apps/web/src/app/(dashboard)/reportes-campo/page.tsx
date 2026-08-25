"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wrench, Fuel, User, ClipboardCheck, Clock, MapPin,
  ShieldAlert, HardHat, Users, AlertTriangle, CheckCircle2,
  Plus, Pencil, Trash2, Eye, X, AlertCircle, Check, SlidersHorizontal,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal, ModalField, modalInputClass, modalSelectClass, modalTextareaClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import {
  bitacoraApi,
  reportesCampoApi,
  type CatalogoItem,
  type ReporteCampoDTO,
  type ReportesCampoStats,
  type ReporteCampoCreateInput,
  type TipoReporteApi,
  type EstadoReporteApi,
  type PrioridadReporteApi,
  type TipoReporte,
  type EstadoReporte,
  type PrioridadReporte,
} from '@/lib/api';

// ── Constantes ──
const PAGE_SIZE = 6;

const TIPOS: { value: TipoReporteApi; label: string }[] = [
  { value: 'INCIDENTE', label: 'Incidente' },
  { value: 'MECANICO', label: 'Mecanico' },
  { value: 'PIPERO', label: 'Pipero' },
  { value: 'OPERADOR', label: 'Operador' },
  { value: 'CHECADOR', label: 'Checador' },
  { value: 'INGENIERO', label: 'Ingeniero' },
  { value: 'TRABAJADOR', label: 'Trabajador' },
];

const ESTADOS_FILTRO: { value: EstadoReporteApi; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'VISTO', label: 'Visto' },
  { value: 'ATENDIDO', label: 'Atendido' },
  { value: 'EN_REVISION', label: 'En Revisión' },
  { value: 'RESUELTO', label: 'Resuelto' },
];

const PRIORIDADES: { value: PrioridadReporteApi; label: string }[] = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' },
];

// ── Helpers de presentación ──

function getTipoIcon(tipo: string) {
  switch (tipo) {
    case 'Mecanico':   return <Wrench className="w-5 h-5 text-blue-500" />;
    case 'Pipero':     return <Fuel className="w-5 h-5 text-orange-500" />;
    case 'Operador':   return <User className="w-5 h-5 text-green-500" />;
    case 'Checador':   return <ClipboardCheck className="w-5 h-5 text-purple-500" />;
    case 'Incidente':  return <ShieldAlert className="w-5 h-5 text-red-500" />;
    case 'Ingeniero':  return <HardHat className="w-5 h-5 text-yellow-500" />;
    case 'Trabajador': return <Users className="w-5 h-5 text-teal-500" />;
    default:           return <ClipboardCheck className="w-5 h-5 text-slate-400" />;
  }
}

function getTipoColor(tipo: string) {
  switch (tipo) {
    case 'Mecanico':   return 'bg-blue-500';
    case 'Pipero':     return 'bg-orange-500';
    case 'Operador':   return 'bg-green-500';
    case 'Checador':   return 'bg-purple-500';
    case 'Incidente':  return 'bg-red-500';
    case 'Ingeniero':  return 'bg-yellow-400';
    case 'Trabajador': return 'bg-teal-500';
    default:           return 'bg-slate-400';
  }
}

const estadoVariant: Record<EstadoReporte, 'warning' | 'info' | 'success' | 'primary'> = {
  Pendiente: 'warning',
  Visto: 'info',
  Atendido: 'success',
  'En Revisión': 'primary',
  Resuelto: 'success',
};

const prioridadVariant: Record<PrioridadReporte, 'error' | 'warning' | 'neutral' | 'info'> = {
  Crítica: 'error',
  Alta: 'warning',
  Media: 'neutral',
  Baja: 'info',
};

/** Siguiente etapa del flujo de seguimiento del reporte. */
function siguienteEstado(estado: EstadoReporte): EstadoReporte | null {
  switch (estado) {
    case 'Pendiente':   return 'Visto';
    case 'Visto':       return 'Atendido';
    case 'Atendido':    return 'Resuelto';
    case 'En Revisión': return 'Resuelto';
    default:            return null;
  }
}

const ESTADO_API: Record<EstadoReporte, EstadoReporteApi> = {
  Pendiente: 'PENDIENTE',
  Visto: 'VISTO',
  Atendido: 'ATENDIDO',
  'En Revisión': 'EN_REVISION',
  Resuelto: 'RESUELTO',
};

/** Etiqueta del botón principal — conserva los nombres originales de la vista. */
function etiquetaAccion(report: ReporteCampoDTO): string | null {
  const next = siguienteEstado(report.estado);
  if (!next) return null;
  if (report.estado === 'Pendiente') {
    return report.tipo === 'Incidente' ? 'Gestionar' : 'Validar';
  }
  return `Marcar ${next}`;
}

/** Formatea valores de `detalles` según la clave conocida. */
function formatDetalle(key: string, value: unknown): string {
  const k = key.toLowerCase();
  if (k === 'litros') return `${value} L`;
  if (k === 'costo') return formatCurrency(Number(value));
  return String(value);
}

const STATS_CERO: ReportesCampoStats = {
  pendientes: 0,
  enRevision: 0,
  atendidos: 0,
  resueltos: 0,
  criticosActivos: 0,
};

const emptyForm = {
  tipo: 'OPERADOR' as TipoReporteApi,
  usuario: '',
  obraId: '',
  maquinaId: '',
  fecha: new Date().toISOString().split('T')[0],
  hora: new Date().toTimeString().slice(0, 5),
  prioridad: '' as '' | PrioridadReporteApi,
  descripcion: '',
};

export default function ReportesCampoPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === '/reportes-campo');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Estado de datos ──
  const [reportes, setReportes] = useState<ReporteCampoDTO[]>([]);
  const [stats, setStats] = useState<ReportesCampoStats>(STATS_CERO);
  const [catalogos, setCatalogos] = useState<{ maquinas: CatalogoItem[]; obras: CatalogoItem[] }>({
    maquinas: [],
    obras: [],
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  // ── Estado de búsqueda y filtros ──
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [soloCriticos, setSoloCriticos] = useState(false);

  // ── Estado de modales ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReporteCampoDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Cargar catálogos de obra y máquina (una sola vez) ──
  useEffect(() => {
    bitacoraApi.catalogos().then((res) => {
      if (res.success && res.data) {
        setCatalogos(res.data);
      }
    });
  }, []);

  // ── Cargar datos ──
  const fetchData = useCallback(async (page = 1, searchVal?: string, filters?: Record<string, string>, criticos?: boolean) => {
    if (!hasLoaded.current) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await reportesCampoApi.listar({
        search: searchVal || undefined,
        estado: (filters?.estado as EstadoReporteApi) || undefined,
        tipo: (filters?.tipo as TipoReporteApi) || undefined,
        prioridad: (filters?.prioridad as PrioridadReporteApi) || undefined,
        criticos: criticos || undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setReportes(res.data.items);
        setPagination(res.data.pagination);
      } else {
        showToast('Error al cargar reportes de campo.', 'error');
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
    const res = await reportesCampoApi.stats();
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
    const label = ESTADOS_FILTRO.find((e) => e.value === filterValues.estado)?.label ?? filterValues.estado;
    activeFilters.push({ key: 'estado', label: 'Estado', value: label });
  }
  if (filterValues.prioridad) {
    const label = PRIORIDADES.find((p) => p.value === filterValues.prioridad)?.label ?? filterValues.prioridad;
    activeFilters.push({ key: 'prioridad', label: 'Prioridad', value: label });
  }
  if (filterValues.tipo) {
    const label = TIPOS.find((t) => t.value === filterValues.tipo)?.label ?? filterValues.tipo;
    activeFilters.push({ key: 'tipo', label: 'Tipo', value: label });
  }
  if (soloCriticos) {
    activeFilters.push({ key: 'criticos', label: 'Vista', value: 'Solo críticos' });
  }

  const filterFields: FilterField[] = [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: ESTADOS_FILTRO.map((e) => ({ value: e.value, label: e.label })),
      placeholder: 'Todos',
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      type: 'select',
      options: PRIORIDADES.map((p) => ({ value: p.value, label: p.label })),
      placeholder: 'Todas',
    },
    {
      key: 'tipo',
      label: 'Tipo',
      type: 'select',
      options: TIPOS.map((t) => ({ value: t.value, label: t.label })),
      placeholder: 'Todos',
    },
  ];

  const refetch = useCallback(
    (page?: number) => fetchData(page ?? pagination.page, search, filterValues, soloCriticos),
    [fetchData, pagination.page, search, filterValues, soloCriticos],
  );

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);

  const handleSearch = useCallback(() => {
    fetchData(1, search, filterValues, soloCriticos);
  }, [fetchData, search, filterValues, soloCriticos]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
      fetchData(1, search, { ...filterValues, [key]: value }, soloCriticos);
    },
    [fetchData, search, filterValues, soloCriticos],
  );

  const handleRemoveFilter = useCallback(
    (key: string) => {
      if (key === 'criticos') {
        setSoloCriticos(false);
        fetchData(1, search, filterValues, false);
        return;
      }
      const next = { ...filterValues };
      delete next[key];
      setFilterValues(next);
      fetchData(1, search, next, soloCriticos);
    },
    [fetchData, search, filterValues, soloCriticos],
  );

  const handleClearFilters = useCallback(() => {
    setFilterValues({});
    setSoloCriticos(false);
    fetchData(1, search, {}, false);
  }, [fetchData, search]);

  const handlePageChange = useCallback(
    (page: number) => fetchData(page, search, filterValues, soloCriticos),
    [fetchData, search, filterValues, soloCriticos],
  );

  // ── Handlers de modales ──
  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback(
    (item: ReporteCampoDTO) => {
      if (item.estado !== 'Pendiente') {
        showToast('Solo los reportes Pendientes pueden editarse.', 'error');
        return;
      }
      setSelectedItem(item);
      setForm({
        tipo: (TIPOS.find((t) => t.label === item.tipo)?.value ?? 'OPERADOR') as TipoReporteApi,
        usuario: item.usuario,
        obraId: item.obraId || '',
        maquinaId: item.maquinaId || '',
        fecha: item.fecha,
        hora: item.hora,
        prioridad: (PRIORIDADES.find((p) => p.label === item.prioridad)?.value ?? '') as '' | PrioridadReporteApi,
        descripcion: item.descripcion,
      });
      setEditOpen(true);
    },
    [showToast],
  );

  const openDelete = useCallback((item: ReporteCampoDTO) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  // ── Validación ──
  const validateForm = useCallback(() => {
    if (!form.tipo || !form.usuario.trim()) {
      showToast('Tipo y usuario son obligatorios.', 'error');
      return false;
    }
    if (!form.obraId) {
      showToast('Selecciona una obra.', 'error');
      return false;
    }
    if (!form.fecha || !form.hora) {
      showToast('La fecha y la hora del reporte son obligatorias.', 'error');
      return false;
    }
    if (!form.descripcion.trim()) {
      showToast('La descripción del reporte es obligatoria.', 'error');
      return false;
    }
    return true;
  }, [form, showToast]);

  // ── CRUD via API ──
  /** Deriva obraTexto del catálogo — el backend la persiste junto al FK. */
  const buildPayload = useCallback(
    (): ReporteCampoCreateInput => ({
      tipo: form.tipo,
      usuario: form.usuario.trim(),
      maquinaId: form.maquinaId || undefined,
      obraId: form.obraId || undefined,
      obraTexto: catalogos.obras.find((o) => o.id === form.obraId)?.nombre ?? '',
      fecha: form.fecha,
      hora: form.hora,
      descripcion: form.descripcion.trim(),
      prioridad: form.prioridad || undefined,
    }),
    [form, catalogos.obras],
  );

  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await reportesCampoApi.crear(buildPayload());
      if (res.success) {
        showToast('Reporte registrado exitosamente.', 'success');
        setCreateOpen(false);
        setForm(emptyForm);
        refetch(1);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al registrar el reporte.', 'error');
      }
    } catch {
      showToast('Error de conexión al registrar el reporte.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, buildPayload, showToast, refetch, fetchStats]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem || !validateForm()) return;
    setSubmitting(true);
    try {
      const res = await reportesCampoApi.actualizar(selectedItem.id, buildPayload());
      if (res.success) {
        showToast('Reporte actualizado exitosamente.', 'success');
        setEditOpen(false);
        setSelectedItem(null);
        setForm(emptyForm);
        refetch();
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al actualizar el reporte.', 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar el reporte.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, validateForm, buildPayload, showToast, refetch, fetchStats]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await reportesCampoApi.eliminar(selectedItem.id);
      if (res.success) {
        showToast('Reporte eliminado exitosamente.', 'success');
        setDeleteOpen(false);
        setSelectedItem(null);
        refetch();
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al eliminar el reporte.', 'error');
      }
    } catch {
      showToast('Error de conexión al eliminar el reporte.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast, refetch, fetchStats]);

  // ── Flujo de estados (avanza una etapa via API) ──
  const handleAvanzar = useCallback(
    async (item: ReporteCampoDTO) => {
      const next = siguienteEstado(item.estado);
      if (!next) return;
      const res = await reportesCampoApi.cambiarEstado(item.id, ESTADO_API[next]);
      if (res.success) {
        showToast(`Reporte marcado como "${next}".`, 'success');
        refetch();
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al avanzar el reporte.', 'error');
      }
    },
    [showToast, refetch, fetchStats],
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Reportes de Campo"
        subtitle="Bitácora unificada — mecánicos, operadores, ingenieros, incidentes y más."
        action={
          puedeCrear ? (
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              Nuevo Reporte
            </Button>
          ) : undefined
        }
      />

      {/* Banner de incidentes críticos activos */}
      {stats.criticosActivos > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-red-900 font-bold text-sm">Incidentes Críticos Activos</p>
              <p className="text-red-700 text-xs font-medium">
                Hay {stats.criticosActivos} incidente{stats.criticosActivos > 1 ? 's' : ''} sin resolver.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => {
              setSoloCriticos(true);
              fetchData(1, search, filterValues, true);
            }}
          >
            Ver incidentes críticos
          </Button>
        </div>
      )}

      {/* StatsCards fila 1 — por estado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={<ClipboardCheck size={22} />}
          value={stats.pendientes}
          label="Pendientes"
          color={stats.pendientes > 0 ? 'warning' : 'neutral'}
        />
        <StatsCard
          icon={<Eye size={22} />}
          value={stats.enRevision}
          label="En Revisión"
          color={stats.enRevision > 0 ? 'primary' : 'neutral'}
        />
        <StatsCard
          icon={<CheckCircle2 size={22} />}
          value={stats.atendidos}
          label="Atendidos"
          color="info"
        />
        <StatsCard
          icon={<ShieldAlert size={22} />}
          value={stats.resueltos}
          label="Resueltos"
          color="success"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar por usuario, obra o descripción..."
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

      {/* Feed de tarjetas de reporte */}
      <div className="relative space-y-4">
        {refreshing && !initialLoading && (
          <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center transition-opacity">
            <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {initialLoading ? (
          <div className="flex items-center justify-center py-24 bg-white rounded-xl border border-slate-200">
            <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reportes.length === 0 ? (
          <EmptyState
            title="Sin reportes en esta categoría"
            subtitle="Ajusta los filtros o registra un nuevo reporte de campo."
          />
        ) : (
          reportes.map((report) => {
            const accion = etiquetaAccion(report);
            return (
              <div
                key={report.id}
                className={`bg-white rounded-xl border border-slate-200 shadow-sm transition-all p-0 overflow-hidden flex flex-col md:flex-row ${
                  report.tipo === 'Incidente' ? 'hover:border-red-300' : 'hover:border-primary/50'
                }`}
              >
                {/* Barra lateral de color por tipo */}
                <div className={`w-1.5 md:w-4 shrink-0 ${getTipoColor(report.tipo)}`} />

                <div className="p-6 flex-1 flex flex-col md:flex-row gap-6">
                  {/* Info del usuario */}
                  <div className="md:w-52 shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-2 rounded-lg ${
                          report.tipo === 'Incidente' ? 'bg-red-50' : 'bg-slate-50'
                        }`}
                      >
                        {getTipoIcon(report.tipo)}
                      </div>
                      <div className="font-black text-slate-900 text-sm leading-tight">
                        {report.usuario}
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {report.tipo}
                    </p>
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <Clock className="w-3 h-3" /> {report.hora} — {report.fecha}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <MapPin className="w-3 h-3" /> {report.obra}
                      </div>
                      {(report.maquinaCodigo || report.maquinaNombre) && (
                        <div className="text-[10px] font-black text-primary uppercase tracking-widest">
                          Máq: {report.maquinaCodigo ?? report.maquinaNombre}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contenido del reporte */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-3 gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {report.prioridad && (
                          <Badge variant={prioridadVariant[report.prioridad]} size="sm" dot>
                            Prioridad {report.prioridad}
                          </Badge>
                        )}
                      </div>
                      <Badge variant={estadoVariant[report.estado]} size="sm">
                        {report.estado}
                      </Badge>
                    </div>

                    <div
                      className={`p-4 rounded-xl border italic text-sm font-medium ${
                        report.tipo === 'Incidente'
                          ? 'bg-red-50 border-red-100 text-red-900'
                          : 'bg-slate-50 border-slate-100 text-slate-600'
                      }`}
                    >
                      &ldquo;{report.descripcion}&rdquo;
                    </div>

                    {/* Detalles extra (litros/costo del pipero u otros pares) */}
                    {report.detalles && (
                      <div className="mt-4 flex gap-4 flex-wrap">
                        {Object.entries(report.detalles).map(([k, v]) => (
                          <div
                            key={k}
                            className={`border rounded-lg px-3 py-1.5 ${
                              k === 'costo'
                                ? 'bg-green-50 border-green-100'
                                : 'bg-orange-50 border-orange-100'
                            }`}
                          >
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                              {k.charAt(0).toUpperCase() + k.slice(1)}
                            </span>
                            <span
                              className={`text-sm font-black ${
                                k === 'costo' ? 'text-green-700' : 'text-orange-700'
                              }`}
                            >
                              {formatDetalle(k, v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="md:w-36 flex md:flex-col justify-end items-stretch md:items-end gap-2 shrink-0">
                    {accion && puedeEditar && (
                      <Button
                        variant="success"
                        size="sm"
                        icon={<Check className="w-3.5 h-3.5" />}
                        className="w-full"
                        onClick={() => handleAvanzar(report)}
                      >
                        {accion}
                      </Button>
                    )}
                    {puedeEditar && report.estado === 'Pendiente' && (
                      <Button
                        variant="warning"
                        size="sm"
                        icon={<Pencil className="w-3.5 h-3.5" />}
                        className="w-full"
                        onClick={() => openEdit(report)}
                      >
                        Editar
                      </Button>
                    )}
                    {puedeEliminar && (
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        className="w-full"
                        onClick={() => openDelete(report)}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalRecords={pagination.total}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />

      {/* ═══════════════════════════════════════════
          MODALES
          ═══════════════════════════════════════════ */}

      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCancel={() => setCreateOpen(false)}
        title="Nuevo Reporte de Campo"
        subtitle="Registra una observación, incidente o actividad desde campo."
        submitLabel="Registrar Reporte"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Tipo de reporte" required>
            <select
              className={modalSelectClass}
              value={form.tipo}
              onChange={(e) =>
                setForm({ ...form, tipo: e.target.value as TipoReporteApi })
              }
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Prioridad" hint="Opcional — úsala para incidentes o urgencias.">
            <select
              className={modalSelectClass}
              value={form.prioridad}
              onChange={(e) =>
                setForm({
                  ...form,
                  prioridad: e.target.value as '' | PrioridadReporteApi,
                })
              }
            >
              <option value="">Sin prioridad</option>
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Reporta (usuario)" required>
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Marcos G."
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
            />
          </ModalField>

          <ModalField label="Obra" required>
            <select
              className={modalSelectClass}
              value={form.obraId}
              onChange={(e) => setForm({ ...form, obraId: e.target.value })}
            >
              <option value="">Seleccionar obra...</option>
              {catalogos.obras.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Máquina (opcional)" hint="Código legible de la flota.">
            <select
              className={modalSelectClass}
              value={form.maquinaId}
              onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
            >
              <option value="">Sin máquina asociada</option>
              {catalogos.maquinas.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </ModalField>

          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Fecha" required>
              <input
                type="date"
                className={modalInputClass}
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </ModalField>
            <ModalField label="Hora" required>
              <input
                type="time"
                className={modalInputClass}
                value={form.hora}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
              />
            </ModalField>
          </div>

          <ModalField label="Descripción" required className="sm:col-span-2">
            <textarea
              className={modalTextareaClass}
              rows={4}
              placeholder="Describe lo observado o realizado..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Reporte"
        subtitle={
          selectedItem
            ? `Disponible solo mientras está Pendiente · ${selectedItem.usuario}`
            : undefined
        }
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Tipo de reporte" required>
            <select
              className={modalSelectClass}
              value={form.tipo}
              onChange={(e) =>
                setForm({ ...form, tipo: e.target.value as TipoReporteApi })
              }
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Prioridad">
            <select
              className={modalSelectClass}
              value={form.prioridad}
              onChange={(e) =>
                setForm({
                  ...form,
                  prioridad: e.target.value as '' | PrioridadReporteApi,
                })
              }
            >
              <option value="">Sin prioridad</option>
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Reporta (usuario)" required>
            <input
              type="text"
              className={modalInputClass}
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
            />
          </ModalField>

          <ModalField label="Obra" required>
            <select
              className={modalSelectClass}
              value={form.obraId}
              onChange={(e) => setForm({ ...form, obraId: e.target.value })}
            >
              <option value="">Seleccionar obra...</option>
              {catalogos.obras.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Máquina (opcional)" hint="Código legible de la flota.">
            <select
              className={modalSelectClass}
              value={form.maquinaId}
              onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
            >
              <option value="">Sin máquina asociada</option>
              {catalogos.maquinas.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </ModalField>

          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Fecha" required>
              <input
                type="date"
                className={modalInputClass}
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </ModalField>
            <ModalField label="Hora" required>
              <input
                type="time"
                className={modalInputClass}
                value={form.hora}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
              />
            </ModalField>
          </div>

          <ModalField label="Descripción" required className="sm:col-span-2">
            <textarea
              className={modalTextareaClass}
              rows={4}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Reporte"
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
            <p className="text-sm text-slate-700 mb-1">¿Estás seguro de eliminar este reporte?</p>
            <p className="font-black text-slate-900 text-lg mb-2">
              {selectedItem.usuario} · {selectedItem.tipo}
            </p>
            <p className="text-xs text-slate-500 max-w-xs truncate">
              &ldquo;{selectedItem.descripcion}&rdquo;
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}
