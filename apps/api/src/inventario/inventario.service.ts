import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateArticuloDto } from './dto/create-articulo.dto';
import { UpdateArticuloDto } from './dto/update-articulo.dto';
import { QueryArticulosDto } from './dto/query-articulos.dto';
import { Prisma } from '@prisma/client';

/** Incluye relacion para el SELECT del front */
const ARTICULO_INCLUDE = {
  categorias_inventario: { select: { id: true, nombre: true } },
  proveedores: { select: { id: true, nombre: true } },
  unidades_medida: { select: { id: true, codigo: true, nombre: true } },
} as const;

@Injectable()
export class InventarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ────────────────────────────────────────────
  //  LISTAR (con búsqueda, filtros y paginación)
  // ────────────────────────────────────────────
  async findAll(query: QueryArticulosDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.articulos_inventarioWhereInput = {
      eliminado_en: null,
      activo: true,
    };

    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        {
          categorias_inventario: {
            nombre: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          proveedores: {
            nombre: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (query.categoriaId) {
      where.categoria_id = query.categoriaId;
    }

    if (query.proveedorId) {
      where.proveedor_id = query.proveedorId;
    }

    const needsPostFilter = !!query.stockEstado;

    if (needsPostFilter) {
      const allItems = await this.prisma.articulos_inventario.findMany({
        where,
        include: ARTICULO_INCLUDE,
        orderBy: { creado_en: 'desc' },
      });

      let filtered = allItems;
      if (query.stockEstado === 'bajo') {
        filtered = allItems.filter(
          (a) => Number(a.stock) <= Number(a.stock_minimo),
        );
      } else if (query.stockEstado === 'ok') {
        filtered = allItems.filter(
          (a) => Number(a.stock) > Number(a.stock_minimo),
        );
      }

      const total = filtered.length;
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      return {
        items: paged.map(this.serialize),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.articulos_inventario.findMany({
        where,
        include: ARTICULO_INCLUDE,
        orderBy: { creado_en: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.articulos_inventario.count({ where }),
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
    const articulo = await this.prisma.articulos_inventario.findFirst({
      where: { id, eliminado_en: null },
      include: ARTICULO_INCLUDE,
    });

    if (!articulo) {
      throw new NotFoundException(`Artículo con id "${id}" no encontrado`);
    }

    return this.serialize(articulo);
  }

  // ────────────────────────────────────────────
  //  CREAR
  // ────────────────────────────────────────────
  async create(dto: CreateArticuloDto, userId: string) {
    const categoria = await this.prisma.categorias_inventario.findUnique({
      where: { id: dto.categoriaId },
    });
    if (!categoria) {
      await this.auditService.logFailure({
        action: AuditAction.ARTICULO_CREADO,
        entityType: 'articulos_inventario',
        entityId: '',
        actorUserId: userId,
        actorType: 'USER',
        actorRole: 'autenticado',
        errorCode: 'CATEGORY_NOT_FOUND',
        metadata: { nombre: dto.nombre, categoriaId: dto.categoriaId },
      });
      throw new BadRequestException(
        `Categoría con id "${dto.categoriaId}" no encontrada`,
      );
    }

    const proveedor = await this.prisma.proveedores.findFirst({
      where: { id: dto.proveedorId, eliminado_en: null },
    });
    if (!proveedor) {
      await this.auditService.logFailure({
        action: AuditAction.ARTICULO_CREADO,
        entityType: 'articulos_inventario',
        entityId: '',
        actorUserId: userId,
        actorType: 'USER',
        actorRole: 'autenticado',
        errorCode: 'SUPPLIER_NOT_FOUND',
        metadata: { nombre: dto.nombre, proveedorId: dto.proveedorId },
      });
      throw new BadRequestException(
        `Proveedor con id "${dto.proveedorId}" no encontrado`,
      );
    }

    const unidad = await this.prisma.unidades_medida.findUnique({
      where: { id: dto.unidadId },
    });
    if (!unidad) {
      await this.auditService.logFailure({
        action: AuditAction.ARTICULO_CREADO,
        entityType: 'articulos_inventario',
        entityId: '',
        actorUserId: userId,
        actorType: 'USER',
        actorRole: 'autenticado',
        errorCode: 'UNIT_NOT_FOUND',
        metadata: { nombre: dto.nombre, unidadId: dto.unidadId },
      });
      throw new BadRequestException(
        `Unidad de medida con id "${dto.unidadId}" no encontrada`,
      );
    }

    const now = new Date();
    const articulo = await this.prisma.articulos_inventario.create({
      data: {
        id: randomUUID(),
        nombre: dto.nombre,
        codigo: dto.codigo,
        stock: dto.stock,
        stock_minimo: dto.stockMinimo,
        precio_unitario: dto.precioUnitario,
        categoria_id: dto.categoriaId,
        proveedor_id: dto.proveedorId,
        unidad_id: dto.unidadId,
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: now,
      },
      include: ARTICULO_INCLUDE,
    });

    const serialized = this.serialize(articulo);

    await this.auditService.log({
      action: AuditAction.ARTICULO_CREADO,
      entityType: 'articulos_inventario',
      entityId: articulo.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    if (dto.stock <= dto.stockMinimo) {
      await this.auditService.log({
        action: AuditAction.STOCK_BAJO_DETECTADO,
        entityType: 'articulos_inventario',
        entityId: articulo.id,
        result: AuditResult.SUCCESS,
        actorUserId: userId,
        actorType: 'USER',
        actorRole: 'autenticado',
        metadata: {
          nombre: dto.nombre,
          stock: dto.stock,
          stockMinimo: dto.stockMinimo,
          contexto: 'Creación con stock bajo',
        },
      });
    }

    return serialized;
  }

  // ────────────────────────────────────────────
  //  ACTUALIZAR
  // ────────────────────────────────────────────
  async update(id: string, dto: UpdateArticuloDto, userId: string) {
    const existente = await this.prisma.articulos_inventario.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      throw new NotFoundException(`Artículo con id "${id}" no encontrado`);
    }

    if (dto.categoriaId) {
      const cat = await this.prisma.categorias_inventario.findUnique({
        where: { id: dto.categoriaId },
      });
      if (!cat) {
        await this.auditService.logFailure({
          action: AuditAction.ARTICULO_ACTUALIZADO,
          entityType: 'articulos_inventario',
          entityId: id,
          actorUserId: userId,
          actorType: 'USER',
          actorRole: 'autenticado',
          errorCode: 'CATEGORY_NOT_FOUND',
          metadata: { categoriaId: dto.categoriaId },
        });
        throw new BadRequestException(
          `Categoría con id "${dto.categoriaId}" no encontrada`,
        );
      }
    }

    if (dto.proveedorId) {
      const prov = await this.prisma.proveedores.findFirst({
        where: { id: dto.proveedorId, eliminado_en: null },
      });
      if (!prov) {
        await this.auditService.logFailure({
          action: AuditAction.ARTICULO_ACTUALIZADO,
          entityType: 'articulos_inventario',
          entityId: id,
          actorUserId: userId,
          actorType: 'USER',
          actorRole: 'autenticado',
          errorCode: 'SUPPLIER_NOT_FOUND',
          metadata: { proveedorId: dto.proveedorId },
        });
        throw new BadRequestException(
          `Proveedor con id "${dto.proveedorId}" no encontrado`,
        );
      }
    }

    if (dto.unidadId) {
      const uni = await this.prisma.unidades_medida.findUnique({
        where: { id: dto.unidadId },
      });
      if (!uni) {
        await this.auditService.logFailure({
          action: AuditAction.ARTICULO_ACTUALIZADO,
          entityType: 'articulos_inventario',
          entityId: id,
          actorUserId: userId,
          actorType: 'USER',
          actorRole: 'autenticado',
          errorCode: 'UNIT_NOT_FOUND',
          metadata: { unidadId: dto.unidadId },
        });
        throw new BadRequestException(
          `Unidad de medida con id "${dto.unidadId}" no encontrada`,
        );
      }
    }

    const articulo = await this.prisma.articulos_inventario.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.codigo !== undefined && { codigo: dto.codigo }),
        ...(dto.stock !== undefined && { stock: dto.stock }),
        ...(dto.stockMinimo !== undefined && { stock_minimo: dto.stockMinimo }),
        ...(dto.precioUnitario !== undefined && {
          precio_unitario: dto.precioUnitario,
        }),
        ...(dto.categoriaId !== undefined && {
          categoria_id: dto.categoriaId,
        }),
        ...(dto.proveedorId !== undefined && {
          proveedor_id: dto.proveedorId,
        }),
        ...(dto.unidadId !== undefined && { unidad_id: dto.unidadId }),
        actualizado_por: userId,
      },
      include: ARTICULO_INCLUDE,
    });

    const serialized = this.serialize(articulo);

    await this.auditService.log({
      action: AuditAction.ARTICULO_ACTUALIZADO,
      entityType: 'articulos_inventario',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: {
        stock: Number(existente.stock),
        stockMinimo: Number(existente.stock_minimo),
        nombre: existente.nombre,
      },
      newValue: serialized,
    });

    const stockActual = dto.stock !== undefined ? dto.stock : Number(existente.stock);
    const minimoActual = dto.stockMinimo !== undefined ? dto.stockMinimo : Number(existente.stock_minimo);
    const minimoAnterior = Number(existente.stock_minimo);
    const stockAnterior = Number(existente.stock);

    if (stockActual <= minimoActual && stockAnterior > minimoAnterior) {
      await this.auditService.log({
        action: AuditAction.STOCK_BAJO_DETECTADO,
        entityType: 'articulos_inventario',
        entityId: id,
        result: AuditResult.SUCCESS,
        actorUserId: userId,
        actorType: 'USER',
        actorRole: 'autenticado',
        metadata: {
          nombre: articulo.nombre,
          stock: stockActual,
          stockMinimo: minimoActual,
          contexto: 'Actualización cruzó umbral hacia abajo',
        },
      });
    }

    if (stockActual > minimoActual && stockAnterior <= minimoAnterior) {
      await this.auditService.log({
        action: AuditAction.STOCK_BAJO_RESUELTO,
        entityType: 'articulos_inventario',
        entityId: id,
        result: AuditResult.SUCCESS,
        actorUserId: userId,
        actorType: 'USER',
        actorRole: 'autenticado',
        metadata: {
          nombre: articulo.nombre,
          stock: stockActual,
          stockMinimo: minimoActual,
          contexto: 'Actualización resolvió stock bajo',
        },
      });
    }

    return serialized;
  }

  // ────────────────────────────────────────────
  //  ELIMINAR (soft delete)
  // ────────────────────────────────────────────
  async remove(id: string, userId: string) {
    const existente = await this.prisma.articulos_inventario.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      throw new NotFoundException(`Artículo con id "${id}" no encontrado`);
    }

    await this.prisma.articulos_inventario.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false },
    });

    await this.auditService.log({
      action: AuditAction.ARTICULO_ELIMINADO,
      entityType: 'articulos_inventario',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serialize(existente),
    });

    return { message: 'Artículo eliminado exitosamente' };
  }

  // ────────────────────────────────────────────
  //  MOVIMIENTO DE STOCK (entrada/salida)
  // ────────────────────────────────────────────

  /**
   * Aplica una ENTRADA dentro de una transacción ya iniciada (`tx`), actualizando
   * `stock` (suma) y registrando el `movimientos_inventario`. Reutilizable desde
   * flujos atómicos de recepción de OC (Fase 7) sin anidar transacciones.
   *
   * `@param tx`        Cliente transaccional (Prisma.TransactionClient).
   * `@param params`    Datos de la entrada (artículo, cantidad, referencia, usuario).
   * `@returns          `{ stockAnterior, stockResultante }` para auditoría/cadenas.
   */
  async aplicarEntrada(
    tx: Prisma.TransactionClient,
    params: {
      articuloId: string;
      cantidad: number;
      motivo?: string;
      referenciaTipo?: string;
      referenciaId?: string;
      creadoPor: string;
    },
  ): Promise<{ stockAnterior: number; stockResultante: number }> {
    const articulo = await tx.articulos_inventario.findFirst({
      where: { id: params.articuloId, eliminado_en: null },
    });

    if (!articulo) {
      throw new NotFoundException(
        `Artículo con id "${params.articuloId}" no encontrado`,
      );
    }

    const stockAnterior = Number(articulo.stock);
    const stockResultante = stockAnterior + params.cantidad;

    await tx.articulos_inventario.update({
      where: { id: params.articuloId },
      data: { stock: stockResultante },
    });

    await tx.movimientos_inventario.create({
      data: {
        id: randomUUID(),
        articulo_id: params.articuloId,
        tipo: 'ENTRADA',
        cantidad: params.cantidad,
        stock_resultante: stockResultante,
        motivo: params.motivo,
        referencia_tipo: params.referenciaTipo,
        referencia_id: params.referenciaId,
        fecha: new Date(),
        creado_por: params.creadoPor,
      },
    });

    return { stockAnterior, stockResultante };
  }


  // ────────────────────────────────────────────
  //  CATÁLOGOS (categorías, proveedores, unidades)
  // ────────────────────────────────────────────
  async findCatalogos() {
    const [categorias, proveedores, unidades] = await Promise.all([
      this.prisma.categorias_inventario.findMany({
        where: { activo: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.proveedores.findMany({
        where: { activo: true, eliminado_en: null },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.unidades_medida.findMany({
        where: { activo: true },
        select: { id: true, codigo: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
    ]);

    return { categorias, proveedores, unidades };
  }

  // ────────────────────────────────────────────
  //  ESTADÍSTICAS
  // ────────────────────────────────────────────
  async findStats() {
    const articulos = await this.prisma.articulos_inventario.findMany({
      where: { eliminado_en: null, activo: true },
      select: { stock: true, stock_minimo: true, precio_unitario: true },
    });

    const totalArticulos = articulos.length;
    const stockBajo = articulos.filter(
      (a) => Number(a.stock) <= Number(a.stock_minimo),
    ).length;
    const valorTotal = articulos.reduce(
      (acc, a) => acc + Number(a.stock) * Number(a.precio_unitario),
      0,
    );

    return {
      totalArticulos,
      stockBajo,
      valorTotal,
    };
  }

  // ────────────────────────────────────────────
  //  SERIALIZE: mapea Prisma → formato del front
  // ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(articulo: any) {
    return {
      id: articulo.id,
      codigo: articulo.codigo,
      nombre: articulo.nombre,
      stock: Number(articulo.stock),
      stockMinimo: Number(articulo.stock_minimo),
      precioUnitario: Number(articulo.precio_unitario),
      categoria: articulo.categorias_inventario?.nombre ?? '',
      categoriaId: articulo.categoria_id,
      proveedor: articulo.proveedores?.nombre ?? '',
      proveedorId: articulo.proveedor_id,
      unidad: articulo.unidades_medida?.nombre ?? articulo.unidades_medida?.codigo ?? '',
      unidadId: articulo.unidad_id,
      activo: articulo.activo,
      creadoEn: articulo.creado_en,
      actualizadoEn: articulo.actualizado_en,
    };
  }
}
