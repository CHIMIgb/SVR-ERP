import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MaquinasService } from '../maquinas/maquinas.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';

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
    private readonly maquinasService: MaquinasService,
  ) {}

  async findAll(): Promise<ChecklistResponse[]> {
    const checklists = await this.prisma.checklists_preoperacionales.findMany({
      where: { eliminado_en: null },
      include: { maquinas: { select: { codigo: true } }, trabajadores: { select: { nombre: true } } },
      orderBy: { creado_en: 'desc' },
    });

    return checklists.map((c) => this.toResponse(c));
  }

  async create(dto: CreateChecklistDto): Promise<ChecklistResponse> {
    const mapa = await this.maquinasService.mapaCodigoAId();
    const maquinaUuid = mapa.get(dto.maquinaId);
    if (!maquinaUuid) throw new NotFoundException(`No existe la máquina "${dto.maquinaId}"`);

    // Misma regla que el frontend, pero aquí es la que manda: el cliente
    // no decide si el checklist queda Aprobado o Con Falla.
    const tieneFalla =
      dto.fugasVisibles ||
      dto.nivelAceiteMotor === 'Bajo' ||
      dto.nivelHidraulico === 'Bajo' ||
      dto.sistemaFrenos === 'Falla' ||
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
        // El formulario actual del frontend no captura luces y alarmas —
        // se asume Correcto salvo que se agregue ese campo a la UI.
        luces_y_alarmas: 'CORRECTO',
        sistema_frenos: ESTADO_SISTEMA_UI_A_DB[dto.sistemaFrenos],
        estado: tieneFalla ? 'CON_FALLA' : 'APROBADO',
        observaciones: dto.observaciones,
        actualizado_en: new Date(),
      },
      include: { maquinas: { select: { codigo: true } }, trabajadores: { select: { nombre: true } } },
    });

    // El operador mostrado es el texto que capturó el usuario, exista o
    // no como Trabajador real todavía (catalogo aun no poblado).
    return { ...this.toResponse(creado), operador: dto.operador };
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
