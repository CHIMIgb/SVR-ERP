"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  MapPin, Truck, Pause, WifiOff, AlertTriangle,
  Plus, Pencil, Trash2, RefreshCw, Radar, Navigation,
} from 'lucide-react';
import {
  gpsApi,
  type MaquinaGpsDTO,
  type GeocercaDTO,
  type HistorialGpsDTO,
  type TipoGeocerca,
} from '@/lib/api';
import { useToast } from '@/components/layout/Toast';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { FormModal, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';
import {
  GpsMap, MachineList, TrackingPanel, GpsTimeline, LiveIndicator,
  type GpsMachine,
} from '@/components/ui/GpsTracking';

const TIPOS_GEOCERCA: Array<{ value: TipoGeocerca; label: string }> = [
  { value: 'OBRA', label: 'Obra' },
  { value: 'PATIO', label: 'Patio de maquinaria' },
  { value: 'ESTACION', label: 'Estación de servicio' },
  { value: 'RUTA', label: 'Ruta autorizada' },
  { value: 'PROHIBIDA', label: 'Zona prohibida' },
];

const TIPO_LABEL: Record<TipoGeocerca, string> = {
  OBRA: 'Obra',
  PATIO: 'Patio de maquinaria',
  ESTACION: 'Estación de servicio',
  RUTA: 'Ruta autorizada',
  PROHIBIDA: 'Zona prohibida',
};

const TIPO_BADGE: Record<TipoGeocerca, 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  OBRA: 'primary',
  PATIO: 'info',
  ESTACION: 'success',
  RUTA: 'warning',
  PROHIBIDA: 'error',
};

/** Refresco automático del rastreo, en milisegundos. */
const INTERVALO_REFRESCO_MS = 30000;

const formInicial = {
  nombre: '',
  tipo: 'OBRA' as TipoGeocerca,
  color: '#3b82f6',
  centroLat: '',
  centroLng: '',
  radioMetros: '300',
  activa: true,
};

export default function GpsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const vista = user?.vistas?.find((v) => v.ruta === '/gps');
  const puedeEditar = vista?.puedeEditar ?? false;

  const [maquinas, setMaquinas] = useState<MaquinaGpsDTO[]>([]);
  const [geocercas, setGeocercas] = useState<GeocercaDTO[]>([]);
  const [historial, setHistorial] = useState<HistorialGpsDTO | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [tab, setTab] = useState('rastreo');
  const hasLoaded = useRef(false);

  // Modal de geocerca
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<GeocercaDTO | null>(null);
  const [form, setForm] = useState(formInicial);
  const [guardando, setGuardando] = useState(false);

  const cargarRastreo = useCallback(async () => {
    const res = await gpsApi.maquinas();
    if (!res.success) throw new Error(res.error.message);
    setMaquinas(res.data);
    return res.data;
  }, []);

  const cargarGeocercas = useCallback(async () => {
    const res = await gpsApi.listarGeocercas({ limit: 100 });
    if (!res.success) throw new Error(res.error.message);
    setGeocercas(res.data.items);
  }, []);

  const cargarTodo = useCallback(async () => {
    try {
      setErrorCarga(null);
      const [lista] = await Promise.all([cargarRastreo(), cargarGeocercas()]);
      setSelectedId((actual) => actual ?? lista[0]?.id);
    } catch {
      setErrorCarga('No se pudo cargar el rastreo GPS. Revisa que el servidor esté disponible.');
    } finally {
      setInitialLoading(false);
    }
  }, [cargarRastreo, cargarGeocercas]);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    cargarTodo();
  }, [cargarTodo]);

  // Refresco periódico del rastreo (sólo la posición, no las geocercas).
  useEffect(() => {
    const timer = setInterval(() => {
      cargarRastreo().catch(() => {
        /* un fallo puntual de refresco no debe romper la vista ya cargada */
      });
    }, INTERVALO_REFRESCO_MS);
    return () => clearInterval(timer);
  }, [cargarRastreo]);

  // Historial de la máquina seleccionada.
  useEffect(() => {
    if (!selectedId) {
      setHistorial(null);
      return;
    }
    let cancelado = false;
    gpsApi
      .historial(selectedId, { limit: 100 })
      .then((res) => {
        if (!cancelado) setHistorial(res.success ? res.data : null);
      })
      .catch(() => {
        if (!cancelado) setHistorial(null);
      });
    return () => {
      cancelado = true;
    };
  }, [selectedId, maquinas]);

  const handleSimular = async () => {
    if (simulando) return;
    setSimulando(true);
    try {
      const res = await gpsApi.simular();
      if (!res.success) throw new Error(res.error.message);
      const { entradas, salidas, maquinasActualizadas } = res.data;
      await cargarTodo();
      const cruces = entradas.length + salidas.length;
      showToast(
        cruces > 0
          ? `Posiciones actualizadas (${maquinasActualizadas} máquinas, ${entradas.length} entradas y ${salidas.length} salidas de geocerca)`
          : `Posiciones actualizadas (${maquinasActualizadas} máquinas)`,
        'success',
      );
    } catch {
      showToast('No se pudo actualizar el rastreo', 'error');
    } finally {
      setSimulando(false);
    }
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(formInicial);
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
    setModalAbierto(true);
  };

  const handleGuardar = async () => {
    if (guardando) return;

    const centroLat = Number(form.centroLat);
    const centroLng = Number(form.centroLng);
    const radioMetros = Number(form.radioMetros);

    if (!form.nombre.trim() || form.nombre.trim().length < 3) {
      showToast('El nombre debe tener al menos 3 caracteres', 'error');
      return;
    }
    if (!Number.isFinite(centroLat) || centroLat < -90 || centroLat > 90) {
      showToast('La latitud debe estar entre -90 y 90', 'error');
      return;
    }
    if (!Number.isFinite(centroLng) || centroLng < -180 || centroLng > 180) {
      showToast('La longitud debe estar entre -180 y 180', 'error');
      return;
    }
    if (!Number.isFinite(radioMetros) || radioMetros < 10 || radioMetros > 50000) {
      showToast('El radio debe estar entre 10 y 50,000 metros', 'error');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        color: form.color,
        centroLat: Number(centroLat.toFixed(6)),
        centroLng: Number(centroLng.toFixed(6)),
        radioMetros: Number(radioMetros.toFixed(2)),
        activa: form.activa,
      };

      const res = editando
        ? await gpsApi.actualizarGeocerca(editando.id, payload)
        : await gpsApi.crearGeocerca(payload);
      if (!res.success) throw new Error(res.error.message);
      showToast(editando ? 'Geocerca actualizada' : 'Geocerca creada', 'success');
      setModalAbierto(false);
      await cargarTodo();
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : 'No se pudo guardar la geocerca';
      showToast(mensaje, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (g: GeocercaDTO) => {
    if (!window.confirm(`¿Eliminar la geocerca "${g.nombre}"? Se perderá el registro de qué máquinas están dentro.`)) {
      return;
    }
    try {
      const res = await gpsApi.eliminarGeocerca(g.id);
      if (!res.success) throw new Error(res.error.message);
      showToast('Geocerca eliminada', 'success');
      await cargarTodo();
    } catch {
      showToast('No se pudo eliminar la geocerca', 'error');
    }
  };

  // El componente de mapa trabaja con su propio shape; los campos extra
  // (geocercas, maquinaId) se quedan fuera a propósito.
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

  const enMovimiento = maquinas.filter((m) => m.status === 'moving').length;
  const detenidas = maquinas.filter((m) => m.status === 'idle').length;
  const sinSenal = maquinas.filter((m) => m.status === 'offline').length;
  const enAlerta = maquinas.filter((m) => m.status === 'alert').length;

  const columnasGeocercas: Column<GeocercaDTO>[] = [
    {
      key: 'nombre',
      header: 'Geocerca',
      minWidth: '220px',
      render: (g) => (
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate">{g.nombre}</p>
            <p className="text-[11px] text-slate-500">{TIPO_LABEL[g.tipo]}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (g) => <Badge variant={TIPO_BADGE[g.tipo]} size="sm">{TIPO_LABEL[g.tipo]}</Badge>,
    },
    {
      key: 'centro',
      header: 'Centro',
      minWidth: '170px',
      render: (g) => (
        <span className="text-xs font-mono text-slate-600">
          {g.centroLat.toFixed(6)}, {g.centroLng.toFixed(6)}
        </span>
      ),
    },
    {
      key: 'radio',
      header: 'Radio',
      align: 'right',
      render: (g) => <span className="font-bold text-slate-800">{g.radioMetros.toLocaleString('es-MX')} m</span>,
    },
    {
      key: 'maquinasDentro',
      header: 'Máquinas dentro',
      align: 'center',
      render: (g) => (
        <Badge variant={g.maquinasDentro > 0 ? 'success' : 'neutral'} size="sm">
          {g.maquinasDentro}
        </Badge>
      ),
    },
    {
      key: 'activa',
      header: 'Estado',
      align: 'center',
      render: (g) => (
        <Badge variant={g.activa ? 'success' : 'neutral'} size="sm" dot>
          {g.activa ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    ...(puedeEditar
      ? [
          {
            key: 'acciones',
            header: 'Acciones',
            align: 'right' as const,
            render: (g: GeocercaDTO) => (
              <div className="flex items-center justify-end gap-1.5">
                <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => abrirEditar(g)}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleEliminar(g)}>
                  Eliminar
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (initialLoading) {
    return <LoadingState text="Cargando rastreo GPS..." />;
  }

  if (errorCarga) {
    return (
      <EmptyState
        icon={<AlertTriangle className="w-10 h-10" />}
        title="No se pudo cargar el GPS"
        subtitle={errorCarga}
        action={<Button variant="primary" onClick={() => { hasLoaded.current = false; setInitialLoading(true); cargarTodo(); }}>Reintentar</Button>}
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Rastreo GPS"
        subtitle="Ubicación en tiempo real de la maquinaria y control de geocercas."
        action={
          <div className="flex items-center gap-2">
            <LiveIndicator />
            {puedeEditar && (
              <Button
                variant="secondary"
                icon={<RefreshCw className={`w-4 h-4 ${simulando ? 'animate-spin' : ''}`} />}
                onClick={handleSimular}
                disabled={simulando}
              >
                {simulando ? 'Actualizando...' : 'Actualizar posiciones'}
              </Button>
            )}
            {puedeEditar && (
              <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={abrirCrear}>
                Nueva Geocerca
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard icon={<Truck className="w-5 h-5" />} value={enMovimiento} label="En movimiento" color="success" />
        <StatsCard icon={<Pause className="w-5 h-5" />} value={detenidas} label="Detenidas" color="warning" />
        <StatsCard icon={<WifiOff className="w-5 h-5" />} value={sinSenal} label="Sin señal" color="neutral" />
        <StatsCard icon={<AlertTriangle className="w-5 h-5" />} value={enAlerta} label="En alerta" color="error" />
      </div>

      <Tabs
        tabs={[
          { key: 'rastreo', label: 'Rastreo en vivo', icon: <Radar className="w-4 h-4" />, count: maquinas.length },
          { key: 'geocercas', label: 'Geocercas', icon: <MapPin className="w-4 h-4" />, count: geocercas.length },
        ]}
        value={tab}
        onChange={setTab}
      >

      <TabPanel tabKey="rastreo">
        {maquinas.length === 0 ? (
          <EmptyState
            icon={<Navigation className="w-10 h-10" />}
            title="Sin máquinas que rastrear"
            subtitle="No hay maquinaria activa registrada. Da de alta maquinaria en la vista de Flota para verla aquí."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-4">
              <GpsMap
                machines={machines}
                selectedId={selectedId}
                onSelect={(m) => setSelectedId(m.id)}
                height="460px"
              />

              <Card padding="sm">
                <h3 className="text-sm font-black text-slate-900 mb-3">Unidades ({maquinas.length})</h3>
                <MachineList machines={machines} selectedId={selectedId} onSelect={(m) => setSelectedId(m.id)} />
              </Card>
            </div>

            <div className="space-y-4">
              {seleccionadaMapa && <TrackingPanel machine={seleccionadaMapa} />}

              {seleccionada && seleccionada.geocercas.length > 0 && (
                <Card padding="sm">
                  <h3 className="text-sm font-black text-slate-900 mb-3">Dentro de</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {seleccionada.geocercas.map((g) => (
                      <span
                        key={g.nombre}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                        {g.nombre}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              <Card padding="sm">
                <h3 className="text-sm font-black text-slate-900 mb-3">Eventos de hoy</h3>
                {historial && historial.eventos.length > 0 ? (
                  <GpsTimeline events={historial.eventos} />
                ) : (
                  <p className="text-xs text-slate-500">
                    Sin entradas ni salidas de geocerca registradas hoy para esta unidad.
                  </p>
                )}
              </Card>

              {historial && historial.puntos.length > 0 && (
                <Card padding="sm">
                  <h3 className="text-sm font-black text-slate-900 mb-1">Recorrido de hoy</h3>
                  <p className="text-xs text-slate-500">
                    {historial.puntos.length} posiciones registradas · última a las {historial.puntos[0].time} h
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}
      </TabPanel>

      <TabPanel tabKey="geocercas">
        {geocercas.length === 0 ? (
          <EmptyState
            icon={<MapPin className="w-10 h-10" />}
            title="Sin geocercas configuradas"
            subtitle="Define zonas de obra, patios o áreas prohibidas para detectar automáticamente cuándo entra o sale cada máquina."
            action={puedeEditar ? <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={abrirCrear}>Nueva Geocerca</Button> : undefined}
          />
        ) : (
          <DataTable
            columns={columnasGeocercas}
            data={geocercas}
            keyExtractor={(g) => g.id}
            emptyText="Sin geocercas configuradas"
          />
        )}
      </TabPanel>
      </Tabs>

      <FormModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={editando ? 'Editar Geocerca' : 'Nueva Geocerca'}
        subtitle="Define el centro y el radio; las entradas y salidas se detectan solas con cada posición recibida."
        onSubmit={handleGuardar}
        submitLabel={editando ? 'Guardar cambios' : 'Crear geocerca'}
        isSubmitting={guardando}
        size="lg"
      >
        <ModalField label="Nombre" required>
          <input
            className={modalInputClass}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Obra Norte - Torre Insignia"
            required
          />
        </ModalField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Tipo" required>
            <select
              className={modalSelectClass}
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoGeocerca })}
            >
              {TIPOS_GEOCERCA.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Color en el mapa">
            <input
              type="color"
              className="w-full h-[42px] rounded-xl border border-slate-200 bg-white px-2 cursor-pointer"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </ModalField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ModalField label="Latitud del centro" required>
            <input
              className={modalInputClass}
              type="number"
              step="0.000001"
              min={-90}
              max={90}
              value={form.centroLat}
              onChange={(e) => setForm({ ...form, centroLat: e.target.value })}
              placeholder="19.432600"
              required
            />
          </ModalField>

          <ModalField label="Longitud del centro" required>
            <input
              className={modalInputClass}
              type="number"
              step="0.000001"
              min={-180}
              max={180}
              value={form.centroLng}
              onChange={(e) => setForm({ ...form, centroLng: e.target.value })}
              placeholder="-99.133200"
              required
            />
          </ModalField>

          <ModalField label="Radio (metros)" required>
            <input
              className={modalInputClass}
              type="number"
              step="1"
              min={10}
              max={50000}
              value={form.radioMetros}
              onChange={(e) => setForm({ ...form, radioMetros: e.target.value })}
              required
            />
          </ModalField>
        </div>

        <ModalField label="Estado">
          <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
            />
            Geocerca activa (sólo las activas detectan entradas y salidas)
          </label>
        </ModalField>
      </FormModal>
    </div>
  );
}
