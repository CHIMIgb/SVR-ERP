"use client";

import React, { useState } from 'react';
import { MapPin, Navigation, Truck, SignalHigh, Layers, AlertTriangle, Radio } from 'lucide-react';
import { maquinaria } from '@/lib/data';
import { useToast } from '@/components/layout/Toast';

type MapView = 'mapa' | 'satelite';

interface Geocerca {
  id: string;
  nombre: string;
  top: string;
  left: string;
  radio: string;
  color: string;
}

const geocercas: Geocerca[] = [
  { id: 'G1', nombre: 'Valle Sur', top: '38%', left: '42%', radio: '80px', color: '#f97316' },
  { id: 'G2', nombre: 'Lerma Norte', top: '55%', left: '62%', radio: '60px', color: '#3b82f6' },
  { id: 'G3', nombre: 'Toluca C2',   top: '25%', left: '58%', radio: '50px', color: '#8b5cf6' },
];

// Traffic segments simulated as colored road-like overlays
const trafficSegments = [
  { top: '35%', left: '30%', w: '120px', h: '6px', rot: '-15deg', color: '#22c55e' },   // libre
  { top: '48%', left: '50%', w: '90px',  h: '6px', rot: '20deg',  color: '#f59e0b' },   // moderado
  { top: '60%', left: '38%', w: '100px', h: '6px', rot: '-5deg',  color: '#ef4444' },   // congestionado
  { top: '28%', left: '55%', w: '70px',  h: '6px', rot: '40deg',  color: '#22c55e' },   // libre
  { top: '70%', left: '60%', w: '110px', h: '6px', rot: '-30deg', color: '#ef4444' },   // congestionado
];

const markerPositions = [
  { top: '40%', left: '44%' },
  { top: '57%', left: '63%' },
  { top: '27%', left: '60%' },
  { top: '68%', left: '35%' },
];

export default function GPSPage() {
  const { showToast } = useToast();
  const [view, setView] = useState<MapView>('mapa');
  const [trafficOn, setTrafficOn] = useState(false);
  const [geocercasOn, setGeocercasOn] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handleView = (v: MapView) => {
    setView(v);
    showToast(v === 'satelite' ? '🛰️ Vista satelital activada.' : '🗺️ Vista de mapa activada.', 'success');
  };

  const handleTraffic = () => {
    setTrafficOn(p => !p);
    showToast(trafficOn ? '🚦 Capa de tráfico desactivada.' : '🚦 Capa de tráfico activada.', trafficOn ? 'warning' : 'success');
  };

  const handleGeocercas = () => {
    setGeocercasOn(p => !p);
    showToast(geocercasOn ? '📍 Geocercas desactivadas.' : '📍 3 geocercas de obras cargadas.', geocercasOn ? 'warning' : 'success');
  };

  const selectedMachine = maquinaria.find(m => m.id === selected);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Monitoreo GPS</h1>
          <p className="text-slate-500 font-medium">Ubicación satelital y estado de telemetría en tiempo real.</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <SignalHigh className="w-4 h-4" />Sistemas Online: 100%
           </div>
           {trafficOn && (
             <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
               <AlertTriangle className="w-4 h-4" />Congestionamiento en Lerma
             </div>
           )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Machine Sidebar */}
        <div className="w-80 bg-white border border-slate-200 rounded-[2rem] overflow-hidden flex flex-col shrink-0">
           <div className="p-6 border-b border-slate-100">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Activos Cercanos</h3>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {maquinaria.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelected(selected === m.id ? null : m.id)}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all group ${
                    selected === m.id
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                      : 'border-slate-100 hover:border-primary/50'
                  }`}
                >
                   <div className="flex justify-between items-start mb-2">
                      <div className="font-black text-slate-900">{m.id}</div>
                      <span className={`w-2 h-2 rounded-full ${m.estado === 'Encendida' || m.estado === 'Movimiento' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{m.nombre}</p>
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 mb-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      {m.lat.toFixed(4)}, {m.lng.toFixed(4)}
                   </div>
                   <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                        m.estado === 'Encendida' ? 'bg-green-100 text-green-700' :
                        m.estado === 'Movimiento' ? 'bg-blue-100 text-blue-700' :
                        m.estado === 'Mantenimiento' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{m.estado}</span>
                      <span className="text-[9px] font-bold text-slate-400">{m.horometro.toLocaleString()} hrs</span>
                   </div>
                </div>
              ))}
           </div>

           {/* Legend */}
           <div className="p-4 border-t border-slate-100 space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Leyenda</p>
              <div className="flex flex-wrap gap-2">
                 <span className="flex items-center gap-1 text-[9px] font-bold text-slate-600"><span className="w-2 h-2 rounded-full bg-green-500" />Activa</span>
                 <span className="flex items-center gap-1 text-[9px] font-bold text-slate-600"><span className="w-2 h-2 rounded-full bg-blue-500" />Movimiento</span>
                 <span className="flex items-center gap-1 text-[9px] font-bold text-slate-600"><span className="w-2 h-2 rounded-full bg-orange-500" />Mant.</span>
                 <span className="flex items-center gap-1 text-[9px] font-bold text-slate-600"><span className="w-2 h-2 rounded-full bg-slate-300" />Apagada</span>
              </div>
           </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 rounded-[2rem] overflow-hidden relative">
          {/* ── MAP BACKGROUND ── */}
          {view === 'mapa' ? (
            /* Road-map style dark */
            <div className="absolute inset-0 bg-[#1e293b]">
              {/* Grid streets simulation */}
              <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
                {/* Horizontal streets */}
                {[15,28,42,55,68,80].map(y => (
                  <line key={`h${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#94a3b8" strokeWidth="1.5"/>
                ))}
                {/* Vertical streets */}
                {[12,25,38,52,65,78,90].map(x => (
                  <line key={`v${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#94a3b8" strokeWidth="1.5"/>
                ))}
                {/* Main avenues (thicker) */}
                <line x1="0" y1="45%" x2="100%" y2="45%" stroke="#cbd5e1" strokeWidth="3"/>
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#cbd5e1" strokeWidth="3"/>
                {/* Diagonal boulevard */}
                <line x1="0" y1="100%" x2="100%" y2="0" stroke="#cbd5e1" strokeWidth="2.5" opacity="0.6"/>
                {/* Zone fills */}
                <rect x="30%" y="30%" width="25%" height="20%" fill="#0f172a" opacity="0.5" rx="4"/>
                <rect x="60%" y="55%" width="20%" height="15%" fill="#0f172a" opacity="0.4" rx="4"/>
              </svg>
            </div>
          ) : (
            /* Satellite style */
            <div className="absolute inset-0 bg-[#2d4a1e]">
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Terrain blobs */}
                <ellipse cx="30%" cy="40%" rx="18%" ry="12%" fill="#3a5e28" opacity="0.8"/>
                <ellipse cx="70%" cy="60%" rx="15%" ry="10%" fill="#4a7a35" opacity="0.7"/>
                <ellipse cx="50%" cy="25%" rx="20%" ry="8%" fill="#2e5020" opacity="0.9"/>
                <ellipse cx="20%" cy="70%" rx="12%" ry="8%" fill="#3d6530" opacity="0.6"/>
                <ellipse cx="80%" cy="30%" rx="10%" ry="6%" fill="#4a7a35" opacity="0.8"/>
                {/* Urban blocks */}
                <rect x="38%" y="38%" width="8%" height="6%" fill="#5a5a5a" opacity="0.9" rx="2"/>
                <rect x="48%" y="44%" width="6%" height="4%" fill="#666" opacity="0.8" rx="2"/>
                <rect x="60%" y="55%" width="7%" height="5%" fill="#555" opacity="0.9" rx="2"/>
                {/* Roads */}
                <line x1="0" y1="45%" x2="100%" y2="45%" stroke="#8b8b6e" strokeWidth="4" opacity="0.8"/>
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#8b8b6e" strokeWidth="3" opacity="0.8"/>
                <line x1="0" y1="100%" x2="100%" y2="0" stroke="#7a7a5a" strokeWidth="2.5" opacity="0.6"/>
                {/* Water body */}
                <ellipse cx="85%" cy="80%" rx="12%" ry="8%" fill="#1e4080" opacity="0.7"/>
              </svg>
            </div>
          )}

          {/* ── TRAFFIC LAYER ── */}
          {trafficOn && (
            <div className="absolute inset-0 pointer-events-none">
              {trafficSegments.map((seg, i) => (
                <div
                  key={i}
                  className="absolute rounded-full opacity-80"
                  style={{
                    top: seg.top,
                    left: seg.left,
                    width: seg.w,
                    height: seg.h,
                    backgroundColor: seg.color,
                    transform: `rotate(${seg.rot})`,
                    boxShadow: `0 0 8px ${seg.color}`,
                  }}
                />
              ))}
              {/* Traffic legend */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-xl p-3 text-white space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Tráfico</p>
                {[['#22c55e','Libre'],['#f59e0b','Moderado'],['#ef4444','Congestionado']].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-2">
                    <span className="w-6 h-1.5 rounded-full inline-block" style={{backgroundColor: c}}/>
                    <span className="text-[9px] font-bold">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── GEOCERCAS LAYER ── */}
          {geocercasOn && geocercas.map((g) => (
            <div
              key={g.id}
              className="absolute pointer-events-none"
              style={{ top: g.top, left: g.left, transform: 'translate(-50%, -50%)' }}
            >
              {/* Outer pulsing ring */}
              <div
                className="absolute rounded-full animate-ping opacity-20"
                style={{ width: g.radio, height: g.radio, backgroundColor: g.color, transform: 'translate(-50%,-50%)', top:'50%', left:'50%' }}
              />
              {/* Filled circle */}
              <div
                className="absolute rounded-full opacity-15 border-2"
                style={{ width: g.radio, height: g.radio, backgroundColor: g.color, borderColor: g.color, transform: 'translate(-50%,-50%)', top:'50%', left:'50%' }}
              />
              {/* Label */}
              <div
                className="absolute px-2 py-0.5 rounded-lg text-white text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                style={{ backgroundColor: g.color, top: `calc(50% + calc(${g.radio} / 2) + 4px)`, left: '50%', transform: 'translateX(-50%)' }}
              >
                {g.nombre}
              </div>
              {/* Center dot */}
              <div className="w-2 h-2 rounded-full bg-white shadow-lg relative z-10" style={{border:`2px solid ${g.color}`}} />
            </div>
          ))}

          {/* ── MACHINE MARKERS ── */}
          {maquinaria.map((m, i) => {
            const pos = markerPositions[i] ?? { top: `${30 + i * 12}%`, left: `${35 + i * 10}%` };
            const isSelected = selected === m.id;
            return (
              <div
                key={m.id}
                className="absolute cursor-pointer transition-all hover:scale-110 z-10"
                style={{ top: pos.top, left: pos.left }}
                onClick={() => setSelected(isSelected ? null : m.id)}
              >
                {/* Ping */}
                <div className={`absolute -inset-4 rounded-full opacity-20 ${
                  m.estado === 'Encendida' ? 'bg-green-500 animate-ping' :
                  m.estado === 'Movimiento' ? 'bg-blue-500 animate-pulse' :
                  m.estado === 'Mantenimiento' ? 'bg-orange-500 animate-pulse' :
                  'bg-slate-500'
                }`} />
                {/* Marker */}
                <div className={`relative bg-white rounded-lg shadow-2xl flex items-center gap-2 px-2 py-1.5 transition-all ${isSelected ? 'ring-2 ring-primary scale-110' : ''}`}>
                   <div className={`p-1.5 rounded-md text-white ${
                     m.estado === 'Encendida' ? 'bg-green-500' :
                     m.estado === 'Movimiento' ? 'bg-blue-500' :
                     m.estado === 'Mantenimiento' ? 'bg-orange-500' :
                     'bg-slate-600'
                   }`}>
                      <Truck className="w-3.5 h-3.5" />
                   </div>
                   <div className="leading-none">
                      <p className="text-[10px] font-black text-slate-900">{m.id}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{m.estado}</p>
                   </div>
                </div>
                {/* Tooltip on select */}
                {isSelected && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-xl p-3 min-w-[160px] shadow-2xl z-20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">{m.nombre}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px]">
                        <span className="text-white/60">Horómetro</span>
                        <span className="font-black">{m.horometro.toLocaleString()} hrs</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-white/60">Combustible</span>
                        <span className={`font-black ${m.combustible < 20 ? 'text-red-400' : 'text-green-400'}`}>{m.combustible}%</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-white/60">Operador</span>
                        <span className="font-black">{m.operador.split(' ')[0]}</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-white/60">Diesel hoy</span>
                        <span className="font-black">{m.dieselHoy} L</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* ── COMPASS ── */}
          <div className="absolute top-4 right-4 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center">
             <Navigation className="w-6 h-6 text-primary rotate-45" />
          </div>

          {/* ── VIEW BADGE ── */}
          <div className="absolute top-4 right-20 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
            {view === 'satelite' ? <Radio className="w-3 h-3 text-green-400" /> : <Layers className="w-3 h-3 text-blue-400" />}
            <span className="text-[9px] font-black text-white uppercase tracking-widest">{view === 'satelite' ? 'Satelital' : 'Mapa'}</span>
          </div>

          {/* ── MAP CONTROLS ── */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-2 flex gap-2">
            <button
              onClick={() => handleView('mapa')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'mapa' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              Mapa
            </button>
            <button
              onClick={() => handleView('satelite')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'satelite' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              Satélite
            </button>
            <div className="w-px bg-white/10" />
            <button
              onClick={handleTraffic}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                trafficOn ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              Tráfico
            </button>
            <button
              onClick={handleGeocercas}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                geocercasOn ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              Geocercas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
