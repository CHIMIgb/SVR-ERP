"use client";

import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus, Package, AlertTriangle, TrendingDown, ShoppingCart,
  Pencil, Trash2, SlidersHorizontal, X, AlertCircle,
} from 'lucide-react';
import { inventario, type ArticuloInventario } from '@/lib/data';
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

// ── Constantes ──
const PAGE_SIZE = 2;

// ── Opciones de filtro (derivadas de los datos) ──
const categorias = [...new Set(inventario.map(i => i.categoria))];
const proveedores = [...new Set(inventario.map(i => i.proveedor))];

const filterFields: FilterField[] = [
  {
    key: 'categoria',
    label: 'Categoría',
    type: 'select',
    options: categorias.map(c => ({ value: c, label: c })),
    placeholder: 'Todas',
  },
  {
    key: 'proveedor',
    label: 'Proveedor',
    type: 'select',
    options: proveedores.map(p => ({ value: p, label: p })),
    placeholder: 'Todos',
  },
  {
    key: 'stock',
    label: 'Estado Stock',
    type: 'select',
    options: [
      { value: 'bajo', label: 'Stock Bajo' },
      { value: 'ok', label: 'Stock OK' },
    ],
    placeholder: 'Todos',
  },
];

// ── Form defaults ──
const emptyForm = {
  nombre: '',
  categoria: '',
  stock: '',
  stockMinimo: '',
  unidad: 'Pza',
  precioUnitario: '',
  proveedor: '',
};

export default function InventarioPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Estado local ──
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Estado de modales ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ArticuloInventario | null>(null);
  const [form, setForm] = useState(emptyForm);

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find(v => v.ruta === '/inventario');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Datos calculados ──
  const lowStockItems = inventario.filter(item => item.stock <= item.stockMinimo);
  const totalValue = inventario.reduce((acc, item) => acc + item.stock * item.precioUnitario, 0);

  // ── Filtros activos (chips) ──
  const activeFilters: ActiveFilter[] = useMemo(() => {
    const filters: ActiveFilter[] = [];
    if (filterValues.categoria) {
      const label = categorias.find(c => c === filterValues.categoria) ?? filterValues.categoria;
      filters.push({ key: 'categoria', label: 'Categoría', value: label });
    }
    if (filterValues.proveedor) {
      const label = proveedores.find(p => p === filterValues.proveedor) ?? filterValues.proveedor;
      filters.push({ key: 'proveedor', label: 'Proveedor', value: label });
    }
    if (filterValues.stock) {
      const label = filterValues.stock === 'bajo' ? 'Stock Bajo' : 'Stock OK';
      filters.push({ key: 'stock', label: 'Estado', value: label });
    }
    return filters;
  }, [filterValues]);

  // ── Filtro combinado ──
  const filtered = useMemo(() => {
    let result = inventario;

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(item =>
        item.nombre.toLowerCase().includes(term) ||
        item.categoria.toLowerCase().includes(term) ||
        item.proveedor.toLowerCase().includes(term)
      );
    }

    if (filterValues.categoria) {
      result = result.filter(item => item.categoria === filterValues.categoria);
    }

    if (filterValues.proveedor) {
      result = result.filter(item => item.proveedor === filterValues.proveedor);
    }

    if (filterValues.stock) {
      if (filterValues.stock === 'bajo') {
        result = result.filter(item => item.stock <= item.stockMinimo);
      } else {
        result = result.filter(item => item.stock > item.stockMinimo);
      }
    }

    return result;
  }, [search, filterValues]);

  // ── Paginación ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = filtered.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  // ── Handlers de filtros ──
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterValues({});
    setCurrentPage(1);
  }, []);

  const handleRemoveFilter = useCallback((key: string) => {
    setFilterValues(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setCurrentPage(1);
  }, []);

  // ── Handlers de modales ──
  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((item: ArticuloInventario) => {
    setSelectedItem(item);
    setForm({
      nombre: item.nombre,
      categoria: item.categoria,
      stock: String(item.stock),
      stockMinimo: String(item.stockMinimo),
      unidad: item.unidad,
      precioUnitario: String(item.precioUnitario),
      proveedor: item.proveedor,
    });
    setEditOpen(true);
  }, []);

  const openOrder = useCallback((item: ArticuloInventario) => {
    setSelectedItem(item);
    setForm({
      ...emptyForm,
      nombre: item.nombre,
      categoria: item.categoria,
      proveedor: item.proveedor,
      stock: String(item.stockMinimo - item.stock + 10), // Sugerir reposición
    });
    setOrderOpen(true);
  }, []);

  const openDelete = useCallback((item: ArticuloInventario) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    if (!form.nombre || !form.categoria) {
      showToast('Nombre y categoría son obligatorios.', 'error');
      return;
    }
    showToast(`Artículo "${form.nombre}" creado exitosamente.`, 'success');
    setCreateOpen(false);
  }, [form, showToast]);

  const handleEdit = useCallback(() => {
    if (!form.nombre || !form.categoria) {
      showToast('Nombre y categoría son obligatorios.', 'error');
      return;
    }
    showToast(`Artículo "${form.nombre}" actualizado exitosamente.`, 'success');
    setEditOpen(false);
  }, [form, showToast]);

  const handleOrder = useCallback(() => {
    if (!form.stock) {
      showToast('La cantidad a pedir es obligatoria.', 'error');
      return;
    }
    showToast(`Orden de compra para "${form.nombre}" (${form.stock} unidades) enviada.`, 'success');
    setOrderOpen(false);
  }, [form, showToast]);

  const handleDelete = useCallback(() => {
    if (!selectedItem) return;
    showToast(`Artículo "${selectedItem.nombre}" eliminado exitosamente.`, 'success');
    setDeleteOpen(false);
    setSelectedItem(null);
  }, [selectedItem, showToast]);

  // ── Columnas de DataTable ──
  const columns: Column<ArticuloInventario>[] = [
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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
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

      {/* Alert Summary */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-red-900 font-bold text-sm">Alerta de Stock Crítico</p>
              <p className="text-red-700 text-xs font-medium">
                Tienes {lowStockItems.length} artículo{lowStockItems.length > 1 ? 's' : ''} por debajo del mínimo.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-red-900 font-black uppercase tracking-widest shrink-0">
            Ver artículos
          </Button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          icon={<Package className="w-6 h-6" />}
          value={`${inventario.length} tipos`}
          label="Total Artículos"
          color="info"
        />
        <StatsCard
          icon={<TrendingDown className="w-6 h-6" />}
          value={`${lowStockItems.length} críticos`}
          label="Stock Bajo"
          color={lowStockItems.length > 0 ? 'error' : 'success'}
        />
        <StatsCard
          icon={<ShoppingCart className="w-6 h-6" />}
          value={formatCurrency(totalValue)}
          label="Valor Inventario"
          color="neutral"
        />
      </div>

      {/* Search + Toggle Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
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

      {/* Chips de filtros activos */}
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

      {/* Panel de filtros */}
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

      {/* Tabla + Paginación */}
      <div className="space-y-3">
        <DataTable
          columns={columns}
          data={paginatedData}
          keyExtractor={(item) => item.id}
          emptyText="No se encontraron artículos que coincidan con la búsqueda."
          maxBodyHeight="500px"
        />

        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          totalRecords={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODALES
          ═══════════════════════════════════════════════════════════ */}

      {/* Modal: Crear Artículo */}
      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCancel={() => setCreateOpen(false)}
        title="Nuevo Artículo"
        subtitle="Registrar un nuevo artículo en inventario."
        submitLabel="Crear Artículo"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
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

          <ModalField label="Categoría" required>
            <select
              className={modalSelectClass}
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {categorias.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Proveedor">
            <select
              className={modalSelectClass}
              value={form.proveedor}
              onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {proveedores.map(p => (
                <option key={p} value={p}>{p}</option>
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

          <ModalField label="Unidad">
            <select
              className={modalSelectClass}
              value={form.unidad}
              onChange={(e) => setForm({ ...form, unidad: e.target.value })}
            >
              <option value="Pza">Pieza (Pza)</option>
              <option value="Galones">Galones</option>
              <option value="Litros">Litros</option>
              <option value="Kg">Kilogramos (Kg)</option>
              <option value="Metro">Metro</option>
              <option value="Rollo">Rollo</option>
            </select>
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
            />
          </ModalField>
        </div>
      </FormModal>

      {/* Modal: Pedir / Orden de Compra */}
      <FormModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        onCancel={() => setOrderOpen(false)}
        title="Orden de Compra"
        subtitle={selectedItem ? `Reposición de: ${selectedItem.nombre}` : undefined}
        submitLabel="Enviar Orden"
        cancelLabel="Cancelar"
        onSubmit={handleOrder}
      >
        {selectedItem && (
          <div className="space-y-4">
            {/* Resumen del artículo */}
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

            <ModalField label="Cantidad a Pedir" required>
              <input
                type="number"
                className={modalInputClass}
                placeholder="10"
                min="1"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </ModalField>

            <ModalField label="Notas / Referencia">
              <input
                type="text"
                className={modalInputClass}
                placeholder="Número de orden interno, prioridad, etc."
              />
            </ModalField>
          </div>
        )}
      </FormModal>

      {/* Modal: Editar Artículo */}
      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Artículo"
        subtitle={selectedItem ? `Editando: ${selectedItem.nombre}` : undefined}
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
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

          <ModalField label="Categoría" required>
            <select
              className={modalSelectClass}
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {categorias.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Proveedor">
            <select
              className={modalSelectClass}
              value={form.proveedor}
              onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {proveedores.map(p => (
                <option key={p} value={p}>{p}</option>
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

          <ModalField label="Unidad">
            <select
              className={modalSelectClass}
              value={form.unidad}
              onChange={(e) => setForm({ ...form, unidad: e.target.value })}
            >
              <option value="Pza">Pieza (Pza)</option>
              <option value="Galones">Galones</option>
              <option value="Litros">Litros</option>
              <option value="Kg">Kilogramos (Kg)</option>
              <option value="Metro">Metro</option>
              <option value="Rollo">Rollo</option>
            </select>
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
            />
          </ModalField>
        </div>
      </FormModal>

      {/* Modal: Confirmar Eliminación */}
      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Artículo"
        subtitle="Esta acción no se puede deshacer."
        submitLabel="Sí, Eliminar"
        cancelLabel="Cancelar"
        onSubmit={handleDelete}
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
