'use client';

/**
 * Tarjeta de máquina para "Flota y obras" (PWA del Técnico): nombre, chip de estado, obra del día, operador o
 * chofer, y la liga al mapa del teléfono. Presentacional: recibe el DTO tal cual.
 *
 * Diseño del cliente: "Criba 1 | Obra Cribas Norte · Ing. Marcos Salas | Operador: Luis Pérez | Operando |
 * Ver ubicación exacta". El ingeniero de la obra no se muestra: todavía no existe en los datos (pregunta
 * pendiente al cliente, "residente por obra o por persona").
 *
 * - La ubicación va en un <a target="_blank"> (no window.open, que la PWA de iOS bloquea como popup).
 * - Sin ping GPS no hay "ubicación exacta": si la obra tiene coordenadas se ofrece "Ver obra en el mapa".
 * - Con el ping viejo dice "Ver última ubicación", no "exacta" (revisión 2026-11-24).
 * - `ahora` llega del padre (la hora en que se cargaron los datos): calcular la hora aquí haría impuro el render.
 */
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { MaquinaCampoDTO } from '@/lib/api';
import { estadoUi, haceCuanto, pingSinSenal, urlMapa } from '@/lib/pwa/flota-campo';
import { enlaceMapaClase, tarjetaMaquinaClasses } from './TarjetaMaquina.styles';

export interface TarjetaMaquinaProps {
  maquina: MaquinaCampoDTO;
  /** Hora de referencia para "hace X min" y para saber si el ping ya está viejo. */
  ahora: Date;
  /** Ocultar la línea de la obra y su liga (en la pestaña Obras ya van en el encabezado del grupo). */
  ocultarObra?: boolean;
  /** Los datos no son de hoy (copia guardada de otro día): los textos no dicen "hoy". */
  deOtroDia?: boolean;
}

export function TarjetaMaquina({ maquina, ahora, ocultarObra = false, deOtroDia = false }: TarjetaMaquinaProps) {
  const c = tarjetaMaquinaClasses;
  const estado = estadoUi(maquina.estado);
  const { posicion, obraHoy, encargado } = maquina;
  const sinSenal = posicion ? pingSinSenal(posicion, ahora) : false;
  const obraConPunto = obraHoy?.lat != null && obraHoy?.lng != null ? { lat: obraHoy.lat, lng: obraHoy.lng } : null;

  return (
    <article className={c.root}>
      <div className={c.header}>
        <div className={c.titulo}>
          <p className={c.nombre}>{maquina.nombre}</p>
          <p className={c.subtitulo}>{[maquina.codigo, maquina.tipo].filter(Boolean).join(' · ')}</p>
        </div>
        <Badge variant={estado.variante} size="sm" dot className={c.badge}>
          {estado.etiqueta}
        </Badge>
      </div>

      {!ocultarObra && (
        <p className={c.linea}>
          {obraHoy ? (
            obraHoy.nombre
          ) : (
            <span className={c.vacio}>{deOtroDia ? 'Sin obra asignada ese día' : 'Sin obra asignada hoy'}</span>
          )}
        </p>
      )}
      <p className={ocultarObra ? c.linea : c.lineaSecundaria}>
        {encargado ? (
          <>
            <span className={c.etiqueta}>{encargado.rol}:</span> {encargado.nombre}
          </>
        ) : (
          <span className={c.vacio}>Sin operador asignado</span>
        )}
      </p>

      <div className={c.pie}>
        {posicion ? (
          <p className={sinSenal ? c.gpsSinSenal : c.gps}>
            {sinSenal ? 'Sin señal GPS · último dato ' : 'GPS '}
            {haceCuanto(posicion.fechaHora, ahora)}
          </p>
        ) : (
          <p className={c.gps}>Sin datos de GPS</p>
        )}
        {posicion ? (
          <a
            href={urlMapa(posicion.lat, posicion.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className={enlaceMapaClase}
            aria-label={`${sinSenal ? 'Ver última ubicación' : 'Ver ubicación exacta'} de ${maquina.nombre}`}
          >
            <MapPin className="w-4 h-4" aria-hidden />
            {sinSenal ? 'Ver última ubicación' : 'Ver ubicación exacta'}
          </a>
        ) : (
          obraConPunto &&
          !ocultarObra && (
            <a
              href={urlMapa(obraConPunto.lat, obraConPunto.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className={enlaceMapaClase}
              aria-label={`Ver en el mapa la obra de ${maquina.nombre}`}
            >
              <MapPin className="w-4 h-4" aria-hidden />
              Ver obra en el mapa
            </a>
          )
        )}
      </div>
    </article>
  );
}
