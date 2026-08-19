"use client";

import React from 'react';
import { 
  Truck, Timer, Fuel, User, MapPin, AlertCircle, 
  ShieldCheck, AlertTriangle, Wrench, CheckCircle2,
  Activity, Compass, ChevronRight, Gauge
} from 'lucide-react';
import { Maquina } from '@/lib/data';
import { useToast } from '@/components/layout/Toast';

interface MachineCardProps {
  maquina: Maquina;
  onOpenChecklist?: (maquina: Maquina) => void;
  onOpenGps?: (maquina: Maquina) => void;
}

export default function MachineCard({ maquina, onOpenChecklist, onOpenGps }: MachineCardProps) {
  const { showToast } = useToast();

  const statusColors: Record<string, string> = {
    Encendida: "bg-green-500 text-white",
    Apagada: "bg-slate-400 text-white",
    Mantenimiento: "bg-orange-500 text-white",
    Movimiento: "bg-blue-500 text-white",
  };

  const statusGlow: Record<string, string> = {
    Encendida: "border-green-300",
    Movimiento: "border-blue-300",
    Mantenimiento: "border-orange-300",
    Apagada: "border-slate-200"
  };

  return (
    <div className={`card group p-5 space-y-4 hover:shadow-xl transition-all border ${statusGlow[maquina.estado] ?? 'border-slate-200'} bg-white flex flex-col justify-between`}>
      
      <div className="space-y-3.5">
        {/* Top Bar */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${statusColors[maquina.estado] ?? 'bg-slate-400'} shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform`}>
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-lg leading-none">{maquina.id}</h3>
                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {maquina.tipo}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-700 mt-1">{maquina.nombre}</p>
            </div>
          </div>

          <span className={`text-[9px] font-black uppercase tracking-widest ${statusColors[maquina.estado] ?? 'bg-slate-400'} px-2.5 py-1 rounded-full shadow-sm`}>
            {maquina.estado}
          </span>
        </div>

        {/* Telemetry Alert or Daily Checklist Status */}
        {maquina.alertaConsumoAnormal ? (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-red-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-600" /> 🚨 Alerta de Telemetría
              </span>
              <span className="text-[9px] font-mono font-bold text-red-700">{maquina.rendimientoActualLtsHora} L/hr</span>
            </div>
            <p className="text-[11px] font-bold text-red-950">
              Sobreconsumo anormal (+96% vs estándar). Posible ordeña.
            </p>
          </div>
        ) : maquina.checklistHoy?.estado === 'Con Falla' ? (
          <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-orange-800 flex items-center gap-1">
                <Wrench className="w-3 h-3 text-orange-600" /> Checklist Pre-op: Con Falla
              </span>
              <span className="text-[9px] font-mono text-orange-800">{maquina.checklistHoy.hora}</span>
            </div>
            <p className="text-[11px] font-medium text-orange-900 truncate">
              {maquina.checklistHoy.observaciones}
            </p>
          </div>
        ) : (
          <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between text-[11px]">
            <span className="text-emerald-800 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Checklist Pre-operacional Matutino OK
            </span>
            <span className="text-[10px] text-emerald-700 font-mono font-bold">06:45 AM</span>
          </div>
        )}

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 py-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
          
          {/* Horometer */}
          <div className="space-y-0.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Gauge className="w-3 h-3 text-slate-400" /> Horómetro
            </span>
            <p className="font-black text-slate-900 text-base">
              {maquina.horometro.toLocaleString('es-MX')} <span className="text-[10px] text-slate-400 font-bold">HRS</span>
            </p>
          </div>

          {/* Diesel Fuel Tank */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Fuel className="w-3 h-3 text-slate-400" /> Diésel
              </span>
              <span className="text-[10px] font-black text-slate-700">{maquina.combustible}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full rounded-full transition-all ${
                  maquina.combustible > 50 ? 'bg-emerald-500' :
                  maquina.combustible > 25 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${maquina.combustible}%` }}
              />
            </div>
          </div>

          {/* Assigned Operator */}
          <div className="space-y-0.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" /> Operador
            </span>
            <p className="text-xs font-bold text-slate-800 truncate">{maquina.operador}</p>
          </div>

          {/* Service Countdown */}
          <div className="space-y-0.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Wrench className="w-3 h-3 text-slate-400" /> Próx. Servicio
            </span>
            <p className="text-[11px] font-black text-orange-700 truncate">
              {maquina.proximoMantenimiento}
            </p>
          </div>

        </div>

      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => onOpenGps?.(maquina)}
          className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5 text-slate-500" /> Ver GPS
        </button>

        <button
          onClick={() => onOpenChecklist?.(maquina)}
          className="py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-orange-400" /> Checklist
        </button>
      </div>

    </div>
  );
}
