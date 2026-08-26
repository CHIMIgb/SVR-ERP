import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, EstadoAsistencia, EstadoHoraExtra, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MarcarEntradaDto } from './dto/marcar-entrada.dto';
import { MarcarSalidaDto } from './dto/marcar-salida.dto';
import { MarcarCuadrillaDto } from './dto/marcar-cuadrilla.dto';
import { RegistrarFaltaDto } from './dto/registrar-falta.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';
import { RegistrarHorasExtraDto } from './dto/registrar-horas-extra.dto';
import { QueryAsistenciaDto } from './dto/query-asistencia.dto';
import { QuerySemanalDto } from './dto/query-semanal.dto';

export interface HorasExtraResponse {
  id: string;
  inicio: string;
  fin?: string;
  horasCalculadas: number;
  tarifaPorHora: number;
  montoTotal: number;
  estado: 'En Curso' | 'Aprobado' | 'Pendiente' | 'Rechazado';
  motivo?: string;
  coordenadasInicio?: { lat: number; lng: number };
  coordenadasFin?: { lat: number; lng: number };
}

export interface RegistroAsistenciaResponse {
  id: string;
  trabajadorId: string;
  fecha: string;
  horaEntrada?: string;
  horaSalida?: string;
  estado: 'Puntual' | 'Retardo' | 'Falta' | 'Justificado' | 'No Presentado' | 'Salida Anticipada';
  ubicacion: string;
  coordenadas: { lat: number; lng: number };
  salidaCoordenadas?: { lat: number; lng: number };
  salidaUbicacion?: string;
  obraAsignada: string;
  obraCoordenadas: { lat: number; lng: number };
  distanciaMetros: number;
  radioPermitidoMetros: number;
  enSitio: boolean;
  precisionGpsMetros: number;
  dispositivo: string;
  horaMarcajeExacta?: string;
  horaSalidaExacta?: string;
  horasTrabajadasOrdinarias?: number;
  salidaAnticipada?: boolean;
  motivoSalidaAnticipada?: string;
  horasExtra?: HorasExtraResponse;
  bateria?: number;
  notas?: string;
}

export interface DiaAsistenciaSemanaResponse {
  dia: 'Lun' | 'Mar' | 'Mie' | 'Jue' | 'Vie' | 'Sab';
  fecha: string;
  estado: 'Puntual' | 'Retardo' | 'Falta' | 'Justificado' | 'Salida Anticipada' | 'Descanso';
  horaEntrada?: string;
  horaSalida?: string;
  horasTrabajadas: number;
  horasExtra?: number;
  enSitioGps: boolean;
  motivo?: string;
}

export interface AsistenciaSemanalResponse {
  trabajadorId: string;
  semana: string;
  dias: DiaAsistenciaSemanaResponse[];
  totalDiasAsistidos: number;
  totalFaltas: number;
  totalRetardos: number;
  totalHorasOrdinarias: number;
  totalHorasExtra: number;
}

const ESTADO_DB_A_UI: Record<EstadoAsistencia, RegistroAsistenciaResponse['estado']> = {
  PUNTUAL: 'Puntual',
  RETARDO: 'Retardo',
  FALTA: 'Falta',
  JUSTIFICADO: 'Justificado',
  NO_PRESENTADO: 'No Presentado',
  SALIDA_ANTICIPADA: 'Salida Anticipada',
};

const ESTADO_UI_A_DB: Record<string, EstadoAsistencia> = {
  Puntual: 'PUNTUAL',
  Retardo: 'RETARDO',
  Falta: 'FALTA',
  Justificado: 'JUSTIFICADO',
  'No Presentado': 'NO_PRESENTADO',
  'Salida Anticipada': 'SALIDA_ANTICIPADA',
};

const ESTADO_HORA_EXTRA_DB_A_UI: Record<EstadoHoraExtra, HorasExtraResponse['estado']> = {
  EN_CURSO: 'En Curso',
  APROBADO: 'Aprobado',
  PENDIENTE: 'Pendiente',
  RECHAZADO: 'Rechazado',
};

const DIAS_SEMANA: DiaAsistenciaSemanaResponse['dia'][] = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MESES_ABREV = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const TOLERANCIA_RETARDO_MINUTOS = 15;
const RADIO_DEFECTO_METROS = 2000;
const TARIFA_HORA_EXTRA_DEFECTO = 80;

const REGISTRO_INCLUDE = {
  horas_extra_asistencia: true,
} as const;

const ENTITY_TYPE = 'registros_asistencia';
const ENTITY_TYPE_HORAS_EXTRA = 'horas_extra_asistencia';
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

type RegistroConHorasExtra = Prisma.registros_asistenciaGetPayload<{ include: typeof REGISTRO_INCLUDE }>;

@Injectable()
export class AsistenciaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fallir<A extends new (message: string) => any>(
    action: AuditAction,
    entityType: string,
    entityId: string | null,
    errorCode: string,
    Excepcion: A,
    message: string,
  ): Promise<never> {
    await this.auditService.log({
      action,
      entityType,
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  // ────────────────────────────────────────────
  //  MARCAJE GPS
  // ────────────────────────────────────────────

  async marcarEntrada(dto: MarcarEntradaDto, userId: string): Promise<RegistroAsistenciaResponse> {
    const trabajador = await this.prisma.trabajadores.findFirst({
      where: { id: dto.trabajadorId, eliminado_en: null },
    });
    if (!trabajador) {
      return this.fallir(
        AuditAction.ASISTENCIA_ENTRADA_REGISTRADA,
        ENTITY_TYPE,
        null,
        'TRABAJADOR_NO_ENCONTRADO',
        NotFoundException,
        `Trabajador con id "${dto.trabajadorId}" no encontrado`,
      );
    }

    const obra = await this.prisma.obras.findFirst({ where: { id: dto.obraId, eliminado_en: null } });
    if (!obra) {
      return this.fallir(
        AuditAction.ASISTENCIA_ENTRADA_REGISTRADA,
        ENTITY_TYPE,
        null,
        'OBRA_NO_ENCONTRADA',
        NotFoundException,
        `Obra con id "${dto.obraId}" no encontrada`,
      );
    }

    const hoy = this.fechaHoy();
    const existente = await this.prisma.registros_asistencia.findFirst({
      where: { trabajador_id: dto.trabajadorId, fecha: hoy, eliminado_en: null },
    });
    if (existente) {
      return this.fallir(
        AuditAction.ASISTENCIA_ENTRADA_REGISTRADA,
        ENTITY_TYPE,
        existente.id,
        'YA_REGISTRO_ENTRADA_HOY',
        BadRequestException,
        'Este trabajador ya tiene una entrada registrada hoy',
      );
    }

    const radioPermitido = dto.radioPermitidoMetros ?? RADIO_DEFECTO_METROS;
    const distancia = this.distanciaMetros(dto.lat, dto.lng, dto.obraLat, dto.obraLng);
    const enSitio = distancia <= radioPermitido;
    const ahora = new Date();
    const estado = this.esRetardo(ahora, trabajador.entrada) ? 'RETARDO' : 'PUNTUAL';

    const id = randomUUID();
    const registro = await this.prisma.registros_asistencia.create({
      data: {
        id,
        codigo: await this.generarCodigo(),
        trabajador_id: dto.trabajadorId,
        fecha: hoy,
        estado,
        ubicacion: dto.ubicacion?.trim() || `${obra.nombre} (Acceso principal)`,
        lat_entrada: dto.lat,
        lng_entrada: dto.lng,
        obra_asignada: obra.nombre,
        obra_id: obra.id,
        lat_obra: dto.obraLat,
        lng_obra: dto.obraLng,
        distancia_metros: distancia,
        radio_permitido_metros: radioPermitido,
        en_sitio: enSitio,
        precision_gps_metros: dto.precisionGpsMetros ?? 10,
        dispositivo: dto.dispositivo,
        hora_entrada: this.horaActualUtc(ahora),
        hora_marcaje_exacta: this.horaActualUtcConSegundos(ahora),
        bateria: dto.bateria,
        notas: dto.notas,
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: ahora,
      },
      include: REGISTRO_INCLUDE,
    });

    const serializado = this.toResponse(registro);
    await this.auditService.log({
      action: AuditAction.ASISTENCIA_ENTRADA_REGISTRADA,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serializado,
    });

    return serializado;
  }

  async marcarSalida(dto: MarcarSalidaDto, userId: string): Promise<RegistroAsistenciaResponse> {
    const trabajador = await this.prisma.trabajadores.findFirst({
      where: { id: dto.trabajadorId, eliminado_en: null },
    });
    if (!trabajador) {
      return this.fallir(
        AuditAction.ASISTENCIA_SALIDA_REGISTRADA,
        ENTITY_TYPE,
        null,
        'TRABAJADOR_NO_ENCONTRADO',
        NotFoundException,
        `Trabajador con id "${dto.trabajadorId}" no encontrado`,
      );
    }

    const hoy = this.fechaHoy();
    const registro = await this.prisma.registros_asistencia.findFirst({
      where: { trabajador_id: dto.trabajadorId, fecha: hoy, eliminado_en: null },
    });
    if (!registro || !registro.hora_entrada) {
      return this.fallir(
        AuditAction.ASISTENCIA_SALIDA_REGISTRADA,
        ENTITY_TYPE,
        registro?.id ?? null,
        'SIN_ENTRADA_PREVIA',
        BadRequestException,
        'El trabajador no tiene una entrada registrada hoy',
      );
    }
    if (registro.hora_salida) {
      return this.fallir(
        AuditAction.ASISTENCIA_SALIDA_REGISTRADA,
        ENTITY_TYPE,
        registro.id,
        'YA_REGISTRO_SALIDA_HOY',
        BadRequestException,
        'Este trabajador ya tiene una salida registrada hoy',
      );
    }

    const ahora = new Date();
    const horas =
      dto.horasTrabajadasOrdinarias ?? this.horasEntreHoras(registro.hora_entrada, this.horaActualUtc(ahora));
    const salidaAnticipada = dto.salidaAnticipada ?? false;

    const actualizado = await this.prisma.registros_asistencia.update({
      where: { id: registro.id },
      data: {
        hora_salida: this.horaActualUtc(ahora),
        hora_salida_exacta: this.horaActualUtcConSegundos(ahora),
        lat_salida: dto.lat,
        lng_salida: dto.lng,
        salida_ubicacion: dto.ubicacion?.trim() || `${registro.obra_asignada} (Salida registrada)`,
        horas_trabajadas_ordinarias: horas,
        salida_anticipada: salidaAnticipada,
        motivo_salida_anticipada: salidaAnticipada ? dto.motivoSalidaAnticipada : null,
        estado: salidaAnticipada ? 'SALIDA_ANTICIPADA' : registro.estado,
        actualizado_por: userId,
        actualizado_en: ahora,
      },
      include: REGISTRO_INCLUDE,
    });

    const serializado = this.toResponse(actualizado);
    await this.auditService.log({
      action: AuditAction.ASISTENCIA_SALIDA_REGISTRADA,
      entityType: ENTITY_TYPE,
      entityId: registro.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serializado,
    });

    return serializado;
  }

  async marcarCuadrilla(
    dto: MarcarCuadrillaDto,
    userId: string,
  ): Promise<{ creados: RegistroAsistenciaResponse[]; omitidos: string[] }> {
    const obra = await this.prisma.obras.findFirst({ where: { id: dto.obraId, eliminado_en: null } });
    if (!obra) {
      return this.fallir(
        AuditAction.ASISTENCIA_CUADRILLA_REGISTRADA,
        ENTITY_TYPE,
        null,
        'OBRA_NO_ENCONTRADA',
        NotFoundException,
        `Obra con id "${dto.obraId}" no encontrada`,
      );
    }

    const idsUnicos = Array.from(new Set(dto.trabajadorIds));
    const trabajadores = await this.prisma.trabajadores.findMany({
      where: { id: { in: idsUnicos }, eliminado_en: null },
    });
    if (trabajadores.length !== idsUnicos.length) {
      const encontrados = new Set(trabajadores.map((t) => t.id));
      const faltantes = idsUnicos.filter((id) => !encontrados.has(id));
      return this.fallir(
        AuditAction.ASISTENCIA_CUADRILLA_REGISTRADA,
        ENTITY_TYPE,
        null,
        'TRABAJADORES_NO_ENCONTRADOS',
        NotFoundException,
        `No existen los trabajadores: ${faltantes.join(', ')}`,
      );
    }

    const hoy = this.fechaHoy();
    const existentes = await this.prisma.registros_asistencia.findMany({
      where: { trabajador_id: { in: idsUnicos }, fecha: hoy, eliminado_en: null },
      select: { trabajador_id: true },
    });
    const yaRegistrados = new Set(existentes.map((e) => e.trabajador_id));

    const radioPermitido = dto.radioPermitidoMetros ?? RADIO_DEFECTO_METROS;
    const distancia = this.distanciaMetros(dto.lat, dto.lng, dto.obraLat, dto.obraLng);
    const enSitio = distancia <= radioPermitido;
    const ahora = new Date();
    const horaEntrada = this.horaActualUtc(ahora);
    const horaExacta = this.horaActualUtcConSegundos(ahora);

    const porRegistrar = trabajadores.filter((t) => !yaRegistrados.has(t.id));
    const creados: RegistroAsistenciaResponse[] = [];

    for (const trabajador of porRegistrar) {
      const estado = this.esRetardo(ahora, trabajador.entrada) ? 'RETARDO' : 'PUNTUAL';
      const id = randomUUID();
      const registro = await this.prisma.registros_asistencia.create({
        data: {
          id,
          codigo: await this.generarCodigo(),
          trabajador_id: trabajador.id,
          fecha: hoy,
          estado,
          ubicacion: dto.ubicacion?.trim() || `${obra.nombre} (Pase de lista por cuadrilla)`,
          lat_entrada: dto.lat,
          lng_entrada: dto.lng,
          obra_asignada: obra.nombre,
          obra_id: obra.id,
          lat_obra: dto.obraLat,
          lng_obra: dto.obraLng,
          distancia_metros: distancia,
          radio_permitido_metros: radioPermitido,
          en_sitio: enSitio,
          precision_gps_metros: dto.precisionGpsMetros ?? 10,
          dispositivo: dto.dispositivo,
          hora_entrada: horaEntrada,
          hora_marcaje_exacta: horaExacta,
          notas: 'Pase de lista por lote de cuadrilla validado en sitio.',
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: ahora,
        },
        include: REGISTRO_INCLUDE,
      });
      creados.push(this.toResponse(registro));
    }

    await this.auditService.log({
      action: AuditAction.ASISTENCIA_CUADRILLA_REGISTRADA,
      entityType: ENTITY_TYPE,
      entityId: obra.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { obraId: obra.id, creados: creados.map((c) => c.id), omitidos: Array.from(yaRegistrados) },
    });

    return { creados, omitidos: Array.from(yaRegistrados) };
  }

  async registrarFalta(dto: RegistrarFaltaDto, userId: string): Promise<RegistroAsistenciaResponse> {
    const trabajador = await this.prisma.trabajadores.findFirst({
      where: { id: dto.trabajadorId, eliminado_en: null },
    });
    if (!trabajador) {
      return this.fallir(
        AuditAction.ASISTENCIA_FALTA_REGISTRADA,
        ENTITY_TYPE,
        null,
        'TRABAJADOR_NO_ENCONTRADO',
        NotFoundException,
        `Trabajador con id "${dto.trabajadorId}" no encontrado`,
      );
    }

    const fecha = dto.fecha ? this.soloFecha(new Date(dto.fecha)) : this.fechaHoy();
    const existente = await this.prisma.registros_asistencia.findFirst({
      where: { trabajador_id: dto.trabajadorId, fecha, eliminado_en: null },
    });
    if (existente) {
      return this.fallir(
        AuditAction.ASISTENCIA_FALTA_REGISTRADA,
        ENTITY_TYPE,
        existente.id,
        'YA_REGISTRO_HOY',
        BadRequestException,
        'Este trabajador ya tiene un registro de asistencia en esa fecha',
      );
    }

    const id = randomUUID();
    const ahora = new Date();
    const registro = await this.prisma.registros_asistencia.create({
      data: {
        id,
        codigo: await this.generarCodigo(),
        trabajador_id: dto.trabajadorId,
        fecha,
        estado: 'FALTA',
        ubicacion: 'Sin marcaje registrado',
        lat_entrada: 0,
        lng_entrada: 0,
        obra_asignada: 'Por definir',
        lat_obra: 0,
        lng_obra: 0,
        distancia_metros: 0,
        radio_permitido_metros: RADIO_DEFECTO_METROS,
        en_sitio: false,
        precision_gps_metros: 0,
        dispositivo: 'No reportado',
        notas: dto.notas?.trim() || 'Inasistencia confirmada por el supervisor.',
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: ahora,
      },
      include: REGISTRO_INCLUDE,
    });

    const serializado = this.toResponse(registro);
    await this.auditService.log({
      action: AuditAction.ASISTENCIA_FALTA_REGISTRADA,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serializado,
    });

    return serializado;
  }

  async actualizarEstado(id: string, dto: ActualizarEstadoDto, userId: string): Promise<RegistroAsistenciaResponse> {
    const existente = await this.prisma.registros_asistencia.findFirst({
      where: { id, eliminado_en: null },
      include: REGISTRO_INCLUDE,
    });
    if (!existente) {
      return this.fallir(
        AuditAction.ASISTENCIA_ESTADO_ACTUALIZADO,
        ENTITY_TYPE,
        id,
        'REGISTRO_NO_ENCONTRADO',
        NotFoundException,
        `Registro de asistencia con id "${id}" no encontrado`,
      );
    }

    const actualizado = await this.prisma.registros_asistencia.update({
      where: { id },
      data: {
        estado: ESTADO_UI_A_DB[dto.estado],
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: REGISTRO_INCLUDE,
    });

    const serializado = this.toResponse(actualizado);
    await this.auditService.log({
      action: AuditAction.ASISTENCIA_ESTADO_ACTUALIZADO,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.toResponse(existente),
      newValue: serializado,
    });

    return serializado;
  }

  // ────────────────────────────────────────────
  //  HORAS EXTRA
  // ────────────────────────────────────────────

  async registrarHorasExtra(
    registroId: string,
    dto: RegistrarHorasExtraDto,
    userId: string,
  ): Promise<RegistroAsistenciaResponse> {
    const registro = await this.prisma.registros_asistencia.findFirst({
      where: { id: registroId, eliminado_en: null },
    });
    if (!registro) {
      return this.fallir(
        AuditAction.ASISTENCIA_HORAS_EXTRA_REGISTRADAS,
        ENTITY_TYPE_HORAS_EXTRA,
        null,
        'REGISTRO_NO_ENCONTRADO',
        NotFoundException,
        `Registro de asistencia con id "${registroId}" no encontrado`,
      );
    }

    const trabajador = await this.prisma.trabajadores.findFirst({ where: { id: registro.trabajador_id } });
    const tarifa = dto.tarifaPorHora ?? Number(trabajador?.tarifa_hora_extra ?? TARIFA_HORA_EXTRA_DEFECTO);
    const monto = Number((dto.horasCalculadas * tarifa).toFixed(2));
    const estado: EstadoHoraExtra = dto.fin ? 'PENDIENTE' : 'EN_CURSO';
    const ahora = new Date();

    const horasExtra = await this.prisma.horas_extra_asistencia.upsert({
      where: { registro_asistencia_id: registroId },
      create: {
        id: randomUUID(),
        registro_asistencia_id: registroId,
        horas_calculadas: dto.horasCalculadas,
        tarifa_por_hora: tarifa,
        monto_total: monto,
        estado,
        motivo: dto.motivo,
        inicio: this.horaAUtc(dto.inicio),
        fin: dto.fin ? this.horaAUtc(dto.fin) : null,
        lat_inicio: dto.latInicio,
        lng_inicio: dto.lngInicio,
        lat_fin: dto.latFin,
        lng_fin: dto.lngFin,
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: ahora,
      },
      update: {
        horas_calculadas: dto.horasCalculadas,
        tarifa_por_hora: tarifa,
        monto_total: monto,
        estado,
        motivo: dto.motivo,
        inicio: this.horaAUtc(dto.inicio),
        fin: dto.fin ? this.horaAUtc(dto.fin) : null,
        lat_inicio: dto.latInicio,
        lng_inicio: dto.lngInicio,
        lat_fin: dto.latFin,
        lng_fin: dto.lngFin,
        actualizado_por: userId,
        actualizado_en: ahora,
      },
    });

    const actualizado = await this.prisma.registros_asistencia.findUniqueOrThrow({
      where: { id: registroId },
      include: REGISTRO_INCLUDE,
    });
    const serializado = this.toResponse(actualizado);

    await this.auditService.log({
      action: AuditAction.ASISTENCIA_HORAS_EXTRA_REGISTRADAS,
      entityType: ENTITY_TYPE_HORAS_EXTRA,
      entityId: horasExtra.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serializado.horasExtra,
    });

    return serializado;
  }

  async aprobarHorasExtra(horasExtraId: string, userId: string): Promise<RegistroAsistenciaResponse> {
    return this.resolverHorasExtra(horasExtraId, 'APROBADO', userId, AuditAction.ASISTENCIA_HORAS_EXTRA_APROBADAS);
  }

  async rechazarHorasExtra(horasExtraId: string, userId: string): Promise<RegistroAsistenciaResponse> {
    return this.resolverHorasExtra(horasExtraId, 'RECHAZADO', userId, AuditAction.ASISTENCIA_HORAS_EXTRA_RECHAZADAS);
  }

  private async resolverHorasExtra(
    horasExtraId: string,
    estado: EstadoHoraExtra,
    userId: string,
    action: AuditAction,
  ): Promise<RegistroAsistenciaResponse> {
    const horasExtra = await this.prisma.horas_extra_asistencia.findFirst({
      where: { id: horasExtraId, eliminado_en: null },
    });
    if (!horasExtra) {
      return this.fallir(
        action,
        ENTITY_TYPE_HORAS_EXTRA,
        horasExtraId,
        'HORAS_EXTRA_NO_ENCONTRADA',
        NotFoundException,
        `Registro de horas extra con id "${horasExtraId}" no encontrado`,
      );
    }

    await this.prisma.horas_extra_asistencia.update({
      where: { id: horasExtraId },
      data: { estado, aprobador_id: userId, actualizado_por: userId, actualizado_en: new Date() },
    });

    const actualizado = await this.prisma.registros_asistencia.findUniqueOrThrow({
      where: { id: horasExtra.registro_asistencia_id },
      include: REGISTRO_INCLUDE,
    });
    const serializado = this.toResponse(actualizado);

    await this.auditService.log({
      action,
      entityType: ENTITY_TYPE_HORAS_EXTRA,
      entityId: horasExtraId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serializado.horasExtra,
    });

    return serializado;
  }

  // ────────────────────────────────────────────
  //  CONSULTAS
  // ────────────────────────────────────────────

  async findAll(query: QueryAsistenciaDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 200);

    const where: Prisma.registros_asistenciaWhereInput = { eliminado_en: null };

    where.fecha = query.fecha ? this.soloFecha(new Date(query.fecha)) : this.fechaHoy();

    if (query.trabajadorId) where.trabajador_id = query.trabajadorId;
    if (query.obraId) where.obra_id = query.obraId;
    if (query.estado) where.estado = ESTADO_UI_A_DB[query.estado];
    if (query.enSitio !== undefined) where.en_sitio = query.enSitio === 'true';
    if (query.search) {
      where.OR = [
        { obra_asignada: { contains: query.search, mode: 'insensitive' } },
        { ubicacion: { contains: query.search, mode: 'insensitive' } },
        { trabajadores: { nombre: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.registros_asistencia.findMany({
        where,
        include: REGISTRO_INCLUDE,
        orderBy: { creado_en: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.registros_asistencia.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async findOne(id: string): Promise<RegistroAsistenciaResponse> {
    const registro = await this.prisma.registros_asistencia.findFirst({
      where: { id, eliminado_en: null },
      include: REGISTRO_INCLUDE,
    });
    if (!registro) {
      throw new NotFoundException(`Registro de asistencia con id "${id}" no encontrado`);
    }
    return this.toResponse(registro);
  }

  async findSemanal(query: QuerySemanalDto): Promise<AsistenciaSemanalResponse[]> {
    const fechaBase = query.fecha ? this.soloFecha(new Date(query.fecha)) : this.fechaHoy();
    const lunes = this.lunesDeLaSemana(fechaBase);
    const sabado = new Date(Date.UTC(lunes.getUTCFullYear(), lunes.getUTCMonth(), lunes.getUTCDate() + 5));
    const hoy = this.fechaHoy();

    const trabajadores = await this.prisma.trabajadores.findMany({
      where: {
        eliminado_en: null,
        estado: 'ACTIVO',
        ...(query.trabajadorId ? { id: query.trabajadorId } : {}),
      },
      orderBy: { nombre: 'asc' },
    });

    const registros = await this.prisma.registros_asistencia.findMany({
      where: {
        eliminado_en: null,
        trabajador_id: { in: trabajadores.map((t) => t.id) },
        fecha: { gte: lunes, lte: sabado },
      },
      include: REGISTRO_INCLUDE,
    });

    const registrosPorTrabajadorYDia = new Map<string, RegistroConHorasExtra>();
    for (const registro of registros) {
      const diaIndex = Math.round((registro.fecha.getTime() - lunes.getTime()) / 86400000);
      registrosPorTrabajadorYDia.set(`${registro.trabajador_id}:${diaIndex}`, registro);
    }

    const semanaLabel = this.formatSemana(lunes, sabado);

    return trabajadores.map((trabajador) => {
      const dias: DiaAsistenciaSemanaResponse[] = [];
      let totalDiasAsistidos = 0;
      let totalFaltas = 0;
      let totalRetardos = 0;
      let totalHorasOrdinarias = 0;
      let totalHorasExtra = 0;

      for (let i = 0; i < 6; i++) {
        const fechaDia = new Date(Date.UTC(lunes.getUTCFullYear(), lunes.getUTCMonth(), lunes.getUTCDate() + i));
        const registro = registrosPorTrabajadorYDia.get(`${trabajador.id}:${i}`);

        if (registro) {
          const estadoUi = ESTADO_DB_A_UI[registro.estado];
          const horasExtra = registro.horas_extra_asistencia
            ? Number(registro.horas_extra_asistencia.horas_calculadas)
            : undefined;

          dias.push({
            dia: DIAS_SEMANA[i],
            fecha: fechaDia.toISOString().split('T')[0],
            estado: estadoUi === 'No Presentado' ? 'Falta' : estadoUi,
            horaEntrada: this.horaUtcAString(registro.hora_entrada),
            horaSalida: this.horaUtcAString(registro.hora_salida),
            horasTrabajadas: registro.horas_trabajadas_ordinarias != null ? Number(registro.horas_trabajadas_ordinarias) : 0,
            horasExtra,
            enSitioGps: registro.en_sitio,
            motivo: registro.motivo_salida_anticipada ?? registro.horas_extra_asistencia?.motivo ?? undefined,
          });

          if (registro.estado === 'FALTA') totalFaltas++;
          else {
            totalDiasAsistidos++;
            if (registro.estado === 'RETARDO') totalRetardos++;
          }
          totalHorasOrdinarias += registro.horas_trabajadas_ordinarias != null ? Number(registro.horas_trabajadas_ordinarias) : 0;
          totalHorasExtra += horasExtra ?? 0;
        } else if (fechaDia.getTime() > hoy.getTime() || (trabajador.fecha_contratacion && fechaDia.getTime() < trabajador.fecha_contratacion.getTime())) {
          // Día futuro, o anterior a la fecha de contratación: no cuenta como falta.
          dias.push({
            dia: DIAS_SEMANA[i],
            fecha: fechaDia.toISOString().split('T')[0],
            estado: 'Descanso',
            horasTrabajadas: 0,
            enSitioGps: false,
          });
        } else {
          dias.push({
            dia: DIAS_SEMANA[i],
            fecha: fechaDia.toISOString().split('T')[0],
            estado: 'Falta',
            horasTrabajadas: 0,
            enSitioGps: false,
          });
          totalFaltas++;
        }
      }

      return {
        trabajadorId: trabajador.id,
        semana: semanaLabel,
        dias,
        totalDiasAsistidos,
        totalFaltas,
        totalRetardos,
        totalHorasOrdinarias: Number(totalHorasOrdinarias.toFixed(2)),
        totalHorasExtra: Number(totalHorasExtra.toFixed(2)),
      };
    });
  }

  // ────────────────────────────────────────────
  //  HELPERS
  // ────────────────────────────────────────────

  /**
   * "HH:mm" → Date anclado en UTC para columnas @db.Time. Ver nota en
   * trabajadores.service.ts sobre por qué no se usa el constructor directo.
   */
  private horaAUtc(hhmm: string): Date {
    const [horas, minutos] = hhmm.split(':').map(Number);
    return new Date(Date.UTC(1970, 0, 1, horas, minutos, 0));
  }

  /** Hora actual del servidor (zona configurada en TZ) anclada en UTC, sin segundos. */
  private horaActualUtc(ahora: Date): Date {
    return new Date(Date.UTC(1970, 0, 1, ahora.getHours(), ahora.getMinutes(), 0));
  }

  /** Igual que horaActualUtc pero conservando los segundos, para el marcaje exacto. */
  private horaActualUtcConSegundos(ahora: Date): Date {
    return new Date(Date.UTC(1970, 0, 1, ahora.getHours(), ahora.getMinutes(), ahora.getSeconds()));
  }

  private horaUtcAString(d: Date | null): string | undefined {
    if (!d) return undefined;
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  }

  /** Fecha de hoy (solo día, sin hora) según la zona horaria del servidor. */
  private fechaHoy(): Date {
    const ahora = new Date();
    return new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
  }

  /** Trunca un Date arbitrario a medianoche UTC, preservando el día calendario tal cual se recibió. */
  private soloFecha(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  /** Lunes (00:00 UTC) de la semana que contiene la fecha dada. */
  private lunesDeLaSemana(fecha: Date): Date {
    const dia = fecha.getUTCDay(); // 0=Dom, 1=Lun, ..., 6=Sáb
    const offset = (dia + 6) % 7; // días a retroceder hasta el lunes
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate() - offset));
  }

  private formatSemana(lunes: Date, sabado: Date): string {
    const inicio = `${lunes.getUTCDate()} ${MESES_ABREV[lunes.getUTCMonth()]}`;
    const fin = `${sabado.getUTCDate()} ${MESES_ABREV[sabado.getUTCMonth()]}`;
    return `${inicio} – ${fin} ${sabado.getUTCFullYear()}`;
  }

  /** ¿La hora actual excede la hora de entrada programada + tolerancia? */
  private esRetardo(ahora: Date, entradaProgramada: Date): boolean {
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const minutosProgramados = entradaProgramada.getUTCHours() * 60 + entradaProgramada.getUTCMinutes();
    return minutosAhora > minutosProgramados + TOLERANCIA_RETARDO_MINUTOS;
  }

  /** Horas decimales entre dos Time(0) anclados en UTC (mismo día calendario). */
  private horasEntreHoras(entrada: Date, salida: Date): number {
    const minutosEntrada = entrada.getUTCHours() * 60 + entrada.getUTCMinutes();
    const minutosSalida = salida.getUTCHours() * 60 + salida.getUTCMinutes();
    const horas = Math.max(0, minutosSalida - minutosEntrada) / 60;
    return Number(horas.toFixed(1));
  }

  /** Distancia en metros entre dos coordenadas GPS (fórmula de Haversine). */
  private distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // radio de la Tierra en metros
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  private async generarCodigo(): Promise<string> {
    const año = new Date().getFullYear();
    const inicioAño = new Date(Date.UTC(año, 0, 1));
    const count = await this.prisma.registros_asistencia.count({ where: { creado_en: { gte: inicioAño } } });
    return `ASI-${año}-${String(count + 1).padStart(4, '0')}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toResponse(r: any) {
    const he = r.horas_extra_asistencia;
    return {
      id: r.id,
      trabajadorId: r.trabajador_id,
      fecha: r.fecha.toISOString().split('T')[0],
      horaEntrada: this.horaUtcAString(r.hora_entrada),
      horaSalida: this.horaUtcAString(r.hora_salida),
      estado: ESTADO_DB_A_UI[r.estado as EstadoAsistencia],
      ubicacion: r.ubicacion,
      coordenadas: { lat: Number(r.lat_entrada), lng: Number(r.lng_entrada) },
      salidaCoordenadas:
        r.lat_salida != null && r.lng_salida != null ? { lat: Number(r.lat_salida), lng: Number(r.lng_salida) } : undefined,
      salidaUbicacion: r.salida_ubicacion ?? undefined,
      obraAsignada: r.obra_asignada,
      obraCoordenadas: { lat: Number(r.lat_obra), lng: Number(r.lng_obra) },
      distanciaMetros: Number(r.distancia_metros),
      radioPermitidoMetros: Number(r.radio_permitido_metros),
      enSitio: r.en_sitio,
      precisionGpsMetros: Number(r.precision_gps_metros),
      dispositivo: r.dispositivo,
      horaMarcajeExacta: this.horaSegundosAString(r.hora_marcaje_exacta),
      horaSalidaExacta: this.horaSegundosAString(r.hora_salida_exacta),
      horasTrabajadasOrdinarias: r.horas_trabajadas_ordinarias != null ? Number(r.horas_trabajadas_ordinarias) : undefined,
      salidaAnticipada: r.salida_anticipada,
      motivoSalidaAnticipada: r.motivo_salida_anticipada ?? undefined,
      horasExtra: he
        ? {
            id: he.id,
            inicio: this.horaUtcAString(he.inicio) as string,
            fin: this.horaUtcAString(he.fin),
            horasCalculadas: Number(he.horas_calculadas),
            tarifaPorHora: Number(he.tarifa_por_hora),
            montoTotal: Number(he.monto_total),
            estado: ESTADO_HORA_EXTRA_DB_A_UI[he.estado as EstadoHoraExtra],
            motivo: he.motivo ?? undefined,
            coordenadasInicio:
              he.lat_inicio != null && he.lng_inicio != null ? { lat: Number(he.lat_inicio), lng: Number(he.lng_inicio) } : undefined,
            coordenadasFin:
              he.lat_fin != null && he.lng_fin != null ? { lat: Number(he.lat_fin), lng: Number(he.lng_fin) } : undefined,
          }
        : undefined,
      bateria: r.bateria ?? undefined,
      notas: r.notas ?? undefined,
    };
  }

  private horaSegundosAString(d: Date | null): string | undefined {
    if (!d) return undefined;
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`;
  }
}
