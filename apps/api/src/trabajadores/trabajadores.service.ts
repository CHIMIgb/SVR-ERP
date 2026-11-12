import { Injectable, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { esFechaFutura } from '../common/validacion';
import { TOPE_CATALOGO_MAQUINAS } from '../modules/maquinas/maquinas.service';
import { generarPinTemporal } from '../auth/pin/pin.validator';

/** Tope del catálogo de proyectos para los selects (datos maestros). */
const TOPE_CATALOGO_PROYECTOS = 500;
import { CreateTrabajadorDto } from './dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto';
import { QueryTrabajadoresDto } from './dto/query-trabajadores.dto';
import { LiquidarTrabajadorDto } from './dto/liquidar-trabajador.dto';

export interface TrabajadorResponse {
  id: string;
  nombre: string;
  puesto: string;
  categoriaPuesto: string;
  estado: 'Activo' | 'Inactivo' | 'Vacaciones';
  entrada: string;
  telefono: string;
  proyectos: string[];
  avatar: string;
  sueldoFiscal: number;
  sueldoEfectivo: number;
  metodoPago: 'Tarjeta' | 'Efectivo' | 'Mixto';
  maquinaAsignadaId?: string;
  maquinaAsignadaNombre?: string;
  estadoRenta?: string;
  clienteRentaActual?: string;
  licenciaODC3?: { tipo: string; vigencia: string; folio: string };
  fechaContratacion?: string;
  contactoEmergencia?: { nombre: string; telefono: string; parentesco: string };
  vacacionesDias?: number;
  horasExtraSemana?: number;
  tarifaHoraExtra?: number;
  descuentosSemana?: number;
  conceptoDescuento?: string;
}

const CATEGORIA_DB_A_UI: Record<string, string> = {
  Operador: 'Operador',
  Chofer: 'Chofer',
  Mecanico: 'Mecanico',
  Ingeniero: 'Ingeniero',
  Administrativo: 'Administrativo',
};

const ESTADO_UI_A_DB = { Activo: 'ACTIVO', Inactivo: 'INACTIVO', Vacaciones: 'VACACIONES' } as const;
const ESTADO_DB_A_UI: Record<string, TrabajadorResponse['estado']> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  VACACIONES: 'Vacaciones',
};

const METODO_UI_A_DB = { Tarjeta: 'TARJETA', Efectivo: 'EFECTIVO', Mixto: 'MIXTO' } as const;
const METODO_DB_A_UI: Record<string, TrabajadorResponse['metodoPago']> = {
  TARJETA: 'Tarjeta',
  EFECTIVO: 'Efectivo',
  MIXTO: 'Mixto',
};

const ESTADO_RENTA_DB_A_UI: Record<string, string> = {
  RENTADO_CLIENTE: 'Rentado a Cliente',
  EN_OBRA_PROPIA: 'En Obra Propia',
  DISPONIBLE_PATIO: 'Disponible en Patio',
};

const CATEGORIA_LICENCIA_UI_A_DB: Record<string, string> = {
  DC3: 'DC3',
  'Licencia Federal': 'LICENCIA_FEDERAL',
  'Certificado Técnico': 'CERTIFICADO_TECNICO',
  'Cédula Profesional': 'CEDULA_PROFESIONAL',
  Otro: 'OTRO',
};

const TRABAJADOR_INCLUDE = {
  categorias_puesto: { select: { nombre: true } },
  licencias_trabajador: true,
  contactos_emergencia: true,
  clientes: { select: { nombre: true } },
  trabajadores_proyectos: {
    where: { eliminado_en: null },
    include: { proyectos: { select: { nombre: true } } },
  },
} as const;

/** Credenciales del alta (§6.6-1/2): se entregan UNA VEZ en la respuesta del POST. */
export interface IdentidadAltaResponse {
  numeroEmpleado: string;
  /** PIN temporal en claro — SOLO aquí: nunca se guarda en claro ni va a la auditoría. */
  pinTemporal: string;
  temporalHasta: string;
}

const SALT_ROUNDS = 12;
const PIN_TEMPORAL_HORAS = 24;
/** Email técnico del alta: el login PWA es por numero_empleado + PIN (§6.4); el email solo debe ser único. */
const DOMINIO_EMAIL_PWA = 'pwa.svr-constructora.com';

/** Prefijo del numero_empleado por rol (§6.4: ADM-01, RES-014, TEC-007, COB-003, TRA-0142). */
const PREFIJO_ROL: Record<string, string> = {
  ADMINISTRADOR: 'ADM',
  RESIDENTE: 'RES',
  TECNICO: 'TEC',
  COBRANZA: 'COB',
  COBRADOR: 'COB',
  TRABAJADOR: 'TRA',
};

function prefijoDeRol(nombre: string): string {
  const base = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  if (PREFIJO_ROL[base]) return PREFIJO_ROL[base];
  const letras = base.replace(/[^A-Z]/g, '');
  return (letras.slice(0, 3) || 'USR');
}

const ENTITY_TYPE = 'trabajadores';
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

/**
 * Roles asignables desde el alta P14 (§6.6): activos, sin borrar y SIN
 * permisos del módulo sistema (con lo cual Administrador queda fuera —
 * review PR #18 #2: una cuenta con solo rrhh.trabajadores.crear no puede
 * fabricar un administrador con acceso total). Data-driven: si mañana se
 * crea otro rol con permisos de sistema, también queda excluido.
 */
const ROLES_ASIGNABLES_WHERE = {
  activo: true,
  eliminado_en: null,
  role_permissions: { none: { permissions: { modulo: 'sistema' } } },
} as const;

@Injectable()
export class TrabajadoresService {
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

  /**
   * Regla del cliente: "Solo efectivo" no lleva sueldo por transferencia y "Solo transferencia" no lleva efectivo.
   * Antes se aceptaba cualquier combinación, y Nómina mandaba a la dispersión SPEI a quien cobraba solo en efectivo.
   */
  private async exigirMetodoPagoCoherente(
    action: AuditAction,
    entityId: string | null,
    metodo: TrabajadorResponse['metodoPago'],
    sueldoFiscal: number,
    sueldoEfectivo: number,
  ): Promise<void> {
    if (metodo === 'Efectivo' && sueldoFiscal > 0) {
      return this.fallir(
        action,
        entityId,
        'METODO_PAGO_INCOHERENTE',
        BadRequestException,
        'Con pago solo en efectivo, el sueldo por transferencia debe ser 0',
      );
    }
    if (metodo === 'Tarjeta' && sueldoEfectivo > 0) {
      return this.fallir(
        action,
        entityId,
        'METODO_PAGO_INCOHERENTE',
        BadRequestException,
        'Con pago solo por transferencia, el sueldo en efectivo debe ser 0',
      );
    }
  }

  /**
   * Vínculo trabajador ↔ cuenta de acceso (P14): el alta une por persona
   * (mismo nombre y teléfono) — no hay FK. Solo lo consume el listado:
   * el botón "Reiniciar PIN" vive en la fila (review PR #18 #6).
   */
  private async vinculosAcceso(
    items: { nombre: string; telefono: string }[],
  ): Promise<Map<string, { usuarioId: string; numeroEmpleado: string | null }>> {
    const vacio = new Map<string, { usuarioId: string; numeroEmpleado: string | null }>();
    if (items.length === 0) return vacio;
    const personas = await this.prisma.personas.findMany({
      where: { OR: items.map((t) => ({ nombre: t.nombre, telefono: t.telefono })) },
      select: {
        nombre: true,
        telefono: true,
        users_users_persona_idTopersonas: {
          select: { id: true, numero_empleado: true, activo: true, eliminado_en: true },
        },
      },
    });
    const mapa = new Map<string, { usuarioId: string; numeroEmpleado: string | null }>();
    for (const p of personas) {
      const u = p.users_users_persona_idTopersonas;
      if (u && u.activo && !u.eliminado_en) {
        mapa.set(`${p.nombre}|${p.telefono}`, { usuarioId: u.id, numeroEmpleado: u.numero_empleado });
      }
    }
    return mapa;
  }

  async findAll(query: QueryTrabajadoresDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 12, 100);

    const where: Prisma.trabajadoresWhereInput = { eliminado_en: null };

    if (query.categoriaPuesto) {
      where.categorias_puesto = { nombre: query.categoriaPuesto };
    }
    if (query.estado) {
      where.estado = ESTADO_UI_A_DB[query.estado];
    }
    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        { puesto: { contains: query.search, mode: 'insensitive' } },
        { clientes: { nombre: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.trabajadores.findMany({
        where,
        include: TRABAJADOR_INCLUDE,
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trabajadores.count({ where }),
    ]);

    // Máquina asignada como operador — relación inversa, se resuelve en lote.
    const maquinas = await this.prisma.maquinas.findMany({
      where: { operador_id: { in: items.map((t) => t.id) }, eliminado_en: null },
      select: { id: true, codigo: true, nombre: true, operador_id: true },
      take: TOPE_CATALOGO_MAQUINAS,
    });
    const maquinaPorOperador = new Map(maquinas.map((m) => [m.operador_id as string, m]));

    // Vínculo con la cuenta de acceso (usuarioId/numeroEmpleado) para la acción "Reiniciar PIN".
    const vinculos = await this.vinculosAcceso(items);

    return {
      items: items.map((item) =>
        this.toResponse(item, maquinaPorOperador.get(item.id), vinculos.get(`${item.nombre}|${item.telefono}`)),
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string): Promise<TrabajadorResponse> {
    const trabajador = await this.prisma.trabajadores.findFirst({
      where: { id, eliminado_en: null },
      include: TRABAJADOR_INCLUDE,
    });
    if (!trabajador) {
      throw new NotFoundException(`Trabajador con id "${id}" no encontrado`);
    }

    const maquina = await this.prisma.maquinas.findFirst({
      where: { operador_id: id, eliminado_en: null },
      select: { id: true, codigo: true, nombre: true, operador_id: true },
    });

    return this.toResponse(trabajador, maquina ?? undefined);
  }

  /**
   * Catálogos que usa la vista de Trabajadores (alta, edición y bitácoras de renta), con el permiso de
   * RRHH. `/maquinas` y `/catalogos/proyectos` piden permisos de Maquinaria y de Operaciones que el rol
   * de RRHH no tiene: sin esto, RRHH no podía asignar máquina ni proyecto, ni capturar una bitácora.
   * Las máquinas traen su operador actual para avisar antes de reasignarla.
   */
  async catalogos() {
    const [maquinas, proyectos, residentes, roles] = await Promise.all([
      this.prisma.maquinas.findMany({
        where: { eliminado_en: null, codigo: { not: null } },
        select: { codigo: true, nombre: true, operador_id: true, trabajadores: { select: { nombre: true } } },
        orderBy: { codigo: 'asc' },
        take: TOPE_CATALOGO_MAQUINAS,
      }),
      // Catálogos para los selects (datos maestros): con tope, igual que el de máquinas.
      this.prisma.proyectos.findMany({
        where: { eliminado_en: null, activo: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
        take: TOPE_CATALOGO_PROYECTOS,
      }),
      // Encargados del alta P14 (§6.8): users activos con rol Residente.
      this.prisma.users.findMany({
        where: {
          activo: true,
          eliminado_en: null,
          users_roles_users_roles_user_idTousers: { some: { activo: true, roles: { nombre: 'Residente', activo: true } } },
        },
        select: { id: true, numero_empleado: true, personas_users_persona_idTopersonas: { select: { nombre: true } } },
        orderBy: { personas_users_persona_idTopersonas: { nombre: 'asc' } },
        take: TOPE_CATALOGO_PROYECTOS,
      }),
      // Rol de acceso del alta (§6.6): tabla pequeña, con tope igual que los demás catálogos.
      // Solo roles ASIGNABLES: sin Administrador ni roles con permisos de sistema.
      this.prisma.roles.findMany({
        where: ROLES_ASIGNABLES_WHERE,
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
        take: TOPE_CATALOGO_PROYECTOS,
      }),
    ]);

    return {
      maquinas: maquinas.map((m) => ({
        codigo: m.codigo as string,
        nombre: m.nombre,
        operadorId: m.operador_id ?? null,
        operadorNombre: m.trabajadores?.nombre ?? null,
      })),
      proyectos,
      residentes: residentes.map((r) => ({
        id: r.id,
        nombre: r.personas_users_persona_idTopersonas.nombre,
        numeroEmpleado: r.numero_empleado,
      })),
      roles,
    };
  }

  async create(dto: CreateTrabajadorDto, userId: string): Promise<TrabajadorResponse & { identidad?: IdentidadAltaResponse }> {
    if (esFechaFutura(dto.fechaContratacion)) {
      return this.fallir(
        AuditAction.TRABAJADOR_CREADO,
        null,
        'FECHA_INGRESO_FUTURA',
        BadRequestException,
        'La fecha de ingreso no puede ser futura',
      );
    }
    await this.exigirMetodoPagoCoherente(AuditAction.TRABAJADOR_CREADO, null, dto.metodoPago, dto.sueldoFiscal, dto.sueldoEfectivo);

    // Identidad PWA (§6.6-1): el alta SIEMPRE crea persona + user con PIN temporal de 24 h.
    const rol = await this.prisma.roles.findUnique({ where: { id: dto.rolId } });
    if (!rol || !rol.activo || rol.eliminado_en) {
      return this.fallir(
        AuditAction.TRABAJADOR_CREADO,
        null,
        'ROL_INVALIDO',
        BadRequestException,
        'Elige un rol de acceso válido para el trabajador',
      );
    }
    // El rol existe pero no es asignable (Administrador o con permisos de sistema):
    // una cuenta RRHH no puede fabricar un administrador con acceso total (PR #18 #2).
    const asignable = await this.prisma.roles.findFirst({ where: { id: rol.id, ...ROLES_ASIGNABLES_WHERE } });
    if (!asignable) {
      return this.fallir(
        AuditAction.TRABAJADOR_CREADO,
        null,
        'ROL_NO_ASIGNABLE',
        ForbiddenException,
        'El rol seleccionado no puede asignarse desde el alta de trabajadores',
      );
    }

    let encargadoId: string | undefined;
    if (dto.encargadoId) {
      const encargado = await this.prisma.users.findFirst({
        where: {
          id: dto.encargadoId,
          activo: true,
          eliminado_en: null,
          users_roles_users_roles_user_idTousers: { some: { activo: true, roles: { nombre: 'Residente', activo: true } } },
        },
        select: { id: true },
      });
      if (!encargado) {
        return this.fallir(
          AuditAction.TRABAJADOR_CREADO,
          null,
          'ENCARGADO_INVALIDO',
          BadRequestException,
          'El encargado debe ser un Residente activo',
        );
      }
      encargadoId = encargado.id;
    }

    const pinTemporal = generarPinTemporal();
    const pinHash = await bcrypt.hash(pinTemporal, SALT_ROUNDS);
    const temporalHasta = new Date(Date.now() + PIN_TEMPORAL_HORAS * 60 * 60 * 1000);
    // Contraseña inutilizable: nadie la conoce (el login PWA es numero_empleado + PIN).
    const passwordPlaceholder = await bcrypt.hash(randomUUID(), SALT_ROUNDS);

    const categoriaId = await this.resolverCategoriaPuesto(dto.categoriaPuesto);

    let maquinaId: string | undefined;
    // Si la máquina ya tenía operador, se le quita: queda registrado en la auditoría.
    let operadorDesplazadoId: string | null = null;
    if (dto.maquinaId) {
      const maquina = await this.prisma.maquinas.findFirst({
        where: { codigo: dto.maquinaId, eliminado_en: null },
      });
      if (!maquina) {
        return this.fallir(
          AuditAction.TRABAJADOR_CREADO,
          null,
          'MAQUINA_NO_ENCONTRADA',
          NotFoundException,
          `No existe la máquina "${dto.maquinaId}"`,
        );
      }
      maquinaId = maquina.id;
      operadorDesplazadoId = maquina.operador_id ?? null;
    }

    // Antes un proyecto inexistente se ignoraba en silencio y el alta quedaba sin proyecto.
    let proyectoId: string | undefined;
    if (dto.proyecto?.trim()) {
      const proyecto = await this.prisma.proyectos.findFirst({
        where: { nombre: dto.proyecto.trim(), eliminado_en: null, activo: true },
        select: { id: true },
      });
      if (!proyecto) {
        return this.fallir(
          AuditAction.TRABAJADOR_CREADO,
          null,
          'PROYECTO_NO_ENCONTRADO',
          NotFoundException,
          `No existe el proyecto "${dto.proyecto.trim()}"`,
        );
      }
      proyectoId = proyecto.id;
    }

    const trabajadorId = randomUUID();
    const now = new Date();
    const prefijo = prefijoDeRol(rol.nombre);

    const crearAlta = async (tx: Prisma.TransactionClient, prefijoRol: string) => {
      // Consecutivo por prefijo (§6.4): el índice único de numero_empleado es la verdad;
      // si dos altas en paralelo calculan el mismo número, la transacción reintenta.
      // Sufijo MÁS ALTO existente (no un conteo): con huecos en la numeración
      // (seed demo TEC-007..010, bajas) count+1 repetiría números ya asignados
      // y el reintento recalcularía el mismo choque para siempre (PR #18 #9).
      const existentes = await tx.users.findMany({
        where: { numero_empleado: { startsWith: `${prefijoRol}-` } },
        select: { numero_empleado: true },
      });
      const maxSufijo = existentes.reduce((max, u) => {
        const sufijo = parseInt((u.numero_empleado ?? '').slice(prefijoRol.length + 1), 10);
        return Number.isFinite(sufijo) && sufijo > max ? sufijo : max;
      }, 0);
      numero = `${prefijoRol}-${String(maxSufijo + 1).padStart(3, '0')}`;

      const nuevo = await tx.trabajadores.create({
        data: {
          id: trabajadorId,
          nombre: dto.nombre.trim(),
          puesto: dto.puesto.trim(),
          categoria_puesto_id: categoriaId,
          estado: 'ACTIVO',
          telefono: dto.telefono.trim(),
          entrada: this.horaAUtc(dto.entrada),
          avatar: this.iniciales(dto.nombre),
          sueldo_fiscal: dto.sueldoFiscal,
          sueldo_efectivo: dto.sueldoEfectivo,
          metodo_pago: METODO_UI_A_DB[dto.metodoPago],
          estado_renta: 'EN_OBRA_PROPIA',
          fecha_contratacion: new Date(dto.fechaContratacion),
          vacaciones_dias: dto.vacacionesDias,
          horas_extra_semana: dto.horasExtraSemana,
          tarifa_hora_extra: dto.tarifaHoraExtra,
          descuentos_semana: dto.descuentosSemana,
          concepto_descuento: dto.conceptoDescuento,
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: now,
        },
      });

      if (maquinaId) {
        await tx.maquinas.update({ where: { id: maquinaId }, data: { operador_id: trabajadorId } });
      }

      if (proyectoId) {
        await tx.trabajadores_proyectos.create({
          data: { trabajador_id: trabajadorId, proyecto_id: proyectoId, creado_por: userId },
        });
      }

      if (dto.licencia) {
        await tx.licencias_trabajador.create({
          data: {
            id: randomUUID(),
            trabajador_id: trabajadorId,
            tipo: dto.licencia.tipo,
            categoria: CATEGORIA_LICENCIA_UI_A_DB[dto.licencia.categoria] as never,
            folio: dto.licencia.folio,
            vigencia: dto.licencia.vigencia ? new Date(dto.licencia.vigencia) : undefined,
            vigencia_indefinida: dto.licencia.vigenciaIndefinida ?? false,
            creado_por: userId,
            actualizado_por: userId,
            actualizado_en: now,
          },
        });
      }

      if (dto.contactoEmergencia) {
        await tx.contactos_emergencia.create({
          data: {
            id: randomUUID(),
            trabajador_id: trabajadorId,
            nombre: dto.contactoEmergencia.nombre,
            telefono: dto.contactoEmergencia.telefono,
            parentesco: dto.contactoEmergencia.parentesco,
            creado_por: userId,
            actualizado_por: userId,
            actualizado_en: now,
          },
        });
      }

      // Identidad PWA (§6.4-6.6): persona + user con numero_empleado consecutivo,
      // PIN temporal de 24 h (ya hasheado) y el rol que eligió el administrativo.
      const personaId = randomUUID();
      const nuevoUserId = randomUUID();
      await tx.personas.create({
        data: {
          id: personaId,
          nombre: dto.nombre.trim(),
          telefono: dto.telefono.trim(),
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: now,
        },
      });
      await tx.users.create({
        data: {
          id: nuevoUserId,
          persona_id: personaId,
          // Email técnico (único por diseño); el login PWA es por numero_empleado + PIN.
          email: `${numero.toLowerCase()}@${DOMINIO_EMAIL_PWA}`,
          password_hash: passwordPlaceholder,
          numero_empleado: numero,
          pin_hash: pinHash,
          pin_temporal_hasta: temporalHasta,
          pin_cambiado_en: now,
          jefe_user_id: encargadoId,
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: now,
        },
      });
      await tx.users_roles.create({
        data: { id: randomUUID(), user_id: nuevoUserId, rol_id: rol.id, es_principal: true, asignado_por: userId },
      });

      return tx.trabajadores.findUniqueOrThrow({ where: { id: trabajadorId }, include: TRABAJADOR_INCLUDE });
    };

    // Alta con reintento: un choque de consecutivo (P2002 del unique) recorre la transacción completa.
    let creado: Awaited<ReturnType<typeof crearAlta>> | null = null;
    let numero = '';
    let chocoConsecutivo = false;
    for (let intento = 0; intento < 3; intento++) {
      try {
        creado = await this.prisma.$transaction((tx) => crearAlta(tx, prefijo));
        chocoConsecutivo = false;
        break;
      } catch (e) {
        chocoConsecutivo = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
        if (!chocoConsecutivo) throw e;
      }
    }
    if (creado === null || chocoConsecutivo) {
      return this.fallir(
        AuditAction.TRABAJADOR_CREADO,
        null,
        'NUMERO_EMPLEADO_DUPLICADO',
        ConflictException,
        'No se pudo generar el número de empleado: reintenta el alta',
      );
    }

    const identidad: IdentidadAltaResponse = {
      numeroEmpleado: numero,
      pinTemporal,
      temporalHasta: temporalHasta.toISOString(),
    };

    const maquina = maquinaId
      ? await this.prisma.maquinas.findUnique({ where: { id: maquinaId }, select: { id: true, codigo: true, nombre: true, operador_id: true } })
      : undefined;

    const serialized = this.toResponse(creado, maquina ?? undefined);

    await this.auditService.log({
      action: AuditAction.TRABAJADOR_CREADO,
      entityType: ENTITY_TYPE,
      entityId: trabajadorId,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      // El PIN temporal en claro NUNCA va a la auditoría (§8.9): solo el número y su vigencia.
      newValue: { ...serialized, identidad: { numeroEmpleado: numero, temporalHasta: identidad.temporalHasta } },
      ...(operadorDesplazadoId && {
        metadata: { maquinaReasignada: dto.maquinaId, operadorDesplazadoId },
      }),
    });

    return { ...serialized, identidad };
  }

  async update(id: string, dto: UpdateTrabajadorDto, userId: string): Promise<TrabajadorResponse> {
    const existente = await this.prisma.trabajadores.findFirst({
      where: { id, eliminado_en: null },
      include: TRABAJADOR_INCLUDE,
    });
    if (!existente) {
      return this.fallir(
        AuditAction.TRABAJADOR_ACTUALIZADO,
        id,
        'TRABAJADOR_NO_ENCONTRADO',
        NotFoundException,
        `Trabajador con id "${id}" no encontrado`,
      );
    }
    // Se revisa la combinación que quedaría (lo que se manda más lo que ya estaba guardado).
    await this.exigirMetodoPagoCoherente(
      AuditAction.TRABAJADOR_ACTUALIZADO,
      id,
      dto.metodoPago ?? METODO_DB_A_UI[existente.metodo_pago] ?? 'Mixto',
      dto.sueldoFiscal ?? Number(existente.sueldo_fiscal),
      dto.sueldoEfectivo ?? Number(existente.sueldo_efectivo),
    );

    // La baja solo la registra liquidar(): calcula el finiquito, libera la máquina y pide el permiso de
    // eliminar. Por PATCH (permiso de editar) se podía dar de baja sin finiquito o reactivar a alguien liquidado.
    if (dto.estado === 'Inactivo') {
      return this.fallir(
        AuditAction.TRABAJADOR_ACTUALIZADO,
        id,
        'BAJA_SOLO_CON_LIQUIDACION',
        BadRequestException,
        'Para dar de baja a un trabajador usa "Baja y finiquito"',
      );
    }
    if (existente.estado === 'INACTIVO') {
      const reactiva = dto.estado !== undefined;
      const asigna = !!dto.maquinaId?.trim() || !!dto.proyecto?.trim();
      if (reactiva || asigna) {
        return this.fallir(
          AuditAction.TRABAJADOR_ACTUALIZADO,
          id,
          'TRABAJADOR_DADO_DE_BAJA',
          ConflictException,
          reactiva
            ? `${existente.nombre} fue dado de baja y no se reactiva desde aquí`
            : `${existente.nombre} fue dado de baja: no se le asigna máquina ni proyecto`,
        );
      }
    }
    if (dto.fechaContratacion !== undefined && esFechaFutura(dto.fechaContratacion)) {
      return this.fallir(
        AuditAction.TRABAJADOR_ACTUALIZADO,
        id,
        'FECHA_INGRESO_FUTURA',
        BadRequestException,
        'La fecha de ingreso no puede ser futura',
      );
    }

    const maquinaAnterior = await this.prisma.maquinas.findFirst({
      where: { operador_id: id, eliminado_en: null },
      select: { id: true, codigo: true, nombre: true, operador_id: true },
    });

    let categoriaId: string | undefined;
    if (dto.categoriaPuesto) {
      categoriaId = await this.resolverCategoriaPuesto(dto.categoriaPuesto);
    }

    let nuevaMaquinaId: string | null | undefined;
    // Si la máquina nueva la tenía otro operador, se le quita: queda registrado en la auditoría.
    let operadorDesplazadoId: string | null = null;
    if (dto.maquinaId !== undefined) {
      if (dto.maquinaId === '') {
        nuevaMaquinaId = null;
      } else {
        const maquina = await this.prisma.maquinas.findFirst({
          where: { codigo: dto.maquinaId, eliminado_en: null },
        });
        if (!maquina) {
          return this.fallir(
            AuditAction.TRABAJADOR_ACTUALIZADO,
            id,
            'MAQUINA_NO_ENCONTRADA',
            NotFoundException,
            `No existe la máquina "${dto.maquinaId}"`,
          );
        }
        nuevaMaquinaId = maquina.id;
        if (maquina.operador_id && maquina.operador_id !== id) operadorDesplazadoId = maquina.operador_id;
      }
    }

    // Proyecto asignado (antes el PATCH lo ignoraba y el cambio no se guardaba): '' quita la asignación
    // y un nombre la reemplaza por ese proyecto. La vista maneja un solo proyecto por trabajador.
    let nuevoProyectoId: string | null | undefined;
    if (dto.proyecto !== undefined) {
      const nombreProyecto = dto.proyecto.trim();
      if (nombreProyecto === '') {
        nuevoProyectoId = null;
      } else {
        const proyecto = await this.prisma.proyectos.findFirst({
          where: { nombre: nombreProyecto, eliminado_en: null, activo: true },
          select: { id: true },
        });
        if (!proyecto) {
          return this.fallir(
            AuditAction.TRABAJADOR_ACTUALIZADO,
            id,
            'PROYECTO_NO_ENCONTRADO',
            NotFoundException,
            `No existe el proyecto "${nombreProyecto}"`,
          );
        }
        nuevoProyectoId = proyecto.id;
      }
    }

    const now = new Date();

    const actualizado = await this.prisma.$transaction(async (tx) => {
      await tx.trabajadores.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
          ...(dto.puesto !== undefined && { puesto: dto.puesto.trim() }),
          ...(categoriaId && { categoria_puesto_id: categoriaId }),
          ...(dto.estado !== undefined && { estado: ESTADO_UI_A_DB[dto.estado] }),
          ...(dto.telefono !== undefined && { telefono: dto.telefono.trim() }),
          ...(dto.entrada !== undefined && { entrada: this.horaAUtc(dto.entrada) }),
          ...(dto.sueldoFiscal !== undefined && { sueldo_fiscal: dto.sueldoFiscal }),
          ...(dto.sueldoEfectivo !== undefined && { sueldo_efectivo: dto.sueldoEfectivo }),
          ...(dto.metodoPago !== undefined && { metodo_pago: METODO_UI_A_DB[dto.metodoPago] }),
          ...(dto.fechaContratacion !== undefined && { fecha_contratacion: new Date(dto.fechaContratacion) }),
          ...(dto.vacacionesDias !== undefined && { vacaciones_dias: dto.vacacionesDias }),
          ...(dto.horasExtraSemana !== undefined && { horas_extra_semana: dto.horasExtraSemana }),
          ...(dto.tarifaHoraExtra !== undefined && { tarifa_hora_extra: dto.tarifaHoraExtra }),
          ...(dto.descuentosSemana !== undefined && { descuentos_semana: dto.descuentosSemana }),
          ...(dto.conceptoDescuento !== undefined && { concepto_descuento: dto.conceptoDescuento }),
          actualizado_por: userId,
          actualizado_en: now,
        },
      });

      if (nuevaMaquinaId !== undefined) {
        // Libera la máquina anterior (si tenía) y asigna la nueva (si aplica).
        if (maquinaAnterior && maquinaAnterior.id !== nuevaMaquinaId) {
          await tx.maquinas.update({ where: { id: maquinaAnterior.id }, data: { operador_id: null } });
        }
        if (nuevaMaquinaId) {
          await tx.maquinas.update({ where: { id: nuevaMaquinaId }, data: { operador_id: id } });
        }
      }

      if (nuevoProyectoId !== undefined) {
        // Soft-delete de las demás asignaciones; la PK es (trabajador, proyecto), así que una asignación
        // borrada antes se reactiva en vez de crearse de nuevo.
        await tx.trabajadores_proyectos.updateMany({
          where: {
            trabajador_id: id,
            eliminado_en: null,
            ...(nuevoProyectoId && { proyecto_id: { not: nuevoProyectoId } }),
          },
          data: { eliminado_en: now, activo: false, actualizado_por: userId },
        });
        if (nuevoProyectoId) {
          const asignacion = await tx.trabajadores_proyectos.findUnique({
            where: { trabajador_id_proyecto_id: { trabajador_id: id, proyecto_id: nuevoProyectoId } },
          });
          if (!asignacion) {
            await tx.trabajadores_proyectos.create({
              data: { trabajador_id: id, proyecto_id: nuevoProyectoId, creado_por: userId },
            });
          } else if (asignacion.eliminado_en) {
            await tx.trabajadores_proyectos.update({
              where: { trabajador_id_proyecto_id: { trabajador_id: id, proyecto_id: nuevoProyectoId } },
              data: { eliminado_en: null, activo: true, asignado_en: now, actualizado_por: userId },
            });
          }
        }
      }

      if (dto.licencia) {
        await tx.licencias_trabajador.upsert({
          where: { trabajador_id: id },
          create: {
            id: randomUUID(),
            trabajador_id: id,
            tipo: dto.licencia.tipo,
            categoria: CATEGORIA_LICENCIA_UI_A_DB[dto.licencia.categoria] as never,
            folio: dto.licencia.folio,
            vigencia: dto.licencia.vigencia ? new Date(dto.licencia.vigencia) : undefined,
            vigencia_indefinida: dto.licencia.vigenciaIndefinida ?? false,
            creado_por: userId,
            actualizado_por: userId,
            actualizado_en: now,
          },
          update: {
            tipo: dto.licencia.tipo,
            categoria: CATEGORIA_LICENCIA_UI_A_DB[dto.licencia.categoria] as never,
            folio: dto.licencia.folio,
            vigencia: dto.licencia.vigencia ? new Date(dto.licencia.vigencia) : undefined,
            vigencia_indefinida: dto.licencia.vigenciaIndefinida ?? false,
            actualizado_por: userId,
            actualizado_en: now,
          },
        });
      }

      if (dto.contactoEmergencia) {
        await tx.contactos_emergencia.upsert({
          where: { trabajador_id: id },
          create: {
            id: randomUUID(),
            trabajador_id: id,
            nombre: dto.contactoEmergencia.nombre,
            telefono: dto.contactoEmergencia.telefono,
            parentesco: dto.contactoEmergencia.parentesco,
            creado_por: userId,
            actualizado_por: userId,
            actualizado_en: now,
          },
          update: {
            nombre: dto.contactoEmergencia.nombre,
            telefono: dto.contactoEmergencia.telefono,
            parentesco: dto.contactoEmergencia.parentesco,
            actualizado_por: userId,
            actualizado_en: now,
          },
        });
      }

      return tx.trabajadores.findUniqueOrThrow({ where: { id }, include: TRABAJADOR_INCLUDE });
    });

    const maquinaFinal =
      nuevaMaquinaId === undefined
        ? maquinaAnterior
        : nuevaMaquinaId
          ? await this.prisma.maquinas.findUnique({ where: { id: nuevaMaquinaId }, select: { id: true, codigo: true, nombre: true, operador_id: true } })
          : null;

    const serialized = this.toResponse(actualizado, maquinaFinal ?? undefined);

    await this.auditService.log({
      action: AuditAction.TRABAJADOR_ACTUALIZADO,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.toResponse(existente, maquinaAnterior ?? undefined),
      newValue: serialized,
      ...(operadorDesplazadoId && {
        metadata: { maquinaReasignada: dto.maquinaId, operadorDesplazadoId },
      }),
    });

    return serialized;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const existente = await this.prisma.trabajadores.findFirst({
      where: { id, eliminado_en: null },
      include: TRABAJADOR_INCLUDE,
    });
    if (!existente) {
      return this.fallir(
        AuditAction.TRABAJADOR_ELIMINADO,
        id,
        'TRABAJADOR_NO_ENCONTRADO',
        NotFoundException,
        `Trabajador con id "${id}" no encontrado`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.maquinas.updateMany({ where: { operador_id: id }, data: { operador_id: null } });
      await tx.trabajadores.update({
        where: { id },
        data: { eliminado_en: new Date(), activo: false, actualizado_por: userId, actualizado_en: new Date() },
      });
    });

    await this.auditService.log({
      action: AuditAction.TRABAJADOR_ELIMINADO,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.toResponse(existente),
    });

    return { message: 'Trabajador eliminado exitosamente' };
  }

  /**
   * Calculadora de finiquito/liquidación (Ley Federal del Trabajo) — misma
   * fórmula que antes vivía solo en el frontend, ahora es la fuente de
   * verdad en el servidor. Da de baja al trabajador y libera su máquina.
   */
  async liquidar(id: string, dto: LiquidarTrabajadorDto, userId: string) {
    const trabajador = await this.prisma.trabajadores.findFirst({ where: { id, eliminado_en: null } });
    if (!trabajador) {
      return this.fallir(
        AuditAction.TRABAJADOR_LIQUIDADO,
        id,
        'TRABAJADOR_NO_ENCONTRADO',
        NotFoundException,
        `Trabajador con id "${id}" no encontrado`,
      );
    }
    // Una baja ya registrada no se vuelve a liquidar (antes se podía, y quedaban dos finiquitos auditados).
    if (trabajador.estado === 'INACTIVO') {
      return this.fallir(
        AuditAction.TRABAJADOR_LIQUIDADO,
        id,
        'TRABAJADOR_YA_INACTIVO',
        ConflictException,
        `${trabajador.nombre} ya fue dado de baja`,
      );
    }
    // La antigüedad sale de la fecha de ingreso; antes, sin ella, se calculaba desde una fecha inventada
    // (15/01/2023) y el finiquito resultante no correspondía al trabajador.
    if (!trabajador.fecha_contratacion) {
      return this.fallir(
        AuditAction.TRABAJADOR_LIQUIDADO,
        id,
        'SIN_FECHA_CONTRATACION',
        BadRequestException,
        `Registra la fecha de ingreso de ${trabajador.nombre} antes de calcular su finiquito`,
      );
    }

    const sueldoDiario = Number((Number(trabajador.sueldo_fiscal) + Number(trabajador.sueldo_efectivo)) / 6);
    const fechaIngreso = trabajador.fecha_contratacion;
    const diffDays = Math.max(0, Math.ceil((Date.now() - fechaIngreso.getTime()) / 86400000));
    const aniosAntiguedad = Math.max(0.1, Number((diffDays / 365.25).toFixed(2)));

    const diasPeriodo = dto.diasTrabajadosPeriodo;
    const diasVac = dto.diasVacacionesPendientes;
    const prestamos = dto.deduccionesPrestamos ?? 0;

    const montoDiasTrabajados = Number((diasPeriodo * sueldoDiario).toFixed(2));
    const diasAguinaldoProp = Number(((diffDays % 365) * (15 / 365)).toFixed(2));
    const montoAguinaldo = Number((diasAguinaldoProp * sueldoDiario).toFixed(2));
    const montoVacaciones = Number((diasVac * sueldoDiario).toFixed(2));
    const montoPrimaVacacional = Number((montoVacaciones * 0.25).toFixed(2));
    const subtotalFiniquito = montoDiasTrabajados + montoAguinaldo + montoVacaciones + montoPrimaVacacional;

    let montoIndemnizacion90Dias = 0;
    let montoIndemnizacion20DiasPorAno = 0;
    let montoPrimaAntiguedad = 0;

    if (dto.tipoTerminacion === 'Despido') {
      montoIndemnizacion90Dias = Number((90 * sueldoDiario).toFixed(2));
      montoIndemnizacion20DiasPorAno = Number((20 * aniosAntiguedad * sueldoDiario).toFixed(2));
      const salarioTopado = Math.min(sueldoDiario, 498);
      montoPrimaAntiguedad = Number((12 * aniosAntiguedad * salarioTopado).toFixed(2));
    } else if (dto.tipoTerminacion === 'Convenio') {
      montoIndemnizacion90Dias = Number((45 * sueldoDiario).toFixed(2));
    }

    const subtotalIndemnizaciones = montoIndemnizacion90Dias + montoIndemnizacion20DiasPorAno + montoPrimaAntiguedad;
    const granTotalNeto = Math.max(0, Number((subtotalFiniquito + subtotalIndemnizaciones - prestamos).toFixed(2)));

    try {
      await this.prisma.$transaction(async (tx) => {
        // Baja condicional: dos peticiones a la vez (doble clic, reintento de red) pasan la revisión de arriba;
        // solo la que todavía encuentra al trabajador sin baja la registra. La otra termina en 409.
        const baja = await tx.trabajadores.updateMany({
          where: { id, eliminado_en: null, estado: { not: 'INACTIVO' } },
          data: {
            estado: 'INACTIVO',
            estado_renta: null,
            cliente_renta_actual_id: null,
            actualizado_por: userId,
            actualizado_en: new Date(),
          },
        });
        if (baja.count === 0) {
          throw new ConflictException(`${trabajador.nombre} ya fue dado de baja`);
        }
        await tx.maquinas.updateMany({ where: { operador_id: id }, data: { operador_id: null } });
      });
    } catch (e) {
      if (e instanceof ConflictException) {
        return this.fallir(
          AuditAction.TRABAJADOR_LIQUIDADO,
          id,
          'TRABAJADOR_YA_INACTIVO',
          ConflictException,
          `${trabajador.nombre} ya fue dado de baja`,
        );
      }
      throw e;
    }

    const desglose = {
      tipoTerminacion: dto.tipoTerminacion,
      aniosAntiguedad,
      sueldoDiario: Number(sueldoDiario.toFixed(2)),
      montoDiasTrabajados,
      montoAguinaldo,
      montoVacaciones,
      montoPrimaVacacional,
      subtotalFiniquito,
      montoIndemnizacion90Dias,
      montoIndemnizacion20DiasPorAno,
      montoPrimaAntiguedad,
      subtotalIndemnizaciones,
      deduccionesPrestamos: prestamos,
      granTotalNeto,
    };

    await this.auditService.log({
      action: AuditAction.TRABAJADOR_LIQUIDADO,
      entityType: ENTITY_TYPE,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: desglose,
    });

    return desglose;
  }

  /**
   * Convierte "HH:mm" a un Date anclado en UTC para columnas @db.Time.
   * OJO: `new Date("1970-01-01THH:mm:00")` sin "Z" se interpreta en la
   * hora LOCAL del proceso, pero luego se lee de vuelta con
   * `.toISOString()` (UTC) — eso desfasa la hora guardada según la
   * zona horaria del servidor (mismo bug ya corregido en checklists).
   */
  private horaAUtc(hhmm: string): Date {
    const [horas, minutos] = hhmm.split(':').map(Number);
    return new Date(Date.UTC(1970, 0, 1, horas, minutos, 0));
  }

  private async resolverCategoriaPuesto(nombre: string): Promise<string> {
    let categoria = await this.prisma.categorias_puesto.findUnique({ where: { nombre } });
    if (!categoria) {
      categoria = await this.prisma.categorias_puesto.create({
        data: { id: randomUUID(), nombre, actualizado_en: new Date() },
      });
    }
    return categoria.id;
  }

  private iniciales(nombre: string): string {
    return nombre
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toResponse(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any,
    maquina?: { id: string; codigo: string | null; nombre: string } | null,
    vinculo?: { usuarioId: string; numeroEmpleado: string | null },
  ) {
    return {
      id: t.id,
      nombre: t.nombre,
      puesto: t.puesto,
      categoriaPuesto: CATEGORIA_DB_A_UI[t.categorias_puesto?.nombre] ?? t.categorias_puesto?.nombre ?? '',
      estado: ESTADO_DB_A_UI[t.estado] ?? 'Activo',
      entrada: t.entrada instanceof Date ? t.entrada.toISOString().split('T')[1].slice(0, 5) : String(t.entrada),
      telefono: t.telefono,
      proyectos: (t.trabajadores_proyectos ?? []).map((tp: { proyectos: { nombre: string } }) => tp.proyectos.nombre),
      avatar: t.avatar,
      sueldoFiscal: Number(t.sueldo_fiscal),
      sueldoEfectivo: Number(t.sueldo_efectivo),
      metodoPago: METODO_DB_A_UI[t.metodo_pago] ?? 'Efectivo',
      maquinaAsignadaId: maquina?.codigo ?? undefined,
      maquinaAsignadaNombre: maquina?.nombre ?? undefined,
      estadoRenta: t.estado_renta ? ESTADO_RENTA_DB_A_UI[t.estado_renta] : undefined,
      clienteRentaActual: t.clientes?.nombre ?? undefined,
      licenciaODC3: t.licencias_trabajador
        ? {
            tipo: t.licencias_trabajador.tipo,
            vigencia: t.licencias_trabajador.vigencia_indefinida
              ? 'Indefinida'
              : t.licencias_trabajador.vigencia?.toISOString().split('T')[0] ?? '',
            folio: t.licencias_trabajador.folio,
          }
        : undefined,
      fechaContratacion: t.fecha_contratacion?.toISOString().split('T')[0],
      contactoEmergencia: t.contactos_emergencia
        ? {
            nombre: t.contactos_emergencia.nombre,
            telefono: t.contactos_emergencia.telefono,
            parentesco: t.contactos_emergencia.parentesco,
          }
        : undefined,
      vacacionesDias: t.vacaciones_dias ?? undefined,
      horasExtraSemana: t.horas_extra_semana != null ? Number(t.horas_extra_semana) : undefined,
      tarifaHoraExtra: t.tarifa_hora_extra != null ? Number(t.tarifa_hora_extra) : undefined,
      descuentosSemana: t.descuentos_semana != null ? Number(t.descuentos_semana) : undefined,
      conceptoDescuento: t.concepto_descuento ?? undefined,
      // Cuenta de acceso P14 (solo en el listado — el botón "Reiniciar PIN" vive en la fila)
      usuarioId: vinculo?.usuarioId,
      numeroEmpleado: vinculo?.numeroEmpleado ?? undefined,
    };
  }
}
