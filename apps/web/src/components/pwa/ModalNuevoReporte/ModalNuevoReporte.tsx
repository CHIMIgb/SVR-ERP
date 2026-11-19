'use client';

/**
 * Captura de un reporte de campo — offline-first desde el día 1: SIEMPRE
 * escribe primero en la cola local (`encolar`, con la key de idempotencia
 * del teléfono) y luego dispara una pasada del sincronizador. Con señal el
 * reporte sale al instante (ACK → el modal se cierra); sin señal queda
 * pendiente y se informa al operario. Requiere descripción + subcategoría
 * o el toggle "es de mi área" (el backend valida CATEGORIA_REQUERIDA).
 */
import { useEffect, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { FormModal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { reportesCampoApi, type PrioridadReporteApi } from '@/lib/api';
import { encolar } from '@/lib/pwa/offline';
import { sincronizarAhora } from '@/lib/pwa/sincronizador';
import { modalNuevoReporteClasses } from './ModalNuevoReporte.styles';

const OPCIONES_PRIORIDAD = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' },
];

export interface ModalNuevoReporteProps {
  abierto: boolean;
  onCerrar: () => void;
  /** Nombre que firma el reporte (persona del usuario autenticado). */
  nombreUsuario: string;
  /** Avisa al padre que la cola cambió (para refrescar su resumen). */
  onEncolado?: () => void;
}

export function ModalNuevoReporte({
  abierto,
  onCerrar,
  nombreUsuario,
  onEncolado,
}: ModalNuevoReporteProps) {
  const [subcategorias, setSubcategorias] = useState<{ id: string; nombre: string }[]>([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [subcategoriaId, setSubcategoriaId] = useState('');
  const [mismaArea, setMismaArea] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('');
  const [posicion, setPosicion] = useState<{ latitud: number; longitud: number } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Guardado en la cola pero sin ACK: el operario no debe capturar dos veces. */
  const [pendiente, setPendiente] = useState(false);

  const reiniciar = () => {
    setSubcategoriaId('');
    setMismaArea(false);
    setDescripcion('');
    setPrioridad('');
    setError(null);
    setPendiente(false);
  };

  /** Cerrar del modal SIEMPRE reinicia: la próxima captura arranca limpia
   *  (y con el catálogo en "cargando", porque se vuelve a traer al abrir). */
  const cerrar = () => {
    reiniciar();
    setCargandoCatalogo(true);
    onCerrar();
  };

  useEffect(() => {
    if (!abierto) return;
    let vivo = true;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => setPosicion({ latitud: p.coords.latitude, longitud: p.coords.longitude }),
        () => setPosicion(null), // sin GPS no se bloquea la captura
        { timeout: 8000, maximumAge: 60_000 },
      );
    }
    void (async () => {
      try {
        const res = await reportesCampoApi.subcategorias();
        if (vivo && res.success) setSubcategorias(res.data);
      } catch {
        // Sin catálogo solo queda "mi área": la captura NUNCA se bloquea por la red
      } finally {
        if (vivo) setCargandoCatalogo(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [abierto]);

  const enviar = async () => {
    if (descripcion.trim().length < 5) {
      setError('Describe el problema con al menos 5 caracteres.');
      return;
    }
    if (!subcategoriaId && !mismaArea) {
      setError('Elige una categoría o marca que es de tu área.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await encolar('/reportes-campo', {
        usuario: nombreUsuario,
        descripcion: descripcion.trim(),
        ...(subcategoriaId ? { subcategoriaId } : { mismaArea: true }),
        ...(prioridad ? { prioridad: prioridad as PrioridadReporteApi } : {}),
        ...(posicion ? { latitud: posicion.latitud, longitud: posicion.longitud } : {}),
      });
      const enviados = await sincronizarAhora();
      onEncolado?.();
      if (enviados > 0) {
        cerrar(); // ACK: la vista refresca su lista
      } else {
        setPendiente(true); // sin señal o en conflicto: el estado lo muestra EstadoCola
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el reporte. Revisa tu señal.');
    } finally {
      setEnviando(false);
    }
  };

  const c = modalNuevoReporteClasses;
  return (
    <FormModal
      open={abierto}
      onClose={cerrar}
      title="Nuevo reporte"
      subtitle="Se guarda en tu teléfono y se envía solo"
      submitLabel={pendiente ? 'Listo' : 'Guardar'}
      onSubmit={pendiente ? cerrar : () => void enviar()}
      isSubmitting={enviando}
      submitDisabled={enviando}
      size="md"
      persistent={enviando}
    >
      {pendiente ? (
        <p className={c.notaExito}>
          Tu reporte quedó guardado en este teléfono. Con señal se enviará solo; abajo puedes
          ver su estado.
        </p>
      ) : (
        <>
          <FormField label="Categoría" htmlFor="nuevo-reporte-categoria">
            <Select
              id="nuevo-reporte-categoria"
              options={subcategorias.map((s) => ({ value: s.id, label: s.nombre }))}
              value={subcategoriaId}
              onChange={(e) => {
                setSubcategoriaId(e.target.value);
                setMismaArea(false);
              }}
              placeholder={cargandoCatalogo ? 'Cargando categorías...' : 'Seleccionar categoría...'}
              disabled={mismaArea || (cargandoCatalogo && subcategorias.length === 0)}
            />
          </FormField>

          <label className={c.checkbox}>
            <input
              type="checkbox"
              className={c.checkboxInput}
              checked={mismaArea}
              onChange={(e) => {
                setMismaArea(e.target.checked);
                if (e.target.checked) setSubcategoriaId('');
              }}
            />
            <span className={c.checkboxTexto}>
              Es de mi área — que la revise quien corresponda
            </span>
          </label>

          <FormField label="¿Qué está pasando?" htmlFor="nuevo-reporte-descripcion" required>
            <Textarea
              id="nuevo-reporte-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe el problema..."
              rows={3}
              maxLength={2000}
            />
          </FormField>

          <FormField label="Prioridad (opcional)" htmlFor="nuevo-reporte-prioridad">
            <Select
              id="nuevo-reporte-prioridad"
              options={OPCIONES_PRIORIDAD}
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value)}
              placeholder="Sin prioridad especial"
            />
          </FormField>

          <p className={c.notaGps}>
            {posicion ? (
              <MapPin className="w-4 h-4 shrink-0" aria-hidden />
            ) : (
              <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" aria-hidden />
            )}
            {posicion ? 'Ubicación lista' : 'Buscando tu ubicación...'}
          </p>

          {error && <p className={c.errorGeneral} role="alert">{error}</p>}
        </>
      )}
    </FormModal>
  );
}
