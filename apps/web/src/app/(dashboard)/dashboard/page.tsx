"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ApiResponse, Maquina } from '@svr-erp/shared';
import {
  asistenciaApi,
  horometroApi,
  maquinasApi,
  proyectosApi,
  reportesCampoApi,
  type AsistenciaSemanalDTO,
  type HorometroStats,
  type PaginatedResponse,
  type ProyectoDTO,
  type RegistroAsistenciaDTO,
  type ReportesCampoStats,
} from '@/lib/api';
import { APP_TIMEZONE, formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { LoadingState } from '@/components/ui/LoadingState';

type Fuente = 'maquinas' | 'registros' | 'semanal' | 'horometro' | 'reportes' | 'proyectos';
const ETIQUETA_FUENTE: Record<Fuente, string> = {
  maquinas: 'Máquinas',
  registros: 'Asistencia de hoy',
  semanal: 'Omisiones de hoy',
  horometro: 'Servicios',
  reportes: 'Reportes',
  proyectos: 'Proyectos',
};

// Mismo tope que la vista de Asistencia: la API no entrega más de 200 por página.
const LIMITE_REGISTROS = 200;
const PROYECTOS_A_MOSTRAR = 5;
const AVISOS_A_MOSTRAR = 8;

// La tira se reparte según cuántos indicadores puede ver el rol, para que no queden huecos.
const COLUMNAS_TIRA: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-3',
  4: 'grid-cols-2 xl:grid-cols-4',
};

/** "YYYY-MM-DD" de hoy en la zona de la empresa. */
function hoyISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

function fechaLarga(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('es-MX', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

const numero = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 2 });
const horas = (n: number) => `${numero(n)} h`;
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

interface Indicador {
  clave: string;
  etiqueta: string;
  valor: string | number;
  detalle?: string;
  ruta?: string;
}

interface Aviso {
  clave: string;
  /** Orden en la lista: menor = más urgente. */
  peso: number;
  titulo: string;
  detalle: string;
  etiqueta: string;
  variante: BadgeVariant;
  ruta?: string;
}

const COLUMNAS_PROYECTOS: Column<ProyectoDTO>[] = [
  {
    key: 'proyecto',
    header: 'Proyecto',
    minWidth: '180px',
    render: (p) => (
      <div className="min-w-0">
        <p className="text-sm font-medium text-ui-900">{p.nombre}</p>
        <p className="text-xs text-ui-500">{p.cliente}</p>
      </div>
    ),
  },
  {
    key: 'presupuesto',
    header: 'Presupuesto',
    align: 'right',
    nowrap: true,
    render: (p) => <span className="text-sm text-ui-800 tabular-nums">{formatCurrency(p.presupuesto)}</span>,
  },
  {
    key: 'cobrado',
    header: 'Cobrado',
    align: 'right',
    nowrap: true,
    render: (p) => <span className="text-sm text-ui-800 tabular-nums">{formatCurrency(p.ingresoCobrado)}</span>,
  },
  {
    key: 'avance',
    header: 'Avance',
    align: 'right',
    nowrap: true,
    className: 'hidden sm:table-cell',
    render: (p) => <span className="text-sm text-ui-700 tabular-nums">{numero(p.progreso)} %</span>,
  },
];

function FilaAviso({ aviso }: { aviso: Aviso }) {
  const clase = 'flex items-start justify-between gap-3 px-4 py-3';
  const contenido = (
    <>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ui-900 break-words">{aviso.titulo}</p>
        <p className="mt-0.5 text-xs text-ui-500 break-words">{aviso.detalle}</p>
      </div>
      <Badge variant={aviso.variante} size="sm" className="shrink-0">{aviso.etiqueta}</Badge>
    </>
  );
  if (!aviso.ruta) return <div className={clase}>{contenido}</div>;
  return (
    <Link
      href={aviso.ruta}
      className={cn(clase, 'transition-colors hover:bg-ui-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary')}
    >
      {contenido}
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Cada fuente se pide solo si el rol tiene su vista: así un rol limitado no recibe 403 ni ve datos ajenos.
  const puedeVer = (ruta: string) => !!user?.vistas?.some((v) => v.ruta === ruta && v.puedeVer);
  const verMaquinas = puedeVer('/maquinaria');
  const verAsistencia = puedeVer('/asistencia');
  const verHorometro = puedeVer('/horometro');
  const verReportes = puedeVer('/reportes');
  const verProyectos = puedeVer('/proyectos');
  const verCombustible = puedeVer('/combustible');
  const verMantenimiento = puedeVer('/mantenimiento');

  const [maquinas, setMaquinas] = useState<Maquina[] | null>(null);
  const [registros, setRegistros] = useState<PaginatedResponse<RegistroAsistenciaDTO> | null>(null);
  const [semanal, setSemanal] = useState<AsistenciaSemanalDTO[] | null>(null);
  const [horometro, setHorometro] = useState<HorometroStats | null>(null);
  const [reportes, setReportes] = useState<ReportesCampoStats | null>(null);
  const [proyectos, setProyectos] = useState<PaginatedResponse<ProyectoDTO> | null>(null);
  const [errores, setErrores] = useState<Partial<Record<Fuente, string>>>({});
  const [cargaInicial, setCargaInicial] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [hoy, setHoy] = useState(hoyISO);
  // Número de la última petición por fuente: una respuesta vieja no pisa a la nueva.
  const secuencia = useRef<Partial<Record<Fuente, number>>>({});

  const cargarFuente = useCallback(
    async <T,>(fuente: Fuente, pedir: () => Promise<ApiResponse<T>>, guardar: (d: T) => void) => {
      const numeroPeticion = (secuencia.current[fuente] ?? 0) + 1;
      secuencia.current[fuente] = numeroPeticion;
      try {
        const res = await pedir();
        if (secuencia.current[fuente] !== numeroPeticion) return;
        if (!res.success) throw new Error(res.error.message || 'error desconocido');
        guardar(res.data);
        setErrores((prev) => {
          if (!(fuente in prev)) return prev;
          const siguiente = { ...prev };
          delete siguiente[fuente];
          return siguiente;
        });
      } catch (error) {
        if (secuencia.current[fuente] !== numeroPeticion) return;
        setErrores((prev) => ({ ...prev, [fuente]: error instanceof Error && error.message ? error.message : 'error desconocido' }));
      }
    },
    [],
  );

  const cargarTodo = useCallback(
    () =>
      Promise.all([
        verMaquinas && cargarFuente('maquinas', maquinasApi.listar, setMaquinas),
        verAsistencia && cargarFuente('registros', () => asistenciaApi.listar({ limit: LIMITE_REGISTROS }), setRegistros),
        verAsistencia && cargarFuente('semanal', () => asistenciaApi.semanal(), setSemanal),
        verHorometro && cargarFuente('horometro', horometroApi.stats, setHorometro),
        verReportes && cargarFuente('reportes', reportesCampoApi.stats, setReportes),
        verProyectos &&
          cargarFuente('proyectos', () => proyectosApi.listar({ estado: 'EN_PROCESO', limit: PROYECTOS_A_MOSTRAR }), setProyectos),
      ]),
    [cargarFuente, verMaquinas, verAsistencia, verHorometro, verReportes, verProyectos],
  );

  useEffect(() => {
    (async () => {
      try {
        await cargarTodo();
      } finally {
        setCargaInicial(false);
      }
    })();
  }, [cargarTodo]);

  const reintentar = async () => {
    if (recargando) return;
    setRecargando(true);
    try {
      await cargarTodo();
      // Después de cargar: la fecha y los datos que dependen de ella cambian juntos.
      setHoy(hoyISO());
    } finally {
      setRecargando(false);
    }
  };

  // Una fuente que falló cuenta como no cargada: se muestra '—' en lugar de un 0 que parecería real.
  const maquinasListas = maquinas !== null && !errores.maquinas ? maquinas : null;
  const registrosHoy = registros !== null && !errores.registros ? registros.items : null;
  const semanalListo = semanal !== null && !errores.semanal ? semanal : null;
  const horometroListo = horometro !== null && !errores.horometro ? horometro : null;
  const reportesListos = reportes !== null && !errores.reportes ? reportes : null;
  const proyectosListos = proyectos !== null && !errores.proyectos ? proyectos : null;

  // ── Flota ──
  const operando = maquinasListas?.filter((m) => m.estado === 'Encendida' || m.estado === 'Movimiento').length ?? null;
  const enMantenimiento = maquinasListas?.filter((m) => m.estado === 'Mantenimiento').length ?? 0;
  const conAlertaConsumo = maquinasListas?.filter((m) => m.alertaConsumoAnormal) ?? null;

  // ── Asistencia ── Solo cuenta quien sí checó, igual que en la vista de Asistencia.
  const enSitio = registrosHoy?.filter((r) => !r.sinMarcaje && r.enSitio).length ?? null;
  const fueraDeObra = registrosHoy?.filter((r) => !r.sinMarcaje && !r.enSitio).length ?? null;
  const retardos = registrosHoy?.filter((r) => r.estado === 'Retardo').length ?? null;

  // Mismo número que "Omisiones hoy" en Asistencia: quien checó tarde (registro en omisión) y quien no ha checado.
  // Una omisión sin registro pasadas las 17:00 la API ya la entrega como falta del día.
  const esDomingo = new Date(`${hoy}T12:00:00Z`).getUTCDay() === 0;
  const diasDeHoy = semanalListo?.flatMap((s) => s.dias.filter((d) => d.fecha === hoy)) ?? [];
  // De lunes a sábado cada trabajador trae su día de hoy. Si no viene, la fecha del equipo no coincide con la del
  // servidor: se deja sin dato en lugar de afirmar que no hay omisiones.
  const fechaCoincide = esDomingo || !semanalListo?.length || diasDeHoy.length > 0;
  let omisiones: { total: number; vencidas: number; porLlegar: number } | null = null;
  if (registrosHoy && semanalListo && fechaCoincide) {
    const sinChecar = diasDeHoy.filter((d) => !d.registroId && (d.estado === 'Omisión' || d.estado === 'Falta'));
    // El domingo es descanso (la semana laboral es de lunes a sábado): nadie queda en omisión.
    const registradas = esDomingo ? [] : registrosHoy.filter((r) => r.estado === 'Omisión');
    omisiones = {
      total: sinChecar.length + registradas.length,
      vencidas: sinChecar.filter((d) => d.estado === 'Falta').length + registradas.filter((r) => r.omisionVencida).length,
      porLlegar: diasDeHoy.filter((d) => d.estado === 'Pendiente').length,
    };
  }

  // ── Indicadores ──
  const rutaConsumo = verCombustible ? '/combustible' : undefined;
  const rutaServicios = verMantenimiento ? '/mantenimiento' : '/horometro';
  const indicadores: Indicador[] = [];
  if (verMaquinas) {
    indicadores.push({
      clave: 'operando',
      etiqueta: 'Máquinas operando',
      valor: operando ?? '—',
      detalle: maquinasListas
        ? `de ${maquinasListas.length}${enMantenimiento > 0 ? `, ${enMantenimiento} en mantenimiento` : ''}`
        : undefined,
      ruta: '/maquinaria',
    });
  }
  if (verAsistencia) {
    indicadores.push({
      clave: 'en-sitio',
      etiqueta: 'Personal en sitio hoy',
      valor: enSitio ?? '—',
      detalle: semanalListo ? `de ${plural(semanalListo.length, 'activo', 'activos')}` : undefined,
      ruta: '/asistencia',
    });
  }
  if (verMaquinas) {
    indicadores.push({
      clave: 'consumo',
      etiqueta: 'Alertas de consumo',
      valor: conAlertaConsumo?.length ?? '—',
      detalle: maquinasListas ? 'Según la última carga' : undefined,
      ruta: rutaConsumo,
    });
  }
  if (verHorometro) {
    indicadores.push({
      clave: 'servicios',
      etiqueta: 'Servicios cercanos',
      valor: horometroListo?.serviciosProximos ?? '—',
      detalle: horometroListo ? `A ${horas(horometroListo.umbralServicioHoras)} o menos` : undefined,
      ruta: rutaServicios,
    });
  }
  // Un rol sin flota (RRHH) llena la tira con lo que sí le toca.
  if (verAsistencia && !verMaquinas && !verHorometro) {
    indicadores.push(
      { clave: 'fuera', etiqueta: 'Fuera de obra', valor: fueraDeObra ?? '—', ruta: '/asistencia' },
      {
        clave: 'omisiones',
        etiqueta: 'Omisiones hoy',
        valor: omisiones?.total ?? '—',
        detalle: omisiones && omisiones.porLlegar > 0 ? `${omisiones.porLlegar} por llegar` : undefined,
        ruta: '/asistencia',
      },
      { clave: 'retardos', etiqueta: 'Retardos hoy', valor: retardos ?? '—', ruta: '/asistencia' },
    );
  }

  // ── Avisos ──
  const avisos: Aviso[] = [];
  if (reportesListos && reportesListos.criticosActivos > 0) {
    avisos.push({
      clave: 'criticos',
      peso: 0,
      titulo: plural(reportesListos.criticosActivos, 'incidente crítico sin resolver', 'incidentes críticos sin resolver'),
      detalle: 'Prioridad alta o crítica',
      etiqueta: 'Crítico',
      variante: 'error',
      ruta: '/reportes',
    });
  }
  conAlertaConsumo?.forEach((m) => {
    const real = m.rendimientoActualLtsHora;
    const esperado = m.consumoEsperadoLtsHora;
    avisos.push({
      clave: `consumo-${m.id}`,
      peso: 2,
      titulo: `Posible ordeña: ${m.nombre} (${m.id})`,
      detalle: real && esperado ? `${numero(real)} L/h contra ${numero(esperado)} L/h esperados` : 'Consumo fuera de lo esperado en la última carga',
      etiqueta: 'Consumo',
      variante: 'error',
      ruta: rutaConsumo,
    });
  });
  horometroListo?.servicios.forEach((s) => {
    if (s.horasRestantes === null || s.horasRestantes > horometroListo.umbralServicioHoras) return;
    const pasado = s.horasRestantes < 0;
    avisos.push({
      clave: `servicio-${s.maquinaId}`,
      peso: pasado ? 1 : 4,
      titulo: `${pasado ? 'Servicio pasado' : 'Servicio próximo'}: ${s.nombre} (${s.maquinaId})`,
      detalle: pasado ? `Se pasó por ${horas(-s.horasRestantes)}` : `Faltan ${horas(s.horasRestantes)}`,
      etiqueta: pasado ? 'Pasado' : 'Próximo',
      variante: pasado ? 'error' : 'warning',
      ruta: rutaServicios,
    });
  });
  if (omisiones && omisiones.total > 0) {
    const { total, vencidas } = omisiones;
    avisos.push({
      clave: 'omisiones',
      peso: vencidas > 0 ? 1 : 3,
      titulo: `${plural(total, 'omisión', 'omisiones')} de hoy por resolver`,
      detalle:
        vencidas > 0
          ? `${vencidas} ${vencidas === 1 ? 'ya pasó el plazo de las 17:00 y cuenta' : 'ya pasaron el plazo de las 17:00 y cuentan'} como falta`
          : 'Se pueden justificar hasta las 17:00',
      etiqueta: vencidas > 0 ? 'Vencida' : 'Omisión',
      variante: vencidas > 0 ? 'error' : 'warning',
      ruta: '/asistencia',
    });
  }
  if (reportesListos && reportesListos.nuevos + reportesListos.enCurso > 0) {
    const { nuevos, enCurso } = reportesListos;
    avisos.push({
      clave: 'reportes',
      peso: 5,
      titulo: `${plural(nuevos + enCurso, 'reporte', 'reportes')} por atender`,
      detalle: `${plural(nuevos, 'pendiente', 'pendientes')}, ${enCurso} en curso`,
      etiqueta: 'Reportes',
      variante: 'info',
      ruta: '/reportes',
    });
  }
  avisos.sort((a, b) => a.peso - b.peso);
  const avisosVisibles = avisos.slice(0, AVISOS_A_MOSTRAR);

  const mostrarAvisos = verMaquinas || verHorometro || verAsistencia || verReportes;
  // Si alguna fuente falló no se puede afirmar que no hay avisos.
  const avisosIncompletos =
    (verMaquinas && !maquinasListas) || (verHorometro && !horometroListo) || (verAsistencia && !omisiones) || (verReportes && !reportesListos);
  const hayContenido = indicadores.length > 0 || mostrarAvisos || verProyectos;
  const dosColumnas = mostrarAvisos && verProyectos;

  const mensajesError = (Object.entries(errores) as [Fuente, string][]).map(([f, m]) => `${ETIQUETA_FUENTE[f]}: ${m}`);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={`Resumen de hoy, ${fechaLarga(hoy)}.`} />

      {mensajesError.length > 0 && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10"
        >
          <div className="text-sm text-red-700 dark:text-red-300 min-w-0">
            <p className="font-semibold">No se pudo cargar toda la información del resumen.</p>
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
        <LoadingState text="Cargando resumen..." size="lg" />
      ) : !hayContenido ? (
        <Card>
          <p className="text-sm text-ui-500 text-center">Tu usuario todavía no tiene módulos asignados para este resumen.</p>
        </Card>
      ) : (
        <>
          {indicadores.length > 0 && (
            <div className={cn('grid gap-px bg-ui-200 border border-ui-200 rounded-xl overflow-hidden', COLUMNAS_TIRA[indicadores.length])}>
              {indicadores.map(({ clave, etiqueta, valor, detalle, ruta }) => (
                <StatsCard
                  key={clave}
                  className={cn('rounded-none border-0', ruta && 'hover:shadow-none hover:bg-ui-50')}
                  label={etiqueta}
                  value={valor}
                  hint={detalle}
                  onClick={ruta ? () => router.push(ruta) : undefined}
                />
              ))}
            </div>
          )}

          <div className={cn('grid grid-cols-1 gap-6 items-start', dosColumnas && 'xl:grid-cols-5')}>
            {/* En el DOM van primero los avisos: en móvil es lo que hay que leer antes. */}
            {mostrarAvisos && (
              <section className={cn('min-w-0 space-y-3', dosColumnas && 'xl:col-span-2 xl:order-2')}>
                <h2 className="text-sm font-semibold text-ui-900">Avisos ({avisos.length})</h2>
                <Card padding="none">
                  {avisos.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-ui-500 text-center">
                      {avisosIncompletos ? 'No se pudieron revisar todos los avisos.' : 'Sin avisos por ahora.'}
                    </p>
                  ) : (
                    <>
                      <ul className="divide-y divide-ui-100">
                        {avisosVisibles.map((aviso) => (
                          <li key={aviso.clave}>
                            <FilaAviso aviso={aviso} />
                          </li>
                        ))}
                      </ul>
                      {avisos.length > avisosVisibles.length && (
                        <p className="px-4 py-2 text-xs text-ui-500 border-t border-ui-100">
                          Y {avisos.length - avisosVisibles.length} más en sus módulos.
                        </p>
                      )}
                      {avisosIncompletos && (
                        <p className="px-4 py-2 text-xs text-ui-500 border-t border-ui-100">
                          Lista incompleta: no se pudieron revisar todas las fuentes.
                        </p>
                      )}
                    </>
                  )}
                </Card>
              </section>
            )}

            {verProyectos && (
              <section className={cn('min-w-0 space-y-3', dosColumnas && 'xl:col-span-3 xl:order-1')}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-ui-900">
                    Proyectos en proceso{proyectosListos ? ` (${proyectosListos.pagination.total})` : ''}
                  </h2>
                  <Link href="/proyectos" className="text-sm font-medium text-primary hover:underline">
                    Ver todos
                  </Link>
                </div>
                <DataTable
                  columns={COLUMNAS_PROYECTOS}
                  data={proyectosListos?.items ?? []}
                  keyExtractor={(p) => p.id}
                  headerVariant="neutral"
                  emptyText={errores.proyectos ? 'No se pudieron cargar los proyectos.' : 'No hay proyectos en proceso.'}
                />
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
