"use client";

import React, { useState, useMemo } from 'react';
import { Plus, Package, AlertTriangle, TrendingDown, ShoppingCart } from 'lucide-react';
import { inventario, type ArticuloInventario } from '@/lib/data';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';

export default function InventarioPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find(v => v.ruta === '/inventario');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Datos calculados ──
  const lowStockItems = inventario.filter(item => item.stock <= item.stockMinimo);
  const totalValue = inventario.reduce((acc, item) => acc + item.stock * item.precioUnitario, 0);

  // ── Filtro de búsqueda ──
  const filtered = useMemo(() => {
    if (!search.trim()) return inventario;
    const term = search.toLowerCase();
    return inventario.filter(item =>
      item.nombre.toLowerCase().includes(term) ||
      item.categoria.toLowerCase().includes(term) ||
      item.proveedor.toLowerCase().includes(term)
    );
  }, [search]);

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
    ...(puedeEditar ? [{
      key: 'acciones',
      header: 'Acciones',
      align: 'right' as const,
      render: (item: ArticuloInventario) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            showToast(`Solicitando reposición de ${item.nombre}...`, 'info');
          }}
          className="text-xs font-bold text-primary hover:underline"
        >
          Pedir más
        </button>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <PageHeader
        title="Inventario y Refacciones"
        subtitle="Control de stock, órdenes de compra y almacén central."
        action={
          puedeCrear ? (
            <button className="btn-primary flex items-center gap-2 w-fit">
              <Plus className="w-5 h-5" />
              Nuevo Artículo
            </button>
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
          <button className="text-red-900 font-black text-xs uppercase tracking-widest hover:underline shrink-0">
            Ver artículos
          </button>
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

      {/* Search Bar */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar refacción, categoría o proveedor..."
      />

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
