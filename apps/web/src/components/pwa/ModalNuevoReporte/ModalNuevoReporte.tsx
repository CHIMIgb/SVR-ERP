'use client';

/**
 * Captura de un reporte de campo — PARIDAD 1:1 con el escritorio /reportes:
 * Área (a la que se envía) con optgroups, Subcategoría filtrada, Ubicación
 * Proyecto/GPS (captura al guardar), Prioridad, Descripción e Imágenes
 * (WebP local, máx 4 × 10 MB). Offline-first: SIEMPRE encola
 * (`encolar` con la key de idempotencia del teléfono) y dispara el
 * sincronizador; las fotos viajan con el item y se adjuntan tras el ACK.
 * Payload idéntico al escritorio: `mismaArea` o `categoria`,
 * `subcategoriaId` solo si no es misma área, `proyectoId` o lat/long.
 */
import { useEffect, useState } from 'react';
import { FolderOpen, ImagePlus, X } from 'lucide-react';
import { FormModal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  reportesCampoApi,
  type CategoriaReporteApi,
  type PrioridadReporteApi,
} from '@/lib/api';
import { convertirAWebp, MAX_IMAGENES, MAX_TAMANO_IMAGEN } from '@/lib/imagenes';
import { useToast } from '@/components/layout/Toast';
import {
  encolar,
  consultarEstado,
  type AdjuntoPendiente,
} from '@/lib/pwa/offline';
import { sincronizarAhora } from '@/lib/pwa/sincronizador';
import { modalNuevoReporteClasses as c } from './ModalNuevoReporte.styles';

/** Categoría responsable — el área a la que se ENVÍA el incidente (copia del escritorio). */
const CATEGORIAS: { value: CategoriaReporteApi; label: string }[] = [
  { value: 'MECANICO', label: 'Mecanico' },
  { value: 'SOLDADOR', label: 'Soldador' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'RESIDENTE', label: 'Residente' },
];

const MISMA_AREA = 'MISMA_AREA';

const PRIORIDADES: { value: PrioridadReporteApi; label: string }[] = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' },
];

/** Áreas agrupadas según la guía de roles del cliente (optgroups, igual que escritorio). */
const OPT_GROUPS = [
  { label: 'Administración', opciones: ['ADMINISTRATIVO'] },
  { label: 'Residentes', opciones: ['RESIDENTE'] },
  { label: 'Técnicos', opciones: ['MECANICO', 'SOLDADOR', 'DIESEL', 'MANTENIMIENTO'] },
] as const;

/** Imagen del alta con key local (base64; el server aún no conoce el folio). */
interface ImagenAlta extends AdjuntoPendiente {
  key: string;
}

export interface ModalNuevoReporteProps {
  abierto: boolean;
  onCerrar: () => void;
  /** Quién reporta — nombre completo (persona) del usuario autenticado. */
  nombreUsuario: string;
  /** Torre del usuario (`users.torre`) para el hint de "Misma área" y el filtro. */
  torreUsuario?: string | null;
  /** Avisa al padre que la cola cambió (para refrescar su resumen). */
  onEncolado?: () => void;
}

export function ModalNuevoReporte({
  abierto,
  onCerrar,
  nombreUsuario,
  torreUsuario,
  onEncolado,
}: ModalNuevoReporteProps) {
  const { showToast } = useToast();
  const [subcategorias, setSubcategorias] = useState<{ id: string; nombre: string; categoria: string }[]>([]);
  const [proyectos, setProyectos] = useState<{ id: string; nombre: string }[]>([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);

  const [area, setArea] = useState<'' | CategoriaReporteApi | typeof MISMA_AREA>('');
  const [subcategoriaId, setSubcategoriaId] = useState('');
  const [ubicacionModo, setUbicacionModo] = useState<'' | 'proyecto' | 'gps'>('');
  const [proyectoId, setProyectoId] = useState('');
  const [prioridad, setPrioridad] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagenes, setImagenes] = useState<ImagenAlta[]>([]);

  const [enviando, setEnviando] = useState(false);
  /** Guardado en la cola pero sin ACK: el operario no debe capturar dos veces. */
  const [pendiente, setPendiente] = useState(false);

  const reiniciar = () => {
    setArea('');
    setSubcategoriaId('');
    setUbicacionModo('');
    setProyectoId('');
    setPrioridad('');
    setDescripcion('');
    setImagenes([]);
    setPendiente(false);
  };

  /** Cerrar del modal SIEMPRE reinicia: la próxima captura arranca limpia
   *  (y con los catálogos en "cargando", porque se vuelven a traer al abrir). */
  const cerrar = () => {
    reiniciar();
    setCargandoCatalogo(true);
    onCerrar();
  };

  useEffect(() => {
    if (!abierto) return;
    let vivo = true;
    void (async () => {
      try {
        const [resSub, resProy] = await Promise.all([
          reportesCampoApi.subcategorias(),
          reportesCampoApi.proyectos(),
        ]);
        if (vivo && resSub.success) setSubcategorias(resSub.data);
        if (vivo && resProy.success) setProyectos(resProy.data);
      } catch {
        // Sin catálogos la captura sigue (área propia + GPS): NUNCA la bloquea la red
      } finally {
        if (vivo) setCargandoCatalogo(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [abierto]);

  /** Torre destino ("misma área") + filtro de subcategoría — igual que el escritorio. */
  const torreDelUsuario = CATEGORIAS.find((cat) => cat.value === torreUsuario)?.label ?? 'Administrativo';
  const categoriaLabel =
    area === MISMA_AREA ? torreDelUsuario : CATEGORIAS.find((cat) => cat.value === area)?.label;
  const subcategoriasFiltradas = subcategorias.filter(
    (s) => !!categoriaLabel && s.categoria === categoriaLabel,
  );

  /** Imagen del alta: convierte a WebP y apila (límites idénticos al escritorio). */
  const agregarImagen = async (file: File) => {
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
      showToast('La imagen excede el máximo de 10 MB.', 'error');
      return;
    }
    if (imagenes.length >= MAX_IMAGENES) {
      showToast(`Máximo ${MAX_IMAGENES} imágenes por incidente.`, 'error');
      return;
    }
    setImagenes((prev) => [
      ...prev,
      {
        // crypto.randomUUID no existe fuera de HTTPS — key local sin dependencia
        key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        nombre: `${file.name.replace(/\.[^.]+$/, '')}${webp.mime === 'image/webp' ? '.webp' : '.jpg'}`,
        mime: webp.mime,
        tamano: webp.tamano,
        datos: webp.dataUrl.substring(webp.dataUrl.indexOf(',') + 1),
      },
    ]);
  };

  const enviar = async () => {
    // Validaciones idénticas al escritorio
    if (!area) {
      showToast('Selecciona el área a la que se envía el incidente.', 'error');
      return;
    }
    if (ubicacionModo === 'proyecto' && !proyectoId) {
      showToast('Selecciona el proyecto en proceso para la ubicación.', 'error');
      return;
    }
    if (!descripcion.trim()) {
      showToast('La descripción del reporte es obligatoria.', 'error');
      return;
    }

    setEnviando(true);

    // Ubicación: proyecto o GPS (captura al guardar — misma secuencia del escritorio)
    let ubicacion: Partial<{ proyectoId: string; latitud: number; longitud: number }> = {};
    if (ubicacionModo === 'proyecto' && proyectoId) {
      ubicacion = { proyectoId };
    } else if (ubicacionModo === 'gps') {
      if (!window.isSecureContext || !('geolocation' in navigator)) {
        showToast('Tu navegador bloquea el GPS fuera de HTTPS. Usa localhost, activa el HTTPS (requisito del PWA) o elige el modo "Proyecto".', 'error');
        setEnviando(false);
        return;
      }
      const coords = await new Promise<GeolocationPosition | null>((resolve) =>
        navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000,
        }),
      );
      if (!coords) {
        showToast('No se pudo capturar tu ubicación (señal débil o permiso denegado). Reintenta, activa el GPS del dispositivo o marca "Proyecto".', 'error');
        setEnviando(false);
        return;
      }
      ubicacion = { latitud: coords.coords.latitude, longitud: coords.coords.longitude };
    }

    try {
      const mismaArea = area === MISMA_AREA;
      const item = await encolar(
        '/reportes-campo',
        {
          mismaArea,
          ...(mismaArea ? {} : { categoria: area as CategoriaReporteApi }),
          subcategoriaId: mismaArea ? undefined : subcategoriaId || undefined,
          ...ubicacion,
          usuario: nombreUsuario,
          descripcion: descripcion.trim(),
          prioridad: prioridad || undefined,
        },
        imagenes.map((img) => ({
          nombre: img.nombre,
          mime: img.mime,
          tamano: img.tamano,
          datos: img.datos,
        })),
      );
      // Solo el ACK de ESTE item felicita: la pasada puede enviar otros
      // items viejos de la cola (bloqueante 5 PR #23)
      const enviados = await sincronizarAhora();
      onEncolado?.();
      if (enviados.includes(item.id)) {
        showToast('Incidente registrado exitosamente.', 'success'); // paridad del escritorio
        cerrar(); // ACK: fotos ya adjuntadas por el sincronizador
      } else if ((await consultarEstado(item.id)) === 'rechazado') {
        showToast('El servidor rechazó este reporte (revisa los datos). Descártalo o corrigelo y reintenta en la lista de pendientes.', 'error');
        setPendiente(true); // EstadoCola muestra el rechazo con Descartar/Reintentar
      } else {
        showToast('Tu reporte quedó guardado en este teléfono y se enviará solo.', 'info');
        setPendiente(true); // sin señal o conflicto: el estado lo muestra EstadoCola
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo guardar el reporte. Revisa tu señal.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <FormModal
      open={abierto}
      onClose={cerrar}
      title="Nuevo reporte"
      subtitle="Registra un incidente — se guarda en tu teléfono y se envía solo"
      submitLabel={pendiente ? 'Listo' : 'Registrar Reporte'}
      onSubmit={pendiente ? cerrar : () => void enviar()}
      isSubmitting={enviando}
      submitDisabled={enviando}
      size="md"
      persistent={enviando}
    >
      {pendiente ? (
        <p className={c.notaExito}>
          Tu reporte quedó guardado en este teléfono. Con señal se enviará solo
          (las fotos se suben después del reporte); abajo puedes ver su estado.
        </p>
      ) : (
        <>
          <FormField
            label="Área (a la que se envía)"
            htmlFor="nuevo-reporte-area"
            required
            hint={
              area === MISMA_AREA
                ? `Tu área: ${torreDelUsuario} — el incidente queda ahí.`
                : 'Misma área deja el incidente con tu propia área; otra torre lo envía allá.'
            }
          >
            {/* Select nativo: el kit no soporta optgroups (igual que el escritorio) */}
            <select
              id="nuevo-reporte-area"
              className={c.selectArea}
              value={area}
              onChange={(e) => {
                setArea(e.target.value as typeof area);
                setSubcategoriaId('');
              }}
            >
              <option value="">Seleccionar área destino...</option>
              <option value={MISMA_AREA}>Misma área</option>
              {OPT_GROUPS.map((grupo) => (
                <optgroup key={grupo.label} label={grupo.label}>
                  {grupo.opciones.map((valor) => (
                    <option key={valor} value={valor}>
                      {CATEGORIAS.find((cat) => cat.value === valor)!.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </FormField>

          <FormField label="Subcategoría" htmlFor="nuevo-reporte-subcategoria" hint="Opcional — según el área destino.">
            <Select
              id="nuevo-reporte-subcategoria"
              options={subcategoriasFiltradas.map((s) => ({ value: s.id, label: s.nombre }))}
              value={subcategoriaId}
              onChange={(e) => setSubcategoriaId(e.target.value)}
              placeholder="Sin subcategoría"
              disabled={!area || (cargandoCatalogo && subcategorias.length === 0)}
            />
          </FormField>

          <FormField
            label="Ubicación"
            htmlFor="nuevo-reporte-ubicacion"
            hint={
              ubicacionModo === 'gps'
                ? 'Se captura al guardar — el GPS requiere HTTPS (en LAN usa Proyecto).'
                : 'Proyecto en proceso o GPS.'
            }
          >
            <div className={c.toggle} role="group" aria-label="Modo de ubicación">
              <button
                type="button"
                onClick={() => setUbicacionModo('proyecto')}
                className={`${c.toggleBtn} ${ubicacionModo === 'proyecto' ? c.toggleActivo : c.toggleInactivo}`}
              >
                Proyecto
              </button>
              <button
                type="button"
                onClick={() => setUbicacionModo('gps')}
                className={`${c.toggleBtn} ${ubicacionModo === 'gps' ? c.toggleActivo : c.toggleInactivo}`}
              >
                Ubicación GPS
              </button>
            </div>
            {ubicacionModo === 'gps' ? (
              <p className={c.notaGps}>Se captura al guardar — el GPS requiere HTTPS (en LAN usa Proyecto)</p>
            ) : (
              <Select
                id="nuevo-reporte-ubicacion"
                options={proyectos.map((p) => ({ value: p.id, label: p.nombre }))}
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                placeholder={cargandoCatalogo && proyectos.length === 0 ? 'Cargando proyectos...' : 'Seleccionar proyecto...'}
                disabled={ubicacionModo !== 'proyecto' || (cargandoCatalogo && proyectos.length === 0)}
              />
            )}
          </FormField>

          <FormField label="Prioridad" htmlFor="nuevo-reporte-prioridad" hint="Opcional — úsala para incidentes o urgencias.">
            <Select
              id="nuevo-reporte-prioridad"
              options={PRIORIDADES}
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value)}
              placeholder="Sin prioridad"
            />
          </FormField>

          <FormField label="Descripción" htmlFor="nuevo-reporte-descripcion" required hint="La fecha y hora se registran automáticamente al guardar.">
            <Textarea
              id="nuevo-reporte-descripcion"
              rows={4}
              placeholder="Describe lo observado o realizado..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={2000}
            />
          </FormField>

          <FormField label="Imágenes de la avería" hint={`Opcional — máx ${MAX_IMAGENES}, 10 MB cada una.`}>
            <div className="flex gap-4 flex-wrap">
              <label className={c.agregar}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) void agregarImagen(file);
                  }}
                />
                <ImagePlus className="w-3.5 h-3.5" aria-hidden />
                Tomar foto
              </label>
              <label className={c.agregar}>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) void agregarImagen(file);
                  }}
                />
                <FolderOpen className="w-3.5 h-3.5" aria-hidden />
                Galería
              </label>
            </div>
            {imagenes.length > 0 && (
              <div className={c.gridImagenes}>
                {imagenes.map((img) => (
                  <div key={img.key} className={c.imagen}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`data:${img.mime};base64,${img.datos}`} alt={img.nombre} className={c.imagenImg} />
                    <button
                      type="button"
                      onClick={() => setImagenes((prev) => prev.filter((i) => i.key !== img.key))}
                      aria-label={`Quitar ${img.nombre}`}
                      className={c.quitar}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormField>
        </>
      )}
    </FormModal>
  );
}
