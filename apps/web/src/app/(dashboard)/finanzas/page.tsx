"use client";

import React from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, Search, Filter, Download } from 'lucide-react';
import { finanzas } from '@/lib/data';

export default function FinanzasPage() {
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

  const totalIngresos = finanzas.filter(t => t.tipo === 'Ingreso').reduce((acc, t) => acc + t.monto, 0);
  const totalEgresos = finanzas.filter(t => t.tipo === 'Egreso').reduce((acc, t) => acc + t.monto, 0);
  const balance = totalIngresos - totalEgresos;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Control Financiero</h1>
          <p className="text-slate-500 font-medium">Flujo de caja, ingresos por obras y gastos operativos.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
              <Download className="w-4 h-4 text-slate-400" />
              Exportar
           </button>
           <button className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nueva Transacción
           </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-slate-900 text-white border-none shadow-2xl shadow-slate-900/20">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                 <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Balance Total</span>
           </div>
           <h2 className="text-3xl font-black">{formatter.format(balance)}</h2>
           <p className="text-xs text-white/40 mt-2 font-medium">Actualizado hace 5 minutos</p>
        </div>

        <div className="card border-l-4 border-l-green-500">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                 <ArrowUpCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ingresos</span>
           </div>
           <h2 className="text-3xl font-black text-slate-900">{formatter.format(totalIngresos)}</h2>
           <p className="text-xs text-green-600 mt-2 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12% vs mes pasado
           </p>
        </div>

        <div className="card border-l-4 border-l-red-500">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                 <ArrowDownCircle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Egresos</span>
           </div>
           <h2 className="text-3xl font-black text-slate-900">{formatter.format(totalEgresos)}</h2>
           <p className="text-xs text-red-600 mt-2 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3 rotate-180" /> +5% vs mes pasado
           </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-lg">Movimientos Recientes</h3>
          <div className="flex gap-2">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none" />
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
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descripción / Categoría</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {finanzas.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{t.fecha}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 text-sm">{t.descripcion}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.categoria}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                      t.tipo === 'Ingreso' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {t.tipo}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-black text-sm ${
                    t.tipo === 'Ingreso' ? 'text-green-600' : 'text-slate-900'
                  }`}>
                    {t.tipo === 'Ingreso' ? '+' : '-'}{formatter.format(t.monto)}
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
