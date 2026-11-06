"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiResponse } from '@svr-erp/shared';
import {
  gpsApi,
  type GeocercaDTO,
  type HistorialGpsDTO,
  type MaquinaGpsDTO,
  type PaginatedResponse,
  type TipoGeocerca,
} from '@/lib/api';
import { APP_TIMEZONE } from '@/lib/formatters';
import { useToast } from '@/components/layout/Toast';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState } from '@/components/ui/LoadingState';
import { Tabs } from '@/components/ui/Tabs';
import {
  FormModal,
  Modal,
  ModalBody,
  ModalField,
  ModalFooter,
  ModalHeader,
  modalInputClass,
  modalSelectClass,
} from '@/components/ui/Modal';
import {
  GpsMap, MachineList, TrackingPanel, GpsTimeline, LiveIndicator,
  type GpsMachine,
} from '@/components/ui/GpsTracking';

type Fuente = 'rastreo' | 'geocercas';
const ETIQUETA_FUENTE: Record<Fuente, string> = {
  rastreo: 'Rastreo',
  geocercas: 'Geocercas',
};

const VISTAS = ['rastreo', 'geocercas'] as const;
type Vista = (typeof VISTAS)[number];
const esVista = (v: string): v is Vista => (VISTAS as readonly string[]).includes(v);

const TIPOS_GEOCERCA: Array<{ value: TipoGeocerca; label: string }> = [
  { value: 'OBRA', label: 'Obra' },
  { value: 'PATIO', label: 'Patio de maquinaria' },
  { value: 'ESTACION', label: 'Estación de servicio' },
  { value: 'RUTA', label: 'Ruta autorizada' },
  { value: 'PROHIBIDA', label: 'Zona prohibida' },
];
const TIPO_LABEL = Object.fromEntries(TIPOS_GEOCERCA.map((t) => [t.value, t.label])) as Record<TipoGeocerca, string>;
const esTipo = (v: string): v is TipoGeocerca => TIPOS_GEOCERCA.some((t) => t.value === v);

/** Refresco automático del rastreo, en milisegundos. */
const INTERVALO_REFRESCO_MS = 30000;
const PAGE_SIZE = 10;

// Mismas reglas que CreateGeocercaDto de la API.
const NOMBRE_MIN = 3;
const NOMBRE_MAX = 120;
const RADIO_MIN = 10;
const RADIO_MAX = 50000;
const COLOR_HEX = /^#[0-9a-fA-F]{6}$/;

interface FormGeocerca {
  nombre: string;
  tipo: TipoGeocerca;
  color: string;
  centroLat: string;
  centroLng: string;
  radioMetros: string;
  activa: boolean;
}

const FORM_VACIO: FormGeocerca = { nombre: '', tipo: 'OBRA', color: '#3b82f6', centroLat: '', centroLng: '', radioMetros: '300', activa: true };

type Errores = Partial<Record<keyof FormGeocerca, string>>;

/** Número dentro de [min, max] con hasta `decimales`, o null. */
function leerNumero(valor: string, min: number, max: number, decimales: number): number | null {
  if (valor.trim() === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) && n >= min && n <= max && Number(n.toFixed(decimales)) === n ? n : null;
}

const horaDe = (d: Date) => d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: APP_TIMEZONE });

export default function GpsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const vista = user?.vistas?.find((v) => v.ruta === '/gps');
  // La API pide maquinaria.gps.editar para crear, editar, borrar geocercas y simular posiciones.
  const puedeEditar = vista?.puedeEditar ?? false;

  const [maquinas, setMaquinas] = useState<MaquinaGpsDTO[]>([]);
  const [geocercas, setGeocercas] = useState<PaginatedResponse<GeocercaDTO> | null>(null);
  const [errores, setErrores] = useState<Partial<Record<Fuente, string>>>({});
  const [actualizadoEn, setActualizadoEn] = useState<Date | null>(null);
  const [cargaInicial, setCargaInicial] = useState(true);
  const [recargando, setRecargando] = useState(false);
  // Número de la última petición por fuente: una respuesta vieja no pisa a la nueva.
  const secuencia = useRef<Partial<Record<Fuente, number>>>({});

  const [tab, setTab] = useState<Vista>('rastreo');
  const [paginaGeocercas, setPaginaGeocercas] = useState(1);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [historial, setHistorial] = useState<HistorialGpsDTO | null>(null);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);
  const [intentoHistorial, setIntentoHistorial] = useState(0);
  const [simulando, setSimulando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<GeocercaDTO | null>(null);
  const [form, setForm] = useState<FormGeocerca>(FORM_VACIO);
  const [erroresForm, setErroresForm] = useState<Errores>({});
  const [porEliminar, setPorEliminar] = useState<GeocercaDTO | null>(null);
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false);

  const cargarFuente = useCallback(
    async <T,>(fuente: Fuente, pedir: () => Promise<ApiResponse<T>>, guardar: (d: T) => void) => {
      const numero = (secuencia.current[fuente] ?? 0) + 1;
      secuencia.current[fuente] = numero;
      try {
        const res = await pedir();
        if (secuencia.current[fuente] !== numero) return;
        if (!res.success) throw new Error(res.error.message);
        guardar(res.data);
        setErrores((prev) => {
          if (!(fuente in prev)) return prev;
          const siguiente = { ...prev };
          delete siguiente[fuente];
          return siguiente;
        });
      } catch (error) {
        if (secuencia.current[fuente] !== numero) return;
        setErrores((prev) => ({ ...prev, [fuente]: error instanceof Error ? error.message : 'error desconocido' }));
      }
    },
    [],
  );

  const cargarRastreo = useCallback(
    () =>
      cargarFuente('rastreo', gpsApi.maquinas, (lista: MaquinaGpsDTO[]) => {
        setMaquinas(lista);
        setActualizadoEn(new Date());
        setSelectedId((actual) => (actual && lista.some((m) => m.id === actual) ? actual : lista[0]?.id));
      }),
    [cargarFuente],
  );

  const cargarGeocercas = useCallback(
    () => cargarFuente('geocercas', () => gpsApi.listarGeocercas({ page: paginaGeocercas, limit: PAGE_SIZE }), setGeocercas),
    [cargarFuente, paginaGeocercas],
  );

  useEffect(() => {
    (async () => {
      try {
        await cargarRastreo();
      } finally {
        setCargaInicial(false);
      }
    })();
  }, [cargarRastreo]);

  useEffect(() => {
    (async () => {
      await cargarGeocercas();
    })();
  }, [cargarGeocercas]);

  // Refresco periódico de las posiciones. Si falla, el aviso de arriba lo dice y la hora de la última
  // actualización queda a la vista (antes el error se tragaba y la posición vieja parecía actual).
  useEffect(() => {
    const timer = setInterval(() => {
      void cargarRastreo();
    }, INTERVALO_REFRESCO_MS);
    return () => clearInterval(timer);
  }, [cargarRastreo]);

  // Recorrido y eventos de hoy de la máquina seleccionada (se refresca con cada actualización del rastreo).
  useEffect(() => {
    if (!selectedId) return;
    let cancelado = false;
    (async () => {
      try {
        const res = await gpsApi.historial(selectedId, { limit: 100 });
        if (cancelado) return;
        if (!res.success) throw new Error(res.error.message);
        setHistorial(res.data);
        setErrorHistorial(null);
      } catch (error) {
        if (cancelado) return;
        // Antes un fallo se mostraba como "sin entradas ni salidas hoy", que no era cierto.
        setErrorHistorial(error instanceof Error ? error.message : 'error desconocido');
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [selectedId, actualizadoEn, intentoHistorial]);

  const reintentar = async () => {
    if (recargando) return;
    setRecargando(true);
    try {
      await Promise.all([cargarRastreo(), cargarGeocercas()]);
    } finally {
      setRecargando(false);
    }
  };

  const conCandado = async (accion: () => Promise<void>) => {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    try {
      await accion();
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  const simular = async () => {
    if (simulando) return;
    setSimulando(true);
    try {
      const res = await gpsApi.simular();
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      const { entradas, salidas, maquinasActualizadas } = res.data;
      showToast(
        `Posiciones simuladas para ${maquinasActualizadas} máquina${maquinasActualizadas === 1 ? '' : 's'}` +
          (entradas.length + salidas.length > 0 ? ` (${entradas.length} entradas y ${salidas.length} salidas de geocerca).` : '.'),
        'success',
      );
      await Promise.all([cargarRastreo(), cargarGeocercas()]);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudieron simular las posiciones.', 'error');
    } finally {
      setSimulando(false);
    }
  };

  // ── Geocercas ──
  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setErroresForm({});
    setModalAbierto(true);
  };

  const abrirEditar = (g: GeocercaDTO) => {
    setEditando(g);
    setForm({
      nombre: g.nombre,
      tipo: g.tipo,
      color: g.color,
      centroLat: String(g.centroLat),
      centroLng: String(g.centroLng),
      radioMetros: String(g.radioMetros),
      activa: g.activa,
    });
    setErroresForm({});
    setModalAbierto(true);
  };

  const cambiar = <K extends keyof FormGeocerca>(campo: K, valor: FormGeocerca[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErroresForm((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
  };

  const guardar = () => conCandado(async () => {
    const e: Errores = {};
    const nombre = form.nombre.trim();
    if (nombre.length < NOMBRE_MIN || nombre.length > NOMBRE_MAX) e.nombre = `Escribe el nombre (de ${NOMBRE_MIN} a ${NOMBRE_MAX} caracteres).`;
    if (!COLOR_HEX.test(form.color)) e.color = 'Elige un color.';
    const lat = leerNumero(form.centroLat, -90, 90, 6);
    if (lat === null) e.centroLat = 'Latitud entre -90 y 90, hasta 6 decimales.';
    const lng = leerNumero(form.centroLng, -180, 180, 6);
    if (lng === null) e.centroLng = 'Longitud entre -180 y 180, hasta 6 decimales.';
    const radio = leerNumero(form.radioMetros, RADIO_MIN, RADIO_MAX, 2);
    if (radio === null) e.radioMetros = `Radio de ${RADIO_MIN} a ${RADIO_MAX.toLocaleString('es-MX')} m.`;
    if (lat === null || lng === null || radio === null || Object.values(e).some(Boolean)) {
      setErroresForm(e);
      return;
    }

    const datos = { nombre, tipo: form.tipo, color: form.color, centroLat: lat, centroLng: lng, radioMetros: radio, activa: form.activa };
    try {
      const res = editando ? await gpsApi.actualizarGeocerca(editando.id, datos) : await gpsApi.crearGeocerca(datos);
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      setModalAbierto(false);
      showToast(editando ? `Geocerca "${nombre}" actualizada.` : `Geocerca "${nombre}" creada.`, 'success');
      if (!editando && paginaGeocercas !== 1) setPaginaGeocercas(1);
      else void cargarGeocercas();
      void cargarRastreo();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo guardar la geocerca.', 'error');
    }
  });

  const eliminar = () => conCandado(async () => {
    if (!porEliminar) return;
    try {
      const res = await gpsApi.eliminarGeocerca(porEliminar.id);
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      showToast(`Geocerca "${porEliminar.nombre}" eliminada.`, 'success');
      setPorEliminar(null);
      if (geocercas && geocercas.items.length === 1 && paginaGeocercas > 1) setPaginaGeocercas(paginaGeocercas - 1);
      else void cargarGeocercas();
      void cargarRastreo();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo eliminar la geocerca.', 'error');
    }
  });

  // El componente del mapa trabaja con su propio formato; los campos extra se quedan fuera a propósito.
  const machines: GpsMachine[] = maquinas.map((m) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    status: m.status,
    lat: m.lat,
    lng: m.lng,
    speed: m.speed,
    heading: m.heading,
    fuel: m.fuel,
    temperature: m.temperature,
    hours: m.hours,
    lastUpdate: m.lastUpdate,
    operator: m.operator,
  }));

  const seleccionada = maquinas.find((m) => m.id === selectedId);
  const seleccionadaMapa = machines.find((m) => m.id === selectedId);
  const hayDatos = maquinas.length > 0;
  const contar = (estado: MaquinaGpsDTO['status']) => maquinas.filter((m) => m.status === estado).length;
  const simuladas = maquinas.some((m) => m.simulada);
  const mensajesError = (Object.entries(errores) as [Fuente, string][]).map(([f, m]) => `${ETIQUETA_FUENTE[f]}: ${m}`);

  const columnasGeocercas: Column<GeocercaDTO>[] = [
    {
      key: 'nombre',
      header: 'Geocerca',
      render: (g) => (
        <div className="flex items-start gap-2.5 min-w-0 whitespace-normal">
          {/* El color lo elige el usuario: es un valor de datos, por eso va en style. */}
          <span className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ui-900">{g.nombre}</p>
            <p className="text-xs text-ui-500">
              {TIPO_LABEL[g.tipo]}
              <span className="sm:hidden"> · {g.radioMetros.toLocaleString('es-MX')} m</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'centro',
      header: 'Centro',
      className: 'hidden lg:table-cell',
      render: (g) => <span className="text-xs font-mono text-ui-600">{g.centroLat.toFixed(6)}, {g.centroLng.toFixed(6)}</span>,
    },
    {
      key: 'radio',
      header: 'Radio',
      align: 'right',
      className: 'hidden sm:table-cell',
      render: (g) => <span className="text-sm text-ui-700 tabular-nums">{g.radioMetros.toLocaleString('es-MX')} m</span>,
    },
    {
      key: 'dentro',
      header: 'Máquinas dentro',
      align: 'right',
      className: 'hidden md:table-cell',
      render: (g) => <span className="text-sm text-ui-800 tabular-nums">{g.maquinasDentro}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (g) => <Badge variant={g.activa ? 'success' : 'neutral'} size="sm">{g.activa ? 'Activa' : 'Inactiva'}</Badge>,
    },
    ...(puedeEditar
      ? [
          {
            key: 'acciones',
            header: 'Acciones',
            align: 'right' as const,
            render: (g: GeocercaDTO) => (
              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => abrirEditar(g)}>Editar</Button>
                <Button type="button" variant="ghost" size="sm" className="text-red-600 dark:text-red-400" onClick={() => setPorEliminar(g)}>
                  Eliminar
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="GPS"
        subtitle="Ubicación de la maquinaria y entradas y salidas de sus geocercas."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* "En vivo" solo cuando las posiciones vienen del proveedor; con simulación no sería cierto. */}
            {hayDatos && !simuladas && !errores.rastreo && <LiveIndicator />}
            {puedeEditar && (
              <Button type="button" variant="outline" onClick={simular} disabled={simulando || !hayDatos}>
                {simulando ? 'Simulando…' : 'Simular posiciones'}
              </Button>
            )}
            {puedeEditar && <Button type="button" onClick={abrirCrear}>Nueva geocerca</Button>}
          </div>
        }
      />

      {mensajesError.length > 0 && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10"
        >
          <div className="text-sm text-red-700 dark:text-red-300 min-w-0">
            <p className="font-semibold">
              No se pudo cargar toda la información del GPS.
              {errores.rastreo && actualizadoEn && ` Las posiciones son de las ${horaDe(actualizadoEn)}.`}
            </p>
            <ul className="mt-0.5 text-xs space-y-0.5">
              {mensajesError.map((m) => <li key={m} className="break-words">{m}</li>)}
            </ul>
          </div>
          <Button variant="outline" size="sm" onClick={reintentar} disabled={recargando || cargaInicial} className="shrink-0">
            {recargando ? 'Reintentando…' : 'Reintentar'}
          </Button>
        </div>
      )}

      {simuladas && (
        <div className="px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-sm text-blue-800 dark:text-blue-300">
          <span className="font-semibold">Posiciones simuladas.</span> El GPS del proveedor todavía no está conectado: las
          posiciones las genera el botón Simular posiciones y sirven para probar las geocercas, no para ubicar la maquinaria.
        </div>
      )}

      {cargaInicial ? (
        <LoadingState text="Cargando GPS..." size="lg" />
      ) : (
        <>
          {/* Indicadores: una sola tira con divisiones de 1px */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-ui-200 border border-ui-200 rounded-xl overflow-hidden">
            <StatsCard className="rounded-none border-0" label="En movimiento" value={hayDatos ? contar('moving') : '—'} />
            <StatsCard className="rounded-none border-0" label="Detenidas" value={hayDatos ? contar('idle') : '—'} />
            <StatsCard className="rounded-none border-0" label="Sin señal" value={hayDatos ? contar('offline') : '—'} hint={hayDatos ? 'Más de 15 min sin posición' : undefined} />
            <StatsCard className="rounded-none border-0" label="En alerta" value={hayDatos ? contar('alert') : '—'} hint={hayDatos ? 'Mantenimiento o posible ordeña' : undefined} />
          </div>

          <p className="text-xs text-ui-500">
            {actualizadoEn ? `Actualizado a las ${horaDe(actualizadoEn)} · se refresca cada 30 s` : 'Sin datos de rastreo todavía'}
          </p>

          <Tabs
            ariaLabel="Secciones de GPS"
            value={tab}
            onChange={(k) => { if (esVista(k)) setTab(k); }}
            tabs={[
              { key: 'rastreo', label: 'Rastreo', count: hayDatos ? maquinas.length : undefined },
              { key: 'geocercas', label: 'Geocercas', count: geocercas?.pagination.total },
            ]}
          >
            {/* ── RASTREO ── */}
            {tab === 'rastreo' && (
              !hayDatos ? (
                <div className="px-4 py-10 text-center text-sm text-ui-500 bg-surface border border-ui-200 rounded-xl">
                  {errores.rastreo
                    ? 'No se pudo cargar el rastreo.'
                    : 'No hay maquinaria activa para rastrear. Da de alta máquinas en Flota para verlas aquí.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                  <div className="xl:col-span-2 space-y-4 min-w-0">
                    <GpsMap
                      machines={machines}
                      selectedId={selectedId}
                      onSelect={(m) => setSelectedId(m.id)}
                      height="clamp(280px, 45vh, 460px)"
                    />
                    <Card padding="sm">
                      <h3 className="text-sm font-semibold text-ui-900 mb-3">Unidades ({maquinas.length})</h3>
                      <MachineList machines={machines} selectedId={selectedId} onSelect={(m) => setSelectedId(m.id)} />
                    </Card>
                  </div>

                  <div className="space-y-4 min-w-0">
                    {seleccionadaMapa && <TrackingPanel machine={seleccionadaMapa} />}

                    {seleccionada && seleccionada.geocercas.length > 0 && (
                      <Card padding="sm">
                        <h3 className="text-sm font-semibold text-ui-900 mb-3">Dentro de</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {seleccionada.geocercas.map((g) => (
                            <span
                              key={g.nombre}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-ui-700 bg-ui-50 border border-ui-200"
                            >
                              {/* Color elegido por el usuario (dato), por eso va en style. */}
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                              {g.nombre}
                            </span>
                          ))}
                        </div>
                      </Card>
                    )}

                    <Card padding="sm">
                      <h3 className="text-sm font-semibold text-ui-900 mb-3">Eventos de hoy</h3>
                      {errorHistorial ? (
                        <div className="space-y-2">
                          <p className="text-xs text-red-600 dark:text-red-400 break-words">No se pudo cargar el recorrido de hoy: {errorHistorial}</p>
                          <Button type="button" variant="outline" size="sm" onClick={() => setIntentoHistorial((n) => n + 1)}>Reintentar</Button>
                        </div>
                      ) : !historial ? (
                        <p className="text-xs text-ui-500">Cargando…</p>
                      ) : historial.eventos.length > 0 ? (
                        <GpsTimeline events={historial.eventos} />
                      ) : (
                        <p className="text-xs text-ui-500">Sin entradas ni salidas de geocerca hoy para esta unidad.</p>
                      )}
                    </Card>

                    {!errorHistorial && historial && historial.puntos.length > 0 && (
                      <Card padding="sm">
                        <h3 className="text-sm font-semibold text-ui-900 mb-1">Recorrido de hoy</h3>
                        <p className="text-xs text-ui-500">
                          {historial.puntos.length} posiciones registradas · la última a las {historial.puntos[0].time} h
                        </p>
                      </Card>
                    )}
                  </div>
                </div>
              )
            )}

            {/* ── GEOCERCAS ── */}
            {tab === 'geocercas' && (
              <div className="space-y-4">
                <p className="text-sm text-ui-600">
                  Zonas de obra, patios o áreas prohibidas. Con cada posición se detecta sola la entrada o salida de cada máquina.
                </p>
                <DataTable
                  headerVariant="neutral"
                  columns={columnasGeocercas}
                  data={geocercas?.items ?? []}
                  loading={!geocercas && !errores.geocercas}
                  keyExtractor={(g) => g.id}
                  maxBodyHeight="none"
                  emptyText={errores.geocercas ? 'No se pudieron cargar las geocercas.' : 'Todavía no hay geocercas.'}
                />
                {geocercas && (
                  <Pagination
                    currentPage={geocercas.pagination.page}
                    totalPages={geocercas.pagination.totalPages}
                    totalRecords={geocercas.pagination.total}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPaginaGeocercas}
                  />
                )}
              </div>
            )}
          </Tabs>
        </>
      )}

      {/* ── Crear / editar geocerca ── */}
      <FormModal
        open={modalAbierto}
        onClose={() => { if (!enviando) setModalAbierto(false); }}
        onSubmit={guardar}
        title={editando ? 'Editar geocerca' : 'Nueva geocerca'}
        submitLabel={enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear'}
        isSubmitting={enviando}
      >
        <div className="space-y-4">
          <ModalField label="Nombre" required error={erroresForm.nombre}>
            <input
              aria-label="Nombre de la geocerca"
              className={modalInputClass}
              maxLength={NOMBRE_MAX}
              placeholder="Nombre de la zona"
              value={form.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
            />
          </ModalField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ModalField label="Tipo" required>
              <select
                aria-label="Tipo de geocerca"
                className={modalSelectClass}
                value={form.tipo}
                onChange={(e) => { if (esTipo(e.target.value)) cambiar('tipo', e.target.value); }}
              >
                {TIPOS_GEOCERCA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </ModalField>
            <ModalField label="Color en el mapa" error={erroresForm.color}>
              <input
                aria-label="Color en el mapa"
                type="color"
                className="w-full h-[42px] rounded-xl border border-ui-200 bg-surface px-2 cursor-pointer"
                value={form.color}
                onChange={(e) => cambiar('color', e.target.value)}
              />
            </ModalField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ModalField label="Latitud del centro" required error={erroresForm.centroLat}>
              <input
                aria-label="Latitud del centro"
                type="number"
                step="0.000001"
                inputMode="decimal"
                className={modalInputClass}
                value={form.centroLat}
                onChange={(e) => cambiar('centroLat', e.target.value)}
              />
            </ModalField>
            <ModalField label="Longitud del centro" required error={erroresForm.centroLng}>
              <input
                aria-label="Longitud del centro"
                type="number"
                step="0.000001"
                inputMode="decimal"
                className={modalInputClass}
                value={form.centroLng}
                onChange={(e) => cambiar('centroLng', e.target.value)}
              />
            </ModalField>
            <ModalField label="Radio (m)" required error={erroresForm.radioMetros}>
              <input
                aria-label="Radio en metros"
                type="number"
                step="1"
                min={RADIO_MIN}
                max={RADIO_MAX}
                inputMode="numeric"
                className={modalInputClass}
                value={form.radioMetros}
                onChange={(e) => cambiar('radioMetros', e.target.value)}
              />
            </ModalField>
          </div>
          <label className="flex items-start gap-2 p-3 rounded-xl border border-ui-200 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 accent-primary"
              checked={form.activa}
              onChange={(e) => cambiar('activa', e.target.checked)}
            />
            <span className="text-sm text-ui-800">Activa (solo las activas detectan entradas y salidas)</span>
          </label>
        </div>
      </FormModal>

      {/* ── Confirmar eliminación (antes era un window.confirm) ── */}
      {porEliminar && (
        <Modal open onClose={() => { if (!enviando) setPorEliminar(null); }} size="sm">
          <ModalHeader title="Eliminar geocerca" onClose={() => { if (!enviando) setPorEliminar(null); }} />
          <ModalBody>
            <p className="text-sm text-ui-700">
              Se eliminará la geocerca <span className="font-semibold text-ui-900">{porEliminar.nombre}</span>. Deja de detectar
              entradas y salidas, y se pierde el registro de qué máquinas están dentro.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setPorEliminar(null)} disabled={enviando}>Cancelar</Button>
            <Button variant="danger" onClick={eliminar} loading={enviando} disabled={enviando}>
              {enviando ? 'Eliminando…' : 'Sí, eliminar'}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
