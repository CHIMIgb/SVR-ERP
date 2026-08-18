"use client";

import React from 'react';
import { Plus, Wrench, Timer, AlertCircle, CheckCircle, Search, Filter, History } from 'lucide-react';
import { mantenimiento, maquinaria } from '@/lib/data';

export default function MantenimientoPage() {
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Mantenimiento de Flota</h1>
          <p className="text-slate-500 font-medium">Programación de servicios preventivos y registro de reparaciones correctivas.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          Programar Servicio
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card flex items-center gap-4 py-6 border-l-4 border-l-orange-500">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servicios Próximos</p>
            <h4 className="text-xl font-black text-slate-900">3 <span className="text-xs text-slate-400 font-medium">máquinas</span></h4>
          </div>
        </div>
        <div className="card flex items-center gap-4 py-6 border-l-4 border-l-blue-500">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prom. Horas/Servicio</p>
            <h4 className="text-xl font-black text-slate-900">250 <span className="text-xs text-slate-400 font-medium">hrs</span></h4>
          </div>
        </div>
        <div className="card flex items-center gap-4 py-6 border-l-4 border-l-green-500">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipos en Óptimo Estado</p>
            <h4 className="text-xl font-black text-slate-900">10 / 12</h4>
          </div>
        </div>
      </div>

      {/* Maintenance History */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
             <History className="w-5 h-5 text-slate-400" />
             Historial de Servicios Realizados
          </h3>
          <div className="flex gap-2">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar por ID..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none" />
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
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID Máquina</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo / Descripción</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Horas en Servicio</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Costo Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mantenimiento.map((m) => {
                const maquina = maquinaria.find(x => x.id === m.maquinaId);
                return (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900">{m.maquinaId}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{maquina?.nombre}</div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-1 inline-block ${
                         m.tipo === 'Preventivo' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                       }`}>
                          {m.tipo}
                       </span>
                       <div className="text-sm font-semibold text-slate-600">{m.descripcion}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{m.fecha}</td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-slate-300" />
                          <span className="text-sm font-black text-slate-900">{m.horasServicio} hrs</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                       {formatter.format(m.costo)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
