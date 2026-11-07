"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiResponse, Maquina } from '@svr-erp/shared';
import {
  mantenimientoApi,
  maquinasApi,
  type MantenimientoCreateInput,
  type MantenimientoDTO,
  type MantenimientoStats,
  type PaginatedResponse,
} from '@/lib/api';
import { APP_TIMEZONE, formatCurrency, formatFechaSolo } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatsCard } from '@/components/ui/StatsCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState } from '@/components/ui/LoadingState';
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

type Fuente = 'registros' | 'stats' | 'maquinas';
const ETIQUETA_FUENTE: Record<Fuente, string> = {
  registros: 'Servicios',
  stats: 'Indicadores',
  maquinas: 'Máquinas',
};

const PAGE_SIZE = 10;
// `Select` ya usa "" para su placeholder deshabilitado: "todos" lleva su propio valor.
const TODOS = 'todos';
const TIPOS = ['Preventivo', 'Correctivo'] as const;
type Tipo = (typeof TIPOS)[number];
const esTipo = (v: string): v is Tipo => (TIPOS as readonly string[]).includes(v);
const FILTRO_TIPO = [{ value: TODOS, label: 'Todos los tipos' }, ...TIPOS.map((t) => ({ value: t, label: t }))];

// Mismas reglas que CreateMantenimientoDto de la API.
const DESCRIPCION_MIN = 3;
const DESCRIPCION_MAX = 500;
const HORAS_MAX = 99_999_999.99;
const COSTO_MAX = 9_999_999_999.99;

/** "YYYY-MM-DD" de hoy en la zona de la empresa (antes se tomaba en UTC y después de las 6 pm salía mañana). */
function hoyISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

/** Número con hasta 2 decimales dentro de [0, max], o null. */
function leerNumero(valor: string, max: number): number | null {
  if (valor.trim() === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 && n <= max && Number(n.toFixed(2)) === n ? n : null;
}

const horas = (n: number) => `${n.toLocaleString('es-MX', { maximumFractionDigits: 2 })} h`;

interface FormServicio {
  maquinaId: string;
  tipo: Tipo;
  fecha: string;
  descripcion: string;
  horasServicio: string;
  proximoServicioHoras: string;
  costo: string;
}

type Errores = Partial<Record<keyof FormServicio, string>>;

export default function MantenimientoPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  const vista = user?.vistas?.find((v) => v.ruta === '/mantenimiento');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  const [registros, setRegistros] = useState<PaginatedResponse<MantenimientoDTO> | null>(null);
  const [stats, setStats] = useState<MantenimientoStats | null>(null);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [errores, setErrores] = useState<Partial<Record<Fuente, string>>>({});
  const [cargaInicial, setCargaInicial] = useState(true);
  const [recargando, setRecargando] = useState(false);
  // Número de la última petición por fuente: una respuesta vieja no pisa a la nueva.
  const secuencia = useRef<Partial<Record<Fuente, number>>>({});

  const [busqueda, setBusqueda] = useState('');
  const [termino, setTermino] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>(TODOS);
  const [maquinaFiltro, setMaquinaFiltro] = useState<string>(TODOS);
  const [pagina, setPagina] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<MantenimientoDTO | null>(null);
  const [form, setForm] = useState<FormServicio | null>(null);
  const [erroresForm, setErroresForm] = useState<Errores>({});
  const [porEliminar, setPorEliminar] = useState<MantenimientoDTO | null>(null);
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

  const cargarStats = useCallback(() => cargarFuente('stats', mantenimientoApi.stats, setStats), [cargarFuente]);
  const cargarMaquinas = useCallback(() => cargarFuente('maquinas', maquinasApi.listar, setMaquinas), [cargarFuente]);

  const cargarRegistros = useCallback(
    () =>
      cargarFuente(
        'registros',
        () =>
          mantenimientoApi.listar({
            search: termino || undefined,
            tipo: tipoFiltro === TODOS ? undefined : tipoFiltro,
            maquinaId: maquinaFiltro === TODOS ? undefined : maquinaFiltro,
            page: pagina,
            limit: PAGE_SIZE,
          }),
        setRegistros,
      ),
    [cargarFuente, termino, tipoFiltro, maquinaFiltro, pagina],
  );

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([cargarStats(), cargarMaquinas()]);
      } finally {
        setCargaInicial(false);
      }
    })();
  }, [cargarStats, cargarMaquinas]);

  useEffect(() => {
    (async () => {
      await cargarRegistros();
    })();
  }, [cargarRegistros]);

  const reintentar = async () => {
    if (recargando) return;
    setRecargando(true);
    try {
      await Promise.all([cargarStats(), cargarMaquinas(), cargarRegistros()]);
    } finally {
      setRecargando(false);
    }
  };

  const maquinaPorId = new Map(maquinas.map((m) => [m.id, m]));
  const opcionesMaquina = [{ value: TODOS, label: 'Todas las máquinas' }, ...maquinas.map((m) => ({ value: m.id, label: `${m.id} · ${m.nombre}` }))];
  const statsCargados = !!stats && !errores.stats;
  const filtrando = !!termino || tipoFiltro !== TODOS || maquinaFiltro !== TODOS;

  // ── Formulario ──
  const abrirAlta = () => {
    const m = maquinas[0];
    // Las horas al dar servicio salen del horómetro actual de la máquina (antes el ejemplo era "1200").
    setForm({
      maquinaId: m?.id ?? '',
      tipo: 'Preventivo',
      fecha: hoyISO(),
      descripcion: '',
      horasServicio: m ? String(m.horometro) : '',
      proximoServicioHoras: '',
      costo: '',
    });
    setEditando(null);
    setErroresForm({});
    setFormOpen(true);
  };

  const abrirEdicion = (r: MantenimientoDTO) => {
    setForm({
      maquinaId: r.maquinaId,
      tipo: r.tipo,
      fecha: r.fecha,
      descripcion: r.descripcion,
      horasServicio: String(r.horasServicio),
      proximoServicioHoras: String(r.proximoServicioHoras),
      costo: String(r.costo),
    });
    setEditando(r);
    setErroresForm({});
    setFormOpen(true);
  };

  const cambiar = <K extends keyof FormServicio>(campo: K, valor: FormServicio[K]) => {
    setForm((f) => (f ? { ...f, [campo]: valor } : f));
    setErroresForm((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
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

  const recargarTodo = (volverAPrimera: boolean) => {
    void cargarStats();
    if (volverAPrimera && pagina !== 1) setPagina(1);
    else void cargarRegistros();
  };

  const guardar = () => conCandado(async () => {
    if (!form) return;
    const e: Errores = {};
    if (!form.maquinaId) e.maquinaId = 'Elige la máquina.';
    if (!form.fecha) e.fecha = 'Indica la fecha del servicio.';
    const descripcion = form.descripcion.trim();
    if (descripcion.length < DESCRIPCION_MIN || descripcion.length > DESCRIPCION_MAX) {
      e.descripcion = `Describe el servicio (de ${DESCRIPCION_MIN} a ${DESCRIPCION_MAX} caracteres).`;
    }
    const horasServicio = leerNumero(form.horasServicio, HORAS_MAX);
    if (horasServicio === null) e.horasServicio = 'Escribe el horómetro al dar el servicio (hasta 2 decimales).';
    const proximo = leerNumero(form.proximoServicioHoras, HORAS_MAX);
    if (proximo === null) e.proximoServicioHoras = 'Escribe a qué horómetro toca el siguiente servicio.';
    else if (horasServicio !== null && proximo <= horasServicio) e.proximoServicioHoras = 'Debe ser mayor que el horómetro de este servicio.';
    const costo = leerNumero(form.costo, COSTO_MAX);
    // Antes un costo vacío se guardaba como $0 sin avisar: ahora se pide (0 si no tuvo costo).
    if (costo === null) e.costo = 'Escribe el costo (0 si no tuvo costo).';
    if (horasServicio === null || proximo === null || costo === null || Object.values(e).some(Boolean)) {
      setErroresForm(e);
      return;
    }

    const datos: MantenimientoCreateInput = {
      maquinaId: form.maquinaId,
      tipo: form.tipo,
      fecha: form.fecha,
      descripcion,
      horasServicio,
      proximoServicioHoras: proximo,
      costo,
    };
    try {
      const res = editando ? await mantenimientoApi.actualizar(editando.id, datos) : await mantenimientoApi.crear(datos);
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      setFormOpen(false);
      if (editando) {
        showToast(`Servicio de ${res.data.maquinaId} actualizado.`, 'success');
      } else {
        showToast(`Servicio de ${res.data.maquinaId} registrado. El siguiente toca a las ${horas(res.data.proximoServicioHoras)}.`, 'success');
        addNotification({
          titulo: `Mantenimiento registrado: ${res.data.maquinaId}`,
          mensaje: `${res.data.descripcion} (${formatCurrency(res.data.costo)}). Siguiente servicio a las ${horas(res.data.proximoServicioHoras)}.`,
          tipo: 'info',
        });
      }
      recargarTodo(!editando);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo guardar el servicio.', 'error');
    }
  });

  const eliminar = () => conCandado(async () => {
    if (!porEliminar) return;
    try {
      const res = await mantenimientoApi.eliminar(porEliminar.id);
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      showToast(`Servicio de ${porEliminar.maquinaId} eliminado.`, 'success');
      setPorEliminar(null);
      // Si era el último de la página, se regresa a la anterior.
      if (registros && registros.items.length === 1 && pagina > 1) setPagina(pagina - 1);
      else void cargarRegistros();
      void cargarStats();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo eliminar el servicio.', 'error');
    }
  });

  // ── Columnas ──
  const columnas: Column<MantenimientoDTO>[] = [
    {
      key: 'maquina',
      header: 'Máquina',
      render: (r) => (
        <div className="min-w-0 whitespace-normal">
          <p className="text-sm font-semibold text-ui-900">
            {r.maquinaId}
            {maquinaPorId.get(r.maquinaId) && <span className="font-normal text-ui-600"> · {maquinaPorId.get(r.maquinaId)?.nombre}</span>}
          </p>
          <p className="text-xs text-ui-500 sm:hidden">{formatFechaSolo(r.fecha)}</p>
          <p className="text-xs text-ui-600 md:hidden line-clamp-2 break-words">{r.descripcion}</p>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (r) => <Badge variant={r.tipo === 'Correctivo' ? 'warning' : 'neutral'} size="sm">{r.tipo}</Badge>,
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      className: 'hidden md:table-cell',
      render: (r) => <p className="text-sm text-ui-700 whitespace-normal line-clamp-2 break-words max-w-[320px]" title={r.descripcion}>{r.descripcion}</p>,
    },
    {
      key: 'fecha',
      header: 'Fecha',
      className: 'hidden sm:table-cell',
      render: (r) => <span className="text-sm text-ui-800 whitespace-nowrap">{formatFechaSolo(r.fecha)}</span>,
    },
    {
      key: 'horas',
      header: 'Horómetro',
      align: 'right',
      className: 'hidden xl:table-cell',
      render: (r) => (
        <div className="whitespace-nowrap tabular-nums">
          <p className="text-sm text-ui-800">{horas(r.horasServicio)}</p>
          <p className="text-xs text-ui-500">siguiente a las {horas(r.proximoServicioHoras)}</p>
        </div>
      ),
    },
    {
      key: 'costo',
      header: 'Costo',
      align: 'right',
      className: 'hidden lg:table-cell',
      render: (r) => <span className="text-sm font-semibold text-ui-900 tabular-nums whitespace-nowrap">{formatCurrency(r.costo)}</span>,
    },
    ...(puedeEditar || puedeEliminar
      ? [
          {
            key: 'acciones',
            header: 'Acciones',
            align: 'right' as const,
            render: (r: MantenimientoDTO) => (
              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1">
                {puedeEditar && <Button type="button" variant="ghost" size="sm" onClick={() => abrirEdicion(r)}>Editar</Button>}
                {puedeEliminar && (
                  <Button type="button" variant="ghost" size="sm" className="text-red-600 dark:text-red-400" onClick={() => setPorEliminar(r)}>
                    Eliminar
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const mensajesError = (Object.entries(errores) as [Fuente, string][]).map(([f, m]) => `${ETIQUETA_FUENTE[f]}: ${m}`);
  const maquinaForm = form ? maquinaPorId.get(form.maquinaId) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mantenimiento"
        subtitle="Servicios y reparaciones de la flota, y a qué horómetro le toca el siguiente a cada máquina."
        action={
          puedeCrear ? (
            <Button onClick={abrirAlta} disabled={maquinas.length === 0} className="w-full sm:w-auto">
              Registrar servicio
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
            <p className="font-semibold">No se pudo cargar toda la información de mantenimiento.</p>
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
        <LoadingState text="Cargando mantenimiento..." size="lg" />
      ) : (
        <>
          {/* Indicadores: una sola tira con divisiones de 1px, calculados en el servidor */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-ui-200 border border-ui-200 rounded-xl overflow-hidden">
            <StatsCard
              className="rounded-none border-0"
              label="Servicio cerca o pasado"
              value={statsCargados ? stats.serviciosProximos : '—'}
              hint={statsCargados ? `A ${horas(stats.umbralServicioHoras)} o menos` : undefined}
            />
            <StatsCard
              className="rounded-none border-0"
              label="Servicios del mes"
              value={statsCargados ? stats.serviciosMes : '—'}
              hint={statsCargados ? `${stats.correctivosMes} correctivo${stats.correctivosMes === 1 ? '' : 's'}` : undefined}
            />
            <StatsCard
              className="rounded-none border-0"
              label="Costo del mes"
              value={statsCargados ? formatCurrency(stats.costoMes) : '—'}
            />
            <StatsCard
              className="rounded-none border-0"
              label="Sin servicio registrado"
              value={statsCargados ? stats.sinServicioRegistrado : '—'}
              hint={statsCargados ? `de ${stats.totalMaquinas} máquinas` : undefined}
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 min-w-0">
                <SearchBar
                  value={busqueda}
                  onChange={setBusqueda}
                  onSearch={(v) => { setTermino(v.trim()); setPagina(1); }}
                  placeholder="Buscar por máquina o descripción..."
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
                  aria-label="Filtrar por tipo"
                  value={tipoFiltro}
                  onChange={(e) => { setTipoFiltro(e.target.value); setPagina(1); }}
                  options={FILTRO_TIPO}
                />
              </div>
            </div>
            <DataTable
              headerVariant="neutral"
              columns={columnas}
              data={registros?.items ?? []}
              loading={!registros && !errores.registros}
              keyExtractor={(r) => r.id}
              maxBodyHeight="none"
              emptyText={errores.registros
                ? 'No se pudieron cargar los servicios.'
                : filtrando
                  ? 'Ningún servicio coincide con la búsqueda o los filtros.'
                  : 'Todavía no hay servicios registrados.'}
            />
            {registros && (
              <Pagination
                currentPage={registros.pagination.page}
                totalPages={registros.pagination.totalPages}
                totalRecords={registros.pagination.total}
                pageSize={PAGE_SIZE}
                onPageChange={setPagina}
              />
            )}
          </div>
        </>
      )}

      {/* ── Registrar / editar servicio ── */}
      {form && (
        <FormModal
          open={formOpen}
          onClose={() => { if (!enviando) setFormOpen(false); }}
          onSubmit={guardar}
          title={editando ? 'Editar servicio' : 'Registrar servicio'}
          submitLabel={enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar'}
          isSubmitting={enviando}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModalField label="Máquina" required error={erroresForm.maquinaId} className="sm:col-span-2">
                <select
                  aria-label="Máquina"
                  className={modalSelectClass}
                  value={form.maquinaId}
                  onChange={(e) => {
                    const m = maquinaPorId.get(e.target.value);
                    cambiar('maquinaId', e.target.value);
                    // En un alta, el horómetro del servicio es el actual de la máquina elegida.
                    if (m && !editando) cambiar('horasServicio', String(m.horometro));
                  }}
                >
                  {maquinas.map((m) => <option key={m.id} value={m.id}>{m.id} · {m.nombre} ({horas(m.horometro)})</option>)}
                </select>
              </ModalField>
              <ModalField label="Tipo" required>
                <select
                  aria-label="Tipo de servicio"
                  className={modalSelectClass}
                  value={form.tipo}
                  onChange={(e) => { if (esTipo(e.target.value)) cambiar('tipo', e.target.value); }}
                >
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </ModalField>
              <ModalField label="Fecha" required error={erroresForm.fecha}>
                <input
                  aria-label="Fecha del servicio"
                  type="date"
                  className={modalInputClass}
                  value={form.fecha}
                  onChange={(e) => cambiar('fecha', e.target.value)}
                />
              </ModalField>
            </div>
            <ModalField label="Descripción" required error={erroresForm.descripcion}>
              <input
                aria-label="Descripción del servicio"
                className={modalInputClass}
                maxLength={DESCRIPCION_MAX}
                placeholder="Qué se hizo: cambio de aceite, reparación de…"
                value={form.descripcion}
                onChange={(e) => cambiar('descripcion', e.target.value)}
              />
            </ModalField>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ModalField
                label="Horómetro al servicio (h)"
                required
                error={erroresForm.horasServicio}
                hint={!erroresForm.horasServicio && maquinaForm ? `Hoy marca ${horas(maquinaForm.horometro)}` : undefined}
              >
                <input
                  aria-label="Horómetro al dar el servicio"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className={modalInputClass}
                  value={form.horasServicio}
                  onChange={(e) => cambiar('horasServicio', e.target.value)}
                />
              </ModalField>
              <ModalField label="Siguiente servicio a las (h)" required error={erroresForm.proximoServicioHoras}>
                <input
                  aria-label="Horómetro del siguiente servicio"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className={modalInputClass}
                  value={form.proximoServicioHoras}
                  onChange={(e) => cambiar('proximoServicioHoras', e.target.value)}
                />
              </ModalField>
              <ModalField label="Costo (MXN)" required error={erroresForm.costo}>
                <input
                  aria-label="Costo del servicio"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className={modalInputClass}
                  value={form.costo}
                  onChange={(e) => cambiar('costo', e.target.value)}
                />
              </ModalField>
            </div>
            <p className="text-xs text-ui-500">
              Flota y Horómetro usan el siguiente servicio para avisar cuando a la máquina le faltan pocas horas.
            </p>
          </div>
        </FormModal>
      )}

      {/* ── Confirmar eliminación (botón rojo: FormModal solo trae el primario) ── */}
      {porEliminar && (
        <Modal open onClose={() => { if (!enviando) setPorEliminar(null); }} size="sm">
          <ModalHeader title="Eliminar servicio" onClose={() => { if (!enviando) setPorEliminar(null); }} />
          <ModalBody>
            <p className="text-sm text-ui-700">
              Se eliminará el servicio de <span className="font-semibold text-ui-900">{porEliminar.maquinaId}</span> del{' '}
              {formatFechaSolo(porEliminar.fecha)}: <span className="font-semibold text-ui-900">{porEliminar.descripcion}</span>. Si era el
              último de la máquina, su siguiente servicio pasa a ser el del registro anterior.
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
