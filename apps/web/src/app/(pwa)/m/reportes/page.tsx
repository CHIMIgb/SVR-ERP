'use client';

/**
 * Reportes de campo en el teléfono — PRIMERA vista real de la PWA (§8.1).
 * El BACKEND ya aplica el ámbito por JWT (`aplicarAmbito`): la lista trae lo
 * que toca a cada rol (propios / equipo / torre / todo) sin filtrar en la
 * vista. Captura offline-first con cola + idempotencia (ModalNuevoReporte);
 * las acciones interactivas (aceptar / en curso / cerrar) piden conexión y
 * van por el apiClient, nunca a la cola. Botones gated por RBAC: crear y
 * editar leen la vista de escritorio `/reportes` (permiso ya existente).
 */
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  mensajeErrorApi,
  reportesCampoApi,
  type EstadoIncidenteApi,
  type ReporteCampoDTO,
  type ReportesIncidenteDetalle,
} from '@/lib/api';
import { EstadoCola } from '@/components/pwa/EstadoCola';
import { ModalNuevoReporte } from '@/components/pwa/ModalNuevoReporte';
import { TarjetaReporte } from '@/components/pwa/TarjetaReporte';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { RefreshOverlay } from '@/components/ui/RefreshOverlay';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatsCard } from '@/components/ui/StatsCard';
import { cn } from '@/lib/utils';

const FILTROS: { valor: '' | EstadoIncidenteApi; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'NUEVO', etiqueta: 'Nuevos' },
  { valor: 'EN_CURSO', etiqueta: 'En curso' },
  { valor: 'CERRADO', etiqueta: 'Cerrados' },
];

/** Subtítulo según el rol — el server ya decidió QUÉ ve; esto solo lo nombra. */
function subtituloDelRol(nombreRol: string | undefined): string {
  if (nombreRol === 'Trabajador') return 'Tus reportes de campo';
  if (nombreRol === 'Residente') return 'Reportes de tu equipo';
  if (nombreRol === 'Técnico') return 'Disponibles en tu área';
  return 'Reportes de campo';
}

interface StatsMini {
  nuevos: number | null;
  enCurso: number | null;
  criticos: number | null;
}

const STATS_CARGANDO: StatsMini = { nuevos: null, enCurso: null, criticos: null };

export default function ReportesMovilPage() {
  const { user } = useAuth();
  const puedeCrear =
    user?.vistas?.find((v) => v.ruta === '/reportes')?.puedeCrear ?? false;
  const puedeEditar =
    user?.vistas?.find((v) => v.ruta === '/reportes')?.puedeEditar ?? false;
  const nombreUsuario =
    [user?.persona?.nombre, user?.persona?.apellidoPaterno, user?.persona?.apellidoMaterno]
      .filter(Boolean)
      .join(' ')
      .trim() || user?.email?.split('@')[0] || 'Usuario';

  const [reportes, setReportes] = useState<ReporteCampoDTO[]>([]);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'' | EstadoIncidenteApi>('');
  const [busqueda, setBusqueda] = useState('');
  const [stats, setStats] = useState<StatsMini>(STATS_CARGANDO);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [colaKey, setColaKey] = useState(0);
  const [detalle, setDetalle] = useState<ReportesIncidenteDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [aceptandoId, setAceptandoId] = useState<string | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  /** Listado paginado server-side (techo del backend: 100). */
  const recargar = useCallback(
    async (paginaPedida: number, reemplazar: boolean): Promise<void> => {
      try {
        const res = await reportesCampoApi.listar({
          page: paginaPedida,
          limit: 10,
          estado: (filtro || undefined) as EstadoIncidenteApi | undefined,
          search: busqueda.trim() || undefined,
        });
        if (!res.success) {
          setErrorCarga(mensajeErrorApi(res.error, 'No se pudieron cargar los reportes.'));
          return;
        }
        const data = res.data;
        setReportes((prev) => (reemplazar ? data.items : [...prev, ...data.items]));
        setPagina(data.pagination.page);
        setHayMas(data.pagination.page < data.pagination.totalPages);
        setErrorCarga(null);
      } catch (e) {
        setErrorCarga(e instanceof Error ? e.message : 'No se pudieron cargar los reportes.');
      } finally {
        setRefrescando(false);
      }
    },
    [filtro, busqueda],
  );

  const cargarStats = useCallback(async (): Promise<void> => {
    try {
      const res = await reportesCampoApi.stats();
      if (res.success) {
        setStats({
          nuevos: res.data.nuevos,
          enCurso: res.data.enCurso,
          criticos: res.data.criticosActivos,
        });
      }
    } catch {
      // Las stats son informativas: no bloquean la lista
    }
  }, []);

  // Primera carga + recarga con debounce al cambiar filtro/búsqueda.
  useEffect(() => {
    const t = window.setTimeout(() => {
      void recargar(1, true).then(() => setCargandoInicial(false));
    }, 400);
    return () => window.clearTimeout(t);
  }, [recargar]);

  // Al volver la señal: la cola pudo entregar capturas → refrescar todo.
  useEffect(() => {
    const alVolver = () => {
      setRefrescando(true);
      void recargar(1, true);
      void cargarStats();
    };
    window.addEventListener('online', alVolver);
    return () => window.removeEventListener('online', alVolver);
  }, [recargar, cargarStats]);

  /** Tras encolar (con o sin ACK): refresca cola + lista + stats. */
  const alEncolar = () => {
    setColaKey((k) => k + 1);
    setRefrescando(true);
    void recargar(1, true);
    void cargarStats();
  };

  const cerrarNuevo = () => {
    setNuevoAbierto(false);
    alEncolar();
  };

  const aceptar = async (item: ReporteCampoDTO, esDetalle = false): Promise<void> => {
    setAceptandoId(item.id);
    setMensaje(null);
    try {
      const res = await reportesCampoApi.aceptar(item.id);
      if (res.success) {
        setMensaje(
          `Aceptado${res.data.codigo ? ` ${res.data.codigo}` : ''} — quedaste como responsable.`,
        );
        if (esDetalle && detalle?.reporte.id === item.id) {
          setDetalle({ ...detalle, reporte: res.data });
        }
        setRefrescando(true);
        await recargar(1, true);
        await cargarStats();
      } else {
        setMensaje(mensajeErrorApi(res.error, 'No se pudo aceptar el reporte.'));
      }
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo aceptar el reporte.');
    } finally {
      setAceptandoId(null);
    }
  };

  const verDetalle = async (id: string): Promise<void> => {
    setCargandoDetalle(true);
    setDetalle(null);
    setMensaje(null);
    try {
      const res = await reportesCampoApi.detalle(id);
      if (res.success) setDetalle(res.data);
      else setMensaje(mensajeErrorApi(res.error, 'No se pudo cargar el detalle.'));
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo cargar el detalle.');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalle = () => setDetalle(null);

  const cambiarEstado = async (estado: 'EN_CURSO' | 'CERRADO'): Promise<void> => {
    if (!detalle) return;
    setCambiandoEstado(true);
    setMensaje(null);
    try {
      const res = await reportesCampoApi.cambiarEstado(detalle.reporte.id, estado);
      if (res.success) {
        setDetalle({ ...detalle, reporte: res.data });
        setMensaje(`Reporte ${res.data.estado}.`);
        setRefrescando(true);
        await recargar(1, true);
        await cargarStats();
      } else {
        setMensaje(mensajeErrorApi(res.error, 'No se pudo cambiar el estado.'));
      }
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo cambiar el estado.');
    } finally {
      setCambiandoEstado(false);
    }
  };

  const reporteDetalle = detalle?.reporte;
  const ubicacion = reporteDetalle
    ? reporteDetalle.proyecto ??
      (reporteDetalle.latitud != null && reporteDetalle.longitud != null
        ? `${reporteDetalle.latitud.toFixed(5)}, ${reporteDetalle.longitud.toFixed(5)}`
        : '—')
    : '—';

  return (
    <div className="space-y-4">
      {/* Encabezado + acción principal */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-ui-900">Reportes</h1>
          <p className="text-sm text-ui-500">{subtituloDelRol(user?.roles?.[0]?.nombre)}</p>
        </div>
        {puedeCrear && (
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setNuevoAbierto(true)}
            className="min-h-[44px] shrink-0"
          >
            Reportar
          </Button>
        )}
      </header>

      {/* Stats mini (spinner SOLO en el espacio del valor mientras cargan) */}
      <div className="grid grid-cols-3 gap-2">
        <StatsCard label="Nuevos" value={stats.nuevos ?? 0} loading={stats.nuevos === null} />
        <StatsCard label="En curso" value={stats.enCurso ?? 0} loading={stats.enCurso === null} />
        <StatsCard label="Críticos" value={stats.criticos ?? 0} loading={stats.criticos === null} />
      </div>

      {/* Estado de la cola offline (incluye conflicto con decisión humana) */}
      <EstadoCola refreshKey={colaKey} />

      {errorCarga && (
        <div
          className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded-xl p-3 text-sm flex items-start gap-2"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>{errorCarga}</span>
        </div>
      )}

      {/* Búsqueda + chips de estado */}
      <Input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por folio, persona o texto..."
        aria-label="Buscar reportes"
      />
      <div
        className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-4 px-4"
        role="group"
        aria-label="Filtrar por estado"
      >
        {FILTROS.map((f) => (
          <button
            key={f.valor || 'todos'}
            type="button"
            onClick={() => setFiltro(f.valor)}
            aria-pressed={filtro === f.valor}
            className={cn(
              'shrink-0 min-h-[44px] px-4 rounded-full text-sm font-bold border transition-colors',
              filtro === f.valor
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-ui-600 border-ui-200',
            )}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      {/* Lista (server-side paginada, patrón móvil: cards + cargar más) */}
      <div className="relative">
        <RefreshOverlay show={refrescando && !cargandoInicial} />
        {cargandoInicial ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
        ) : reportes.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle className="w-10 h-10" />}
            title="Sin reportes"
            subtitle={
              puedeCrear
                ? 'No hay reportes en tu alcance todavía. Reporta el primero.'
                : 'No hay reportes en tu alcance.'
            }
          />
        ) : (
          <div className="space-y-3">
            {reportes.map((r) => (
              <TarjetaReporte
                key={r.id}
                reporte={r}
                onVer={() => void verDetalle(r.id)}
                accion={
                  puedeEditar && r.estado === 'Nuevo'
                    ? {
                        etiqueta: 'Aceptar',
                        onClick: () => void aceptar(r),
                        ocupado: aceptandoId === r.id,
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {hayMas && !cargandoInicial && (
        <Button
          variant="secondary"
          fullWidth
          loading={refrescando}
          onClick={() => {
            setRefrescando(true);
            void recargar(pagina + 1, false);
          }}
        >
          Cargar más
        </Button>
      )}

      {mensaje && (
        <p className="text-sm text-ui-600 px-1" role="status">
          {mensaje}
        </p>
      )}

      {/* Detalle del reporte (conexión requerida para las acciones) */}
      <Modal open={cargandoDetalle || detalle !== null} onClose={cerrarDetalle} size="md">
        {cargandoDetalle || !detalle ? (
          <ModalBody>
            <div className="flex justify-center py-10" aria-busy="true">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          </ModalBody>
        ) : (
          <>
            <ModalHeader
              title={detalle.reporte.codigo ?? 'Reporte'}
              subtitle={`${detalle.reporte.estado}${
                detalle.reporte.prioridad ? ` · ${detalle.reporte.prioridad}` : ''
              }`}
              onClose={cerrarDetalle}
            />
            <ModalBody>
              <div className="space-y-3 text-sm">
                <p className="text-ui-900 break-words">{detalle.reporte.descripcion}</p>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
                  <div className="min-w-0">
                    <dt className="text-[10px] font-black uppercase tracking-widest text-ui-500">
                      Categoría
                    </dt>
                    <dd className="text-ui-900 break-words">
                      {detalle.reporte.subcategoria ?? detalle.reporte.categoria ?? detalle.reporte.tipo}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] font-black uppercase tracking-widest text-ui-500">
                      Reportó
                    </dt>
                    <dd className="text-ui-900 break-words">{detalle.reporte.usuario}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] font-black uppercase tracking-widest text-ui-500">
                      Ubicación
                    </dt>
                    <dd className="text-ui-900 break-words">{ubicacion}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] font-black uppercase tracking-widest text-ui-500">
                      Asignado
                    </dt>
                    <dd className="text-ui-900 break-words">
                      {detalle.reporte.asignadoANombre ?? '—'}
                    </dd>
                  </div>
                </dl>
                {detalle.reportadoPor?.telefono && (
                  <p className="text-[13px] text-ui-600">
                    Tel: <a href={`tel:${detalle.reportadoPor.telefono}`} className="font-bold text-primary underline">{detalle.reportadoPor.telefono}</a>
                  </p>
                )}
                {detalle.actividades.length > 0 && (
                  <div className="border-t border-ui-100 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-ui-500">
                      Bitácora
                    </p>
                    <ul className="mt-1.5 space-y-1.5">
                      {detalle.actividades.map((a) => (
                        <li key={a.id} className="text-[13px] text-ui-700 break-words">
                          <span className="font-bold">{a.autorNombre}</span> · {a.texto}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <div className="flex flex-wrap gap-2 w-full">
                {puedeEditar && detalle.reporte.estado === 'Nuevo' && (
                  <Button
                    variant="primary"
                    onClick={() => void aceptar(detalle.reporte, true)}
                    loading={aceptandoId === detalle.reporte.id}
                  >
                    Aceptar
                  </Button>
                )}
                {puedeEditar && detalle.reporte.estado === 'Nuevo' && (
                  <Button
                    variant="secondary"
                    onClick={() => void cambiarEstado('EN_CURSO')}
                    loading={cambiandoEstado}
                  >
                    En curso
                  </Button>
                )}
                {puedeEditar && detalle.reporte.estado === 'En curso' && (
                  <Button
                    variant="primary"
                    onClick={() => void cambiarEstado('CERRADO')}
                    loading={cambiandoEstado}
                  >
                    Cerrar reporte
                  </Button>
                )}
                <Button variant="secondary" onClick={cerrarDetalle}>
                  Cerrar
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* Captura offline-first: cola + idempotencia */}
      <ModalNuevoReporte
        abierto={nuevoAbierto}
        onCerrar={cerrarNuevo}
        nombreUsuario={nombreUsuario}
        torreUsuario={user?.torre ?? null}
        onEncolado={alEncolar}
      />
    </div>
  );
}
