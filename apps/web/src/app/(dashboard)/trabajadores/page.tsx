"use client";

import React, { useEffect, useRef, useState } from 'react';
import {
  trabajadoresApi,
  bitacorasRentaApi,
  type BitacoraRentaDTO,
  type CatalogosTrabajadoresDTO,
  type TrabajadorDTO,
} from '@/lib/api';
import { formatCurrency, formatFechaSolo } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { authApi, mensajeErrorApi } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState } from '@/components/ui/LoadingState';
import TrabajadorFormModal, { CATEGORIAS_PUESTO, llevaMaquina } from '@/components/workers/TrabajadorFormModal';
import CredencialesAccesoModal, { type CredencialesAcceso } from '@/components/workers/CredencialesAccesoModal';
import BitacorasRentaModal, { ESTADO_COBRO_BADGE } from '@/components/workers/BitacorasRentaModal';
import LiquidacionModal from '@/components/workers/LiquidacionModal';

const PAGE_SIZE = 12;
const PAGE_SIZE_BITACORAS = 20;

// Etiquetas cortas: el select del filtro es angosto (las largas se enciman con la flecha).
const FILTRO_CATEGORIAS = [
  { value: 'Todos', label: 'Todos los puestos' },
  { value: 'Operador', label: 'Operadores' },
  { value: 'Chofer', label: 'Choferes' },
  { value: 'Mecanico', label: 'Mecánicos' },
  { value: 'Tecnico Diesel', label: 'Téc. Diésel' },
  { value: 'Soldador', label: 'Soldadores' },
  { value: 'Mantenimiento', label: 'Mantenimiento' },
  { value: 'Ingeniero', label: 'Ingenieros' },
  { value: 'RRHH', label: 'RRHH' },
  { value: 'Administrativo', label: 'Administrativos' },
  { value: 'Otro', label: 'Otro' },
];

const FILTRO_ESTADOS = [
  { value: 'Activo', label: 'Activos' },
  { value: 'Vacaciones', label: 'De vacaciones' },
  { value: 'Inactivo', label: 'Dados de baja' },
  { value: 'Todos', label: 'Todos' },
];

const ETIQUETA_CATEGORIA: Record<string, string> = Object.fromEntries(CATEGORIAS_PUESTO.map((c) => [c.value, c.label]));

const ESTADO_BADGE: Record<TrabajadorDTO['estado'], { variant: 'success' | 'info' | 'neutral'; label: string }> = {
  Activo: { variant: 'success', label: 'Activo' },
  Vacaciones: { variant: 'info', label: 'Vacaciones' },
  Inactivo: { variant: 'neutral', label: 'Baja' },
};

type Pag = { page: number; limit: number; total: number; totalPages: number };

function Aviso({ titulo, detalle, onReintentar, reintentando }: { titulo: string; detalle: string; onReintentar: () => void; reintentando: boolean }) {
  return (
    <div
      role="alert"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10"
    >
      <div className="text-sm text-red-700 dark:text-red-300 min-w-0">
        <p className="font-semibold">{titulo}</p>
        <p className="mt-0.5 text-xs break-words">{detalle}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onReintentar} disabled={reintentando} className="shrink-0">
        {reintentando ? 'Reintentando…' : 'Reintentar'}
      </Button>
    </div>
  );
}

export default function TrabajadoresPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const vista = user?.vistas?.find((v) => v.ruta === '/trabajadores');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;
  // Reiniciar PIN (mesa de ayuda, PR #18 #6): el endpoint exige sistema.usuarios.editar.
  const puedeGestionarPin = user?.permisos?.some(
    (p) => p.modulo === 'sistema' && p.recurso === 'usuarios' && p.accion === 'editar',
  ) ?? false;

  const [tab, setTab] = useState<'plantilla' | 'bitacoras'>('plantilla');

  // ── Plantilla ──
  const [busqueda, setBusqueda] = useState('');
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [categoria, setCategoria] = useState('Todos');
  const [estado, setEstado] = useState('Activo');
  const [page, setPage] = useState(1);
  const [recargaLista, setRecargaLista] = useState(0);
  const [trabajadores, setTrabajadores] = useState<TrabajadorDTO[]>([]);
  const [pagination, setPagination] = useState<Pag>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [listaInicial, setListaInicial] = useState(true);
  // La lista está "cargando" mientras la última respuesta no corresponda a los filtros actuales; así una
  // respuesta lenta de un filtro anterior nunca pisa la del filtro nuevo.
  const filtrosLista = JSON.stringify([busqueda, categoria, estado, page]);
  const claveLista = JSON.stringify([filtrosLista, recargaLista]);
  const [claveListaCargada, setClaveListaCargada] = useState<string | null>(null);
  const cargandoLista = claveLista !== claveListaCargada;
  // Filtros con los que se obtuvieron las filas en pantalla: si la carga de otro filtro falla, no se muestran
  // filas que no corresponden (p. ej. activos bajo el filtro "Dados de baja").
  const [filtrosDatos, setFiltrosDatos] = useState<string | null>(null);

  // ── Bitácoras (concentrado) ──
  const [busquedaBit, setBusquedaBit] = useState('');
  const [textoBusquedaBit, setTextoBusquedaBit] = useState('');
  const [pageBit, setPageBit] = useState(1);
  const [recargaBit, setRecargaBit] = useState(0);
  const [bitacoras, setBitacoras] = useState<BitacoraRentaDTO[]>([]);
  const [paginationBit, setPaginationBit] = useState<Pag | null>(null);
  const [errorBit, setErrorBit] = useState<string | null>(null);
  const claveBit = JSON.stringify([busquedaBit, pageBit, recargaBit]);
  const [claveBitCargada, setClaveBitCargada] = useState<string | null>(null);
  const cargandoBit = tab === 'bitacoras' && claveBit !== claveBitCargada;

  // ── Catálogos (máquinas y proyectos) ──
  const [catalogos, setCatalogos] = useState<CatalogosTrabajadoresDTO | null>(null);
  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null);
  const [intentoCatalogos, setIntentoCatalogos] = useState(0);
  const [catalogosCargando, setCatalogosCargando] = useState(true);

  // ── Modales ──
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<TrabajadorDTO | null>(null);
  // P14 §6.6-2: credenciales del alta — el PIN temporal vive aquí y se muestra una sola vez.
  const [credenciales, setCredenciales] = useState<CredencialesAcceso | null>(null);
  // Reiniciar PIN (PR #18 #6): confirmación + entrega con el MISMO modal del alta.
  const [reinicioPendiente, setReinicioPendiente] = useState<TrabajadorDTO | null>(null);
  const [reiniciando, setReiniciando] = useState(false);
  const [bitacorasDe, setBitacorasDe] = useState<TrabajadorDTO | null>(null);
  const [abriendoBitacorasId, setAbriendoBitacorasId] = useState<string | null>(null);
  const abriendoBitacorasRef = useRef(false);
  const [liquidacionOpen, setLiquidacionOpen] = useState(false);
  const [liquidarA, setLiquidarA] = useState<TrabajadorDTO | null>(null);

  useEffect(() => {
    let vigente = true;
    const clave = claveLista;
    const filtros = filtrosLista;
    (async () => {
      try {
        const res = await trabajadoresApi.listar({
          search: busqueda || undefined,
          categoriaPuesto: categoria !== 'Todos' ? categoria : undefined,
          estado: estado !== 'Todos' ? estado : undefined,
          page,
          limit: PAGE_SIZE,
        });
        if (!vigente) return;
        if (res.success) {
          setTrabajadores(res.data.items);
          setPagination(res.data.pagination);
          setFiltrosDatos(filtros);
          setErrorLista(null);
          // Tras dar de baja al último de la última página, esa página ya no existe: se va a la última que sí.
          if (page > res.data.pagination.totalPages) setPage(res.data.pagination.totalPages);
        } else {
          setErrorLista(res.error.message);
        }
      } catch (error) {
        if (vigente) setErrorLista(error instanceof Error ? error.message : 'No se pudo cargar la plantilla.');
      } finally {
        if (vigente) {
          setClaveListaCargada(clave);
          setListaInicial(false);
        }
      }
    })();
    return () => {
      vigente = false;
    };
  }, [claveLista, filtrosLista, busqueda, categoria, estado, page]);

  useEffect(() => {
    if (tab !== 'bitacoras') return;
    let vigente = true;
    const clave = claveBit;
    (async () => {
      try {
        const res = await bitacorasRentaApi.listar({ search: busquedaBit || undefined, page: pageBit, limit: PAGE_SIZE_BITACORAS });
        if (!vigente) return;
        if (res.success) {
          setBitacoras(res.data.items);
          setPaginationBit(res.data.pagination);
          setErrorBit(null);
        } else {
          setErrorBit(res.error.message);
        }
      } catch (error) {
        if (vigente) setErrorBit(error instanceof Error ? error.message : 'No se pudieron cargar las bitácoras.');
      } finally {
        if (vigente) setClaveBitCargada(clave);
      }
    })();
    return () => {
      vigente = false;
    };
  }, [tab, claveBit, busquedaBit, pageBit]);

  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const res = await trabajadoresApi.catalogos();
        if (!vigente) return;
        if (res.success) {
          setCatalogos(res.data);
          setErrorCatalogos(null);
        } else {
          setErrorCatalogos(res.error.message);
        }
      } catch (error) {
        if (vigente) setErrorCatalogos(error instanceof Error ? error.message : 'error de red');
      } finally {
        if (vigente) setCatalogosCargando(false);
      }
    })();
    return () => {
      vigente = false;
    };
  }, [intentoCatalogos]);

  const reintentarCatalogos = () => {
    setCatalogosCargando(true);
    setIntentoCatalogos((n) => n + 1);
  };

  const recargarTodo = () => {
    setRecargaLista((n) => n + 1);
    setRecargaBit((n) => n + 1);
    // Las máquinas cambian de operador al guardar o dar de baja.
    reintentarCatalogos();
  };

  const abrirAlta = () => {
    setEditando(null);
    setFormOpen(true);
  };

  const abrirEdicion = (t: TrabajadorDTO) => {
    setEditando(t);
    setFormOpen(true);
  };

  const abrirLiquidacion = (t: TrabajadorDTO | null) => {
    setLiquidarA(t);
    setLiquidacionOpen(true);
  };

  /** Mesa de ayuda (PR #18 #6): genera el temporal y lo entrega con el modal de credenciales del alta. */
  const confirmarReinicioPin = async () => {
    const t = reinicioPendiente;
    if (!t?.usuarioId) return;
    setReiniciando(true);
    try {
      const res = await authApi.pinReinicio(t.usuarioId);
      if (res.success) {
        setCredenciales({
          nombre: t.nombre,
          telefono: t.telefono,
          numeroEmpleado: t.numeroEmpleado ?? '',
          pinTemporal: res.data.pinTemporal,
          temporalHasta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
        setReinicioPendiente(null);
      } else {
        showToast(mensajeErrorApi(res.error, 'No se pudo reiniciar el PIN.'), 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor. Verifica que la API esté corriendo en :3001/api.', 'error');
    } finally {
      setReiniciando(false);
    }
  };

  /** Desde el concentrado: se trae al operador de la hoja para abrir sus bitácoras. */
  const abrirBitacorasDeHoja = async (b: BitacoraRentaDTO) => {
    if (abriendoBitacorasRef.current) return;
    abriendoBitacorasRef.current = true;
    setAbriendoBitacorasId(b.id);
    try {
      const res = await trabajadoresApi.obtener(b.trabajadorId);
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      setBitacorasDe(res.data);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo abrir el operador.', 'error');
    } finally {
      abriendoBitacorasRef.current = false;
      setAbriendoBitacorasId(null);
    }
  };

  const columnas: Column<TrabajadorDTO>[] = [
    {
      key: 'trabajador',
      header: 'Trabajador',
      render: (t) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-ui-100 text-ui-700 flex items-center justify-center text-[11px] font-bold shrink-0">
            {t.avatar}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ui-900 truncate">{t.nombre}</p>
            <p className="text-xs text-ui-500 truncate">
              {t.puesto}
              {t.maquinaAsignadaId && <span className="xl:hidden"> · {t.maquinaAsignadaId}</span>}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoría',
      className: 'hidden xl:table-cell',
      render: (t) => <span className="block text-sm text-ui-700 truncate max-w-[180px]">{ETIQUETA_CATEGORIA[t.categoriaPuesto] ?? t.categoriaPuesto}</span>,
    },
    {
      key: 'maquina',
      header: 'Máquina',
      className: 'hidden xl:table-cell',
      render: (t) =>
        t.maquinaAsignadaId ? (
          <div className="min-w-0">
            <p className="text-sm text-ui-800 truncate max-w-[220px]">{t.maquinaAsignadaId} · {t.maquinaAsignadaNombre}</p>
            {t.estadoRenta === 'Rentado a Cliente' && t.clienteRentaActual && (
              <p className="text-xs text-ui-500 truncate">Rentada a {t.clienteRentaActual}</p>
            )}
          </div>
        ) : (
          <span className="text-ui-500">—</span>
        ),
    },
    {
      key: 'proyecto',
      header: 'Proyecto',
      className: 'hidden 2xl:table-cell',
      render: (t) =>
        t.proyectos.length > 0 ? (
          <span className="block text-sm text-ui-700 truncate max-w-[180px]">{t.proyectos.join(', ')}</span>
        ) : (
          <span className="text-ui-500">—</span>
        ),
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      className: 'hidden 2xl:table-cell',
      render: (t) => <span className="text-sm text-ui-700 tabular-nums whitespace-nowrap">{t.telefono}</span>,
    },
    {
      key: 'entrada',
      header: 'Entrada',
      align: 'center',
      className: 'hidden min-[1700px]:table-cell',
      render: (t) => <span className="text-sm text-ui-700 tabular-nums">{t.entrada}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (t) => <Badge variant={ESTADO_BADGE[t.estado]?.variant ?? 'neutral'} size="sm">{ESTADO_BADGE[t.estado]?.label ?? t.estado}</Badge>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (t) => (
        // Los clics de estos botones no deben abrir la edición de la fila (editar es tocar la fila).
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          {llevaMaquina(t.categoriaPuesto) && (
            <Button variant="ghost" size="sm" onClick={() => setBitacorasDe(t)}>Bitácoras</Button>
          )}
          {puedeGestionarPin && t.usuarioId && t.numeroEmpleado && (
            <Button variant="ghost" size="sm" onClick={() => setReinicioPendiente(t)}>
              Reiniciar PIN
            </Button>
          )}
          {puedeEliminar && t.estado !== 'Inactivo' && (
            <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400" onClick={() => abrirLiquidacion(t)}>
              Dar de baja
            </Button>
          )}
        </div>
      ),
    },
  ];

  const columnasBitacoras: Column<BitacoraRentaDTO>[] = [
    {
      key: 'folio',
      header: 'Hoja',
      render: (b) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ui-900 whitespace-nowrap">{b.folio}</p>
          <p className="text-xs text-ui-500 whitespace-nowrap">{formatFechaSolo(b.fecha)}</p>
          <p className="md:hidden text-xs text-ui-500 truncate max-w-[160px]">{b.trabajadorNombre}</p>
        </div>
      ),
    },
    {
      key: 'operador',
      header: 'Operador',
      className: 'hidden md:table-cell',
      render: (b) => (
        <div className="min-w-0">
          <p className="text-sm text-ui-900 truncate">{b.trabajadorNombre}</p>
          <p className="text-xs text-ui-500 truncate">{b.maquinaId} · {b.maquinaNombre}</p>
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      className: 'hidden xl:table-cell',
      render: (b) => (
        <div className="min-w-0">
          <p className="text-sm text-ui-800 truncate max-w-[220px]">{b.cliente}</p>
          <p className="text-xs text-ui-500 truncate max-w-[220px]">{b.obraUbicacion}</p>
        </div>
      ),
    },
    {
      key: 'horas',
      header: 'Horas',
      align: 'right',
      className: 'hidden xl:table-cell',
      render: (b) => <span className="text-sm text-ui-700 tabular-nums">{b.horasEfectivas + b.horasExtras} h</span>,
    },
    {
      key: 'importe',
      header: 'Importe',
      align: 'right',
      render: (b) => (
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm font-semibold text-ui-900 tabular-nums whitespace-nowrap">{formatCurrency(b.importeTotalRenta)}</span>
          {/* En celular el estado va aquí, debajo del importe. */}
          <span className="md:hidden">
            <Badge variant={ESTADO_COBRO_BADGE[b.estadoCobro] ?? 'neutral'} size="sm">{b.estadoCobro}</Badge>
          </span>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      className: 'hidden md:table-cell',
      render: (b) => <Badge variant={ESTADO_COBRO_BADGE[b.estadoCobro] ?? 'neutral'} size="sm">{b.estadoCobro}</Badge>,
    },
  ];

  // Mientras carga se dejan las filas anteriores (con el indicador de carga); con error, solo si son de estos filtros.
  const filasVisibles = cargandoLista || filtrosDatos === filtrosLista ? trabajadores : [];
  const datosLista = !errorLista || filasVisibles.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trabajadores"
        subtitle="Plantilla, máquina asignada y bitácoras de renta"
        action={
          puedeCrear || puedeEliminar ? (
            <div className="flex flex-wrap items-center gap-2">
              {puedeEliminar && (
                <Button variant="outline" onClick={() => abrirLiquidacion(null)}>Baja y finiquito</Button>
              )}
              {puedeCrear && <Button onClick={abrirAlta}>Alta de trabajador</Button>}
            </div>
          ) : undefined
        }
      />

      <Tabs
        ariaLabel="Secciones de trabajadores"
        tabs={[
          // Sin número si nunca cargó: un "0" haría creer que no hay nadie.
          { key: 'plantilla', label: 'Plantilla', count: listaInicial || !datosLista ? undefined : pagination.total },
          { key: 'bitacoras', label: 'Bitácoras de renta', count: paginationBit?.total },
        ]}
        value={tab}
        onChange={(k) => setTab(k as 'plantilla' | 'bitacoras')}
      >
        <TabPanel tabKey="plantilla">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 min-w-0">
                <SearchBar
                  value={textoBusqueda}
                  onChange={setTextoBusqueda}
                  onSearch={(v) => {
                    setBusqueda(v.trim());
                    setPage(1);
                  }}
                  placeholder="Buscar por nombre, puesto o cliente de renta..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3 lg:w-[26rem]">
                <Select
                  aria-label="Filtrar por puesto"
                  placeholder="Puesto"
                  value={categoria}
                  onChange={(e) => {
                    setCategoria(e.target.value);
                    setPage(1);
                  }}
                  options={FILTRO_CATEGORIAS.map((c) => ({ value: c.value, label: c.label }))}
                />
                <Select
                  aria-label="Filtrar por estado"
                  placeholder="Estado"
                  value={estado}
                  onChange={(e) => {
                    setEstado(e.target.value);
                    setPage(1);
                  }}
                  options={FILTRO_ESTADOS}
                />
              </div>
            </div>

            {errorLista && (
              <Aviso
                titulo="No se pudo cargar la plantilla."
                detalle={filasVisibles.length > 0 ? `${errorLista} Se muestran los datos de la última carga correcta.` : errorLista}
                onReintentar={() => setRecargaLista((n) => n + 1)}
                reintentando={cargandoLista}
              />
            )}

            {listaInicial ? (
              <LoadingState text="Cargando trabajadores..." size="lg" />
            ) : (
              <>
                <DataTable
                  headerVariant="neutral"
                  columns={columnas}
                  data={filasVisibles}
                  loading={cargandoLista}
                  keyExtractor={(t) => t.id}
                  // Ya va paginada (12 por página): sin tope de alto, para no meter un scroll dentro de la página.
                  maxBodyHeight="none"
                  onRowClick={puedeEditar ? abrirEdicion : undefined}
                  emptyText={!datosLista
                    ? 'No se pudo cargar la plantilla.'
                    : busqueda || categoria !== 'Todos' || estado !== 'Todos'
                      ? 'Nadie coincide con la búsqueda o los filtros.'
                      : 'Todavía no hay trabajadores dados de alta.'}
                />
                {filasVisibles.length > 0 && pagination.totalPages > 1 && (
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalRecords={pagination.total}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                  />
                )}
                {puedeEditar && filasVisibles.length > 0 && (
                  <p className="text-xs text-ui-500">Toca un trabajador para editar sus datos.</p>
                )}
              </>
            )}
          </div>
        </TabPanel>

        <TabPanel tabKey="bitacoras">
          <div className="space-y-4">
            <SearchBar
              value={textoBusquedaBit}
              onChange={setTextoBusquedaBit}
              onSearch={(v) => {
                setBusquedaBit(v.trim());
                setPageBit(1);
              }}
              placeholder="Buscar por folio, cliente u operador..."
            />

            {errorBit && (
              <Aviso
                titulo="No se pudieron cargar las bitácoras."
                detalle={errorBit}
                onReintentar={() => setRecargaBit((n) => n + 1)}
                reintentando={cargandoBit}
              />
            )}

            <DataTable
              headerVariant="neutral"
              columns={columnasBitacoras}
              data={bitacoras}
              loading={cargandoBit || abriendoBitacorasId !== null}
              keyExtractor={(b) => b.id}
              maxBodyHeight="none"
              onRowClick={abrirBitacorasDeHoja}
              emptyText={errorBit && bitacoras.length === 0
                ? 'No se pudieron cargar las bitácoras.'
                : busquedaBit
                  ? 'Ninguna hoja coincide con la búsqueda.'
                  : 'Todavía no hay hojas de bitácora.'}
            />
            {paginationBit && paginationBit.totalPages > 1 && (
              <Pagination
                currentPage={paginationBit.page}
                totalPages={paginationBit.totalPages}
                totalRecords={paginationBit.total}
                pageSize={PAGE_SIZE_BITACORAS}
                onPageChange={setPageBit}
              />
            )}
            {bitacoras.length > 0 && (
              <p className="text-xs text-ui-500">Toca una hoja para ver las de su operador, registrar la firma o facturarla.</p>
            )}
          </div>
        </TabPanel>
      </Tabs>

      {formOpen && (
        <TrabajadorFormModal
          trabajador={editando}
          catalogos={catalogos}
          catalogosCargando={catalogosCargando}
          errorCatalogos={errorCatalogos}
          onReintentarCatalogos={reintentarCatalogos}
          onClose={() => setFormOpen(false)}
          onGuardado={(t, identidad) => {
            setFormOpen(false);
            recargarTodo();
            if (identidad) {
              setCredenciales({
                nombre: t.nombre,
                telefono: t.telefono,
                numeroEmpleado: identidad.numeroEmpleado,
                pinTemporal: identidad.pinTemporal,
                temporalHasta: identidad.temporalHasta,
              });
            }
          }}
        />
      )}

      {credenciales && (
        <CredencialesAccesoModal credenciales={credenciales} onClose={() => setCredenciales(null)} />
      )}

      {reinicioPendiente && (
        <Modal open onClose={() => setReinicioPendiente(null)} size="sm" persistent>
          <ModalHeader
            title="Reiniciar PIN"
            subtitle={reinicioPendiente.nombre}
            onClose={() => setReinicioPendiente(null)}
          />
          <ModalBody className="space-y-3">
            <p className="text-sm text-ui-700">
              Se generará un <strong>PIN temporal de 24 horas</strong> y se cerrarán{' '}
              <strong>todas sus sesiones activas</strong>. El PIN se muestra una sola vez.
            </p>
            <p className="text-xs text-ui-500">
              Envíalo por WhatsApp o cópialo: el trabajador entra con su número + el temporal y la
              app le pedirá crear su propio PIN.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setReinicioPendiente(null)} disabled={reiniciando}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirmarReinicioPin} loading={reiniciando}>
              Generar temporal
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {bitacorasDe && (
        <BitacorasRentaModal
          trabajador={bitacorasDe}
          maquinas={errorCatalogos ? null : catalogos?.maquinas ?? null}
          catalogosCargando={catalogosCargando}
          errorCatalogos={errorCatalogos}
          onReintentarCatalogos={reintentarCatalogos}
          puedeCrear={puedeCrear}
          puedeEditar={puedeEditar}
          onClose={() => setBitacorasDe(null)}
          onCambio={() => setRecargaBit((n) => n + 1)}
        />
      )}

      {liquidacionOpen && (
        <LiquidacionModal
          trabajador={liquidarA}
          onClose={() => setLiquidacionOpen(false)}
          onLiquidado={recargarTodo}
        />
      )}
    </div>
  );
}
