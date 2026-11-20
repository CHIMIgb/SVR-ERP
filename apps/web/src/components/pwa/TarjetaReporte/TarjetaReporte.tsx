'use client';

/**
 * Tarjeta de reporte de campo para la PWA (diseño acción primero): datos
 * clave legibles bajo el sol, badges de estado/prioridad con icono+texto y
 * acciones explícitas (Ver + una acción opcional del rol, ej. Aceptar) con
 * targets táctiles ≥44px. Presentacional: el padre decide qué se puede.
 * El API ya serializa estado/prioridad/categoría como texto es-MX
 * (`ESTADO_LABELS`/`PRIORIDAD_LABELS`/`CATEGORIA_LABELS` del service) — no
 * se vuelven a mapear aquí.
 */
import { Eye, MapPin } from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { tarjetaReporteClasses } from './TarjetaReporte.styles';
import type { ReporteCampoDTO } from '@/lib/api';

const VARIANTE_ESTADO: Record<string, BadgeVariant> = {
  Nuevo: 'warning',
  'En curso': 'info',
  Cerrado: 'success',
};

const VARIANTE_PRIORIDAD: Record<string, BadgeVariant> = {
  Crítica: 'error',
  Alta: 'warning',
  Media: 'info',
  Baja: 'neutral',
};

export interface TarjetaReporteProps {
  reporte: ReporteCampoDTO;
  /** Acción principal opcional del rol (ej. Aceptar para el técnico). */
  accion?: { etiqueta: string; onClick: () => void; ocupado?: boolean };
  onVer: () => void;
  /** Ubicación: obra → domicilio (modal); GPS → Google Maps. El padre la
   *  provee SOLO si el reporte tiene dónde ver (proyecto o coordenadas). */
  onUbicacion?: () => void;
}

/** Fecha corta dd/mm — string puro de la BD (columna date), sin zona horaria. */
function fechaCorta(iso: string): string {
  const d = iso.slice(0, 10);
  return d.length === 10 ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : d;
}

export function TarjetaReporte({ reporte, accion, onVer, onUbicacion }: TarjetaReporteProps) {
  const c = tarjetaReporteClasses;
  return (
    <article className={c.root}>
      <div className={c.header}>
        <span className={c.codigo}>{reporte.codigo ?? 'Sin folio'}</span>
        <span className={c.badges}>
          {reporte.prioridad && (
            <Badge variant={VARIANTE_PRIORIDAD[reporte.prioridad] ?? 'neutral'} size="sm">
              {reporte.prioridad}
            </Badge>
          )}
          <Badge variant={VARIANTE_ESTADO[reporte.estado] ?? 'neutral'} size="sm" dot>
            {reporte.estado}
          </Badge>
        </span>
      </div>

      <p className={c.descripcion}>{reporte.descripcion}</p>

      <p className={c.meta}>
        <span className={c.metaFuerte}>
          {reporte.subcategoria ?? reporte.categoria ?? reporte.tipo}
        </span>
        <span aria-hidden>·</span>
        <span>{reporte.usuario}</span>
        <span aria-hidden>·</span>
        <span>
          {fechaCorta(reporte.fecha)} {reporte.hora?.slice(0, 5)}
        </span>
      </p>

      <div className={c.acciones}>
        <Button
          variant="secondary"
          size="md"
          icon={<Eye className="w-4 h-4" />}
          onClick={onVer}
          className={c.boton}
        >
          Ver
        </Button>
        {onUbicacion && (
          <Button
            variant="secondary"
            size="md"
            icon={<MapPin className="w-4 h-4" />}
            onClick={onUbicacion}
            aria-label="Ver ubicación"
            title="Ver ubicación"
            className={c.boton}
          >
            Ubicación
          </Button>
        )}
        {accion && (
          <Button
            variant="primary"
            size="md"
            onClick={accion.onClick}
            loading={accion.ocupado}
            className={c.boton}
          >
            {accion.etiqueta}
          </Button>
        )}
      </div>
    </article>
  );
}
