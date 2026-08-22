"use client";

import React, { useState } from 'react';
import { 
  Wrench, Fuel, User, ClipboardCheck, Clock, MapPin, 
  ShieldAlert, HardHat, Users, AlertTriangle, CheckCircle2,
  Plus
} from 'lucide-react';
import { reportesCampo, type ReporteCampo } from '@/lib/data';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TIPOS = ['Todos', 'Incidente', 'Mecanico', 'Pipero', 'Operador', 'Checador', 'Ingeniero', 'Trabajador'] as const;

function getTipoIcon(tipo: ReporteCampo['tipo']) {
  switch (tipo) {
    case 'Mecanico':   return <Wrench      className="w-5 h-5 text-blue-500" />;
    case 'Pipero':     return <Fuel        className="w-5 h-5 text-orange-500" />;
    case 'Operador':   return <User        className="w-5 h-5 text-green-500" />;
    case 'Checador':   return <ClipboardCheck className="w-5 h-5 text-purple-500" />;
    case 'Incidente':  return <ShieldAlert className="w-5 h-5 text-red-500" />;
    case 'Ingeniero':  return <HardHat     className="w-5 h-5 text-yellow-500" />;
    case 'Trabajador': return <Users       className="w-5 h-5 text-teal-500" />;
    default:           return <ClipboardCheck className="w-5 h-5 text-slate-400" />;
  }
}

function getTipoColor(tipo: ReporteCampo['tipo']) {
  switch (tipo) {
    case 'Mecanico':   return 'bg-blue-500';
    case 'Pipero':     return 'bg-orange-500';
    case 'Operador':   return 'bg-green-500';
    case 'Checador':   return 'bg-purple-500';
    case 'Incidente':  return 'bg-red-500';
    case 'Ingeniero':  return 'bg-yellow-400';
    case 'Trabajador': return 'bg-teal-500';
    default:           return 'bg-slate-400';
  }
}

function getPrioridadStyle(p?: ReporteCampo['prioridad']) {
  switch (p) {
    case 'Crítica': return 'bg-red-100 text-red-700 border border-red-200';
    case 'Alta':    return 'bg-orange-100 text-orange-700 border border-orange-200';
    case 'Media':   return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    case 'Baja':    return 'bg-blue-100 text-blue-700 border border-blue-200';
    default:        return '';
  }
}

function getEstadoStyle(e: ReporteCampo['estado']) {
  switch (e) {
    case 'Pendiente':   return 'bg-yellow-100 text-yellow-700';
    case 'Visto':       return 'bg-blue-100 text-blue-600';
    case 'Atendido':    return 'bg-green-100 text-green-600';
    case 'En Revisión': return 'bg-orange-100 text-orange-600';
    case 'Resuelto':    return 'bg-green-100 text-green-700';
    default:            return 'bg-slate-100 text-slate-500';
  }
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ReportesCampoPage() {
  const [filtro, setFiltro] = useState<string>('Todos');

  const incidentesCriticos = reportesCampo.filter(
    r => r.tipo === 'Incidente' && (r.prioridad === 'Crítica' || r.prioridad === 'Alta') && r.estado !== 'Resuelto'
  );

  const reportesFiltrados = filtro === 'Todos'
    ? reportesCampo
    : reportesCampo.filter(r => r.tipo === filtro);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Reportes de Campo</h1>
          <p className="text-slate-500 font-medium">
            Bitácora unificada — mecánicos, operadores, ingenieros, incidentes y más.
          </p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          {incidentesCriticos.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {incidentesCriticos.length} incidente{incidentesCriticos.length > 1 ? 's' : ''} activo{incidentesCriticos.length > 1 ? 's' : ''}
            </div>
          )}
          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Sincronizado
          </div>
          <button className="btn-primary flex items-center gap-2 w-fit border-none">
            <Plus className="w-4 h-4" />
            Nuevo Reporte
          </button>
        </div>
      </div>

      {/* Filtros por tipo */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none flex-wrap">
        {TIPOS.map(tipo => {
          const count = tipo === 'Todos'
            ? reportesCampo.length
            : reportesCampo.filter(r => r.tipo === tipo).length;
          if (count === 0 && tipo !== 'Todos') return null;
          const isIncidente = tipo === 'Incidente';
          const isActive = filtro === tipo;
          return (
            <button
              key={tipo}
              onClick={() => setFiltro(tipo)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap border ${
                isActive
                  ? isIncidente
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-slate-900 text-white border-slate-900'
                  : isIncidente && incidentesCriticos.length > 0
                  ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              {tipo === 'Incidente' && <ShieldAlert className="w-3.5 h-3.5" />}
              {tipo}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                isActive ? 'bg-white/20 text-inherit' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feed de reportes */}
      <div className="grid grid-cols-1 gap-4">
        {reportesFiltrados.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">Sin reportes en esta categoría</p>
          </div>
        ) : (
          reportesFiltrados.map((report) => (
            <div
              key={report.id}
              className={`card group transition-all p-0 overflow-hidden flex flex-col md:flex-row ${
                report.tipo === 'Incidente' ? 'hover:border-red-300' : 'hover:border-primary/50'
              }`}
            >
              {/* Barra lateral de color */}
              <div className={`w-1.5 md:w-4 shrink-0 ${getTipoColor(report.tipo)}`} />

              <div className="p-6 flex-1 flex flex-col md:flex-row gap-6">
                {/* Info del usuario */}
                <div className="md:w-52 shrink-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${
                      report.tipo === 'Incidente' ? 'bg-red-50' : 'bg-slate-50'
                    }`}>
                      {getTipoIcon(report.tipo)}
                    </div>
                    <div className="font-black text-slate-900 text-sm leading-tight">{report.usuario}</div>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{report.tipo}</p>
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                      <Clock className="w-3 h-3" /> {report.hora} — {report.fecha}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                      <MapPin className="w-3 h-3" /> {report.obra}
                    </div>
                    {report.maquinaId && (
                      <div className="text-[10px] font-black text-primary uppercase tracking-widest">
                        Máq: {report.maquinaId}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenido del reporte */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3 gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {report.prioridad && (
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getPrioridadStyle(report.prioridad)}`}>
                          Prioridad {report.prioridad}
                        </span>
                      )}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${getEstadoStyle(report.estado)}`}>
                      {report.estado}
                    </span>
                  </div>

                  <div className={`p-4 rounded-xl border italic text-sm font-medium ${
                    report.tipo === 'Incidente'
                      ? 'bg-red-50 border-red-100 text-red-900'
                      : 'bg-slate-50 border-slate-100 text-slate-600'
                  }`}>
                    "{report.descripcion}"
                  </div>

                  {/* Detalles extra (ej: litros de pipero) */}
                  {report.detalles && (
                    <div className="mt-4 flex gap-4">
                      <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-1.5">
                        <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest block">Litros</span>
                        <span className="text-sm font-black text-orange-700">{report.detalles.litros} L</span>
                      </div>
                      <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-1.5">
                        <span className="text-[9px] font-black text-green-400 uppercase tracking-widest block">Costo</span>
                        <span className="text-sm font-black text-green-700">${report.detalles.costo}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="md:w-32 flex flex-col justify-center items-end gap-2">
                  <button className={`w-full py-2 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    report.tipo === 'Incidente'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-slate-900 hover:bg-primary'
                  }`}>
                    {report.tipo === 'Incidente' ? 'Gestionar' : 'Validar'}
                  </button>
                  <button className="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                    Detalles
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

