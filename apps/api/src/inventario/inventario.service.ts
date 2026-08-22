import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticuloDto } from './dto/create-articulo.dto';
import { UpdateArticuloDto } from './dto/update-articulo.dto';
import { QueryArticulosDto } from './dto/query-articulos.dto';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { Prisma } from '@prisma/client';

/** Incluye relacion para el SELECT del front */
const ARTICULO_INCLUDE = {
  categorias_inventario: { select: { id: true, nombre: true } },
  proveedores: { select: { id: true, nombre: true } },
  unidades_medida: { select: { id: true, codigo: true, nombre: true } },
} as const;

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────
  //  LISTAR (con búsqueda, filtros y paginación)
  // ────────────────────────────────────────────
  async findAll(query: QueryArticulosDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.articulos_inventarioWhereInput = {
      eliminado_en: null,
      activo: true,
    };

    // Búsqueda por nombre, categoría o proveedor
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

    const [items, total] = await Promise.all([
      this.prisma.articulos_inventario.findMany({
        where,
        include: ARTICULO_INCLUDE,
        orderBy: { creado_en: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.articulos_inventario.count({ where }),
    ]);

    // Post-filtro de stock (Decimal no soporta comparación con ref en Prisma)
    let filtered = items;
    if (query.stockEstado === 'bajo') {
      filtered = items.filter(
        (a) => Number(a.stock) <= Number(a.stock_minimo),
      );
    } else if (query.stockEstado === 'ok') {
      filtered = items.filter(
        (a) => Number(a.stock) > Number(a.stock_minimo),
      );
    }

    return {
      items: filtered.map(this.serialize),
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
    // Verificar que la categoría exista
    const categoria = await this.prisma.categorias_inventario.findUnique({
      where: { id: dto.categoriaId },
    });
    if (!categoria) {
      throw new BadRequestException(
        `Categoría con id "${dto.categoriaId}" no encontrada`,
      );
    }

    // Verificar que el proveedor exista
    const proveedor = await this.prisma.proveedores.findFirst({
      where: { id: dto.proveedorId, eliminado_en: null },
    });
    if (!proveedor) {
      throw new BadRequestException(
        `Proveedor con id "${dto.proveedorId}" no encontrado`,
      );
    }

    // Verificar que la unidad exista
    const unidad = await this.prisma.unidades_medida.findUnique({
      where: { id: dto.unidadId },
    });
    if (!unidad) {
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

    return this.serialize(articulo);
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

    // Validar relaciones si se proporcionan
    if (dto.categoriaId) {
      const cat = await this.prisma.categorias_inventario.findUnique({
        where: { id: dto.categoriaId },
      });
      if (!cat) {
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

    return this.serialize(articulo);
  }

  // ────────────────────────────────────────────
  //  ELIMINAR (soft delete)
  // ────────────────────────────────────────────
  async remove(id: string) {
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

    return { message: 'Artículo eliminado exitosamente' };
  }

  // ────────────────────────────────────────────
  //  MOVIMIENTO DE STOCK (entrada/salida)
  // ────────────────────────────────────────────
  async crearMovimiento(dto: CreateMovimientoDto, userId: string) {
    const articulo = await this.prisma.articulos_inventario.findFirst({
      where: { id: dto.articuloId, eliminado_en: null },
    });

    if (!articulo) {
      throw new NotFoundException(
        `Artículo con id "${dto.articuloId}" no encontrado`,
      );
    }

    const stockActual = Number(articulo.stock);
    let nuevoStock: number;

    if (dto.tipo === 'ENTRADA') {
      nuevoStock = stockActual + dto.cantidad;
    } else {
      // SALIDA
      if (dto.cantidad > stockActual) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${stockActual}, solicitado: ${dto.cantidad}`,
        );
      }
      nuevoStock = stockActual - dto.cantidad;
    }

    // Transacción: actualizar stock + registrar movimiento
    await this.prisma.$transaction([
      this.prisma.articulos_inventario.update({
        where: { id: dto.articuloId },
        data: { stock: nuevoStock },
      }),
      this.prisma.movimientos_inventario.create({
        data: {
          id: randomUUID(),
          articulo_id: dto.articuloId,
          tipo: dto.tipo,
          cantidad: dto.cantidad,
          stock_resultante: nuevoStock,
          motivo: dto.motivo,
          referencia_tipo: dto.referenciaTipo,
          referencia_id: dto.referenciaId,
          fecha: new Date(),
          creado_por: userId,
        },
      }),
    ]);

    return {
      articuloId: dto.articuloId,
      tipo: dto.tipo,
      cantidad: dto.cantidad,
      stockAnterior: stockActual,
      stockResultante: nuevoStock,
    };
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
