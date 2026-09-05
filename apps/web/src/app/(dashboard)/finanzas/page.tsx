"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Wallet, ArrowUpCircle, ArrowDownCircle,
  Pencil, Trash2, SlidersHorizontal, X, AlertCircle, Loader2, Download,
} from 'lucide-react';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import { formatFechaSolo } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { FormModal, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import {
  finanzasApi,
  FinanzasCategorias,
  type TransaccionDTO,
  type TipoTransaccionApi,
} from '@/lib/api';

// ── Constantes ──
const PAGE_SIZE = 10;

// ── Form defaults ──
const emptyForm = {
  tipo: 'INGRESO' as TipoTransaccionApi,
  categoria: '',
  otraCategoria: '',
  monto: '',
  fecha: '',
  descripcion: '',
};

export default function FinanzasPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Estado de datos ──
  const [transacciones, setTransacciones] = useState<TransaccionDTO[]>([]);
  const [stats, setStats] = useState({ balance: 0, totalIngresos: 0, totalEgresos: 0, cantidad: 0 });
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
  const [selectedItem, setSelectedItem] = useState<TransaccionDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find(v => v.ruta === '/finanzas');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Cargar datos ──
  const fetchData = useCallback(async (page = 1, searchVal?: string, filters?: Record<string, string>) => {
    if (!hasLoaded.current) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await finanzasApi.listar({
        search: searchVal || undefined,
        tipo: filters?.tipo as TipoTransaccionApi | undefined,
        categoria: filters?.categoria || undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setTransacciones(res.data.items);
        setPagination(res.data.pagination);
      } else {
        showToast('Error al cargar las transacciones.', 'error');
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
    const res = await finanzasApi.stats();
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
  if (filterValues.tipo) {
    activeFilters.push({
      key: 'tipo',
      label: 'Tipo',
      value: filterValues.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso',
    });
  }
  if (filterValues.categoria) {
    activeFilters.push({ key: 'categoria', label: 'Categoría', value: filterValues.categoria });
  }

  // ── Filtros para SearchBar ──
  const filterFields: FilterField[] = [
    {
      key: 'tipo',
      label: 'Tipo',
      type: 'select',
      options: [
        { value: 'INGRESO', label: 'Ingreso' },
        { value: 'EGRESO', label: 'Egreso' },
      ],
      placeholder: 'Todos',
    },
    {
      key: 'categoria',
      label: 'Categoría',
      type: 'select',
      options: FinanzasCategorias.map(c => ({ value: c.value, label: c.label })),
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
    setForm({ ...emptyForm, fecha: new Date().toISOString().split('T')[0] });
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((item: TransaccionDTO) => {
    setSelectedItem(item);
    setForm({
      tipo: item.tipo,
      categoria: item.categoria,
      otraCategoria: item.otraCategoria ?? '',
      monto: String(item.monto),
      fecha: item.fecha.split('T')[0],
      descripcion: item.descripcion,
    });
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((item: TransaccionDTO) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  // ── Validación compartida ──
  const validateForm = useCallback((): string | null => {
    if (!form.categoria) return 'La categoría es obligatoria.';
    if (form.categoria === 'Otros' && !form.otraCategoria.trim())
      return 'Escribe el nombre de la categoría personalizada.';
    if (!form.monto || Number(form.monto) <= 0) return 'El monto debe ser mayor a 0.';
    if (!form.descripcion) return 'La descripción es obligatoria.';
    if (!form.fecha) return 'La fecha es obligatoria.';
    return null;
  }, [form]);

  // ── CRUD Handlers ──
  const handleCreate = useCallback(async () => {
    const invalid = validateForm();
    if (invalid) {
      showToast(invalid, 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await finanzasApi.crear({
        tipo: form.tipo,
        categoria: form.categoria,
        monto: Number(form.monto),
        fecha: form.fecha,
        descripcion: form.descripcion,
        otraCategoria: form.categoria === 'Otros' ? form.otraCategoria.trim() : undefined,
      });
      if (res.success) {
        showToast('Transacción creada exitosamente.', 'success');
        setCreateOpen(false);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al crear la transacción.', 'error');
      }
    } catch {
      showToast('Error de conexión al crear la transacción.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [form, validateForm, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem) return;
    const invalid = validateForm();
    if (invalid) {
      showToast(invalid, 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await finanzasApi.actualizar(selectedItem.id, {
        tipo: form.tipo,
        categoria: form.categoria,
        monto: Number(form.monto),
        fecha: form.fecha,
        descripcion: form.descripcion,
        otraCategoria: form.categoria === 'Otros' ? form.otraCategoria.trim() : undefined,
      });
      if (res.success) {
        showToast('Transacción actualizada exitosamente.', 'success');
        setEditOpen(false);
        setSelectedItem(null);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al actualizar la transacción.', 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar la transacción.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, form, validateForm, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await finanzasApi.eliminar(selectedItem.id);
      if (res.success) {
        showToast('Transacción eliminada exitosamente.', 'success');
        setDeleteOpen(false);
        setSelectedItem(null);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al eliminar la transacción.', 'error');
      }
    } catch {
      showToast('Error de conexión al eliminar la transacción.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  // ── Columnas de DataTable ──
  const columns: Column<TransaccionDTO>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      render: (item) => (
        <span className="font-semibold text-slate-600 uppercase text-xs tracking-wide">
          {formatFechaSolo(item.fecha)}
        </span>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción / Categoría',
      className: 'whitespace-pre-line min-w-[220px] max-w-[360px]',
      render: (item) => (
        <div>
          <div className="font-black text-slate-900">{item.descripcion}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.catEfectiva ?? item.categoria}</div>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (item) => (
        <Badge variant={item.tipo === 'INGRESO' ? 'success' : 'error'} size="sm">
          {item.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}
        </Badge>
      ),
    },
    {
      key: 'monto',
      header: 'Monto',
      align: 'right',
      render: (item) => (
        <span className={`font-black ${item.tipo === 'INGRESO' ? 'text-green-600' : 'text-slate-900'}`}>
          {item.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(item.monto)}
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
        title="Control Financiero"
        subtitle="Flujo de caja, ingresos por obras y gastos operativos."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Download className="w-5 h-5" />} onClick={() => {}}>
              Exportar
            </Button>
            {puedeCrear && (
              <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
                Nueva Transacción
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          icon={<Wallet className="w-6 h-6" />}
          value={formatCurrency(stats.balance)}
          label="Balance Total"
          color={stats.balance >= 0 ? 'success' : 'error'}
        />
        <StatsCard
          icon={<ArrowUpCircle className="w-6 h-6" />}
          value={formatCurrency(stats.totalIngresos)}
          label="Ingresos"
          color="success"
        />
        <StatsCard
          icon={<ArrowDownCircle className="w-6 h-6" />}
          value={formatCurrency(stats.totalEgresos)}
          label="Egresos"
          color="error"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar descripción, categoría o código..."
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
            data={transacciones}
            loading={initialLoading}
            keyExtractor={(item) => item.id}
            emptyText="No se encontraron transacciones que coincidan con la búsqueda."
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
        title="Nueva Transacción"
        subtitle="Registrar un movimiento financiero (ingreso o egreso)."
        submitLabel="Crear Transacción"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Tipo" required>
            <select
              className={modalSelectClass}
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoTransaccionApi })}
            >
              <option value="INGRESO">Ingreso</option>
              <option value="EGRESO">Egreso</option>
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

          <ModalField label="Categoría" required className="sm:col-span-2">
            <select
              className={modalSelectClass}
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {FinanzasCategorias.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {form.categoria === 'Otros' && (
              <input
                type="text"
                className={cn(modalInputClass, 'mt-3')}
                placeholder="Escribe la categoría personalizada"
                value={form.otraCategoria}
                onChange={(e) => setForm({ ...form, otraCategoria: e.target.value })}
              />
            )}
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

          <ModalField label="Descripción" required>
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Anticipo obra Vista al Mar"
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
        title="Editar Transacción"
        subtitle={selectedItem ? `Editando: ${selectedItem.descripcion}` : undefined}
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Tipo" required>
            <select
              className={modalSelectClass}
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoTransaccionApi })}
            >
              <option value="INGRESO">Ingreso</option>
              <option value="EGRESO">Egreso</option>
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

          <ModalField label="Categoría" required className="sm:col-span-2">
            <select
              className={modalSelectClass}
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {FinanzasCategorias.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {form.categoria === 'Otros' && (
              <input
                type="text"
                className={cn(modalInputClass, 'mt-3')}
                placeholder="Escribe la categoría personalizada"
                value={form.otraCategoria}
                onChange={(e) => setForm({ ...form, otraCategoria: e.target.value })}
              />
            )}
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

          <ModalField label="Descripción" required>
            <input
              type="text"
              className={modalInputClass}
              placeholder="Descripción de la transacción"
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
        title="Eliminar Transacción"
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
              ¿Estás seguro de eliminar la transacción?
            </p>
            <p className="font-black text-slate-900 text-lg mb-2">
              {selectedItem.descripcion}
            </p>
            <p className="text-xs text-slate-500">
              {selectedItem.categoria} — {formatCurrency(selectedItem.monto)}
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}
