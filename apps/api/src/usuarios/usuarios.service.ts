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
import { AsignarRolDto } from './dto/asignar-rol.dto';
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
      select: { id: true, email: true, torre: true, activo: true },
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

    const actualizado = await this.prisma.users.update({
      where: { id },
      data: {
        ...(dto.email !== undefined && { email: dto.email.trim().toLowerCase() }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
        ...(dto.torre !== undefined && { torre: dto.torre }),
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: {
        personas_users_persona_idTopersonas: true,
        users_roles_users_roles_user_idTousers: { where: { activo: true }, include: { roles: true } },
      },
    });

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
    const esAdministrador = user.users_roles_users_roles_user_idTousers.some((ur) => ur.roles.es_sistema);
    if (esAdministrador) {
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
        return this.fallir(
          AuditAction.USUARIO_ELIMINADO,
          id,
          'ULTIMO_ADMINISTRADOR',
          BadRequestException,
          'No se puede eliminar al único Administrador del sistema',
        );
      }
    }

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
  //  ROLES (asignar / revocar)
  // ────────────────────────────────────────────
  async asignarRol(id: string, dto: AsignarRolDto, userId: string) {
    const user = await this.prisma.users.findFirst({
      where: { id, eliminado_en: null },
      select: { id: true, email: true },
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

    const yaAsignado = await this.prisma.users_roles.findFirst({
      where: { user_id: id, rol_id: dto.rolId, activo: true },
      select: { id: true },
    });
    if (yaAsignado) {
      return this.fallir(
        AuditAction.ROL_ASIGNADO,
        id,
        'ROL_YA_ASIGNADO',
        BadRequestException,
        `El usuario ya tiene el rol "${rol.nombre}"`,
      );
    }

    const esPrincipal = dto.esPrincipal ?? false;
    const asignado = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (esPrincipal) {
        await tx.users_roles.updateMany({
          where: { user_id: id, activo: true },
          data: { es_principal: false },
        });
      }
      return tx.users_roles.create({
        data: {
          id: randomUUID(),
          user_id: id,
          rol_id: dto.rolId,
          es_principal: esPrincipal,
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
      newValue: { rolId: dto.rolId, rolNombre: rol.nombre, esPrincipal, asignacionId: asignado.id },
    });
    return { message: `Rol "${rol.nombre}" asignado` };
  }

  async revocarRol(id: string, rolId: string, userId: string) {
    const asignacion = await this.prisma.users_roles.findFirst({
      where: { user_id: id, rol_id: rolId, activo: true },
      include: { roles: { select: { nombre: true } } },
    });
    if (!asignacion) {
      return this.fallir(
        AuditAction.ROL_REVOCADO,
        id,
        'ROL_NO_ASIGNADO',
        NotFoundException,
        'El usuario no tiene ese rol activo',
      );
    }

    const activos = await this.prisma.users_roles.count({
      where: { user_id: id, activo: true },
    });
    if (activos <= 1) {
      return this.fallir(
        AuditAction.ROL_REVOCADO,
        id,
        'USUARIO_SIN_ROL',
        BadRequestException,
        'El usuario debe conservar al menos un rol',
      );
    }

    await this.prisma.users_roles.update({
      where: { id: asignacion.id },
      data: { activo: false },
    });

    await this.auditService.log({
      action: AuditAction.ROL_REVOCADO,
      entityType: 'users',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      newValue: { rolId, rolNombre: asignacion.roles.nombre },
    });
    return { message: `Rol "${asignacion.roles.nombre}" revocado` };
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
