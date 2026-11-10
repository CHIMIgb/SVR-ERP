"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiResponse, Maquina } from '@svr-erp/shared';
import {
  combustibleApi,
  maquinasApi,
  type CargaCombustibleDTO,
  type CombustibleCreateInput,
  type CombustibleStats,
  type PaginatedResponse,
} from '@/lib/api';
import { APP_TIMEZONE, formatCurrency, formatFechaSolo } from '@/lib/formatters';
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

type Fuente = 'cargas' | 'stats' | 'maquinas';
const ETIQUETA_FUENTE: Record<Fuente, string> = {
  cargas: 'Cargas',
  stats: 'Indicadores',
  maquinas: 'Máquinas',
};

const PAGE_SIZE = 10;
// `Select` ya usa "" para su placeholder deshabilitado: "todas" lleva su propio valor.
const TODAS = 'todas';
const FILTRO_ESTADO = [
  { value: TODAS, label: 'Todas las cargas' },
  { value: 'alertas', label: 'Solo con alerta' },
];

// Mismas reglas que CreateCargaCombustibleDto y CombustibleService de la API.
const LITROS_MAX = 99_999_999.99;
const COSTO_MAX = 9_999_999_999.99;
const HORAS_MAX = 9_999.99;
const LUGAR_MIN = 3;
const LUGAR_MAX = 200;
const OPERADOR_MAX = 150;
/** Desviación sobre el consumo esperado a partir de la cual la API marca "posible ordeña". */
const UMBRAL_ALERTA_PORCENTAJE = 35;

/** "YYYY-MM-DD" de hoy en la zona de la empresa. */
function hoyISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

/** Número con hasta 2 decimales dentro de [min, max], o null. */
function leerNumero(valor: string, min: number, max: number): number | null {
  if (valor.trim() === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) && n >= min && n <= max && Number(n.toFixed(2)) === n ? n : null;
}

const num = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 2 });

interface FormCarga {
  maquinaId: string;
  fecha: string;
  litros: string;
  horas: string;
  costo: string;
  lugar: string;
  operador: string;
}

type Errores = Partial<Record<keyof FormCarga, string>>;

export default function CombustiblePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  const vista = user?.vistas?.find((v) => v.ruta === '/combustible');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  const [cargas, setCargas] = useState<PaginatedResponse<CargaCombustibleDTO> | null>(null);
  const [stats, setStats] = useState<CombustibleStats | null>(null);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [errores, setErrores] = useState<Partial<Record<Fuente, string>>>({});
  const [cargaInicial, setCargaInicial] = useState(true);
  const [recargando, setRecargando] = useState(false);
  // Número de la última petición por fuente: una respuesta vieja no pisa a la nueva.
  const secuencia = useRef<Partial<Record<Fuente, number>>>({});

  const [busqueda, setBusqueda] = useState('');
  const [termino, setTermino] = useState('');
  const [maquinaFiltro, setMaquinaFiltro] = useState<string>(TODAS);
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [pagina, setPagina] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<CargaCombustibleDTO | null>(null);
  const [form, setForm] = useState<FormCarga | null>(null);
  const [erroresForm, setErroresForm] = useState<Errores>({});
  const [porEliminar, setPorEliminar] = useState<CargaCombustibleDTO | null>(null);
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

  const cargarStats = useCallback(() => cargarFuente('stats', combustibleApi.stats, setStats), [cargarFuente]);
  const cargarMaquinas = useCallback(() => cargarFuente('maquinas', maquinasApi.listar, setMaquinas), [cargarFuente]);

  const cargarCargas = useCallback(
    () =>
      cargarFuente(
        'cargas',
        () =>
          combustibleApi.listar({
            search: termino || undefined,
            maquinaId: maquinaFiltro === TODAS ? undefined : maquinaFiltro,
            soloAlertas: soloAlertas || undefined,
            page: pagina,
            limit: PAGE_SIZE,
          }),
        setCargas,
      ),
    [cargarFuente, termino, maquinaFiltro, soloAlertas, pagina],
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
      await cargarCargas();
    })();
  }, [cargarCargas]);

  const reintentar = async () => {
    if (recargando) return;
    setRecargando(true);
    try {
      await Promise.all([cargarStats(), cargarMaquinas(), cargarCargas()]);
    } finally {
      setRecargando(false);
    }
  };

  const maquinaPorId = new Map(maquinas.map((m) => [m.id, m]));
  const opcionesMaquina = [{ value: TODAS, label: 'Todas las máquinas' }, ...maquinas.map((m) => ({ value: m.id, label: `${m.id} · ${m.nombre}` }))];
  const statsCargados = !!stats && !errores.stats;
  const filtrando = !!termino || maquinaFiltro !== TODAS || soloAlertas;

  // ── Formulario ──
  const operadorDe = (m?: Maquina) => (m && m.operador !== 'Sin asignar' ? m.operador : '');

  const abrirAlta = () => {
    const m = maquinas[0];
    // Sin valores de ejemplo: antes venían 120 L, 8 h y "Autoconsumo en Obra" ya capturados.
    setForm({ maquinaId: m?.id ?? '', fecha: hoyISO(), litros: '', horas: '', costo: '', lugar: '', operador: operadorDe(m) });
    setEditando(null);
    setErroresForm({});
    setFormOpen(true);
  };

  const abrirEdicion = (c: CargaCombustibleDTO) => {
    setForm({
      maquinaId: c.maquinaId,
      fecha: c.fecha,
      litros: String(c.litros),
      horas: String(c.horasTrabajadasPeriodo),
      costo: String(c.costo),
      lugar: c.lugar,
      operador: c.operador === 'Sin registrar' ? '' : c.operador,
    });
    setEditando(c);
    setErroresForm({});
    setFormOpen(true);
  };

  const cambiar = <K extends keyof FormCarga>(campo: K, valor: FormCarga[K]) => {
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

  // Vista previa: el servidor recalcula y es el que decide la alerta (mismo umbral).
  const litrosForm = form ? leerNumero(form.litros, 0.1, LITROS_MAX) : null;
  const horasForm = form ? leerNumero(form.horas, 0, HORAS_MAX) : null;
  const costoForm = form ? leerNumero(form.costo, 0, COSTO_MAX) : null;
  const maquinaForm = form ? maquinaPorId.get(form.maquinaId) : undefined;
  const esperadoForm = maquinaForm?.consumoEsperadoLtsHora;
  const rendimientoForm = litrosForm !== null && horasForm !== null && horasForm > 0 ? litrosForm / horasForm : null;
  const desviacionForm =
    rendimientoForm !== null && esperadoForm ? ((rendimientoForm - esperadoForm) / esperadoForm) * 100 : null;

  const guardar = () => conCandado(async () => {
    if (!form) return;
    const e: Errores = {};
    if (!form.maquinaId) e.maquinaId = 'Elige la máquina.';
    if (!form.fecha) e.fecha = 'Indica la fecha de la carga.';
    else if (form.fecha > hoyISO()) e.fecha = 'La fecha no puede ser futura.';
    if (litrosForm === null) e.litros = 'Escribe los litros cargados (más de 0, hasta 2 decimales).';
    if (horasForm === null) e.horas = 'Escribe las horas trabajadas desde la carga anterior (0 si no trabajó).';
    // Antes se podía dejar vacío y la API guardaba litros × $23 fijos como si fuera el gasto real.
    if (costoForm === null) e.costo = 'Escribe el costo total de la carga.';
    const lugar = form.lugar.trim();
    if (lugar.length < LUGAR_MIN || lugar.length > LUGAR_MAX) e.lugar = 'Escribe dónde se cargó (gasolinera o tanque de obra).';
    const operador = form.operador.trim();
    if (operador.length > OPERADOR_MAX) e.operador = `Hasta ${OPERADOR_MAX} caracteres.`;
    if (litrosForm === null || horasForm === null || costoForm === null || Object.values(e).some(Boolean)) {
      setErroresForm(e);
      return;
    }

    const datos: CombustibleCreateInput = {
      maquinaId: form.maquinaId,
      fecha: form.fecha,
      litros: litrosForm,
      horasTrabajadasPeriodo: horasForm,
      costo: costoForm,
      lugar,
      operador: operador || undefined,
    };
    try {
      // La API no acepta cambiar la máquina de una carga ya registrada: al editar no se manda.
      const { maquinaId, ...cambios } = datos;
      const res = editando
        ? await combustibleApi.actualizar(editando.id, cambios)
        : await combustibleApi.crear({ maquinaId, ...cambios });
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      const c = res.data;
      setFormOpen(false);
      if (c.alertaOrdena) {
        showToast(`Carga de ${c.maquinaId} registrada con alerta: ${num(c.rendimientoLtsHora)} L/h (+${num(c.desviacionPorcentaje)} %).`, 'warning');
        addNotification({
          titulo: `Posible ordeña: ${c.maquinaId}`,
          mensaje: `${num(c.rendimientoLtsHora)} L/h contra ${num(c.consumoEsperadoLtsHora)} L/h esperados (+${num(c.desviacionPorcentaje)} %). Operador: ${c.operador}.`,
          tipo: 'alerta',
        });
      } else {
        showToast(editando ? `Carga de ${c.maquinaId} actualizada.` : `Carga de ${num(c.litros)} L registrada en ${c.maquinaId}.`, 'success');
      }
      void cargarStats();
      if (!editando && pagina !== 1) setPagina(1);
      else void cargarCargas();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo guardar la carga.', 'error');
    }
  });

  const eliminar = () => conCandado(async () => {
    if (!porEliminar) return;
    try {
      const res = await combustibleApi.eliminar(porEliminar.id);
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      showToast(`Carga de ${porEliminar.maquinaId} eliminada.`, 'success');
      setPorEliminar(null);
      if (cargas && cargas.items.length === 1 && pagina > 1) setPagina(pagina - 1);
      else void cargarCargas();
      void cargarStats();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo eliminar la carga.', 'error');
    }
  });

  // ── Columnas ──
  const estadoCarga = (c: CargaCombustibleDTO) =>
    c.alertaOrdena
      ? <Badge variant="error" size="sm">Posible ordeña +{num(c.desviacionPorcentaje)} %</Badge>
      : <Badge variant="neutral" size="sm">Normal</Badge>;

  const columnas: Column<CargaCombustibleDTO>[] = [
    {
      key: 'maquina',
      header: 'Máquina',
      render: (c) => (
        <div className="min-w-0 whitespace-normal">
          <p className="text-sm font-semibold text-ui-900">
            {c.maquinaId}
            {maquinaPorId.get(c.maquinaId) && <span className="font-normal text-ui-600"> · {maquinaPorId.get(c.maquinaId)?.nombre}</span>}
          </p>
          <p className="text-xs text-ui-500">
            <span className="sm:hidden">{formatFechaSolo(c.fecha)} · </span>
            {c.operador}
          </p>
          <div className="mt-1 md:hidden">{estadoCarga(c)}</div>
        </div>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha y lugar',
      className: 'hidden sm:table-cell',
      render: (c) => (
        <div className="min-w-0 whitespace-normal">
          <p className="text-sm text-ui-800 whitespace-nowrap">{formatFechaSolo(c.fecha)}</p>
          <p className="text-xs text-ui-500 break-words max-w-[200px]">{c.lugar}</p>
        </div>
      ),
    },
    {
      key: 'litros',
      header: 'Litros',
      align: 'right',
      render: (c) => (
        <div className="whitespace-nowrap tabular-nums">
          <p className="text-sm font-semibold text-ui-900">{num(c.litros)} L</p>
          <p className="text-xs text-ui-500">{formatCurrency(c.costo)}</p>
        </div>
      ),
    },
    {
      key: 'rendimiento',
      header: 'Rendimiento',
      align: 'right',
      className: 'hidden lg:table-cell',
      render: (c) => (
        <div className="whitespace-nowrap tabular-nums">
          <p className={cn('text-sm', c.alertaOrdena ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-ui-800')}>
            {num(c.rendimientoLtsHora)} L/h
          </p>
          <p className="text-xs text-ui-500">{num(c.horasTrabajadasPeriodo)} h · esperado {num(c.consumoEsperadoLtsHora)} L/h</p>
        </div>
      ),
    },
    { key: 'estado', header: 'Estado', className: 'hidden md:table-cell', render: estadoCarga },
    ...(puedeEditar || puedeEliminar
      ? [
          {
            key: 'acciones',
            header: 'Acciones',
            align: 'right' as const,
            render: (c: CargaCombustibleDTO) => (
              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1">
                {puedeEditar && <Button type="button" variant="ghost" size="sm" onClick={() => abrirEdicion(c)}>Editar</Button>}
                {puedeEliminar && (
                  <Button type="button" variant="ghost" size="sm" className="text-red-600 dark:text-red-400" onClick={() => setPorEliminar(c)}>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Combustible"
        subtitle="Cargas de diésel, rendimiento por hora de cada máquina y alertas de posible ordeña."
        action={
          puedeCrear ? (
            <Button onClick={abrirAlta} disabled={maquinas.length === 0} className="w-full sm:w-auto">
              Registrar carga
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
            <p className="font-semibold">No se pudo cargar toda la información de combustible.</p>
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
        <LoadingState text="Cargando combustible..." size="lg" />
      ) : (
        <>
          {/* Indicadores históricos, calculados en el servidor con todas las cargas */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-ui-200 border border-ui-200 rounded-xl overflow-hidden">
            <StatsCard className="rounded-none border-0" label="Litros cargados" value={statsCargados ? `${num(stats.totalLitros)} L` : '—'} hint={statsCargados ? 'Histórico' : undefined} />
            <StatsCard className="rounded-none border-0" label="Gasto en diésel" value={statsCargados ? formatCurrency(stats.totalCosto) : '—'} hint={statsCargados ? 'Histórico' : undefined} />
            <StatsCard
              className="rounded-none border-0"
              label="Rendimiento promedio"
              value={statsCargados ? `${num(stats.rendimientoPromedio)} L/h` : '—'}
              hint={statsCargados ? 'De todas las cargas' : undefined}
            />
            <StatsCard
              className="rounded-none border-0 hover:shadow-none hover:bg-ui-50"
              label="Cargas con alerta"
              value={statsCargados ? stats.totalAlertasOrdena : '—'}
              hint={statsCargados ? `Más de ${UMBRAL_ALERTA_PORCENTAJE} % sobre lo esperado` : undefined}
              onClick={() => { setSoloAlertas(true); setPagina(1); }}
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 min-w-0">
                <SearchBar
                  value={busqueda}
                  onChange={setBusqueda}
                  onSearch={(v) => { setTermino(v.trim()); setPagina(1); }}
                  placeholder="Buscar por máquina, operador o lugar..."
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
                  aria-label="Filtrar por alerta"
                  value={soloAlertas ? 'alertas' : TODAS}
                  onChange={(e) => { setSoloAlertas(e.target.value === 'alertas'); setPagina(1); }}
                  options={FILTRO_ESTADO}
                />
              </div>
            </div>
            <DataTable
              headerVariant="neutral"
              columns={columnas}
              data={cargas?.items ?? []}
              loading={!cargas && !errores.cargas}
              keyExtractor={(c) => c.id}
              maxBodyHeight="none"
              emptyText={errores.cargas
                ? 'No se pudieron cargar las cargas de combustible.'
                : filtrando
                  ? 'Ninguna carga coincide con la búsqueda o los filtros.'
                  : 'Todavía no hay cargas registradas.'}
            />
            {cargas && (
              <Pagination
                currentPage={cargas.pagination.page}
                totalPages={cargas.pagination.totalPages}
                totalRecords={cargas.pagination.total}
                pageSize={PAGE_SIZE}
                onPageChange={setPagina}
              />
            )}
          </div>
        </>
      )}

      {/* ── Registrar / editar carga ── */}
      {form && (
        <FormModal
          open={formOpen}
          onClose={() => { if (!enviando) setFormOpen(false); }}
          onSubmit={guardar}
          title={editando ? 'Editar carga' : 'Registrar carga'}
          submitLabel={enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar'}
          isSubmitting={enviando}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModalField
                label="Máquina"
                required
                error={erroresForm.maquinaId}
                hint={editando ? 'La máquina de una carga ya registrada no se puede cambiar.' : undefined}
              >
                <select
                  aria-label="Máquina"
                  className={modalSelectClass}
                  value={form.maquinaId}
                  disabled={!!editando}
                  onChange={(e) => {
                    cambiar('maquinaId', e.target.value);
                    // El operador propuesto es el que tiene asignado la máquina.
                    cambiar('operador', operadorDe(maquinaPorId.get(e.target.value)));
                  }}
                >
                  {maquinas.map((m) => <option key={m.id} value={m.id}>{m.id} · {m.nombre}</option>)}
                </select>
              </ModalField>
              <ModalField label="Fecha" required error={erroresForm.fecha}>
                <input
                  aria-label="Fecha de la carga"
                  type="date"
                  max={hoyISO()}
                  className={modalInputClass}
                  value={form.fecha}
                  onChange={(e) => cambiar('fecha', e.target.value)}
                />
              </ModalField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ModalField label="Litros" required error={erroresForm.litros}>
                <input
                  aria-label="Litros cargados"
                  type="number"
                  min="0.1"
                  step="0.01"
                  inputMode="decimal"
                  className={modalInputClass}
                  value={form.litros}
                  onChange={(e) => cambiar('litros', e.target.value)}
                />
              </ModalField>
              <ModalField label="Horas trabajadas" required error={erroresForm.horas} hint={erroresForm.horas ? undefined : 'Desde la carga anterior'}>
                <input
                  aria-label="Horas trabajadas desde la carga anterior"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className={modalInputClass}
                  value={form.horas}
                  onChange={(e) => cambiar('horas', e.target.value)}
                />
              </ModalField>
              <ModalField
                label="Costo total (MXN)"
                required
                error={erroresForm.costo}
                hint={!erroresForm.costo && costoForm !== null && litrosForm ? `${formatCurrency(costoForm / litrosForm)} por litro` : undefined}
              >
                <input
                  aria-label="Costo total de la carga"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModalField label="Lugar de carga" required error={erroresForm.lugar}>
                <input
                  aria-label="Lugar de carga"
                  className={modalInputClass}
                  maxLength={LUGAR_MAX}
                  placeholder="Gasolinera o tanque de obra"
                  value={form.lugar}
                  onChange={(e) => cambiar('lugar', e.target.value)}
                />
              </ModalField>
              <ModalField label="Operador que recibió" error={erroresForm.operador}>
                <input
                  aria-label="Operador que recibió"
                  className={modalInputClass}
                  maxLength={OPERADOR_MAX}
                  placeholder="Si se deja vacío, el operador de la máquina"
                  value={form.operador}
                  onChange={(e) => cambiar('operador', e.target.value)}
                />
              </ModalField>
            </div>
            <p
              className={cn(
                'text-sm',
                desviacionForm !== null && desviacionForm > UMBRAL_ALERTA_PORCENTAJE ? 'text-red-600 dark:text-red-400' : 'text-ui-600',
              )}
            >
              Rendimiento:{' '}
              <span className="font-semibold tabular-nums">
                {rendimientoForm === null ? '—' : `${num(Math.round(rendimientoForm * 100) / 100)} L/h`}
              </span>
              {esperadoForm ? ` · esperado ${num(esperadoForm)} L/h` : ''}
              {desviacionForm !== null && desviacionForm > UMBRAL_ALERTA_PORCENTAJE && ' · se registrará con alerta de posible ordeña'}
            </p>
          </div>
        </FormModal>
      )}

      {/* ── Confirmar eliminación (botón rojo: FormModal solo trae el primario) ── */}
      {porEliminar && (
        <Modal open onClose={() => { if (!enviando) setPorEliminar(null); }} size="sm">
          <ModalHeader title="Eliminar carga" onClose={() => { if (!enviando) setPorEliminar(null); }} />
          <ModalBody>
            <p className="text-sm text-ui-700">
              Se eliminará la carga de <span className="font-semibold text-ui-900">{num(porEliminar.litros)} L</span> de{' '}
              <span className="font-semibold text-ui-900">{porEliminar.maquinaId}</span> del {formatFechaSolo(porEliminar.fecha)} (
              {formatCurrency(porEliminar.costo)}). Deja de contar en los totales y en la alerta de la máquina.
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
