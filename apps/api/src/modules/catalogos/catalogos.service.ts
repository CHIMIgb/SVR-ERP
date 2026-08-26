import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Lookup minimo de solo lectura para llenar selects/dropdowns desde
 * otros modulos (ej. "Despachar a Obra" en Flota necesita elegir un
 * Proyecto). El modulo real de Proyectos (CRUD completo, presupuestos,
 * hitos) es tarea aparte — esto NO lo reemplaza, solo evita bloquear
 * Flota mientras esa tarea no exista.
 */
export interface ProyectoLite {
  id: string;
  nombre: string;
  ubicacion: string;
}

export interface ObraLite {
  id: string;
  nombre: string;
  lat?: number;
  lng?: number;
  radioPermitidoMetros?: number;
}

@Injectable()
export class CatalogosService {
  constructor(private readonly prisma: PrismaService) {}

  async proyectos(): Promise<ProyectoLite[]> {
    const proyectos = await this.prisma.proyectos.findMany({
      where: { eliminado_en: null, activo: true },
      include: { obras: { select: { ubicacion: true }, take: 1 } },
      orderBy: { codigo: 'asc' },
    });

    return proyectos.map((p) => ({
      id: p.codigo ?? p.id,
      nombre: p.nombre,
      ubicacion: p.obras[0]?.ubicacion ?? '',
    }));
  }

  /** Obras activas para selects (ej. marcaje GPS de Asistencia). */
  async obras(): Promise<ObraLite[]> {
    const obras = await this.prisma.obras.findMany({
      where: { eliminado_en: null, activo: true, estado: { not: 'FINALIZADA' } },
      orderBy: { nombre: 'asc' },
    });

    return obras.map((o) => ({
      id: o.id,
      nombre: o.nombre,
      lat: o.lat != null ? Number(o.lat) : undefined,
      lng: o.lng != null ? Number(o.lng) : undefined,
      radioPermitidoMetros: o.radio_permitido_metros != null ? Number(o.radio_permitido_metros) : undefined,
    }));
  }

  /** Mapa interno codigo->id real, para resolver el FK real desde el "P001" que usa el frontend. */
  async mapaCodigoAId(): Promise<Map<string, string>> {
    const proyectos = await this.prisma.proyectos.findMany({
      where: { eliminado_en: null, codigo: { not: null } },
      select: { id: true, codigo: true },
    });
    return new Map(proyectos.map((p) => [p.codigo as string, p.id]));
  }
}
