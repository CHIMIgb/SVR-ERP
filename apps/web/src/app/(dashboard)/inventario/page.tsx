"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Package, AlertTriangle, TrendingDown, ShoppingCart,
  Pencil, Trash2, SlidersHorizontal, X, AlertCircle, Loader2, Eye,
} from 'lucide-react';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
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
  inventarioApi,
  type ArticuloInventarioDTO,
  type InventarioCatalogos,
} from '@/lib/api';

// ── Constantes ──
const PAGE_SIZE = 10;

// ── Form defaults ──
const emptyForm = {
  nombre: '',
  codigo: '',
  categoriaId: '',
  proveedorId: '',
  unidadId: '',
  stock: '',
  stockMinimo: '',
  precioUnitario: '',
};

const emptyOrderForm = {
  cantidad: '',
  motivo: '',
};

export default function InventarioPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Estado de datos ──
  const [articulos, setArticulos] = useState<ArticuloInventarioDTO[]>([]);
  const [stats, setStats] = useState({ totalArticulos: 0, stockBajo: 0, valorTotal: 0 });
  const [catalogos, setCatalogos] = useState<InventarioCatalogos>({
    categorias: [],
    proveedores: [],
    unidades: [],
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
  const [orderOpen, setOrderOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ArticuloInventarioDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [orderForm, setOrderForm] = useState(emptyOrderForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find(v => v.ruta === '/inventario');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // Artículos migrados del POS: tienen precios por medida de venta
  // (articulos_precio) que se gestionan por separado, su precio unitario
  // base no se edita desde aquí.
  const esMaterialDeVenta = selectedItem?.codigo?.startsWith('MAT-') ?? false;

  // ── Cargar catálogos (una sola vez) ──
  useEffect(() => {
    inventarioApi.catalogos().then((res) => {
      if (res.success && res.data) {
        setCatalogos(res.data);
      }
    });
  }, []);

  // ── Cargar datos ──
  const fetchData = useCallback(async (page = 1, searchVal?: string, filters?: Record<string, string>) => {
    // Primera carga: skeleton dentro del DataTable
    // Refetches: overlay sutil sobre datos existentes
    if (!hasLoaded.current) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await inventarioApi.listar({
        search: searchVal || undefined,
        categoriaId: filters?.categoriaId || undefined,
        proveedorId: filters?.proveedorId || undefined,
        stockEstado: filters?.stockEstado as 'bajo' | 'ok' | undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setArticulos(res.data.items);
        setPagination(res.data.pagination);
      } else {
        showToast('Error al cargar inventario.', 'error');
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
    const res = await inventarioApi.stats();
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
  if (filterValues.categoriaId) {
    const cat = catalogos.categorias.find(c => c.id === filterValues.categoriaId);
    activeFilters.push({ key: 'categoriaId', label: 'Categoría', value: cat?.nombre ?? filterValues.categoriaId });
  }
  if (filterValues.proveedorId) {
    const prov = catalogos.proveedores.find(p => p.id === filterValues.proveedorId);
    activeFilters.push({ key: 'proveedorId', label: 'Proveedor', value: prov?.nombre ?? filterValues.proveedorId });
  }
  if (filterValues.stockEstado) {
    activeFilters.push({ key: 'stockEstado', label: 'Estado', value: filterValues.stockEstado === 'bajo' ? 'Stock Bajo' : 'Stock OK' });
  }

  // ── Filtros para SearchBar ──
  const filterFields: FilterField[] = [
    {
      key: 'categoriaId',
      label: 'Categoría',
      type: 'select',
      options: catalogos.categorias.map(c => ({ value: c.id, label: c.nombre })),
      placeholder: 'Todas',
    },
    {
      key: 'proveedorId',
      label: 'Proveedor',
      type: 'select',
      options: catalogos.proveedores.map(p => ({ value: p.id, label: p.nombre })),
      placeholder: 'Todos',
    },
    {
      key: 'stockEstado',
      label: 'Estado Stock',
      type: 'select',
      options: [
        { value: 'bajo', label: 'Stock Bajo' },
        { value: 'ok', label: 'Stock OK' },
      ],
      placeholder: 'Todos',
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

  // ── Filtrar por stock bajo desde la alerta / tarjeta ──
  const handleFilterLowStock = useCallback(() => {
    const next = { ...filterValues, stockEstado: 'bajo' };
    setFilterValues(next);
    fetchData(1, search, next);
  }, [fetchData, search, filterValues]);

  // ── Handlers de modales ──
  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((item: ArticuloInventarioDTO) => {
    setSelectedItem(item);
    setForm({
      nombre: item.nombre,
      codigo: item.codigo ?? '',
      categoriaId: item.categoriaId,
      proveedorId: item.proveedorId,
      unidadId: item.unidadId,
      stock: String(item.stock),
      stockMinimo: String(item.stockMinimo),
      precioUnitario: String(item.precioUnitario),
    });
    setEditOpen(true);
  }, []);

  const openOrder = useCallback((item: ArticuloInventarioDTO) => {
    setSelectedItem(item);
    const sugerencia = Math.max(1, item.stockMinimo - item.stock + 10);
    setOrderForm({ cantidad: String(sugerencia), motivo: '' });
    setOrderOpen(true);
  }, []);

  const openDelete = useCallback((item: ArticuloInventarioDTO) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  // ── CRUD Handlers ──
  const handleCreate = useCallback(async () => {
    if (!form.nombre || !form.categoriaId || !form.proveedorId || !form.unidadId) {
      showToast('Nombre, categoría, proveedor y unidad son obligatorios.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await inventarioApi.crear({
        nombre: form.nombre,
        codigo: form.codigo || undefined,
        categoriaId: form.categoriaId,
        proveedorId: form.proveedorId,
        unidadId: form.unidadId,
        stock: Number(form.stock) || 0,
        stockMinimo: Number(form.stockMinimo) || 0,
        precioUnitario: Number(form.precioUnitario) || 0,
      });
      if (res.success) {
        showToast(`Artículo "${form.nombre}" creado exitosamente.`, 'success');
        setCreateOpen(false);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al crear artículo.', 'error');
      }
    } catch {
      showToast('Error de conexión al crear artículo.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [form, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem) return;
    if (!form.nombre || !form.categoriaId || !form.proveedorId || !form.unidadId) {
      showToast('Nombre, categoría, proveedor y unidad son obligatorios.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await inventarioApi.actualizar(selectedItem.id, {
        nombre: form.nombre,
        codigo: form.codigo || undefined,
        categoriaId: form.categoriaId,
        proveedorId: form.proveedorId,
        unidadId: form.unidadId,
        stock: Number(form.stock) || 0,
        stockMinimo: Number(form.stockMinimo) || 0,
        precioUnitario: Number(form.precioUnitario) || 0,
      });
      if (res.success) {
        showToast(`Artículo "${form.nombre}" actualizado exitosamente.`, 'success');
        setEditOpen(false);
        setSelectedItem(null);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al actualizar artículo.', 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar artículo.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, form, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleOrder = useCallback(async () => {
    if (!selectedItem || !orderForm.cantidad) {
      showToast('La cantidad a pedir es obligatoria.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await inventarioApi.movimiento({
        articuloId: selectedItem.id,
        tipo: 'ENTRADA',
        cantidad: Number(orderForm.cantidad),
        motivo: orderForm.motivo || `Orden de compra - ${selectedItem.nombre}`,
      });
      if (res.success) {
        showToast(`Entrada de ${orderForm.cantidad} unidades registrada para "${selectedItem.nombre}".`, 'success');
        setOrderOpen(false);
        setSelectedItem(null);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al registrar entrada.', 'error');
      }
    } catch {
      showToast('Error de conexión al registrar entrada.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, orderForm, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await inventarioApi.eliminar(selectedItem.id);
      if (res.success) {
        showToast(`Artículo "${selectedItem.nombre}" eliminado exitosamente.`, 'success');
        setDeleteOpen(false);
        setSelectedItem(null);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al eliminar artículo.', 'error');
      }
    } catch {
      showToast('Error de conexión al eliminar artículo.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  // ── Columnas de DataTable ──
  const columns: Column<ArticuloInventarioDTO>[] = [
    {
      key: 'nombre',
      header: 'Nombre / Categoría',
      render: (item) => (
        <div>
          <div className="font-black text-slate-900">{item.nombre}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.categoria}</div>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock Actual',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className={`font-black text-sm ${item.stock <= item.stockMinimo ? 'text-red-500' : 'text-slate-900'}`}>
            {item.stock} {item.unidad}
          </span>
          <span className="text-[10px] text-slate-400 font-bold">/ Min: {item.stockMinimo}</span>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (item) => (
        item.stock <= item.stockMinimo ? (
          <Badge variant="error" size="sm">Stock Bajo</Badge>
        ) : (
          <Badge variant="success" size="sm">Ok</Badge>
        )
      ),
    },
    {
      key: 'precioUnitario',
      header: 'Precio Unit.',
      align: 'right',
      render: (item) => (
        <span className="font-black text-slate-900">{formatCurrency(item.precioUnitario)}</span>
      ),
    },
    {
      key: 'proveedor',
      header: 'Proveedor',
      render: (item) => (
        <span className="font-semibold text-slate-600">{item.proveedor}</span>
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
              variant="info"
              size="sm"
              icon={<ShoppingCart className="w-3.5 h-3.5" />}
              onClick={(e) => { e.stopPropagation(); openOrder(item); }}
            >
              Pedir
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

  const lowStockCount = stats.stockBajo;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Inventario y Refacciones"
        subtitle="Control de stock, órdenes de compra y almacén central."
        action={
          puedeCrear ? (
            <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
              Nuevo Artículo
            </Button>
          ) : undefined
        }
      />

      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-red-900 font-bold text-sm">Alerta de Stock Crítico</p>
              <p className="text-red-700 text-xs font-medium">
                Tienes {lowStockCount} artículo{lowStockCount > 1 ? 's' : ''} por debajo del mínimo.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={handleFilterLowStock}
          >
            Ver artículos con stock bajo
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          icon={<Package className="w-6 h-6" />}
          value={`${stats.totalArticulos} tipos`}
          label="Total Artículos"
          color="info"
        />
        <StatsCard
          icon={<TrendingDown className="w-6 h-6" />}
          value={`${stats.stockBajo} críticos`}
          label="Stock Bajo"
          color={stats.stockBajo > 0 ? 'error' : 'success'}
          onClick={stats.stockBajo > 0 ? handleFilterLowStock : undefined}
        />
        <StatsCard
          icon={<ShoppingCart className="w-6 h-6" />}
          value={formatCurrency(stats.valorTotal)}
          label="Valor Inventario"
          color="neutral"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar refacción, categoría o proveedor..."
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
          {/* Overlay sutil durante refetches — solo cuando ya hay datos */}
          {refreshing && !initialLoading && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center transition-opacity">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          )}
          <DataTable
            columns={columns}
            data={articulos}
            loading={initialLoading}
            keyExtractor={(item) => item.id}
            emptyText="No se encontraron artículos que coincidan con la búsqueda."
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
        title="Nuevo Artículo"
        subtitle="Registrar un nuevo artículo en inventario."
        submitLabel="Crear Artículo"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Nombre" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Filtro de Aceite CAT"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </ModalField>

          <ModalField label="Código">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: FAC-001"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            />
          </ModalField>

          <ModalField label="Categoría" required>
            <select
              className={modalSelectClass}
              value={form.categoriaId}
              onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {catalogos.categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Proveedor" required>
            <select
              className={modalSelectClass}
              value={form.proveedorId}
              onChange={(e) => setForm({ ...form, proveedorId: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {catalogos.proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Unidad de Medida" required>
            <select
              className={modalSelectClass}
              value={form.unidadId}
              onChange={(e) => setForm({ ...form, unidadId: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {catalogos.unidades.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.codigo})</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Stock Inicial">
            <input
              type="number"
              className={modalInputClass}
              placeholder="0"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </ModalField>

          <ModalField label="Stock Mínimo">
            <input
              type="number"
              className={modalInputClass}
              placeholder="5"
              min="0"
              value={form.stockMinimo}
              onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
            />
          </ModalField>

          <ModalField label="Precio Unitario (MXN)">
            <input
              type="number"
              className={modalInputClass}
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.precioUnitario}
              onChange={(e) => setForm({ ...form, precioUnitario: e.target.value })}
              readOnly={esMaterialDeVenta}
            />
            {esMaterialDeVenta && (
              <p className="mt-1 text-[10px] font-medium text-amber-600">
                Tiene precios por medida de venta; el precio unitario no se edita aquí.
              </p>
            )}
          </ModalField>
        </div>
      </FormModal>

      <FormModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        onCancel={() => setOrderOpen(false)}
        title="Registrar Entrada de Inventario"
        subtitle={selectedItem ? `Artículo: ${selectedItem.nombre}` : undefined}
        submitLabel="Registrar Entrada"
        cancelLabel="Cancelar"
        onSubmit={handleOrder}
        isSubmitting={submitting}
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-900">{selectedItem.nombre}</p>
                  <p className="text-xs text-slate-500">{selectedItem.categoria} — {selectedItem.proveedor}</p>
                </div>
                <Badge variant={selectedItem.stock <= selectedItem.stockMinimo ? 'error' : 'success'} size="sm">
                  Stock: {selectedItem.stock} {selectedItem.unidad}
                </Badge>
              </div>
            </div>

            <ModalField label="Cantidad a Entrar" required>
              <input
                type="number"
                className={modalInputClass}
                placeholder="10"
                min="1"
                value={orderForm.cantidad}
                onChange={(e) => setOrderForm({ ...orderForm, cantidad: e.target.value })}
              />
            </ModalField>

            <ModalField label="Motivo / Referencia">
              <input
                type="text"
                className={modalInputClass}
                placeholder="Número de orden interno, proveedor, etc."
                value={orderForm.motivo}
                onChange={(e) => setOrderForm({ ...orderForm, motivo: e.target.value })}
              />
            </ModalField>
          </div>
        )}
      </FormModal>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Artículo"
        subtitle={selectedItem ? `Editando: ${selectedItem.nombre}` : undefined}
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Nombre" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Nombre del artículo"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </ModalField>

          <ModalField label="Código">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Código del artículo"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            />
          </ModalField>

          <ModalField label="Categoría" required>
            <select
              className={modalSelectClass}
              value={form.categoriaId}
              onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {catalogos.categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Proveedor" required>
            <select
              className={modalSelectClass}
              value={form.proveedorId}
              onChange={(e) => setForm({ ...form, proveedorId: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {catalogos.proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Unidad de Medida" required>
            <select
              className={modalSelectClass}
              value={form.unidadId}
              onChange={(e) => setForm({ ...form, unidadId: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {catalogos.unidades.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.codigo})</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Stock Actual">
            <input
              type="number"
              className={modalInputClass}
              placeholder="0"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </ModalField>

          <ModalField label="Stock Mínimo">
            <input
              type="number"
              className={modalInputClass}
              placeholder="5"
              min="0"
              value={form.stockMinimo}
              onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
            />
          </ModalField>

          <ModalField label="Precio Unitario (MXN)">
            <input
              type="number"
              className={modalInputClass}
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.precioUnitario}
              onChange={(e) => setForm({ ...form, precioUnitario: e.target.value })}
              readOnly={esMaterialDeVenta}
            />
            {esMaterialDeVenta && (
              <p className="mt-1 text-[10px] font-medium text-amber-600">
                Tiene precios por medida de venta; el precio unitario no se edita aquí.
              </p>
            )}
          </ModalField>
        </div>
      </FormModal>

      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Artículo"
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
              ¿Estás seguro de eliminar el artículo?
            </p>
            <p className="font-black text-slate-900 text-lg mb-2">
              {selectedItem.nombre}
            </p>
            <p className="text-xs text-slate-500">
              {selectedItem.categoria} — Stock actual: {selectedItem.stock} {selectedItem.unidad}
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}
