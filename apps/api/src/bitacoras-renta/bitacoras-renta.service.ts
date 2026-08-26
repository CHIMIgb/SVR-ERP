import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateBitacoraRentaDto } from './dto/create-bitacora-renta.dto';
import { UpdateBitacoraRentaDto } from './dto/update-bitacora-renta.dto';
import { QueryBitacorasRentaDto } from './dto/query-bitacoras-renta.dto';

export interface BitacoraRentaResponse {
  id: string;
  folio: string;
  trabajadorId: string;
  trabajadorNombre: string;
  maquinaId: string;
  maquinaNombre: string;
  fecha: string;
  cliente: string;
  obraUbicacion: string;
  horaInicio: string;
  horaFin: string;
  horasEfectivas: number;
  horasExtras: number;
  horometroInicial: number;
  horometroFinal: number;
  actividadRealizada: string;
  firmaCliente: { firmado: boolean; nombreResidente?: string; cargoResidente?: string; fechaFirma?: string };
  estadoCobro: 'Listo para Facturar' | 'Facturado' | 'Pendiente Firma';
  tarifaHoraRenta: number;
  importeTotalRenta: number;
}

const ESTADO_COBRO_DB_A_UI: Record<string, BitacoraRentaResponse['estadoCobro']> = {
  LISTO_FACTURAR: 'Listo para Facturar',
  FACTURADO: 'Facturado',
  PENDIENTE_FIRMA: 'Pendiente Firma',
};
const ESTADO_COBRO_UI_A_DB: Record<string, string> = {
  'Listo para Facturar': 'LISTO_FACTURAR',
  Facturado: 'FACTURADO',
  'Pendiente Firma': 'PENDIENTE_FIRMA',
};

const BITACORA_INCLUDE = {
  trabajadores: { select: { nombre: true } },
  maquinas: { select: { id: true, codigo: true, nombre: true } },
  clientes: { select: { nombre: true } },
  firmas_cliente: true,
} as const;

const ENTITY_TYPE = 'bitacoras_renta_diaria';
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class BitacorasRentaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

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
      entityType: ENTITY_TYPE,
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  async findAll(query: QueryBitacorasRentaDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.bitacoras_renta_diariaWhereInput = { eliminado_en: null };

    if (query.trabajadorId) where.trabajador_id = query.trabajadorId;
    if (query.maquinaId) where.maquinas = { codigo: query.maquinaId };
    if (query.search) {
      where.OR = [
        { folio: { contains: query.search, mode: 'insensitive' } },
        { obra_ubicacion: { contains: query.search, mode: 'insensitive' } },
        { clientes: { nombre: { contains: query.search, mode: 'insensitive' } } },
        { trabajadores: { nombre: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.bitacoras_renta_diaria.findMany({
        where,
        include: BITACORA_INCLUDE,
        orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bitacoras_renta_diaria.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async findOne(id: string): Promise<BitacoraRentaResponse> {
    const bitacora = await this.prisma.bitacoras_renta_diaria.findFirst({
      where: { id, eliminado_en: null },
      include: BITACORA_INCLUDE,
    });
    if (!bitacora) throw new NotFoundException(`Bitácora de renta con id "${id}" no encontrada`);
    return this.toResponse(bitacora);
  }

  async create(dto: CreateBitacoraRentaDto, userId: string): Promise<BitacoraRentaResponse> {
    if (dto.horometroFinal < dto.horometroInicial) {
      return this.fallir(
        AuditAction.BITACORA_RENTA_CREADA,
        null,
        'HOROMETRO_INVALIDO',
        BadRequestException,
        'El horómetro final no puede ser menor al inicial',
      );
    }

    const trabajador = await this.prisma.trabajadores.findFirst({ where: { id: dto.trabajadorId, eliminado_en: null } });
    if (!trabajador) {
      return this.fallir(
        AuditAction.BITACORA_RENTA_CREADA,
        null,
        'TRABAJADOR_NO_ENCONTRADO',
        NotFoundException,
        `No existe el trabajador con id "${dto.trabajadorId}"`,
      );
    }

    const maquina = await this.prisma.maquinas.findFirst({ where: { codigo: dto.maquinaId, eliminado_en: null } });
    if (!maquina) {
      return this.fallir(
        AuditAction.BITACORA_RENTA_CREADA,
        null,
        'MAQUINA_NO_ENCONTRADA',
        NotFoundException,
        `No existe la máquina "${dto.maquinaId}"`,
      );
    }

    const clienteId = await this.resolverCliente(dto.cliente);

    const horasTotal = dto.horasEfectivas + (dto.horasExtras ?? 0);
    const importeTotalRenta = Number((horasTotal * dto.tarifaHoraRenta).toFixed(2));
    const firmado = dto.firmado ?? false;
    const estadoCobro = firmado ? 'LISTO_FACTURAR' : 'PENDIENTE_FIRMA';

    const anio = new Date(dto.fecha).getFullYear();
    const totalAnio = await this.prisma.bitacoras_renta_diaria.count({
      where: { fecha: { gte: new Date(`${anio}-01-01`), lt: new Date(`${anio + 1}-01-01`) } },
    });
    const folio = `BIT-${anio}-${String(totalAnio + 1).padStart(3, '0')}`;

    const id = randomUUID();
    const now = new Date();

    const creada = await this.prisma.$transaction(async (tx) => {
      const nueva = await tx.bitacoras_renta_diaria.create({
        data: {
          id,
          folio,
          trabajador_id: dto.trabajadorId,
          maquina_id: maquina.id,
          fecha: new Date(dto.fecha),
          cliente_id: clienteId,
          obra_ubicacion: dto.obraUbicacion,
          hora_inicio: this.horaAUtc(dto.horaInicio),
          hora_fin: this.horaAUtc(dto.horaFin),
          horas_efectivas: dto.horasEfectivas,
          horas_extras: dto.horasExtras ?? 0,
          horometro_inicial: dto.horometroInicial,
          horometro_final: dto.horometroFinal,
          actividad_realizada: dto.actividadRealizada,
          estado_cobro: estadoCobro as never,
          tarifa_hora_renta: dto.tarifaHoraRenta,
          importe_total_renta: importeTotalRenta,
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: now,
        },
      });

      await tx.firmas_cliente.create({
        data: {
          id: randomUUID(),
          bitacora_id: id,
          firmado,
          nombre_residente: dto.nombreResidente,
          cargo_residente: dto.cargoResidente,
          fecha_firma: firmado ? now : undefined,
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: now,
        },
      });

      return nueva;
    });

    const completa = await this.prisma.bitacoras_renta_diaria.findUniqueOrThrow({
      where: { id: creada.id },
      include: BITACORA_INCLUDE,
    });
    const serialized = this.toResponse(completa);

    await this.auditService.log({
      action: AuditAction.BITACORA_RENTA_CREADA,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    return serialized;
  }

  async update(id: string, dto: UpdateBitacoraRentaDto, userId: string): Promise<BitacoraRentaResponse> {
    const existente = await this.prisma.bitacoras_renta_diaria.findFirst({
      where: { id, eliminado_en: null },
      include: BITACORA_INCLUDE,
    });
    if (!existente) {
      return this.fallir(
        AuditAction.BITACORA_RENTA_ACTUALIZADA,
        id,
        'BITACORA_NO_ENCONTRADA',
        NotFoundException,
        `Bitácora de renta con id "${id}" no encontrada`,
      );
    }

    const horometroInicialEfectivo = dto.horometroInicial ?? Number(existente.horometro_inicial);
    const horometroFinalEfectivo = dto.horometroFinal ?? Number(existente.horometro_final);
    if (horometroFinalEfectivo < horometroInicialEfectivo) {
      return this.fallir(
        AuditAction.BITACORA_RENTA_ACTUALIZADA,
        id,
        'HOROMETRO_INVALIDO',
        BadRequestException,
        'El horómetro final no puede ser menor al inicial',
      );
    }

    let maquinaId: string | undefined;
    if (dto.maquinaId) {
      const maquina = await this.prisma.maquinas.findFirst({ where: { codigo: dto.maquinaId, eliminado_en: null } });
      if (!maquina) {
        return this.fallir(
          AuditAction.BITACORA_RENTA_ACTUALIZADA,
          id,
          'MAQUINA_NO_ENCONTRADA',
          NotFoundException,
          `No existe la máquina "${dto.maquinaId}"`,
        );
      }
      maquinaId = maquina.id;
    }

    let clienteId: string | undefined;
    if (dto.cliente) {
      clienteId = await this.resolverCliente(dto.cliente);
    }

    const horasEfectivasEfectivo = dto.horasEfectivas ?? Number(existente.horas_efectivas);
    const horasExtrasEfectivo = dto.horasExtras ?? Number(existente.horas_extras);
    const tarifaEfectiva = dto.tarifaHoraRenta ?? Number(existente.tarifa_hora_renta);
    const importeTotalRenta = Number(((horasEfectivasEfectivo + horasExtrasEfectivo) * tarifaEfectiva).toFixed(2));

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.bitacoras_renta_diaria.update({
        where: { id },
        data: {
          ...(maquinaId && { maquina_id: maquinaId }),
          ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
          ...(clienteId && { cliente_id: clienteId }),
          ...(dto.obraUbicacion !== undefined && { obra_ubicacion: dto.obraUbicacion }),
          ...(dto.horaInicio !== undefined && { hora_inicio: this.horaAUtc(dto.horaInicio) }),
          ...(dto.horaFin !== undefined && { hora_fin: this.horaAUtc(dto.horaFin) }),
          ...(dto.horasEfectivas !== undefined && { horas_efectivas: dto.horasEfectivas }),
          ...(dto.horasExtras !== undefined && { horas_extras: dto.horasExtras }),
          ...(dto.horometroInicial !== undefined && { horometro_inicial: dto.horometroInicial }),
          ...(dto.horometroFinal !== undefined && { horometro_final: dto.horometroFinal }),
          ...(dto.actividadRealizada !== undefined && { actividad_realizada: dto.actividadRealizada }),
          tarifa_hora_renta: tarifaEfectiva,
          importe_total_renta: importeTotalRenta,
          ...(dto.estadoCobro !== undefined && { estado_cobro: ESTADO_COBRO_UI_A_DB[dto.estadoCobro] as never }),
          actualizado_por: userId,
          actualizado_en: now,
        },
      });

      if (dto.firmado !== undefined || dto.nombreResidente !== undefined || dto.cargoResidente !== undefined) {
        await tx.firmas_cliente.upsert({
          where: { bitacora_id: id },
          create: {
            id: randomUUID(),
            bitacora_id: id,
            firmado: dto.firmado ?? false,
            nombre_residente: dto.nombreResidente,
            cargo_residente: dto.cargoResidente,
            fecha_firma: dto.firmado ? now : undefined,
            creado_por: userId,
            actualizado_por: userId,
            actualizado_en: now,
          },
          update: {
            ...(dto.firmado !== undefined && { firmado: dto.firmado, fecha_firma: dto.firmado ? now : null }),
            ...(dto.nombreResidente !== undefined && { nombre_residente: dto.nombreResidente }),
            ...(dto.cargoResidente !== undefined && { cargo_residente: dto.cargoResidente }),
            actualizado_por: userId,
            actualizado_en: now,
          },
        });

        // Si se firma y el estado seguia pendiente, avanza automaticamente.
        if (dto.firmado && !dto.estadoCobro && existente.estado_cobro === 'PENDIENTE_FIRMA') {
          await tx.bitacoras_renta_diaria.update({ where: { id }, data: { estado_cobro: 'LISTO_FACTURAR' } });
        }
      }
    });

    const actualizada = await this.prisma.bitacoras_renta_diaria.findUniqueOrThrow({
      where: { id },
      include: BITACORA_INCLUDE,
    });
    const serialized = this.toResponse(actualizada);

    await this.auditService.log({
      action: AuditAction.BITACORA_RENTA_ACTUALIZADA,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.toResponse(existente),
      newValue: serialized,
    });

    return serialized;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const existente = await this.prisma.bitacoras_renta_diaria.findFirst({
      where: { id, eliminado_en: null },
      include: BITACORA_INCLUDE,
    });
    if (!existente) {
      return this.fallir(
        AuditAction.BITACORA_RENTA_ELIMINADA,
        id,
        'BITACORA_NO_ENCONTRADA',
        NotFoundException,
        `Bitácora de renta con id "${id}" no encontrada`,
      );
    }

    await this.prisma.bitacoras_renta_diaria.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false, actualizado_por: userId, actualizado_en: new Date() },
    });

    await this.auditService.log({
      action: AuditAction.BITACORA_RENTA_ELIMINADA,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.toResponse(existente),
    });

    return { message: 'Bitácora de renta eliminada exitosamente' };
  }

  /** Convierte "HH:mm" a un Date anclado en UTC para columnas @db.Time (ver nota en trabajadores.service.ts). */
  private horaAUtc(hhmm: string): Date {
    const [horas, minutos] = hhmm.split(':').map(Number);
    return new Date(Date.UTC(1970, 0, 1, horas, minutos, 0));
  }

  private async resolverCliente(nombre: string): Promise<string> {
    let cliente = await this.prisma.clientes.findFirst({ where: { nombre, eliminado_en: null } });
    if (!cliente) {
      cliente = await this.prisma.clientes.create({
        data: {
          id: randomUUID(),
          nombre,
          empresa: nombre,
          correo: '',
          telefono: '',
          actualizado_en: new Date(),
        },
      });
    }
    return cliente.id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toResponse(b: any) {
    return {
      id: b.id,
      folio: b.folio,
      trabajadorId: b.trabajador_id,
      trabajadorNombre: b.trabajadores.nombre,
      maquinaId: b.maquinas.codigo ?? b.maquinas.id,
      maquinaNombre: b.maquinas.nombre,
      fecha: b.fecha.toISOString().split('T')[0],
      cliente: b.clientes.nombre,
      obraUbicacion: b.obra_ubicacion,
      horaInicio: b.hora_inicio.toISOString().split('T')[1].slice(0, 5),
      horaFin: b.hora_fin.toISOString().split('T')[1].slice(0, 5),
      horasEfectivas: Number(b.horas_efectivas),
      horasExtras: Number(b.horas_extras),
      horometroInicial: Number(b.horometro_inicial),
      horometroFinal: Number(b.horometro_final),
      actividadRealizada: b.actividad_realizada,
      firmaCliente: {
        firmado: b.firmas_cliente?.firmado ?? false,
        nombreResidente: b.firmas_cliente?.nombre_residente ?? undefined,
        cargoResidente: b.firmas_cliente?.cargo_residente ?? undefined,
        fechaFirma: b.firmas_cliente?.fecha_firma?.toISOString() ?? undefined,
      },
      estadoCobro: ESTADO_COBRO_DB_A_UI[b.estado_cobro] ?? 'Pendiente Firma',
      tarifaHoraRenta: Number(b.tarifa_hora_renta),
      importeTotalRenta: Number(b.importe_total_renta),
    };
  }
}
