"use client";

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  Wrench, Fuel, User, ClipboardCheck, Clock, MapPin,
  ShieldAlert, HardHat, Users, AlertTriangle, CheckCircle2,
  Plus, Pencil, Trash2, Eye, FileSearch, X, AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { FormModal, ModalField, modalInputClass, modalSelectClass, modalTextareaClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import { reportesCampo as reportesMock, type ReporteCampo } from '@/lib/data';

// ── Constantes ──
const PAGE_SIZE = 6;

const TIPOS: ReporteCampo['tipo'][] = [
  'Incidente', 'Mecanico', 'Pipero', 'Operador', 'Checador', 'Ingeniero', 'Trabajador',
];

const ESTADOS_FILTRO: ReporteCampo['estado'][] = [
  'Pendiente', 'Visto', 'Atendido', 'En Revisión', 'Resuelto',
];

const PRIORIDADES: NonNullable<ReporteCampo['prioridad']>[] = [
  'Baja', 'Media', 'Alta', 'Crítica',
];

const turnoIconMap: Record<string, React.ReactNode> = {};

// ── Helpers de presentación ──

function getTipoIcon(tipo: ReporteCampo['tipo']) {
  switch (tipo) {
    case 'Mecanico':   return <Wrench className="w-5 h-5 text-blue-500" />;
    case 'Pipero':     return <Fuel className="w-5 h-5 text-orange-500" />;
    case 'Operador':   return <User className="w-5 h-5 text-green-500" />;
    case 'Checador':   return <ClipboardCheck className="w-5 h-5 text-purple-500" />;
    case 'Incidente':  return <ShieldAlert className="w-5 h-5 text-red-500" />;
    case 'Ingeniero':  return <HardHat className="w-5 h-5 text-yellow-500" />;
    case 'Trabajador': return <Users className="w-5 h-5 text-teal-500" />;
  }
}

function getTipoColor(tipo: ReporteCampo['tipo']) {
  switch (tipo) {
    case 'Mecanico':   return 'bg-blue-500';
    case 'Pipero':     return 'bg-orange-500';
    case 'Operador':   return 'bg-green-500';
    case 'Checador':   return 'bg-purple-500';
    case 'Incidente':  return 'bg-red-500';
    case 'Ingeniero':  return 'bg-yellow-400';
    case 'Trabajador': return 'bg-teal-500';
  }
}

const estadoVariant: Record<ReporteCampo['estado'], 'warning' | 'info' | 'success' | 'primary'> = {
  Pendiente: 'warning',
  Visto: 'info',
  Atendido: 'success',
  'En Revisión': 'primary',
  Resuelto: 'success',
};

const prioridadVariant: Record<NonNullable<ReporteCampo['prioridad']>, 'error' | 'warning' | 'neutral' | 'info'> = {
  'Crítica': 'error',
  Alta: 'warning',
  Media: 'neutral',
  Baja: 'info',
};

/** Siguiente etapa del flujo de seguimiento del reporte. */
function siguienteEstado(estado: ReporteCampo['estado']): ReporteCampo['estado'] | null {
  switch (estado) {
    case 'Pendiente':   return 'Visto';
    case 'Visto':       return 'Atendido';
    case 'Atendido':    return 'Resuelto';
    case 'En Revisión': return 'Resuelto';
    default:            return null;
  }
}

/** Etiqueta del botón principal — conserva los nombres originales de la vista. */
function etiquetaAccion(report: ReporteCampo): string | null {
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

export default function ReportesCampoPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === '/reportes-campo');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Estado de datos (local hasta integrar API) ──
  const [reportes, setReportes] = useState<ReporteCampo[]>(reportesMock);
  const [page, setPage] = useState(1);

  // ── Estado de búsqueda y filtros ──
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [soloCriticos, setSoloCriticos] = useState(false);

  // ── Estado de modales ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReporteCampo | null>(null);
  const emptyForm = {
    tipo: 'Operador' as ReporteCampo['tipo'],
    usuario: '',
    obra: '',
    maquinaId: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    prioridad: '' as NonNullable<ReporteCampo['prioridad']> | '',
    descripcion: '',
  };
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Incidentes críticos activos (banner preservado) ──
  const criticosActivos = useMemo(
    () =>
      reportes.filter(
        (r) =>
          r.tipo === 'Incidente' &&
          (r.prioridad === 'Crítica' || r.prioridad === 'Alta') &&
          r.estado !== 'Resuelto',
      ),
    [reportes],
  );

  // ── Filtrado ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reportes.filter((r) => {
      if (soloCriticos && !criticosActivos.includes(r)) return false;
      if (filterValues.estado && r.estado !== filterValues.estado) return false;
      if (filterValues.prioridad && (r.prioridad ?? '') !== filterValues.prioridad) return false;
      if (filterValues.tipo && r.tipo !== filterValues.tipo) return false;
      if (
        q &&
        !r.usuario.toLowerCase().includes(q) &&
        !r.descripcion.toLowerCase().includes(q) &&
        !r.obra.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [reportes, search, filterValues, soloCriticos, criticosActivos]);

  // ── Paginación client-side ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const handlePageChange = useCallback((newPage: number) => setPage(newPage), []);

  // ── Stats por estado ──
  const stats = useMemo(
    () => ({
      pendientes: reportes.filter((r) => r.estado === 'Pendiente').length,
      enRevision: reportes.filter((r) => r.estado === 'En Revisión').length,
      atendidos: reportes.filter((r) => r.estado === 'Atendido').length,
      resueltos: reportes.filter((r) => r.estado === 'Resuelto').length,
    }),
    [reportes],
  );

  // ── Filtros activos (chips) ──
  const activeFilters: ActiveFilter[] = [];
  if (filterValues.estado)
    activeFilters.push({ key: 'estado', label: 'Estado', value: filterValues.estado });
  if (filterValues.prioridad)
    activeFilters.push({ key: 'prioridad', label: 'Prioridad', value: filterValues.prioridad });
  if (filterValues.tipo)
    activeFilters.push({ key: 'tipo', label: 'Tipo', value: filterValues.tipo });
  if (soloCriticos)
    activeFilters.push({ key: 'criticos', label: 'Vista', value: 'Solo críticos' });

  const filterFields: FilterField[] = [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: ESTADOS_FILTRO.map((e) => ({ value: e, label: e })),
      placeholder: 'Todos',
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      type: 'select',
      options: PRIORIDADES.map((p) => ({ value: p, label: p })),
      placeholder: 'Todas',
    },
    {
      key: 'tipo',
      label: 'Tipo',
      type: 'select',
      options: TIPOS.map((t) => ({ value: t, label: t })),
      placeholder: 'Todos',
    },
  ];

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    [],
  );

  const handleRemoveFilter = useCallback((key: string) => {
    setFilterValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterValues({});
    setSoloCriticos(false);
    setPage(1);
  }, []);

  // ── Handlers de modales ──
  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback(
    (item: ReporteCampo) => {
      if (item.estado !== 'Pendiente') {
        showToast('Solo los reportes Pendientes pueden editarse.', 'error');
        return;
      }
      setSelectedItem(item);
      setForm({
        tipo: item.tipo,
        usuario: item.usuario,
        obra: item.obra,
        maquinaId: item.maquinaId ?? '',
        fecha: item.fecha,
        hora: item.hora,
        prioridad: item.prioridad ?? '',
        descripcion: item.descripcion,
      });
      setEditOpen(true);
    },
    [showToast],
  );

  const openDelete = useCallback((item: ReporteCampo) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  const openDetalle = useCallback((item: ReporteCampo) => {
    setSelectedItem(item);
    setDetalleOpen(true);
  }, []);

  // ── Flujo de estados (avanza una etapa) ──
  const handleAvanzar = useCallback(
    (item: ReporteCampo) => {
      const next = siguienteEstado(item.estado);
      if (!next) return;
      setReportes((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, estado: next } : r)),
      );
      showToast(`Reporte marcado como "${next}".`, 'success');
    },
    [showToast],
  );

  // ── Validación ──
  const validateForm = useCallback(() => {
    if (!form.tipo || !form.usuario.trim() || !form.obra.trim()) {
      showToast('Tipo, usuario y obra son obligatorios.', 'error');
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

  // ── CRUD local ──
  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const nuevo: ReporteCampo = {
        id: crypto.randomUUID(),
        tipo: form.tipo,
        usuario: form.usuario.trim(),
        maquinaId: form.maquinaId.trim() || undefined,
        obra: form.obra.trim(),
        fecha: form.fecha,
        hora: form.hora,
        descripcion: form.descripcion.trim(),
        estado: 'Pendiente',
        prioridad: form.prioridad || undefined,
      };
      setReportes((prev) => [nuevo, ...prev]);
      showToast('Reporte registrado exitosamente.', 'success');
      setCreateOpen(false);
      setForm(emptyForm);
      setPage(1);
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, form, showToast]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem || !validateForm()) return;
    setSubmitting(true);
    try {
      setReportes((prev) =>
        prev.map((r) =>
          r.id === selectedItem.id
            ? {
                ...r,
                tipo: form.tipo,
                usuario: form.usuario.trim(),
                maquinaId: form.maquinaId.trim() || undefined,
                obra: form.obra.trim(),
                fecha: form.fecha,
                hora: form.hora,
                descripcion: form.descripcion.trim(),
                prioridad: form.prioridad || undefined,
              }
            : r,
        ),
      );
      showToast('Reporte actualizado exitosamente.', 'success');
      setEditOpen(false);
      setSelectedItem(null);
      setForm(emptyForm);
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, validateForm, form, showToast]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      setReportes((prev) => prev.filter((r) => r.id !== selectedItem.id));
      showToast('Reporte eliminado exitosamente.', 'success');
      setDeleteOpen(false);
      setSelectedItem(null);
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast]);

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
      {criticosActivos.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-red-900 font-bold text-sm">Incidentes Críticos Activos</p>
              <p className="text-red-700 text-xs font-medium">
                Hay {criticosActivos.length} incidente{criticosActivos.length > 1 ? 's' : ''} sin resolver.
              </p>
            </div>
          </div>
          <Button
            variant={soloCriticos ? 'danger' : 'outline'}
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => {
              setSoloCriticos((v) => !v);
              setPage(1);
            }}
          >
            {soloCriticos ? 'Ver todos' : 'Ver críticos'}
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
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onSearch={() => setPage(1)}
          placeholder="Buscar por usuario, obra o descripción..."
          className="flex-1"
        />
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="md"
          icon={<Plus className="w-4 h-4 rotate-90" />}
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
                onClick={() => {
                  if (filter.key === 'criticos') setSoloCriticos(false);
                  else handleRemoveFilter(filter.key);
                  setPage(1);
                }}
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
      <div className="space-y-4">
        {paginated.length === 0 ? (
          <EmptyState
            title="Sin reportes en esta categoría"
            subtitle="Ajusta los filtros o registra un nuevo reporte de campo."
          />
        ) : (
          paginated.map((report) => {
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
                      {report.maquinaId && (
                        <div className="text-[10px] font-black text-primary uppercase tracking-widest">
                          Máq: {report.maquinaId}
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
                        {Object.entries(report.detalles as Record<string, unknown>).map(([k, v]) => (
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
                        variant={report.tipo === 'Incidente' ? 'danger' : 'secondary'}
                        size="sm"
                        className="w-full"
                        onClick={() => handleAvanzar(report)}
                      >
                        {accion}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      icon={<FileSearch className="w-3.5 h-3.5" />}
                      onClick={() => openDetalle(report)}
                    >
                      Detalles
                    </Button>
                    <div className="flex gap-2 md:justify-end">
                      {puedeEditar && report.estado === 'Pendiente' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Pencil className="w-3.5 h-3.5" />}
                          aria-label={`Editar reporte de ${report.usuario}`}
                          onClick={() => openEdit(report)}
                        >
                          Editar
                        </Button>
                      )}
                      {puedeEliminar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          aria-label={`Eliminar reporte de ${report.usuario}`}
                          onClick={() => openDelete(report)}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalRecords={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      )}

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
              onChange={(e) => setForm({ ...form, tipo: e.target.value as ReporteCampo['tipo'] })}
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
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
                  prioridad: e.target.value as NonNullable<ReporteCampo['prioridad']> | '',
                })
              }
            >
              <option value="">Sin prioridad</option>
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>{p}</option>
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
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Valle Sur"
              value={form.obra}
              onChange={(e) => setForm({ ...form, obra: e.target.value })}
            />
          </ModalField>

          <ModalField label="Máquina (opcional)" hint="Código legible, ej: M004">
            <input
              type="text"
              className={modalInputClass}
              placeholder="M004"
              value={form.maquinaId}
              onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
            />
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
              onChange={(e) => setForm({ ...form, tipo: e.target.value as ReporteCampo['tipo'] })}
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
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
                  prioridad: e.target.value as NonNullable<ReporteCampo['prioridad']> | '',
                })
              }
            >
              <option value="">Sin prioridad</option>
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>{p}</option>
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
            <input
              type="text"
              className={modalInputClass}
              value={form.obra}
              onChange={(e) => setForm({ ...form, obra: e.target.value })}
            />
          </ModalField>

          <ModalField label="Máquina (opcional)">
            <input
              type="text"
              className={modalInputClass}
              value={form.maquinaId}
              onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
            />
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

      {/* Modal de Detalles */}
      <Modal
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        size="full"
      >
        {selectedItem && (
          <>
            <ModalHeader
              title={`Reporte de ${selectedItem.usuario}`}
              subtitle={`${selectedItem.tipo} · ${selectedItem.obra}${selectedItem.maquinaId ? ` · Máq: ${selectedItem.maquinaId}` : ''}`}
              onClose={() => setDetalleOpen(false)}
            />
            <ModalBody className="space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={estadoVariant[selectedItem.estado]} size="md">
                  {selectedItem.estado}
                </Badge>
                {selectedItem.prioridad && (
                  <Badge variant={prioridadVariant[selectedItem.prioridad]} size="md" dot>
                    Prioridad {selectedItem.prioridad}
                  </Badge>
                )}
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 ml-auto">
                  <Clock className="w-3.5 h-3.5" /> {selectedItem.hora} — {selectedItem.fecha}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Descripción
                </p>
                <div
                  className={`p-4 rounded-xl border italic text-sm ${
                    selectedItem.tipo === 'Incidente'
                      ? 'bg-red-50 border-red-100 text-red-900'
                      : 'bg-slate-50 border-slate-100 text-slate-600'
                  }`}
                >
                  &ldquo;{selectedItem.descripcion}&rdquo;
                </div>
              </div>

              {selectedItem.detalles && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Datos adicionales
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(selectedItem.detalles as Record<string, unknown>).map(([k, v]) => (
                      <div
                        key={k}
                        className={`border rounded-lg px-3 py-2 ${
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
                </div>
              )}

              <p className="text-[11px] text-slate-400 font-medium text-center">
                Los reportes registran su historial completo en la bitácora de auditoría.
              </p>
            </ModalBody>
          </>
        )}
      </Modal>
    </div>
  );
}
