"use client";

import React from 'react';
import { Plus, ClipboardList, Timer, MapPin, Search, Filter, History } from 'lucide-react';
import { operaciones, maquinaria } from '@/lib/data';

export default function OperacionesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Bitácora de Operaciones</h1>
          <p className="text-slate-500 font-medium">Registro diario de actividades realizadas por maquinaria en obra.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          Nuevo Registro
        </button>
      </div>

      {/* Timeline List */}
      <div className="space-y-6">
        {operaciones.map((op) => {
          const maquina = maquinaria.find(m => m.id === op.maquinaId);
          return (
            <div key={op.id} className="card group hover:border-primary/50 transition-all flex flex-col md:flex-row gap-6">
               <div className="md:w-32 flex flex-col items-center justify-center border-r border-slate-100 pr-6">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{op.fecha}</span>
                  <div className="text-2xl font-black text-primary mt-1">{op.horas} hrs</div>
               </div>

               <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                     <div>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-primary transition-colors">
                           {op.actividad}
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                           <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                              <MapPin className="w-3.5 h-3.5 text-slate-300" />
                              {op.obra}
                           </div>
                           <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                              <ClipboardList className="w-3.5 h-3.5 text-slate-300" />
                              Máquina: <span className="text-slate-900">{op.maquinaId} - {maquina?.nombre}</span>
                           </div>
                        </div>
                     </div>
                     <button className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <History className="w-4 h-4 text-slate-400" />
                     </button>
                  </div>

                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-1 rounded">
                        ID: {op.id}
                     </span>
                     <span className="text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-600 px-2 py-1 rounded">
                        Completado
                     </span>
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
