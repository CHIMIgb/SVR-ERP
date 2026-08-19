"use client";

import React from 'react';
import { FileBarChart, Download, FileText, PieChart, TrendingUp, Calendar, Filter, ChevronRight } from 'lucide-react';

const reportTypes = [
  { 
    title: "Consumo de Combustible", 
    desc: "Análisis mensual de litros por máquina y obra.", 
    icon: FileBarChart, 
    color: "bg-orange-500",
    lastGen: "Hace 2 días"
  },
  { 
    title: "Eficiencia de Maquinaria", 
    desc: "Comparativa de horas trabajadas vs tiempo encendida.", 
    icon: PieChart, 
    color: "bg-blue-500",
    lastGen: "Hace 5 días"
  },
  { 
    title: "Estado Financiero de Obras", 
    desc: "Balance de presupuesto vs gastos reales por proyecto.", 
    icon: TrendingUp, 
    color: "bg-green-500",
    lastGen: "Hoy"
  },
  { 
    title: "Asistencia y Nómina", 
    desc: "Resumen de retardos, faltas y horas extra del personal.", 
    icon: FileText, 
    color: "bg-purple-500",
    lastGen: "Ayer"
  },
];

export default function ReportesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Centro de Reportes</h1>
          <p className="text-slate-500 font-medium">Generación de informes inteligentes para la toma de decisiones.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
              <Calendar className="w-4 h-4 text-slate-400" />
              Abril 2025
           </button>
           <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4 text-slate-400" />
              Filtros
           </button>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report, i) => (
          <div key={i} className="card group hover:border-primary/50 transition-all cursor-pointer">
             <div className="flex items-start gap-6">
                <div className={`${report.color} p-4 rounded-2xl text-white shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
                   <report.icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-start">
                      <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-primary transition-colors">
                         {report.title}
                      </h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         PDF • EXCEL
                      </span>
                   </div>
                   <p className="text-sm text-slate-500 font-medium mt-1 leading-snug">
                      {report.desc}
                   </p>
                   <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         Último reporte: <span className="text-slate-600">{report.lastGen}</span>
                      </p>
                      <button className="flex items-center gap-1 text-primary text-xs font-black uppercase tracking-widest">
                         Generar <ChevronRight className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Quick Stats / Visual Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 card">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-primary" />
               Vista Previa: Rendimiento Mensual
            </h3>
            {/* Simple CSS Chart simulator */}
            <div className="h-48 flex items-end gap-4 px-4 pb-8 border-b border-l border-slate-100">
               {[45, 78, 56, 89, 67, 92, 40].map((h, i) => (
                 <div key={i} className="flex-1 bg-slate-100 rounded-t-lg relative group transition-all hover:bg-primary/20">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all duration-1000 group-hover:bg-primary-dark" 
                      style={{ height: `${h}%` }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                       {h}%
                    </div>
                 </div>
               ))}
            </div>
            <div className="flex justify-between mt-4 px-4">
               {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                 <span key={`${d}-${i}`} className="text-[10px] font-black text-slate-400">{d}</span>
               ))}
            </div>
         </div>

         <div className="card bg-secondary text-white border-none shadow-2xl shadow-secondary/20 flex flex-col justify-between">
            <div>
               <h3 className="font-bold text-white/90 mb-4 uppercase tracking-[0.2em] text-xs">Reporte de Ahorros</h3>
               <p className="text-2xl font-black mb-2">-$12,450 MXN</p>
               <p className="text-xs text-white/50 font-medium">Gracias a la optimización de rutas y control de ralentí este mes.</p>
            </div>
            <button className="w-full bg-primary text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-dark transition-all">
               <Download className="w-4 h-4" />
               Descargar Informe
            </button>
         </div>
      </div>
    </div>
  );
}
