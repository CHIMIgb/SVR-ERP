"use client";

import React from 'react';
import { Plus, Package, AlertTriangle, Search, Filter, ShoppingCart, TrendingDown } from 'lucide-react';
import { inventario } from '@/lib/data';

export default function InventarioPage() {
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

  const lowStockItems = inventario.filter(item => item.stock <= item.stockMinimo);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Inventario y Refacciones</h1>
          <p className="text-slate-500 font-medium">Control de stock, órdenes de compra y almacén central.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          Nuevo Artículo
        </button>
      </div>

      {/* Alert Summary */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
             </div>
             <div>
                <p className="text-red-900 font-bold text-sm">Alerta de Stock Crítico</p>
                <p className="text-red-700 text-xs font-medium">Tienes {lowStockItems.length} artículos por debajo del mínimo.</p>
             </div>
          </div>
          <button className="text-red-900 font-black text-xs uppercase tracking-widest hover:underline">Ver artículos</button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card flex items-center gap-4 py-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Artículos</p>
            <h4 className="text-xl font-black text-slate-900">{inventario.length} <span className="text-xs text-slate-400 font-medium">tipos</span></h4>
          </div>
        </div>
        <div className="card flex items-center gap-4 py-6">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Bajo</p>
            <h4 className="text-xl font-black text-orange-600">{lowStockItems.length} <span className="text-xs text-slate-400 font-medium">críticos</span></h4>
          </div>
        </div>
        <div className="card flex items-center gap-4 py-6">
          <div className="w-12 h-12 bg-secondary text-white rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Valor Inventario</p>
            <h4 className="text-xl font-black text-white">$145.2k</h4>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-lg">Almacén Central de Refacciones</h3>
          <div className="flex gap-2">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar refacción..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none" />
             </div>
             <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                <Filter className="w-4 h-4 text-slate-500" />
             </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre / Categoría</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Stock Actual</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Precio Unit.</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Proveedor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventario.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-900">{item.nombre}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.categoria}</div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <span className={`font-black text-sm ${item.stock <= item.stockMinimo ? 'text-red-500' : 'text-slate-900'}`}>
                           {item.stock} {item.unidad}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">/ Min: {item.stockMinimo}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     {item.stock <= item.stockMinimo ? (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-600 px-2 py-1 rounded">Stock Bajo</span>
                     ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-green-100 text-green-600 px-2 py-1 rounded">Ok</span>
                     )}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900">{formatter.format(item.precioUnitario)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-600">{item.proveedor}</td>
                  <td className="px-6 py-4 text-right">
                     <button className="text-xs font-bold text-primary hover:underline">Pedir más</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
