'use client';

/**
 * Aviso de datos SIN CONEXIÓN (fase offline-lectura, 2026-11-20): cuando la
 * pantalla está sirviendo el snapshot guardado —sin señal O con señal pero
 * server caído— nadie debe confundir datos viejos con actuales: el banner
 * dice la fecha/hora del último dato guardado y que la sincronización
 * continúa al volver la señal.
 *
 * Depende de "se sirvió snapshot" (I-3 revisión PR #23), NO de
 * `navigator.onLine`: con Wi-Fi vivo y server de la LAN muerto, el aviso
 * sigue apareciendo. El padre lo quita al traer datos frescos del server y
 * lo gated con `!cargandoInicial` (regla de loaders: los banners
 * condicionales no existen durante la carga).
 */
import { WifiOff } from 'lucide-react';
import { avisoSinConexionClasses as c } from './AvisoSinConexion.styles';

export interface AvisoSinConexionProps {
  /** ISO del último snapshot guardado (null = sin fecha conocida). */
  fechaDatos?: string | null;
  /** La pantalla está mostrando el snapshot, no datos vivos del server. */
  sirviendoSnapshot: boolean;
}

export function AvisoSinConexion({ fechaDatos, sirviendoSnapshot }: AvisoSinConexionProps) {
  if (!sirviendoSnapshot) return null;

  // La hora en es-MX termina en "a.m."/"p.m.": pegarle el punto de la oración daba "11:43 p.m.. La
  // sincronización…" (visto en las capturas de Flota y obras, 2026-11-24). Solo se agrega el punto si falta.
  const cuando = fechaDatos
    ? ` el ${new Date(fechaDatos).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}`
    : '';
  const fin = cuando.endsWith('.') ? '' : '.';

  return (
    <div role="status" className={c.root}>
      <WifiOff className={c.icono} aria-hidden />
      <p className={c.texto}>
        Sin conexión — mostrando los datos guardados{cuando}
        {fin} La sincronización continúa al volver la señal.
      </p>
    </div>
  );
}
