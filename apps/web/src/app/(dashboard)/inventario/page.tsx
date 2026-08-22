"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Package, AlertTriangle, TrendingDown, ShoppingCart, Pencil, Trash2 } from 'lucide-react';
import { inventario, type ArticuloInventario } from '@/lib/data';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar, FilterPanel, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';

// ── Opciones de filtro ──
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

export default function InventarioPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find(v => v.ruta === '/inventario');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Datos calculados ──
  const lowStockItems = inventario.filter(item => item.stock <= item.stockMinimo);
  const totalValue = inventario.reduce((acc, item) => acc + item.stock * item.precioUnitario, 0);

  // ── Filtros activos (para mostrar chips) ──
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

  // ── Filtro combinado (search + filtros) ──
  const filtered = useMemo(() => {
    let result = inventario;

    // Filtro por búsqueda de texto
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(item =>
        item.nombre.toLowerCase().includes(term) ||
        item.categoria.toLowerCase().includes(term) ||
        item.proveedor.toLowerCase().includes(term)
      );
    }

    // Filtro por categoría
    if (filterValues.categoria) {
      result = result.filter(item => item.categoria === filterValues.categoria);
    }

    // Filtro por proveedor
    if (filterValues.proveedor) {
      result = result.filter(item => item.proveedor === filterValues.proveedor);
    }

    // Filtro por estado de stock
    if (filterValues.stock) {
      if (filterValues.stock === 'bajo') {
        result = result.filter(item => item.stock <= item.stockMinimo);
      } else {
        result = result.filter(item => item.stock > item.stockMinimo);
      }
    }

    return result;
  }, [search, filterValues]);

  // ── Handlers ──
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterValues({});
  }, []);

  const handleRemoveFilter = useCallback((key: string) => {
    setFilterValues(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handlePedirMas = useCallback((item: ArticuloInventario) => {
    // En producción, esto abriría un modal de orden de compra o enviaría a un endpoint
    showToast(`Solicitando reposición de ${item.nombre} al proveedor ${item.proveedor}...`, 'info');
  }, [showToast]);

  const handleEdit = useCallback((item: ArticuloInventario) => {
    // En producción, esto abriría un modal de edición con formulario
    showToast(`Editando artículo: ${item.nombre}`, 'info');
  }, [showToast]);

  const handleDelete = useCallback((item: ArticuloInventario) => {
    // En producción, esto mostraría un confirm() antes de eliminar
    if (confirm(`¿Estás seguro de eliminar "${item.nombre}"? Esta acción no se puede deshacer.`)) {
      showToast(`Artículo "${item.nombre}" eliminado.`, 'success');
      // Aquí iría la llamada a la API para eliminar
    }
  }, [showToast]);

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
          {/* Botón "Pedir más" - visible si puede editar */}
          {puedeEditar && (
            <Button
              variant="ghost"
              size="sm"
              icon={<ShoppingCart className="w-3.5 h-3.5" />}
              onClick={(e) => {
                e.stopPropagation();
                handlePedirMas(item);
              }}
            >
              Pedir
            </Button>
          )}

          {/* Botón Editar - visible si puede editar */}
          {puedeEditar && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Pencil className="w-3.5 h-3.5" />}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item);
              }}
            >
              Editar
            </Button>
          )}

          {/* Botón Eliminar - visible si puede eliminar */}
          {puedeEliminar && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}
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
            <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
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

      {/* Search Bar + Filters */}
      <div className="space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar refacción, categoría o proveedor..."
          filters={filterFields}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          onRemoveFilter={handleRemoveFilter}
        />

        <FilterPanel
          filters={filterFields}
          values={filterValues}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      </div>

      {/* Inventory Table */}
      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        emptyText="No se encontraron artículos que coincidan con la búsqueda."
        maxBodyHeight="500px"
      />
    </div>
  );
}
