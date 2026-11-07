"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wrench, Fuel, User, ClipboardCheck, Clock, MapPin,
  ShieldAlert, HardHat, Users, AlertTriangle, CheckCircle2,
  Plus, Pencil, Trash2, Eye, X, AlertCircle, Check, SlidersHorizontal, Receipt,
  Briefcase, UserCheck, UserX,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { FormModal, ModalField, modalInputClass, modalSelectClass, modalTextareaClass } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Tooltip } from '@/components/ui/Tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import {
  bitacoraApi,
  reportesCampoApi,
  trabajadoresApi,
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
  type TrabajadorDTO,
} from '@/lib/api';
import { RefreshOverlay } from '@/components/ui/RefreshOverlay';
import { sleepDemo } from '@/lib/demo-delay';

// ── Constantes ──
const PAGE_SIZE = 10;
const VISTA_RUTA = '/reportes';

const TIPOS: { value: TipoReporteApi; label: string }[] = [
  { value: 'INCIDENTE', label: 'Incidente' },
  { value: 'MECANICO', label: 'Mecanico' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
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
  { value: 'FACTURADO', label: 'Facturado' },
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
    case 'Mecanico':      return <Wrench className="w-5 h-5 text-blue-500" />;
    case 'Pipero':        return <Fuel className="w-5 h-5 text-orange-500" />;
    case 'Operador':      return <User className="w-5 h-5 text-green-500" />;
    case 'Checador':      return <ClipboardCheck className="w-5 h-5 text-purple-500" />;
    case 'Incidente':     return <ShieldAlert className="w-5 h-5 text-red-500" />;
    case 'Ingeniero':     return <HardHat className="w-5 h-5 text-yellow-500" />;
    case 'Administrativo': return <Briefcase className="w-5 h-5 text-indigo-500" />;
    case 'Trabajador':    return <Users className="w-5 h-5 text-teal-500" />;
    default:              return <ClipboardCheck className="w-5 h-5 text-ui-400" />;
  }
}

function getTipoColor(tipo: string) {
  switch (tipo) {
    case 'Mecanico':      return 'bg-blue-500';
    case 'Pipero':        return 'bg-orange-500';
    case 'Operador':      return 'bg-green-500';
    case 'Checador':      return 'bg-purple-500';
    case 'Incidente':     return 'bg-red-500';
    case 'Ingeniero':     return 'bg-yellow-400';
    case 'Administrativo': return 'bg-indigo-500';
    case 'Trabajador':    return 'bg-teal-500';
    default:              return 'bg-ui-400';
  }
}

const estadoVariant: Record<EstadoReporte, 'warning' | 'info' | 'success' | 'primary'> = {
  Pendiente: 'warning',
  Visto: 'info',
  Atendido: 'success',
  'En Revisión': 'primary',
  Resuelto: 'success',
  Facturado: 'primary',
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
  Facturado: 'FACTURADO',
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
  porArea: {},
};

const emptyForm = {
  tipo: '' as '' | TipoReporteApi,
  usuario: '',
  obraId: '',
  maquinaId: '',
  fecha: new Date().toISOString().split('T')[0],
  hora: new Date().toTimeString().slice(0, 5),
  prioridad: '' as '' | PrioridadReporteApi,
  descripcion: '',
};

export default function ReportesOperacionesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === VISTA_RUTA);
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
  const [trabajadores, setTrabajadores] = useState<TrabajadorDTO[]>([]);
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
  const [facturarOpen, setFacturarOpen] = useState(false);
  const [asignarOpen, setAsignarOpen] = useState(false);
  const [resolverOpen, setResolverOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReporteCampoDTO | null>(null);
  const [facturarItem, setFacturarItem] = useState<ReporteCampoDTO | null>(null);
  const [asignarItem, setAsignarItem] = useState<ReporteCampoDTO | null>(null);
  const [resolverItem, setResolverItem] = useState<ReporteCampoDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [facturando, setFacturando] = useState(false);
  const [asignarForm, setAsignarForm] = useState({ asignadoA: '', asignadoNombre: '' });

  // ── Cargar catálogos de obra y máquina (una sola vez) ──
  useEffect(() => {
    bitacoraApi.catalogos().then((res) => {
      if (res.success && res.data) {
        setCatalogos(res.data);
      }
    });
    trabajadoresApi.listar({ limit: 100 }).then((res) => {
      if (res.success && res.data) {
        setTrabajadores(res.data.items);
      }
    });
  }, []);

  // ── Cargar datos ──
  const fetchData = useCallback(async (page = 1, searchVal?: string, filters?: Record<string, string>, criticos?: boolean) => {
    await sleepDemo();
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
        showToast('Error al cargar los reportes.', 'error');
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
    const inicial = async () => {
      try {
        await Promise.all([fetchData(1), fetchStats()]);
      } catch {
        /* manejo de error delegado a cada fetch */
      }
    };
    inicial();
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
    activeFilters.push({ key: 'tipo', label: 'Área', value: label });
  }
  if (soloCriticos) {
    activeFilters.push({ key: 'criticos', label: 'Vista', value: 'Solo críticos' });
  }

  const filterFields: FilterField[] = [
    {
      key: 'tipo',
      label: 'Área',
      type: 'select',
      options: TIPOS.map((t) => ({ value: t.value, label: t.label })),
      placeholder: 'Todas las áreas',
    },
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

  const openAsignar = useCallback((item: ReporteCampoDTO) => {
    setAsignarItem(item);
    setAsignarForm({
      asignadoA: item.asignadoAId ?? '',
      asignadoNombre: item.asignadoAId ? '' : item.asignadoANombre ?? '',
    });
    setAsignarOpen(true);
  }, []);

  // ── Validación ──
  const validateForm = useCallback(() => {
    if (!form.tipo) {
      showToast('Selecciona el área del reporte.', 'error');
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
  /** "Quién reporta" = el usuario autenticado (no se captura a mano). */
  const nombreReporta = useCallback((): string => {
    const persona = user?.persona;
    const nombre = [persona?.nombre, persona?.apellidoPaterno, persona?.apellidoMaterno]
      .filter(Boolean)
      .join(' ')
      .trim();
    return nombre || user?.email?.split('@')[0] || 'Usuario';
  }, [user]);

  /** Deriva obraTexto del catálogo — el backend la persiste junto al FK. */
  const buildPayload = useCallback(
    (): ReporteCampoCreateInput => ({
      tipo: form.tipo as TipoReporteApi,
      usuario: nombreReporta(),
      maquinaId: form.maquinaId || undefined,
      obraId: form.obraId || undefined,
      obraTexto:
        catalogos.obras.find((o) => o.id === form.obraId)?.nombre ?? 'Sin obra asociada',
      fecha: form.fecha,
      hora: form.hora,
      descripcion: form.descripcion.trim(),
      prioridad: form.prioridad || undefined,
    }),
    [form, catalogos.obras, nombreReporta],
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

  // ── ASIGNAR "quién le cae" (responsable) ──
  const handleAsignar = useCallback(async () => {
    if (!asignarItem) return;
    if (!asignarForm.asignadoA && !asignarForm.asignadoNombre.trim()) {
      showToast('Asigna un trabajador o un nombre.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await reportesCampoApi.asignar(asignarItem.id, {
        asignadoA: asignarForm.asignadoA || null,
        asignadoNombre: asignarForm.asignadoA ? null : asignarForm.asignadoNombre.trim(),
      });
      if (res.success) {
        showToast('Responsable asignado exitosamente.', 'success');
        setAsignarOpen(false);
        setAsignarItem(null);
        refetch();
      } else {
        showToast(res.error?.message || 'Error al asignar.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [asignarItem, asignarForm, showToast, refetch]);

  // ── Flujo de estados (avanza una etapa via API) ──
  const handleAvanzar = useCallback(
    async (item: ReporteCampoDTO) => {
      const next = siguienteEstado(item.estado);
      if (!next) return;
      // Regla del negocio: al resolver exige saber "quién le cae".
      if (next === 'Resuelto' && !item.asignadoANombre) {
        showToast('Primero asigna a quién le toca resolverlo.', 'error');
        openAsignar(item);
        return;
      }
      // "Marcar Resuelto" pide confirmación (es la transición terminal previa a facturar).
      if (next === 'Resuelto') {
        setResolverItem(item);
        setResolverOpen(true);
        return;
      }
      const res = await reportesCampoApi.cambiarEstado(item.id, ESTADO_API[next]);
      if (res.success) {
        showToast(`Reporte marcado como "${next}".`, 'success');
        refetch();
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al avanzar el reporte.', 'error');
      }
    },
    [showToast, refetch, fetchStats, openAsignar],
  );

  // ── Confirmación "Marcar Resuelto" ──
  const handleResolverConfirm = useCallback(async () => {
    if (!resolverItem) return;
    setSubmitting(true);
    try {
      const res = await reportesCampoApi.cambiarEstado(resolverItem.id, 'RESUELTO');
      if (res.success) {
        showToast('Reporte marcado como "Resuelto".', 'success');
        setResolverOpen(false);
        setResolverItem(null);
        refetch();
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al marcar el reporte como resuelto.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [resolverItem, showToast, refetch, fetchStats]);

  // ── Facturar reporte Resuelto (nace la CxC) ──
  const handleFacturar = useCallback(async () => {
    if (!facturarItem) return;
    setFacturando(true);
    try {
      const res = await reportesCampoApi.facturar(facturarItem.id);
      if (res.success) {
        showToast(
          `Reporte facturado — CxC por ${formatCurrency(res.data.cuenta.monto)} creada.`,
          'success',
        );
        setFacturarItem(null);
        setFacturarOpen(false);
        refetch();
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al facturar el reporte.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setFacturando(false);
    }
  }, [facturarItem, showToast, refetch, fetchStats]);

  // ── Columnas de la tabla (patrón /inventario) ──
  const columns: Column<ReporteCampoDTO>[] = [
    {
      key: 'fechaHora',
      header: 'Fecha',
      minWidth: '105px',
      render: (report) => (
        <div>
          <span className="flex items-center gap-1.5 font-black text-ui-800">
            <Clock className="w-3 h-3 text-ui-400" />
            {report.hora}
          </span>
          <span className="text-[10px] font-bold text-ui-400">{report.fecha}</span>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Área',
      minWidth: '120px',
      render: (report) => (
        <span className="flex items-center gap-2">
          {getTipoIcon(report.tipo)}
          <span className={`h-2 w-2 rounded-full ${getTipoColor(report.tipo)}`} />
          <span className="font-bold text-ui-700">{report.tipo}</span>
        </span>
      ),
    },
    {
      key: 'usuario',
      header: 'Reporta',
      minWidth: '130px',
      render: (report) => (
        <div>
          <span className="font-black text-ui-900">{report.usuario}</span>
          {report.cliente && (
            <span className="block text-[10px] font-bold text-ui-400">
              Cliente: {report.cliente}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'obra',
      header: 'Obra / Máq.',
      minWidth: '150px',
      render: (report) => (
        <div>
          <span className="flex items-center gap-1.5 font-bold text-ui-700">
            <MapPin className="w-3 h-3 text-ui-400" />
            {report.obra}
          </span>
          {(report.maquinaCodigo || report.maquinaNombre) && (
            <span className="block text-[10px] font-black text-primary uppercase">
              Máq: {report.maquinaCodigo ?? report.maquinaNombre}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'prioridad',
      header: 'Prior.',
      minWidth: '90px',
      render: (report) =>
        report.prioridad ? (
          <Badge variant={prioridadVariant[report.prioridad]} size="sm" dot>
            {report.prioridad}
          </Badge>
        ) : (
          <span className="text-ui-300">—</span>
        ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (report) => (
        <Badge variant={estadoVariant[report.estado]} size="sm">
          {report.estado}
        </Badge>
      ),
    },
    {
      key: 'responsable',
      header: 'Responsable',
      minWidth: '150px',
      render: (report) => {
        if (report.resueltoEn) {
          return (
            <Tooltip
              placement="top"
              content={
                <span>
                  Resuelto por {report.asignadoANombre ?? '—'} el{' '}
                  {report.resueltoEn.slice(0, 10)}
                </span>
              }
            >
              <span className="flex items-center gap-1.5 font-black text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {report.asignadoANombre ?? 'Resuelto'}
              </span>
            </Tooltip>
          );
        }
        if (report.asignadoANombre) {
          return (
            <span className="flex items-center gap-1.5 font-bold text-ui-700">
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              {report.asignadoANombre}
            </span>
          );
        }
        return <span className="text-ui-300">Sin asignar</span>;
      },
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      minWidth: '560px',
      className: 'whitespace-normal',
      render: (report) => (
        <div className="max-w-2xl">
          <Tooltip placement="top" content={report.descripcion} maxWidth={480}>
            <span className="font-medium text-ui-600">
              &ldquo;{report.descripcion}&rdquo;
            </span>
          </Tooltip>
          {/* Detalles (litros/costo) y servicio facturable */}
          <span className="mt-1 flex gap-2 flex-wrap">
            {report.detalles &&
              Object.entries(report.detalles).map(([k, v]) => (
                <span
                  key={k}
                  className={`border rounded-lg px-2 py-0.5 text-[10px] font-black ${
                    k === 'costo'
                      ? 'bg-green-50 border-green-100 text-green-700'
                      : 'bg-orange-50 border-orange-100 text-orange-700'
                  }`}
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}: {formatDetalle(k, v)}
                </span>
              ))}
            {report.montoServicio != null && (
              <span className="border border-emerald-100 bg-emerald-50 rounded-lg px-2 py-0.5 text-[10px] font-black text-emerald-700">
                Servicio: {formatCurrency(report.montoServicio)}
              </span>
            )}
          </span>
        </div>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      minWidth: '440px',
      render: (report) => {
        const accion = etiquetaAccion(report);
        return (
          <div className="flex items-center justify-end gap-1.5">
            {puedeEditar && report.estado !== 'Resuelto' && report.estado !== 'Facturado' && (
              <Tooltip content={report.asignadoANombre ? 'Cambiar responsable' : 'Asignar responsable'}>
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label="Asignar responsable"
                  icon={<UserCheck className="w-3.5 h-3.5" />}
                  onClick={() => openAsignar(report)}
                >
                  {report.asignadoANombre ? 'Reasignar' : 'Asignar'}
                </Button>
              </Tooltip>
            )}
            {accion && puedeEditar && (
              <Tooltip content={`Avanza a "${accion.replace('Marcar ', '')}"`}>
                <Button
                  variant="success"
                  size="sm"
                  aria-label={accion}
                  icon={<Check className="w-3.5 h-3.5" />}
                  onClick={() => handleAvanzar(report)}
                >
                  {accion}
                </Button>
              </Tooltip>
            )}
            {puedeEditar && report.estado === 'Resuelto' && report.cliente && report.montoServicio != null && (
              <Tooltip content="Facturar (nace la CxC)">
                <Button
                  variant="primary"
                  size="sm"
                  aria-label="Facturar"
                  icon={<Receipt className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setFacturarItem(report);
                    setFacturarOpen(true);
                  }}
                >
                  Facturar
                </Button>
              </Tooltip>
            )}
            {puedeEditar && report.estado === 'Pendiente' && (
              <Tooltip content="Editar el reporte">
                <Button
                  variant="warning"
                  size="sm"
                  aria-label="Editar"
                  icon={<Pencil className="w-3.5 h-3.5" />}
                  onClick={() => openEdit(report)}
                >
                  Editar
                </Button>
              </Tooltip>
            )}
            {puedeEliminar && (
              <Tooltip content="Eliminar reporte">
                <Button
                  variant="danger"
                  size="sm"
                  aria-label="Eliminar"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => openDelete(report)}
                >
                  Eliminar
                </Button>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Reportes"
        subtitle="Incidentes, mecánicos, administrativos y demás áreas — con responsable asignado."
        action={
          puedeCrear ? (
            <Button
          skeleton={initialLoading} variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              Nuevo Reporte
            </Button>
          ) : undefined
        }
      />

      {/* Banner de incidentes críticos activos */}
      {stats.criticosActivos > 0 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-red-900 dark:text-red-300 font-bold text-sm">Incidentes Críticos Activos</p>
              <p className="text-red-700 dark:text-red-400 text-xs font-medium">
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
            {filterFields.map((filter) => (
              <div key={filter.key} className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] font-black text-ui-500 uppercase tracking-widest">
                  {filter.label}
                </label>
                <select
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="h-10 px-3 border border-ui-200 rounded-lg text-xs font-medium bg-surface text-ui-900 focus:outline-none focus:border-primary/50"
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

      {/* Tabla de reportes (patrón /inventario) */}
      <div className="relative">
        <RefreshOverlay show={refreshing && !initialLoading} />

        <DataTable
          columns={columns}
          data={reportes}
          keyExtractor={(report) => report.id}
          loading={initialLoading}
          emptyText="No hay reportes con estos filtros"
        />
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
        title="Nuevo Reporte"
        subtitle="Registra una observación, incidente o actividad desde campo."
        submitLabel="Registrar Reporte"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Área (tipo de reporte)" required>
            <select
              className={modalSelectClass}
              value={form.tipo}
              onChange={(e) =>
                setForm({ ...form, tipo: e.target.value as '' | TipoReporteApi })
              }
            >
              <option value="">Seleccionar área...</option>
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

          <ModalField label="Obra" hint="Opcional — algunos reportes no improper con obra.">
            <select
              className={modalSelectClass}
              value={form.obraId}
              onChange={(e) => setForm({ ...form, obraId: e.target.value })}
            >
              <option value="">Sin obra asociada</option>
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

      {/* Modal de ASIGNACIÓN — quién lo debe resolver */}
      <FormModal
        open={asignarOpen}
        onClose={() => {
          setAsignarOpen(false);
          setAsignarItem(null);
        }}
        onCancel={() => {
          setAsignarOpen(false);
          setAsignarItem(null);
        }}
        title="Asignar Responsable"
        subtitle="Quién debe resolver este reporte. Trabajador del sistema o nombre libre."
        submitLabel="Asignar"
        cancelLabel="Cancelar"
        onSubmit={handleAsignar}
        isSubmitting={submitting}
      >
        <div className="space-y-4">
          <ModalField label="Trabajador del sistema" hint="Al elegir uno, el nombre libre se ignora.">
            <select
              className={modalSelectClass}
              value={asignarForm.asignadoA}
              onChange={(e) =>
                setAsignarForm({ ...asignarForm, asignadoA: e.target.value })
              }
            >
              <option value="">Sin trabajador del sistema...</option>
              {trabajadores.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} — {t.puesto}
                </option>
              ))}
            </select>
          </ModalField>

          <ModalField label="O nombre libre" hint="Para externos o empleados aún no catalogados.">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Panchito el externo"
              value={asignarForm.asignadoNombre}
              onChange={(e) =>
                setAsignarForm({ ...asignarForm, asignadoNombre: e.target.value })
              }
              disabled={!!asignarForm.asignadoA}
            />
          </ModalField>

          {asignarItem && (
            <div className="bg-ui-50 border border-ui-100 rounded-xl p-3 flex items-start gap-2">
              <UserX className="w-4 h-4 text-ui-400 shrink-0 mt-0.5" />
              <p className="text-xs text-ui-500">
                Reporte de <strong>{asignarItem.usuario}</strong> ({asignarItem.tipo}) —
                &ldquo;{asignarItem.descripcion.slice(0, 80)}&rdquo;
              </p>
            </div>
          )}
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
          <ModalField label="Área (tipo de reporte)" required>
            <select
              className={modalSelectClass}
              value={form.tipo}
              onChange={(e) =>
                setForm({ ...form, tipo: e.target.value as '' | TipoReporteApi })
              }
            >
              <option value="">Seleccionar área...</option>
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

          <ModalField label="Obra" hint="Opcional — algunos reportes no improper con obra.">
            <select
              className={modalSelectClass}
              value={form.obraId}
              onChange={(e) => setForm({ ...form, obraId: e.target.value })}
            >
              <option value="">Sin obra asociada</option>
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

      {/* Modal de confirmación: Marcar Resuelto */}
      <FormModal
        open={resolverOpen}
        onClose={() => {
          setResolverOpen(false);
          setResolverItem(null);
        }}
        onCancel={() => {
          setResolverOpen(false);
          setResolverItem(null);
        }}
        title="Marcar como Resuelto"
        subtitle="Confirma quién resolvió el reporte. Esta acción no se puede deshacer."
        submitLabel="Sí, Marcar Resuelto"
        cancelLabel="Cancelar"
        onSubmit={handleResolverConfirm}
        isSubmitting={submitting}
      >
        {resolverItem && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="text-sm text-ui-700 mb-1">¿Marcar este reporte como resuelto?</p>
            <p className="font-black text-ui-900 text-lg mb-2">
              {resolverItem.usuario} · {resolverItem.tipo}
            </p>
            <p className="text-xs text-ui-500 max-w-xs">
              Quedará registrado que lo resolvió{' '}
              <strong className="text-emerald-700">{resolverItem.asignadoANombre}</strong>.
            </p>
          </div>
        )}
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
            <div className="w-14 h-14 bg-red-100 dark:bg-red-500/15 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-ui-700 mb-1">¿Estás seguro de eliminar este reporte?</p>
            <p className="font-black text-ui-900 text-lg mb-2">
              {selectedItem.usuario} · {selectedItem.tipo}
            </p>
            <p className="text-xs text-ui-500 max-w-xs truncate">
              &ldquo;{selectedItem.descripcion}&rdquo;
            </p>
          </div>
        )}
      </FormModal>

      <FormModal
        open={facturarOpen}
        onClose={() => setFacturarOpen(false)}
        onCancel={() => setFacturarOpen(false)}
        title="Facturar Reporte"
        subtitle="Se creará una cuenta por cobrar al cliente. Esta acción no se puede deshacer."
        submitLabel="Sí, Facturar"
        cancelLabel="Cancelar"
        onSubmit={handleFacturar}
        isSubmitting={facturando}
      >
        {facturarItem && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Receipt className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="text-sm text-ui-700 mb-1">
              Reporte de <strong>{facturarItem.usuario}</strong> ({facturarItem.tipo})
            </p>
            <p className="font-black text-ui-900 text-2xl mb-1">
              {formatCurrency(facturarItem.montoServicio ?? 0)}
            </p>
            <p className="text-xs text-ui-500">
              Cliente: {facturarItem.cliente} · Vencimiento a 30 días
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}
