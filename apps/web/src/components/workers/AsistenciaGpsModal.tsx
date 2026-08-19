"use client";

import React, { useState } from 'react';
import { 
  X, MapPin, ShieldCheck, ShieldAlert, Smartphone, 
  Battery, Clock, ExternalLink, Navigation, Compass,
  CheckCircle2, AlertTriangle, Building2, User, Flame,
  DollarSign, ArrowRight
} from 'lucide-react';
import { RegistroAsistencia, trabajadores } from '@/lib/data';
import { useToast } from '@/components/layout/Toast';

interface AsistenciaGpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  registro: RegistroAsistencia | null;
  onActualizarEstado?: (registroId: string, nuevoEstado: 'Puntual' | 'Retardo' | 'Falta' | 'Justificado') => void;
  onAprobarHorasExtra?: (registroId: string) => void;
}

export default function AsistenciaGpsModal({
  isOpen,
  onClose,
  registro,
  onActualizarEstado,
  onAprobarHorasExtra
}: AsistenciaGpsModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'entrada' | 'salida' | 'horas_extra'>('entrada');

  if (!isOpen || !registro) return null;

  const trabajador = trabajadores.find(t => t.id === registro.trabajadorId);
  const distanciaFormateada = registro.distanciaMetros >= 1000
    ? `${(registro.distanciaMetros / 1000).toFixed(2)} km`
    : `${registro.distanciaMetros} metros`;

  const radioKm = (registro.radioPermitidoMetros / 1000).toFixed(1);

  // Offset visual relativo para el mapa interactivo simulado
  const workerOffset = registro.enSitio 
    ? { x: 53, y: 47 } // Dentro del círculo de 2km
    : { x: 86, y: 18 }; // Fuera del círculo (> 2km)

  const googleMapsUrl = `https://www.google.com/maps?q=${registro.coordenadas.lat},${registro.coordenadas.lng}`;

  const handleAprobar = () => {
    onActualizarEstado?.(registro.id, 'Puntual');
    showToast(`✅ Asistencia de ${trabajador?.nombre ?? 'Trabajador'} validada.`, 'success');
    onClose();
  };

  const handleMarcarFalta = () => {
    onActualizarEstado?.(registro.id, 'Falta');
    showToast(`❌ Marcaje rechazado por exceder el radio permitido de ${radioKm} km.`, 'error');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-[fadeScaleIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${registro.enSitio ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">Inspección de Asistencia y Geocerca</h3>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  registro.enSitio ? 'bg-green-500 text-white' : 'bg-red-500 text-white animate-pulse'
                }`}>
                  {registro.enSitio ? `En Sitio (Radio ${radioKm}km)` : `Fuera de Rango (> ${radioKm}km)`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Monitoreo satelital de entrada, salida y tiempo extraordinario
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Worker Info Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-white font-black text-base shadow-md">
                {trabajador?.avatar ?? 'OP'}
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm leading-tight">{trabajador?.nombre}</h4>
                <p className="text-xs font-bold text-primary">{trabajador?.puesto}</p>
                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  Obra Asignada: <strong className="text-slate-800">{registro.obraAsignada}</strong>
                </p>
              </div>
            </div>

            {/* Shift hours summary */}
            <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/60 text-right">
              <div className="text-xs font-black text-slate-900">
                {registro.horasTrabajadasOrdinarias ?? 8}h ordinarias laboradas
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-black uppercase tracking-wider">
                <span className="text-green-600 flex items-center gap-0.5">
                  <Battery className="w-3 h-3" /> {registro.bateria ?? 85}%
                </span>
                <span className="text-slate-400 font-mono">{registro.dispositivo}</span>
              </div>
            </div>
          </div>

          {/* Inspection Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('entrada')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === 'entrada'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Entrada Ordinaria ({registro.horaEntrada ?? 'Sin marcar'})
            </button>
            <button
              onClick={() => setActiveTab('salida')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === 'salida'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Salida Ordinaria ({registro.horaSalida ?? 'Pendiente'})
            </button>
            {registro.horasExtra && (
              <button
                onClick={() => setActiveTab('horas_extra')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                  activeTab === 'horas_extra'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" /> Horas Extra ({registro.horasExtra.horasCalculadas}h)
              </button>
            )}
          </div>

          {/* TAB 1 & 2: ENTRADA / SALIDA ORDINARIA */}
          {(activeTab === 'entrada' || activeTab === 'salida') && (
            <div className="space-y-4">
              
              {/* Geofence Alert Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                registro.enSitio 
                  ? 'bg-green-50/80 border-green-200 text-green-900' 
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                {registro.enSitio ? (
                  <ShieldCheck className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                )}
                <div className="flex-1">
                  <h5 className="text-xs font-black uppercase tracking-wide">
                    {registro.enSitio 
                      ? `Marcaje dentro del Polígono (${distanciaFormateada})` 
                      : `Alerta: Fuera del Radio Autorizado de ${radioKm} km`}
                  </h5>
                  <p className="text-xs font-medium mt-1 leading-relaxed text-slate-600">
                    {registro.enSitio ? (
                      <>
                        El celular marcó a <strong className="text-green-700 font-black">{distanciaFormateada}</strong> de la obra. Como las obras de construcción y minería son extensas, el sistema admite un radio de hasta <strong className="text-slate-800">{radioKm} km</strong> a la redonda.
                      </>
                    ) : (
                      <>
                        El celular reportó una ubicación a <strong className="text-red-600 font-black">{distanciaFormateada}</strong> del centro de la obra. Supera el perímetro de seguridad configurado de {radioKm} km.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Interactive 2km Geofence Map Visualizer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-primary" />
                    Plano Satelital con Geocerca Circular ({radioKm} km de Radio)
                  </span>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2.5 py-1 rounded-lg"
                  >
                    Ver en Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="relative h-64 w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center group select-none">
                  
                  {/* Grid */}
                  <div 
                    className="absolute inset-0 opacity-25"
                    style={{
                      backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`,
                      backgroundSize: '24px 24px'
                    }}
                  />

                  {/* Highway / Project Layout curves */}
                  <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 130 Q 150 120 300 160 T 600 130" fill="none" stroke="#94a3b8" strokeWidth="14" />
                    <path d="M 220 0 L 220 300" fill="none" stroke="#94a3b8" strokeWidth="10" />
                    <path d="M 450 0 L 450 300" fill="none" stroke="#94a3b8" strokeWidth="6" />
                  </svg>

                  {/* 2km Geofence Circle Zone */}
                  <div 
                    className="absolute rounded-full border-2 border-emerald-400 bg-emerald-500/15 backdrop-blur-[1px] flex items-center justify-center transition-all animate-pulse"
                    style={{
                      width: '210px',
                      height: '210px',
                      top: 'calc(50% - 105px)',
                      left: 'calc(50% - 105px)',
                    }}
                  >
                    <span className="text-[8px] font-black uppercase text-emerald-300 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded-full border border-emerald-400/40">
                      Geocerca Obra ({radioKm} km radio)
                    </span>
                  </div>

                  {/* Obra Center Pin */}
                  <div 
                    className="absolute flex flex-col items-center z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{ top: '50%', left: '50%' }}
                  >
                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-xl shadow-lg flex items-center justify-center border-2 border-white ring-4 ring-emerald-500/30">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="mt-1 bg-slate-900/90 text-white text-[8px] font-black px-2 py-0.5 rounded border border-slate-700 whitespace-nowrap shadow-md">
                      {registro.obraAsignada}
                    </div>
                  </div>

                  {/* Distance Connecting Line */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                    <line 
                      x1="50%" 
                      y1="50%" 
                      x2={`${workerOffset.x}%`} 
                      y2={`${workerOffset.y}%`} 
                      stroke={registro.enSitio ? '#10b981' : '#ef4444'} 
                      strokeWidth="2.5" 
                      strokeDasharray="5,5" 
                    />
                  </svg>

                  {/* Worker Pin */}
                  <div 
                    className="absolute flex flex-col items-center z-30 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ top: `${workerOffset.y}%`, left: `${workerOffset.x}%` }}
                  >
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-xl border-2 border-white ${
                      registro.enSitio ? 'bg-blue-600 ring-4 ring-blue-500/40' : 'bg-red-600 ring-4 ring-red-500/50 animate-bounce'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className={`mt-1 text-[8px] font-black px-2 py-0.5 rounded shadow-lg whitespace-nowrap border ${
                      registro.enSitio ? 'bg-blue-900/90 text-blue-200 border-blue-400' : 'bg-red-900/90 text-red-200 border-red-400'
                    }`}>
                      📱 {trabajador?.nombre?.split(' ')[0]} ({distanciaFormateada})
                    </div>
                  </div>

                  {/* Bottom Bar */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[9px] font-bold text-slate-300 z-30">
                    <span>GPS Celular: {registro.coordenadas.lat.toFixed(4)}, {registro.coordenadas.lng.toFixed(4)}</span>
                    <span className="text-emerald-400 font-mono">Distancia: {distanciaFormateada}</span>
                  </div>
                </div>
              </div>

              {/* Exact timestamps details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Entrada Registrada</p>
                  <p className="font-black text-slate-900 text-sm">{registro.horaEntrada ?? 'No registrada'}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{registro.horaMarcajeExacta ?? '—'}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Salida Registrada</p>
                  <p className="font-black text-slate-900 text-sm">{registro.horaSalida ?? 'Jornada activa'}</p>
                </div>
              </div>
              {/* Early Departure Notice */}
              {registro.salidaAnticipada && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h6 className="text-xs font-black uppercase tracking-wide text-amber-900">
                      Alerta de Salida Anticipada ({registro.horasTrabajadasOrdinarias ?? 5.5}h laboradas)
                    </h6>
                    <p className="text-xs text-amber-800 font-medium mt-0.5">
                      <strong>Motivo reportado:</strong> {registro.motivoSalidaAnticipada ?? 'Retiro antes del término reglamentario de turno.'}
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: HORAS EXTRAS */}
          {activeTab === 'horas_extra' && registro.horasExtra && (
            <div className="space-y-4">
              
              {/* Overtime KPI Header */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                    Jornada Extraordinaria
                  </span>
                  <h4 className="text-2xl font-black mt-2">
                    {registro.horasExtra.horasCalculadas} <span className="text-base font-bold text-white/80">horas extras</span>
                  </h4>
                  <p className="text-xs text-white/90 font-medium mt-0.5">
                    {registro.horasExtra.inicio} <ArrowRight className="inline w-3 h-3 mx-1" /> {registro.horasExtra.fin ?? 'En curso'}
                  </p>
                </div>

                <div className="text-right bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/70">A Pagar en Nómina</p>
                  <p className="text-2xl font-black text-white mt-0.5">
                    ${registro.horasExtra.montoTotal.toFixed(2)}
                  </p>
                  <p className="text-[10px] font-bold text-white/80">
                    Tarifa: ${registro.horasExtra.tarifaPorHora}/hr
                  </p>
                </div>
              </div>

              {/* Overtime Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Motivo / Tarea Asignada:</span>
                  <span className="font-black text-slate-900">{registro.horasExtra.motivo ?? 'Trabajo extraordinario'}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-500">Estado de Aprobación:</span>
                  <span className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${
                    registro.horasExtra.estado === 'Aprobado' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {registro.horasExtra.estado}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-500">Geolocalización en Turno Extra:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> En Sitio de Obra
                  </span>
                </div>
              </div>

              {/* Supervisor Actions for Overtime */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onAprobarHorasExtra?.(registro.id);
                    showToast(`🔥 ${registro.horasExtra?.horasCalculadas} horas extra aprobadas para ${trabajador?.nombre}.`, 'success');
                  }}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Autorizar Horas Extra para Nómina
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>

          <div className="flex gap-2">
            {!registro.enSitio && (
              <button
                onClick={handleMarcarFalta}
                className="px-4 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" /> Marcar Falta por Geocerca
              </button>
            )}
            <button
              onClick={handleAprobar}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-primary text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              {registro.enSitio ? 'Confirmar Asistencia' : 'Justificar Excepción'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
