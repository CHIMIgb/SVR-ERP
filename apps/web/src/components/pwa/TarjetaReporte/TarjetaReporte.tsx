'use client';

/**
 * Tarjeta de reporte de campo para la PWA (diseño acción primero): datos
 * clave legibles bajo el sol, badges de estado/prioridad con icono+texto y
 * acciones explícitas (Ver + una acción opcional del rol, ej. Aceptar) con
 * targets táctiles ≥44px. Presentacional: el padre decide qué se puede.
 */
import { Eye } from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { tarjetaReporteClasses } from './TarjetaReporte.styles';
import type { ReporteCampoDTO } from '@/lib/api';

export const ETIQUETA_ESTADO: Record<string, string> = {
  NUEVO: 'Nuevo',
  EN_CURSO: 'En curso',
  CERRADO: 'Cerrado',
};

export const ETIQUETA_CATEGORIA: Record<string, string> = {
  MECANICO: 'Mecánico',
  SOLDADOR: 'Soldador',
  DIESEL: 'Diésel',
  MANTENIMIENTO: 'Mantenimiento',
  ADMINISTRATIVO: 'Administrativo',
  RESIDENTE: 'Residente',
};

export const ETIQUETA_PRIORIDAD: Record<string, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

const VARIANTE_ESTADO: Record<string, BadgeVariant> = {
  NUEVO: 'warning',
  EN_CURSO: 'info',
  CERRADO: 'success',
};

const VARIANTE_PRIORIDAD: Record<string, BadgeVariant> = {
  CRITICA: 'error',
  ALTA: 'warning',
  MEDIA: 'info',
  BAJA: 'neutral',
};

export interface TarjetaReporteProps {
  reporte: ReporteCampoDTO;
  /** Acción principal opcional del rol (ej. Aceptar para el técnico). */
  accion?: { etiqueta: string; onClick: () => void; ocupado?: boolean };
  onVer: () => void;
}

/** Fecha corta dd/mm — string puro de la BD (columna date), sin zona horaria. */
function fechaCorta(iso: string): string {
  const d = iso.slice(0, 10);
  return d.length === 10 ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : d;
}

export function TarjetaReporte({ reporte, accion, onVer }: TarjetaReporteProps) {
  const c = tarjetaReporteClasses;
  return (
    <article className={c.root}>
      <div className={c.header}>
        <span className={c.codigo}>{reporte.codigo ?? 'Sin folio'}</span>
        <span className={c.badges}>
          {reporte.prioridad && (
            <Badge variant={VARIANTE_PRIORIDAD[reporte.prioridad] ?? 'neutral'} size="sm">
              {ETIQUETA_PRIORIDAD[reporte.prioridad] ?? reporte.prioridad}
            </Badge>
          )}
          <Badge variant={VARIANTE_ESTADO[reporte.estado] ?? 'neutral'} size="sm" dot>
            {ETIQUETA_ESTADO[reporte.estado] ?? reporte.estado}
          </Badge>
        </span>
      </div>

      <p className={c.descripcion}>{reporte.descripcion}</p>

      <p className={c.meta}>
        <span className={c.metaFuerte}>
          {reporte.subcategoria ??
            (reporte.categoria ? ETIQUETA_CATEGORIA[reporte.categoria] ?? reporte.categoria : reporte.tipo)}
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
