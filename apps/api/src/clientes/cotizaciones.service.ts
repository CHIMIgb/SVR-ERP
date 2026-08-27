import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AuditAction,
  AuditResult,
  EstadoCotizacion,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';

/** Placeholder para auditoría de fallos donde aún no hay entidad conocida. */
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

/** Etiqueta legible para cada estado de cotización. */
const ESTADO_LABELS: Record<EstadoCotizacion, string> = {
  [EstadoCotizacion.PENDIENTE]: 'Pendiente',
  [EstadoCotizacion.ACEPTADA]: 'Aceptada',
  [EstadoCotizacion.RECHAZADA]: 'Rechazada',
};

@Injectable()
export class CotizacionesService {
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
      entityType: 'cotizaciones',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  /** Valida que el cliente exista. Audita el fallo si no. */
  private async validarCliente(clienteId: string, action: AuditAction) {
    const cliente = await this.prisma.clientes.findFirst({
      where: { id: clienteId, eliminado_en: null },
      select: { id: true },
    });
    if (!cliente) {
      return this.fallir(
        action,
        clienteId,
        'CLIENTE_NO_ENCONTRADO',
        BadRequestException,
        `Cliente con id "${clienteId}" no encontrado`,
      );
    }
  }

  // ────────────────────────────────────────────
  //  HISTORIAL DE COTIZACIONES DEL CLIENTE
  // ────────────────────────────────────────────
  async findByCliente(clienteId: string) {
    await this.validarCliente(clienteId, AuditAction.COTIZACION_CREADA);

    const items = await this.prisma.cotizaciones.findMany({
      where: { cliente_id: clienteId, eliminado_en: null },
      orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
    });

    return { items: items.map((item) => this.serialize(item)) };
  }

  // ────────────────────────────────────────────
  //  CREAR COTIZACIÓN
  // ────────────────────────────────────────────
  async create(clienteId: string, dto: CreateCotizacionDto, userId: string) {
    await this.validarCliente(clienteId, AuditAction.COTIZACION_CREADA);

    const hoy = new Date(dto.fecha).toISOString().split('T')[0].replace(/-/g, '');
    const cotizacion = await this.prisma.cotizaciones.create({
      data: {
        id: randomUUID(),
        codigo: `COT-${hoy}-${randomUUID().slice(0, 6).toUpperCase()}`,
        cliente_id: clienteId,
        descripcion: dto.descripcion.trim(),
        monto: dto.monto,
        fecha: new Date(dto.fecha),
        estado: dto.estado ?? EstadoCotizacion.PENDIENTE,
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
    });

    const serialized = this.serialize(cotizacion);

    await this.auditService.log({
      action: AuditAction.COTIZACION_CREADA,
      entityType: 'cotizaciones',
      entityId: cotizacion.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  PRIVADOS
  // ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(cotizacion: any) {
    return {
      id: cotizacion.id,
      codigo: cotizacion.codigo ?? null,
      clienteId: cotizacion.cliente_id,
      descripcion: cotizacion.descripcion,
      monto: Number(cotizacion.monto),
      fecha:
        cotizacion.fecha instanceof Date
          ? cotizacion.fecha.toISOString().split('T')[0]
          : String(cotizacion.fecha).split('T')[0],
      estado:
        ESTADO_LABELS[cotizacion.estado as EstadoCotizacion] ?? cotizacion.estado,
      activo: cotizacion.activo,
      creadoEn: cotizacion.creado_en?.toISOString?.() ?? cotizacion.creado_en,
      actualizadoEn:
        cotizacion.actualizado_en?.toISOString?.() ?? cotizacion.actualizado_en,
    };
  }
}
