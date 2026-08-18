"use client";

import React, { useState } from 'react';
import { 
  Smartphone, Wrench, Fuel, User, 
  ClipboardCheck, Camera, Bell, 
  MapPin, CheckCircle, Droplets, 
  LogOut, Crown, HardHat,
  TrendingUp, AlertTriangle, Users, FileText,
  BarChart2, DollarSign, Clock, Flame
} from 'lucide-react';
import { useNotifications } from '@/components/layout/NotificationContext';
import { useToast } from '@/components/layout/Toast';

type Role = 'Mecanico' | 'Pipero' | 'Operador' | 'Checador' | 'Dueno' | 'Ingeniero' | 'Trabajador' | null;

export default function SimuladorMovilPage() {
  const { addNotification } = useNotifications();
  const { showToast } = useToast();

  const [role, setRole] = useState<Role>(null);
  const [step, setStep] = useState(0); // 0: Login, 1: Home, 2: Action

  // Worker GPS Clock-in state in mobile simulator
  const [workerName, setWorkerName] = useState('Juan Pérez');
  const [workerObra, setWorkerObra] = useState('Fraccionamiento Valle Sur');
  const [workerGpsMode, setWorkerGpsMode] = useState<'en_sitio' | 'fuera_sitio'>('en_sitio');
  const [workerCheckedIn, setWorkerCheckedIn] = useState(false);
  const [workerCheckInTime, setWorkerCheckInTime] = useState('');

  // State for manual inputs (telemetry workarounds)
  const [operatorMachine, setOperatorMachine] = useState('M001');
  const [operatorHorometro, setOperatorHorometro] = useState('');
  const [operatorFalla, setOperatorFalla] = useState('');

  const handleOperatorSubmit = () => {
    if (!operatorHorometro && !operatorFalla) {
      showToast('Por favor captura el horómetro o reporta una falla.', 'error');
      return;
    }

    if (operatorHorometro) {
      addNotification({
        titulo: `Telemetría Manual: ${operatorMachine}`,
        mensaje: `Horómetro reportado manualmente por operador: ${operatorHorometro} hrs.`,
        tipo: 'info'
      });
    }

    if (operatorFalla) {
      addNotification({
        titulo: `Correo: Falla Reportada - ${operatorMachine}`,
        mensaje: `Se envió alerta por correo al mecánico Ricardo M. sobre la falla en ${operatorMachine}.`,
        tipo: 'correo',
        destinatario: 'Ricardo M. <mecanica@svr.com>',
        asunto: `ALERTA URGENTE: Reporte de Falla en Obra - ${operatorMachine}`,
        plantillaHtml: `
          <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #334155;">
            <div style="background-color: #ef4444; color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Reporte de Falla Mecánica</h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 600; opacity: 0.8; text-transform: uppercase;">SVR Constructora ERP</p>
            </div>
            <div style="padding: 24px; line-height: 1.6;">
              <p style="margin-top: 0;">Estimado <strong>Ing. Ricardo Mendoza</strong>,</p>
              <p>El operador en campo ha reportado manualmente una incidencia crítica sobre un activo que no posee sensores telemáticos:</p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 8px;">
                <tr>
                  <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-transform: uppercase;">Activo / ID</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${operatorMachine}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-transform: uppercase;">Lectura Horómetro</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${operatorHorometro || 'No reportado'} hrs</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Falla Descrita</td>
                  <td style="padding: 10px; color: #ef4444; font-weight: bold;">${operatorFalla}</td>
                </tr>
              </table>
              
              <p>Favor de programar orden de servicio correctivo de inmediato. La máquina se encuentra operando en el sitio de obra correspondiente a su asignación.</p>
            </div>
          </div>
        `
      });
    }

    setOperatorHorometro('');
    setOperatorFalla('');
    showToast('🚀 Reporte enviado correctamente a Oficina Central.', 'success');
  };

  const renderScreen = () => {
    if (!role) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
           <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-xl shadow-primary/30">
              <Smartphone className="text-white w-10 h-10" />
           </div>
           <div>
              <h3 className="text-2xl font-black text-slate-900">SVR Móvil</h3>
              <p className="text-slate-500 text-sm font-medium">Selecciona un rol para probar el prototipo.</p>
           </div>
           <div className="grid grid-cols-3 gap-2.5 w-full">
               {[
                 { id: 'Trabajador', label: 'Trabajador (GPS)', icon: MapPin, color: 'bg-emerald-600' },
                 { id: 'Dueno', label: 'Dueño', icon: Crown, color: 'bg-amber-500' },
                 { id: 'Ingeniero', label: 'Ingeniero', icon: HardHat, color: 'bg-cyan-500' },
                 { id: 'Checador', label: 'Checador', icon: ClipboardCheck, color: 'bg-purple-500' },
                 { id: 'Operador', label: 'Operador', icon: User, color: 'bg-green-500' },
                 { id: 'Mecanico', label: 'Mecánico', icon: Wrench, color: 'bg-blue-500' },
                 { id: 'Pipero', label: 'Pipero', icon: Fuel, color: 'bg-orange-500' },
               ].map(r => (
                 <button 
                   key={r.id}
                   onClick={() => setRole(r.id as Role)}
                   className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
                 >
                    <div className={`${r.color} p-2 rounded-lg text-white`}>
                       <r.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-700 text-center leading-tight">{r.label}</span>
                 </button>
               ))}
            </div>
        </div>
      );
    }

    // Header for all screens
    const Header = () => (
      <div className="p-6 pb-2 flex items-center justify-between">
         <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bienvenido,</p>
            <h4 className="text-lg font-black text-slate-900">{role} SVR</h4>
         </div>
         <button onClick={() => setRole(null)} className="p-2 bg-slate-100 rounded-full text-slate-400">
            <LogOut className="w-4 h-4" />
         </button>
      </div>
    );

    // TRABAJADOR (MARCAJE GPS) SCREEN
    if (role === 'Trabajador') {
      return (
        <div className="h-full flex flex-col">
          <Header />
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            
            {/* Worker Selector */}
            <div className="bg-slate-900 rounded-3xl p-4 text-white shadow-lg shadow-slate-900/30 relative overflow-hidden">
              <p className="text-[9px] font-black uppercase text-emerald-400 mb-1">Mi Identidad</p>
              <select
                value={workerName}
                onChange={e => {
                  setWorkerName(e.target.value);
                  setWorkerCheckedIn(false);
                }}
                className="bg-transparent border-0 border-b border-white/20 text-white font-black text-sm focus:outline-none w-full py-1 appearance-none cursor-pointer outline-none"
              >
                <option className="text-slate-900" value="Juan Pérez">Juan Pérez — Oficial de Albañilería</option>
                <option className="text-slate-900" value="Pedro Gómez">Pedro Gómez — Operador de Retro</option>
                <option className="text-slate-900" value="Luis Torres">Luis Torres — Chofer de Volteo</option>
                <option className="text-slate-900" value="Ana Martínez">Ana Martínez — Administradora de Obra</option>
              </select>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[10px]">
                <span className="text-white/60">Obra asignada:</span>
                <span className="font-bold text-white">{workerObra}</span>
              </div>
            </div>

            {/* Simulated GPS Location State */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" /> GPS del Teléfono
                </span>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Señal Satelital Fuerte
                </span>
              </div>

              {/* Simulation Mode Toggle */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setWorkerGpsMode('en_sitio')}
                  className={`py-1.5 px-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                    workerGpsMode === 'en_sitio' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  ✓ En Obra (24m)
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerGpsMode('fuera_sitio')}
                  className={`py-1.5 px-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                    workerGpsMode === 'fuera_sitio' 
                      ? 'bg-red-600 text-white shadow-sm' 
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  ⚠️ Fuera (4.2km)
                </button>
              </div>

              <p className="text-[9px] text-slate-400 font-mono pt-0.5">
                {workerGpsMode === 'en_sitio' 
                  ? 'Lat: 19.3423, Lng: -99.1841 (±6m)'
                  : 'Lat: 19.3780, Lng: -99.1720 (±14m)'}
              </p>
            </div>

            {/* Check-In Action or Result */}
            {!workerCheckedIn ? (
              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
                    setWorkerCheckInTime(timeStr);
                    setWorkerCheckedIn(true);

                    if (workerGpsMode === 'en_sitio') {
                      showToast(`📍 Entrada de ${workerName} registrada con GPS (En sitio).`, 'success');
                      addNotification({
                        titulo: `Asistencia Móvil: ${workerName}`,
                        mensaje: `Marcó entrada a las ${timeStr} en ${workerObra} (En sitio - radio 2km).`,
                        tipo: 'info'
                      });
                    } else {
                      showToast(`⚠️ ALERTA: ${workerName} marcó fuera del radio de 2km (4.2 km).`, 'error');
                      addNotification({
                        titulo: `⚠️ Alerta Geocerca: ${workerName}`,
                        mensaje: `Marcaje sospechoso a 4.2 km de distancia de ${workerObra}.`,
                        tipo: 'alerta'
                      });
                    }
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MapPin className="w-4 h-4" /> Marcar Entrada Ordinaria
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const now = new Date();
                      const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
                      setWorkerCheckInTime(timeStr);
                      setWorkerCheckedIn(true);
                      showToast(`🏁 Salida de ${workerName} registrada a las ${timeStr}.`, 'info');
                    }}
                    className="py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-2xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Clock className="w-3.5 h-3.5" /> Marcar Salida
                  </button>

                  <button
                    onClick={() => {
                      const now = new Date();
                      const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
                      setWorkerCheckInTime(timeStr);
                      setWorkerCheckedIn(true);
                      showToast(`🔥 Turno extra iniciado para ${workerName} a las ${timeStr}.`, 'success');
                      addNotification({
                        titulo: `Horas Extra: ${workerName}`,
                        mensaje: `Inició jornada extraordinaria a las ${timeStr} en ${workerObra}.`,
                        tipo: 'info'
                      });
                    }}
                    className="py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-2xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/20"
                  >
                    <Flame className="w-3.5 h-3.5" /> + Horas Extra
                  </button>
                </div>

                <p className="text-[8px] text-slate-400 text-center font-medium leading-tight">
                  Radio de tolerancia satelital configurado a 2 km a la redonda para frentes de obra amplios.
                </p>
              </div>
            ) : (
              <div className={`p-4 rounded-3xl text-center space-y-2 border ${
                workerGpsMode === 'en_sitio' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                  : 'bg-red-50 border-red-200 text-red-950'
              }`}>
                <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${
                  workerGpsMode === 'en_sitio' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white animate-bounce'
                }`}>
                  {workerGpsMode === 'en_sitio' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>

                <div>
                  <h6 className="font-black text-xs uppercase tracking-wide">
                    {workerGpsMode === 'en_sitio' ? '¡Marcaje Validado en Sitio!' : '⚠️ Alerta de Geocerca (>2km)'}
                  </h6>
                  <p className="text-[11px] font-bold text-slate-700 mt-1">
                    Registrado a las {workerCheckInTime}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-tight">
                    {workerGpsMode === 'en_sitio'
                      ? `Se verificó que estás dentro del polígono de 2 km de ${workerObra} (a 24m).`
                      : `Tu ubicación está a 4.2 km de la obra. Supera el radio permitido de 2 km.`}
                  </p>
                </div>

                <button
                  onClick={() => setWorkerCheckedIn(false)}
                  className="mt-2 text-[9px] font-black uppercase tracking-wider text-slate-600 hover:underline pt-2"
                >
                  ↺ Marcar otra vez (Prueba)
                </button>
              </div>
            )}

          </div>
        </div>
      );
    }

    // MECHANIC SCREEN
    if (role === 'Mecanico') {
      return (
        <div className="h-full flex flex-col">
           <Header />
           <div className="flex-1 p-6 space-y-4">
              <div className="bg-blue-600 rounded-3xl p-5 text-white shadow-lg shadow-blue-500/20">
                 <p className="text-[10px] font-black uppercase opacity-60">Tarea Pendiente</p>
                 <h5 className="text-lg font-bold mt-1 leading-tight">Reparación de Oruga - CAT 320</h5>
                 <div className="flex items-center gap-2 mt-4 text-[10px] font-black uppercase bg-white/20 w-fit px-2 py-1 rounded">
                    <MapPin className="w-3 h-3" /> Valle Sur
                 </div>
              </div>

              <h6 className="font-black text-slate-400 uppercase text-[10px] tracking-widest pt-2">Opciones</h6>
              <div className="grid grid-cols-2 gap-3">
                 <button className="flex flex-col items-center gap-3 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <Camera className="w-6 h-6 text-blue-500" />
                    <span className="text-[10px] font-black uppercase text-slate-600">Subir Evidencia</span>
                 </button>
                 <button className="flex flex-col items-center gap-3 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <Wrench className="w-6 h-6 text-blue-500" />
                    <span className="text-[10px] font-black uppercase text-slate-600">Finalizar</span>
                 </button>
              </div>
           </div>
        </div>
      );
    }

    // OPERATOR SCREEN
    if (role === 'Operador') {
      return (
        <div className="h-full flex flex-col">
           <Header />
           <div className="flex-1 p-6 space-y-4">
              <div className="bg-slate-900 rounded-3xl p-5 text-white overflow-hidden relative">
                 <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase text-white/50 mb-1">Mi Máquina Asignada</p>
                    <select 
                      value={operatorMachine}
                      onChange={e => setOperatorMachine(e.target.value)}
                      className="bg-transparent border-0 border-b border-white/20 text-white font-black text-sm focus:outline-none focus:border-primary w-full py-1 leading-none appearance-none cursor-pointer outline-none"
                    >
                      <option className="text-slate-900" value="M001">M001 — CAT 320</option>
                      <option className="text-slate-900" value="M002">M002 — JD 310L</option>
                      <option className="text-slate-900" value="M003">M003 — Liebherr</option>
                      <option className="text-slate-900" value="M004">M004 — Kenworth</option>
                    </select>
                 </div>
                 <Droplets className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
              </div>

              {/* Pre-operational Checklist Widget */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" /> Checklist Pre-operacional Matutino
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    30 Segundos
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700">Aceite Motor:</span>
                    <span className="text-emerald-600 font-black">✓ Correcto</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700">Hidráulico:</span>
                    <span className="text-emerald-600 font-black">✓ Correcto</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700">Fugas Visibles:</span>
                    <span className="text-emerald-600 font-black">Sin Fugas</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700">Orugas/Llantas:</span>
                    <span className="text-emerald-600 font-black">✓ Óptimo</span>
                  </div>
                </div>
              </div>

              {/* Physical Horometer Input */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Lectura Horómetro Cabina</label>
                <input 
                  type="number" 
                  value={operatorHorometro}
                  onChange={e => setOperatorHorometro(e.target.value)}
                  placeholder="Ej: 1245.5"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary bg-slate-50 focus:bg-white transition-all text-slate-800"
                />
              </div>

              {/* Failure Input */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Reportar Falla Mecánica (Opcional)</label>
                <textarea 
                  value={operatorFalla}
                  onChange={e => setOperatorFalla(e.target.value)}
                  placeholder="Si hay anomalía detállala aquí..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary resize-none bg-slate-50 focus:bg-white transition-all text-slate-800"
                />
              </div>

              <button 
                onClick={handleOperatorSubmit}
                className="w-full py-3.5 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-3 cursor-pointer hover:bg-primary-dark transition-all transform active:scale-98"
              >
                 Enviar Checklist e Inicio de Turno
              </button>
           </div>
        </div>
      );
    }

    // PIPERO SCREEN
    if (role === 'Pipero') {
      return (
        <div className="h-full flex flex-col">
           <Header />
           <div className="flex-1 p-6 space-y-4">
              <h6 className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Ruta de Suministro</h6>
              <div className="space-y-3">
                 {[
                   { id: 'M001', obra: 'Valle Sur', status: 'Esperando', litros: 150 },
                   { id: 'M004', obra: 'Valle Sur', status: 'Atendido', litros: 200 }
                 ].map(m => (
                   <div key={m.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${m.status === 'Atendido' ? 'bg-green-500' : 'bg-orange-500'} text-white`}>
                            <Fuel className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-900">{m.id}</p>
                            <p className="text-[10px] font-bold text-slate-400">{m.obra}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-900">{m.litros} L</p>
                         <p className="text-[8px] font-bold text-slate-400 uppercase">{m.status}</p>
                      </div>
                   </div>
                 ))}
              </div>
              <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                 + Nueva Carga
              </button>
           </div>
        </div>
      );
    }

    // DUENO SCREEN
    if (role === 'Dueno') {
      return (
        <div className="h-full flex flex-col">
           <Header />
           <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-2">
                 <div className="bg-amber-500 rounded-2xl p-3 text-white">
                    <p className="text-[8px] font-black uppercase opacity-70">Obras Activas</p>
                    <p className="text-2xl font-black">4</p>
                    <div className="flex items-center gap-1 mt-1">
                       <TrendingUp className="w-3 h-3 opacity-70" />
                       <p className="text-[8px] opacity-70">+1 este mes</p>
                    </div>
                 </div>
                 <div className="bg-slate-900 rounded-2xl p-3 text-white">
                    <p className="text-[8px] font-black uppercase opacity-70">Maquinaria</p>
                    <p className="text-2xl font-black">11</p>
                    <div className="flex items-center gap-1 mt-1">
                       <div className="w-2 h-2 rounded-full bg-green-400" />
                       <p className="text-[8px] opacity-70">9 activas</p>
                    </div>
                 </div>
              </div>

              {/* Budget Overview */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                 <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Costo vs Presupuesto</p>
                    <DollarSign className="w-3 h-3 text-amber-500" />
                 </div>
                 {[
                   { obra: 'Valle Sur', pct: 68, color: 'bg-green-500' },
                   { obra: 'Lerma Norte', pct: 88, color: 'bg-orange-400' },
                   { obra: 'Toluca C2', pct: 45, color: 'bg-green-500' },
                 ].map(o => (
                   <div key={o.obra} className="mb-2">
                      <div className="flex justify-between text-[8px] font-black text-slate-600 mb-0.5">
                         <span>{o.obra}</span>
                         <span>{o.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className={`h-full ${o.color} rounded-full`} style={{ width: `${o.pct}%` }} />
                      </div>
                   </div>
                 ))}
              </div>

              {/* Critical Alerts */}
              <div className="space-y-2">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alertas Críticas</p>
                 <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <div className="p-1.5 bg-red-500 rounded-lg text-white">
                       <AlertTriangle className="w-3 h-3" />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-900">CAT 336 detenida</p>
                       <p className="text-[8px] text-slate-400">Lerma Norte · hace 2h</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                    <div className="p-1.5 bg-orange-500 rounded-lg text-white">
                       <Fuel className="w-3 h-3" />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-900">Stock diesel crítico</p>
                       <p className="text-[8px] text-slate-400">Valle Sur · 180 L restantes</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      );
    }

    // INGENIERO SCREEN
    if (role === 'Ingeniero') {
      return (
        <div className="h-full flex flex-col">
           <Header />
           <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {/* Obra actual */}
              <div className="bg-cyan-600 rounded-2xl p-4 text-white">
                 <p className="text-[8px] font-black uppercase opacity-60">Mi Obra</p>
                 <h5 className="text-base font-black leading-tight mt-0.5">Valle Sur — Etapa 3</h5>
                 <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-white/10 rounded-xl p-2 text-center">
                       <p className="text-lg font-black">14</p>
                       <p className="text-[7px] font-black uppercase opacity-70">Trabajad.</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2 text-center">
                       <p className="text-lg font-black">5</p>
                       <p className="text-[7px] font-black uppercase opacity-70">Máquinas</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2 text-center">
                       <p className="text-lg font-black">72%</p>
                       <p className="text-[7px] font-black uppercase opacity-70">Avance</p>
                    </div>
                 </div>
              </div>

              {/* Pendientes del día */}
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Pendientes Hoy</p>
                 <div className="space-y-2">
                    {[
                      { task: 'Validar asistencia matutina', done: true },
                      { task: 'Aprobar reporte de avance', done: false },
                      { task: 'Revisar ticket mecánico #47', done: false },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                         <div className={`w-4 h-4 rounded-full flex items-center justify-center ${t.done ? 'bg-green-500' : 'border-2 border-slate-300'}`}>
                            {t.done && <CheckCircle className="w-3 h-3 text-white" />}
                         </div>
                         <p className={`text-[9px] font-bold ${t.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.task}</p>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Workers / Asistencia */}
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Equipo en Campo</p>
                 <div className="space-y-1.5">
                    {[
                      { name: 'J. Ramírez', role: 'Operador', status: 'Activo' },
                      { name: 'M. Torres', role: 'Mecánico', status: 'En tarea' },
                      { name: 'C. López', role: 'Pipero', status: 'Activo' },
                    ].map((w, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-cyan-100 rounded-full flex items-center justify-center">
                               <Users className="w-3 h-3 text-cyan-600" />
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-slate-900">{w.name}</p>
                               <p className="text-[8px] text-slate-400">{w.role}</p>
                            </div>
                         </div>
                         <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                           w.status === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                         }`}>{w.status}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <button className="w-full py-3 bg-cyan-600 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2">
                 <FileText className="w-4 h-4" />
                 Enviar Reporte de Avance
              </button>
           </div>
        </div>
      );
    }

    // CHECADOR SCREEN
    if (role === 'Checador') {
      const workers = [
        { name: 'J. Ramírez', puesto: 'Operador', present: true },
        { name: 'M. Torres', puesto: 'Mecánico', present: true },
        { name: 'C. López', puesto: 'Pipero', present: false },
        { name: 'R. Soto', puesto: 'Operador', present: true },
      ];
      const confirmed = workers.filter(w => w.present).length;

      return (
        <div className="h-full flex flex-col">
           <Header />
           <div className="flex-1 p-4 space-y-3 overflow-y-auto">

              {/* Turno Banner */}
              <div className="bg-purple-600 rounded-2xl p-4 text-white">
                 <p className="text-[8px] font-black uppercase opacity-60">Turno Matutino</p>
                 <h5 className="text-base font-black leading-tight mt-0.5">Valle Sur — 28 Abr</h5>
                 <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-white/15 rounded-xl p-2 text-center">
                       <p className="text-xl font-black">{confirmed}</p>
                       <p className="text-[7px] font-black uppercase opacity-70">Confirmados</p>
                    </div>
                    <div className="bg-white/15 rounded-xl p-2 text-center">
                       <p className="text-xl font-black">{workers.length - confirmed}</p>
                       <p className="text-[7px] font-black uppercase opacity-70">Faltas</p>
                    </div>
                 </div>
              </div>

              {/* Lista de Asistencia */}
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Lista de Asistencia</p>
                 <div className="space-y-1.5">
                    {workers.map((w, i) => (
                      <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        w.present
                          ? 'bg-green-50 border-green-100'
                          : 'bg-red-50 border-red-100'
                      }`}>
                         <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              w.present ? 'bg-green-500' : 'bg-red-400'
                            } text-white`}>
                               <Users className="w-3 h-3" />
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-slate-900">{w.name}</p>
                               <p className="text-[8px] text-slate-400">{w.puesto}</p>
                            </div>
                         </div>
                         <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                           w.present
                             ? 'bg-green-100 text-green-700'
                             : 'bg-red-100 text-red-600'
                         }`}>
                           {w.present ? '✓ Presente' : '✗ Falta'}
                         </span>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Horómetro */}
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Horómetro Inicial</p>
                 <div className="space-y-1.5">
                    {[
                      { id: 'M001', model: 'CAT 320', hrs: '4,821' },
                      { id: 'M004', model: 'CAT 336', hrs: '3,102' },
                    ].map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                         <div>
                            <p className="text-[9px] font-black text-slate-900">{m.id} — {m.model}</p>
                         </div>
                         <div className="flex items-center gap-1 bg-purple-50 border border-purple-100 px-2 py-1 rounded-lg">
                            <p className="text-[9px] font-black text-purple-700">{m.hrs} hrs</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <button className="w-full py-3 bg-purple-600 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2">
                 <ClipboardCheck className="w-4 h-4" />
                 Cerrar Turno
              </button>
           </div>
        </div>
      );
    }

    return <div className="p-8 text-center text-slate-400">Sin pantalla definida</div>;
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-8">
      {/* Explanation Side */}
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Simulador de Experiencia Móvil</h1>
          <p className="text-slate-500 font-medium">Demostración de cómo cada usuario ve el sistema según su rol en el campo.</p>
        </div>

        <div className="space-y-4">
           <div className="card bg-primary/5 border-primary/10">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                 <CheckCircle className="w-5 h-5 text-primary" />
                 ¿Por qué esto elimina el WhatsApp?
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                 Cada rol ve solo lo que necesita. El Dueño tiene KPIs ejecutivos. El Ingeniero gestiona su obra y equipo. El Operador conoce su máquina. Todo fluye sin mensajes manuales.
              </p>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <div className="card p-4">
                 <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Dueño</p>
                 <p className="text-xs font-medium text-slate-600">Vista ejecutiva: costos, alertas y rentabilidad de todas las obras.</p>
              </div>
              <div className="card p-4">
                 <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">Ingeniero</p>
                 <p className="text-xs font-medium text-slate-600">Gestiona su obra, equipo en campo y reportes de avance.</p>
              </div>
              <div className="card p-4">
                 <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">Checador</p>
                 <p className="text-xs font-medium text-slate-600">Pasa lista, registra horómetros y cierra el turno digitalmente.</p>
              </div>
              <div className="card p-4">
                 <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Operador</p>
                 <p className="text-xs font-medium text-slate-600">Ve el estado de su máquina y reporta fallas con GPS.</p>
              </div>
              <div className="card p-4">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Mecánico</p>
                 <p className="text-xs font-medium text-slate-600">Sube fotos de reparaciones y cierra tickets.</p>
              </div>
              <div className="card p-4">
                 <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Pipero</p>
                 <p className="text-xs font-medium text-slate-600">Registra litros exactos y ubicación de cada carga.</p>
              </div>
           </div>
        </div>
      </div>

      {/* Phone Simulator Side */}
      <div className="flex items-center justify-center lg:w-[450px]">
        <div className="relative w-[320px] h-[640px] bg-slate-900 rounded-[3rem] p-3 shadow-[0_0_100px_rgba(0,0,0,0.1)] border-[8px] border-slate-800">
           {/* Screen */}
           <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden relative flex flex-col">
              {/* Status Bar */}
              <div className="h-8 w-full flex items-center justify-between px-8 shrink-0">
                 <span className="text-[10px] font-bold">9:41</span>
                 <div className="flex gap-1.5 items-center">
                    <SignalHigh className="w-3 h-3" />
                    <div className="w-4 h-2 border border-slate-900 rounded-[2px] relative">
                       <div className="absolute inset-[1px] bg-slate-900 w-[60%]" />
                    </div>
                 </div>
              </div>

              {/* Dynamic Content */}
              <div className="flex-1 overflow-y-auto">
                 {renderScreen()}
              </div>

              {/* Home Indicator */}
              <div className="h-6 w-full flex items-center justify-center shrink-0">
                 <div className="w-24 h-1 bg-slate-200 rounded-full" />
              </div>
           </div>

           {/* Buttons */}
           <div className="absolute -right-2 top-24 w-1.5 h-12 bg-slate-800 rounded-l" />
           <div className="absolute -left-2 top-24 w-1.5 h-20 bg-slate-800 rounded-r" />
        </div>
      </div>
    </div>
  );
}

function SignalHigh(props: any) {
   return (
      <svg {...props} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 20V4"/></svg>
   )
}
