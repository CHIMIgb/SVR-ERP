import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, AuditResult, CategoriaReporte, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CambiarRolDto } from './dto/cambiar-rol.dto';
import { EstadoUsuarioDto } from './dto/estado-usuario.dto';
import { QueryUsuariosDto } from './dto/query-usuarios.dto';

const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';
const SALT_ROUNDS = 12;
/** Umbral real de bloqueo de PIN (mismo valor que auth/pin). */
const MAX_INTENTOS_PIN = 5;

/** Roles asignables: activos, sin eliminar y NO `es_sistema` (Administrador). */
const ROLES_ASIGNABLES_WHERE = {
  activo: true,
  eliminado_en: null,
  es_sistema: false,
};

type UsuarioRow = Prisma.usersGetPayload<{
  include: {
    personas_users_persona_idTopersonas: true;
    users_roles_users_roles_user_idTousers: { include: { roles: true } };
  };
}>;

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ────────────────────────────────────────────
  //  LISTADO (paginado — default 10, techo 100)
  // ────────────────────────────────────────────
  async findAll(query: QueryUsuariosDto) {
    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.usersWhereInput = { eliminado_en: null };

    if (query.search) {
      const q = query.search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { numero_empleado: { contains: q, mode: 'insensitive' } },
        {
          personas_users_persona_idTopersonas: {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' } },
              { apellido_paterno: { contains: q, mode: 'insensitive' } },
              { apellido_materno: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (query.rolId) {
      where.users_roles_users_roles_user_idTousers = {
        some: { activo: true, rol_id: query.rolId },
      };
    }

    if (query.estado === 'activo') where.activo = true;
    if (query.estado === 'inactivo') where.activo = false;

    const [rows, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        orderBy: { creado_en: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          personas_users_persona_idTopersonas: true,
          users_roles_users_roles_user_idTousers: { where: { activo: true }, include: { roles: true } },
        },
      }),
      this.prisma.users.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.serialize(r)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ────────────────────────────────────────────
  //  ESTADÍSTICAS (tarjetas de /usuarios)
  // ────────────────────────────────────────────
  async findStats() {
    const where = { eliminado_en: null };
    const [total, activos, conIdentidad, bloqueados] = await Promise.all([
      this.prisma.users.count({ where }),
      this.prisma.users.count({ where: { ...where, activo: true } }),
      this.prisma.users.count({ where: { ...where, numero_empleado: { not: null } } }),
      this.prisma.users.count({
        where: { ...where, intentos_pin: { gte: MAX_INTENTOS_PIN } },
      }),
    ]);
    return { total, activos, conIdentidad, bloqueados };
  }

  // ────────────────────────────────────────────
  //  CATÁLOGOS (roles asignables + personas sin usuario)
  // ────────────────────────────────────────────
  async findCatalogos() {
    const roles = await this.prisma.roles.findMany({
      where: ROLES_ASIGNABLES_WHERE,
      select: { id: true, nombre: true, nivel: true, torre: true },
      orderBy: { nivel: 'desc' },
    });

    const personas = await this.prisma.personas.findMany({
      where: { activo: true, users_users_persona_idTopersonas: { is: null } },
      select: {
        id: true,
        nombre: true,
        apellido_paterno: true,
        apellido_materno: true,
      },
      orderBy: { nombre: 'asc' },
    });

    return {
      roles: roles.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        nivel: r.nivel,
        torre: r.torre,
      })),
      personas: personas.map((p) => ({
        id: p.id,
        nombre: [p.nombre, p.apellido_paterno, p.apellido_materno]
          .filter(Boolean)
          .join(' '),
      })),
    };
  }

  // ────────────────────────────────────────────
  //  CREAR (persona + user + rol principal)
  // ────────────────────────────────────────────
  async create(dto: CreateUsuarioDto, userId: string) {
    // Rol válido y asignable (nunca es_sistema — una cuenta no fabrica administradores).
    const rol = await this.prisma.roles.findFirst({
      where: { id: dto.rolId, ...ROLES_ASIGNABLES_WHERE },
      select: { id: true, nombre: true },
    });
    if (!rol) {
      return this.fallir(
        AuditAction.USUARIO_CREADO,
        null,
        'ROL_NO_ASIGNABLE',
        ForbiddenException,
        'El rol seleccionado no es válido o no es asignable',
      );
    }

    // Email único (el índice de BD es la red de seguridad; acá pre-chequeamos
    // contra activos Y eliminados para dar un error claro).
    const email = dto.email.trim().toLowerCase();
    const emailTomado = await this.prisma.users.findFirst({
      where: { email },
      select: { id: true },
    });
    if (emailTomado) {
      return this.fallir(
        AuditAction.USUARIO_CREADO,
        null,
        'EMAIL_DUPLICADO',
        BadRequestException,
        'Ya existe un usuario con ese correo',
      );
    }

    // Persona: existente (sin usuario) o alta rápida.
    let personaId: string;
    if (dto.personaId) {
      const persona = await this.prisma.personas.findUnique({
        where: { id: dto.personaId },
        select: { id: true, users_users_persona_idTopersonas: { select: { id: true } } },
      });
      if (!persona) {
        return this.fallir(
          AuditAction.USUARIO_CREADO,
          dto.personaId,
          'PERSONA_NO_ENCONTRADA',
          BadRequestException,
          'La persona seleccionada no existe',
        );
      }
      if (persona.users_users_persona_idTopersonas !== null) {
        return this.fallir(
          AuditAction.USUARIO_CREADO,
          dto.personaId,
          'PERSONA_YA_TIENE_USUARIO',
          BadRequestException,
          'Esa persona ya tiene una cuenta de acceso',
        );
      }
      personaId = persona.id;
    } else {
      if (!dto.nombre?.trim()) {
        return this.fallir(
          AuditAction.USUARIO_CREADO,
          null,
          'PERSONA_REQUERIDA',
          BadRequestException,
          'Selecciona una persona del catálogo o captura el nombre para darla de alta',
        );
      }
      const nuevaPersona = await this.prisma.personas.create({
        data: {
          id: randomUUID(),
          nombre: dto.nombre.trim(),
          apellido_paterno: dto.apellidoPaterno?.trim() || null,
          apellido_materno: dto.apellidoMaterno?.trim() || null,
          telefono: dto.telefono?.trim() || null,
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: new Date(),
        },
      });
      personaId = nuevaPersona.id;
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await this.prisma.users.create({
        data: {
          id: randomUUID(),
          persona_id: personaId,
          email,
          password_hash: passwordHash,
          torre: dto.torre ?? undefined,
          creado_por: userId,
          actualizado_por: userId,
          actualizado_en: new Date(),
          users_roles_users_roles_user_idTousers: {
            create: {
              id: randomUUID(),
              rol_id: dto.rolId,
              es_principal: true,
              asignado_por: userId,
            },
          },
        },
        include: {
          personas_users_persona_idTopersonas: true,
          users_roles_users_roles_user_idTousers: { where: { activo: true }, include: { roles: true } },
        },
      });

      const serialized = this.serialize(user);
      await this.auditService.log({
        action: AuditAction.USUARIO_CREADO,
        entityType: 'users',
        entityId: user.id,
        result: AuditResult.SUCCESS,
        actorUserId: userId,
        newValue: serialized,
      });
      return serialized;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Carrera real perdida: otro creó el email/persona primero (índices únicos).
        return this.fallir(
          AuditAction.USUARIO_CREADO,
          null,
          'EMAIL_DUPLICADO',
          BadRequestException,
          'Ya existe un usuario con ese correo',
        );
      }
      throw error;
    }
  }

  // ────────────────────────────────────────────
  //  EDITAR (email, activo, torre)
  // ────────────────────────────────────────────
  async update(id: string, dto: UpdateUsuarioDto, userId: string) {
    const user = await this.prisma.users.findFirst({
      where: { id, eliminado_en: null },
      select: {
        id: true,
        email: true,
        torre: true,
        persona_id: true,
        users_roles_users_roles_user_idTousers: {
          where: { activo: true },
          select: { rol_id: true },
        },
      },
    });
    if (!user) {
      return this.fallir(
        AuditAction.USUARIO_ACTUALIZADO,
        id,
        'USUARIO_NO_ENCONTRADO',
        NotFoundException,
        `Usuario con id "${id}" no encontrado`,
      );
    }

    // Fail-fast: el rol nuevo debe ser válido ANTES de tocar nada.
    if (dto.rolId && dto.rolId !== user.users_roles_users_roles_user_idTousers[0]?.rol_id) {
      const rol = await this.prisma.roles.findFirst({
        where: { id: dto.rolId, ...ROLES_ASIGNABLES_WHERE },
        select: { id: true, nombre: true },
      });
      if (!rol) {
        return this.fallir(
          AuditAction.USUARIO_ACTUALIZADO,
          id,
          'ROL_NO_ASIGNABLE',
          ForbiddenException,
          'El rol seleccionado no es válido o no es asignable',
        );
      }
    }

    if (dto.email && dto.email.trim().toLowerCase() !== user.email) {
      const emailTomado = await this.prisma.users.findFirst({
        where: { email: dto.email.trim().toLowerCase(), id: { not: id } },
        select: { id: true },
      });
      if (emailTomado) {
        return this.fallir(
          AuditAction.USUARIO_ACTUALIZADO,
          id,
          'EMAIL_DUPLICADO',
          BadRequestException,
          'Ya existe un usuario con ese correo',
        );
      }
    }

    // Persona: los datos del alta se editan aquí también (misma captura).
    // actualizado_por se omite aquí (el UpdateInput tipado no toma la FK de
    // la relación nombrada; el actor queda en registro_auditoria).
    const datosPersona: Prisma.personasUpdateInput = {
      ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
      ...(dto.apellidoPaterno !== undefined && { apellido_paterno: dto.apellidoPaterno.trim() || null }),
      ...(dto.apellidoMaterno !== undefined && { apellido_materno: dto.apellidoMaterno.trim() || null }),
      ...(dto.telefono !== undefined && { telefono: dto.telefono.trim() || null }),
      actualizado_en: new Date(),
    };
    if (Object.keys(datosPersona).length > 1) {
      await this.prisma.personas.update({
        where: { id: user.persona_id },
        data: datosPersona,
      });
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, SALT_ROUNDS) : undefined;

    const actualizado = await this.prisma.users.update({
      where: { id },
      data: {
        ...(dto.email !== undefined && { email: dto.email.trim().toLowerCase() }),
        ...(passwordHash && { password_hash: passwordHash }),
        ...(dto.torre !== undefined && { torre: dto.torre }),
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: {
        personas_users_persona_idTopersonas: true,
        users_roles_users_roles_user_idTousers: { where: { activo: true }, include: { roles: true } },
      },
    });

    // Mono-rol: si cambió el rol, se reemplaza el único rol activo.
    if (dto.rolId && dto.rolId !== user.users_roles_users_roles_user_idTousers[0]?.rol_id) {
      await this.cambiarRol(id, { rolId: dto.rolId }, userId);
    }

    const serialized = this.serialize(actualizado);
    await this.auditService.log({
      action: AuditAction.USUARIO_ACTUALIZADO,
      entityType: 'users',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      newValue: serialized,
    });
    return serialized;
  }

  // ────────────────────────────────────────────
  //  ESTADO (activar / desactivar — acción propia del botón)
  // ────────────────────────────────────────────
  async cambiarEstado(id: string, dto: EstadoUsuarioDto, userId: string) {
    if (dto.activo === false && id === userId) {
      return this.fallir(
        AuditAction.USUARIO_ACTUALIZADO,
        id,
        'NO_PUEDE_DESACTIVARSE_A_SI_MISMO',
        BadRequestException,
        'No puedes desactivar tu propia cuenta',
      );
    }

    const user = await this.prisma.users.findFirst({
      where: { id, eliminado_en: null },
      select: { id: true, activo: true },
    });
    if (!user) {
      return this.fallir(
        AuditAction.USUARIO_ACTUALIZADO,
        id,
        'USUARIO_NO_ENCONTRADO',
        NotFoundException,
        `Usuario con id "${id}" no encontrado`,
      );
    }

    if (dto.activo === false) {
      await this.validarNoUltimoAdmin(
        id,
        AuditAction.USUARIO_ACTUALIZADO,
        'No se puede desactivar al único Administrador del sistema',
      );
    }

    const ahora = new Date();
    await this.prisma.$transaction([
      this.prisma.users.update({
        where: { id },
        data: { activo: dto.activo, actualizado_por: userId, actualizado_en: ahora },
      }),
      // Una cuenta desactivada no conserva sesiones vivas.
      ...(dto.activo === false
        ? [
            this.prisma.sessions.updateMany({
              where: { user_id: id, activa: true },
              data: { activa: false, cerrada_en: ahora, motivo_cierre: 'cuenta_desactivada' },
            }),
          ]
        : []),
    ]);

    await this.auditService.log({
      action: AuditAction.USUARIO_ACTUALIZADO,
      entityType: 'users',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      metadata: { campo: 'activo', valor: dto.activo, anterior: user.activo },
    });
    return { message: dto.activo ? 'Usuario activado' : 'Usuario desactivado' };
  }

  /** Guard compartido: la cuenta no puede quedarse sin su único Administrador. */
  private async validarNoUltimoAdmin(id: string, action: AuditAction, mensaje: string) {
    const user = await this.prisma.users.findFirst({
      where: { id, eliminado_en: null },
      include: {
        users_roles_users_roles_user_idTousers: {
          where: { activo: true },
          include: { roles: { select: { es_sistema: true } } },
        },
      },
    });
    const esAdministrador = user?.users_roles_users_roles_user_idTousers?.some(
      (ur) => ur.roles.es_sistema,
    );
    if (!esAdministrador) return;

    const admins = await this.prisma.users.count({
      where: {
        eliminado_en: null,
        activo: true,
        users_roles_users_roles_user_idTousers: {
          some: { activo: true, roles: { es_sistema: true } },
        },
      },
    });
    if (admins <= 1) {
      return this.fallir(action, id, 'ULTIMO_ADMINISTRADOR', BadRequestException, mensaje);
    }
  }

  // ────────────────────────────────────────────
  //  ELIMINAR (soft delete + cierre de sesiones)
  // ────────────────────────────────────────────
  async remove(id: string, userId: string) {
    if (id === userId) {
      return this.fallir(
        AuditAction.USUARIO_ELIMINADO,
        id,
        'NO_PUEDE_ELIMINARSE_A_SI_MISMO',
        BadRequestException,
        'No puedes eliminar tu propia cuenta',
      );
    }

    const user = await this.prisma.users.findFirst({
      where: { id, eliminado_en: null },
      include: {
        users_roles_users_roles_user_idTousers: {
          where: { activo: true },
          include: { roles: { select: { nombre: true, es_sistema: true } } },
        },
      },
    });
    if (!user) {
      return this.fallir(
        AuditAction.USUARIO_ELIMINADO,
        id,
        'USUARIO_NO_ENCONTRADO',
        NotFoundException,
        `Usuario con id "${id}" no encontrado`,
      );
    }

    // Guard: no dejar al sistema sin su último Administrador (es_sistema).
    await this.validarNoUltimoAdmin(
      id,
      AuditAction.USUARIO_ELIMINADO,
      'No se puede eliminar al único Administrador del sistema',
    );

    const ahora = new Date();
    await this.prisma.$transaction([
      this.prisma.users.update({
        where: { id },
        data: { eliminado_en: ahora, activo: false, actualizado_por: userId },
      }),
      // Un usuario eliminado no conserva sesiones vivas.
      this.prisma.sessions.updateMany({
        where: { user_id: id, activa: true },
        data: {
          activa: false,
          cerrada_en: ahora,
          motivo_cierre: 'usuario_eliminado',
        },
      }),
    ]);

    await this.auditService.log({
      action: AuditAction.USUARIO_ELIMINADO,
      entityType: 'users',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      newValue: { email: user.email, motivo: 'baja de usuario (soft delete)' },
    });
    return { message: 'Usuario eliminado' };
  }

  // ────────────────────────────────────────────
  //  ROL ÚNICO (mono-rol — reemplaza el rol del usuario)
  // ────────────────────────────────────────────
  async cambiarRol(id: string, dto: CambiarRolDto, userId: string) {
    const user = await this.prisma.users.findFirst({
      where: { id, eliminado_en: null },
      include: {
        users_roles_users_roles_user_idTousers: {
          where: { activo: true },
          include: { roles: { select: { nombre: true } } },
        },
      },
    });
    if (!user) {
      return this.fallir(
        AuditAction.ROL_ASIGNADO,
        id,
        'USUARIO_NO_ENCONTRADO',
        NotFoundException,
        `Usuario con id "${id}" no encontrado`,
      );
    }

    const rol = await this.prisma.roles.findFirst({
      where: { id: dto.rolId, ...ROLES_ASIGNABLES_WHERE },
      select: { id: true, nombre: true },
    });
    if (!rol) {
      return this.fallir(
        AuditAction.ROL_ASIGNADO,
        id,
        'ROL_NO_ASIGNABLE',
        ForbiddenException,
        'El rol seleccionado no es válido o no es asignable',
      );
    }

    const rolAnterior =
      user.users_roles_users_roles_user_idTousers
        .map((ur) => ur.roles.nombre)
        .join(', ') || null;
    if (rolAnterior === rol.nombre) {
      return this.fallir(
        AuditAction.ROL_ASIGNADO,
        id,
        'ROL_YA_ASIGNADO',
        BadRequestException,
        `El usuario ya tiene el rol "${rol.nombre}"`,
      );
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.users_roles.updateMany({
        where: { user_id: id, activo: true },
        data: { activo: false },
      });
      await tx.users_roles.create({
        data: {
          id: randomUUID(),
          user_id: id,
          rol_id: dto.rolId,
          es_principal: true,
          asignado_por: userId,
        },
      });
    });

    await this.auditService.log({
      action: AuditAction.ROL_ASIGNADO,
      entityType: 'users',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      metadata: { modo: 'cambio', rolAnterior, rolNuevo: rol.nombre },
    });
    return { message: `Rol cambiado a "${rol.nombre}"` };
  }

  // ────────────────────────────────────────────
  //  EQUIPOS (vista /equipos — P11: jefe↔trabajador)
  // ────────────────────────────────────────────
  /**
   * Equipos: SOLO usuarios con rol **Residente** (decisión del cliente,
   * 2026-11-14 — la tabla carga únicamente residentes), cada uno con su
   * lista de subordinados, y los candidatos sin jefe.
   * Confirmado por el cliente (P10): vínculo usuario↔usuario; un jefe puede
   * tener subordinados de CUALQUIER rol.
   */
  async findEquipos() {
    const jefes = await this.prisma.users.findMany({
      where: {
        eliminado_en: null,
        activo: true,
        users_roles_users_roles_user_idTousers: {
          some: { activo: true, roles: { nombre: 'Residente' } },
        },
      },
      include: {
        personas_users_persona_idTopersonas: true,
        users_roles_users_roles_user_idTousers: {
          where: { activo: true },
          include: { roles: { select: { nombre: true } } },
        },
      },
      orderBy: [{ torre: 'asc' }, { creado_en: 'asc' }],
    });

    const subordinados = jefes.length
      ? await this.prisma.users.findMany({
          where: {
            jefe_user_id: { in: jefes.map((j) => j.id) },
            eliminado_en: null,
          },
          include: {
            personas_users_persona_idTopersonas: true,
            users_roles_users_roles_user_idTousers: {
              where: { activo: true },
              include: { roles: { select: { nombre: true } } },
            },
          },
          orderBy: { creado_en: 'asc' },
        })
      : [];

    const porJefe = new Map<string, typeof subordinados>();
    for (const s of subordinados) {
      const lista = porJefe.get(s.jefe_user_id!) ?? [];
      lista.push(s);
      porJefe.set(s.jefe_user_id!, lista);
    }

    // Candidatos: sin jefe, sin equipo a su cargo (los jefes salen arriba).
    const sinJefe = await this.prisma.users.findMany({
      where: {
        eliminado_en: null,
        activo: true,
        jefe_user_id: null,
        id: { notIn: jefes.map((j) => j.id) },
        subordinados: { none: { eliminado_en: null } },
      },
      include: {
        personas_users_persona_idTopersonas: true,
        users_roles_users_roles_user_idTousers: {
          where: { activo: true },
          include: { roles: { select: { nombre: true } } },
        },
      },
      orderBy: { creado_en: 'asc' },
    });

    return {
      equipos: jefes.map((j) => ({
        usuarioId: j.id,
        nombre: this.nombreDe(j),
        email: j.email,
        torre: j.torre ?? null,
        numeroEmpleado: j.numero_empleado,
        roles: this.rolesDe(j),
        subordinados: (porJefe.get(j.id) ?? []).map((s) => this.resumenDe(s)),
      })),
      sinJefe: sinJefe.map((u) => this.resumenDe(u)),
    };
  }

  /**
   * PATCH /usuarios/:id/jefe — asignar / re-asignar / des-asignar jefe.
   * Audita la acción literal `JEFE_ASIGNADO` (enum de BD, decisión del cliente).
   */
  async asignarJefe(id: string, dto: { jefeUserId: string | null }, userId: string) {
    const user = await this.prisma.users.findFirst({
      where: { id, eliminado_en: null },
      select: { id: true, jefe_user_id: true },
    });
    if (!user) {
      return this.fallir(
        AuditAction.JEFE_ASIGNADO,
        id,
        'USUARIO_NO_ENCONTRADO',
        NotFoundException,
        `Usuario con id "${id}" no encontrado`,
      );
    }

    const anterior = user.jefe_user_id;
    const nuevo = dto.jefeUserId || null;

    if (nuevo) {
      if (nuevo === id) {
        return this.fallir(
          AuditAction.JEFE_ASIGNADO,
          id,
          'JEFE_INVALIDO',
          BadRequestException,
          'Un usuario no puede ser su propio jefe',
        );
      }

      const jefe = await this.prisma.users.findFirst({
        where: { id: nuevo, eliminado_en: null, activo: true },
        select: { id: true, jefe_user_id: true },
      });
      if (!jefe) {
        return this.fallir(
          AuditAction.JEFE_ASIGNADO,
          id,
          'JEFE_INVALIDO',
          BadRequestException,
          'El jefe seleccionado no existe o está inactivo',
        );
      }

      // Jerarquía de 1 nivel: el jefe no puede ser subordinado del propio usuario.
      if (jefe.jefe_user_id === id) {
        return this.fallir(
          AuditAction.JEFE_ASIGNADO,
          id,
          'JEFE_INVALIDO',
          BadRequestException,
          'No se puede asignar como jefe a un subordinado del usuario',
        );
      }
    }

    const actualizado = await this.prisma.users.update({
      where: { id },
      data: { jefe_user_id: nuevo, actualizado_por: userId, actualizado_en: new Date() },
      select: { id: true, jefe_user_id: true },
    });

    await this.auditService.log({
      action: AuditAction.JEFE_ASIGNADO,
      entityType: 'users',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      metadata: {
        campo: 'jefe_user_id',
        anterior: anterior ?? null,
        nuevo,
        accion: nuevo === null ? 'desasignado' : anterior ? 'reasignado' : 'asignado',
      },
    });
    return {
      message: nuevo === null ? 'Jefe des-asignado' : 'Jefe asignado',
      jefeUserId: actualizado.jefe_user_id,
    };
  }

  /** Nombre completo desde la persona. */
  private nombreDe(u: { personas_users_persona_idTopersonas: { nombre: string; apellido_paterno: string | null; apellido_materno: string | null } | null }) {
    const p = u.personas_users_persona_idTopersonas;
    return p
      ? [p.nombre, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ')
      : null;
  }

  /** Nombres de roles activos. */
  private rolesDe(u: { users_roles_users_roles_user_idTousers: { activo: boolean; roles: { nombre: string } }[] }) {
    return u.users_roles_users_roles_user_idTousers
      .filter((ur) => ur.activo)
      .map((ur) => ur.roles.nombre);
  }

  /** Fila resumen de subordinado / candidato sin jefe. */
  private resumenDe(u: {
    id: string;
    email: string;
    torre: CategoriaReporte | null;
    numero_empleado: string | null;
    personas_users_persona_idTopersonas: {
      nombre: string;
      apellido_paterno: string | null;
      apellido_materno: string | null;
    } | null;
    users_roles_users_roles_user_idTousers: { activo: boolean; roles: { nombre: string } }[];
  }) {
    return {
      id: u.id,
      nombre: this.nombreDe(u),
      email: u.email,
      torre: u.torre ?? null,
      numeroEmpleado: u.numero_empleado,
      roles: this.rolesDe(u),
    };
  }

  // ────────────────────────────────────────────
  //  SERIALIZACIÓN (nunca password_hash ni pin_hash)
  // ────────────────────────────────────────────
  private serialize(u: UsuarioRow) {
    const persona = u.personas_users_persona_idTopersonas;
    const roles = u.users_roles_users_roles_user_idTousers
      .filter((ur) => ur.activo)
      .map((ur) => ({
        id: ur.roles.id,
        nombre: ur.roles.nombre,
        esPrincipal: ur.es_principal,
      }));

    let pinEstado: 'NORMAL' | 'TEMPORAL' | 'BLOQUEADO' = 'NORMAL';
    if (u.intentos_pin >= MAX_INTENTOS_PIN) pinEstado = 'BLOQUEADO';
    else if (u.pin_temporal_hasta && u.pin_temporal_hasta > new Date()) pinEstado = 'TEMPORAL';

    return {
      id: u.id,
      personaId: u.persona_id,
      nombre: persona
        ? [persona.nombre, persona.apellido_paterno, persona.apellido_materno]
            .filter(Boolean)
            .join(' ')
        : null,
      email: u.email,
      activo: u.activo,
      torre: (u.torre as CategoriaReporte | null) ?? null,
      numeroEmpleado: u.numero_empleado,
      roles,
      pinEstado,
      creadoEn: u.creado_en.toISOString(),
    };
  }

  // ────────────────────────────────────────────
  //  Fallo de negocio: audit FAIL + error_code ANTES de lanzar
  // ────────────────────────────────────────────
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
      entityType: 'users',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }
}
