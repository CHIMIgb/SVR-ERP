"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiResponse, Maquina } from '@svr-erp/shared';
import {
  horometroApi,
  maquinasApi,
  type HorometroStats,
  type LecturaHorometroDTO,
  type PaginatedResponse,
  type ServicioPorHorasDTO,
} from '@/lib/api';
import { APP_TIMEZONE, formatFechaSolo } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatsCard } from '@/components/ui/StatsCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState } from '@/components/ui/LoadingState';
import { FormModal, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';

type Fuente = 'lecturas' | 'stats' | 'maquinas';
const ETIQUETA_FUENTE: Record<Fuente, string> = {
  lecturas: 'Lecturas',
  stats: 'Indicadores y próximo servicio',
  maquinas: 'Máquinas',
};

const VISTAS = ['lecturas', 'servicio'] as const;
type Vista = (typeof VISTAS)[number];
const esVista = (v: string): v is Vista => (VISTAS as readonly string[]).includes(v);

const PAGE_SIZE = 10;
const TODAS = 'todas';
const PERIODOS = [
  { value: 'todo', label: 'Cualquier fecha' },
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
] as const;
type Periodo = (typeof PERIODOS)[number]['value'];
const esPeriodo = (v: string): v is Periodo => PERIODOS.some((p) => p.value === v);

// Mismas reglas que CreateLecturaHorometroDto y HorometroService de la API.
const HORAS_MAX_POR_LECTURA = 24;
const LECTURA_MAX = 99_999_999.99;
/** Igual que SALTO_SIN_CONFIRMAR_HORAS de la API: un salto mayor sobre el horómetro de la máquina se confirma. */
const SALTO_SIN_CONFIRMAR_HORAS = 24;

/** "YYYY-MM-DD" de hoy en la zona de la empresa. */
function hoyISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Rango de fechas del periodo elegido (undefined = sin límite). */
function rangoDe(periodo: Periodo, hoy: string): { desde?: string; hasta?: string } {
  if (periodo === 'hoy') return { desde: hoy, hasta: hoy };
  if (periodo === 'semana') {
    const dia = (new Date(`${hoy}T00:00:00Z`).getUTCDay() + 6) % 7;
    return { desde: sumarDias(hoy, -dia), hasta: hoy };
  }
  if (periodo === 'mes') return { desde: `${hoy.slice(0, 8)}01`, hasta: hoy };
  return {};
}

/** Número con hasta 2 decimales dentro de [0, LECTURA_MAX], o null. */
function leerLectura(valor: string): number | null {
  if (valor.trim() === '') return null;
  const n = Number(valor);
  if (!Number.isFinite(n) || n < 0 || n > LECTURA_MAX) return null;
  return Number(n.toFixed(2)) === n ? n : null;
}

const horas = (n: number) => `${n.toLocaleString('es-MX', { maximumFractionDigits: 2 })} h`;

interface FormLectura {
  maquinaId: string;
  fecha: string;
  lecturaInicial: string;
  lecturaFinal: string;
}

type Errores = Partial<Record<keyof FormLectura, string>>;

export default function HorometroPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  const vista = user?.vistas?.find((v) => v.ruta === '/horometro');
  const puedeCrear = vista?.puedeCrear ?? false;

  const [lecturas, setLecturas] = useState<PaginatedResponse<LecturaHorometroDTO> | null>(null);
  const [stats, setStats] = useState<HorometroStats | null>(null);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [errores, setErrores] = useState<Partial<Record<Fuente, string>>>({});
  const [cargaInicial, setCargaInicial] = useState(true);
  const [recargando, setRecargando] = useState(false);
  // Número de la última petición por fuente: una respuesta vieja no pisa a la nueva.
  const secuencia = useRef<Partial<Record<Fuente, number>>>({});

  const [tab, setTab] = useState<Vista>('lecturas');
  const [busqueda, setBusqueda] = useState('');
  const [termino, setTermino] = useState('');
  const [maquinaFiltro, setMaquinaFiltro] = useState(TODAS);
  const [periodo, setPeriodo] = useState<Periodo>('todo');
  const [pagina, setPagina] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormLectura>({ maquinaId: '', fecha: '', lecturaInicial: '', lecturaFinal: '' });
  // Confirmación de un salto grande sobre el horómetro de la máquina (se reinicia al cambiar máquina o lectura).
  const [confirmarSalto, setConfirmarSalto] = useState(false);
  const [erroresForm, setErroresForm] = useState<Errores>({});
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

  const cargarBase = useCallback(
    () =>
      Promise.all([
        cargarFuente('stats', horometroApi.stats, setStats),
        cargarFuente('maquinas', maquinasApi.listar, setMaquinas),
      ]),
    [cargarFuente],
  );

  const cargarLecturas = useCallback(
    () =>
      cargarFuente(
        'lecturas',
        () =>
          horometroApi.listar({
            search: termino || undefined,
            maquinaId: maquinaFiltro === TODAS ? undefined : maquinaFiltro,
            ...rangoDe(periodo, hoyISO()),
            page: pagina,
            limit: PAGE_SIZE,
          }),
        setLecturas,
      ),
    [cargarFuente, termino, maquinaFiltro, periodo, pagina],
  );

  useEffect(() => {
    (async () => {
      try {
        await cargarBase();
      } finally {
        setCargaInicial(false);
      }
    })();
  }, [cargarBase]);

  useEffect(() => {
    (async () => {
      await cargarLecturas();
    })();
  }, [cargarLecturas]);

  const reintentar = async () => {
    if (recargando) return;
    setRecargando(true);
    try {
      await Promise.all([cargarBase(), cargarLecturas()]);
    } finally {
      setRecargando(false);
    }
  };

  const hoy = hoyISO();
  const maquinaPorId = new Map(maquinas.map((m) => [m.id, m]));
  const opcionesMaquina = [
    { value: TODAS, label: 'Todas las máquinas' },
    ...maquinas.map((m) => ({ value: m.id, label: `${m.id} · ${m.nombre}` })),
  ];
  const servicioMasUrgente = stats?.servicios.find((s) => s.horasRestantes !== null);
  const statsCargados = !!stats && !errores.stats;

  // ── Modal ──
  const abrirModal = (maquinaId?: string) => {
    const maquina = maquinaPorId.get(maquinaId ?? '') ?? maquinas[0];
    // La lectura inicial sale del horómetro actual de la máquina (antes venían 1240 y 1248.5 fijos).
    setForm({ maquinaId: maquina?.id ?? '', fecha: hoy, lecturaInicial: maquina ? String(maquina.horometro) : '', lecturaFinal: '' });
    setErroresForm({});
    setConfirmarSalto(false);
    setModalOpen(true);
  };

  const cambiar = <K extends keyof FormLectura>(campo: K, valor: FormLectura[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErroresForm((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
    // Lo confirmado era para esa máquina y esa lectura.
    if (campo === 'maquinaId' || campo === 'lecturaInicial') setConfirmarSalto(false);
  };

  const inicial = leerLectura(form.lecturaInicial);
  const final = leerLectura(form.lecturaFinal);
  const horasCalculadas = inicial !== null && final !== null ? Math.round((final - inicial) * 100) / 100 : null;
  const maquinaForm = maquinaPorId.get(form.maquinaId);
  const avisoInicial =
    maquinaForm && inicial !== null && inicial !== maquinaForm.horometro
      ? inicial < maquinaForm.horometro
        ? `El horómetro de la máquina ya marca ${horas(maquinaForm.horometro)}: si esas horas ya se registraron, la lectura se va a rechazar.`
        : `El horómetro de la máquina marca ${horas(maquinaForm.horometro)}: quedan horas sin registrar entre las dos lecturas.`
      : undefined;
  // Más de un día de trabajo arriba del horómetro suele ser un error de captura (un cero de más): se confirma.
  const saltoHoras = maquinaForm && inicial !== null ? Math.round((inicial - maquinaForm.horometro) * 100) / 100 : null;
  const requiereConfirmarSalto = saltoHoras !== null && saltoHoras > SALTO_SIN_CONFIRMAR_HORAS;

  const guardar = async () => {
    if (enviandoRef.current) return;
    const e: Errores = {};
    if (!form.maquinaId) e.maquinaId = 'Elige la máquina.';
    if (!form.fecha) e.fecha = 'Indica la fecha de la lectura.';
    else if (form.fecha > hoy) e.fecha = 'La fecha no puede ser futura.';
    if (inicial === null) e.lecturaInicial = 'Escribe la lectura inicial (número con hasta 2 decimales).';
    if (final === null) e.lecturaFinal = 'Escribe la lectura final (número con hasta 2 decimales).';
    else if (inicial !== null && final < inicial) e.lecturaFinal = 'No puede ser menor que la lectura inicial.';
    else if (horasCalculadas !== null && horasCalculadas > HORAS_MAX_POR_LECTURA) {
      e.lecturaFinal = `Una lectura es de un solo día: no puede sumar más de ${HORAS_MAX_POR_LECTURA} h.`;
    }
    if (requiereConfirmarSalto && !confirmarSalto && !e.lecturaInicial) {
      e.lecturaInicial = `Arranca ${horas(saltoHoras ?? 0)} arriba del horómetro de la máquina: confírmalo abajo o revisa la captura.`;
    }
    if (inicial === null || final === null || Object.values(e).some(Boolean)) {
      setErroresForm(e);
      return;
    }

    enviandoRef.current = true;
    setEnviando(true);
    try {
      const res = await horometroApi.crear({
        maquinaId: form.maquinaId,
        fecha: form.fecha,
        lecturaInicial: inicial,
        lecturaFinal: final,
        confirmarSalto: requiereConfirmarSalto ? true : undefined,
      });
      if (!res.success) {
        // La API rechaza horas ya registradas (409) y explica cuál lectura las tiene.
        showToast(res.error.message, 'error');
        return;
      }
      const l = res.data;
      setModalOpen(false);
      showToast(`Lectura de ${l.maquinaId} registrada: +${horas(l.horasTrabajadas)}.`, 'success');
      addNotification({
        titulo: `Horómetro registrado: ${l.maquinaId}`,
        mensaje: `${horas(l.lecturaInicial)} a ${horas(l.lecturaFinal)} (+${horas(l.horasTrabajadas)}).`,
        tipo: 'info',
      });
      // El horómetro de la máquina, los indicadores y la lista cambian: se vuelven a pedir.
      void cargarBase();
      if (pagina === 1) void cargarLecturas();
      else setPagina(1);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo registrar la lectura.', 'error');
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  // ── Columnas ──
  const columnasLecturas: Column<LecturaHorometroDTO>[] = [
    {
      key: 'maquina',
      header: 'Máquina',
      render: (l) => (
        <div className="min-w-0 whitespace-normal">
          <p className="text-sm font-semibold text-ui-900">
            {l.maquinaId} <span className="font-normal text-ui-600">· {l.maquinaNombre}</span>
          </p>
          <p className="text-xs text-ui-500">
            <span className="sm:hidden">{formatFechaSolo(l.fecha)} · </span>
            {l.operador ?? 'Sin operador asignado'}
          </p>
        </div>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      className: 'hidden sm:table-cell',
      render: (l) => <span className="text-sm text-ui-800 whitespace-nowrap">{formatFechaSolo(l.fecha)}</span>,
    },
    {
      key: 'rango',
      header: 'Lectura',
      align: 'right',
      className: 'hidden md:table-cell',
      render: (l) => (
        <span className="text-sm text-ui-600 tabular-nums whitespace-nowrap">
          {l.lecturaInicial.toLocaleString('es-MX')} → {l.lecturaFinal.toLocaleString('es-MX')}
        </span>
      ),
    },
    {
      key: 'horas',
      header: 'Horas',
      align: 'right',
      render: (l) => <span className="text-sm font-semibold text-ui-900 tabular-nums whitespace-nowrap">{horas(l.horasTrabajadas)}</span>,
    },
  ];

  const estadoServicio = (s: ServicioPorHorasDTO) => {
    if (s.horasRestantes === null) return <Badge variant="neutral" size="sm">Sin servicio registrado</Badge>;
    if (s.horasRestantes < 0) return <Badge variant="error" size="sm">Pasado por {horas(-s.horasRestantes)}</Badge>;
    if (stats && s.horasRestantes <= stats.umbralServicioHoras) return <Badge variant="warning" size="sm">Faltan {horas(s.horasRestantes)}</Badge>;
    return <span className="text-sm text-ui-700 whitespace-nowrap">Faltan {horas(s.horasRestantes)}</span>;
  };

  const columnasServicio: Column<ServicioPorHorasDTO>[] = [
    {
      key: 'maquina',
      header: 'Máquina',
      render: (s) => (
        <div className="min-w-0 whitespace-normal">
          <p className="text-sm font-semibold text-ui-900">
            {s.maquinaId} <span className="font-normal text-ui-600">· {s.nombre}</span>
          </p>
          <p className="text-xs text-ui-500 md:hidden">Horómetro: {horas(s.horometro)}</p>
        </div>
      ),
    },
    {
      key: 'horometro',
      header: 'Horómetro',
      align: 'right',
      className: 'hidden md:table-cell',
      render: (s) => <span className="text-sm text-ui-700 tabular-nums whitespace-nowrap">{horas(s.horometro)}</span>,
    },
    {
      key: 'proximo',
      header: 'Próximo servicio',
      align: 'right',
      className: 'hidden lg:table-cell',
      render: (s) => (
        <span className="text-sm text-ui-700 tabular-nums whitespace-nowrap">{s.proximoServicioHoras === null ? '—' : horas(s.proximoServicioHoras)}</span>
      ),
    },
    { key: 'estado', header: 'Estado', align: 'right', render: estadoServicio },
  ];

  const mensajesError = (Object.entries(errores) as [Fuente, string][]).map(([f, m]) => `${ETIQUETA_FUENTE[f]}: ${m}`);
  const filtrando = !!termino || maquinaFiltro !== TODAS || periodo !== 'todo';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Horómetro"
        subtitle="Horas trabajadas por máquina y lo que falta para su próximo servicio."
        action={
          puedeCrear ? (
            <Button onClick={() => abrirModal()} disabled={maquinas.length === 0} className="w-full sm:w-auto">
              Registrar lectura
            </Button>
          ) : undefined
        }
      />

      {mensajesError.length > 0 && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10"
        >
          <div className="text-sm text-red-700 dark:text-red-300 min-w-0">
            <p className="font-semibold">No se pudo cargar toda la información del horómetro.</p>
            <ul className="mt-0.5 text-xs space-y-0.5">
              {mensajesError.map((m) => <li key={m} className="break-words">{m}</li>)}
            </ul>
          </div>
          <Button variant="outline" size="sm" onClick={reintentar} disabled={recargando || cargaInicial} className="shrink-0">
            {recargando ? 'Reintentando…' : 'Reintentar'}
          </Button>
        </div>
      )}

      {cargaInicial ? (
        <LoadingState text="Cargando horómetro..." size="lg" />
      ) : (
        <>
          {/* Indicadores: una sola tira con divisiones de 1px, con datos del servidor */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-ui-200 border border-ui-200 rounded-xl overflow-hidden">
            <StatsCard
              className="rounded-none border-0 hover:shadow-none hover:bg-ui-50"
              label="Horas de hoy"
              value={statsCargados ? horas(stats.horasHoy) : '—'}
              hint={statsCargados ? `${stats.lecturasHoy} lectura${stats.lecturasHoy === 1 ? '' : 's'}` : undefined}
              onClick={() => { setTab('lecturas'); setPeriodo('hoy'); setPagina(1); }}
            />
            <StatsCard
              className="rounded-none border-0 hover:shadow-none hover:bg-ui-50"
              label="Horas de la semana"
              value={statsCargados ? horas(stats.horasSemana) : '—'}
              hint={statsCargados ? 'Desde el lunes' : undefined}
              onClick={() => { setTab('lecturas'); setPeriodo('semana'); setPagina(1); }}
            />
            <StatsCard
              className="rounded-none border-0 hover:shadow-none hover:bg-ui-50"
              label="Sin lectura hoy"
              value={statsCargados ? stats.maquinasSinLecturaHoy.length : '—'}
              hint={statsCargados && stats.maquinasSinLecturaHoy.length > 0 ? stats.maquinasSinLecturaHoy.join(', ') : undefined}
            />
            <StatsCard
              className="rounded-none border-0 hover:shadow-none hover:bg-ui-50"
              label="Servicio cerca o pasado"
              value={statsCargados ? stats.serviciosProximos : '—'}
              hint={statsCargados
                ? servicioMasUrgente
                  ? `Más cercano: ${servicioMasUrgente.maquinaId} (${servicioMasUrgente.horasRestantes !== null && servicioMasUrgente.horasRestantes < 0 ? 'ya pasó' : `faltan ${horas(servicioMasUrgente.horasRestantes ?? 0)}`})`
                  : 'Sin servicios registrados'
                : undefined}
              onClick={() => setTab('servicio')}
            />
          </div>

          <Tabs
            ariaLabel="Secciones de horómetro"
            value={tab}
            onChange={(k) => { if (esVista(k)) setTab(k); }}
            tabs={[
              { key: 'lecturas', label: 'Lecturas', count: lecturas?.pagination.total },
              { key: 'servicio', label: 'Próximo servicio' },
            ]}
          >
            {/* ── LECTURAS ── */}
            {tab === 'lecturas' && (
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <SearchBar
                      value={busqueda}
                      onChange={setBusqueda}
                      onSearch={(v) => { setTermino(v.trim()); setPagina(1); }}
                      placeholder="Buscar por código o nombre de la máquina..."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-[28rem]">
                    <Select
                      aria-label="Filtrar por máquina"
                      value={maquinaFiltro}
                      onChange={(e) => { setMaquinaFiltro(e.target.value); setPagina(1); }}
                      options={opcionesMaquina}
                    />
                    <Select
                      aria-label="Filtrar por periodo"
                      value={periodo}
                      onChange={(e) => { if (esPeriodo(e.target.value)) { setPeriodo(e.target.value); setPagina(1); } }}
                      options={[...PERIODOS]}
                    />
                  </div>
                </div>
                <DataTable
                  headerVariant="neutral"
                  columns={columnasLecturas}
                  data={lecturas?.items ?? []}
                  loading={!lecturas && !errores.lecturas}
                  keyExtractor={(l) => l.id}
                  maxBodyHeight="none"
                  emptyText={errores.lecturas
                    ? 'No se pudieron cargar las lecturas.'
                    : filtrando
                      ? 'Ninguna lectura coincide con la búsqueda o los filtros.'
                      : 'Todavía no hay lecturas registradas.'}
                />
                {lecturas && (
                  <Pagination
                    currentPage={lecturas.pagination.page}
                    totalPages={lecturas.pagination.totalPages}
                    totalRecords={lecturas.pagination.total}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPagina}
                  />
                )}
              </div>
            )}

            {/* ── PRÓXIMO SERVICIO ── */}
            {tab === 'servicio' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-sm text-ui-600">
                    Horas que le faltan a cada máquina para el servicio que dejó programado su último mantenimiento
                    {stats ? ` (se marca a ${horas(stats.umbralServicioHoras)} o menos)` : ''}.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => router.push('/mantenimiento')} className="shrink-0">
                    Ir a Mantenimiento
                  </Button>
                </div>
                <DataTable
                  headerVariant="neutral"
                  columns={columnasServicio}
                  data={stats?.servicios ?? []}
                  loading={!stats && !errores.stats}
                  keyExtractor={(s) => s.maquinaId}
                  maxBodyHeight="none"
                  emptyText={errores.stats ? 'No se pudo calcular el próximo servicio.' : 'Todavía no hay máquinas.'}
                />
              </div>
            )}
          </Tabs>
        </>
      )}

      {/* ── Registrar lectura ── */}
      <FormModal
        open={modalOpen}
        onClose={() => { if (!enviando) setModalOpen(false); }}
        onSubmit={guardar}
        title="Registrar lectura"
        submitLabel={enviando ? 'Guardando…' : 'Registrar'}
        isSubmitting={enviando}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ModalField label="Máquina" required error={erroresForm.maquinaId}>
              <select
                aria-label="Máquina"
                className={modalSelectClass}
                value={form.maquinaId}
                onChange={(e) => {
                  const m = maquinaPorId.get(e.target.value);
                  cambiar('maquinaId', e.target.value);
                  // Al cambiar de máquina, la lectura inicial es su horómetro actual.
                  if (m) cambiar('lecturaInicial', String(m.horometro));
                }}
              >
                {maquinas.map((m) => <option key={m.id} value={m.id}>{m.id} · {m.nombre}</option>)}
              </select>
            </ModalField>
            <ModalField label="Fecha" required error={erroresForm.fecha}>
              <input
                aria-label="Fecha de la lectura"
                type="date"
                max={hoy}
                className={modalInputClass}
                value={form.fecha}
                onChange={(e) => cambiar('fecha', e.target.value)}
              />
            </ModalField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ModalField label="Lectura inicial (h)" required error={erroresForm.lecturaInicial} hint={erroresForm.lecturaInicial ? undefined : avisoInicial}>
              <input
                aria-label="Lectura inicial en horas"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className={modalInputClass}
                value={form.lecturaInicial}
                onChange={(e) => cambiar('lecturaInicial', e.target.value)}
              />
            </ModalField>
            <ModalField label="Lectura final (h)" required error={erroresForm.lecturaFinal}>
              <input
                aria-label="Lectura final en horas"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className={modalInputClass}
                value={form.lecturaFinal}
                onChange={(e) => cambiar('lecturaFinal', e.target.value)}
              />
            </ModalField>
          </div>
          {requiereConfirmarSalto && maquinaForm && (
            <label className="flex items-start gap-2 p-3 rounded-xl border border-ui-200 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmarSalto}
                onChange={(e) => {
                  setConfirmarSalto(e.target.checked);
                  setErroresForm((er) => (er.lecturaInicial ? { ...er, lecturaInicial: undefined } : er));
                }}
                className="mt-0.5 w-4 h-4 accent-primary"
              />
              <span className="text-sm text-ui-800">
                Confirmo que la máquina trabajó {horas(saltoHoras ?? 0)} sin lecturas registradas (su horómetro marca{' '}
                {horas(maquinaForm.horometro)}). El horómetro no se puede regresar después.
              </span>
            </label>
          )}
          <p className={cn('text-sm', horasCalculadas !== null && (horasCalculadas < 0 || horasCalculadas > HORAS_MAX_POR_LECTURA) ? 'text-red-600 dark:text-red-400' : 'text-ui-600')}>
            Horas trabajadas: <span className="font-semibold tabular-nums">{horasCalculadas === null ? '—' : horas(horasCalculadas)}</span>
          </p>
          <p className="text-xs text-ui-500">
            Al registrar, el horómetro de la máquina avanza a la lectura final. No se aceptan horas que ya estén en otra lectura.
          </p>
        </div>
      </FormModal>
    </div>
  );
}
