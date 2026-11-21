'use client';

/**
 * Aviso de datos SIN CONEXIÓN (fase offline-lectura, 2026-11-20): cuando no
 * hay señal y la pantalla está sirviendo el snapshot guardado, nadie debe
 * confundir datos viejos con actuales — el banner dice la fecha/hora del
 * último dato guardado y que la sincronización continúa al volver la señal.
 *
 * Se renderiza SIEMPRE que haya pantalla detrás: él solo se oculta cuando
 * vuelve la señal (escucha online/offline). El padre lo gated con
 * `!cargandoInicial` (regla de loaders: los banners condicionales no
 * existen durante la carga).
 */
import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { haySenal } from '@/lib/pwa/sincronizador';
import { avisoSinConexionClasses as c } from './AvisoSinConexion.styles';

export interface AvisoSinConexionProps {
  /** ISO del último snapshot guardado (null = sin fecha conocida). */
  fechaDatos?: string | null;
}

export function AvisoSinConexion({ fechaDatos }: AvisoSinConexionProps) {
  const [sinSenal, setSinSenal] = useState(() => !haySenal());

  useEffect(() => {
    const conSenal = () => setSinSenal(false);
    const perdida = () => setSinSenal(true);
    window.addEventListener('online', conSenal);
    window.addEventListener('offline', perdida);
    return () => {
      window.removeEventListener('online', conSenal);
      window.removeEventListener('offline', perdida);
    };
  }, []);

  if (!sinSenal) return null;

  return (
    <div role="status" className={c.root}>
      <WifiOff className={c.icono} aria-hidden />
      <p className={c.texto}>
        Sin conexión — mostrando los datos guardados
        {fechaDatos ? ` el ${new Date(fechaDatos).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}` : ''}. La
        sincronización continúa al volver la señal.
      </p>
    </div>
  );
}
