"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus, HardHat, CheckCircle2, FolderKanban,
  Pencil, Trash2, SlidersHorizontal, X, AlertCircle, Eye, Wallet,
} from 'lucide-react';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Tooltip } from '@/components/ui/Tooltip';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { FormModal, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import ProjectDetailsModal from '@/components/projects/ProjectDetailsModal';
import { formatDate } from '@/lib/formatters';
import {
  proyectosApi,
  type ProyectoDTO,
  type ProyectoStats,
  type ProyectoCatalogos,
  type ProyectoCreateInput,
} from '@/lib/api';
import { RefreshOverlay } from '@/components/ui/RefreshOverlay';
import { mensajeErrorApi } from '@/lib/api';

// ── Constantes ──
const PAGE_SIZE = 10;

const ESTADOS: { value: NonNullable<ProyectoCreateInput['estado']>; label: string }[] = [
  { value: 'EN_PROCESO', label: 'En Proceso' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'PAUSADO', label: 'Pausado' },
];

const estadoVariant: Record<ProyectoDTO['estado'], 'primary' | 'success' | 'warning'> = {
  'En Proceso': 'primary',
  'Finalizado': 'success',
  'Pausado': 'warning',
};

const emptyForm = {
  nombre: '',
  clienteId: '',
  presupuesto: '',
  fechaInicio: '',
  fechaFin: '',
  estado: 'EN_PROCESO' as NonNullable<ProyectoCreateInput['estado']>,
  progreso: '0',
  calle: '',
  colonia: '',
  ciudad: '',
  estadoUbicacion: '',
  codigoPostal: '',
};

const emptyFinanzasForm = {
  ingresoCobrado: '',
  gastado: '',
};

/** "30000" → "30,000" mientras se escribe (máx. 2 decimales). */
function formatearMiles(valor: string): string {
  const limpio = valor.replace(/,/g, '').replace(/[^\d.]/g, '');
  const [entero, ...decimales] = limpio.split('.');
  const conComas = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimales.length > 0 ? `${conComas}.${decimales.join('').slice(0, 2)}` : conComas;
}

/** "30,000.50" → 30000.5 */
function parsearMiles(valor: string): number {
  return parseFloat(valor.replace(/,/g, ''));
}

function estadoToValue(label: ProyectoDTO['estado']): NonNullable<ProyectoCreateInput['estado']> {
  const map: Record<ProyectoDTO['estado'], NonNullable<ProyectoCreateInput['estado']>> = {
    'En Proceso': 'EN_PROCESO',
    'Finalizado': 'FINALIZADO',
    'Pausado': 'PAUSADO',
  };
  return map[label];
}

export default function ProyectosPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === '/proyectos');
  const puedeVer = vista?.puedeVer ?? false;
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Estado de datos ──
  const [registros, setRegistros] = useState<ProyectoDTO[]>([]);
  const [stats, setStats] = useState<ProyectoStats>({ total: 0, enProceso: 0, finalizados: 0, presupuestoTotal: 0 });
  const [catalogos, setCatalogos] = useState<ProyectoCatalogos>({ clientes: [] });
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
  const [finanzasOpen, setFinanzasOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProyectoDTO | null>(null);
  const [viewItem, setViewItem] = useState<ProyectoDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [finanzasForm, setFinanzasForm] = useState(emptyFinanzasForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Cargar catálogos (una sola vez) ──
  useEffect(() => {
    proyectosApi.catalogos().then((res) => {
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
      const res = await proyectosApi.listar({
        search: searchVal || undefined,
        estado: (filters?.estado as NonNullable<ProyectoCreateInput['estado']>) || undefined,
        clienteId: filters?.clienteId || undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setRegistros(res.data.items);
        setPagination(res.data.pagination);
      } else {
        showToast('Error al cargar proyectos.', 'error');
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
    const res = await proyectosApi.stats();
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
    const label = ESTADOS.find((e) => e.value === filterValues.estado)?.label ?? filterValues.estado;
    activeFilters.push({ key: 'estado', label: 'Estado', value: label });
  }
  if (filterValues.clienteId) {
    const cliente = catalogos.clientes.find((c) => c.id === filterValues.clienteId);
    activeFilters.push({ key: 'clienteId', label: 'Cliente', value: cliente?.nombre ?? filterValues.clienteId });
  }

  // ── Filtros para SearchBar ──
  const filterFields: FilterField[] = [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: ESTADOS.map((e) => ({ value: e.value, label: e.label })),
      placeholder: 'Todos',
    },
    {
      key: 'clienteId',
      label: 'Cliente',
      type: 'select',
      options: catalogos.clientes.map((c) => ({ value: c.id, label: c.nombre })),
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

  // ── Handlers de modales ──
  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((item: ProyectoDTO) => {
    setSelectedItem(item);
    setForm({
      nombre: item.nombre,
      clienteId: item.clienteId,
      presupuesto: formatearMiles(String(item.presupuesto)),
      fechaInicio: item.fechaInicio,
      fechaFin: item.fechaFin,
      estado: estadoToValue(item.estado),
      progreso: String(item.progreso),
      calle: item.calle ?? '',
      colonia: item.colonia ?? '',
      ciudad: item.ciudad ?? '',
      estadoUbicacion: item.estadoUbicacion ?? '',
      codigoPostal: item.codigoPostal ?? '',
    });
    setEditOpen(true);
  }, []);

  const openFinanzas = useCallback((item: ProyectoDTO) => {
    setSelectedItem(item);
    setFinanzasForm({
      ingresoCobrado: String(item.ingresoCobrado),
      gastado: String(item.gastado),
    });
    setFinanzasOpen(true);
  }, []);

  const openDelete = useCallback((item: ProyectoDTO) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  const openView = useCallback((item: ProyectoDTO) => {
    setViewItem(item);
  }, []);

  // ── Validación ──
  const validateForm = useCallback(() => {
    if (!form.nombre.trim()) {
      showToast('El nombre del proyecto es obligatorio.', 'error');
      return false;
    }
    if (!form.clienteId) {
      showToast('Selecciona un cliente.', 'error');
      return false;
    }
    const ppto = parsearMiles(form.presupuesto);
    if (!form.presupuesto || isNaN(ppto) || ppto <= 0) {
      showToast('Ingresa un presupuesto válido mayor a cero.', 'error');
      return false;
    }
    if (!form.fechaInicio || !form.fechaFin) {
      showToast('Las fechas de inicio y fin son obligatorias.', 'error');
      return false;
    }
    if (form.fechaFin < form.fechaInicio) {
      showToast('La fecha de fin no puede ser anterior a la de inicio.', 'error');
      return false;
    }
    const progreso = parseFloat(form.progreso);
    if (isNaN(progreso) || progreso < 0 || progreso > 100) {
      showToast('El progreso debe estar entre 0 y 100.', 'error');
      return false;
    }
    // Dirección exacta obligatoria
    const faltantes: string[] = [];
    if (!form.calle.trim()) faltantes.push('Calle y número');
    if (!form.colonia.trim()) faltantes.push('Colonia');
    if (!form.ciudad.trim()) faltantes.push('Ciudad');
    if (!form.estadoUbicacion.trim()) faltantes.push('Estado');
    if (!/^\d{5}$/.test(form.codigoPostal.trim())) faltantes.push('Código postal (5 dígitos)');
    if (faltantes.length) {
      showToast('Completa la ubicación: ' + faltantes.join(', ') + '.', 'error');
      return false;
    }
    return true;
  }, [form, showToast]);

  // ── CRUD via API ──
  const buildPayload = useCallback(
    () => ({
      nombre: form.nombre.trim(),
      clienteId: form.clienteId,
      presupuesto: parsearMiles(form.presupuesto),
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
      estado: form.estado,
      progreso: parseFloat(form.progreso),
      calle: form.calle.trim(),
      colonia: form.colonia.trim(),
      ciudad: form.ciudad.trim(),
      estadoUbicacion: form.estadoUbicacion.trim(),
      codigoPostal: form.codigoPostal.trim(),
    }),
    [form],
  );

  const parseOptionalMoney = (value: string): number | undefined => {
    if (value === '') return undefined;
    const n = parseFloat(value);
    return isNaN(n) ? undefined : n;
  };

  const validateFinanzas = useCallback(() => {
    if (finanzasForm.ingresoCobrado === '' && finanzasForm.gastado === '') {
      showToast('Captura al menos un valor: ingreso cobrado o gasto acumulado.', 'error');
      return false;
    }
    for (const [campo, label] of [
      ['ingresoCobrado', 'Ingreso cobrado'],
      ['gastado', 'Gasto acumulado'],
    ] as const) {
      const v = finanzasForm[campo];
      if (v !== '' && (isNaN(parseFloat(v)) || parseFloat(v) < 0)) {
        showToast(`${label} debe ser un número mayor o igual a cero.`, 'error');
        return false;
      }
    }
    return true;
  }, [finanzasForm, showToast]);

  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await proyectosApi.crear(buildPayload());
      if (res.success) {
        showToast(`Proyecto "${form.nombre}" creado exitosamente.`, 'success');
        setCreateOpen(false);
        setForm(emptyForm);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al crear el proyecto.'), 'error');
      }
    } catch {
      showToast('Error de conexión al crear el proyecto.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, buildPayload, form.nombre, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem || !validateForm()) return;
    setSubmitting(true);
    try {
      const res = await proyectosApi.actualizar(selectedItem.id, buildPayload());
      if (res.success) {
        showToast(`Proyecto "${form.nombre}" actualizado exitosamente.`, 'success');
        setEditOpen(false);
        setSelectedItem(null);
        setForm(emptyForm);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al actualizar el proyecto.'), 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar el proyecto.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, validateForm, buildPayload, form, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleFinanzas = useCallback(async () => {
    if (!selectedItem || !validateFinanzas()) return;
    setSubmitting(true);
    try {
      const res = await proyectosApi.actualizarFinanzas(selectedItem.id, {
        ingresoCobrado: parseOptionalMoney(finanzasForm.ingresoCobrado),
        gastado: parseOptionalMoney(finanzasForm.gastado),
      });
      if (res.success) {
        showToast(`Finanzas de "${selectedItem.nombre}" actualizadas exitosamente.`, 'success');
        setFinanzasOpen(false);
        setSelectedItem(null);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al actualizar finanzas.'), 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar finanzas.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, validateFinanzas, finanzasForm, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await proyectosApi.eliminar(selectedItem.id);
      if (res.success) {
        showToast(`Proyecto "${selectedItem.nombre}" eliminado exitosamente.`, 'success');
        setDeleteOpen(false);
        setSelectedItem(null);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al eliminar el proyecto.'), 'error');
      }
    } catch {
      showToast('Error de conexión al eliminar el proyecto.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  // ── Columnas de DataTable ──
  const columns: Column<ProyectoDTO>[] = [
    {
      key: 'nombre',
      header: 'Proyecto / Cliente',
      render: (item) => (
        <div>
          <div className="font-black text-ui-900">{item.nombre}</div>
          <div className="text-[10px] font-bold text-ui-400 uppercase tracking-widest">{item.cliente}</div>
        </div>
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
      key: 'ubicacion',
      header: 'Ubicación',
      minWidth: '200px',
      render: (item) => {
        if (!item.ciudad && !item.calle) {
          return <span className="text-ui-300">—</span>;
        }
        const direccionCompleta = [
          item.calle,
          item.colonia,
          `${item.ciudad}, ${item.estadoUbicacion}`.replace(/ , |, $/, ', '),
          item.codigoPostal ? `CP ${item.codigoPostal}` : null,
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <Tooltip placement="top" content={direccionCompleta} maxWidth={340}>
            <div>
              <span className="block font-semibold text-ui-600">
                {item.ciudad}
                {item.codigoPostal ? `, CP ${item.codigoPostal}` : ''}
              </span>
              <span className="block text-[10px] font-bold text-ui-400 truncate">
                {item.calle}
              </span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      key: 'presupuesto',
      header: 'Presupuesto',
      align: 'right',
      render: (item) => (
        <span className="font-black text-ui-900">{formatCurrency(item.presupuesto)}</span>
      ),
    },
    {
      key: 'fechaInicio',
      header: 'Inicio',
      render: (item) => (
        <span className="whitespace-nowrap font-semibold text-ui-500">{formatDate(item.fechaInicio)}</span>
      ),
    },
    {
      key: 'fechaFin',
      header: 'Entrega',
      render: (item) => (
        <span className="whitespace-nowrap font-bold text-ui-600">{formatDate(item.fechaFin)}</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {puedeVer && (
            <Button
              variant="info"
              size="sm"
              icon={<Eye className="w-3.5 h-3.5" />}
              onClick={(e) => { e.stopPropagation(); openView(item); }}
            >
              Ver
            </Button>
          )}
          {puedeEditar && (
            <Button
              variant="success"
              size="sm"
              icon={<Wallet className="w-3.5 h-3.5" />}
              onClick={(e) => { e.stopPropagation(); openFinanzas(item); }}
            >
              Finanzas
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
        title="Gestión de Proyectos"
        subtitle="Control físico y financiero de obras activas."
        action={
          puedeCrear ? (
            <Button
          skeleton={initialLoading} variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
              Nuevo Proyecto
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          icon={<FolderKanban className="w-6 h-6" />}
          value={stats.total}
          label="Total Proyectos"
          color="info"
        loading={initialLoading}
        />
        <StatsCard
          icon={<HardHat className="w-6 h-6" />}
          value={stats.enProceso}
          label="En Proceso"
          color={stats.enProceso > 0 ? 'primary' : 'neutral'}
        loading={initialLoading}
        />
        <StatsCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          value={stats.finalizados}
          label="Finalizados"
          color={stats.finalizados > 0 ? 'success' : 'neutral'}
        loading={initialLoading}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar por proyecto o cliente..."
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

      <div className="space-y-3">
        <div className="relative">
          <RefreshOverlay show={refreshing && !initialLoading} />
          <DataTable
            columns={columns}
            data={registros}
            loading={initialLoading}
            keyExtractor={(item) => item.id}
            emptyText="No se encontraron proyectos que coincidan con la búsqueda."
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
        title="Nuevo Proyecto"
        subtitle="Registra una nueva obra para control físico y financiero."
        submitLabel="Crear Proyecto"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Nombre del proyecto" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Fraccionamiento Valle Norte"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </ModalField>

          <ModalField label="Cliente" required className="sm:col-span-2">
            <select
              className={modalSelectClass}
              value={form.clienteId}
              onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
            >
              <option value="">Seleccionar cliente...</option>
              {catalogos.clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Presupuesto (MXN)" required className="sm:col-span-2">
            <input
              type="text"
              inputMode="decimal"
              className={modalInputClass}
              placeholder="30,000"
              value={form.presupuesto}
              onChange={(e) => setForm({ ...form, presupuesto: formatearMiles(e.target.value) })}
            />
          </ModalField>

          <ModalField label="Fecha de inicio" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fechaInicio}
              onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            />
          </ModalField>

          <ModalField label="Fecha estimada de entrega" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fechaFin}
              onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
            />
          </ModalField>

          {/* ── Ubicación exacta ── */}
          <div className="sm:col-span-2">
            <p className="text-[10px] font-black text-ui-500 uppercase tracking-widest mb-3">
              Ubicación de la obra
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModalField label="Calle y número" required className="sm:col-span-2">
                <input
                  type="text"
                  className={modalInputClass}
                  placeholder="Ej: Av. Insurgentes 123"
                  value={form.calle}
                  onChange={(e) => setForm({ ...form, calle: e.target.value })}
                />
              </ModalField>

              <ModalField label="Colonia" required>
                <input
                  type="text"
                  className={modalInputClass}
                  placeholder="Ej: Col. Centro"
                  value={form.colonia}
                  onChange={(e) => setForm({ ...form, colonia: e.target.value })}
                />
              </ModalField>

              <ModalField label="Ciudad" required>
                <input
                  type="text"
                  className={modalInputClass}
                  placeholder="Ej: Návojoa"
                  value={form.ciudad}
                  onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                />
              </ModalField>

              <ModalField label="Estado" required>
                <input
                  type="text"
                  className={modalInputClass}
                  placeholder="Ej: Sonora"
                  value={form.estadoUbicacion}
                  onChange={(e) => setForm({ ...form, estadoUbicacion: e.target.value })}
                />
              </ModalField>

              <ModalField label="Código postal" required>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  className={modalInputClass}
                  placeholder="5 dígitos"
                  value={form.codigoPostal}
                  onChange={(e) =>
                    setForm({ ...form, codigoPostal: e.target.value.replace(/\D/g, '') })
                  }
                />
              </ModalField>
            </div>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Proyecto"
        subtitle={selectedItem ? `Editando: ${selectedItem.nombre}` : undefined}
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Nombre del proyecto" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </ModalField>

          <ModalField label="Cliente" required className="sm:col-span-2">
            <select
              className={modalSelectClass}
              value={form.clienteId}
              onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
            >
              <option value="">Seleccionar cliente...</option>
              {catalogos.clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Presupuesto (MXN)" required>
            <input
              type="text"
              inputMode="decimal"
              className={modalInputClass}
              placeholder="30,000"
              value={form.presupuesto}
              onChange={(e) => setForm({ ...form, presupuesto: formatearMiles(e.target.value) })}
            />
          </ModalField>

          <ModalField label="Estado">
            <select
              className={modalSelectClass}
              value={form.estado}
              onChange={(e) =>
                setForm({ ...form, estado: e.target.value as NonNullable<ProyectoCreateInput['estado']> })
              }
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Progreso (%)" hint="Avance físico de la obra.">
            <input
              type="number"
              min="0"
              max="100"
              className={modalInputClass}
              value={form.progreso}
              onChange={(e) => setForm({ ...form, progreso: e.target.value })}
            />
          </ModalField>

          <ModalField label="Fecha de inicio" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fechaInicio}
              onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            />
          </ModalField>

          <ModalField label="Fecha estimada de entrega" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fechaFin}
              onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
            />
          </ModalField>

          {/* ── Ubicación exacta ── */}
          <div className="sm:col-span-2">
            <p className="text-[10px] font-black text-ui-500 uppercase tracking-widest mb-3">
              Ubicación de la obra
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModalField label="Calle y número" required className="sm:col-span-2">
                <input
                  type="text"
                  className={modalInputClass}
                  placeholder="Ej: Av. Insurgentes 123"
                  value={form.calle}
                  onChange={(e) => setForm({ ...form, calle: e.target.value })}
                />
              </ModalField>

              <ModalField label="Colonia" required>
                <input
                  type="text"
                  className={modalInputClass}
                  placeholder="Ej: Col. Centro"
                  value={form.colonia}
                  onChange={(e) => setForm({ ...form, colonia: e.target.value })}
                />
              </ModalField>

              <ModalField label="Ciudad" required>
                <input
                  type="text"
                  className={modalInputClass}
                  placeholder="Ej: Návojoa"
                  value={form.ciudad}
                  onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                />
              </ModalField>

              <ModalField label="Estado" required>
                <input
                  type="text"
                  className={modalInputClass}
                  placeholder="Ej: Sonora"
                  value={form.estadoUbicacion}
                  onChange={(e) => setForm({ ...form, estadoUbicacion: e.target.value })}
                />
              </ModalField>

              <ModalField label="Código postal" required>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  className={modalInputClass}
                  placeholder="5 dígitos"
                  value={form.codigoPostal}
                  onChange={(e) =>
                    setForm({ ...form, codigoPostal: e.target.value.replace(/\D/g, '') })
                  }
                />
              </ModalField>
            </div>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Proyecto"
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
            <p className="text-sm text-ui-700 mb-1">
              ¿Estás seguro de eliminar este proyecto?
            </p>
            <p className="font-black text-ui-900 text-lg mb-2">{selectedItem.nombre}</p>
            <p className="text-xs text-ui-500">
              {selectedItem.cliente} · {formatCurrency(selectedItem.presupuesto)}
            </p>
          </div>
        )}
      </FormModal>

      <FormModal
        open={finanzasOpen}
        onClose={() => setFinanzasOpen(false)}
        onCancel={() => setFinanzasOpen(false)}
        title="Actualizar Finanzas"
        subtitle={selectedItem ? `Registro económico de: ${selectedItem.nombre}` : undefined}
        submitLabel="Guardar Finanzas"
        cancelLabel="Cancelar"
        onSubmit={handleFinanzas}
        isSubmitting={submitting}
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="bg-ui-50 border border-ui-200 rounded-xl p-3 grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-[10px] font-black text-ui-400 uppercase tracking-widest">Presupuesto</p>
                <p className="font-black text-ui-900 text-sm">{formatCurrency(selectedItem.presupuesto)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-ui-400 uppercase tracking-widest">Utilidad actual</p>
                <p className={`font-black text-sm ${(selectedItem.ingresoCobrado - selectedItem.gastado) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formatCurrency(selectedItem.ingresoCobrado - selectedItem.gastado)}
                </p>
              </div>
            </div>

            <ModalField label="Ingreso cobrado (MXN)" hint="Monto facturado y cobrado al cliente hasta la fecha.">
              <input
                type="number"
                min="0"
                step="0.01"
                className={modalInputClass}
                placeholder="Ej: 350000"
                value={finanzasForm.ingresoCobrado}
                onChange={(e) => setFinanzasForm({ ...finanzasForm, ingresoCobrado: e.target.value })}
              />
            </ModalField>

            <ModalField label="Gasto acumulado (MXN)" hint="Costo real acumulado de ejecutar la obra hasta la fecha.">
              <input
                type="number"
                min="0"
                step="0.01"
                className={modalInputClass}
                placeholder="Ej: 280000"
                value={finanzasForm.gastado}
                onChange={(e) => setFinanzasForm({ ...finanzasForm, gastado: e.target.value })}
              />
            </ModalField>

            <p className="text-[11px] text-ui-400 font-medium text-center">
              Cada cambio queda registrado en la bitácora de auditoría con el valor anterior y nuevo.
            </p>
          </div>
        )}
      </FormModal>

      {/* Modal de detalle (curva S, CPI/SPI, rentabilidad, personal y flota) */}
      {viewItem && (
        <ProjectDetailsModal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          proyecto={{
            id: viewItem.id,
            nombre: viewItem.nombre,
            cliente: viewItem.cliente,
            presupuesto: viewItem.presupuesto,
            gastado: viewItem.gastado,
            progreso: viewItem.progreso,
            estado: viewItem.estado,
            ubicacion: [
              viewItem.calle,
              viewItem.colonia,
              [viewItem.ciudad, viewItem.estadoUbicacion].filter(Boolean).join(', '),
              viewItem.codigoPostal ? `CP ${viewItem.codigoPostal}` : '',
            ].filter(Boolean).join(' · '),
            fechaInicio: viewItem.fechaInicio,
            fechaFin: viewItem.fechaFin,
            historicoProgreso: [],
            ingresoCobrado: viewItem.ingresoCobrado,
            gastoNomina: 0,
            gastoCombustible: 0,
            gastoMantenimiento: 0,
            gastoMateriales: 0,
            utilidadReal: viewItem.ingresoCobrado - viewItem.gastado,
            margenUtilidadPorcentaje:
              viewItem.ingresoCobrado > 0
                ? Number((((viewItem.ingresoCobrado - viewItem.gastado) / viewItem.ingresoCobrado) * 100).toFixed(1))
                : 0,
          }}
        />
      )}
    </div>
  );
}
