"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiResponse, Maquina, DespachoMaquina, ChecklistPreoperacional } from '@svr-erp/shared';
import {
  maquinasApi,
  despachosApi,
  checklistsApi,
  catalogosApi,
  type PaginatedResponse,
  type ProyectoCatalogoDTO,
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
import { FormModal, ModalField, modalInputClass, modalSelectClass, modalTextareaClass } from '@/components/ui/Modal';

type Fuente = 'maquinas' | 'cronograma' | 'despachos' | 'checklists' | 'proyectos';
const ETIQUETA_FUENTE: Record<Fuente, string> = {
  maquinas: 'Máquinas',
  cronograma: 'Cronograma de despachos',
  despachos: 'Lista de despachos',
  checklists: 'Checklists',
  proyectos: 'Obras para despachar',
};

const PAGE_SIZE = 10;
/** Igual que la API (UMBRAL_SERVICIO_HRS): a 50 h o menos del próximo servicio se marca "servicio cerca". */
const UMBRAL_SERVICIO_HRS = 50;
/** Un cronograma de dos semanas cabe de sobra en una página de 100 (tope de la API). */
const LIMITE_VENTANA = 100;
// `Select` ya usa "" para su placeholder deshabilitado: "todos" lleva su propio valor.
const FILTRO_CHECKLIST = [
  { value: 'todos', label: 'Todos los resultados' },
  { value: 'Aprobado', label: 'Aprobados' },
  { value: 'Con Falla', label: 'Con falla' },
];

const VISTAS = ['equipos', 'despachos', 'checklists', 'mantenimiento'] as const;
type Vista = (typeof VISTAS)[number];
const esVista = (v: string): v is Vista => (VISTAS as readonly string[]).includes(v);

// Tipos que se ofrecen en el alta; la API los traduce a su catálogo ("Excavación" se guarda como "Excavadora").
const TIPOS = ['Excavación', 'Grúa', 'Transporte', 'Criba'] as const;

const ESTADO_BADGE: Record<Maquina['estado'], 'success' | 'info' | 'warning' | 'neutral'> = {
  Encendida: 'success',
  Movimiento: 'info',
  Mantenimiento: 'warning',
  Apagada: 'neutral',
};

/** Días del cronograma de despachos: dos semanas desde el lunes de esta semana (antes eran fechas fijas de 2025). */
const DIAS_CRONOGRAMA = 14;
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Mismas reglas que CreateMaquinaDto, CreateDespachoDto y CreateChecklistDto de la API.
const CODIGO_MAX = 20;
const NOMBRE_MAX = 150;
const OPERADOR_MAX = 150;
const OBSERVACIONES_MAX = 500;

const NIVELES_ACEITE = ['Correcto', 'Bajo', 'Exceso'] as const;
const NIVELES_HIDRAULICO = ['Correcto', 'Bajo'] as const;
const ESTADOS_LLANTAS = ['Correcto', 'Desgaste Severo', 'Daño'] as const;
const ESTADOS_SISTEMA = ['Correcto', 'Falla'] as const;

/** "YYYY-MM-DD" de hoy en la zona de la empresa. */
function hoyISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

/** Suma días a una fecha "YYYY-MM-DD" (en UTC para que no la mueva el horario de verano). */
function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function lunesDe(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  return sumarDias(fecha, -((d.getUTCDay() + 6) % 7));
}


/** Número ≥ min (y ≤ max), o null. */
function leerNumero(valor: string, min: number, max = Number.MAX_SAFE_INTEGER): number | null {
  if (valor.trim() === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

interface FormMaquina {
  codigo: string;
  tipo: (typeof TIPOS)[number];
  nombre: string;
  horometro: string;
  combustible: string;
  consumoEsperado: string;
}

const FORM_MAQUINA_VACIO: FormMaquina = { codigo: '', tipo: 'Excavación', nombre: '', horometro: '', combustible: '', consumoEsperado: '' };

interface FormChecklist {
  maquinaId: string;
  operador: string;
  horometroInicial: string;
  nivelAceiteMotor: (typeof NIVELES_ACEITE)[number];
  nivelHidraulico: (typeof NIVELES_HIDRAULICO)[number];
  estadoLlantasOrugas: (typeof ESTADOS_LLANTAS)[number];
  lucesYAlarmas: (typeof ESTADOS_SISTEMA)[number];
  sistemaFrenos: (typeof ESTADOS_SISTEMA)[number];
  fugasVisibles: boolean;
  observaciones: string;
}

/** Misma regla que ChecklistsService de la API (la que manda): cualquier punto en mal estado es "Con falla". */
function checklistConFalla(f: FormChecklist): boolean {
  return (
    f.fugasVisibles ||
    f.nivelAceiteMotor === 'Bajo' ||
    f.nivelHidraulico === 'Bajo' ||
    f.sistemaFrenos === 'Falla' ||
    f.lucesYAlarmas === 'Falla' ||
    f.estadoLlantasOrugas === 'Daño'
  );
}

type Errores = Record<string, string | undefined>;

function SelectCampo<T extends string>({ etiqueta, valor, opciones, onChange }: {
  etiqueta: string;
  valor: T;
  opciones: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <ModalField label={etiqueta}>
      <select aria-label={etiqueta} className={modalSelectClass} value={valor} onChange={(e) => onChange(e.target.value as T)}>
        {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </ModalField>
  );
}

export default function MaquinariaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  const vista = user?.vistas?.find((v) => v.ruta === '/maquinaria');
  const puedeCrear = vista?.puedeCrear ?? false;

  const [maquinaria, setMaquinaria] = useState<Maquina[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoCatalogoDTO[]>([]);
  // Despachos de las dos semanas que muestra el cronograma (la API filtra por fechas).
  const [ventana, setVentana] = useState<PaginatedResponse<DespachoMaquina> | null>(null);
  const [listaDespachos, setListaDespachos] = useState<PaginatedResponse<DespachoMaquina> | null>(null);
  const [listaChecklists, setListaChecklists] = useState<PaginatedResponse<ChecklistPreoperacional> | null>(null);
  const [cargaInicial, setCargaInicial] = useState(true);
  const [recargando, setRecargando] = useState(false);
  // Un error por fuente: una que falle (p. ej. obras sin permiso) ya no deja la vista entera en error.
  const [errores, setErrores] = useState<Partial<Record<Fuente, string>>>({});
  // Número de la última petición por fuente: una respuesta vieja (cambio rápido de página) no pisa a la nueva.
  const secuencia = useRef<Partial<Record<Fuente, number>>>({});

  const [tab, setTab] = useState<Vista>('equipos');
  const [inicioCronograma, setInicioCronograma] = useState(() => lunesDe(hoyISO()));
  const [paginaEquipos, setPaginaEquipos] = useState(1);
  const [paginaDespachos, setPaginaDespachos] = useState(1);
  const [paginaChecklists, setPaginaChecklists] = useState(1);
  const [filtroChecklist, setFiltroChecklist] = useState<'' | 'Aprobado' | 'Con Falla'>('');
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');

  // Modales
  const [altaOpen, setAltaOpen] = useState(false);
  const [formMaquina, setFormMaquina] = useState<FormMaquina>(FORM_MAQUINA_VACIO);
  const [despachoOpen, setDespachoOpen] = useState(false);
  const [formDespacho, setFormDespacho] = useState({ maquinaId: '', proyectoId: '', fechaInicio: '', fechaFin: '' });
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [formChecklist, setFormChecklist] = useState<FormChecklist | null>(null);
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
        const mensaje = error instanceof Error ? error.message : 'error desconocido';
        setErrores((prev) => ({ ...prev, [fuente]: mensaje }));
      }
    },
    [],
  );

  const cargarBase = useCallback(
    () =>
      Promise.all([
        cargarFuente('maquinas', maquinasApi.listar, setMaquinaria),
        cargarFuente('proyectos', catalogosApi.proyectos, setProyectos),
      ]),
    [cargarFuente],
  );

  const cargarCronograma = useCallback(
    () =>
      cargarFuente(
        'cronograma',
        () => despachosApi.listar({ desde: inicioCronograma, hasta: sumarDias(inicioCronograma, DIAS_CRONOGRAMA - 1), limit: LIMITE_VENTANA }),
        setVentana,
      ),
    [cargarFuente, inicioCronograma],
  );

  const cargarListaDespachos = useCallback(
    () => cargarFuente('despachos', () => despachosApi.listar({ page: paginaDespachos, limit: PAGE_SIZE }), setListaDespachos),
    [cargarFuente, paginaDespachos],
  );

  const cargarChecklists = useCallback(
    () =>
      cargarFuente(
        'checklists',
        () => checklistsApi.listar({ estado: filtroChecklist || undefined, page: paginaChecklists, limit: PAGE_SIZE }),
        setListaChecklists,
      ),
    [cargarFuente, filtroChecklist, paginaChecklists],
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

  // Cada lista se vuelve a pedir cuando cambia su página, su filtro o la semana del cronograma.
  useEffect(() => {
    (async () => {
      await cargarCronograma();
    })();
  }, [cargarCronograma]);
  useEffect(() => {
    (async () => {
      await cargarListaDespachos();
    })();
  }, [cargarListaDespachos]);
  useEffect(() => {
    (async () => {
      await cargarChecklists();
    })();
  }, [cargarChecklists]);

  const reintentar = async () => {
    if (recargando) return;
    setRecargando(true);
    try {
      await Promise.all([cargarBase(), cargarCronograma(), cargarListaDespachos(), cargarChecklists()]);
    } finally {
      setRecargando(false);
    }
  };

  const hoy = hoyISO();
  const maquinasCargadas = !errores.maquinas;

  // ── Indicadores (todos con datos reales) ──
  const operando = maquinaria.filter((m) => m.estado === 'Encendida' || m.estado === 'Movimiento').length;
  const enMantenimiento = maquinaria.filter((m) => m.estado === 'Mantenimiento').length;
  const conAlertaConsumo = maquinaria.filter((m) => m.alertaConsumoAnormal);
  const conChecklistHoy = maquinaria.filter((m) => m.checklistHoy);
  const conFallaHoy = conChecklistHoy.filter((m) => m.checklistHoy?.estado === 'Con Falla').length;
  // Próximo servicio por horas (del último registro de Mantenimiento). Antes salía de una fecha sembrada que
  // ningún flujo actualiza, y marcaba "vencidas" a máquinas por un dato congelado.
  const maquinasParaServicio = [...maquinaria].sort(
    (a, b) => (a.horasParaServicio ?? Infinity) - (b.horasParaServicio ?? Infinity),
  );
  const servicioCerca = maquinasParaServicio.filter((m) => m.horasParaServicio !== undefined && m.horasParaServicio <= UMBRAL_SERVICIO_HRS);
  const servicioMasCercano = maquinasParaServicio.find((m) => m.horasParaServicio !== undefined);

  // El filtro sale de los tipos que de verdad tiene la flota: antes era una lista fija con los nombres del alta
  // ("Excavación") y la API devuelve los del catálogo ("Excavadora", "Retroexcavadora"), así que nunca coincidía.
  const opcionesTipo = [
    { value: 'Todos', label: 'Todos los tipos' },
    ...Array.from(new Set(maquinaria.map((m) => m.tipo).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((t) => ({ value: t, label: t })),
  ];

  // Las máquinas son el catálogo de la flota (la API las manda completas): la búsqueda y la página son locales.
  const filtradas = maquinaria.filter((m) => {
    const texto = search.trim().toLowerCase();
    const coincide = !texto || [m.id, m.nombre, m.operador].some((v) => v?.toLowerCase().includes(texto));
    return coincide && (tipoFiltro === 'Todos' || m.tipo === tipoFiltro);
  });
  const paginasEquipos = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const paginaEquiposVisible = Math.min(paginaEquipos, paginasEquipos);
  const equiposPagina = filtradas.slice((paginaEquiposVisible - 1) * PAGE_SIZE, paginaEquiposVisible * PAGE_SIZE);

  const diasCronograma = Array.from({ length: DIAS_CRONOGRAMA }, (_, i) => sumarDias(inicioCronograma, i));
  const esSemanaActual = inicioCronograma === lunesDe(hoy);
  const despachosVentana = ventana?.items ?? [];
  const proyectoPorId = new Map(proyectos.map((p) => [p.id, p]));
  const maquinaPorId = new Map(maquinaria.map((m) => [m.id, m]));

  const etapaDespacho = (d: DespachoMaquina): 'En curso' | 'Programado' | 'Terminado' =>
    d.fechaFin < hoy ? 'Terminado' : d.fechaInicio > hoy ? 'Programado' : 'En curso';

  // ── Abrir modales (cada uno empieza limpio) ──
  const abrirAlta = () => {
    setFormMaquina(FORM_MAQUINA_VACIO);
    setErroresForm({});
    setAltaOpen(true);
  };

  const abrirDespacho = (maquinaId = '') => {
    setFormDespacho({ maquinaId, proyectoId: '', fechaInicio: hoy, fechaFin: sumarDias(hoy, 6) });
    setErroresForm({});
    setDespachoOpen(true);
  };

  const abrirChecklist = (maquina: Maquina) => {
    // El operador y el horómetro salen de la máquina (dato real); antes venía "Juan Pérez" y 1240 fijos.
    const operador = maquina.operador !== 'Sin asignar' ? maquina.operador : '';
    setFormChecklist({
      maquinaId: maquina.id,
      operador,
      horometroInicial: String(maquina.horometro),
      nivelAceiteMotor: 'Correcto',
      nivelHidraulico: 'Correcto',
      estadoLlantasOrugas: 'Correcto',
      lucesYAlarmas: 'Correcto',
      sistemaFrenos: 'Correcto',
      fugasVisibles: false,
      observaciones: '',
    });
    setErroresForm({});
    setChecklistOpen(true);
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

  // ── Guardar ──
  const guardarMaquina = () => conCandado(async () => {
    const e: Errores = {};
    const codigo = formMaquina.codigo.trim().toUpperCase();
    if (!codigo || codigo.length > CODIGO_MAX) e.codigo = `Escribe el código del equipo (hasta ${CODIGO_MAX} caracteres).`;
    else if (maquinaria.some((m) => m.id.toUpperCase() === codigo)) e.codigo = `Ya existe una máquina con el código ${codigo}.`;
    const nombre = formMaquina.nombre.trim();
    if (nombre.length < 2 || nombre.length > NOMBRE_MAX) e.nombre = 'Escribe la marca y el modelo.';
    const horometro = leerNumero(formMaquina.horometro, 0);
    if (horometro === null) e.horometro = 'Escribe el horómetro actual (0 si es nueva).';
    const combustible = leerNumero(formMaquina.combustible, 0, 100);
    if (combustible === null) e.combustible = 'Escribe el nivel de diésel, de 0 a 100 %.';
    const consumo = leerNumero(formMaquina.consumoEsperado, 0.1);
    if (consumo === null) e.consumoEsperado = 'Escribe el consumo esperado en litros por hora.';
    if (horometro === null || combustible === null || consumo === null || Object.values(e).some(Boolean)) {
      setErroresForm(e);
      return;
    }
    try {
      const res = await maquinasApi.crear({
        id: codigo,
        tipo: formMaquina.tipo,
        nombre,
        horometro,
        combustible,
        consumoEsperado: consumo,
      });
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      setMaquinaria((prev) => [res.data, ...prev]);
      setAltaOpen(false);
      showToast(`Máquina ${res.data.id} dada de alta. Su operador se asigna desde Trabajadores.`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo dar de alta la máquina.', 'error');
    }
  });

  const guardarDespacho = () => conCandado(async () => {
    const e: Errores = {};
    if (!formDespacho.maquinaId) e.maquinaId = 'Elige la máquina.';
    if (!formDespacho.proyectoId) e.proyectoId = 'Elige la obra.';
    if (!formDespacho.fechaInicio) e.fechaInicio = 'Indica desde cuándo.';
    if (!formDespacho.fechaFin) e.fechaFin = 'Indica hasta cuándo.';
    else if (formDespacho.fechaInicio && formDespacho.fechaFin < formDespacho.fechaInicio) {
      e.fechaFin = 'No puede ser antes de la fecha de inicio.';
    }
    if (Object.values(e).some(Boolean)) {
      setErroresForm(e);
      return;
    }
    try {
      const res = await despachosApi.crear(formDespacho);
      if (!res.success) {
        // La API revisa el traslape con toda la flota (409) y lo explica en el mensaje.
        showToast(res.error.message, 'error');
        return;
      }
      // El cronograma se va a la semana del despacho y la lista vuelve a la primera página (ahí aparece).
      const semana = lunesDe(res.data.fechaInicio);
      if (semana === inicioCronograma) void cargarCronograma();
      else setInicioCronograma(semana);
      if (paginaDespachos === 1) void cargarListaDespachos();
      else setPaginaDespachos(1);
      setDespachoOpen(false);
      const obra = proyectoPorId.get(res.data.proyectoId)?.nombre ?? 'la obra';
      showToast(`${res.data.maquinaId} despachada a ${obra} del ${formatFechaSolo(res.data.fechaInicio)} al ${formatFechaSolo(res.data.fechaFin)}.`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo despachar la máquina.', 'error');
    }
  });

  const guardarChecklist = () => conCandado(async () => {
    if (!formChecklist) return;
    const e: Errores = {};
    if (!formChecklist.maquinaId) e.maquinaId = 'Elige la máquina.';
    const operador = formChecklist.operador.trim();
    if (operador.length < 2 || operador.length > OPERADOR_MAX) e.operador = 'Escribe quién hizo la inspección.';
    const horometro = leerNumero(formChecklist.horometroInicial, 0);
    if (horometro === null) e.horometroInicial = 'Escribe el horómetro al arrancar.';
    const conFalla = checklistConFalla(formChecklist);
    const observaciones = formChecklist.observaciones.trim();
    // Con una falla, el motivo es lo que necesita Mantenimiento: no puede ir vacío.
    if (conFalla && observaciones.length < 3) e.observaciones = 'Describe la falla que se encontró.';
    if (horometro === null || Object.values(e).some(Boolean)) {
      setErroresForm(e);
      return;
    }
    try {
      const res = await checklistsApi.crear({
        maquinaId: formChecklist.maquinaId,
        operador,
        horometroInicial: horometro,
        nivelAceiteMotor: formChecklist.nivelAceiteMotor,
        nivelHidraulico: formChecklist.nivelHidraulico,
        fugasVisibles: formChecklist.fugasVisibles,
        estadoLlantasOrugas: formChecklist.estadoLlantasOrugas,
        lucesYAlarmas: formChecklist.lucesYAlarmas,
        sistemaFrenos: formChecklist.sistemaFrenos,
        observaciones,
      });
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      const nuevo = res.data;
      // La lista vuelve a la primera página sin filtro, donde aparece el recién registrado.
      if (paginaChecklists === 1 && filtroChecklist === '') void cargarChecklists();
      else {
        setPaginaChecklists(1);
        setFiltroChecklist('');
      }
      setMaquinaria((prev) =>
        prev.map((m) =>
          m.id === nuevo.maquinaId
            ? { ...m, checklistHoy: { id: nuevo.id, estado: nuevo.estado, hora: nuevo.hora, operador: nuevo.operador, observaciones: nuevo.observaciones } }
            : m,
        ),
      );
      setChecklistOpen(false);
      if (nuevo.estado === 'Con Falla') {
        showToast(`Checklist de ${nuevo.maquinaId} registrado con falla. Se avisó a Mantenimiento.`, 'warning');
        addNotification({
          titulo: `Falla en checklist: ${nuevo.maquinaId}`,
          mensaje: `${operador} reportó: ${observaciones}`,
          tipo: 'alerta',
        });
      } else {
        showToast(`Checklist de ${nuevo.maquinaId} aprobado: lista para operar.`, 'success');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo guardar el checklist.', 'error');
    }
  });

  const cambiarChecklist = <K extends keyof FormChecklist>(campo: K, valor: FormChecklist[K]) => {
    setFormChecklist((f) => (f ? { ...f, [campo]: valor } : f));
    setErroresForm((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
  };

  // ── Columnas ──
  // Cortes pensados en el ancho real del contenido: desde lg el sidebar le quita 288 px,
  // así que a 1024 hay casi el mismo espacio que a 768.
  const celdaEquipo = (m: Maquina) => (
    <div className="min-w-0 whitespace-normal">
      <p className="text-sm font-semibold text-ui-900">
        {m.id} <span className="font-normal text-ui-600">· {m.nombre}</span>
      </p>
      <p className="text-xs text-ui-500">
        {m.tipo}
        <span className="xl:hidden"> · {m.operador}</span>
      </p>
    </div>
  );

  const badgeChecklist = (m: Maquina) =>
    !m.checklistHoy ? (
      // Antes, sin checklist del día la tarjeta decía "Checklist OK · 06:45 AM".
      <Badge variant="neutral" size="sm">Sin checklist hoy</Badge>
    ) : m.checklistHoy.estado === 'Con Falla' ? (
      <Badge variant="error" size="sm">Con falla · {m.checklistHoy.hora}</Badge>
    ) : (
      <Badge variant="success" size="sm">Aprobado · {m.checklistHoy.hora}</Badge>
    );

  const sobreconsumo = (m: Maquina) => {
    if (!m.alertaConsumoAnormal) return null;
    const esperado = m.consumoEsperadoLtsHora;
    const actual = m.rendimientoActualLtsHora;
    // El porcentaje sale de los datos de la máquina (antes decía "+96 %" fijo).
    const pct = esperado && actual ? Math.round(((actual - esperado) / esperado) * 100) : null;
    return { actual, esperado, pct };
  };

  const textoServicio = (m: Maquina, conInsignia = false) => {
    const h = m.horasParaServicio;
    if (h === undefined) {
      return conInsignia
        ? <Badge variant="neutral" size="sm">Sin servicio registrado</Badge>
        : <span className="text-sm text-ui-400">—</span>;
    }
    const texto = h < 0 ? `Pasado por ${(-h).toLocaleString('es-MX')} h` : `Faltan ${h.toLocaleString('es-MX')} h`;
    if (h < 0) return <Badge variant="error" size="sm">{texto}</Badge>;
    if (h <= UMBRAL_SERVICIO_HRS) return <Badge variant="warning" size="sm">{texto}</Badge>;
    return <span className="text-sm text-ui-700 whitespace-nowrap">{texto}</span>;
  };

  const badgesEstado = (m: Maquina) => {
    const alerta = sobreconsumo(m);
    return (
      <>
        <Badge variant={ESTADO_BADGE[m.estado] ?? 'neutral'} size="sm">{m.estado}</Badge>
        {alerta && (
          <Badge variant="error" size="sm">
            Sobreconsumo{alerta.pct != null ? ` +${alerta.pct} %` : ''}
          </Badge>
        )}
      </>
    );
  };

  const columnasEquipos: Column<Maquina>[] = [
    {
      key: 'equipo',
      header: 'Equipo',
      render: (m) => (
        <div>
          {celdaEquipo(m)}
          {/* En pantallas chicas el estado y el checklist van aquí: sus columnas no caben. */}
          <div className="mt-1.5 flex flex-wrap gap-1 md:hidden">
            <span className="contents sm:hidden">{badgesEstado(m)}</span>
            {badgeChecklist(m)}
          </div>
        </div>
      ),
    },
    {
      key: 'operador',
      header: 'Operador',
      className: 'hidden xl:table-cell',
      render: (m) => (
        <span className={cn('text-sm truncate block max-w-[180px]', m.operador === 'Sin asignar' ? 'text-ui-400' : 'text-ui-700')}>
          {m.operador}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      className: 'hidden sm:table-cell',
      render: (m) => <div className="flex flex-col items-start gap-1">{badgesEstado(m)}</div>,
    },
    {
      key: 'horometro',
      header: 'Horómetro',
      align: 'right',
      className: 'hidden xl:table-cell',
      render: (m) => <span className="text-sm text-ui-700 tabular-nums whitespace-nowrap">{m.horometro.toLocaleString('es-MX')} h</span>,
    },
    {
      key: 'diesel',
      header: 'Diésel',
      align: 'right',
      className: 'hidden min-[1400px]:table-cell',
      render: (m) => (
        <span className={cn('text-sm tabular-nums', m.combustible <= 25 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-ui-700')}>
          {Math.round(m.combustible)} %
        </span>
      ),
    },
    { key: 'checklist', header: 'Checklist de hoy', className: 'hidden md:table-cell', render: badgeChecklist },
    {
      key: 'servicio',
      header: 'Próx. servicio',
      className: 'hidden 2xl:table-cell',
      render: (m) => textoServicio(m),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (m) => (
        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1">
          {puedeCrear && <Button variant="ghost" size="sm" onClick={() => abrirChecklist(m)}>Checklist</Button>}
          <Button variant="ghost" size="sm" onClick={() => router.push('/gps')}>GPS</Button>
        </div>
      ),
    },
  ];

  // Una columna por punto no cabía en ningún ancho con sidebar: se listan solo los que no están en "Correcto".
  const hallazgosDe = (c: ChecklistPreoperacional): string[] => [
    c.nivelAceiteMotor !== 'Correcto' && `Aceite ${c.nivelAceiteMotor.toLowerCase()}`,
    c.nivelHidraulico !== 'Correcto' && `Hidráulico ${c.nivelHidraulico.toLowerCase()}`,
    c.estadoLlantasOrugas !== 'Correcto' && `Llantas u orugas: ${c.estadoLlantasOrugas.toLowerCase()}`,
    c.lucesYAlarmas !== 'Correcto' && 'Falla en luces y alarmas',
    c.sistemaFrenos !== 'Correcto' && 'Falla en frenos',
    c.fugasVisibles && 'Fuga visible',
  ].filter((h): h is string => typeof h === 'string');

  const celdaHallazgos = (c: ChecklistPreoperacional) => {
    const hallazgos = hallazgosDe(c);
    return (
      <div className="whitespace-normal">
        <p
          className={cn(
            'text-sm',
            hallazgos.length === 0
              ? 'text-ui-500'
              : c.estado === 'Con Falla'
                ? 'text-red-600 dark:text-red-400 font-medium'
                : 'text-amber-700 dark:text-amber-400',
          )}
        >
          {hallazgos.length > 0 ? hallazgos.join(' · ') : 'Todo correcto'}
        </p>
        {c.observaciones && <p className="text-xs text-ui-500 line-clamp-2 break-words" title={c.observaciones}>{c.observaciones}</p>}
      </div>
    );
  };

  const columnasChecklists: Column<ChecklistPreoperacional>[] = [
    {
      key: 'maquina',
      header: 'Máquina',
      render: (c) => (
        <div className="min-w-0 whitespace-normal">
          <p className="text-sm font-semibold text-ui-900">{c.maquinaId}</p>
          <p className="text-xs text-ui-500 break-words">{c.operador || 'Sin operador'}</p>
          <p className="text-xs text-ui-500 tabular-nums sm:hidden">{formatFechaSolo(c.fecha)} · {c.hora}</p>
          <div className="mt-1 md:hidden">{celdaHallazgos(c)}</div>
        </div>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      className: 'hidden sm:table-cell',
      render: (c) => (
        <div className="whitespace-nowrap">
          <p className="text-sm text-ui-800">{formatFechaSolo(c.fecha)}</p>
          <p className="text-xs text-ui-500 tabular-nums">{c.hora}</p>
        </div>
      ),
    },
    { key: 'hallazgos', header: 'Hallazgos', className: 'hidden md:table-cell', render: celdaHallazgos },
    { key: 'horometro', header: 'Horómetro', align: 'right', className: 'hidden xl:table-cell', render: (c) => <span className="text-sm text-ui-700 tabular-nums">{c.horometroInicial.toLocaleString('es-MX')} h</span> },
    {
      key: 'estado',
      header: 'Resultado',
      render: (c) => <Badge variant={c.estado === 'Aprobado' ? 'success' : 'error'} size="sm">{c.estado}</Badge>,
    },
  ];

  const columnasServicio: Column<Maquina>[] = [
    { key: 'equipo', header: 'Equipo', render: celdaEquipo },
    { key: 'horometro', header: 'Horómetro', align: 'right', className: 'hidden md:table-cell', render: (m) => <span className="text-sm text-ui-700 tabular-nums">{m.horometro.toLocaleString('es-MX')} h</span> },
    {
      key: 'proximo',
      header: 'Próximo servicio',
      align: 'right',
      className: 'hidden lg:table-cell',
      render: (m) => (
        <span className="text-sm text-ui-700 tabular-nums whitespace-nowrap">
          {m.proximoServicioHoras === undefined ? '—' : `${m.proximoServicioHoras.toLocaleString('es-MX')} h`}
        </span>
      ),
    },
    { key: 'estado', header: 'Estado', align: 'right', render: (m) => textoServicio(m, true) },
    {
      key: 'consumo',
      header: 'Consumo',
      align: 'right',
      className: 'hidden xl:table-cell',
      render: (m) => {
        const alerta = sobreconsumo(m);
        return (
          <div className="whitespace-nowrap">
            <p className={cn('text-sm tabular-nums', alerta ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-ui-700')}>
              {m.rendimientoActualLtsHora != null ? `${m.rendimientoActualLtsHora} L/h` : '—'}
            </p>
            {m.consumoEsperadoLtsHora != null && <p className="text-xs text-ui-500">esperado {m.consumoEsperadoLtsHora} L/h</p>}
          </div>
        );
      },
    },
  ];

  const columnasDespachos: Column<DespachoMaquina>[] = [
    {
      key: 'maquina',
      header: 'Máquina',
      render: (d) => (
        <div className="min-w-0 whitespace-normal">
          <p className="text-sm font-semibold text-ui-900">
            {d.maquinaId}
            {maquinaPorId.get(d.maquinaId) && <span className="font-normal text-ui-600"> · {maquinaPorId.get(d.maquinaId)?.nombre}</span>}
          </p>
          <p className="text-xs text-ui-500 md:hidden">{proyectoPorId.get(d.proyectoId)?.nombre ?? d.proyectoId}</p>
          <p className="text-xs text-ui-500 tabular-nums sm:hidden">{formatFechaSolo(d.fechaInicio)} – {formatFechaSolo(d.fechaFin)}</p>
        </div>
      ),
    },
    {
      key: 'obra',
      header: 'Obra',
      className: 'hidden md:table-cell',
      render: (d) => {
        const obra = proyectoPorId.get(d.proyectoId);
        return (
          <div className="min-w-0 whitespace-normal">
            <p className="text-sm text-ui-800">{obra?.nombre ?? d.proyectoId}</p>
            {obra?.ubicacion && <p className="text-xs text-ui-500">{obra.ubicacion}</p>}
          </div>
        );
      },
    },
    {
      key: 'periodo',
      header: 'Periodo',
      className: 'hidden sm:table-cell',
      render: (d) => (
        <span className="text-sm text-ui-700 tabular-nums whitespace-nowrap">
          {formatFechaSolo(d.fechaInicio)} – {formatFechaSolo(d.fechaFin)}
        </span>
      ),
    },
    {
      key: 'etapa',
      header: 'Estado',
      render: (d) => {
        const etapa = etapaDespacho(d);
        return <Badge variant={etapa === 'En curso' ? 'info' : etapa === 'Programado' ? 'warning' : 'neutral'} size="sm">{etapa}</Badge>;
      },
    },
  ];

  const mensajesError = (Object.entries(errores) as [Fuente, string][]).map(([f, m]) => `${ETIQUETA_FUENTE[f]}: ${m}`);
  const falla = formChecklist ? checklistConFalla(formChecklist) : false;
  const maquinaChecklist = formChecklist ? maquinaria.find((m) => m.id === formChecklist.maquinaId) : undefined;
  const horometroMenor =
    maquinaChecklist && formChecklist && leerNumero(formChecklist.horometroInicial, 0) !== null &&
    Number(formChecklist.horometroInicial) < maquinaChecklist.horometro;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flota"
        subtitle="Equipos, despachos a obra e inspecciones pre-operacionales."
        action={
          puedeCrear ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={abrirAlta} className="w-full sm:w-auto">Alta de máquina</Button>
              <Button variant="outline" onClick={() => abrirDespacho()} disabled={maquinaria.length === 0}>Despachar a obra</Button>
              {/* El checklist se hace desde la fila de cada máquina: el botón del encabezado repetía la acción. */}
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
            <p className="font-semibold">No se pudo cargar toda la información de la flota.</p>
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
        <LoadingState text="Cargando flota..." size="lg" />
      ) : (
        <>
          {/* Indicadores: una sola tira con divisiones de 1px, con datos reales */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-ui-200 border border-ui-200 rounded-xl overflow-hidden">
            <StatsCard
              className="rounded-none border-0 hover:shadow-none hover:bg-ui-50"
              label="Operando"
              value={maquinasCargadas ? `${operando} / ${maquinaria.length}` : '—'}
              hint={maquinasCargadas && enMantenimiento > 0 ? `${enMantenimiento} en mantenimiento` : undefined}
              onClick={() => setTab('equipos')}
            />
            <StatsCard
              className="rounded-none border-0 hover:shadow-none hover:bg-ui-50"
              label="Alertas de consumo"
              value={maquinasCargadas ? conAlertaConsumo.length : '—'}
              hint={maquinasCargadas && conAlertaConsumo.length > 0 ? conAlertaConsumo.map((m) => m.id).join(', ') : undefined}
              onClick={() => router.push('/combustible')}
            />
            <StatsCard
              className="rounded-none border-0 hover:shadow-none hover:bg-ui-50"
              label="Checklists de hoy"
              value={maquinasCargadas ? `${conChecklistHoy.length} / ${maquinaria.length}` : '—'}
              hint={maquinasCargadas && conFallaHoy > 0 ? `${conFallaHoy} con falla` : undefined}
              onClick={() => setTab('checklists')}
            />
            <StatsCard
              className="rounded-none border-0 hover:shadow-none hover:bg-ui-50"
              label="Servicio cerca o pasado"
              value={maquinasCargadas ? servicioCerca.length : '—'}
              hint={!maquinasCargadas
                ? undefined
                : servicioCerca.length > 0
                  ? servicioCerca.map((m) => m.id).join(', ')
                  : servicioMasCercano?.horasParaServicio !== undefined
                    ? `Más cercano: ${servicioMasCercano.id} (faltan ${servicioMasCercano.horasParaServicio.toLocaleString('es-MX')} h)`
                    : 'Sin servicios registrados'}
              onClick={() => setTab('mantenimiento')}
            />
          </div>

          <Tabs
            ariaLabel="Secciones de flota"
            value={tab}
            onChange={(k) => { if (esVista(k)) setTab(k); }}
            tabs={[
              { key: 'equipos', label: 'Equipos', count: maquinasCargadas ? maquinaria.length : undefined },
              { key: 'despachos', label: 'Despachos', count: listaDespachos?.pagination.total },
              { key: 'checklists', label: 'Checklists', count: filtroChecklist ? undefined : listaChecklists?.pagination.total },
              { key: 'mantenimiento', label: 'Mantenimiento' },
            ]}
          >
            {/* ── EQUIPOS ── */}
            {tab === 'equipos' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <SearchBar
                      value={search}
                      onChange={(v) => { setSearch(v); setPaginaEquipos(1); }}
                      placeholder="Buscar por código, máquina u operador..."
                    />
                  </div>
                  <div className="sm:w-52">
                    <Select
                      aria-label="Filtrar por tipo"
                      placeholder="Tipo"
                      value={tipoFiltro}
                      onChange={(e) => { setTipoFiltro(e.target.value); setPaginaEquipos(1); }}
                      options={opcionesTipo}
                    />
                  </div>
                </div>
                <DataTable
                  headerVariant="neutral"
                  columns={columnasEquipos}
                  data={equiposPagina}
                  keyExtractor={(m) => m.id}
                  maxBodyHeight="none"
                  emptyText={!maquinasCargadas
                    ? 'No se pudieron cargar las máquinas.'
                    : maquinaria.length === 0
                      ? 'Todavía no hay máquinas dadas de alta.'
                      : 'Ninguna máquina coincide con la búsqueda o el filtro.'}
                />
                <Pagination
                  currentPage={paginaEquiposVisible}
                  totalPages={paginasEquipos}
                  totalRecords={filtradas.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPaginaEquipos}
                />
              </div>
            )}

            {/* ── DESPACHOS (cronograma de dos semanas desde el lunes) ── */}
            {tab === 'despachos' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm text-ui-600">
                    Qué máquina está en qué obra del {formatFechaSolo(diasCronograma[0])} al {formatFechaSolo(diasCronograma[DIAS_CRONOGRAMA - 1])}.
                    {errores.proyectos && ' Sin el catálogo de obras, las asignaciones se muestran con su clave.'}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button type="button" variant="outline" size="sm" aria-label="Semana anterior" onClick={() => setInicioCronograma((f) => sumarDias(f, -7))}>
                      Anterior
                    </Button>
                    <Button type="button" variant="ghost" size="sm" disabled={esSemanaActual} onClick={() => setInicioCronograma(lunesDe(hoy))}>
                      Esta semana
                    </Button>
                    <Button type="button" variant="outline" size="sm" aria-label="Semana siguiente" onClick={() => setInicioCronograma((f) => sumarDias(f, 7))}>
                      Siguiente
                    </Button>
                  </div>
                </div>
                <div className="bg-surface rounded-xl border border-ui-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left border-collapse">
                      <thead>
                        <tr className="bg-ui-50 text-ui-500 text-xs border-b border-ui-200">
                          <th className="px-3 sm:px-4 py-3 font-semibold sticky left-0 bg-ui-50 z-10">Equipo</th>
                          {diasCronograma.map((d) => {
                            const fecha = new Date(`${d}T00:00:00Z`);
                            const esHoy = d === hoy;
                            return (
                              <th key={d} className={cn('px-1 py-3 font-semibold text-center whitespace-nowrap', esHoy && 'text-primary')}>
                                <span className="block">{DIAS_CORTOS[fecha.getUTCDay()]}</span>
                                <span className="block tabular-nums">{fecha.getUTCDate()}</span>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ui-100">
                        {maquinaria.length === 0 ? (
                          <tr>
                            <td colSpan={DIAS_CRONOGRAMA + 1} className="px-4 py-10 text-center text-sm text-ui-500">
                              {maquinasCargadas ? 'Todavía no hay máquinas.' : 'No se pudieron cargar las máquinas.'}
                            </td>
                          </tr>
                        ) : (
                          maquinaria.map((m) => (
                            <tr key={m.id} className="hover:bg-ui-50 transition-colors">
                              <td className="px-3 sm:px-4 py-2.5 sticky left-0 bg-surface z-10">
                                <p className="text-sm font-semibold text-ui-900 whitespace-nowrap">{m.id}</p>
                                {/* En móvil solo el código: con el nombre, la columna fija tapaba casi todos los días. */}
                                <p className="hidden sm:block text-xs text-ui-500 truncate max-w-[160px]">{m.nombre}</p>
                              </td>
                              {diasCronograma.map((d) => {
                                const desp = despachosVentana.find((x) => x.maquinaId === m.id && d >= x.fechaInicio && d <= x.fechaFin);
                                const obra = desp ? proyectoPorId.get(desp.proyectoId)?.nombre ?? desp.proyectoId : null;
                                return (
                                  <td key={d} className={cn('px-1 py-2 text-center', d === hoy && 'bg-primary/5')}>
                                    {obra ? (
                                      <span
                                        title={obra}
                                        className="block truncate max-w-[64px] mx-auto px-1.5 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 text-[10px] font-semibold"
                                      >
                                        {obra}
                                      </span>
                                    ) : (
                                      <span className="text-ui-300 text-xs">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {errores.cronograma && (
                  <p className="text-xs text-red-600 dark:text-red-400">No se pudieron cargar los despachos de estas semanas: el cronograma está vacío.</p>
                )}
                {ventana && ventana.pagination.total > despachosVentana.length && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Se muestran {despachosVentana.length} de {ventana.pagination.total} despachos de estas semanas.
                  </p>
                )}

                <h3 className="pt-3 text-sm font-semibold text-ui-900">Todos los despachos</h3>
                <DataTable
                  headerVariant="neutral"
                  columns={columnasDespachos}
                  data={listaDespachos?.items ?? []}
                  loading={!listaDespachos && !errores.despachos}
                  keyExtractor={(d) => d.id}
                  onRowClick={(d) => setInicioCronograma(lunesDe(d.fechaInicio))}
                  maxBodyHeight="none"
                  emptyText={errores.despachos ? 'No se pudieron cargar los despachos.' : 'Todavía no hay despachos registrados.'}
                />
                {listaDespachos && (
                  <Pagination
                    currentPage={listaDespachos.pagination.page}
                    totalPages={listaDespachos.pagination.totalPages}
                    totalRecords={listaDespachos.pagination.total}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPaginaDespachos}
                  />
                )}
                {(listaDespachos?.items.length ?? 0) > 0 && <p className="text-xs text-ui-500">Toca un despacho para ver su semana en el cronograma.</p>}
              </div>
            )}

            {/* ── CHECKLISTS ── */}
            {tab === 'checklists' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm text-ui-600">
                    Inspección diaria antes de arrancar: aceite, hidráulico, llantas u orugas, luces, frenos y fugas. Cualquier punto en
                    mal estado deja el checklist con falla y avisa a Mantenimiento.
                  </p>
                  <div className="sm:w-52 shrink-0">
                    <Select
                      aria-label="Filtrar por resultado"
                      value={filtroChecklist || 'todos'}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFiltroChecklist(v === 'Aprobado' || v === 'Con Falla' ? v : '');
                        setPaginaChecklists(1);
                      }}
                      options={FILTRO_CHECKLIST}
                    />
                  </div>
                </div>
                <DataTable
                  headerVariant="neutral"
                  columns={columnasChecklists}
                  data={listaChecklists?.items ?? []}
                  loading={!listaChecklists && !errores.checklists}
                  keyExtractor={(c) => c.id}
                  maxBodyHeight="none"
                  emptyText={errores.checklists
                    ? 'No se pudieron cargar los checklists.'
                    : filtroChecklist
                      ? 'Ningún checklist con ese resultado.'
                      : 'Todavía no hay checklists registrados.'}
                />
                {listaChecklists && (
                  <Pagination
                    currentPage={listaChecklists.pagination.page}
                    totalPages={listaChecklists.pagination.totalPages}
                    totalRecords={listaChecklists.pagination.total}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPaginaChecklists}
                  />
                )}
              </div>
            )}

            {/* ── MANTENIMIENTO ── */}
            {tab === 'mantenimiento' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-sm text-ui-600">
                    Horas que le faltan a cada máquina para el servicio que dejó programado su último mantenimiento, de la más
                    urgente a la menos.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => router.push('/mantenimiento')} className="shrink-0">
                    Ir a Mantenimiento
                  </Button>
                </div>
                <DataTable
                  headerVariant="neutral"
                  columns={columnasServicio}
                  data={maquinasParaServicio}
                  keyExtractor={(m) => m.id}
                  maxBodyHeight="none"
                  emptyText={maquinasCargadas ? 'Todavía no hay máquinas.' : 'No se pudieron cargar las máquinas.'}
                />
              </div>
            )}
          </Tabs>
        </>
      )}

      {/* ── Alta de máquina ── */}
      <FormModal
        open={altaOpen}
        onClose={() => { if (!enviando) setAltaOpen(false); }}
        onSubmit={guardarMaquina}
        title="Alta de máquina"
        submitLabel={enviando ? 'Guardando…' : 'Dar de alta'}
        isSubmitting={enviando}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ModalField label="Código" required error={erroresForm.codigo}>
              <input
                aria-label="Código del equipo"
                className={modalInputClass}
                placeholder="Ej: M005"
                maxLength={CODIGO_MAX}
                value={formMaquina.codigo}
                onChange={(e) => { setFormMaquina({ ...formMaquina, codigo: e.target.value }); setErroresForm((er) => ({ ...er, codigo: undefined })); }}
              />
            </ModalField>
            <ModalField label="Tipo" required>
              <select
                aria-label="Tipo de máquina"
                className={modalSelectClass}
                value={formMaquina.tipo}
                onChange={(e) => setFormMaquina({ ...formMaquina, tipo: e.target.value as FormMaquina['tipo'] })}
              >
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </ModalField>
          </div>
          <ModalField label="Marca y modelo" required error={erroresForm.nombre}>
            <input
              aria-label="Marca y modelo"
              className={modalInputClass}
              placeholder="Ej: Excavadora CAT 320"
              maxLength={NOMBRE_MAX}
              value={formMaquina.nombre}
              onChange={(e) => { setFormMaquina({ ...formMaquina, nombre: e.target.value }); setErroresForm((er) => ({ ...er, nombre: undefined })); }}
            />
          </ModalField>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ModalField label="Horómetro (h)" required error={erroresForm.horometro}>
              <input
                aria-label="Horómetro actual"
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                className={modalInputClass}
                value={formMaquina.horometro}
                onChange={(e) => { setFormMaquina({ ...formMaquina, horometro: e.target.value }); setErroresForm((er) => ({ ...er, horometro: undefined })); }}
              />
            </ModalField>
            <ModalField label="Diésel (%)" required error={erroresForm.combustible}>
              <input
                aria-label="Nivel de diésel en porcentaje"
                type="number"
                min="0"
                max="100"
                inputMode="numeric"
                className={modalInputClass}
                value={formMaquina.combustible}
                onChange={(e) => { setFormMaquina({ ...formMaquina, combustible: e.target.value }); setErroresForm((er) => ({ ...er, combustible: undefined })); }}
              />
            </ModalField>
            <ModalField label="Consumo esperado (L/h)" required error={erroresForm.consumoEsperado}>
              <input
                aria-label="Consumo esperado en litros por hora"
                type="number"
                min="0.1"
                step="0.1"
                inputMode="decimal"
                className={modalInputClass}
                value={formMaquina.consumoEsperado}
                onChange={(e) => { setFormMaquina({ ...formMaquina, consumoEsperado: e.target.value }); setErroresForm((er) => ({ ...er, consumoEsperado: undefined })); }}
              />
            </ModalField>
          </div>
          <p className="text-xs text-ui-500">
            El consumo esperado es contra el que se comparan las alertas de sobreconsumo. El operador se asigna desde
            Trabajadores (ahí se avisa si la máquina ya la tiene alguien).
          </p>
        </div>
      </FormModal>

      {/* ── Despacho a obra ── */}
      <FormModal
        open={despachoOpen}
        onClose={() => { if (!enviando) setDespachoOpen(false); }}
        onSubmit={guardarDespacho}
        title="Despachar a obra"
        submitLabel={enviando ? 'Guardando…' : 'Despachar'}
        isSubmitting={enviando}
      >
        <div className="space-y-4">
          <ModalField label="Máquina" required error={erroresForm.maquinaId}>
            <select
              aria-label="Máquina a despachar"
              className={modalSelectClass}
              value={formDespacho.maquinaId}
              onChange={(e) => { setFormDespacho({ ...formDespacho, maquinaId: e.target.value }); setErroresForm((er) => ({ ...er, maquinaId: undefined })); }}
            >
              <option value="">Elige la máquina</option>
              {maquinaria.map((m) => <option key={m.id} value={m.id}>{m.id} · {m.nombre}</option>)}
            </select>
          </ModalField>
          <ModalField
            label="Obra"
            required
            error={erroresForm.proyectoId}
            hint={errores.proyectos ? `No se pudo cargar el catálogo de obras (${errores.proyectos}).` : undefined}
          >
            <select
              aria-label="Obra destino"
              className={modalSelectClass}
              value={formDespacho.proyectoId}
              disabled={!!errores.proyectos}
              onChange={(e) => { setFormDespacho({ ...formDespacho, proyectoId: e.target.value }); setErroresForm((er) => ({ ...er, proyectoId: undefined })); }}
            >
              <option value="">{errores.proyectos ? 'No disponible' : 'Elige la obra'}</option>
              {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.ubicacion ? ` · ${p.ubicacion}` : ''}</option>)}
            </select>
          </ModalField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ModalField label="Desde" required error={erroresForm.fechaInicio}>
              <input
                aria-label="Fecha de inicio del despacho"
                type="date"
                className={modalInputClass}
                value={formDespacho.fechaInicio}
                onChange={(e) => { setFormDespacho({ ...formDespacho, fechaInicio: e.target.value }); setErroresForm((er) => ({ ...er, fechaInicio: undefined })); }}
              />
            </ModalField>
            <ModalField label="Hasta" required error={erroresForm.fechaFin}>
              <input
                aria-label="Fecha de fin del despacho"
                type="date"
                min={formDespacho.fechaInicio || undefined}
                className={modalInputClass}
                value={formDespacho.fechaFin}
                onChange={(e) => { setFormDespacho({ ...formDespacho, fechaFin: e.target.value }); setErroresForm((er) => ({ ...er, fechaFin: undefined })); }}
              />
            </ModalField>
          </div>
          <p className="text-xs text-ui-500">Si la máquina ya está en otra obra en esas fechas, el sistema no deja despacharla.</p>
        </div>
      </FormModal>

      {/* ── Checklist pre-operacional ── */}
      {formChecklist && (
        <FormModal
          open={checklistOpen}
          onClose={() => { if (!enviando) setChecklistOpen(false); }}
          onSubmit={guardarChecklist}
          title="Checklist pre-operacional"
          submitLabel={enviando ? 'Guardando…' : 'Guardar checklist'}
          isSubmitting={enviando}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModalField label="Máquina" required error={erroresForm.maquinaId}>
                <select
                  aria-label="Máquina inspeccionada"
                  className={modalSelectClass}
                  value={formChecklist.maquinaId}
                  onChange={(e) => {
                    const m = maquinaria.find((x) => x.id === e.target.value);
                    cambiarChecklist('maquinaId', e.target.value);
                    // Al cambiar de máquina se toman su operador y su horómetro.
                    if (m) {
                      cambiarChecklist('operador', m.operador !== 'Sin asignar' ? m.operador : '');
                      cambiarChecklist('horometroInicial', String(m.horometro));
                    }
                  }}
                >
                  {maquinaria.map((m) => <option key={m.id} value={m.id}>{m.id} · {m.nombre}</option>)}
                </select>
              </ModalField>
              <ModalField label="Quién inspeccionó" required error={erroresForm.operador}>
                <input
                  aria-label="Quién hizo la inspección"
                  className={modalInputClass}
                  maxLength={OPERADOR_MAX}
                  placeholder="Nombre del operador"
                  value={formChecklist.operador}
                  onChange={(e) => cambiarChecklist('operador', e.target.value)}
                />
              </ModalField>
            </div>
            <ModalField
              label="Horómetro al arrancar (h)"
              required
              error={erroresForm.horometroInicial}
              hint={horometroMenor && maquinaChecklist
                ? `Es menor que el último registrado (${maquinaChecklist.horometro.toLocaleString('es-MX')} h): revisa la lectura.`
                : undefined}
            >
              <input
                aria-label="Horómetro al arrancar"
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                className={modalInputClass}
                value={formChecklist.horometroInicial}
                onChange={(e) => cambiarChecklist('horometroInicial', e.target.value)}
              />
            </ModalField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectCampo etiqueta="Aceite de motor" valor={formChecklist.nivelAceiteMotor} opciones={NIVELES_ACEITE} onChange={(v) => cambiarChecklist('nivelAceiteMotor', v)} />
              <SelectCampo etiqueta="Nivel hidráulico" valor={formChecklist.nivelHidraulico} opciones={NIVELES_HIDRAULICO} onChange={(v) => cambiarChecklist('nivelHidraulico', v)} />
              <SelectCampo etiqueta="Llantas u orugas" valor={formChecklist.estadoLlantasOrugas} opciones={ESTADOS_LLANTAS} onChange={(v) => cambiarChecklist('estadoLlantasOrugas', v)} />
              <SelectCampo etiqueta="Luces y alarmas" valor={formChecklist.lucesYAlarmas} opciones={ESTADOS_SISTEMA} onChange={(v) => cambiarChecklist('lucesYAlarmas', v)} />
              <SelectCampo etiqueta="Frenos y dirección" valor={formChecklist.sistemaFrenos} opciones={ESTADOS_SISTEMA} onChange={(v) => cambiarChecklist('sistemaFrenos', v)} />
            </div>
            <label className="flex items-start gap-2 p-3 rounded-xl border border-ui-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formChecklist.fugasVisibles}
                onChange={(e) => cambiarChecklist('fugasVisibles', e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary"
              />
              <span className="text-sm text-ui-800">Hay fuga visible de aceite, anticongelante o diésel</span>
            </label>
            <ModalField label="Observaciones" required={falla} error={erroresForm.observaciones}>
              <textarea
                aria-label="Observaciones de la inspección"
                rows={2}
                maxLength={OBSERVACIONES_MAX}
                className={modalTextareaClass}
                placeholder={falla ? 'Describe la falla que se encontró' : 'Opcional'}
                value={formChecklist.observaciones}
                onChange={(e) => cambiarChecklist('observaciones', e.target.value)}
              />
            </ModalField>
            <p className={cn('text-sm', falla ? 'text-red-600 dark:text-red-400' : 'text-ui-600')}>
              Resultado: <span className="font-semibold">{falla ? 'con falla (se avisa a Mantenimiento)' : 'aprobado'}</span>
            </p>
          </div>
        </FormModal>
      )}
    </div>
  );
}
