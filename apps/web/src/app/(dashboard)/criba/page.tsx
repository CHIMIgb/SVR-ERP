"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Plus, Package, ArrowUpRight, Clock, Gauge,
  Pencil, Trash2, SlidersHorizontal, X, AlertCircle, Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { FormModal, ModalField, modalInputClass, modalSelectClass, modalTextareaClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { formatFechaSolo } from '@/lib/formatters';
import {
  cribaApi,
  type RegistroCribaDTO,
  type CribaCreateInput,
  type CribaStats,
  type CribaCatalogos,
  type TurnoCribaApi,
} from '@/lib/api';

// ── Constantes ──
const PAGE_SIZE = 10;

const MATERIALES = ['Criba fina', 'Criba gruesa', 'Arena lavada'] as const;

// Turno: el formulario/filtro usa el enum de la API; la UI muestra la etiqueta.
const TURNOS: { value: TurnoCribaApi; label: 'Matutino' | 'Vespertino' }[] = [
  { value: 'MATUTINO', label: 'Matutino' },
  { value: 'VESPERTINO', label: 'Vespertino' },
];

const materialVariant: Record<string, 'warning' | 'primary' | 'info'> = {
  'Criba fina': 'warning',
  'Criba gruesa': 'primary',
  'Arena lavada': 'info',
};

const turnoVariant: Record<RegistroCribaDTO['turno'], 'warning' | 'info'> = {
  Matutino: 'warning',
  Vespertino: 'info',
};

const emptyForm = {
  fecha: new Date().toISOString().split('T')[0],
  turno: 'MATUTINO' as TurnoCribaApi,
  operadorId: '',
  tipoMaterial: 'Criba fina' as string,
  materialProducido: '',
  horasTrabajadas: '',
  materialAlBanco: '',
  observaciones: '',
};

/** Color de la tarjeta de eficiencia según umbral de planta. */
function colorEficiencia(ef: number): 'success' | 'warning' | 'error' {
  if (ef >= 90) return 'success';
  if (ef >= 70) return 'warning';
  return 'error';
}

const materialDot: Record<string, string> = {
  'Criba fina': 'bg-amber-500',
  'Criba gruesa': 'bg-orange-500',
  'Arena lavada': 'bg-teal-500',
};

export default function CribaPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === '/criba');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Estado de datos ──
  const [registros, setRegistros] = useState<RegistroCribaDTO[]>([]);
  const [catalogos, setCatalogos] = useState<CribaCatalogos>({ trabajadores: [] });
  const [stats, setStats] = useState({
    totalProducido: 0,
    totalAlBanco: 0,
    totalHoras: 0,
    eficiencia: 0,
    porMaterial: [] as CribaStats['porMaterial'],
  });
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
  const [selectedItem, setSelectedItem] = useState<RegistroCribaDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Cargar catálogos (operadores) ──
  useEffect(() => {
    cribaApi.catalogos().then((res) => {
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
      const res = await cribaApi.listar({
        search: searchVal || undefined,
        turno: filters?.turno as TurnoCribaApi | undefined,
        tipoMaterial: filters?.tipoMaterial || undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setRegistros(res.data.items);
        setPagination(res.data.pagination);
      } else {
        showToast('Error al cargar los registros de criba.', 'error');
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
    const res = await cribaApi.stats();
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
  if (filterValues.turno) {
    const t = TURNOS.find((x) => x.value === filterValues.turno);
    activeFilters.push({ key: 'turno', label: 'Turno', value: t?.label ?? filterValues.turno });
  }
  if (filterValues.tipoMaterial) {
    activeFilters.push({ key: 'tipoMaterial', label: 'Material', value: filterValues.tipoMaterial });
  }

  // ── Filtros para SearchBar ──
  const filterFields: FilterField[] = [
    {
      key: 'turno',
      label: 'Turno',
      type: 'select',
      options: TURNOS.map((t) => ({ value: t.value, label: t.label })),
      placeholder: 'Todos',
    },
    {
      key: 'tipoMaterial',
      label: 'Material',
      type: 'select',
      options: MATERIALES.map((m) => ({ value: m, label: m })),
      placeholder: 'Todos',
    },
  ];

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

  const handleClearFilters = useCallback(() => {
    setFilterValues({});
    fetchData(1, search, {});
  }, [fetchData, search]);

  const handleRemoveFilter = useCallback((key: string) => {
    const next = { ...filterValues };
    delete next[key];
    setFilterValues(next);
    fetchData(1, search, next);
  }, [fetchData, search, filterValues]);

  const handlePageChange = useCallback((page: number) => {
    fetchData(page, search, filterValues);
  }, [fetchData, search, filterValues]);

  // ── Handlers de modales ──
  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((item: RegistroCribaDTO) => {
    setSelectedItem(item);
    setForm({
      fecha: item.fecha.split('T')[0],
      turno: item.turno === 'Matutino' ? 'MATUTINO' : 'VESPERTINO',
      operadorId: item.operadorId ?? '',
      tipoMaterial: item.tipoMaterial,
      materialProducido: String(item.materialProducido),
      horasTrabajadas: String(item.horasTrabajadas),
      materialAlBanco: String(item.materialAlBanco),
      observaciones: item.observaciones ?? '',
    });
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((item: RegistroCribaDTO) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  // ── Validación ──
  const validateForm = useCallback((): string | null => {
    if (!form.fecha) return 'La fecha es obligatoria.';
    if (!form.operadorId) return 'Selecciona un operador.';
    const producido = parseFloat(form.materialProducido);
    if (!form.materialProducido || isNaN(producido) || producido <= 0) {
      return 'Ingresa un material producido válido mayor a cero.';
    }
    const horas = parseFloat(form.horasTrabajadas);
    if (!form.horasTrabajadas || isNaN(horas) || horas <= 0 || horas > 24) {
      return 'Ingresa las horas trabajadas del turno (máx. 24).';
    }
    const alBanco = parseFloat(form.materialAlBanco);
    if (isNaN(alBanco) || alBanco < 0 || alBanco > producido) {
      return 'El material al banco no puede ser negativo ni mayor a lo producido.';
    }
    return null;
  }, [form]);

  const buildInput = useCallback((): CribaCreateInput => ({
    fecha: form.fecha,
    turno: form.turno,
    operadorId: form.operadorId || undefined,
    tipoMaterial: form.tipoMaterial,
    materialProducido: parseFloat(form.materialProducido),
    horasTrabajadas: parseFloat(form.horasTrabajadas),
    materialAlBanco: parseFloat(form.materialAlBanco),
    observaciones: form.observaciones.trim() || undefined,
  }), [form]);

  // ── CRUD ──
  const handleCreate = useCallback(async () => {
    const invalid = validateForm();
    if (invalid) {
      showToast(invalid, 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await cribaApi.crear(buildInput());
      if (res.success) {
        showToast(`Turno ${form.turno.toLowerCase()} registrado exitosamente.`, 'success');
        setCreateOpen(false);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al registrar el turno.', 'error');
      }
    } catch {
      showToast('Error de conexión al registrar el turno.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [form, validateForm, buildInput, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem) return;
    const invalid = validateForm();
    if (invalid) {
      showToast(invalid, 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await cribaApi.actualizar(selectedItem.id, buildInput());
      if (res.success) {
        showToast('Registro actualizado exitosamente.', 'success');
        setEditOpen(false);
        setSelectedItem(null);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al actualizar el registro.', 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar el registro.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, validateForm, buildInput, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await cribaApi.eliminar(selectedItem.id);
      if (res.success) {
        showToast('Registro eliminado exitosamente.', 'success');
        setDeleteOpen(false);
        setSelectedItem(null);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al eliminar el registro.', 'error');
      }
    } catch {
      showToast('Error de conexión al eliminar el registro.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  // ── Columnas de DataTable ──
  const columns: Column<RegistroCribaDTO>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      render: (item) => (
        <span className="whitespace-nowrap font-bold text-slate-600">{formatFechaSolo(item.fecha)}</span>
      ),
    },
    {
      key: 'turno',
      header: 'Turno',
      render: (item) => (
        <Badge variant={turnoVariant[item.turno]} size="sm" dot>{item.turno}</Badge>
      ),
    },
    {
      key: 'operador',
      header: 'Operador',
      render: (item) => (
        <span className="font-bold text-slate-700">{item.operador || '—'}</span>
      ),
    },
    {
      key: 'tipoMaterial',
      header: 'Material',
      render: (item) => (
        <Badge variant={materialVariant[item.tipoMaterial] ?? 'neutral'} size="sm" dot>
          {item.tipoMaterial}
        </Badge>
      ),
    },
    {
      key: 'materialProducido',
      header: 'Producido',
      align: 'right',
      render: (item) => (
        <span className="font-black text-slate-900">
          {item.materialProducido} <span className="text-slate-400 font-bold text-xs">m³</span>
        </span>
      ),
    },
    {
      key: 'materialAlBanco',
      header: 'Al banco',
      align: 'right',
      render: (item) => (
        <span className="font-black text-green-700">
          {item.materialAlBanco} <span className="text-green-400 font-bold text-xs">m³</span>
        </span>
      ),
    },
    {
      key: 'horasTrabajadas',
      header: 'Horas',
      align: 'right',
      render: (item) => (
        <span className="font-bold text-slate-600">{item.horasTrabajadas}h</span>
      ),
    },
    {
      key: 'eficiencia',
      header: 'Efic.',
      align: 'right',
      render: (item) => {
        const ef = item.materialProducido > 0
          ? Math.round((item.materialAlBanco / item.materialProducido) * 100)
          : 0;
        return (
          <Badge variant={colorEficiencia(ef)} size="sm">{ef}%</Badge>
        );
      },
    },
    {
      key: 'observaciones',
      header: 'Observaciones',
      render: (item) => (
        <span className="text-slate-500 font-medium text-xs max-w-[180px] truncate block">
          {item.observaciones || <span className="text-slate-300">—</span>}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
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
        title="Criba"
        subtitle="Producción diaria por turno — material producido y enviado al banco."
        action={
          puedeCrear ? (
            <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
              Registrar Turno
            </Button>
          ) : undefined
        }
      />

      {/* KPIs globales — fila 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={<Package size={22} />}
          value={`${stats.totalProducido} m³`}
          label="Total Produ."
          color="info"
        />
        <StatsCard
          icon={<ArrowUpRight size={22} />}
          value={`${stats.totalAlBanco} m³`}
          label="Al Banco"
          color="success"
        />
        <StatsCard
          icon={<Clock size={22} />}
          value={`${stats.totalHoras} h`}
          label="Horas Trab."
          color="info"
        />
        <StatsCard
          icon={<Gauge size={22} />}
          value={`${stats.eficiencia}%`}
          label="Eficiencia"
          color={colorEficiencia(stats.eficiencia)}
        />
      </div>

      {/* Resumen por material — fila 2 (con merma en m³ y %) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...MATERIALES].map((tipo) => {
          const m = stats.porMaterial.find((p) => p.tipo === tipo);
          const producido = m?.producido ?? 0;
          const alBanco = m?.alBanco ?? 0;
          const merma = m?.merma ?? 0;
          const ef = m?.ef ?? 0;
          const mermaPct = producido > 0 ? Math.round((merma / producido) * 100) : 0;
          return (
            <Card key={tipo} padding="sm" className="space-y-3">
              {/* Encabezado: material + eficiencia */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${materialDot[tipo]}`} />
                  <span className="font-black text-slate-800 text-sm truncate">{tipo}</span>
                </div>
                <Badge variant={colorEficiencia(ef)} size="sm">Efic. {ef}%</Badge>
              </div>

              {/* Tres métricas del material */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Producido</p>
                  <p className="text-base font-black text-slate-900">{producido}</p>
                  <p className="text-[9px] text-slate-400 font-bold">m³</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Al banco</p>
                  <p className="text-base font-black text-green-700">{alBanco}</p>
                  <p className="text-[9px] text-slate-400 font-bold">m³</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Merma</p>
                  <p className={`text-base font-black ${mermaPct >= 30 ? 'text-red-600' : mermaPct >= 10 ? 'text-yellow-600' : 'text-slate-900'}`}>
                    {merma}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold">m³</p>
                </div>
              </div>

              {/* Merma explícita en m³ y % */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Merma del material
                </span>
                <span className={`text-xs font-black ${mermaPct >= 30 ? 'text-red-600' : mermaPct >= 10 ? 'text-yellow-600' : 'text-slate-700'}`}>
                  {merma} m³ · {mermaPct}%
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar por operador, material u observación..."
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
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          )}
          <DataTable
            columns={columns}
            data={registros}
            loading={initialLoading}
            keyExtractor={(item) => item.id}
            emptyText="Sin registros para los filtros seleccionados."
            maxBodyHeight="520px"
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
        title="Registrar Turno de Criba"
        subtitle="Captura la producción del turno: material producido y enviado al banco."
        submitLabel="Registrar Turno"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Fecha" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </ModalField>

          <ModalField label="Turno" required>
            <select
              className={modalSelectClass}
              value={form.turno}
              onChange={(e) => setForm({ ...form, turno: e.target.value as TurnoCribaApi })}
            >
              {TURNOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Operador" required className="sm:col-span-2">
            <select
              className={modalSelectClass}
              value={form.operadorId}
              onChange={(e) => setForm({ ...form, operadorId: e.target.value })}
            >
              <option value="">Seleccionar operador...</option>
              {catalogos.trabajadores.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Material" required>
            <select
              className={modalSelectClass}
              value={form.tipoMaterial}
              onChange={(e) => setForm({ ...form, tipoMaterial: e.target.value })}
            >
              {MATERIALES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Horas trabajadas" required hint="Duración del turno en horas.">
            <input
              type="number"
              min="0"
              step="0.5"
              className={modalInputClass}
              placeholder="8"
              value={form.horasTrabajadas}
              onChange={(e) => setForm({ ...form, horasTrabajadas: e.target.value })}
            />
          </ModalField>

          <ModalField label="Material producido (m³)" required>
            <input
              type="number"
              min="0"
              className={modalInputClass}
              placeholder="320"
              value={form.materialProducido}
              onChange={(e) => setForm({ ...form, materialProducido: e.target.value })}
            />
          </ModalField>

          <ModalField label="Material al banco (m³)" required hint="No puede exceder lo producido.">
            <input
              type="number"
              min="0"
              className={modalInputClass}
              placeholder="290"
              value={form.materialAlBanco}
              onChange={(e) => setForm({ ...form, materialAlBanco: e.target.value })}
            />
          </ModalField>

          <ModalField label="Observaciones" className="sm:col-span-2">
            <textarea
              className={modalTextareaClass}
              rows={3}
              placeholder="Notas del turno (opcional)..."
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Registro"
        subtitle={selectedItem ? `${formatFechaSolo(selectedItem.fecha)} · ${selectedItem.turno}` : undefined}
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Fecha" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </ModalField>

          <ModalField label="Turno" required>
            <select
              className={modalSelectClass}
              value={form.turno}
              onChange={(e) => setForm({ ...form, turno: e.target.value as TurnoCribaApi })}
            >
              {TURNOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Operador" required className="sm:col-span-2">
            <select
              className={modalSelectClass}
              value={form.operadorId}
              onChange={(e) => setForm({ ...form, operadorId: e.target.value })}
            >
              <option value="">Seleccionar operador...</option>
              {catalogos.trabajadores.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Material" required>
            <select
              className={modalSelectClass}
              value={form.tipoMaterial}
              onChange={(e) => setForm({ ...form, tipoMaterial: e.target.value })}
            >
              {MATERIALES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Horas trabajadas" required>
            <input
              type="number"
              min="0"
              step="0.5"
              className={modalInputClass}
              value={form.horasTrabajadas}
              onChange={(e) => setForm({ ...form, horasTrabajadas: e.target.value })}
            />
          </ModalField>

          <ModalField label="Material producido (m³)" required>
            <input
              type="number"
              min="0"
              className={modalInputClass}
              value={form.materialProducido}
              onChange={(e) => setForm({ ...form, materialProducido: e.target.value })}
            />
          </ModalField>

          <ModalField label="Material al banco (m³)" required hint="No puede exceder lo producido.">
            <input
              type="number"
              min="0"
              className={modalInputClass}
              value={form.materialAlBanco}
              onChange={(e) => setForm({ ...form, materialAlBanco: e.target.value })}
            />
          </ModalField>

          <ModalField label="Observaciones" className="sm:col-span-2">
            <textarea
              className={modalTextareaClass}
              rows={3}
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Registro"
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
              ¿Estás seguro de eliminar este registro?
            </p>
            <p className="font-black text-slate-900 text-lg mb-2">
              {formatFechaSolo(selectedItem.fecha)} · {selectedItem.turno}
            </p>
            <p className="text-xs text-slate-500">
              {selectedItem.operador || 'Sin operador'} · {selectedItem.tipoMaterial}
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}
