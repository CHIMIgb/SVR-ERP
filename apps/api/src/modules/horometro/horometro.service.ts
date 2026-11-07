import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { esFechaFutura, hoyEnZona } from '../../common/validacion';
import { MaquinasService, TOPE_CATALOGO_MAQUINAS, UMBRAL_SERVICIO_HRS } from '../maquinas/maquinas.service';
import { CreateLecturaHorometroDto } from './dto/create-lectura-horometro.dto';
import { QueryLecturaHorometroDto } from './dto/query-lectura-horometro.dto';

/** Shape esperado por el frontend (packages/shared/types/operaciones.ts). */
export interface LecturaHorometroResponse {
  id: string;
  maquinaId: string;
  maquinaNombre: string;
  fecha: string;
  lecturaInicial: number;
  lecturaFinal: number;
  horasTrabajadas: number;
  /** Operador asignado a la máquina cuando se registró la lectura. */
  operador: string | null;
}

/** Avance de una máquina hacia su próximo servicio por horas (dato del último registro de Mantenimiento). */
export interface ServicioPorHorasResponse {
  maquinaId: string;
  nombre: string;
  horometro: number;
  proximoServicioHoras: number | null;
  /** Negativo = el servicio ya se pasó. null = sin servicio registrado en Mantenimiento. */
  horasRestantes: number | null;
}

const ENTITY_TYPE = 'lecturas_horometro';
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';
/** Una lectura es de un día: no puede sumar más horas que las del día. */
const HORAS_MAX_POR_LECTURA = 24;

const LECTURA_INCLUDE = {
  maquinas: { select: { id: true, codigo: true, nombre: true } },
  trabajadores: { select: { nombre: true } },
} as const;

type LecturaConRelaciones = Prisma.lecturas_horometroGetPayload<{ include: typeof LECTURA_INCLUDE }>;

const redondear2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class HorometroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly maquinasService: MaquinasService,
  ) {}

  /**
   * Audita un fallo de negocio y lanza la excepción correspondiente.
   * El actorUserId cae automáticamente del JWT en el contexto de request.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fallir<A extends new (message: string) => any>(
    entityId: string | null,
    errorCode: string,
    Excepcion: A,
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<never> {
    await this.auditService.log({
      action: AuditAction.HOROMETRO_REGISTRADO,
      entityType: ENTITY_TYPE,
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
      metadata: metadata ?? null,
    });
    throw new Excepcion(message);
  }

  async findAll(query: QueryLecturaHorometroDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.lecturas_horometroWhereInput = { eliminado_en: null };

    if (query.maquinaId) {
      // Por código y no por UUID: un código que no existe da una lista vacía, no un error de tipo uuid.
      where.maquinas = { codigo: query.maquinaId.trim() };
    }

    if (query.desde || query.hasta) {
      where.fecha = {
        ...(query.desde ? { gte: new Date(query.desde.slice(0, 10)) } : {}),
        ...(query.hasta ? { lte: new Date(query.hasta.slice(0, 10)) } : {}),
      };
    }

    if (query.search?.trim()) {
      const texto = query.search.trim();
      where.OR = [
        { maquinas: { codigo: { contains: texto, mode: 'insensitive' } } },
        { maquinas: { nombre: { contains: texto, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.lecturas_horometro.findMany({
        where,
        include: LECTURA_INCLUDE,
        orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lecturas_horometro.count({ where }),
    ]);

    return {
      items: items.map((l) => this.toResponse(l)),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  /**
   * Indicadores de la vista: necesitan TODAS las lecturas del día/semana (no solo la página visible),
   * por eso viven en su propio endpoint.
   */
  async findStats() {
    const hoy = hoyEnZona();
    const diaSemana = (new Date(`${hoy}T00:00:00Z`).getUTCDay() + 6) % 7; // 0 = lunes
    const lunes = new Date(`${hoy}T00:00:00Z`);
    lunes.setUTCDate(lunes.getUTCDate() - diaSemana);
    const fechaHoy = new Date(`${hoy}T00:00:00Z`);

    const [delDia, deLaSemana, maquinas, conLecturaHoy] = await Promise.all([
      this.prisma.lecturas_horometro.aggregate({
        where: { eliminado_en: null, fecha: fechaHoy },
        _sum: { horas_trabajadas: true },
        _count: { _all: true },
      }),
      this.prisma.lecturas_horometro.aggregate({
        where: { eliminado_en: null, fecha: { gte: lunes, lte: fechaHoy } },
        _sum: { horas_trabajadas: true },
      }),
      this.prisma.maquinas.findMany({
        where: { eliminado_en: null, activo: true },
        select: { id: true, codigo: true, nombre: true, horometro: true },
        orderBy: { codigo: 'asc' },
        take: TOPE_CATALOGO_MAQUINAS,
      }),
      this.prisma.lecturas_horometro.groupBy({
        by: ['maquina_id'],
        where: { eliminado_en: null, fecha: fechaHoy },
      }),
    ]);

    // Último servicio registrado por máquina: de ahí sale a qué horómetro toca el siguiente (misma regla que Flota
    // y Mantenimiento).
    const proximoPorMaquina = await this.maquinasService.proximoServicioPorMaquina(maquinas.map((m) => m.id));
    const idsConLecturaHoy = new Set(conLecturaHoy.map((l) => l.maquina_id));

    const servicios: ServicioPorHorasResponse[] = maquinas
      .map((m) => {
        const horometro = Number(m.horometro);
        const proximo = proximoPorMaquina.get(m.id) ?? null;
        return {
          maquinaId: m.codigo ?? m.id,
          nombre: m.nombre,
          horometro,
          proximoServicioHoras: proximo,
          horasRestantes: proximo === null ? null : redondear2(proximo - horometro),
        };
      })
      // Los más urgentes primero; los que no tienen servicio registrado, al final.
      .sort((a, b) => (a.horasRestantes ?? Infinity) - (b.horasRestantes ?? Infinity));

    return {
      fecha: hoy,
      horasHoy: redondear2(Number(delDia._sum.horas_trabajadas ?? 0)),
      lecturasHoy: delDia._count._all,
      horasSemana: redondear2(Number(deLaSemana._sum.horas_trabajadas ?? 0)),
      maquinasSinLecturaHoy: maquinas.filter((m) => !idsConLecturaHoy.has(m.id)).map((m) => m.codigo ?? m.id),
      umbralServicioHoras: UMBRAL_SERVICIO_HRS,
      serviciosProximos: servicios.filter((s) => s.horasRestantes !== null && s.horasRestantes <= UMBRAL_SERVICIO_HRS).length,
      servicios,
    };
  }

  async create(dto: CreateLecturaHorometroDto, userId: string): Promise<LecturaHorometroResponse> {
    const codigo = dto.maquinaId.trim();

    if (esFechaFutura(dto.fecha)) {
      return this.fallir(null, 'FECHA_FUTURA', BadRequestException, 'La fecha de la lectura no puede ser futura', {
        maquinaId: codigo,
        fecha: dto.fecha,
      });
    }
    if (dto.lecturaFinal < dto.lecturaInicial) {
      return this.fallir(null, 'LECTURA_INVALIDA', BadRequestException, 'La lectura final no puede ser menor a la lectura inicial', {
        maquinaId: codigo,
        lecturaInicial: dto.lecturaInicial,
        lecturaFinal: dto.lecturaFinal,
      });
    }
    const horasTrabajadas = redondear2(dto.lecturaFinal - dto.lecturaInicial);
    if (horasTrabajadas > HORAS_MAX_POR_LECTURA) {
      return this.fallir(
        null,
        'HORAS_EXCEDIDAS',
        BadRequestException,
        `Una lectura es de un solo día: no puede sumar más de ${HORAS_MAX_POR_LECTURA} h (son ${horasTrabajadas} h)`,
        { maquinaId: codigo, horasTrabajadas },
      );
    }

    const maquina = await this.prisma.maquinas.findFirst({
      where: { codigo, eliminado_en: null },
      select: { id: true, operador_id: true },
    });
    if (!maquina) {
      return this.fallir(null, 'MAQUINA_NO_ENCONTRADA', NotFoundException, `No existe la máquina "${codigo}"`, {
        maquinaId: codigo,
      });
    }

    const fecha = new Date(dto.fecha.slice(0, 10));
    const { creada, horometroAnterior, horometroNuevo } = await this.prisma.$transaction(async (tx) => {
      // Candado sobre la máquina: dos lecturas de la misma máquina al mismo tiempo se revisan una después de
      // la otra, así la segunda ve a la primera y no se cuela un rango repetido.
      const [fila] = await tx.$queryRaw<{ horometro: Prisma.Decimal }[]>`
        SELECT horometro FROM maquinas WHERE id = ${maquina.id}::uuid FOR UPDATE`;
      const anterior = Number(fila.horometro);

      // Rangos que se encimen (o la misma lectura repetida) ya están contados: no se registran dos veces.
      const traslape = await tx.lecturas_horometro.findFirst({
        where: {
          maquina_id: maquina.id,
          eliminado_en: null,
          OR: [
            { lectura_inicial: { lt: dto.lecturaFinal }, lectura_final: { gt: dto.lecturaInicial } },
            { lectura_inicial: dto.lecturaInicial, lectura_final: dto.lecturaFinal },
          ],
        },
        select: { id: true, fecha: true, lectura_inicial: true, lectura_final: true },
      });
      if (traslape) {
        return this.fallir(
          traslape.id,
          'LECTURA_TRASLAPADA',
          ConflictException,
          `Esas horas ya están registradas: la lectura del ${traslape.fecha.toISOString().slice(0, 10).split('-').reverse().join('/')} va de ` +
            `${Number(traslape.lectura_inicial)} a ${Number(traslape.lectura_final)} h`,
          { maquinaId: codigo, lecturaInicial: dto.lecturaInicial, lecturaFinal: dto.lecturaFinal },
        );
      }

      const nueva = await tx.lecturas_horometro.create({
        data: {
          id: randomUUID(),
          maquina_id: maquina.id,
          fecha,
          lectura_inicial: dto.lecturaInicial,
          lectura_final: dto.lecturaFinal,
          horas_trabajadas: horasTrabajadas,
          operador_id: maquina.operador_id,
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
        include: LECTURA_INCLUDE,
      });

      // El horómetro de la máquina avanza con la lectura (antes nunca cambiaba y Mantenimiento no veía los
      // servicios próximos). Una lectura atrasada que se captura tarde no lo regresa.
      const nuevo = Math.max(anterior, dto.lecturaFinal);
      if (nuevo !== anterior) {
        await tx.maquinas.update({
          where: { id: maquina.id },
          data: { horometro: nuevo, actualizado_por: userId, actualizado_en: new Date() },
        });
      }
      return { creada: nueva, horometroAnterior: anterior, horometroNuevo: nuevo };
    });

    const serialized = this.toResponse(creada);
    await this.auditService.log({
      action: AuditAction.HOROMETRO_REGISTRADO,
      entityType: ENTITY_TYPE,
      entityId: creada.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
      metadata: { horometroMaquinaAnterior: horometroAnterior, horometroMaquinaNuevo: horometroNuevo },
    });

    return serialized;
  }

  private toResponse(l: LecturaConRelaciones) {
    return {
      id: l.codigo ?? l.id,
      maquinaId: l.maquinas.codigo ?? l.maquinas.id,
      maquinaNombre: l.maquinas.nombre,
      fecha: l.fecha.toISOString().split('T')[0],
      lecturaInicial: Number(l.lectura_inicial),
      lecturaFinal: Number(l.lectura_final),
      horasTrabajadas: Number(l.horas_trabajadas),
      operador: l.trabajadores?.nombre ?? null,
    };
  }
}
