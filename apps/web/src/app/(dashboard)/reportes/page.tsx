"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClipboardCheck, Clock, ShieldAlert, CheckCircle2,
  Plus, Pencil, Trash2, Eye, X, AlertCircle, Check, SlidersHorizontal,
  UserCheck, UserX, ImagePlus, MessageSquarePlus, ImageOff,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { FormModal, ModalField, modalInputClass, modalSelectClass, modalTextareaClass } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Tooltip } from '@/components/ui/Tooltip';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import {
  proyectosApi,
  reportesCampoApi,
  trabajadoresApi,
  type ReporteCampoDTO,
  type ReportesIncidenteDetalle,
  type ReportesCampoStats,
  type ReporteCampoCreateInput,
  type SubcategoriaDTO,
  type EstadoIncidenteApi,
  type PrioridadReporteApi,
  type CategoriaReporteApi,
  type AdjuntoDTO,
  type TrabajadorDTO,
} from '@/lib/api';
import { RefreshOverlay } from '@/components/ui/RefreshOverlay';
import { mensajeErrorApi } from '@/lib/api';

// ── Constantes ──
const PAGE_SIZE = 10;
const VISTA_RUTA = '/reportes';

const ESTADOS_FILTRO: { value: EstadoIncidenteApi; label: string }[] = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'EN_CURSO', label: 'En curso' },
  { value: 'CERRADO', label: 'Cerrado' },
];

const PRIORIDADES: { value: PrioridadReporteApi; label: string }[] = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' },
];

/** Categoría responsable — el área a la que se ENVÍA el incidente. */
const CATEGORIAS: { value: CategoriaReporteApi; label: string }[] = [
  { value: 'MECANICO', label: 'Mecanico' },
  { value: 'SOLDADOR', label: 'Soldador' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'RESIDENTE', label: 'Residente' },
];

/** Opción especial: el incidente queda dentro del área del que lo levanta. */
const MISMA_AREA = 'MISMA_AREA';

/**
 * Convierte cualquier imagen (image/*) a WebP con canvas (calidad 0.85) para
 * que pesen menos. Devuelve el data URI WebP + su tamaño, o null si el navegador
 * no pudo decodificar/convertir (formato ajeno al canvas, p.ej. HEIC viejo).
 */
async function convertirAWebp(
  file: File,
): Promise<{ dataUrl: string; tamano: number } | null> {
  try {
    const dataUrlSrc = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error());
      reader.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error());
      image.src = dataUrlSrc;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.85),
    );
    if (!blob) return null;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error());
      reader.readAsDataURL(blob);
    });
    return { dataUrl, tamano: blob.size };
  } catch {
    return null;
  }
}

const STATS_CERO: ReportesCampoStats = {
  nuevos: 0,
  enCurso: 0,
  cerrados: 0,
  criticosActivos: 0,
  porArea: {},
};

const emptyForm = {
  categoria: '' as '' | CategoriaReporteApi | typeof MISMA_AREA,
  subcategoriaId: '',
  ubicacionModo: '' as '' | 'proyecto' | 'gps',
  proyectoId: '',
  prioridad: '' as '' | PrioridadReporteApi,
  descripcion: '',
};

/** Límites de imagen idénticos al detalle (backend los revalida). */
const MAX_IMAGENES = 4;
const MAX_TAMANO_IMAGEN = 2 * 1024 * 1024; // 2 MB

/** Imagen en espera durante el alta (base64; el server aún no conoce el folio). */
interface AdjuntoImagenAlta {
  key: string;
  nombre: string;
  mime: string;
  tamano: number;
  /** base64 puro; llega por FileReader — se muestra cuando ya cargó. */
  datos: string;
}

export default function ReportesOperacionesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === VISTA_RUTA);
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Estado de datos ──
  const [reportes, setReportes] = useState<ReporteCampoDTO[]>([]);
  const [stats, setStats] = useState<ReportesCampoStats>(STATS_CERO);
  const [subcategorias, setSubcategorias] = useState<SubcategoriaDTO[]>([]);
  const [proyectos, setProyectos] = useState<{ id: string; nombre: string }[]>([]);
  const [trabajadores, setTrabajadores] = useState<TrabajadorDTO[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  // ── Estado de búsqueda y filtros ──
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // ── Estado de modales ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [asignarOpen, setAsignarOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleCargando, setDetalleCargando] = useState(false);
  const [detalle, setDetalle] = useState<ReportesIncidenteDetalle | null>(null);
  const [cerrarOpen, setCerrarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReporteCampoDTO | null>(null);
  const [asignarItem, setAsignarItem] = useState<ReporteCampoDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [asignarForm, setAsignarForm] = useState({ asignadoA: '', asignadoNombre: '' });
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [comentando, setComentando] = useState(false);
  const [adjuntando, setAdjuntando] = useState(false);
  const [aceptando, setAceptando] = useState(false);
  /** Imágenes en espera del alta (mismos límites del detalle: máx 4, 2MB). */
  const [imagenesAlta, setImagenesAlta] = useState<AdjuntoImagenAlta[]>([]);
  /** Adjuntos existentes en el modal Editar (null = cargando). */
  const [editAdjuntos, setEditAdjuntos] = useState<AdjuntoDTO[] | null>(null);

  // ── Cargar subcategorías, proyectos EN_PROCESO y trabajadores (una sola vez) ──
  useEffect(() => {
    reportesCampoApi.subcategorias().then((res) => {
      if (res.success && res.data) {
        setSubcategorias(res.data);
      }
    });
    proyectosApi.listar({ estado: 'EN_PROCESO', limit: 100 }).then((res) => {
      if (res.success && res.data) {
        setProyectos(res.data.items.map((p) => ({ id: p.id, nombre: p.nombre })));
      }
    });
    trabajadoresApi.listar({ limit: 100 }).then((res) => {
      if (res.success && res.data) {
        setTrabajadores(res.data.items);
      }
    });
  }, []);

  // ── Cargar datos ──
  const fetchData = useCallback(async (page = 1, searchVal?: string, filters?: Record<string, string>) => {
    if (!hasLoaded.current) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await reportesCampoApi.listar({
        search: searchVal || undefined,
        estado: (filters?.estado as EstadoIncidenteApi) || undefined,
        prioridad: (filters?.prioridad as PrioridadReporteApi) || undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setReportes(res.data.items);
        setPagination(res.data.pagination);
      } else {
        showToast('Error al cargar los incidentes.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      hasLoaded.current = true;
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  const fetchStats = useCallback(async () => {
    const res = await reportesCampoApi.stats();
    if (res.success && res.data) {
      setStats(res.data);
    }
  }, []);

  useEffect(() => {
    const inicial = async () => {
      try {
        await Promise.all([fetchData(1), fetchStats()]);
      } catch {
        /* manejo de error delegado a cada fetch */
      }
    };
    inicial();
  }, [fetchData, fetchStats]);

  // ── Filtros activos (chips) ──
  const activeFilters: ActiveFilter[] = [];
  if (filterValues.estado) {
    const label = ESTADOS_FILTRO.find((e) => e.value === filterValues.estado)?.label ?? filterValues.estado;
    activeFilters.push({ key: 'estado', label: 'Estado', value: label });
  }
  if (filterValues.prioridad) {
    const label = PRIORIDADES.find((p) => p.value === filterValues.prioridad)?.label ?? filterValues.prioridad;
    activeFilters.push({ key: 'prioridad', label: 'Prioridad', value: label });
  }

  const filterFields: FilterField[] = [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: ESTADOS_FILTRO.map((e) => ({ value: e.value, label: e.label })),
      placeholder: 'Todos',
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      type: 'select',
      options: PRIORIDADES.map((p) => ({ value: p.value, label: p.label })),
      placeholder: 'Todas',
    },
  ];

  const refetch = useCallback(
    (page?: number) => fetchData(page ?? pagination.page, search, filterValues),
    [fetchData, pagination.page, search, filterValues],
  );

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);

  const handleSearch = useCallback(() => {
    fetchData(1, search, filterValues);
  }, [fetchData, search, filterValues]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
      fetchData(1, search, { ...filterValues, [key]: value });
    },
    [fetchData, search, filterValues],
  );

  const handleRemoveFilter = useCallback(
    (key: string) => {
      const next = { ...filterValues };
      delete next[key];
      setFilterValues(next);
      fetchData(1, search, next);
    },
    [fetchData, search, filterValues],
  );

  const handleClearFilters = useCallback(() => {
    setFilterValues({});
    fetchData(1, search, {});
  }, [fetchData, search]);

  const handlePageChange = useCallback(
    (page: number) => fetchData(page, search, filterValues),
    [fetchData, search, filterValues],
  );

  // ── Handlers de modales ──
  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setImagenesAlta([]);
    setCreateOpen(true);
  }, []);

  /** En pantalla de alta: convierte a WebP y apila la imagen (base64; límites idénticos al detalle). */
  const handleAltaImagen = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        showToast('El archivo debe ser una imagen.', 'error');
        return;
      }
      const webp = await convertirAWebp(file);
      if (!webp) {
        showToast('No se pudo procesar la imagen (formato no soportado por el navegador).', 'error');
        return;
      }
      if (webp.tamano > MAX_TAMANO_IMAGEN) {
        showToast('La imagen excede el máximo de 2 MB.', 'error');
        return;
      }
      setImagenesAlta((prev) => {
        if (prev.length >= MAX_IMAGENES) {
          showToast(`Máximo ${MAX_IMAGENES} imágenes por incidente.`, 'error');
          return prev;
        }
        return [...prev, {
          // crypto.randomUUID no existe fuera de HTTPS — key local sin dependencia
          key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          nombre: `${file.name.replace(/\.[^.]+$/, '')}.webp`,
          mime: 'image/webp',
          tamano: webp.tamano,
          datos: webp.dataUrl.substring(webp.dataUrl.indexOf(',') + 1),
        }];
      });
    },
    [showToast],
  );

  const quitarImagenAlta = useCallback(
    (key: string) => setImagenesAlta((prev) => prev.filter((img) => img.key !== key)),
    [],
  );

  const openDetalle = useCallback(
    (item: ReporteCampoDTO) => {
      setDetalleOpen(true);
      setDetalleCargando(true);
      setComentarioTexto('');
      setDetalle(null);
      reportesCampoApi
        .detalle(item.id)
        .then((res) => {
          if (!res.success) {
            showToast(mensajeErrorApi(res.error, 'Error al cargar el incidente.'), 'error');
            setDetalleOpen(false);
            return;
          }
          setDetalle(res.data);
        })
        .catch(() => {
          showToast('No se pudo conectar con el servidor.', 'error');
          setDetalleOpen(false);
        })
        .finally(() => setDetalleCargando(false));
    },
    [showToast],
  );

  const openEdit = useCallback(
    (item: ReporteCampoDTO) => {
      if (item.estado === 'Cerrado') {
        showToast('Un incidente Cerrado no puede editarse.', 'error');
        return;
      }
      setSelectedItem(item);
      setForm({
        categoria: (CATEGORIAS.find((c) => c.label === item.categoria)?.value ?? '') as '' | CategoriaReporteApi,
        subcategoriaId: item.subcategoriaId ?? '',
        // ubicación preseleccionada: proyecto (ligado) o GPS ya capturadas; sin datos → proyecto
        ubicacionModo: (item.proyectoId ? 'proyecto' : item.latitud != null ? 'gps' : 'proyecto') as
          'proyecto'
          | 'gps',
        proyectoId: item.proyectoId ?? '',
        prioridad: (PRIORIDADES.find((p) => p.label === item.prioridad)?.value ?? '') as '' | PrioridadReporteApi,
        descripcion: item.descripcion,
      });
      setEditAdjuntos(null);
      setEditOpen(true);
      reportesCampoApi.detalle(item.id).then((res) => {
        if (res.success) setEditAdjuntos(res.data.adjuntos);
      });
    },
    [showToast],
  );

  const openDelete = useCallback((item: ReporteCampoDTO) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  const openAsignar = useCallback((item: ReporteCampoDTO) => {
    setAsignarItem(item);
    setAsignarForm({
      asignadoA: item.asignadoAId ?? '',
      asignadoNombre: item.asignadoAId ? '' : item.asignadoANombre ?? '',
    });
    setAsignarOpen(true);
  }, []);

  // ── Validación ──
  const validateForm = useCallback(() => {
    if (!form.categoria) {
      showToast('Selecciona el área a la que se envía el incidente.', 'error');
      return false;
    }
    if (form.ubicacionModo === 'proyecto' && !form.proyectoId) {
      showToast('Selecciona el proyecto en proceso para la ubicación.', 'error');
      return false;
    }
    if (!form.descripcion.trim()) {
      showToast('La descripción del reporte es obligatoria.', 'error');
      return false;
    }
    return true;
  }, [form, showToast]);

  // ── CRUD via API ──
  /** "Quién reporta" = el usuario autenticado (no se captura a mano). */
  const nombreReporta = useCallback((): string => {
    const persona = user?.persona;
    const nombre = [persona?.nombre, persona?.apellidoPaterno, persona?.apellidoMaterno]
      .filter(Boolean)
      .join(' ')
      .trim();
    return nombre || user?.email?.split('@')[0] || 'Usuario';
  }, [user]);

  /** Torre destino ("misma área"/torre) + Ubicación: proyecto en proceso o GPS. */
  const buildPayload = useCallback(
    async (): Promise<ReporteCampoCreateInput> => {
      const mismaArea = form.categoria === MISMA_AREA;
      const ubicacion: Partial<ReporteCampoCreateInput> = {};
      if (form.ubicacionModo === 'proyecto' && form.proyectoId) {
        ubicacion.proyectoId = form.proyectoId;
      } else if (form.ubicacionModo === 'gps') {
        // ubicación actual del dispositivo — guardado con lat/long
        const coords = await new Promise<GeolocationPosition | null>((resolve) =>
          navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
            enableHighAccuracy: true,
            timeout: 10000,
          }),
        );
        if (!coords) {
          showToast('No se pudo obtener tu ubicación GPS.', 'error');
          throw Object.assign(new Error('gps'), { gpsFallo: true });
        }
        ubicacion.latitud = coords.coords.latitude;
        ubicacion.longitud = coords.coords.longitude;
      }
      return {
        mismaArea,
        ...(mismaArea ? {} : { categoria: form.categoria as CategoriaReporteApi }),
        subcategoriaId: mismaArea ? undefined : form.subcategoriaId || undefined,
        ...ubicacion,
        usuario: nombreReporta(),
        descripcion: form.descripcion.trim(),
        prioridad: form.prioridad || undefined,
      };
    },
    [form, nombreReporta, showToast],
  );

  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = await buildPayload();
      const res = await reportesCampoApi.crear(payload);
      if (!res.success) {
        showToast(mensajeErrorApi(res.error, 'Error al registrar el incidente.'), 'error');
        return;
      }

      // 1) incidente nacido con su folio; 2) imágenes del alta, en secuencia.
      // Si una falla, el incidente queda y la imagen se repite desde el detalle.
      const nuevo = res.data;
      const fallidas: string[] = [];
      for (const img of imagenesAlta) {
        if (!img.datos) continue;
        const resAdj = await reportesCampoApi.adjuntar(nuevo.id, {
          nombre: img.nombre,
          mime: img.mime,
          tamano: img.tamano,
          datos: img.datos,
        });
        if (!resAdj.success) fallidas.push(img.nombre);
      }
      if (fallidas.length === 0) {
        showToast('Incidente registrado exitosamente.', 'success');
      } else {
        showToast(
          `Incidente creado, pero ${fallidas.length} imagen(es) no se subieron (${fallidas.join(', ')}). Súbelas desde el detalle.`,
          'error',
        );
      }
      setCreateOpen(false);
      setForm(emptyForm);
      setImagenesAlta([]);
      refetch(1);
      fetchStats();
    } catch (e) {
      if ((e as { gpsFallo?: boolean })?.gpsFallo) {
        showToast('Ubica el incidente por proyecto o activa el GPS y reintenta.', 'error');
      } else {
        showToast('Error de conexión al registrar el incidente.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, buildPayload, showToast, refetch, fetchStats, imagenesAlta]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem || !validateForm()) return;
    setSubmitting(true);
    try {
      const payload = await buildPayload();
      const res = await reportesCampoApi.actualizar(selectedItem.id, payload);
      if (res.success) {
        showToast('Incidente actualizado exitosamente.', 'success');
        setEditOpen(false);
        setSelectedItem(null);
        setForm(emptyForm);
        refetch();
        fetchStats();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al actualizar el incidente.'), 'error');
      }
    } catch (e) {
      if ((e as { gpsFallo?: boolean })?.gpsFallo) {
        showToast('No se pudo obtener tu ubicación GPS. Reintenta o usa proyecto.', 'error');
      } else {
        showToast('Error de conexión al actualizar el incidente.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, validateForm, buildPayload, showToast, refetch, fetchStats]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await reportesCampoApi.eliminar(selectedItem.id);
      if (res.success) {
        showToast('Incidente eliminado exitosamente.', 'success');
        setDeleteOpen(false);
        setSelectedItem(null);
        refetch();
        fetchStats();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al eliminar el incidente.'), 'error');
      }
    } catch {
      showToast('Error de conexión al eliminar el incidente.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast, refetch, fetchStats]);

  // ── ASIGNAR "quién le cae" (persona de la torre) ──
  const handleAsignar = useCallback(async () => {
    if (!asignarItem) return;
    if (!asignarForm.asignadoA && !asignarForm.asignadoNombre.trim()) {
      showToast('Asigna un trabajador o un nombre.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await reportesCampoApi.asignar(asignarItem.id, {
        asignadoA: asignarForm.asignadoA || null,
        asignadoNombre: asignarForm.asignadoA ? null : asignarForm.asignadoNombre.trim(),
      });
      if (res.success) {
        showToast('Responsable asignado exitosamente.', 'success');
        setAsignarOpen(false);
        setAsignarItem(null);
        refetch();
        // si el detalle está abierto sobre el mismo incidente, refrescarlo
        if (detalleOpen && detalle?.reporte.id === asignarItem.id) {
          openDetalle(asignarItem);
        }
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al asignar.'), 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [asignarItem, asignarForm, showToast, refetch, detalleOpen, detalle, openDetalle]);

  // ── Flujo de estados: Iniciar / Cerrar (desde el detalle) ──
  /** ACEPTAR — el responsable queda con el nombre de quien acepta (carrier/auditoría server-side). */
  const handleAceptar = useCallback(
    async (item: ReporteCampoDTO) => {
      const res = await reportesCampoApi.aceptar(item.id);
      if (res.success) {
        showToast(
          `Incidente aceptado — RESPONSABLE: ${res.data.asignadoANombre ?? ''}`.trim(),
          'success',
        );
        openDetalle(item);
        refetch();
        fetchStats();
      } else {
        showToast(mensajeErrorApi(res.error, 'No se pudo aceptar el incidente.'), 'error');
        refetch();
      }
    },
    [showToast, refetch, fetchStats, openDetalle],
  );

  /** Aceptar dentro del detalle (misma ruta, refresca el detalle). */
  const aceptarDetalle = useCallback(
    async (item: ReporteCampoDTO) => {
      if (!item) return;
      setAceptando(true);
      const res = await reportesCampoApi.aceptar(item.id);
      setAceptando(false);
      if (res.success) {
        showToast(
          `Incidente aceptado — RESPONSABLE: ${res.data.asignadoANombre ?? ''}`.trim(),
          'success',
        );
        openDetalle(item);
        refetch();
        fetchStats();
      } else {
        showToast(mensajeErrorApi(res.error, 'No se pudo aceptar el incidente.'), 'error');
      }
    },
    [showToast, refetch, fetchStats, openDetalle],
  );

  const iniciarIncidente = useCallback(
    async (item: ReporteCampoDTO) => {
      const res = await reportesCampoApi.cambiarEstado(item.id, 'EN_CURSO');
      if (res.success) {
        showToast('Incidente en curso.', 'success');
        openDetalle(item);
        refetch();
        fetchStats();
      } else {
        showToast(mensajeErrorApi(res.error, 'No se pudo iniciar el incidente.'), 'error');
      }
    },
    [showToast, refetch, fetchStats, openDetalle],
  );

  const handleCerrarConfirm = useCallback(async () => {
    if (!detalle) return;
    setSubmitting(true);
    try {
      const res = await reportesCampoApi.cambiarEstado(detalle.reporte.id, 'CERRADO');
      if (res.success) {
        showToast('Incidente cerrado.', 'success');
        setCerrarOpen(false);
        const id = detalle.reporte.id;
        openDetalle({ ...detalle.reporte, id });
        refetch();
        fetchStats();
      } else {
        showToast(mensajeErrorApi(res.error, 'No se pudo cerrar el incidente.'), 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [detalle, showToast, refetch, fetchStats, openDetalle]);

  // ── Actividades (comentarios del detalle) ──
  const handleComentar = useCallback(async () => {
    if (!detalle || !comentarioTexto.trim()) {
      showToast('Escribe el comentario antes de publicar.', 'error');
      return;
    }
    setComentando(true);
    try {
      const res = await reportesCampoApi.comentar(detalle.reporte.id, comentarioTexto.trim());
      if (res.success) {
        setComentarioTexto('');
        openDetalle({ ...detalle.reporte });
      } else {
        showToast(mensajeErrorApi(res.error, 'No se pudo publicar el comentario.'), 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setComentando(false);
    }
  }, [detalle, comentarioTexto, showToast, openDetalle]);

  /** Sube una imagen (convertida a WebP) a un incidente; devuelve el adjunto o null. */
  const subirAdjunto = useCallback(
    async (reporteId: string, file: File): Promise<AdjuntoDTO | null> => {
      if (!file.type.startsWith('image/')) {
        showToast('El archivo debe ser una imagen.', 'error');
        return null;
      }
      const webp = await convertirAWebp(file);
      if (!webp) {
        showToast('No se pudo procesar la imagen (formato no soportado por el navegador).', 'error');
        return null;
      }
      if (webp.tamano > MAX_TAMANO_IMAGEN) {
        showToast('La imagen excede el máximo de 2 MB.', 'error');
        return null;
      }
      try {
        const res = await reportesCampoApi.adjuntar(reporteId, {
          nombre: `${file.name.replace(/\.[^.]+$/, '')}.webp`,
          mime: 'image/webp',
          tamano: webp.tamano,
          datos: webp.dataUrl.substring(webp.dataUrl.indexOf(',') + 1),
        });
        if (!res.success) {
          showToast(mensajeErrorApi(res.error, 'No se pudo adjuntar la imagen.'), 'error');
          return null;
        }
        return res.data;
      } catch {
        showToast('No se pudo conectar con el servidor.', 'error');
        return null;
      }
    },
    [showToast],
  );

  const handleAdjuntar = useCallback(
    async (file: File) => {
      if (!detalle) return;
      setAdjuntando(true);
      const adj = await subirAdjunto(detalle.reporte.id, file);
      setAdjuntando(false);
      if (adj) {
        showToast('Imagen adjuntada exitosamente.', 'success');
        openDetalle({ ...detalle.reporte });
      }
    },
    [detalle, subirAdjunto, showToast, openDetalle],
  );

  /** Sube imagen desde el modal Editar y agrega la miniatura ya cargada. */
  const handleAdjuntarEnEdicion = useCallback(
    async (file: File) => {
      if (!selectedItem) return;
      setAdjuntando(true);
      const adj = await subirAdjunto(selectedItem.id, file);
      setAdjuntando(false);
      if (adj) {
        showToast('Imagen adjuntada exitosamente.', 'success');
        setEditAdjuntos((prev) => [...(prev ?? []), adj]);
      }
    },
    [selectedItem, subirAdjunto, showToast],
  );

  // ── Columnas de la tabla (flujo incidentes v2) ──
  const columns: Column<ReporteCampoDTO>[] = [
    {
      key: 'codigo',
      header: 'ID',
      minWidth: '85px',
      render: (report) =>
        report.codigo ? (
          <span className="font-black text-ui-900 tracking-tight">{report.codigo}</span>
        ) : (
          <span className="text-ui-300">—</span>
        ),
    },
    {
      key: 'fechaHora',
      header: 'Fecha',
      minWidth: '105px',
      render: (report) => (
        <div>
          <span className="flex items-center gap-1.5 font-black text-ui-800">
            <Clock className="w-3 h-3 text-ui-400" />
            {report.hora}
          </span>
          <span className="text-[10px] font-bold text-ui-400">{report.fecha}</span>
        </div>
      ),
    },
    {
      key: 'usuario',
      header: 'Reporta',
      minWidth: '130px',
      render: (report) => <span className="font-black text-ui-900">{report.usuario}</span>,
    },
    {
      key: 'ubicacion',
      header: 'Área',
      minWidth: '140px',
      render: (report) =>
        report.categoria ? (
          <span className="text-xs font-semibold text-ui-700">{report.categoria}</span>
        ) : (
          <span className="text-ui-300">Sin área</span>
        ),
    },
    {
      key: 'prioridad',
      header: 'Prior.',
      minWidth: '90px',
      render: (report) =>
        report.prioridad ? (
          <span className="text-xs font-semibold text-ui-700">{report.prioridad}</span>
        ) : (
          <span className="text-ui-300">—</span>
        ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (report) => (
        <span className="text-xs font-semibold text-ui-700">{report.estado}</span>
      ),
    },
    {
      key: 'responsable',
      header: 'Responsable',
      minWidth: '150px',
      render: (report) => {
        if (report.cerradoEn) {
          return (
            <span className="text-xs font-semibold text-ui-700">
              {report.asignadoANombre ?? 'Cerrado'}
            </span>
          );
        }
        if (report.asignadoANombre) {
          return (
            <span className="text-xs font-semibold text-ui-700">
              {report.asignadoANombre}
            </span>
          );
        }
        return <span className="text-ui-300">Sin asignar</span>;
      },
    },
    {
      key: 'subcategoria',
      header: 'Subcategoría',
      minWidth: '140px',
      render: (report) =>
        report.subcategoria ? (
          <span className="text-xs font-semibold text-ui-600">{report.subcategoria}</span>
        ) : (
          <span className="text-ui-300">—</span>
        ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      minWidth: '380px',
      className: 'max-w-sm',
      render: (report) => (
        // puntos suspensivos al llegar al ancho de la columna (texto completo en el tooltip y el detalle)
        <div className="max-w-sm min-w-0">
          <Tooltip placement="top" content={report.descripcion} maxWidth={480}>
            <span className="block truncate font-medium text-ui-600">
              &ldquo;{report.descripcion}&rdquo;
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      minWidth: '240px',
      render: (report) => (
        <div className="flex items-center justify-end gap-1.5">
          <Tooltip content="Ver incidente">
            <Button
              variant="info"
              size="sm"
              aria-label="Ver incidente"
              icon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => openDetalle(report)}
            >
              Ver
            </Button>
          </Tooltip>
          {puedeEditar && report.estado !== 'Cerrado' && (
            <Tooltip content="Editar el incidente">
              <Button
                variant="warning"
                size="sm"
                aria-label="Editar"
                icon={<Pencil className="w-3.5 h-3.5" />}
                onClick={() => openEdit(report)}
              >
                Editar
              </Button>
            </Tooltip>
          )}
          {puedeEditar && report.estado === 'Nuevo' && !report.asignadoANombre && (
            <Tooltip content="Aceptar el incidente — RESPONSABLE: tú">
              <Button
                variant="success"
                size="sm"
                aria-label="Aceptar incidente"
                icon={<Check className="w-3.5 h-3.5" />}
                onClick={() => handleAceptar(report)}
              >
                Aceptar
              </Button>
            </Tooltip>
          )}
          {puedeEliminar && (
            <Tooltip content="Eliminar incidente">
              <Button
                variant="danger"
                size="sm"
                aria-label="Eliminar"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => openDelete(report)}
              >
                Eliminar
              </Button>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  // ── Subcategorías dependientes del área destino ("misma área" usa la torre del usuario) ──
  const torreDelUsuario = CATEGORIAS.find((c) => c.value === user?.torre)?.label ?? 'Administrativo';
  const categoriaLabel =
    form.categoria === MISMA_AREA
      ? torreDelUsuario
      : CATEGORIAS.find((c) => c.value === form.categoria)?.label;
  const subcategoriasFiltradas = subcategorias.filter((s) => !!categoriaLabel && s.categoria === categoriaLabel);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Reportes"
        subtitle="Incidentes, mecánicos, administrativos y demás áreas — con responsable asignado."
        action={
          puedeCrear ? (
            <Button
              skeleton={initialLoading}
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={openCreate}
            >
              Nuevo Reporte
            </Button>
          ) : undefined
        }
      />

      {/* StatsCards — por estado del incidente */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={<Plus size={22} />}
          value={stats.nuevos}
          label="Nuevos"
          color={stats.nuevos > 0 ? 'warning' : 'neutral'}
          loading={initialLoading}
        />
        <StatsCard
          icon={<ClipboardCheck size={22} />}
          value={stats.enCurso}
          label="En curso"
          color={stats.enCurso > 0 ? 'primary' : 'neutral'}
          loading={initialLoading}
        />
        <StatsCard
          icon={<CheckCircle2 size={22} />}
          value={stats.cerrados}
          label="Cerrados"
          color="success"
          loading={initialLoading}
        />
        <StatsCard
          icon={<ShieldAlert size={22} />}
          value={stats.criticosActivos}
          label="Críticos activos"
          color={stats.criticosActivos > 0 ? 'error' : 'neutral'}
          loading={initialLoading}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar por usuario, obra o descripción..."
          className="flex-1"
        />
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="md"
          icon={<SlidersHorizontal className="w-4 h-4" />}
          onClick={() => setShowFilters((prev) => !prev)}
          className="shrink-0 whitespace-nowrap"
        >
          <span className="whitespace-nowrap">Filtros</span>
          {activeFilters.length > 0 && (
            <span className="ml-1 inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-full bg-surface/20 text-[10px] font-bold">
              {activeFilters.length}
            </span>
          )}
        </Button>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
            >
              <span className="font-normal text-primary/70">{filter.label}:</span>
              <span>{filter.value}</span>
              <button
                onClick={() => handleRemoveFilter(filter.key)}
                className="ml-0.5 hover:text-primary-dark transition-colors"
                aria-label={`Eliminar filtro ${filter.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {activeFilters.length > 1 && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-ui-500 hover:text-red-600 transition-colors ml-1"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}

      {showFilters && (
        <div className="bg-ui-50 border border-ui-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            {filterFields.map((filter) => (
              <div key={filter.key} className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] font-black text-ui-500 uppercase tracking-widest">
                  {filter.label}
                </label>
                <select
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="h-10 px-3 border border-ui-200 rounded-lg text-xs font-medium bg-surface text-ui-900 focus:outline-none focus:border-primary/50"
                >
                  <option value="">{filter.placeholder || 'Todos'}</option>
                  {filter.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de incidentes */}
      <div className="relative">
        <RefreshOverlay show={refreshing && !initialLoading} />

        <DataTable
          columns={columns}
          data={reportes}
          keyExtractor={(report) => report.id}
          loading={initialLoading}
          emptyText="No hay incidentes con estos filtros"
        />
      </div>

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalRecords={pagination.total}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />

      {/* ═══════════════════════════════════════════
          MODALES
          ═══════════════════════════════════════════ */}

      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCancel={() => setCreateOpen(false)}
        title="Nuevo Reporte"
        subtitle="Registra un incidente o actividad desde campo — elegir categoría decide quién lo atiende."
        submitLabel="Registrar Reporte"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField
            label="Área (a la que se envía)"
            required
            hint={
              form.categoria === MISMA_AREA
                ? `Tu área: ${torreDelUsuario} — el incidente queda ahí.`
                : 'Misma área deja el incidente con tu propia área; otra torre lo envía allá.'
            }
          >
            <select
              className={modalSelectClass}
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value as '' | CategoriaReporteApi | typeof MISMA_AREA, subcategoriaId: '' })}
            >
              <option value="">Seleccionar área destino...</option>
              <option value={MISMA_AREA}>Misma área (tu área: {torreDelUsuario})</option>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Subcategoría" hint="Opcional — según el área destino.">
            <select
              className={modalSelectClass}
              value={form.subcategoriaId}
              onChange={(e) => setForm({ ...form, subcategoriaId: e.target.value })}
              disabled={!form.categoria}
            >
              <option value="">Sin subcategoría</option>
              {subcategoriasFiltradas.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </ModalField>

          <ModalField
            label="Ubicación"
            className="sm:col-span-2"
            required
            hint={form.ubicacionModo === 'gps' ? 'Se captura tu ubicación GPS al guardar.' : 'Proyecto en proceso o GPS.'}
          >
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, ubicacionModo: 'proyecto' })}
                className={`flex-1 h-9 rounded-lg text-xs font-bold transition-colors ${
                  form.ubicacionModo === 'proyecto' ? 'bg-primary text-white' : 'bg-ui-100 text-ui-500 hover:bg-ui-200'
                }`}
              >
                Proyecto
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, ubicacionModo: 'gps' })}
                className={`flex-1 h-9 rounded-lg text-xs font-bold transition-colors ${
                  form.ubicacionModo === 'gps' ? 'bg-primary text-white' : 'bg-ui-100 text-ui-500 hover:bg-ui-200'
                }`}
              >
                Ubicación GPS
              </button>
            </div>
            {form.ubicacionModo === 'gps' ? (
              <div className="flex items-center gap-2 h-10 px-3 border border-ui-200 rounded-lg bg-ui-50 text-xs font-medium text-ui-500">
                Se captura tu ubicación GPS al guardar
              </div>
            ) : (
              <select
                className={modalSelectClass}
                value={form.proyectoId}
                onChange={(e) => setForm({ ...form, proyectoId: e.target.value })}
              >
                <option value="">Seleccionar proyecto...</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            )}
          </ModalField>

          <ModalField label="Prioridad" className="sm:col-span-2" hint="Opcional — úsala para incidentes o urgencias.">
            <select
              className={modalSelectClass}
              value={form.prioridad}
              onChange={(e) => setForm({ ...form, prioridad: e.target.value as '' | PrioridadReporteApi })}
            >
              <option value="">Sin prioridad</option>
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Descripción" required className="sm:col-span-2" hint="La fecha y hora se registran automáticamente al guardar.">
            <textarea
              className={modalTextareaClass}
              rows={4}
              placeholder="Describe lo observado o realizado..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </ModalField>

          <ModalField label="Imágenes de la avería" hint={`Opcional — máx ${MAX_IMAGENES}, 2 MB cada una.`} className="sm:col-span-2">
            <label className="inline-flex items-center gap-1.5 text-xs font-bold text-primary cursor-pointer hover:text-primary-dark mb-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) handleAltaImagen(file);
                }}
              />
              <ImagePlus className="w-3.5 h-3.5" />
              Agregar imagen
            </label>
            {imagenesAlta.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {imagenesAlta.map((img) => (
                  <div key={img.key} className="relative rounded-xl overflow-hidden border border-ui-200 bg-ui-50">
                    {img.datos ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={`data:${img.mime};base64,${img.datos}`} alt={img.nombre} className="h-20 w-full object-cover" />
                    ) : (
                      <div className="h-20 w-full flex items-center justify-center text-[10px] font-bold text-ui-400">Cargando…</div>
                    )}
                    <button
                      type="button"
                      onClick={() => quitarImagenAlta(img.key)}
                      aria-label={`Quitar ${img.nombre}`}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ModalField>
        </div>
      </FormModal>

      {/* ════════ DETALLE DEL INCIDENTE (ver / comentar / adjuntar / cerrar) ════════ */}
      <FormModal
        open={detalleOpen}
        onClose={() => {
          setDetalleOpen(false);
          setDetalle(null);
        }}
        onCancel={() => {
          setDetalleOpen(false);
          setDetalle(null);
        }}
        hideFooter
        title={
          detalle ? `Incidente ${detalle.reporte.codigo ?? '—'}` : 'Incidente'
        }
        subtitle={
          detalle
            ? `${detalle.reporte.tipo} · ${detalle.reporte.usuario}`
            : undefined
        }
        submitLabel=""
      >
        {detalleCargando || !detalle ? (
          <div className="space-y-4 py-4">
            <Skeleton variant="text" />
            <Skeleton variant="text" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Datos del incidente */}
            <div className="bg-ui-50 border border-ui-100 rounded-xl p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-[10px] font-black text-ui-400 uppercase tracking-wide">Fecha</p>
                  <p className="font-bold text-ui-800">{detalle.reporte.hora} · {detalle.reporte.fecha}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-ui-400 uppercase tracking-wide">Ubicación</p>
                  <p className="font-bold text-ui-800">
                    {detalle.reporte.proyectoId && detalle.reporte.proyecto
                      ? detalle.reporte.proyecto
                      : detalle.reporte.latitud != null
                        ? `GPS ${detalle.reporte.latitud.toFixed(4)}, ${detalle.reporte.longitud?.toFixed(4)}`
                        : 'Sin ubicación'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-ui-400 uppercase tracking-wide">Área</p>
                  <p className="font-bold text-ui-800">{detalle.reporte.categoria ?? 'Sin área'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-ui-400 uppercase tracking-wide">Prioridad</p>
                  <p className="font-bold text-ui-800">{detalle.reporte.prioridad ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-ui-400 uppercase tracking-wide">Estado</p>
                  <p className="font-bold text-ui-800">{detalle.reporte.estado}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-ui-400 uppercase tracking-wide">Responsable</p>
                  <p className="font-bold text-ui-800">{detalle.reporte.asignadoANombre ?? 'Sin asignar'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-ui-400 uppercase tracking-wide">Levantó</p>
                  <p className="font-bold text-ui-800">{detalle.reporte.usuario}</p>
                  {detalle.reportadoPor && (
                    <p className="text-[11px] font-medium text-ui-500">
                      {detalle.reportadoPor.telefono ? `${detalle.reportadoPor.telefono} · ` : ''}
                      {detalle.reportadoPor.rol ?? '—'}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-ui-100">
                <p className="text-[10px] font-black text-ui-400 uppercase tracking-wide mb-1">Descripción</p>
                <p className="text-sm text-ui-700 whitespace-pre-wrap">{detalle.reporte.descripcion}</p>
              </div>

              {/* Acciones de flujo del incidente */}
              {puedeEditar && (
                <div className="mt-4 pt-3 border-t border-ui-100 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<UserCheck className="w-3.5 h-3.5" />}
                    onClick={() => openAsignar(detalle.reporte)}
                  >
                    {detalle.reporte.asignadoANombre ? 'Reasignar' : 'Asignar'}
                  </Button>
                  {detalle.reporte.estado === 'Nuevo' && !detalle.reporte.asignadoANombre && (
                    <Button
                      variant="success"
                      size="sm"
                      icon={<Check className="w-3.5 h-3.5" />}
                      disabled={aceptando}
                      onClick={() => aceptarDetalle(detalle.reporte)}
                    >
                      Aceptar
                    </Button>
                  )}
                  {detalle.reporte.estado === 'Nuevo' && detalle.reporte.asignadoANombre && (
                    <Button variant="primary" size="sm" icon={<Check className="w-3.5 h-3.5" />} onClick={() => iniciarIncidente(detalle.reporte)}>
                      Iniciar
                    </Button>
                  )}
                  {detalle.reporte.estado !== 'Cerrado' && (
                    <Button variant="success" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={() => setCerrarOpen(true)}>
                      Cerrar incidente
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Imágenes adjuntas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-ui-500 uppercase tracking-widest">
                  Imágenes ({detalle.adjuntos.length}/4)
                </p>
                {puedeEditar && detalle.reporte.estado !== 'Cerrado' && (
                  <label className={adjuntando ? 'opacity-50 pointer-events-none' : ''}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={adjuntando}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) handleAdjuntar(file);
                      }}
                    />
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary cursor-pointer hover:text-primary-dark">
                      {adjuntando ? 'Subiendo...' : <><ImagePlus className="w-3.5 h-3.5" /> Agregar imagen</>}
                    </span>
                  </label>
                )}
              </div>
              {detalle.adjuntos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {detalle.adjuntos.map((a: AdjuntoDTO) => (
                    <a
                      key={a.id}
                      href={`data:${a.mime};base64,${a.datos}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-xl overflow-hidden border border-ui-200"
                      title={a.nombre}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:${a.mime};base64,${a.datos}`}
                        alt={a.nombre}
                        className="h-24 w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-ui-400 border border-dashed border-ui-200 rounded-xl p-3">
                  <ImageOff className="w-4 h-4" />
                  Sin imágenes todavía
                </div>
              )}
            </div>

            {/* Actividades (bitácora) */}
            <div>
              <p className="text-[10px] font-black text-ui-500 uppercase tracking-widest mb-2">
                Actividades ({detalle.actividades.length})
              </p>
              {detalle.reporte.estado !== 'Cerrado' && (
                <div className="flex gap-2 mb-3">
                  <textarea
                    className={modalTextareaClass}
                    rows={2}
                    placeholder="Describe lo que se trabajó o revisó..."
                    value={comentarioTexto}
                    onChange={(e) => setComentarioTexto(e.target.value)}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!comentarioTexto.trim() || comentando}
                    loading={comentando}
                    icon={<MessageSquarePlus className="w-3.5 h-3.5" />}
                    onClick={handleComentar}
                  >
                    Publicar
                  </Button>
                </div>
              )}
              {detalle.actividades.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-none">
                  {detalle.actividades.map((act) => (
                    <div key={act.id} className="bg-surface border border-ui-100 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-ui-800">{act.autorNombre}</span>
                        <span className="text-[10px] font-bold text-ui-400">
                          {new Date(act.creadoEn).toLocaleString('es-MX', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-ui-600 mt-1 whitespace-pre-wrap">{act.texto}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ui-400">Sin actividades todavía</p>
              )}
            </div>
          </div>
        )}
      </FormModal>

      {/* Modal de confirmación: Cerrar incidente */}
      <FormModal
        open={cerrarOpen}
        onClose={() => setCerrarOpen(false)}
        onCancel={() => setCerrarOpen(false)}
        title="Cerrar Incidente"
        subtitle="Esta acción no se puede deshacer: el incidente deja de admitir actividades e imágenes."
        submitLabel="Sí, Cerrar Incidente"
        cancelLabel="Cancelar"
        onSubmit={handleCerrarConfirm}
        isSubmitting={submitting}
      >
        {detalle && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-sm text-ui-700 mb-1">¿Cerrar este incidente?</p>
            <p className="font-black text-ui-900 text-lg mb-2">
              {detalle.reporte.codigo} · {detalle.reporte.tipo}
            </p>
            <p className="text-xs text-ui-500 max-w-xs">
              Lo resolvería <strong>{detalle.reporte.asignadoANombre ?? 'sin asignar'}</strong>.
            </p>
          </div>
        )}
      </FormModal>

      {/* Modal de ASIGNACIÓN — quién lo debe resolver */}
      <FormModal
        open={asignarOpen}
        onClose={() => {
          setAsignarOpen(false);
          setAsignarItem(null);
        }}
        onCancel={() => {
          setAsignarOpen(false);
          setAsignarItem(null);
        }}
        title="Asignar Responsable"
        subtitle="Quién debe resolver este incidente. Trabajador del sistema o nombre libre."
        submitLabel="Asignar"
        cancelLabel="Cancelar"
        onSubmit={handleAsignar}
        isSubmitting={submitting}
      >
        <div className="space-y-4">
          <ModalField label="Trabajador del sistema" hint="Al elegir uno, el nombre libre se ignora.">
            <select
              className={modalSelectClass}
              value={asignarForm.asignadoA}
              onChange={(e) => setAsignarForm({ ...asignarForm, asignadoA: e.target.value })}
            >
              <option value="">Sin trabajador del sistema...</option>
              {trabajadores.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} — {t.puesto}
                </option>
              ))}
            </select>
          </ModalField>

          <ModalField label="O nombre libre" hint="Para externos o empleados aún no catalogados.">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Panchito el externo"
              value={asignarForm.asignadoNombre}
              onChange={(e) => setAsignarForm({ ...asignarForm, asignadoNombre: e.target.value })}
              disabled={!!asignarForm.asignadoA}
            />
          </ModalField>

          {asignarItem && (
            <div className="bg-ui-50 border border-ui-100 rounded-xl p-3 flex items-start gap-2">
              <UserX className="w-4 h-4 text-ui-400 shrink-0 mt-0.5" />
              <p className="text-xs text-ui-500">
                Incidente <strong>{asignarItem.codigo}</strong> de{' '}
                <strong>{asignarItem.usuario}</strong> — &ldquo;{asignarItem.descripcion.slice(0, 80)}&rdquo;
              </p>
            </div>
          )}
        </div>
      </FormModal>

      {/* Modal de edición (mismos campos, sin GPS) */}
      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Incidente"
        subtitle={
          selectedItem ? `Disponible hasta cerrarlo · ${selectedItem.usuario}` : undefined
        }
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField
            label="Área (a la que se envía)"
            required
            hint={
              form.categoria === MISMA_AREA
                ? `Tu área: ${torreDelUsuario} — el incidente queda ahí.`
                : 'Misma área deja el incidente con tu propia área; otra torre lo envía allá.'
            }
          >
            <select
              className={modalSelectClass}
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value as '' | CategoriaReporteApi | typeof MISMA_AREA, subcategoriaId: '' })}
            >
              <option value="">Seleccionar área destino...</option>
              <option value={MISMA_AREA}>Misma área (tu área: {torreDelUsuario})</option>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Subcategoría" hint="Opcional — según la categoría elegida.">
            <select
              className={modalSelectClass}
              value={form.subcategoriaId}
              onChange={(e) => setForm({ ...form, subcategoriaId: e.target.value })}
              disabled={!form.categoria}
            >
              <option value="">Sin subcategoría</option>
              {subcategoriasFiltradas.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </ModalField>

          <ModalField
            label="Ubicación"
            className="sm:col-span-2"
            required
            hint={form.ubicacionModo === 'gps' ? 'Se recaptura tu ubicación GPS al guardar.' : 'Proyecto en proceso o GPS.'}
          >
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, ubicacionModo: 'proyecto' })}
                className={`flex-1 h-9 rounded-lg text-xs font-bold transition-colors ${
                  form.ubicacionModo === 'proyecto' ? 'bg-primary text-white' : 'bg-ui-100 text-ui-500 hover:bg-ui-200'
                }`}
              >
                Proyecto
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, ubicacionModo: 'gps' })}
                className={`flex-1 h-9 rounded-lg text-xs font-bold transition-colors ${
                  form.ubicacionModo === 'gps' ? 'bg-primary text-white' : 'bg-ui-100 text-ui-500 hover:bg-ui-200'
                }`}
              >
                Ubicación GPS
              </button>
            </div>
            {form.ubicacionModo === 'gps' ? (
              <div className="flex items-center gap-2 h-10 px-3 border border-ui-200 rounded-lg bg-ui-50 text-xs font-medium text-ui-500">
                Se recaptura tu ubicación GPS al guardar
              </div>
            ) : (
              <select
                className={modalSelectClass}
                value={form.proyectoId}
                onChange={(e) => setForm({ ...form, proyectoId: e.target.value })}
              >
                <option value="">Seleccionar proyecto...</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            )}
          </ModalField>

          <ModalField label="Prioridad" className="sm:col-span-2">
            <select
              className={modalSelectClass}
              value={form.prioridad}
              onChange={(e) => setForm({ ...form, prioridad: e.target.value as '' | PrioridadReporteApi })}
            >
              <option value="">Sin prioridad</option>
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Descripción" required className="sm:col-span-2">
            <textarea
              className={modalTextareaClass}
              rows={4}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </ModalField>

          <ModalField label="Imágenes del incidente" hint={`Opcional — máx ${MAX_IMAGENES}, 2 MB cada una. Se suben al guardar la imagen.`} className="sm:col-span-2">
            {editAdjuntos === null ? (
              <p className="text-xs font-medium text-ui-400">Cargando imágenes…</p>
            ) : (
              <div className="space-y-2">
                {editAdjuntos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {editAdjuntos.map((a) => (
                      <a
                        key={a.id}
                        href={`data:${a.mime};base64,${a.datos}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl overflow-hidden border border-ui-200"
                        title={a.nombre}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`data:${a.mime};base64,${a.datos}`} alt={a.nombre} className="h-20 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-primary cursor-pointer hover:text-primary-dark">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={adjuntando || editAdjuntos.length >= MAX_IMAGENES}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) handleAdjuntarEnEdicion(file);
                    }}
                  />
                  {adjuntando ? 'Subiendo…' : (<> <ImagePlus className="w-3.5 h-3.5" /> Agregar imagen</>)}
                </label>
                {editAdjuntos.length === 0 && <p className="text-xs text-ui-400">Sin imágenes todavía</p>}
              </div>
            )}
          </ModalField>
        </div>
      </FormModal>

      {/* Modal de confirmación: Eliminar */}
      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Incidente"
        subtitle="Esta acción no se puede deshacer."
        submitLabel="Sí, Eliminar"
        cancelLabel="Cancelar"
        onSubmit={handleDelete}
        isSubmitting={submitting}
      >
        {selectedItem && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-500/15 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-ui-700 mb-1">¿Estás seguro de eliminar este incidente?</p>
            <p className="font-black text-ui-900 text-lg mb-2">
              {selectedItem.codigo} · {selectedItem.usuario}
            </p>
            <p className="text-xs text-ui-500 max-w-xs truncate">
              &ldquo;{selectedItem.descripcion}&rdquo;
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}
