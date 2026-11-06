import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { QueryChecklistDto } from './dto/query-checklist.dto';

const ENTITY_TYPE = 'checklists_preoperacionales';
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';
const CHECKLIST_INCLUDE = {
  maquinas: { select: { codigo: true } },
  trabajadores: { select: { nombre: true } },
} as const;

/** Shape esperado por el frontend (packages/shared/types/maquinaria.ts). */
export interface ChecklistResponse {
  id: string;
  maquinaId: string;
  fecha: string;
  hora: string;
  operador: string;
  horometroInicial: number;
  nivelAceiteMotor: 'Correcto' | 'Bajo' | 'Exceso';
  nivelHidraulico: 'Correcto' | 'Bajo';
  fugasVisibles: boolean;
  estadoLlantasOrugas: 'Correcto' | 'Desgaste Severo' | 'Daño';
  lucesYAlarmas: 'Correcto' | 'Falla';
  sistemaFrenos: 'Correcto' | 'Falla';
  estado: 'Aprobado' | 'Con Falla';
  observaciones: string;
}

const NIVEL_ACEITE_UI_A_DB = { Correcto: 'CORRECTO', Bajo: 'BAJO', Exceso: 'EXCESO' } as const;
const NIVEL_BINARIO_UI_A_DB = { Correcto: 'CORRECTO', Bajo: 'BAJO' } as const;
const ESTADO_LLANTAS_UI_A_DB = { Correcto: 'CORRECTO', 'Desgaste Severo': 'DESGASTE_SEVERO', Daño: 'DANO' } as const;
const ESTADO_SISTEMA_UI_A_DB = { Correcto: 'CORRECTO', Falla: 'FALLA' } as const;

@Injectable()
export class ChecklistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /** Audita un fallo de negocio y lanza la excepción (el actor sale del JWT en el contexto de request). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fallir<A extends new (message: string) => any>(
    errorCode: string,
    Excepcion: A,
    message: string,
    metadata: Record<string, unknown>,
  ): Promise<never> {
    await this.auditService.log({
      action: AuditAction.CHECKLIST_REGISTRADO,
      entityType: ENTITY_TYPE,
      entityId: ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
      metadata,
    });
    throw new Excepcion(message);
  }

  async findAll(query: QueryChecklistDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.checklists_preoperacionalesWhereInput = { eliminado_en: null };
    if (query.maquinaId) where.maquinas = { codigo: query.maquinaId.trim() };
    if (query.estado) where.estado = query.estado === 'Aprobado' ? 'APROBADO' : 'CON_FALLA';

    const [items, total] = await Promise.all([
      this.prisma.checklists_preoperacionales.findMany({
        where,
        include: CHECKLIST_INCLUDE,
        orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.checklists_preoperacionales.count({ where }),
    ]);

    return {
      items: items.map((c) => this.toResponse(c)),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async create(dto: CreateChecklistDto, userId: string): Promise<ChecklistResponse> {
    const maquina = await this.prisma.maquinas.findFirst({
      where: { codigo: dto.maquinaId, eliminado_en: null },
      select: { id: true },
    });
    if (!maquina) {
      return this.fallir('MAQUINA_NO_ENCONTRADA', NotFoundException, `No existe la máquina "${dto.maquinaId}"`, {
        maquinaId: dto.maquinaId,
      });
    }
    const maquinaUuid = maquina.id;

    // Misma regla que el frontend, pero aquí es la que manda: el cliente
    // no decide si el checklist queda Aprobado o Con Falla.
    const tieneFalla =
      dto.fugasVisibles ||
      dto.nivelAceiteMotor === 'Bajo' ||
      dto.nivelHidraulico === 'Bajo' ||
      dto.sistemaFrenos === 'Falla' ||
      dto.lucesYAlarmas === 'Falla' ||
      dto.estadoLlantasOrugas === 'Daño';

    const trabajador = await this.prisma.trabajadores.findFirst({
      where: { nombre: dto.operador.trim(), eliminado_en: null },
    });

    // OJO: las columnas fecha/hora son @db.Date / @db.Time (sin timezone).
    // Prisma serializa un Date usando su representacion UTC, asi que un
    // `new Date()` directo desfasa la fecha/hora guardada respecto a la
    // hora local del servidor (ej. 8:17pm CDMX se guardaba como 02:17 del
    // dia SIGUIENTE). Se construyen explicitamente a partir de los
    // componentes locales para que lo que se guarda sea lo que de verdad
    // marco el reloj del servidor.
    const ahora = new Date();
    const fechaLocal = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const horaLocal = new Date(Date.UTC(1970, 0, 1, ahora.getHours(), ahora.getMinutes(), ahora.getSeconds()));

    const creado = await this.prisma.checklists_preoperacionales.create({
      data: {
        id: randomUUID(),
        maquina_id: maquinaUuid,
        fecha: fechaLocal,
        hora: horaLocal,
        operador_id: trabajador?.id,
        horometro_inicial: dto.horometroInicial,
        nivel_aceite_motor: NIVEL_ACEITE_UI_A_DB[dto.nivelAceiteMotor],
        nivel_hidraulico: NIVEL_BINARIO_UI_A_DB[dto.nivelHidraulico],
        fugas_visibles: dto.fugasVisibles,
        estado_llantas_orugas: ESTADO_LLANTAS_UI_A_DB[dto.estadoLlantasOrugas],
        luces_y_alarmas: ESTADO_SISTEMA_UI_A_DB[dto.lucesYAlarmas],
        sistema_frenos: ESTADO_SISTEMA_UI_A_DB[dto.sistemaFrenos],
        estado: tieneFalla ? 'CON_FALLA' : 'APROBADO',
        observaciones: dto.observaciones,
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: CHECKLIST_INCLUDE,
    });

    // El operador mostrado es el texto que capturó el usuario, exista o
    // no como Trabajador real todavía (catalogo aun no poblado).
    const serialized = { ...this.toResponse(creado), operador: dto.operador };
    await this.auditService.log({
      action: AuditAction.CHECKLIST_REGISTRADO,
      entityType: ENTITY_TYPE,
      entityId: creado.id,
      result: AuditResult.SUCCESS,
      // Un checklist con falla es una alerta para Mantenimiento: queda con WARNING.
      severity: tieneFalla ? 'WARNING' : 'INFO',
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });
    return serialized;
  }

  private toResponse(c: {
    id: string;
    codigo: string | null;
    maquinas: { codigo: string | null };
    fecha: Date;
    hora: Date;
    trabajadores: { nombre: string } | null;
    horometro_inicial: unknown;
    nivel_aceite_motor: string;
    nivel_hidraulico: string;
    fugas_visibles: boolean;
    estado_llantas_orugas: string;
    luces_y_alarmas: string;
    sistema_frenos: string;
    estado: string;
    observaciones: string | null;
  }): ChecklistResponse {
    const invNivelAceite = Object.fromEntries(Object.entries(NIVEL_ACEITE_UI_A_DB).map(([k, v]) => [v, k]));
    const invNivelBinario = Object.fromEntries(Object.entries(NIVEL_BINARIO_UI_A_DB).map(([k, v]) => [v, k]));
    const invLlantas = Object.fromEntries(Object.entries(ESTADO_LLANTAS_UI_A_DB).map(([k, v]) => [v, k]));
    const invSistema = Object.fromEntries(Object.entries(ESTADO_SISTEMA_UI_A_DB).map(([k, v]) => [v, k]));

    return {
      id: c.codigo ?? c.id,
      maquinaId: c.maquinas.codigo ?? '',
      fecha: c.fecha.toISOString().split('T')[0],
      hora: c.hora.toISOString().split('T')[1].slice(0, 5),
      operador: c.trabajadores?.nombre ?? '',
      horometroInicial: Number(c.horometro_inicial),
      nivelAceiteMotor: invNivelAceite[c.nivel_aceite_motor] as ChecklistResponse['nivelAceiteMotor'],
      nivelHidraulico: invNivelBinario[c.nivel_hidraulico] as ChecklistResponse['nivelHidraulico'],
      fugasVisibles: c.fugas_visibles,
      estadoLlantasOrugas: invLlantas[c.estado_llantas_orugas] as ChecklistResponse['estadoLlantasOrugas'],
      lucesYAlarmas: invSistema[c.luces_y_alarmas] as ChecklistResponse['lucesYAlarmas'],
      sistemaFrenos: invSistema[c.sistema_frenos] as ChecklistResponse['sistemaFrenos'],
      estado: c.estado === 'APROBADO' ? 'Aprobado' : 'Con Falla',
      observaciones: c.observaciones ?? '',
    };
  }
}
