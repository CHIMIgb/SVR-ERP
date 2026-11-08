"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import {
  asistenciaApi,
  trabajadoresApi,
  type RegistroAsistenciaDTO,
  type AsistenciaSemanalDTO,
  type TrabajadorDTO,
  type ObraLite,
  type ResolucionOmision,
} from '@/lib/api';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import AsistenciaGpsModal from '@/components/workers/AsistenciaGpsModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatsCard } from '@/components/ui/StatsCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { Tooltip } from '@/components/ui/Tooltip';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { LoadingState } from '@/components/ui/LoadingState';
import { FormModal, ModalField, modalInputClass, modalSelectClass, modalTextareaClass } from '@/components/ui/Modal';

/** Decisión del cliente: en una obra sin ubicación registrada no se marca asistencia hasta que se registre. */
const MENSAJE_OBRA_SIN_UBICACION =
  'Esta obra aún no tiene su ubicación registrada. No se puede marcar asistencia hasta que se registre.';

/**
 * Omisión (decisión del cliente): checar tarde o no checar. La administradora la resuelve como falta o retardo
 * con el motivo; sin resolver a las 17:00 cuenta como falta. Igual que HORA_LIMITE_JUSTIFICACION de la API.
 */
const HORA_LIMITE_OMISION_MINUTOS = 17 * 60;
const TOLERANCIA_ENTRADA_MINUTOS = 15;
const MOTIVO_OMISION_MIN = 3;
const MOTIVO_OMISION_MAX = 500;
/** Morado solo para la omisión, para que no se confunda con el retardo (ámbar). */
const CLASE_OMISION = 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300';

// Igual que RegistrarUbicacionObraDto: radio de 20 m a 2 km; con señal peor que 100 m no se registra.
const RADIO_OBRA_MIN = 20;
const RADIO_OBRA_MAX = 2000;
const RADIO_OBRA_SUGERIDO = '150';
const PRECISION_MAXIMA_OBRA = 100;

const minutosDelDia = (d: Date) => d.getHours() * 60 + d.getMinutes();
const minutosDeHora = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const CATEGORIAS = [
  { id: 'Todos', label: 'Todos los puestos' },
  { id: 'Operador', label: 'Operadores' },
  { id: 'Chofer', label: 'Choferes' },
  { id: 'Mecanico', label: 'Mecánicos' },
  { id: 'Ingeniero', label: 'Ingenieros' },
  { id: 'Administrativo', label: 'Administración' },
] as const;

/** Etiqueta legible (singular, con acentos) de la categoría de puesto que manda la API. */
const ETIQUETA_CATEGORIA: Record<string, string> = {
  Operador: 'Operador',
  Chofer: 'Chofer',
  Mecanico: 'Mecánico',
  Ingeniero: 'Ingeniero',
  Administrativo: 'Administrativo',
};

const FILTROS_GEOCERCA = [
  { key: 'Todos', label: 'Todos' },
  { key: 'EnSitio', label: 'En sitio' },
  { key: 'FueraSitio', label: 'Fuera' },
  { key: 'SalidaAnticipada', label: 'Anticipada' },
] as const;
type FiltroGeocerca = (typeof FILTROS_GEOCERCA)[number]['key'];
const esFiltroGeocerca = (valor: string): valor is FiltroGeocerca => FILTROS_GEOCERCA.some((f) => f.key === valor);

const VISTAS = ['asistencia', 'calendario_semanal', 'horas_extra', 'faltas'] as const;
type Vista = (typeof VISTAS)[number];
const esVista = (valor: string): valor is Vista => (VISTAS as readonly string[]).includes(valor);

const TIPOS_MARCAJE = [
  { id: 'entrada', label: 'Entrada' },
  { id: 'salida', label: 'Salida' },
  { id: 'horas_extra', label: 'Horas extra' },
] as const;

type EstadoDia = AsistenciaSemanalDTO['dias'][number]['estado'];

/** Un solo tinte suave por estado (en oscuro baja al 10 %). */
const ESTILO_DIA: Record<EstadoDia, { etiqueta: string; clase: string }> = {
  Puntual: { etiqueta: 'Puntual', clase: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300' },
  Retardo: { etiqueta: 'Retardo', clase: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  'Salida Anticipada': { etiqueta: 'Anticipada', clase: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300' },
  Justificado: { etiqueta: 'Justif.', clase: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
  // Hoy, todavía puede justificarse; vencida y sin resolver, la API ya la manda como Falta.
  'Omisión': { etiqueta: 'Omisión', clase: CLASE_OMISION },
  // Hoy, dentro de su tolerancia de entrada: aún puede llegar.
  Pendiente: { etiqueta: 'Por llegar', clase: 'bg-ui-50 text-ui-400' },
  // La API usa 'Descanso' para días anteriores a la contratación (y futuros, que aquí se muestran como '—').
  Descanso: { etiqueta: 'No aplica', clase: 'bg-ui-100 text-ui-500' },
  Falta: { etiqueta: 'Falta', clase: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' },
};

const LEYENDA_SEMANA = [
  { etiqueta: 'Puntual', punto: 'bg-green-500' },
  { etiqueta: 'Retardo', punto: 'bg-amber-500' },
  { etiqueta: 'Anticipada', punto: 'bg-orange-500' },
  { etiqueta: 'Justificado', punto: 'bg-blue-500' },
  { etiqueta: 'Omisión', punto: 'bg-violet-500' },
  { etiqueta: 'Falta', punto: 'bg-red-500' },
  { etiqueta: 'No aplica', punto: 'bg-ui-300' },
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type FuenteCarga = 'trabajadores' | 'obras' | 'registros' | 'semanal';

/** Fila de la pestaña Omisiones: un registro que checó tarde, o un trabajador que no ha checado hoy. */
interface FilaOmision {
  id: string;
  trabajadorId: string;
  registro?: RegistroAsistenciaDTO;
  /** Pasó el plazo de las 17:00 sin resolverse: ya cuenta como falta. */
  vencida: boolean;
  /** Sin checar, pero todavía dentro de su tolerancia de entrada. */
  porLlegar: boolean;
}

const LIMITE_TRABAJADORES = 100;
const LIMITE_REGISTROS = 200;

/** Igual que TARIFA_HORA_EXTRA_DEFECTO de la API: se usa cuando el trabajador no tiene tarifa propia. */
const TARIFA_HORA_EXTRA_DEFECTO = 80;

function avisoListaIncompleta(recibidos: number, total?: number): string | null {
  return total != null && total > recibidos ? `se muestran ${recibidos} de ${total}; la lista está incompleta` : null;
}

function mensajeErrorGps(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permiso de ubicación denegado. Actívalo en el navegador o ingresa coordenadas manualmente.';
    case error.TIMEOUT:
      return 'Se agotó el tiempo para obtener el GPS. Intenta de nuevo.';
    case error.POSITION_UNAVAILABLE:
      return 'No se pudo determinar la posición. Intenta de nuevo o ingresa coordenadas manualmente.';
    default:
      return 'No se pudo obtener el GPS del dispositivo.';
  }
}

interface CoordenadasDispositivo {
  lat: number;
  lng: number;
  precisionGpsMetros: number;
}

interface UbicacionDispositivoProps {
  estado: 'idle' | 'obteniendo' | 'ok' | 'error';
  gps: CoordenadasDispositivo | null;
  /** Motivo concreto del fallo (permiso denegado, tiempo agotado...). */
  error: string | null;
  manual: boolean;
  onManualChange: (manual: boolean) => void;
  lat: string;
  lng: string;
  onLatChange: (valor: string) => void;
  onLngChange: (valor: string) => void;
  onReintentar: () => void;
  etiquetaManual: string;
  children?: React.ReactNode;
}

/** Estado del GPS del dispositivo con respaldo de captura manual (lo usan los dos modales de marcaje). */
function UbicacionDispositivo({
  estado, gps, error, manual, onManualChange, lat, lng, onLatChange, onLngChange, onReintentar, etiquetaManual, children,
}: UbicacionDispositivoProps) {
  const texto =
    estado === 'obteniendo' ? 'Obteniendo ubicación GPS…'
    : estado === 'ok' && gps ? `GPS: ${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)} (±${gps.precisionGpsMetros} m)`
    : estado === 'error' ? (error ?? 'No se pudo obtener el GPS del dispositivo.')
    : 'Ubicación no solicitada.';

  return (
    <div className="p-3 rounded-xl border border-ui-200 bg-ui-50 space-y-2.5">
      {!manual ? (
        <div className="flex items-center justify-between gap-3">
          <p
            className={cn(
              'flex items-center gap-2 text-xs sm:text-sm min-w-0',
              estado === 'ok' ? 'text-green-700 dark:text-green-400'
                : estado === 'error' ? 'text-red-600 dark:text-red-400'
                : 'text-ui-600',
            )}
          >
            {estado === 'obteniendo' && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            <span className="min-w-0 break-words">{texto}</span>
          </p>
          <button type="button" onClick={onReintentar} className="shrink-0 text-xs font-semibold text-primary hover:underline cursor-pointer">
            Reintentar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <input type="number" step="0.0001" aria-label="Latitud" placeholder="Latitud" value={lat} onChange={(e) => onLatChange(e.target.value)} className={modalInputClass} />
          <input type="number" step="0.0001" aria-label="Longitud" placeholder="Longitud" value={lng} onChange={(e) => onLngChange(e.target.value)} className={modalInputClass} />
        </div>
      )}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={manual} onChange={(e) => onManualChange(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
        <span className="text-xs text-ui-600">{etiquetaManual}</span>
      </label>
      {children}
    </div>
  );
}

/** Aviso de obra sin ubicación; quien puede editar la registra ahí mismo (decisión del cliente). */
function AvisoObraSinUbicacion({ puedeRegistrar, onRegistrar, className }: { puedeRegistrar: boolean; onRegistrar: () => void; className?: string }) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-2', className)}>
      <p className="text-xs text-red-600 dark:text-red-400">
        {puedeRegistrar
          ? 'Esta obra aún no tiene su ubicación registrada. Regístrala estando en la obra para poder marcar asistencia.'
          : `${MENSAJE_OBRA_SIN_UBICACION} Pide a la administradora que la registre.`}
      </p>
      {puedeRegistrar && (
        <Button type="button" variant="outline" size="sm" onClick={onRegistrar} className="shrink-0">
          Registrar ubicación
        </Button>
      )}
    </div>
  );
}

export default function AsistenciaPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  const vista = user?.vistas?.find((v) => v.ruta === '/asistencia');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;

  const [trabajadores, setTrabajadores] = useState<TrabajadorDTO[]>([]);
  const [obras, setObras] = useState<ObraLite[]>([]);
  const [registros, setRegistros] = useState<RegistroAsistenciaDTO[]>([]);
  const [semanalData, setSemanalData] = useState<AsistenciaSemanalDTO[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  // Un error por fuente: se muestran todos y se limpian cuando esa fuente vuelve a cargar bien.
  const [erroresCarga, setErroresCarga] = useState<Partial<Record<FuenteCarga, string>>>({});
  const [recargando, setRecargando] = useState(false);

  const registrarResultado = useCallback((fuente: FuenteCarga, error?: string) => {
    setErroresCarga((prev) => {
      if (!error && !(fuente in prev)) return prev;
      const siguiente = { ...prev };
      if (error) siguiente[fuente] = error;
      else delete siguiente[fuente];
      return siguiente;
    });
  }, []);

  const [search, setSearch] = useState('');
  const [mainView, setMainView] = useState<Vista>('asistencia');
  const [selectedRole, setSelectedRole] = useState<string>('Todos');
  const [filterGeocerca, setFilterGeocerca] = useState<FiltroGeocerca>('Todos');

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
  const [ubicacionGps, setUbicacionGps] = useState<CoordenadasDispositivo | null>(null);
  const [ubicacionEstado, setUbicacionEstado] = useState<'idle' | 'obteniendo' | 'ok' | 'error'>('idle');
  const [ubicacionError, setUbicacionError] = useState<string | null>(null);
  const [usarCoordenadasManuales, setUsarCoordenadasManuales] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  // Cada solicitud de GPS lleva un número; las respuestas de solicitudes viejas se ignoran.
  const solicitudGpsRef = useRef(0);

  const [submitting, setSubmitting] = useState(false);
  // Reloj de la vista: "Por llegar" y "vencida" dependen de la hora; sin esto se quedaban congelados al dejar
  // la pantalla abierta (a las 17:00 nada cambiaba hasta recargar).
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(intervalo);
  }, []);

  // Acciones por fila en curso (evitan doble clic).
  const [aprobandoHorasExtraId, setAprobandoHorasExtraId] = useState<string | null>(null);

  // Resolver una omisión: de un registro (checó tarde) o de quien no checó nada.
  const [omisionAResolver, setOmisionAResolver] = useState<
    { registro: RegistroAsistenciaDTO; trabajadorId: string } | { registro?: undefined; trabajadorId: string } | null
  >(null);
  const [resolucionOmision, setResolucionOmision] = useState<ResolucionOmision | ''>('');
  const [motivoOmision, setMotivoOmision] = useState('');
  const [erroresOmision, setErroresOmision] = useState<{ resolucion?: string; motivo?: string }>({});
  const [resolviendoOmision, setResolviendoOmision] = useState(false);
  const resolviendoOmisionRef = useRef(false);

  // Registrar la ubicación de una obra (centro y radio de su geocerca).
  const [obraAUbicar, setObraAUbicar] = useState<ObraLite | null>(null);
  const [radioObra, setRadioObra] = useState(RADIO_OBRA_SUGERIDO);
  const [errorRadioObra, setErrorRadioObra] = useState<string | null>(null);
  const [guardandoUbicacionObra, setGuardandoUbicacionObra] = useState(false);
  const guardandoUbicacionObraRef = useRef(false);

  /**
   * Corre una carga y deja su resultado en `erroresCarga`. Nunca lanza: la API puede devolver
   * success:false o lanzar (sin red), y ambos casos terminan en el aviso con "Reintentar".
   * `cargar` devuelve un mensaje de aviso, o null si todo llegó completo.
   */
  const cargarFuente = useCallback(
    async (fuente: FuenteCarga, etiqueta: string, cargar: () => Promise<string | null>) => {
      try {
        const aviso = await cargar();
        registrarResultado(fuente, aviso ? `${etiqueta}: ${aviso}` : undefined);
      } catch (error) {
        registrarResultado(fuente, `${etiqueta}: ${error instanceof Error ? error.message : 'error desconocido'}`);
      }
    },
    [registrarResultado],
  );

  const fetchTrabajadores = useCallback(() => cargarFuente('trabajadores', 'Trabajadores', async () => {
    const res = await trabajadoresApi.listar({ limit: LIMITE_TRABAJADORES });
    if (!res.success) return res.error.message;
    setTrabajadores(res.data.items);
    setClockInWorkerId((prev) => prev || res.data.items.find((t) => t.estado === 'Activo')?.id || '');
    return avisoListaIncompleta(res.data.items.length, res.data.pagination?.total);
  }), [cargarFuente]);

  const fetchObras = useCallback(() => cargarFuente('obras', 'Obras', async () => {
    const res = await asistenciaApi.obras();
    if (!res.success) return res.error.message;
    setObras(res.data);
    setClockInObraId((prev) => prev || res.data[0]?.id || '');
    setCuadrillaObraId((prev) => prev || res.data[0]?.id || '');
    return null;
  }), [cargarFuente]);

  const fetchRegistros = useCallback(() => cargarFuente('registros', 'Registros de hoy', async () => {
    const res = await asistenciaApi.listar({ limit: LIMITE_REGISTROS });
    if (!res.success) return res.error.message;
    setRegistros(res.data.items);
    return avisoListaIncompleta(res.data.items.length, res.data.pagination?.total);
  }), [cargarFuente]);

  const fetchSemanal = useCallback(() => cargarFuente('semanal', 'Resumen semanal', async () => {
    const res = await asistenciaApi.semanal();
    if (!res.success) return res.error.message;
    setSemanalData(res.data);
    return null;
  }), [cargarFuente]);

  // No lanza (cada fuente reporta su error en el aviso): si la acción ya se guardó, un fallo al
  // refrescar no se confunde con un fallo de la acción.
  const refetchAll = useCallback(async () => {
    await Promise.all([fetchRegistros(), fetchSemanal()]);
  }, [fetchRegistros, fetchSemanal]);

  const cargarTodo = useCallback(async () => {
    await Promise.all([fetchTrabajadores(), fetchObras(), fetchRegistros(), fetchSemanal()]);
  }, [fetchTrabajadores, fetchObras, fetchRegistros, fetchSemanal]);

  const reintentarCarga = async () => {
    if (recargando) return;
    setRecargando(true);
    try {
      await cargarTodo();
    } finally {
      setRecargando(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await cargarTodo();
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [cargarTodo]);

  const solicitarUbicacion = useCallback(() => {
    const solicitud = ++solicitudGpsRef.current;
    setUbicacionGps(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setUbicacionEstado('error');
      setUbicacionError('Este navegador no permite obtener la ubicación. Ingresa coordenadas manualmente.');
      return;
    }
    setUbicacionEstado('obteniendo');
    setUbicacionError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (solicitud !== solicitudGpsRef.current) return;
        setUbicacionGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, precisionGpsMetros: Math.round(pos.coords.accuracy) });
        setUbicacionEstado('ok');
      },
      (error) => {
        if (solicitud !== solicitudGpsRef.current) return;
        setUbicacionEstado('error');
        setUbicacionError(mensajeErrorGps(error));
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  // El GPS se pide al abrir cada modal de marcaje y se limpia al cerrarlo. Cada apertura
  // empieza con el formulario limpio (antes la cuadrilla quedaba preseleccionada).
  const prepararUbicacion = () => {
    setUsarCoordenadasManuales(false);
    setManualLat('');
    setManualLng('');
    solicitarUbicacion();
  };
  const limpiarUbicacion = () => {
    solicitudGpsRef.current++;
    setUbicacionEstado('idle');
    setUbicacionGps(null);
    setUbicacionError(null);
  };
  const abrirMarcaje = () => {
    setClockInType('entrada');
    setIsEarlyDeparture(false);
    setEarlyDepartureReason('');
    setEarlyDepartureHours('5.5');
    setExtraHoursInput('3.0');
    setExtraMotivo('');
    prepararUbicacion();
    setClockInModalOpen(true);
  };
  const cerrarMarcaje = () => {
    // Con el modal de ubicación de obra encima, este no se cierra (compartirían el GPS a medio usar).
    if (obraAUbicar) return;
    setClockInModalOpen(false);
    limpiarUbicacion();
  };
  const abrirCuadrilla = () => {
    setSelectedCuadrillaWorkers([]);
    prepararUbicacion();
    setCuadrillaModalOpen(true);
  };
  const cerrarCuadrilla = () => {
    if (obraAUbicar) return;
    setCuadrillaModalOpen(false);
    limpiarUbicacion();
  };

  /** Desde una tarjeta: muestra la pestaña Hoy con ese filtro y sin búsqueda previa (para que cuadre el número). */
  const filtrarDesdeTarjeta = (filtro: FiltroGeocerca) => {
    setMainView('asistencia');
    setSearch('');
    setSelectedRole('Todos');
    setFilterGeocerca(filtro);
  };

  const getStatusBadge = (status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (status) {
      case 'Puntual': return 'success';
      case 'Retardo': return 'warning';
      case 'Falta': return 'error';
      case 'No Presentado': return 'error';
      case 'Salida Anticipada': return 'warning';
      case 'Justificado': return 'info';
      default: return 'neutral';
    }
  };

  // "Sin marcaje" solo es confiable si cargaron completos los trabajadores y los registros de hoy;
  // si no, se mostraría a gente que sí asistió (y se le podría registrar falta).
  const datosHoyConfiables = !erroresCarga.trabajadores && !erroresCarga.registros;
  // Sin registros de hoy, los indicadores muestran '—' en lugar de un 0 que parecería real.
  const registrosCargados = !erroresCarga.registros;
  const registeredWorkerIds = new Set(registros.map((r) => r.trabajadorId));
  // Marcaje y pase de lista solo ofrecen activos: a un dado de baja o de vacaciones ya no se le registra asistencia
  // (la API lo rechaza). La lista completa se sigue usando para mostrar el nombre en registros anteriores.
  const trabajadoresActivos = trabajadores.filter((t) => t.estado === 'Activo');
  const missingWorkers = trabajadoresActivos.filter((t) => !registeredWorkerIds.has(t.id));

  // Omisiones de hoy: quien checó tarde (registro en omisión) y quien no ha checado. Mismo cálculo que la API.
  const minutosAhora = minutosDelDia(ahora);
  const yaVencioHoy = minutosAhora >= HORA_LIMITE_OMISION_MINUTOS;
  // El domingo es descanso (la semana laboral es de lunes a sábado): nadie queda en omisión.
  const esDomingo = ahora.getDay() === 0;
  const hoyLocalISO = ahora.toLocaleDateString('en-CA');
  const filasOmision: FilaOmision[] = esDomingo ? [] : [
    ...registros
      .filter((r) => r.estado === 'Omisión')
      .map((r) => ({ id: r.id, trabajadorId: r.trabajadorId, registro: r, vencida: !!r.omisionVencida || yaVencioHoy, porLlegar: false })),
    ...missingWorkers
      .filter((t) => !t.fechaContratacion || t.fechaContratacion <= hoyLocalISO)
      .map((t) => {
      const porLlegar = !!t.entrada && minutosAhora <= minutosDeHora(t.entrada) + TOLERANCIA_ENTRADA_MINUTOS;
        return { id: `sin-${t.id}`, trabajadorId: t.id, vencida: !porLlegar && yaVencioHoy, porLlegar };
      }),
  ];
  const omisionesPorResolver = filasOmision.filter((f) => !f.porLlegar).length;

  // Solo cuenta quien sí checó: una falta o un retardo registrados sin marcaje no tienen GPS (no están "fuera de obra").
  const conMarcaje = (r: RegistroAsistenciaDTO) => !r.sinMarcaje;
  const enSitioCount = registros.filter((r) => conMarcaje(r) && r.enSitio).length;
  const fueraSitioCount = registros.filter((r) => conMarcaje(r) && !r.enSitio).length;
  const totalHorasExtras = registros.reduce((sum, r) => sum + (r.horasExtra?.horasCalculadas ?? 0), 0);
  const totalMontoHorasExtras = registros.reduce((sum, r) => sum + (r.horasExtra?.montoTotal ?? 0), 0);

  const filteredRegistros = registros.filter((reg) => {
    const trabajador = trabajadores.find((t) => t.id === reg.trabajadorId);
    const texto = search.toLowerCase();
    const matchSearch =
      trabajador?.nombre.toLowerCase().includes(texto) ||
      trabajador?.puesto.toLowerCase().includes(texto) ||
      reg.obraAsignada.toLowerCase().includes(texto) ||
      reg.ubicacion.toLowerCase().includes(texto);

    if (!matchSearch) return false;
    if (selectedRole !== 'Todos' && trabajador?.categoriaPuesto !== selectedRole) return false;
    if (filterGeocerca === 'EnSitio') return conMarcaje(reg) && reg.enSitio;
    if (filterGeocerca === 'FueraSitio') return conMarcaje(reg) && !reg.enSitio;
    if (filterGeocerca === 'SalidaAnticipada') return reg.salidaAnticipada || reg.estado === 'Salida Anticipada';
    return true;
  });

  const obraSeleccionadaEntrada = obras.find((o) => o.id === clockInObraId);
  const obraSeleccionadaCuadrilla = obras.find((o) => o.id === cuadrillaObraId);

  type ResultadoCoordenadas =
    | { ok: true; coords: CoordenadasDispositivo; manual: boolean }
    | { ok: false; mensaje: string };

  const resolverCoordenadasDispositivo = (): ResultadoCoordenadas => {
    if (usarCoordenadasManuales) {
      const lat = Number(manualLat);
      const lng = Number(manualLng);
      const validas =
        manualLat.trim() !== '' && manualLng.trim() !== '' &&
        Number.isFinite(lat) && Number.isFinite(lng) &&
        lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      if (!validas) {
        return { ok: false, mensaje: 'Coordenadas manuales inválidas: latitud entre -90 y 90, longitud entre -180 y 180.' };
      }
      return { ok: true, coords: { lat, lng, precisionGpsMetros: 0 }, manual: true };
    }
    if (ubicacionEstado === 'obteniendo') return { ok: false, mensaje: 'Espera a que termine de obtenerse la ubicación GPS.' };
    if (ubicacionEstado !== 'ok' || !ubicacionGps) {
      return { ok: false, mensaje: ubicacionError ?? 'No se pudo obtener la ubicación GPS. Actívala o ingresa coordenadas manualmente.' };
    }
    return { ok: true, coords: ubicacionGps, manual: false };
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

  const autorizarHorasExtraDesdeTabla = async (horasExtraId: string, nombre: string) => {
    if (aprobandoHorasExtraId) return;
    setAprobandoHorasExtraId(horasExtraId);
    try {
      await handleAprobarHorasExtra(horasExtraId);
      showToast(`Horas extra de ${nombre} autorizadas.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudieron autorizar las horas extra.', 'error');
    } finally {
      setAprobandoHorasExtraId(null);
    }
  };

  const abrirResolverOmision = (destino: { registro?: RegistroAsistenciaDTO; trabajadorId: string }) => {
    setOmisionAResolver(destino.registro ? { registro: destino.registro, trabajadorId: destino.trabajadorId } : { trabajadorId: destino.trabajadorId });
    setResolucionOmision('');
    setMotivoOmision('');
    setErroresOmision({});
  };

  const cerrarResolverOmision = () => {
    if (!resolviendoOmision) setOmisionAResolver(null);
  };

  const guardarResolucionOmision = async () => {
    if (!omisionAResolver || resolviendoOmisionRef.current) return;
    const motivo = motivoOmision.trim();
    const errores: { resolucion?: string; motivo?: string } = {};
    if (!resolucionOmision) errores.resolucion = 'Elige si queda como falta o como retardo.';
    if (motivo.length < MOTIVO_OMISION_MIN) errores.motivo = 'Escribe el motivo que dio el trabajador.';
    if (Object.keys(errores).length > 0) {
      setErroresOmision(errores);
      return;
    }
    const resolucion = resolucionOmision as ResolucionOmision;
    const nombre = trabajadores.find((t) => t.id === omisionAResolver.trabajadorId)?.nombre ?? 'el trabajador';
    resolviendoOmisionRef.current = true;
    setResolviendoOmision(true);
    try {
      const res = omisionAResolver.registro
        ? await asistenciaApi.resolverOmision(omisionAResolver.registro.id, { resolucion, motivo })
        : await asistenciaApi.resolverOmisionSinMarcaje({ trabajadorId: omisionAResolver.trabajadorId, resolucion, motivo });
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      setOmisionAResolver(null);
      setSelectedRegistro((prev) => (prev && prev.id === res.data.id ? res.data : prev));
      showToast(
        resolucion === 'Falta'
          ? `Omisión de ${nombre} resuelta como falta: se descontará al sincronizar la nómina.`
          : `Omisión de ${nombre} resuelta como retardo.`,
        resolucion === 'Falta' ? 'warning' : 'success',
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo resolver la omisión.', 'error');
    } finally {
      resolviendoOmisionRef.current = false;
      setResolviendoOmision(false);
    }
    // Fuera del try: si refrescar fallara no debe leerse como que la omisión no se resolvió. Se refresca también
    // tras un error (p. ej. 409: otra persona ya la resolvió), para que la tabla muestre lo vigente.
    await refetchAll();
  };

  const abrirUbicacionObra = (obra: ObraLite) => {
    setObraAUbicar(obra);
    setRadioObra(obra.radioPermitidoMetros ? String(obra.radioPermitidoMetros) : RADIO_OBRA_SUGERIDO);
    setErrorRadioObra(null);
    // Lectura nueva del GPS: la que hay pudo tomarse en otro lugar.
    prepararUbicacion();
  };

  /**
   * El modal de ubicación usa el mismo GPS que el marcaje de abajo. Al cerrarlo se vuelve a pedir una lectura
   * limpia: si no, unas coordenadas manuales del centro de la obra se quedarían puestas y el siguiente
   * marcaje saldría "en sitio" sin estar ahí.
   */
  const cerrarUbicacionObra = () => {
    setObraAUbicar(null);
    prepararUbicacion();
  };

  const guardarUbicacionObra = async () => {
    if (!obraAUbicar || guardandoUbicacionObraRef.current) return;
    const radio = Number(radioObra);
    if (radioObra.trim() === '' || !Number.isFinite(radio) || radio < RADIO_OBRA_MIN || radio > RADIO_OBRA_MAX) {
      setErrorRadioObra(`El radio va de ${RADIO_OBRA_MIN} m a ${RADIO_OBRA_MAX} m.`);
      return;
    }
    const ubicacion = resolverCoordenadasDispositivo();
    if (!ubicacion.ok) {
      showToast(ubicacion.mensaje, 'error');
      return;
    }
    const { coords, manual } = ubicacion;
    if (!manual && coords.precisionGpsMetros > PRECISION_MAXIMA_OBRA) {
      showToast(
        `La señal GPS tiene un margen de ${coords.precisionGpsMetros} m (máximo ${PRECISION_MAXIMA_OBRA} m). Sal a un lugar abierto y toca Reintentar.`,
        'error',
      );
      return;
    }
    guardandoUbicacionObraRef.current = true;
    setGuardandoUbicacionObra(true);
    try {
      const res = await asistenciaApi.registrarUbicacionObra(obraAUbicar.id, {
        lat: coords.lat,
        lng: coords.lng,
        radioPermitidoMetros: radio,
        // Sin precisión, la API la registra como captura manual.
        precisionGpsMetros: manual ? undefined : coords.precisionGpsMetros,
      });
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      setObras((prev) => prev.map((o) => (o.id === res.data.id ? { ...o, ...res.data } : o)));
      cerrarUbicacionObra();
      showToast(`Ubicación de ${res.data.nombre} registrada (radio de ${radio} m). Ya se puede marcar asistencia ahí.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo registrar la ubicación de la obra.', 'error');
    } finally {
      guardandoUbicacionObraRef.current = false;
      setGuardandoUbicacionObra(false);
    }
  };

  const handleCuadrillaSubmit = async () => {
    if (submitting) return;
    if (!obraSeleccionadaCuadrilla) {
      showToast('Selecciona la obra o frente de trabajo.', 'error');
      return;
    }
    if (obraSeleccionadaCuadrilla.lat == null || obraSeleccionadaCuadrilla.lng == null) {
      showToast(MENSAJE_OBRA_SIN_UBICACION, 'error');
      return;
    }
    if (selectedCuadrillaWorkers.length === 0) {
      showToast('Selecciona al menos un trabajador.', 'error');
      return;
    }
    const ubicacion = resolverCoordenadasDispositivo();
    if (!ubicacion.ok) {
      showToast(ubicacion.mensaje, 'error');
      return;
    }
    const obra = obraSeleccionadaCuadrilla;
    const { coords } = ubicacion;
    setSubmitting(true);
    try {
      const res = await asistenciaApi.marcarCuadrilla({
        obraId: obra.id,
        trabajadorIds: selectedCuadrillaWorkers,
        lat: coords.lat,
        lng: coords.lng,
        precisionGpsMetros: coords.precisionGpsMetros,
        dispositivo: `Dispositivo Residente / Cabo SVR${ubicacion.manual ? ' · Coordenadas manuales' : ''}`,
      });
      if (!res.success) throw new Error(res.error.message);
      cerrarCuadrilla();
      showToast(
        `Pase de lista completado: ${res.data.creados.length} trabajadores registrados${
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
    if (submitting) return;
    const worker = trabajadores.find((t) => t.id === clockInWorkerId);
    if (!worker) {
      showToast('Selecciona un trabajador.', 'error');
      return;
    }
    if (clockInType === 'entrada' && !obraSeleccionadaEntrada) {
      showToast('Selecciona la obra.', 'error');
      return;
    }
    if (clockInType === 'entrada' && (obraSeleccionadaEntrada?.lat == null || obraSeleccionadaEntrada?.lng == null)) {
      showToast(MENSAJE_OBRA_SIN_UBICACION, 'error');
      return;
    }
    const horasSalida = Number(earlyDepartureHours);
    if (clockInType === 'salida' && isEarlyDeparture) {
      if (!earlyDepartureReason.trim()) {
        showToast('Indica el motivo de la salida anticipada.', 'error');
        return;
      }
      // Mismas reglas que MarcarSalidaDto: de 0 a 24, con hasta 2 decimales.
      if (
        earlyDepartureHours.trim() === '' || !Number.isFinite(horasSalida) || horasSalida < 0 || horasSalida > 24 ||
        Number(horasSalida.toFixed(2)) !== horasSalida
      ) {
        showToast('Indica las horas laboradas (entre 0 y 24, hasta 2 decimales).', 'error');
        return;
      }
    }
    const horasExtra = Number(extraHoursInput);
    // Mismas reglas que RegistrarHorasExtraDto: de 0.5 a 24, con hasta 2 decimales.
    if (
      clockInType === 'horas_extra' &&
      !(Number.isFinite(horasExtra) && horasExtra >= 0.5 && horasExtra <= 24 && Number(horasExtra.toFixed(2)) === horasExtra)
    ) {
      showToast('Indica las horas extra trabajadas (de 0.5 a 24, hasta 2 decimales).', 'error');
      return;
    }
    const existente = registros.find((r) => r.trabajadorId === worker.id);
    if (clockInType === 'horas_extra' && !existente) {
      showToast('Este trabajador debe marcar entrada antes de registrar horas extra.', 'error');
      return;
    }
    const ubicacion = resolverCoordenadasDispositivo();
    if (!ubicacion.ok) {
      showToast(ubicacion.mensaje, 'error');
      return;
    }
    const { coords } = ubicacion;
    const dispositivo = `Dispositivo Móvil · ${ubicacion.manual ? 'Coordenadas manuales' : 'GPS Activo'}`;

    setSubmitting(true);
    try {
      if (clockInType === 'entrada' && obraSeleccionadaEntrada) {
        const obra = obraSeleccionadaEntrada;
        const res = await asistenciaApi.marcarEntrada({
          trabajadorId: worker.id,
          obraId: obra.id,
          lat: coords.lat,
          lng: coords.lng,
          precisionGpsMetros: coords.precisionGpsMetros,
          dispositivo,
        });
        if (!res.success) throw new Error(res.error.message);
        if (!res.data.enSitio) {
          showToast(`Alerta: ${worker.nombre} marcó fuera del radio permitido de la obra.`, 'error');
        } else if (res.data.estado === 'Omisión') {
          showToast(
            `Entrada de ${worker.nombre} registrada tarde: queda como omisión hasta que se resuelva (falta o retardo).`,
            'warning',
          );
        } else {
          showToast(`Entrada de ${worker.nombre} registrada (en sitio).`, 'success');
        }
      } else if (clockInType === 'salida') {
        const res = await asistenciaApi.marcarSalida({
          trabajadorId: worker.id,
          lat: coords.lat,
          lng: coords.lng,
          precisionGpsMetros: coords.precisionGpsMetros,
          dispositivo,
          salidaAnticipada: isEarlyDeparture,
          motivoSalidaAnticipada: isEarlyDeparture ? earlyDepartureReason.trim() : undefined,
          horasTrabajadasOrdinarias: isEarlyDeparture ? horasSalida : undefined,
        });
        if (!res.success) throw new Error(res.error.message);
        if (isEarlyDeparture) {
          showToast(`Salida anticipada de ${worker.nombre} registrada.`, 'warning');
          addNotification({
            titulo: `Salida Anticipada: ${worker.nombre}`,
            mensaje: `Se retiró antes del término de turno. Motivo: ${earlyDepartureReason.trim()}.`,
            tipo: 'alerta',
          });
        } else {
          showToast(`Salida de ${worker.nombre} registrada.`, 'info');
        }
      } else if (existente) {
        const ahora = new Date();
        const fin = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
        const inicioDate = new Date(ahora.getTime() - horasExtra * 3600000);
        const inicio = `${String(inicioDate.getHours()).padStart(2, '0')}:${String(inicioDate.getMinutes()).padStart(2, '0')}`;
        const res = await asistenciaApi.registrarHorasExtra(existente.id, {
          inicio,
          fin,
          horasCalculadas: horasExtra,
          motivo: extraMotivo.trim() || undefined,
          latInicio: coords.lat,
          lngInicio: coords.lng,
          latFin: coords.lat,
          lngFin: coords.lng,
        });
        if (!res.success) throw new Error(res.error.message);
        showToast(`${horasExtra} h extra registradas para ${worker.nombre}, pendientes de autorización.`, 'success');
      }
      cerrarMarcaje();
      await refetchAll();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo completar el marcaje.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const trabajadorSeleccionado = trabajadores.find((t) => t.id === selectedRegistro?.trabajadorId);
  const trabajadorOmision = omisionAResolver ? trabajadores.find((t) => t.id === omisionAResolver.trabajadorId) : undefined;
  // Fecha local en formato YYYY-MM-DD para comparar con las fechas del resumen semanal.
  const hoyISO = new Date().toLocaleDateString('en-CA');
  const registrosConHorasExtra = registros.filter((r) => r.horasExtra);
  const mensajesError = Object.values(erroresCarga);
  const tarifaConfigurada = trabajadores.find((t) => t.id === clockInWorkerId)?.tarifaHoraExtra;
  const tarifaEstimada = tarifaConfigurada ?? TARIFA_HORA_EXTRA_DEFECTO;

  const formatoDistancia = (metros: number) => (metros >= 1000 ? `${(metros / 1000).toFixed(2)} km` : `${metros} m`);

  const celdaTrabajador = (trabajador: TrabajadorDTO | undefined, detalle?: string) => (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-8 h-8 rounded-full bg-ui-100 text-ui-700 flex items-center justify-center text-[11px] font-bold shrink-0">
        {trabajador?.avatar ?? '?'}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ui-900 truncate">{trabajador?.nombre ?? 'Trabajador'}</p>
        {detalle && <p className="text-xs text-ui-500 truncate">{detalle}</p>}
      </div>
    </div>
  );

  const registroColumns: Column<RegistroAsistenciaDTO>[] = [
    {
      key: 'trabajador',
      header: 'Trabajador',
      render: (reg) => {
        const trabajador = trabajadores.find((t) => t.id === reg.trabajadorId);
        return celdaTrabajador(trabajador, trabajador?.puesto);
      },
    },
    {
      key: 'horario',
      header: 'Entrada – salida',
      render: (reg) => !conMarcaje(reg) ? (
        // Falta o retardo registrados sin checar: no hay jornada que mostrar.
        <span className="text-sm text-ui-500 whitespace-nowrap">Sin marcaje</span>
      ) : (
        <div className="flex items-center gap-2 text-sm whitespace-nowrap">
          <span className="font-semibold text-ui-900 tabular-nums">{reg.horaEntrada ?? '—'}</span>
          <span className="text-ui-500">–</span>
          {reg.horaSalida ? (
            <span className="text-ui-700 tabular-nums">{reg.horaSalida}</span>
          ) : (
            <span className="text-ui-500">En jornada</span>
          )}
          {reg.salidaAnticipada && reg.estado !== 'Salida Anticipada' && <Badge variant="warning" size="sm">Anticipada</Badge>}
        </div>
      ),
    },
    {
      key: 'obra',
      header: 'Obra',
      className: 'hidden xl:table-cell',
      render: (reg) => (
        <div className="min-w-0 max-w-[220px]">
          <p className="text-sm text-ui-800 truncate">{reg.obraAsignada}</p>
          {reg.ubicacion && (
            <Tooltip content={reg.ubicacion}>
              <span className="block text-xs text-ui-400 truncate max-w-[220px]">{reg.ubicacion}</span>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      key: 'geocerca',
      header: 'Geocerca',
      render: (reg) => !conMarcaje(reg) ? (
        <span className="text-xs text-ui-500 whitespace-nowrap">Sin marcaje</span>
      ) : (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Badge variant={reg.enSitio ? 'success' : 'error'} size="sm">{reg.enSitio ? 'En sitio' : 'Fuera'}</Badge>
          <span className="text-xs text-ui-500 tabular-nums">{formatoDistancia(reg.distanciaMetros)}</span>
        </div>
      ),
    },
    {
      key: 'horasExtra',
      header: 'Horas extra',
      className: 'hidden xl:table-cell',
      render: (reg) =>
        reg.horasExtra ? (
          <span className="text-sm text-ui-800 whitespace-nowrap">
            +{reg.horasExtra.horasCalculadas} h <span className="text-ui-500">· {formatCurrency(reg.horasExtra.montoTotal)}</span>
          </span>
        ) : (
          <span className="text-ui-500">—</span>
        ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (reg) =>
        reg.estado === 'Omisión' ? (
          reg.omisionVencida ? (
            <Badge variant="error" size="sm">Omisión vencida</Badge>
          ) : (
            <Badge variant="neutral" size="sm" className={CLASE_OMISION}>Omisión</Badge>
          )
        ) : (
          <Badge variant={getStatusBadge(reg.estado)} size="sm">{reg.estado}</Badge>
        ),
    },
  ];

  const horasExtraColumns: Column<RegistroAsistenciaDTO>[] = [
    {
      key: 'trabajador',
      header: 'Trabajador',
      render: (r) => celdaTrabajador(trabajadores.find((t) => t.id === r.trabajadorId), r.obraAsignada),
    },
    {
      key: 'horario',
      header: 'Horario',
      render: (r) => (
        <span className="text-sm text-ui-700 whitespace-nowrap tabular-nums">
          {r.horasExtra?.inicio} – {r.horasExtra?.fin ?? 'en curso'}
        </span>
      ),
    },
    { key: 'horas', header: 'Horas', render: (r) => <span className="text-sm font-semibold text-ui-900 whitespace-nowrap">{r.horasExtra?.horasCalculadas} h</span> },
    { key: 'tarifa', header: 'Tarifa', className: 'hidden xl:table-cell', render: (r) => <span className="text-sm text-ui-600 whitespace-nowrap">{formatCurrency(r.horasExtra?.tarifaPorHora)} / h</span> },
    { key: 'monto', header: 'Monto', render: (r) => <span className="text-sm font-semibold text-ui-900 whitespace-nowrap">{formatCurrency(r.horasExtra?.montoTotal)}</span> },
    {
      key: 'motivo',
      header: 'Motivo',
      className: 'hidden xl:table-cell',
      render: (r) => <span className="text-sm text-ui-600 max-w-[220px] truncate block">{r.horasExtra?.motivo || '—'}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (r) => (
        <Badge variant={r.horasExtra?.estado === 'Aprobado' ? 'success' : r.horasExtra?.estado === 'Rechazado' ? 'error' : 'warning'} size="sm">
          {r.horasExtra?.estado}
        </Badge>
      ),
    },
    {
      key: 'accion',
      header: 'Acción',
      align: 'right',
      render: (r) => {
        const he = r.horasExtra;
        if (!he) return null;
        const trabajador = trabajadores.find((t) => t.id === r.trabajadorId);
        // Solo se autorizan horas terminadas: en curso todavía no tienen hora de fin (la API las rechaza).
        if (he.estado === 'En Curso') return <span className="text-xs text-ui-500 whitespace-nowrap">En curso</span>;
        if (he.estado === 'Pendiente' && puedeEditar) {
          return (
            <Button
              size="sm"
              loading={aprobandoHorasExtraId === he.id}
              disabled={aprobandoHorasExtraId !== null}
              onClick={() => autorizarHorasExtraDesdeTabla(he.id, trabajador?.nombre ?? 'el trabajador')}
            >
              Autorizar
            </Button>
          );
        }
        if (he.estado === 'Aprobado') return <span className="text-xs text-ui-500 whitespace-nowrap">En nómina</span>;
        if (he.estado === 'Rechazado') return <span className="text-xs text-ui-500 whitespace-nowrap">Rechazadas</span>;
        return <span className="text-ui-500">—</span>;
      },
    },
  ];

  const textoSituacion = (f: FilaOmision) =>
    f.registro ? `Checó a las ${f.registro.horaEntrada ?? '—'}` : f.porLlegar ? 'Por llegar' : 'Sin checar';

  const omisionesColumns: Column<FilaOmision>[] = [
    {
      key: 'trabajador',
      header: 'Trabajador',
      render: (f) => {
        const t = trabajadores.find((x) => x.id === f.trabajadorId);
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-ui-100 text-ui-700 flex items-center justify-center text-[11px] font-bold shrink-0">
              {t?.avatar ?? '?'}
            </div>
            {/* En celular el nombre se corta para que el botón Resolver no se salga de la pantalla. */}
            <div className="min-w-0 max-w-[52vw] md:max-w-none">
              <p className="text-sm font-semibold text-ui-900 truncate">{t?.nombre ?? 'Trabajador'}</p>
              <p className="hidden md:block text-xs text-ui-500 truncate">{t?.puesto}</p>
              {/* En celular, la situación y el plazo van aquí (sus columnas se ocultan). */}
              <p className="md:hidden text-xs text-ui-500 truncate">
                {textoSituacion(f)}
                {f.vencida ? ' · cuenta como falta' : f.porLlegar ? '' : ' · hasta las 17:00'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'situacion',
      header: 'Situación',
      className: 'hidden md:table-cell',
      render: (f) => {
        const t = trabajadores.find((x) => x.id === f.trabajadorId);
        if (f.registro) {
          return (
            <div className="text-sm whitespace-nowrap">
              <p className="text-ui-900">Checó a las <span className="tabular-nums">{f.registro.horaEntrada ?? '—'}</span></p>
              {t?.entrada && <p className="text-xs text-ui-500">Entra a las <span className="tabular-nums">{t.entrada}</span></p>}
            </div>
          );
        }
        return (
          <div className="text-sm whitespace-nowrap">
            <p className="text-ui-900">{f.porLlegar ? 'Por llegar' : 'Sin checar'}</p>
            {t?.entrada && <p className="text-xs text-ui-500">Entra a las <span className="tabular-nums">{t.entrada}</span></p>}
          </div>
        );
      },
    },
    {
      key: 'plazo',
      header: 'Plazo',
      className: 'hidden md:table-cell',
      render: (f) =>
        f.vencida ? (
          <Badge variant="error" size="sm">Cuenta como falta</Badge>
        ) : f.porLlegar ? (
          <span className="text-xs text-ui-500 whitespace-nowrap">Aún en tolerancia</span>
        ) : (
          <span className="text-xs text-ui-600 whitespace-nowrap">Hasta las 17:00</span>
        ),
    },
    {
      key: 'accion',
      header: 'Acción',
      align: 'right',
      render: (f) =>
        // Dentro de su tolerancia todavía no es omisión (la API lo rechaza): no hay nada que resolver.
        puedeEditar && !f.porLlegar ? (
          <Button variant="outline" size="sm" disabled={resolviendoOmision} onClick={() => abrirResolverOmision(f)}>
            Resolver
          </Button>
        ) : (
          <span className="text-ui-500">—</span>
        ),
    },
  ];

  const ubicacionProps = {
    estado: ubicacionEstado,
    gps: ubicacionGps,
    error: ubicacionError,
    manual: usarCoordenadasManuales,
    onManualChange: setUsarCoordenadasManuales,
    lat: manualLat,
    lng: manualLng,
    onLatChange: setManualLat,
    onLngChange: setManualLng,
    onReintentar: solicitarUbicacion,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asistencia"
        subtitle="Entradas, salidas y horas extra validadas por GPS en cada obra."
        action={
          // "Ir a nómina" se quitó: ya está en el menú lateral y el cliente pidió menos botones.
          puedeCrear ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={abrirMarcaje} className="w-full sm:w-auto">
                Marcar entrada / salida
              </Button>
              <Button variant="outline" onClick={abrirCuadrilla}>
                Pase de lista
              </Button>
            </div>
          ) : undefined
        }
      />

      {mensajesError.length > 0 && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10"
        >
          <div className="text-sm text-red-700 dark:text-red-300 min-w-0">
            <p className="font-semibold">No se pudo cargar toda la información de asistencia.</p>
            <ul className="mt-0.5 text-xs space-y-0.5">
              {mensajesError.map((m) => <li key={m} className="break-words">{m}</li>)}
            </ul>
          </div>
          <Button variant="outline" size="sm" onClick={reintentarCarga} disabled={recargando || initialLoading} className="shrink-0">
            {recargando ? 'Reintentando…' : 'Reintentar'}
          </Button>
        </div>
      )}

      {initialLoading ? (
        <LoadingState text="Cargando asistencia..." size="lg" />
      ) : (
        <>
          {/* Indicadores: una sola tira con divisiones de 1px */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-ui-200 border border-ui-200 rounded-xl overflow-hidden">
            <StatsCard
              className="rounded-none border-0 hover:shadow-none hover:bg-ui-50"
              label="En sitio"
              value={registrosCargados ? enSitioCount : '—'}
              onClick={() => filtrarDesdeTarjeta('EnSitio')}
            />
            <StatsCard
              className="rounded-none border-0 hover:shadow-none hover:bg-ui-50"
              label="Fuera de obra"
              value={registrosCargados ? fueraSitioCount : '—'}
              onClick={() => filtrarDesdeTarjeta('FueraSitio')}
            />
            <StatsCard
              className="rounded-none border-0 hover:shadow-none hover:bg-ui-50"
              label="Omisiones hoy"
              value={datosHoyConfiables ? omisionesPorResolver : '—'}
              hint={datosHoyConfiables && filasOmision.length > omisionesPorResolver
                ? `${filasOmision.length - omisionesPorResolver} por llegar`
                : undefined}
              onClick={() => setMainView('faltas')}
            />
            <StatsCard
              className="rounded-none border-0 hover:shadow-none hover:bg-ui-50"
              label="Horas extra hoy"
              value={registrosCargados ? `${totalHorasExtras} h` : '—'}
              hint={registrosCargados ? formatCurrency(totalMontoHorasExtras) : undefined}
              onClick={() => setMainView('horas_extra')}
            />
          </div>

          <Tabs
            value={mainView}
            ariaLabel="Secciones de asistencia"
            onChange={(key) => { if (esVista(key)) setMainView(key); }}
            tabs={[
              { key: 'asistencia', label: 'Hoy', count: registrosCargados ? registros.length : undefined },
              { key: 'calendario_semanal', label: 'Semana' },
              { key: 'horas_extra', label: 'Horas extra', count: registrosCargados ? registrosConHorasExtra.length : undefined },
              { key: 'faltas', label: 'Omisiones', count: datosHoyConfiables ? omisionesPorResolver : undefined },
            ]}
          >
            {/* ── HOY ── */}
            {mainView === 'asistencia' && (
              <div className="space-y-4">
                <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <SearchBar value={search} onChange={setSearch} placeholder="Buscar empleado u obra..." />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="sm:w-52">
                      <Select
                        aria-label="Filtrar por puesto"
                        placeholder="Puesto"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        options={CATEGORIAS.map((c) => ({ value: c.id, label: c.label }))}
                      />
                    </div>
                    <Tabs
                      className="space-y-0"
                      value={filterGeocerca}
                      ariaLabel="Filtrar por geocerca"
                      onChange={(key) => { if (esFiltroGeocerca(key)) setFilterGeocerca(key); }}
                      tabs={[...FILTROS_GEOCERCA]}
                    >
                      {null}
                    </Tabs>
                  </div>
                </div>

                <DataTable
                  headerVariant="neutral"
                  columns={registroColumns}
                  data={filteredRegistros}
                  keyExtractor={(reg) => reg.id}
                  emptyText={registrosCargados ? 'Sin registros de asistencia para los filtros seleccionados.' : 'No se pudieron cargar los registros de hoy.'}
                  onRowClick={(reg) => setSelectedRegistro(reg)}
                />
              </div>
            )}

            {/* ── SEMANA (LUNES A SÁBADO) ── */}
            {mainView === 'calendario_semanal' && (
              <div className="space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                  <p className="text-sm text-ui-600">
                    <span className="font-semibold text-ui-900">Semana {semanalData[0]?.semana ?? '—'}</span>
                    {' · '}puntualidad, faltas y horas extra de lunes a sábado.
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ui-500">
                    {LEYENDA_SEMANA.map((l) => (
                      <span key={l.etiqueta} className="inline-flex items-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', l.punto)} />
                        {l.etiqueta}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-surface rounded-xl border border-ui-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left border-collapse">
                      <thead>
                        <tr className="bg-ui-50 text-ui-500 text-xs border-b border-ui-200">
                          <th className="px-4 py-3 font-semibold">Trabajador</th>
                          {DIAS_SEMANA.map((d) => (
                            <th key={d} className="px-2 py-3 font-semibold text-center">{d}</th>
                          ))}
                          <th className="px-4 py-3 font-semibold text-right">Semana</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ui-100">
                        {semanalData.length === 0 ? (
                          <tr>
                            <td colSpan={DIAS_SEMANA.length + 2} className="px-4 py-10 text-center text-sm text-ui-500">
                              Sin registros de asistencia esta semana.
                            </td>
                          </tr>
                        ) : (
                          semanalData.map((item) => {
                            const trabajador = trabajadores.find((t) => t.id === item.trabajadorId);
                            return (
                              <tr key={item.trabajadorId} className="hover:bg-ui-50 transition-colors">
                                <td className="px-4 py-3">{celdaTrabajador(trabajador, trabajador?.puesto)}</td>
                                {item.dias.map((d) => {
                                  if (d.fecha > hoyISO) {
                                    return (
                                      <td key={d.dia} className="px-2 py-3 text-center text-ui-500" aria-label="Día por venir">—</td>
                                    );
                                  }
                                  // Estado no previsto por la API: se muestra tal cual y en neutro (nunca como falta).
                                  const estilo = ESTILO_DIA[d.estado] ?? { etiqueta: d.estado, clase: 'bg-ui-100 text-ui-500' };
                                  return (
                                    <td key={d.dia} className="px-2 py-3 text-center">
                                      <div className={cn('inline-flex flex-col items-center justify-center min-w-[64px] px-2 py-1.5 rounded-lg', estilo.clase)}>
                                        <span className="text-[11px] font-semibold leading-tight">{estilo.etiqueta}</span>
                                        {d.horaEntrada && <span className="text-[10px] opacity-80 tabular-nums">{d.horaEntrada}</span>}
                                        {d.horasExtra ? <span className="text-[10px] font-semibold text-primary">+{d.horasExtra} h</span> : null}
                                      </div>
                                    </td>
                                  );
                                })}
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  <p className="text-sm font-semibold text-ui-900">
                                    {item.totalDiasAsistidos}/6 días <span className="font-normal text-ui-500">· {item.totalHorasOrdinarias} h</span>
                                  </p>
                                  {item.totalHorasExtra > 0 && <p className="text-xs text-primary">+{item.totalHorasExtra} h extra</p>}
                                  {item.totalOmisionesPendientes > 0 && (
                                    <p className="text-xs text-violet-700 dark:text-violet-300">
                                      {item.totalOmisionesPendientes} omisión por resolver
                                    </p>
                                  )}
                                  {item.totalFaltas > 0 && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                      {item.totalFaltas} falta{item.totalFaltas > 1 ? 's' : ''}
                                    </p>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── HORAS EXTRA ── */}
            {mainView === 'horas_extra' && (
              <div className="space-y-3">
                {registrosCargados && (
                  <p className="text-sm text-ui-600">
                    Total del día: <span className="font-semibold text-ui-900">{totalHorasExtras} h</span>
                    {' · '}
                    <span className="font-semibold text-ui-900">{formatCurrency(totalMontoHorasExtras)}</span> en nómina.
                  </p>
                )}
                <DataTable
                  headerVariant="neutral"
                  columns={horasExtraColumns}
                  data={registrosConHorasExtra}
                  keyExtractor={(r) => r.id}
                  emptyText={registrosCargados ? 'Sin horas extra registradas hoy.' : 'No se pudieron cargar los registros de hoy.'}
                />
              </div>
            )}

            {/* ── OMISIONES ── */}
            {mainView === 'faltas' && !datosHoyConfiables && (
              <p className="text-sm text-ui-600">
                No se puede saber quién falta: no cargó completa la lista de trabajadores o los registros de hoy. Usa
                “Reintentar” en el aviso de arriba.
              </p>
            )}
            {mainView === 'faltas' && datosHoyConfiables && (
              <div className="space-y-3">
                <p className="text-sm text-ui-600">
                  {esDomingo && 'Hoy es domingo, día de descanso: no hay omisiones. '}
                  Checar tarde o no checar queda como omisión. Se resuelve como falta o retardo con el motivo que dio el
                  trabajador; sin resolver a las 17:00, cuenta como falta.
                </p>
                <DataTable
                  headerVariant="neutral"
                  columns={omisionesColumns}
                  data={filasOmision}
                  keyExtractor={(f) => f.id}
                  emptyText="Sin omisiones: todo el personal activo checó a tiempo hoy."
                />
              </div>
            )}
          </Tabs>
        </>
      )}

      {/* Detalle del marcaje con geocerca */}
      {selectedRegistro && (
        <AsistenciaGpsModal
          isOpen={!!selectedRegistro}
          onClose={() => setSelectedRegistro(null)}
          registro={selectedRegistro}
          trabajador={trabajadorSeleccionado ? { nombre: trabajadorSeleccionado.nombre, puesto: trabajadorSeleccionado.puesto, avatar: trabajadorSeleccionado.avatar } : undefined}
          onActualizarEstado={puedeEditar ? handleActualizarEstado : undefined}
          onAprobarHorasExtra={puedeEditar ? handleAprobarHorasExtra : undefined}
          onResolverOmision={puedeEditar ? () => abrirResolverOmision({ registro: selectedRegistro, trabajadorId: selectedRegistro.trabajadorId }) : undefined}
          persistent={!!omisionAResolver}
        />
      )}

      {/* Marcaje individual: entrada / salida / horas extra */}
      <FormModal
        open={clockInModalOpen}
        onClose={cerrarMarcaje}
        onSubmit={handleClockInSubmit}
        title={clockInType === 'entrada' ? 'Marcar entrada' : clockInType === 'salida' ? 'Marcar salida' : 'Registrar horas extra'}
        submitLabel={submitting ? 'Enviando…' : 'Registrar'}
        submitDisabled={clockInType === 'entrada' && obraSeleccionadaEntrada?.lat == null}
        isSubmitting={submitting}
        persistent={!!obraAUbicar}
      >
        <div className="space-y-4">
          <ModalField label="Tipo de registro">
            <div role="group" aria-label="Tipo de registro" className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-ui-100">
              {TIPOS_MARCAJE.map((tipo) => (
                <button
                  key={tipo.id}
                  type="button"
                  aria-pressed={clockInType === tipo.id}
                  onClick={() => setClockInType(tipo.id)}
                  className={cn(
                    'py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer',
                    clockInType === tipo.id ? 'bg-surface dark:bg-ui-200 text-ui-900 shadow-sm' : 'text-ui-500 hover:text-ui-900',
                  )}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          </ModalField>

          <ModalField label="Trabajador">
            <select value={clockInWorkerId} onChange={(e) => setClockInWorkerId(e.target.value)} className={modalSelectClass}>
              {trabajadoresActivos.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre} — {t.puesto}</option>
              ))}
            </select>
          </ModalField>

          {clockInType === 'entrada' && (
            <ModalField label="Obra">
              <select value={clockInObraId} onChange={(e) => setClockInObraId(e.target.value)} className={modalSelectClass}>
                {obras.map((o) => (
                  <option key={o.id} value={o.id}>{o.nombre}{o.lat == null ? ' (sin ubicación)' : ''}</option>
                ))}
              </select>
              {obraSeleccionadaEntrada && obraSeleccionadaEntrada.lat == null && (
                <AvisoObraSinUbicacion
                  className="mt-1.5"
                  puedeRegistrar={puedeEditar}
                  onRegistrar={() => abrirUbicacionObra(obraSeleccionadaEntrada)}
                />
              )}
            </ModalField>
          )}

          <ModalField label="Ubicación del dispositivo">
            <UbicacionDispositivo {...ubicacionProps} etiquetaManual="Ingresar coordenadas manualmente (uso administrativo)">
              {usarCoordenadasManuales && clockInType === 'entrada' && obraSeleccionadaEntrada?.lat != null && (
                <button
                  type="button"
                  onClick={() => { setManualLat(String(obraSeleccionadaEntrada.lat)); setManualLng(String(obraSeleccionadaEntrada.lng)); }}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Usar coordenadas de la obra
                </button>
              )}
            </UbicacionDispositivo>
          </ModalField>

          {clockInType === 'salida' && (
            <div className="p-3 rounded-xl border border-ui-200 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isEarlyDeparture} onChange={(e) => setIsEarlyDeparture(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
                <span className="text-sm font-medium text-ui-800">Salida anticipada (antes del término del turno)</span>
              </label>

              {isEarlyDeparture && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-ui-200">
                  <ModalField label="Horas laboradas">
                    <input type="number" step="0.5" min="0" value={earlyDepartureHours} onChange={(e) => setEarlyDepartureHours(e.target.value)} placeholder="Ej: 5.5" className={modalInputClass} />
                  </ModalField>
                  <ModalField label="Motivo" required>
                    <input type="text" value={earlyDepartureReason} onChange={(e) => setEarlyDepartureReason(e.target.value)} placeholder="Ej: Permiso médico IMSS" className={modalInputClass} />
                  </ModalField>
                </div>
              )}
            </div>
          )}

          {clockInType === 'horas_extra' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ModalField label="Horas extra" required>
                  <input type="number" step="0.5" min="0.5" value={extraHoursInput} onChange={(e) => setExtraHoursInput(e.target.value)} placeholder="Ej: 3.5" className={modalInputClass} />
                </ModalField>
                <ModalField
                  label="Monto estimado"
                  hint={tarifaConfigurada != null
                    ? `Tarifa: ${formatCurrency(tarifaEstimada)} / h`
                    : `Tarifa por defecto: ${formatCurrency(tarifaEstimada)} / h (sin tarifa propia)`}
                >
                  <div className="h-10 sm:h-11 px-3 sm:px-4 flex items-center rounded-xl border border-ui-200 bg-ui-50 text-sm font-semibold text-ui-900 tabular-nums">
                    {formatCurrency((parseFloat(extraHoursInput) || 0) * tarifaEstimada)}
                  </div>
                </ModalField>
              </div>

              <ModalField label="Motivo">
                <input type="text" value={extraMotivo} onChange={(e) => setExtraMotivo(e.target.value)} placeholder="Ej: Colado nocturno de cimentación" className={modalInputClass} />
              </ModalField>
            </>
          )}
        </div>
      </FormModal>

      {/* Pase de lista por cuadrilla */}
      <FormModal
        open={cuadrillaModalOpen}
        onClose={cerrarCuadrilla}
        onSubmit={handleCuadrillaSubmit}
        title="Pase de lista por cuadrilla"
        submitLabel={submitting ? 'Enviando…' : 'Registrar cuadrilla'}
        submitDisabled={obraSeleccionadaCuadrilla?.lat == null}
        isSubmitting={submitting}
        persistent={!!obraAUbicar}
      >
        <div className="space-y-4">
          <ModalField label="Obra o frente de trabajo">
            <select value={cuadrillaObraId} onChange={(e) => setCuadrillaObraId(e.target.value)} className={modalSelectClass}>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}{o.lat == null ? ' (sin ubicación)' : ''}</option>
              ))}
            </select>
          </ModalField>

          {obraSeleccionadaCuadrilla && obraSeleccionadaCuadrilla.lat == null && (
            <AvisoObraSinUbicacion
              className="-mt-2"
              puedeRegistrar={puedeEditar}
              onRegistrar={() => abrirUbicacionObra(obraSeleccionadaCuadrilla)}
            />
          )}

          <ModalField label="Ubicación del dispositivo (residente o cabo)">
            <UbicacionDispositivo {...ubicacionProps} etiquetaManual="Ingresar coordenadas manualmente" />
          </ModalField>

          <ModalField label={`Trabajadores en el frente · ${selectedCuadrillaWorkers.length} seleccionados`}>
            <div className="max-h-60 overflow-y-auto rounded-xl border border-ui-200 divide-y divide-ui-100">
              {trabajadoresActivos.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ui-500">No hay trabajadores activos.</p>
              ) : (
                trabajadoresActivos.map((t) => {
                  const isChecked = selectedCuadrillaWorkers.includes(t.id);
                  return (
                    <label key={t.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-ui-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedCuadrillaWorkers((prev) => [...prev, t.id]);
                          else setSelectedCuadrillaWorkers((prev) => prev.filter((id) => id !== t.id));
                        }}
                        className="w-4 h-4 rounded accent-primary shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ui-900 truncate">{t.nombre}</p>
                        <p className="text-xs text-ui-500 truncate">{t.puesto}</p>
                      </div>
                      <Badge variant="neutral" size="sm">{ETIQUETA_CATEGORIA[t.categoriaPuesto] ?? t.categoriaPuesto}</Badge>
                    </label>
                  );
                })
              )}
            </div>
          </ModalField>
        </div>
      </FormModal>

      {/* Resolver una omisión: falta o retardo, con el motivo que dio el trabajador */}
      {omisionAResolver && (
        <FormModal
          open
          onClose={cerrarResolverOmision}
          onSubmit={guardarResolucionOmision}
          title="Resolver omisión"
          subtitle={trabajadorOmision?.nombre}
          submitLabel={resolviendoOmision ? 'Guardando…' : 'Guardar'}
          isSubmitting={resolviendoOmision}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-ui-600">
              {omisionAResolver.registro
                ? `Checó a las ${omisionAResolver.registro.horaEntrada ?? '—'}${trabajadorOmision?.entrada ? ` y su entrada es a las ${trabajadorOmision.entrada}` : ''}.`
                : 'No checó entrada hoy.'}
              {omisionAResolver.registro?.omisionVencida && ' Ya pasó el plazo de las 17:00: mientras no se resuelva, cuenta como falta.'}
            </p>
            <ModalField label="Queda como" required error={erroresOmision.resolucion}>
              <div role="group" aria-label="Resolución de la omisión" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-ui-100">
                {(['Retardo', 'Falta'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={resolucionOmision === r}
                    onClick={() => {
                      setResolucionOmision(r);
                      setErroresOmision((e) => ({ ...e, resolucion: undefined }));
                    }}
                    className={cn(
                      'py-2 px-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer',
                      resolucionOmision === r ? 'bg-surface dark:bg-ui-200 text-ui-900 shadow-sm' : 'text-ui-500 hover:text-ui-900',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </ModalField>
            <ModalField
              label="Motivo que dio el trabajador"
              required
              error={erroresOmision.motivo}
              hint="Queda registrado en la auditoría con tu usuario."
            >
              <textarea
                aria-label="Motivo de la omisión"
                rows={3}
                maxLength={MOTIVO_OMISION_MAX}
                className={modalTextareaClass}
                placeholder="Ej: Se le ponchó una llanta en el camino"
                value={motivoOmision}
                onChange={(e) => {
                  setMotivoOmision(e.target.value);
                  setErroresOmision((er) => ({ ...er, motivo: undefined }));
                }}
              />
            </ModalField>
            <p className="text-xs text-ui-500">La falta se descuenta en nómina y el retardo no. Una vez resuelta, ya no cambia aquí.</p>
          </div>
        </FormModal>
      )}

      {/* Registrar la ubicación de una obra (centro y radio de su geocerca) */}
      {obraAUbicar && (
        <FormModal
          open
          onClose={() => { if (!guardandoUbicacionObra) cerrarUbicacionObra(); }}
          onSubmit={guardarUbicacionObra}
          title="Registrar ubicación de la obra"
          subtitle={obraAUbicar.nombre}
          submitLabel={guardandoUbicacionObra ? 'Guardando…' : 'Registrar ubicación'}
          isSubmitting={guardandoUbicacionObra}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-ui-600">
              Párate en el centro de la obra (o en su acceso principal) y toma la ubicación con el GPS del teléfono. Desde ese
              punto se mide la distancia de cada checado.
            </p>
            <ModalField label="Ubicación">
              <UbicacionDispositivo {...ubicacionProps} etiquetaManual="Escribir las coordenadas (por ejemplo, copiadas de Google Maps)" />
            </ModalField>
            <ModalField
              label="Radio permitido (metros)"
              required
              error={errorRadioObra ?? undefined}
              hint={`De ${RADIO_OBRA_MIN} m a ${RADIO_OBRA_MAX} m. Quien cheque más lejos queda como fuera de obra.`}
            >
              <input
                aria-label="Radio permitido en metros"
                type="number"
                min={RADIO_OBRA_MIN}
                max={RADIO_OBRA_MAX}
                step="10"
                inputMode="numeric"
                className={modalInputClass}
                value={radioObra}
                onChange={(e) => {
                  setRadioObra(e.target.value);
                  setErrorRadioObra(null);
                }}
              />
            </ModalField>
          </div>
        </FormModal>
      )}
    </div>
  );
}
