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

  /** Mapa interno codigo->id real, para resolver el FK real desde el "P001" que usa el frontend. */
  async mapaCodigoAId(): Promise<Map<string, string>> {
    const proyectos = await this.prisma.proyectos.findMany({
      where: { eliminado_en: null, codigo: { not: null } },
      select: { id: true, codigo: true },
    });
    return new Map(proyectos.map((p) => [p.codigo as string, p.id]));
  }
}
