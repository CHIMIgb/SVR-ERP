import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBitacoraDto } from './dto/create-bitacora.dto';
import { UpdateBitacoraDto } from './dto/update-bitacora.dto';
import { QueryBitacorasDto } from './dto/query-bitacoras.dto';
import { Prisma } from '@prisma/client';

/** Incluye relaciones para el SELECT del front */
const BITACORA_INCLUDE = {
  maquinas: { select: { id: true, nombre: true } },
  obras: { select: { id: true, nombre: true } },
} as const;

@Injectable()
export class BitacoraService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────
  //  LISTAR (con búsqueda, filtros y paginación)
  // ────────────────────────────────────────────
  async findAll(query: QueryBitacorasDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.bitacoras_operacionWhereInput = {
      eliminado_en: null,
      activo: true,
    };

    // Búsqueda por actividad, obra_texto o nombre de máquina
    if (query.search) {
      where.OR = [
        { actividad: { contains: query.search, mode: 'insensitive' } },
        { obra_texto: { contains: query.search, mode: 'insensitive' } },
        {
          maquinas: {
            nombre: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (query.maquinaId) {
      where.maquina_id = query.maquinaId;
    }

    if (query.obraId) {
      where.obra_id = query.obraId;
    }

    // Filtros de fecha
    if (query.fechaDesde || query.fechaHasta) {
      where.fecha = {};
      if (query.fechaDesde) {
        where.fecha.gte = new Date(query.fechaDesde);
      }
      if (query.fechaHasta) {
        where.fecha.lte = new Date(query.fechaHasta);
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.bitacoras_operacion.findMany({
        where,
        include: BITACORA_INCLUDE,
        orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bitacoras_operacion.count({ where }),
    ]);

    return {
      items: items.map(this.serialize),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ────────────────────────────────────────────
  //  OBTENER UNO
  // ────────────────────────────────────────────
  async findOne(id: string) {
    const bitacora = await this.prisma.bitacoras_operacion.findFirst({
      where: { id, eliminado_en: null },
      include: BITACORA_INCLUDE,
    });

    if (!bitacora) {
      throw new NotFoundException(
        `Bitácora con id "${id}" no encontrada`,
      );
    }

    return this.serialize(bitacora);
  }

  // ────────────────────────────────────────────
  //  CREAR
  // ────────────────────────────────────────────
  async create(dto: CreateBitacoraDto, userId: string) {
    // Verificar que la máquina exista
    const maquina = await this.prisma.maquinas.findFirst({
      where: { id: dto.maquinaId, eliminado_en: null },
    });
    if (!maquina) {
      throw new BadRequestException(
        `Máquina con id "${dto.maquinaId}" no encontrada`,
      );
    }

    // Verificar que la obra exista (si se proporciona)
    if (dto.obraId) {
      const obra = await this.prisma.obras.findFirst({
        where: { id: dto.obraId, eliminado_en: null },
      });
      if (!obra) {
        throw new BadRequestException(
          `Obra con id "${dto.obraId}" no encontrada`,
        );
      }
    }

    const now = new Date();
    const bitacora = await this.prisma.bitacoras_operacion.create({
      data: {
        id: randomUUID(),
        maquina_id: dto.maquinaId,
        actividad: dto.actividad,
        horas: dto.horas,
        fecha: new Date(dto.fecha),
        obra_texto: dto.obraTexto,
        obra_id: dto.obraId ?? null,
        codigo: dto.codigo ?? null,
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: now,
      },
      include: BITACORA_INCLUDE,
    });

    return this.serialize(bitacora);
  }

  // ────────────────────────────────────────────
  //  ACTUALIZAR
  // ────────────────────────────────────────────
  async update(id: string, dto: UpdateBitacoraDto, userId: string) {
    const existente = await this.prisma.bitacoras_operacion.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      throw new NotFoundException(
        `Bitácora con id "${id}" no encontrada`,
      );
    }

    // Validar máquina si se proporciona
    if (dto.maquinaId) {
      const maquina = await this.prisma.maquinas.findFirst({
        where: { id: dto.maquinaId, eliminado_en: null },
      });
      if (!maquina) {
        throw new BadRequestException(
          `Máquina con id "${dto.maquinaId}" no encontrada`,
        );
      }
    }

    // Validar obra si se proporciona
    if (dto.obraId) {
      const obra = await this.prisma.obras.findFirst({
        where: { id: dto.obraId, eliminado_en: null },
      });
      if (!obra) {
        throw new BadRequestException(
          `Obra con id "${dto.obraId}" no encontrada`,
        );
      }
    }

    const bitacora = await this.prisma.bitacoras_operacion.update({
      where: { id },
      data: {
        ...(dto.maquinaId !== undefined && { maquina_id: dto.maquinaId }),
        ...(dto.actividad !== undefined && { actividad: dto.actividad }),
        ...(dto.horas !== undefined && { horas: dto.horas }),
        ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
        ...(dto.obraTexto !== undefined && { obra_texto: dto.obraTexto }),
        ...(dto.obraId !== undefined && { obra_id: dto.obraId ?? null }),
        ...(dto.codigo !== undefined && { codigo: dto.codigo ?? null }),
        actualizado_por: userId,
      },
      include: BITACORA_INCLUDE,
    });

    return this.serialize(bitacora);
  }

  // ────────────────────────────────────────────
  //  ELIMINAR (soft delete)
  // ────────────────────────────────────────────
  async remove(id: string) {
    const existente = await this.prisma.bitacoras_operacion.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      throw new NotFoundException(
        `Bitácora con id "${id}" no encontrada`,
      );
    }

    await this.prisma.bitacoras_operacion.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false },
    });

    return { message: 'Bitácora eliminada exitosamente' };
  }

  // ────────────────────────────────────────────
  //  ESTADÍSTICAS
  // ────────────────────────────────────────────
  async findStats() {
    const bitacoras = await this.prisma.bitacoras_operacion.findMany({
      where: { eliminado_en: null, activo: true },
      select: { horas: true, maquina_id: true },
    });

    const totalRegistros = bitacoras.length;
    const horasTotales = bitacoras.reduce(
      (acc, b) => acc + Number(b.horas),
      0,
    );
    const maquinasActivas = new Set(
      bitacoras.map((b) => b.maquina_id),
    ).size;

    return {
      totalRegistros,
      horasTotales: Math.round(horasTotales * 100) / 100,
      maquinasActivas,
    };
  }

  // ────────────────────────────────────────────
  //  CATÁLOGOS (máquinas y obras para selects)
  // ────────────────────────────────────────────
  async findCatalogos() {
    const [maquinas, obras] = await Promise.all([
      this.prisma.maquinas.findMany({
        where: { activo: true, eliminado_en: null },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.obras.findMany({
        where: { activo: true, eliminado_en: null },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
    ]);

    return { maquinas, obras };
  }

  // ────────────────────────────────────────────
  //  SERIALIZE: mapea Prisma → formato del front
  // ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(bitacora: any) {
    return {
      id: bitacora.id,
      maquinaId: bitacora.maquina_id,
      maquina: bitacora.maquinas?.nombre ?? '',
      actividad: bitacora.actividad,
      horas: Number(bitacora.horas),
      fecha: bitacora.fecha instanceof Date
        ? bitacora.fecha.toISOString().split('T')[0]
        : String(bitacora.fecha),
      obra: bitacora.obra_texto,
      obraId: bitacora.obra_id,
      codigo: bitacora.codigo,
      activo: bitacora.activo,
      creadoEn: bitacora.creado_en,
      actualizadoEn: bitacora.actualizado_en,
    };
  }
}
