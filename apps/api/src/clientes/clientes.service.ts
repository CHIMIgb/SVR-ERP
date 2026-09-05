import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Prisma,
  AuditAction,
  AuditResult,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClientesDto } from './dto/query-clientes.dto';

/** Placeholder para auditoría de fallos donde aún no hay entidad conocida. */
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Audita un fallo de negocio y lanza la excepción correspondiente.
   * El actorUserId cae automáticamente del JWT en el contexto de request.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fallir<A extends new (message: string) => any>(
    action: AuditAction,
    entityId: string | null,
    errorCode: string,
    Excepcion: A,
    message: string,
  ): Promise<never> {
    await this.auditService.log({
      action,
      entityType: 'clientes',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  // ────────────────────────────────────────────
  //  LISTAR (con búsqueda y paginación)
  // ────────────────────────────────────────────
  async findAll(query: QueryClientesDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.clientesWhereInput = {
      eliminado_en: null,
    };

    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        { empresa: { contains: query.search, mode: 'insensitive' } },
        { correo: { contains: query.search, mode: 'insensitive' } },
        { telefono: { contains: query.search, mode: 'insensitive' } },
        { rfc: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.clientes.findMany({
        where,
        orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.clientes.count({ where }),
    ]);

    return {
      items: items.map((item) => this.serialize(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ────────────────────────────────────────────
  //  ESTADÍSTICAS (alimentan las tarjetas)
  // ────────────────────────────────────────────
  async findStats() {
    const [totalClientes, clientesActivos, empresas] = await Promise.all([
      this.prisma.clientes.count({ where: { eliminado_en: null } }),
      this.prisma.clientes.count({
        where: { eliminado_en: null, activo: true },
      }),
      this.prisma.clientes.groupBy({
        by: ['empresa'],
        where: { eliminado_en: null },
      }),
    ]);

    return {
      totalClientes,
      clientesActivos,
      empresas: empresas.length,
    };
  }

  // ────────────────────────────────────────────
  //  OBTENER UNO
  // ────────────────────────────────────────────
  async findOne(id: string) {
    const cliente = await this.prisma.clientes.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!cliente) {
      return this.fallir(
        AuditAction.CLIENTE_ACTUALIZADO,
        id,
        'CLIENTE_NO_ENCONTRADO',
        NotFoundException,
        `Cliente con id "${id}" no encontrado`,
      );
    }

    return this.serialize(cliente!);
  }

  // ────────────────────────────────────────────
  //  CREAR
  // ────────────────────────────────────────────
  async create(dto: CreateClienteDto, userId: string) {
    const cliente = await this.prisma.clientes.create({
      data: {
        id: randomUUID(),
        nombre: dto.nombre.trim(),
        empresa: dto.empresa.trim(),
        correo: dto.correo.trim(),
        telefono: dto.telefono.trim(),
        rfc: dto.rfc?.trim() || null,
        activo: dto.activo ?? true,
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
    });

    const serialized = this.serialize(cliente);

    await this.auditService.log({
      action: AuditAction.CLIENTE_CREADO,
      entityType: 'clientes',
      entityId: cliente.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  ACTUALIZAR
  // ────────────────────────────────────────────
  async update(id: string, dto: UpdateClienteDto, userId: string) {
    const existente = await this.prisma.clientes.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.CLIENTE_ACTUALIZADO,
        id,
        'CLIENTE_NO_ENCONTRADO',
        NotFoundException,
        `Cliente con id "${id}" no encontrado`,
      );
    }

    const cliente = await this.prisma.clientes.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.empresa !== undefined && { empresa: dto.empresa.trim() }),
        ...(dto.correo !== undefined && { correo: dto.correo.trim() }),
        ...(dto.telefono !== undefined && { telefono: dto.telefono.trim() }),
        ...(dto.rfc !== undefined && { rfc: dto.rfc?.trim() || null }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
    });

    const serialized = this.serialize(cliente);

    await this.auditService.log({
      action: AuditAction.CLIENTE_ACTUALIZADO,
      entityType: 'clientes',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serialize(existente as never),
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  ELIMINAR (soft delete)
  // ────────────────────────────────────────────
  async remove(id: string, userId: string) {
    const existente = await this.prisma.clientes.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.CLIENTE_ELIMINADO,
        id,
        'CLIENTE_NO_ENCONTRADO',
        NotFoundException,
        `Cliente con id "${id}" no encontrado`,
      );
    }

    await this.prisma.clientes.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false },
    });

    await this.auditService.log({
      action: AuditAction.CLIENTE_ELIMINADO,
      entityType: 'clientes',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serialize(existente as never),
    });

    return { message: 'Cliente eliminado exitosamente' };
  }

  // ────────────────────────────────────────────
  //  PRIVADOS
  // ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(cliente: any) {
    return {
      id: cliente.id,
      codigo: cliente.codigo ?? null,
      nombre: cliente.nombre,
      empresa: cliente.empresa,
      correo: cliente.correo,
      telefono: cliente.telefono,
      rfc: cliente.rfc ?? null,
      activo: cliente.activo,
      creadoEn: cliente.creado_en?.toISOString?.() ?? cliente.creado_en,
      actualizadoEn:
        cliente.actualizado_en?.toISOString?.() ?? cliente.actualizado_en,
    };
  }
}
