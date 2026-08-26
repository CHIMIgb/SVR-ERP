"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, MapPin, UserX, Search,
  ShieldCheck, ShieldAlert, Smartphone,
  Navigation, Compass,
  AlertTriangle, Flame, ArrowRight, UserMinus,
  Check, CalendarDays,
  Users, Zap, Loader2, AlertCircle, LocateFixed
} from 'lucide-react';
import {
  asistenciaApi,
  trabajadoresApi,
  type RegistroAsistenciaDTO,
  type AsistenciaSemanalDTO,
  type TrabajadorDTO,
  type ObraLite,
} from '@/lib/api';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import AsistenciaGpsModal from '@/components/workers/AsistenciaGpsModal';
import Modal, { ModalField, inputClass, selectClass } from '@/components/layout/Modal';

/** Punto de referencia usado solo cuando una obra aún no tiene coordenadas configuradas. */
const FALLBACK_COORD = { lat: 19.3421, lng: -99.1843 };

const CATEGORIA_PILLS = [
  { id: 'Todos', label: 'Todos los Puestos' },
  { id: 'Operador', label: '🚜 Operadores' },
  { id: 'Chofer', label: '🚚 Choferes' },
  { id: 'Mecanico', label: '🔧 Mecánicos' },
  { id: 'Ingeniero', label: '📐 Ingenieros' },
  { id: 'Administrativo', label: '💼 Administración' },
] as const;

export default function AsistenciaPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const router = useRouter();

  const vista = user?.vistas?.find((v) => v.ruta === '/asistencia');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;

  const [trabajadores, setTrabajadores] = useState<TrabajadorDTO[]>([]);
  const [obras, setObras] = useState<ObraLite[]>([]);
  const [registros, setRegistros] = useState<RegistroAsistenciaDTO[]>([]);
  const [semanalData, setSemanalData] = useState<AsistenciaSemanalDTO[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const [search, setSearch] = useState('');
  const [mainView, setMainView] = useState<'asistencia' | 'calendario_semanal' | 'horas_extra' | 'faltas'>('asistencia');
  const [selectedRole, setSelectedRole] = useState<string>('Todos');
  const [filterGeocerca, setFilterGeocerca] = useState<'Todos' | 'EnSitio' | 'FueraSitio' | 'Puntual' | 'Retardo' | 'SalidaAnticipada'>('Todos');

  // Modal de inspección GPS
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroAsistenciaDTO | null>(null);

  // Modal de marcaje móvil (entrada / salida / horas extra)
  const [clockInModalOpen, setClockInModalOpen] = useState(false);
  const [clockInType, setClockInType] = useState<'entrada' | 'salida' | 'horas_extra'>('entrada');
  const [clockInWorkerId, setClockInWorkerId] = useState('');
  const [clockInObraId, setClockInObraId] = useState('');

  // Modal de pase de lista por cuadrilla
  const [cuadrillaModalOpen, setCuadrillaModalOpen] = useState(false);
  const [cuadrillaObraId, setCuadrillaObraId] = useState('');
  const [selectedCuadrillaWorkers, setSelectedCuadrillaWorkers] = useState<string[]>([]);

  // Salida anticipada
  const [isEarlyDeparture, setIsEarlyDeparture] = useState(false);
  const [earlyDepartureReason, setEarlyDepartureReason] = useState('');
  const [earlyDepartureHours, setEarlyDepartureHours] = useState('5.5');

  // Horas extra
  const [extraHoursInput, setExtraHoursInput] = useState('3.0');
  const [extraMotivo, setExtraMotivo] = useState('');

  // Ubicación GPS real del dispositivo (con respaldo manual)
  const [ubicacionGps, setUbicacionGps] = useState<{ lat: number; lng: number; precisionGpsMetros: number } | null>(null);
  const [ubicacionEstado, setUbicacionEstado] = useState<'idle' | 'obteniendo' | 'ok' | 'error'>('idle');
  const [usarCoordenadasManuales, setUsarCoordenadasManuales] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchTrabajadores = useCallback(async () => {
    const res = await trabajadoresApi.listar({ limit: 100 });
    if (res.success) setTrabajadores(res.data.items);
  }, []);

  const fetchObras = useCallback(async () => {
    const res = await asistenciaApi.obras();
    if (res.success) {
      setObras(res.data);
      setClockInObraId((prev) => prev || res.data[0]?.id || '');
      setCuadrillaObraId((prev) => prev || res.data[0]?.id || '');
    }
  }, []);

  const fetchRegistros = useCallback(async () => {
    const res = await asistenciaApi.listar({ limit: 200 });
    if (res.success) {
      setRegistros(res.data.items);
      setErrorCarga(null);
    } else {
      setErrorCarga(res.error.message);
    }
  }, []);

  const fetchSemanal = useCallback(async () => {
    const res = await asistenciaApi.semanal();
    if (res.success) setSemanalData(res.data);
  }, []);

  const refetchAll = useCallback(async () => {
    await Promise.all([fetchRegistros(), fetchSemanal()]);
  }, [fetchRegistros, fetchSemanal]);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchTrabajadores(), fetchObras(), fetchRegistros(), fetchSemanal()]);
      hasLoaded.current = true;
      setInitialLoading(false);
    })();
  }, [fetchTrabajadores, fetchObras, fetchRegistros, fetchSemanal]);

  useEffect(() => {
    if (trabajadores.length > 0 && !clockInWorkerId) setClockInWorkerId(trabajadores[0].id);
  }, [trabajadores, clockInWorkerId]);

  const solicitarUbicacion = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setUbicacionEstado('error');
      return;
    }
    setUbicacionEstado('obteniendo');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacionGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, precisionGpsMetros: Math.round(pos.coords.accuracy) });
        setUbicacionEstado('ok');
      },
      () => setUbicacionEstado('error'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (clockInModalOpen || cuadrillaModalOpen) {
      setUsarCoordenadasManuales(false);
      solicitarUbicacion();
    } else {
      setUbicacionEstado('idle');
      setUbicacionGps(null);
    }
  }, [clockInModalOpen, cuadrillaModalOpen, solicitarUbicacion]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Puntual': return 'bg-green-500 text-white';
      case 'Retardo': return 'bg-yellow-500 text-slate-950 font-black';
      case 'Falta': return 'bg-red-500 text-white';
      case 'No Presentado': return 'bg-red-100 text-red-700 border border-red-200 font-black';
      case 'Salida Anticipada': return 'bg-amber-100 text-amber-900 border border-amber-300 font-black';
      case 'Justificado': return 'bg-blue-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  const registeredWorkerIds = new Set(registros.map((r) => r.trabajadorId));
  const missingWorkers = trabajadores.filter((t) => t.estado === 'Activo' && !registeredWorkerIds.has(t.id));

  const enSitioCount = registros.filter((r) => r.enSitio).length;
  const fueraSitioCount = registros.filter((r) => !r.enSitio).length;
  const salidasAnticipadasCount = registros.filter((r) => r.salidaAnticipada || r.estado === 'Salida Anticipada').length;
  const totalHorasExtras = registros.reduce((sum, r) => sum + (r.horasExtra?.horasCalculadas ?? 0), 0);
  const totalMontoHorasExtras = registros.reduce((sum, r) => sum + (r.horasExtra?.montoTotal ?? 0), 0);

  const filteredRegistros = registros.filter((reg) => {
    const trabajador = trabajadores.find((t) => t.id === reg.trabajadorId);
    const matchSearch =
      trabajador?.nombre.toLowerCase().includes(search.toLowerCase()) ||
      trabajador?.puesto.toLowerCase().includes(search.toLowerCase()) ||
      reg.obraAsignada.toLowerCase().includes(search.toLowerCase()) ||
      reg.ubicacion.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (selectedRole !== 'Todos' && trabajador?.categoriaPuesto !== selectedRole) return false;
    if (filterGeocerca === 'EnSitio') return reg.enSitio;
    if (filterGeocerca === 'FueraSitio') return !reg.enSitio;
    if (filterGeocerca === 'Puntual') return reg.estado === 'Puntual';
    if (filterGeocerca === 'Retardo') return reg.estado === 'Retardo';
    if (filterGeocerca === 'SalidaAnticipada') return reg.salidaAnticipada || reg.estado === 'Salida Anticipada';
    return true;
  });

  const obraSeleccionadaEntrada = obras.find((o) => o.id === clockInObraId);
  const obraSeleccionadaCuadrilla = obras.find((o) => o.id === cuadrillaObraId);

  const resolverCoordenadasDispositivo = (): { lat: number; lng: number; precisionGpsMetros: number } | null => {
    if (usarCoordenadasManuales) {
      const lat = parseFloat(manualLat);
      const lng = parseFloat(manualLng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      return { lat, lng, precisionGpsMetros: 0 };
    }
    return ubicacionGps;
  };

  const handleActualizarEstado = async (registroId: string, nuevoEstado: 'Puntual' | 'Retardo' | 'Falta' | 'Justificado') => {
    const res = await asistenciaApi.actualizarEstado(registroId, nuevoEstado);
    if (!res.success) throw new Error(res.error.message);
    setSelectedRegistro(res.data);
    await refetchAll();
  };

  const handleAprobarHorasExtra = async (horasExtraId: string) => {
    const res = await asistenciaApi.aprobarHorasExtra(horasExtraId);
    if (!res.success) throw new Error(res.error.message);
    setSelectedRegistro((prev) => (prev && prev.id === res.data.id ? res.data : prev));
    await refetchAll();
  };

  const handleRegistrarFalta = async (workerId: string) => {
    const worker = trabajadores.find((t) => t.id === workerId);
    const res = await asistenciaApi.registrarFalta({ trabajadorId: workerId });
    if (!res.success) {
      showToast(res.error.message, 'error');
      return;
    }
    showToast(`❌ Falta registrada para ${worker?.nombre}. Se descontará en nómina.`, 'error');
    await refetchAll();
  };

  const handleCuadrillaSubmit = async () => {
    const coords = resolverCoordenadasDispositivo();
    if (!coords) {
      showToast('No se pudo obtener la ubicación GPS. Actívala o ingresa coordenadas manualmente.', 'error');
      return;
    }
    if (selectedCuadrillaWorkers.length === 0) {
      showToast('Selecciona al menos un trabajador.', 'error');
      return;
    }
    const obra = obraSeleccionadaCuadrilla;
    setSubmitting(true);
    try {
      const res = await asistenciaApi.marcarCuadrilla({
        obraId: cuadrillaObraId,
        obraLat: obra?.lat ?? FALLBACK_COORD.lat,
        obraLng: obra?.lng ?? FALLBACK_COORD.lng,
        radioPermitidoMetros: obra?.radioPermitidoMetros ?? 2000,
        trabajadorIds: selectedCuadrillaWorkers,
        lat: coords.lat,
        lng: coords.lng,
        precisionGpsMetros: coords.precisionGpsMetros,
        dispositivo: 'Dispositivo Residente / Cabo SVR',
      });
      if (!res.success) throw new Error(res.error.message);
      setCuadrillaModalOpen(false);
      showToast(
        `✅ Pase de lista completado: ${res.data.creados.length} trabajadores registrados${
          res.data.omitidos.length ? ` (${res.data.omitidos.length} ya tenían marcaje hoy)` : ''
        }.`,
        'success',
      );
      await refetchAll();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo completar el pase de lista.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockInSubmit = async () => {
    const coords = resolverCoordenadasDispositivo();
    if (!coords) {
      showToast('No se pudo obtener la ubicación GPS. Actívala o ingresa coordenadas manualmente.', 'error');
      return;
    }
    const worker = trabajadores.find((t) => t.id === clockInWorkerId);
    setSubmitting(true);
    try {
      if (clockInType === 'entrada') {
        const obra = obraSeleccionadaEntrada;
        const res = await asistenciaApi.marcarEntrada({
          trabajadorId: clockInWorkerId,
          obraId: clockInObraId,
          obraLat: obra?.lat ?? FALLBACK_COORD.lat,
          obraLng: obra?.lng ?? FALLBACK_COORD.lng,
          radioPermitidoMetros: obra?.radioPermitidoMetros ?? 2000,
          lat: coords.lat,
          lng: coords.lng,
          precisionGpsMetros: coords.precisionGpsMetros,
          dispositivo: 'Dispositivo Móvil · GPS Activo',
        });
        if (!res.success) throw new Error(res.error.message);
        showToast(
          res.data.enSitio
            ? `📍 Entrada de ${worker?.nombre} registrada (en sitio).`
            : `⚠️ ALERTA: ${worker?.nombre} marcó fuera del radio permitido de la obra.`,
          res.data.enSitio ? 'success' : 'error',
        );
      } else if (clockInType === 'salida') {
        const horas = isEarlyDeparture ? parseFloat(earlyDepartureHours) : undefined;
        const res = await asistenciaApi.marcarSalida({
          trabajadorId: clockInWorkerId,
          lat: coords.lat,
          lng: coords.lng,
          precisionGpsMetros: coords.precisionGpsMetros,
          dispositivo: 'Dispositivo Móvil · GPS Activo',
          salidaAnticipada: isEarlyDeparture,
          motivoSalidaAnticipada: isEarlyDeparture ? earlyDepartureReason : undefined,
          horasTrabajadasOrdinarias: horas != null && !Number.isNaN(horas) ? horas : undefined,
        });
        if (!res.success) throw new Error(res.error.message);
        if (isEarlyDeparture) {
          showToast(`⚠️ Salida anticipada de ${worker?.nombre} registrada.`, 'warning');
          addNotification({
            titulo: `⚠️ Salida Anticipada: ${worker?.nombre}`,
            mensaje: `Se retiró antes del término de turno. Motivo: ${earlyDepartureReason}.`,
            tipo: 'alerta',
          });
        } else {
          showToast(`🏁 Salida de ${worker?.nombre} registrada.`, 'info');
        }
      } else {
        const existente = registros.find((r) => r.trabajadorId === clockInWorkerId);
        if (!existente) {
          showToast('Este trabajador debe marcar entrada antes de registrar horas extra.', 'error');
          setSubmitting(false);
          return;
        }
        const horas = parseFloat(extraHoursInput) || 0;
        const ahora = new Date();
        const fin = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
        const inicioDate = new Date(ahora.getTime() - horas * 3600000);
        const inicio = `${String(inicioDate.getHours()).padStart(2, '0')}:${String(inicioDate.getMinutes()).padStart(2, '0')}`;
        const res = await asistenciaApi.registrarHorasExtra(existente.id, {
          inicio,
          fin,
          horasCalculadas: horas,
          motivo: extraMotivo || undefined,
          latInicio: coords.lat,
          lngInicio: coords.lng,
          latFin: coords.lat,
          lngFin: coords.lng,
        });
        if (!res.success) throw new Error(res.error.message);
        showToast(`🔥 ${horas}h extra registradas para ${worker?.nombre}, pendientes de autorización.`, 'success');
      }
      setClockInModalOpen(false);
      await refetchAll();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo completar el marcaje.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const trabajadorSeleccionado = trabajadores.find((t) => t.id === selectedRegistro?.trabajadorId);

  if (errorCarga && !hasLoaded.current) {
    return (
      <div className="card p-8 text-center space-y-3 border border-red-200 bg-red-50">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm font-bold text-red-700">{errorCarga}</p>
        <button onClick={fetchRegistros} className="btn-primary text-xs">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── 1. HEADER EJECUTIVO ── */}
      <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl overflow-hidden border border-slate-800">

        <div className="absolute top-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                Geocerca GPS Activa
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {enSitioCount} de {trabajadores.length} Empleados en Sitio
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              Control de Asistencia Satelital
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl font-medium">
              Validación geográfica de entradas, salidas, retiros anticipados, horas extras y pase de lista por cuadrillas en frentes de obra amplios.
            </p>
          </div>

          {puedeCrear && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setClockInType('entrada');
                  setIsEarlyDeparture(false);
                  setClockInModalOpen(true);
                }}
                className="btn-primary flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20"
              >
                <Smartphone className="w-4 h-4" /> Marcar Entrada / Salida GPS
              </button>

              <button
                onClick={() => setCuadrillaModalOpen(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-white/10 backdrop-blur-md"
              >
                <Users className="w-4 h-4 text-emerald-400" /> Pase de Lista por Cuadrilla
              </button>

              <button
                onClick={() => router.push('/nomina')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
              >
                <Zap className="w-4 h-4" /> Sincronizar con Nómina
              </button>
            </div>
          )}
        </div>
      </div>

      {initialLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
      <>
      {/* ── 2. METRIC PILLARS (KPIS) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

        <div
          onClick={() => { setMainView('asistencia'); setFilterGeocerca('EnSitio'); }}
          className={`card py-4 cursor-pointer transition-all border ${
            mainView === 'asistencia' && filterGeocerca === 'EnSitio' ? 'border-green-400 bg-green-50/40 shadow-md' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-200/60 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">En Sitio</p>
              <h4 className="text-xl font-black text-slate-900">{enSitioCount} <span className="text-xs text-slate-400 font-medium">empleados</span></h4>
            </div>
          </div>
        </div>

        <div
          onClick={() => { setMainView('asistencia'); setFilterGeocerca('FueraSitio'); }}
          className={`card py-4 cursor-pointer transition-all border ${
            mainView === 'asistencia' && filterGeocerca === 'FueraSitio' ? 'border-red-400 bg-red-50/40 shadow-md' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${
              fueraSitioCount > 0 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-50 text-slate-400'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fuera de Obra</p>
              <h4 className={`text-xl font-black ${fueraSitioCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {fueraSitioCount} <span className="text-xs text-slate-400 font-medium">alertas</span>
              </h4>
            </div>
          </div>
        </div>

        <div
          onClick={() => { setMainView('asistencia'); setFilterGeocerca('SalidaAnticipada'); }}
          className={`card py-4 cursor-pointer transition-all border ${
            mainView === 'asistencia' && filterGeocerca === 'SalidaAnticipada' ? 'border-amber-400 bg-amber-50/40 shadow-md' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${
              salidasAnticipadasCount > 0 ? 'bg-amber-50 text-amber-600 border-amber-300' : 'bg-slate-50 text-slate-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Salidas Anticipadas</p>
              <h4 className="text-xl font-black text-amber-900">{salidasAnticipadasCount} <span className="text-xs text-slate-400 font-medium">alertas</span></h4>
            </div>
          </div>
        </div>

        <div
          onClick={() => setMainView('faltas')}
          className={`card py-4 cursor-pointer transition-all border ${
            mainView === 'faltas' ? 'border-red-400 bg-red-50/40 shadow-md' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center border border-red-200 shrink-0">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No Presentados Hoy</p>
              <h4 className="text-xl font-black text-red-600">{missingWorkers.length} <span className="text-xs text-slate-400 font-medium">sin checar</span></h4>
            </div>
          </div>
        </div>

        <div
          onClick={() => setMainView('horas_extra')}
          className={`card py-4 cursor-pointer transition-all border bg-gradient-to-br from-amber-50 to-orange-50 ${
            mainView === 'horas_extra' ? 'border-orange-400 shadow-md' : 'border-orange-200/70 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-orange-500/30 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-orange-700 uppercase tracking-widest">Horas Extra Hoy</p>
              <h4 className="text-xl font-black text-slate-900">{totalHorasExtras}h <span className="text-xs font-bold text-orange-600">(${totalMontoHorasExtras.toFixed(0)})</span></h4>
            </div>
          </div>
        </div>

      </div>

      {/* ── 3. MAIN VIEW SWITCHER TABS ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setMainView('asistencia')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            mainView === 'asistencia' ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" /> Jornada Diaria ({registros.length})
        </button>

        <button
          onClick={() => setMainView('calendario_semanal')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            mainView === 'calendario_semanal' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-blue-500" /> Calendario Semanal (Lun - Sáb)
        </button>

        <button
          onClick={() => setMainView('horas_extra')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            mainView === 'horas_extra' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Flame className="w-4 h-4 text-orange-500" /> Horas Extras ({totalHorasExtras}h)
        </button>

        <button
          onClick={() => setMainView('faltas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
            mainView === 'faltas' ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserMinus className="w-4 h-4 text-red-500" /> No Presentados ({missingWorkers.length})
        </button>
      </div>

      {/* ── VISTA 1: TABLA PRINCIPAL DE ASISTENCIA ── */}
      {mainView === 'asistencia' && (
        <div className="space-y-4">

          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIA_PILLS.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedRole === r.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  Bitácora de Entrada, Salida y Geocerca
                  <span className="text-xs font-black bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                    {filteredRegistros.length} registros
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Muestra la hora y coordenadas en que el trabajador inició y concluyó su turno.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar empleado u obra..."
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary/50 w-60 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: 'Todos', label: 'Todos' },
                    { id: 'EnSitio', label: '🟢 En Sitio' },
                    { id: 'FueraSitio', label: '🔴 Fuera' },
                    { id: 'SalidaAnticipada', label: '⚠️ Anticipada' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterGeocerca(f.id as typeof filterGeocerca)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        filterGeocerca === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trabajador &amp; Rol</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrada &amp; Salida</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Obra Asignada</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Horas Extras</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Geocerca</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Mapa GPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegistros.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                        Sin registros de asistencia para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : filteredRegistros.map((reg) => {
                    const trabajador = trabajadores.find((t) => t.id === reg.trabajadorId);
                    const distTxt = reg.distanciaMetros >= 1000 ? `${(reg.distanciaMetros / 1000).toFixed(2)} km` : `${reg.distanciaMetros}m`;

                    return (
                      <tr
                        key={reg.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedRegistro(reg)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-secondary text-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm">
                              {trabajador?.avatar ?? 'OP'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm leading-tight">{trabajador?.nombre ?? 'Trabajador'}</div>
                              <div className="text-[10px] font-semibold text-primary mt-0.5">{trabajador?.puesto}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <span className="text-[9px] font-black uppercase text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">Entrada</span>
                              <span>{reg.horaEntrada ?? '—'}</span>
                              {reg.horaMarcajeExacta && <span className="text-[9px] text-slate-400 font-mono">({reg.horaMarcajeExacta})</span>}
                            </div>
                            <div className="flex items-center gap-1.5 font-medium text-slate-600">
                              <span className="text-[9px] font-black uppercase text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Salida</span>
                              <span>{reg.horaSalida ?? <span className="text-blue-600 font-bold text-[11px]">En jornada activa</span>}</span>
                              {reg.salidaAnticipada && (
                                <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Anticipada</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-xs">{reg.obraAsignada}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[180px]" title={reg.ubicacion}>
                            <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                            <span className="truncate">{reg.ubicacion}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {reg.horasExtra ? (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs font-black">
                              <Flame className="w-3.5 h-3.5 text-orange-600" />
                              <span>+{reg.horasExtra.horasCalculadas}h</span>
                              <span className="text-[10px] text-orange-600 font-bold">(${reg.horasExtra.montoTotal.toFixed(0)})</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs font-bold">—</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {reg.enSitio ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-bold">
                              <ShieldCheck className="w-4 h-4 text-green-600" />
                              <span>En Sitio</span>
                              <span className="text-[10px] font-mono opacity-80">({distTxt})</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-black animate-pulse">
                              <ShieldAlert className="w-4 h-4 text-red-600" />
                              <span>Fuera de Obra</span>
                              <span className="text-[10px] font-mono text-red-700">({distTxt})</span>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${getStatusStyle(reg.estado)}`}>
                            {reg.estado}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedRegistro(reg); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white font-black text-xs uppercase tracking-wider transition-all shadow-sm"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            Ver Mapa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── VISTA 2: CALENDARIO SEMANAL (LUNES A SÁBADO) ── */}
      {mainView === 'calendario_semanal' && (
        <div className="space-y-4">

          <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-900 text-lg">Semana: {semanalData[0]?.semana ?? '—'}</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Resumen de puntualidad, faltas, retardos, salidas anticipadas y horas extras de lunes a sábado.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-800 border border-green-200 px-2 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Puntual
              </span>
              <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Retardo
              </span>
              <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 border border-red-200 px-2 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Falta
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Salida Anticipada
              </span>
              <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-200 px-2 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span> Descanso
              </span>
              <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-800 border border-orange-200 px-2 py-1 rounded-md">
                <Flame className="w-3 h-3 text-orange-600" /> + Horas Extra
              </span>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs">
                    <th className="px-6 py-4 font-black uppercase tracking-wider w-64">Trabajador</th>
                    <th className="px-4 py-4 font-black uppercase tracking-wider text-center">Lun</th>
                    <th className="px-4 py-4 font-black uppercase tracking-wider text-center">Mar</th>
                    <th className="px-4 py-4 font-black uppercase tracking-wider text-center">Mié</th>
                    <th className="px-4 py-4 font-black uppercase tracking-wider text-center">Jue</th>
                    <th className="px-4 py-4 font-black uppercase tracking-wider text-center">Vie</th>
                    <th className="px-4 py-4 font-black uppercase tracking-wider text-center">Sáb</th>
                    <th className="px-6 py-4 font-black uppercase tracking-wider text-right">Totales Semana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {semanalData.map((item) => {
                    const trabajador = trabajadores.find((t) => t.id === item.trabajadorId);
                    return (
                      <tr key={item.trabajadorId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-secondary text-white rounded-xl flex items-center justify-center font-black text-xs">
                              {trabajador?.avatar}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{trabajador?.nombre}</p>
                              <p className="text-[10px] text-slate-400">{trabajador?.puesto}</p>
                            </div>
                          </div>
                        </td>

                        {item.dias.map((d) => {
                          const isPuntual = d.estado === 'Puntual';
                          const isRetardo = d.estado === 'Retardo';
                          const isAnticipada = d.estado === 'Salida Anticipada';
                          const isDescanso = d.estado === 'Descanso';
                          const isJustificado = d.estado === 'Justificado';

                          return (
                            <td key={d.dia} className="px-3 py-3 text-center">
                              <div className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 min-h-[64px] ${
                                isPuntual ? 'bg-green-50/70 border-green-200 text-green-900' :
                                isRetardo ? 'bg-yellow-50/70 border-yellow-200 text-yellow-900' :
                                isAnticipada ? 'bg-amber-50 border-amber-300 text-amber-900' :
                                isJustificado ? 'bg-blue-50 border-blue-200 text-blue-900' :
                                isDescanso ? 'bg-slate-50 border-slate-200 text-slate-500' :
                                'bg-red-50 border-red-200 text-red-900'
                              }`}>
                                <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                                  {isPuntual ? '✓ Puntual' : isRetardo ? '⏰ Retardo' : isAnticipada ? '⚠️ Anticipada' : isJustificado ? '📋 Justif.' : isDescanso ? '· Descanso' : '✗ Falta'}
                                </span>

                                {d.horaEntrada && <span className="text-[9px] font-mono text-slate-600">{d.horaEntrada}</span>}

                                {d.horasExtra ? (
                                  <span className="text-[8px] font-black uppercase bg-orange-500 text-white px-1.5 py-0.5 rounded-full mt-0.5">
                                    +{d.horasExtra}h extra
                                  </span>
                                ) : null}
                              </div>
                            </td>
                          );
                        })}

                        <td className="px-6 py-4 text-right">
                          <div className="space-y-0.5">
                            <p className="text-xs font-black text-slate-900">
                              {item.totalDiasAsistidos}/6 días <span className="text-slate-400 font-normal">({item.totalHorasOrdinarias}h)</span>
                            </p>
                            {item.totalHorasExtra > 0 ? <p className="text-[11px] font-black text-orange-600">+{item.totalHorasExtra}h extras</p> : null}
                            {item.totalFaltas > 0 ? (
                              <p className="text-[10px] font-black text-red-600">{item.totalFaltas} falta{item.totalFaltas > 1 ? 's' : ''}</p>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── VISTA 3: DESGLOSE DE HORAS EXTRAS ── */}
      {mainView === 'horas_extra' && (
        <div className="space-y-4">
          <div className="card bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full border border-orange-400/20">
                Gestión de Tiempo Extraordinario
              </span>
              <h3 className="text-2xl font-black mt-2">{totalHorasExtras} Horas Extras Acumuladas</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">Cálculo automático vinculado a la nómina semanal de la constructora.</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-right">
              <p className="text-[10px] font-black uppercase text-white/60">Importe a Pagar</p>
              <p className="text-3xl font-black text-orange-400">${totalMontoHorasExtras.toFixed(2)}</p>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Registros de Horas Extras por Empleado</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trabajador</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Horario Extra</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Horas</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarifa</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo de Obra</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registros.filter((r) => r.horasExtra).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                        Sin horas extra registradas hoy.
                      </td>
                    </tr>
                  ) : registros.filter((r) => r.horasExtra).map((r) => {
                    const trabajador = trabajadores.find((t) => t.id === r.trabajadorId);
                    const he = r.horasExtra!;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-secondary text-white rounded-xl flex items-center justify-center text-xs font-black">
                              {trabajador?.avatar}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{trabajador?.nombre}</p>
                              <p className="text-[10px] text-slate-400">{r.obraAsignada}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-700">
                          {he.inicio} <ArrowRight className="inline w-3 h-3 text-slate-400 mx-1" /> {he.fin ?? 'En curso'}
                        </td>
                        <td className="px-6 py-4 font-black text-slate-900 text-sm">{he.horasCalculadas} hrs</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">${he.tarifaPorHora}/hr</td>
                        <td className="px-6 py-4 font-black text-green-700 text-sm">${he.montoTotal.toFixed(2)}</td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600 max-w-[200px] truncate">{he.motivo ?? 'Trabajo extraordinario'}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md ${
                            he.estado === 'Aprobado' ? 'bg-green-100 text-green-800' : he.estado === 'Rechazado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {he.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {he.estado !== 'Aprobado' && he.estado !== 'Rechazado' && puedeEditar ? (
                            <button
                              onClick={async () => {
                                try {
                                  await handleAprobarHorasExtra(he.id);
                                  showToast(`✅ Horas extra de ${trabajador?.nombre} autorizadas.`, 'success');
                                } catch (e) {
                                  showToast(e instanceof Error ? e.message : 'No se pudo autorizar.', 'error');
                                }
                              }}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-green-700 transition-colors"
                            >
                              Autorizar
                            </button>
                          ) : he.estado === 'Aprobado' ? (
                            <span className="text-[11px] font-bold text-green-700 flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" /> En Nómina
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── VISTA 4: PERSONAL NO PRESENTADO (FALTAS) ── */}
      {mainView === 'faltas' && (
        <div className="space-y-4">
          <div className="card bg-red-50 border-red-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shrink-0">
                <UserMinus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-red-950 text-lg">Personal Sin Marcaje Registrado Hoy</h4>
                <p className="text-xs text-red-700 font-medium">
                  {missingWorkers.length} empleados activos aún no han registrado entrada satelital en el sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trabajador</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Puesto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyectos Asignados</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {missingWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-green-700 font-bold text-sm">
                        🎉 ¡Excelente! Toda la plantilla laboral ha registrado asistencia hoy.
                      </td>
                    </tr>
                  ) : (
                    missingWorkers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center font-black text-xs">
                              {t.avatar}
                            </div>
                            <span className="font-bold text-slate-900 text-sm">{t.nombre}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-primary">{t.puesto}</td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-600">{t.telefono}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1 flex-wrap">
                            {t.proyectos.map((p) => (
                              <span key={p} className="text-[9px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{p}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {puedeCrear && (
                            <button
                              onClick={() => handleRegistrarFalta(t.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-colors"
                            >
                              Registrar Falta
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* GPS Validation & Map Inspection Modal */}
      {selectedRegistro && (
        <AsistenciaGpsModal
          isOpen={!!selectedRegistro}
          onClose={() => setSelectedRegistro(null)}
          registro={selectedRegistro}
          trabajador={trabajadorSeleccionado ? { nombre: trabajadorSeleccionado.nombre, puesto: trabajadorSeleccionado.puesto, avatar: trabajadorSeleccionado.avatar } : undefined}
          onActualizarEstado={puedeEditar ? handleActualizarEstado : undefined}
          onAprobarHorasExtra={puedeEditar ? handleAprobarHorasExtra : undefined}
        />
      )}

      {/* Mobile Clock-in / Overtime Simulation Modal */}
      {clockInModalOpen && (
        <Modal
          isOpen={clockInModalOpen}
          onClose={() => setClockInModalOpen(false)}
          onConfirm={handleClockInSubmit}
          title={clockInType === 'entrada' ? 'Marcar Entrada GPS' : clockInType === 'salida' ? 'Marcar Salida GPS' : 'Registrar Horas Extraordinarias'}
          confirmLabel={submitting ? 'Enviando...' : 'Enviar Registro'}
        >
          <div className="space-y-4">

            <ModalField label="Tipo de Marcaje Móvil">
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setClockInType('entrada')} className={`py-2 px-2 rounded-xl text-xs font-black uppercase transition-all ${clockInType === 'entrada' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}>
                  Entrada
                </button>
                <button type="button" onClick={() => setClockInType('salida')} className={`py-2 px-2 rounded-xl text-xs font-black uppercase transition-all ${clockInType === 'salida' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}>
                  Salida
                </button>
                <button type="button" onClick={() => setClockInType('horas_extra')} className={`py-2 px-2 rounded-xl text-xs font-black uppercase transition-all ${clockInType === 'horas_extra' ? 'bg-orange-600 text-white shadow-sm' : 'bg-orange-50 text-orange-700'}`}>
                  Horas Extra
                </button>
              </div>
            </ModalField>

            <ModalField label="Seleccionar Trabajador">
              <select value={clockInWorkerId} onChange={(e) => setClockInWorkerId(e.target.value)} className={selectClass}>
                {trabajadores.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre} — {t.puesto} ({t.categoriaPuesto})</option>
                ))}
              </select>
            </ModalField>

            {clockInType === 'entrada' && (
              <ModalField label="Obra Asignada">
                <select value={clockInObraId} onChange={(e) => setClockInObraId(e.target.value)} className={selectClass}>
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
                </select>
                {obraSeleccionadaEntrada && obraSeleccionadaEntrada.lat == null && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-1">
                    Esta obra aún no tiene coordenadas configuradas; se usará una ubicación de referencia.
                  </p>
                )}
              </ModalField>
            )}

            {/* Ubicación GPS */}
            <ModalField label="Ubicación del Dispositivo">
              <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                {!usarCoordenadasManuales ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      {ubicacionEstado === 'obteniendo' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      {ubicacionEstado === 'ok' && <LocateFixed className="w-4 h-4 text-green-600" />}
                      {ubicacionEstado === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      <span className={ubicacionEstado === 'ok' ? 'text-green-700' : ubicacionEstado === 'error' ? 'text-red-600' : 'text-slate-600'}>
                        {ubicacionEstado === 'obteniendo' && 'Obteniendo ubicación GPS...'}
                        {ubicacionEstado === 'ok' && ubicacionGps && `GPS: ${ubicacionGps.lat.toFixed(5)}, ${ubicacionGps.lng.toFixed(5)} (±${ubicacionGps.precisionGpsMetros}m)`}
                        {ubicacionEstado === 'error' && 'No se pudo obtener el GPS del dispositivo.'}
                        {ubicacionEstado === 'idle' && 'Ubicación no solicitada.'}
                      </span>
                    </div>
                    <button type="button" onClick={solicitarUbicacion} className="text-[10px] font-black uppercase text-primary hover:underline">
                      Reintentar
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" step="0.0001" placeholder="Latitud" value={manualLat} onChange={(e) => setManualLat(e.target.value)} className={inputClass} />
                    <input type="number" step="0.0001" placeholder="Longitud" value={manualLng} onChange={(e) => setManualLng(e.target.value)} className={inputClass} />
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input type="checkbox" checked={usarCoordenadasManuales} onChange={(e) => setUsarCoordenadasManuales(e.target.checked)} className="w-3.5 h-3.5 text-primary rounded" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Ingresar coordenadas manualmente (uso administrativo)</span>
                </label>
                {usarCoordenadasManuales && clockInType === 'entrada' && obraSeleccionadaEntrada?.lat != null && (
                  <button
                    type="button"
                    onClick={() => { setManualLat(String(obraSeleccionadaEntrada.lat)); setManualLng(String(obraSeleccionadaEntrada.lng)); }}
                    className="text-[10px] font-black text-primary hover:underline"
                  >
                    Usar coordenadas de la obra
                  </button>
                )}
              </div>
            </ModalField>

            {clockInType === 'salida' && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isEarlyDeparture} onChange={(e) => setIsEarlyDeparture(e.target.checked)} className="w-4 h-4 text-amber-600 rounded" />
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wide">¿Es Salida Anticipada (Antes del término de turno)?</span>
                </label>

                {isEarlyDeparture && (
                  <div className="space-y-2 pt-1 border-t border-amber-200">
                    <ModalField label="Horas Efectivas Laboradas">
                      <input type="number" step="0.5" value={earlyDepartureHours} onChange={(e) => setEarlyDepartureHours(e.target.value)} placeholder="Ej: 5.5" className={inputClass} />
                    </ModalField>
                    <ModalField label="Motivo de la Salida Anticipada">
                      <input type="text" value={earlyDepartureReason} onChange={(e) => setEarlyDepartureReason(e.target.value)} placeholder="Ej: Permiso médico IMSS / Emergencia familiar" className={inputClass} />
                    </ModalField>
                  </div>
                )}
              </div>
            )}

            {clockInType === 'horas_extra' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <ModalField label="Horas Extraordinarias">
                    <input type="number" step="0.5" value={extraHoursInput} onChange={(e) => setExtraHoursInput(e.target.value)} placeholder="Ej: 3.5" className={inputClass} />
                  </ModalField>
                  <ModalField label="Monto Estimado">
                    <div className="h-[46px] px-4 flex items-center bg-orange-50 border border-orange-200 rounded-xl text-orange-950 font-black text-sm">
                      ${((parseFloat(extraHoursInput) || 0) * (trabajadores.find((t) => t.id === clockInWorkerId)?.tarifaHoraExtra ?? 80)).toFixed(2)}
                    </div>
                  </ModalField>
                </div>

                <ModalField label="Motivo de Turno Extraordinario">
                  <input type="text" value={extraMotivo} onChange={(e) => setExtraMotivo(e.target.value)} placeholder="Ej: Colado nocturno de cimentación" className={inputClass} />
                </ModalField>
              </>
            )}

          </div>
        </Modal>
      )}

      {/* ── MODAL PASE DE LISTA POR CUADRILLA (LOTE) ── */}
      {cuadrillaModalOpen && (
        <Modal
          isOpen={cuadrillaModalOpen}
          onClose={() => setCuadrillaModalOpen(false)}
          onConfirm={handleCuadrillaSubmit}
          title="Pase de Lista Masivo por Cuadrilla"
          confirmLabel={submitting ? 'Enviando...' : 'Marcar Cuadrilla en Sitio'}
        >
          <div className="space-y-4">
            <ModalField label="Obra / Frente de Trabajo">
              <select value={cuadrillaObraId} onChange={(e) => setCuadrillaObraId(e.target.value)} className={selectClass}>
                {obras.map((o) => (
                  <option key={o.id} value={o.id}>{o.nombre}</option>
                ))}
              </select>
            </ModalField>

            <ModalField label="Ubicación del Dispositivo (Residente/Cabo)">
              <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                {!usarCoordenadasManuales ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      {ubicacionEstado === 'obteniendo' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      {ubicacionEstado === 'ok' && <LocateFixed className="w-4 h-4 text-green-600" />}
                      {ubicacionEstado === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      <span className={ubicacionEstado === 'ok' ? 'text-green-700' : ubicacionEstado === 'error' ? 'text-red-600' : 'text-slate-600'}>
                        {ubicacionEstado === 'obteniendo' && 'Obteniendo ubicación GPS...'}
                        {ubicacionEstado === 'ok' && ubicacionGps && `GPS: ${ubicacionGps.lat.toFixed(5)}, ${ubicacionGps.lng.toFixed(5)}`}
                        {ubicacionEstado === 'error' && 'No se pudo obtener el GPS del dispositivo.'}
                        {ubicacionEstado === 'idle' && 'Ubicación no solicitada.'}
                      </span>
                    </div>
                    <button type="button" onClick={solicitarUbicacion} className="text-[10px] font-black uppercase text-primary hover:underline">Reintentar</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" step="0.0001" placeholder="Latitud" value={manualLat} onChange={(e) => setManualLat(e.target.value)} className={inputClass} />
                    <input type="number" step="0.0001" placeholder="Longitud" value={manualLng} onChange={(e) => setManualLng(e.target.value)} className={inputClass} />
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input type="checkbox" checked={usarCoordenadasManuales} onChange={(e) => setUsarCoordenadasManuales(e.target.checked)} className="w-3.5 h-3.5 text-primary rounded" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Ingresar coordenadas manualmente</span>
                </label>
              </div>
            </ModalField>

            <ModalField label="Seleccionar Trabajadores en Frente">
              <div className="space-y-2 max-h-56 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                {trabajadores.map((t) => {
                  const isChecked = selectedCuadrillaWorkers.includes(t.id);
                  return (
                    <label key={t.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 hover:border-primary/50 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedCuadrillaWorkers((prev) => [...prev, t.id]);
                            else setSelectedCuadrillaWorkers((prev) => prev.filter((id) => id !== t.id));
                          }}
                          className="w-4 h-4 text-primary rounded"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{t.nombre}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{t.puesto}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{t.categoriaPuesto}</span>
                    </label>
                  );
                })}
              </div>
            </ModalField>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Se marcará asistencia satelital con geocerca para los <strong>{selectedCuadrillaWorkers.length} empleados</strong> seleccionados.</span>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
