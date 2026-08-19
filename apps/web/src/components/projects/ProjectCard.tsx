"use client";

import React from 'react';
import { Calendar, MapPin, Building2, DollarSign } from 'lucide-react';
import { Proyecto } from '@/lib/data';
import { useToast } from '@/components/layout/Toast';

interface ProjectCardProps {
  proyecto: Proyecto;
  onManage: (proyecto: Proyecto) => void;
}

export default function ProjectCard({ proyecto, onManage }: ProjectCardProps) {
  const { showToast } = useToast();

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  });

  return (
    <div className="card group hover:border-primary/30 transition-all">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-black text-slate-900 text-xl leading-tight group-hover:text-primary transition-colors">
            {proyecto.nombre}
          </h3>
          <div className="flex items-center gap-2 text-slate-400 mt-1">
            <Building2 className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{proyecto.cliente}</span>
          </div>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm ${
          proyecto.estado === 'Finalizado' ? 'bg-green-500 text-white' :
          proyecto.estado === 'En Proceso' ? 'bg-primary text-white' : 'bg-slate-400 text-white'
        }`}>
          {proyecto.estado}
        </span>
      </div>

      {/* Financial Progress */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-1.5 text-slate-400">
             <DollarSign className="w-3.5 h-3.5" />
             <span className="text-[10px] font-black uppercase tracking-widest">Presupuesto</span>
          </div>
          <span className="text-sm font-black text-slate-900">{formatter.format(proyecto.presupuesto)}</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
            <span className="text-slate-400">Gasto Ejecutado</span>
            <span className={proyecto.gastado > proyecto.presupuesto ? 'text-red-500' : 'text-slate-600'}>
              {formatter.format(proyecto.gastado)}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
             <div
               className={`h-full transition-all duration-1000 ${
                 proyecto.gastado > proyecto.presupuesto ? 'bg-red-500' : 'bg-secondary'
               }`}
               style={{ width: `${Math.min((proyecto.gastado / proyecto.presupuesto) * 100, 100)}%` }}
             />
          </div>
        </div>
      </div>

      {/* Physical Progress */}
      <div className="space-y-1.5 mb-6">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
          <span className="text-slate-400">Avance de Obra</span>
          <span className="text-primary">{proyecto.progreso}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
           <div
             className="h-full bg-primary transition-all duration-1000"
             style={{ width: `${proyecto.progreso}%` }}
           />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-300" />
          <span className="text-[10px] font-bold text-slate-500">{proyecto.ubicacion}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-300" />
          <span className="text-[10px] font-bold text-slate-500">{proyecto.fechaFin}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => showToast(`📄 Generando reporte de ${proyecto.nombre}...`, 'info')}
          className="flex-1 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
        >
          Reportes
        </button>
        <button
          onClick={() => onManage(proyecto)}
          className="flex-1 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all cursor-pointer"
        >
          Gestionar
        </button>
      </div>
    </div>
  );
}
