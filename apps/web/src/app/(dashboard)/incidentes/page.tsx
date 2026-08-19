"use client";

import React from 'react';
import { Plus, AlertTriangle, Clock, CheckCircle2, Search, Filter, ShieldAlert } from 'lucide-react';
import { incidentes } from '@/lib/data';

export default function IncidentesPage() {
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Crítica': return 'bg-red-500 text-white shadow-red-500/20';
      case 'Alta': return 'bg-orange-500 text-white shadow-orange-500/20';
      case 'Media': return 'bg-yellow-500 text-secondary shadow-yellow-500/20';
      default: return 'bg-blue-500 text-white shadow-blue-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Seguridad e Incidentes</h1>
          <p className="text-slate-500 font-medium">Reporte de fallas, accidentes y retrasos operativos en obra.</p>
        </div>
        <button className="btn-primary bg-red-600 hover:bg-red-700 flex items-center gap-2 w-fit border-none shadow-red-600/20">
          <ShieldAlert className="w-5 h-5" />
          Reportar Incidente
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {incidentes.map((inc) => (
          <div key={inc.id} className="card group overflow-hidden">
             <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${getPriorityStyle(inc.prioridad)} shadow-lg`}>
                      <AlertTriangle className="w-5 h-5" />
                   </div>
                   <div>
                      <h3 className="font-black text-slate-900 text-lg leading-tight">{inc.titulo}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{inc.obra}</p>
                   </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                   inc.estado === 'Resuelto' ? 'bg-green-100 text-green-600' : 
                   inc.estado === 'En Revisión' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                }`}>
                   {inc.estado}
                </span>
             </div>

             <p className="text-sm text-slate-600 font-medium mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                "{inc.descripcion}"
             </p>

             <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-[10px] font-black text-slate-400 uppercase">{inc.fecha}</span>
                   </div>
                   {inc.maquinaId && (
                      <div className="flex items-center gap-1.5">
                         <span className="text-[10px] font-black text-primary uppercase">Máquina: {inc.maquinaId}</span>
                      </div>
                   )}
                </div>
                <button className="text-xs font-black text-secondary hover:underline uppercase tracking-widest">
                   Gestionar →
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
