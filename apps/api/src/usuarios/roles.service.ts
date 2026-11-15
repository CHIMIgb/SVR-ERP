import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, AuditResult, CategoriaReporte, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CrearRolDto } from './dto/crear-rol.dto';
import { ActualizarRolDto } from './dto/actualizar-rol.dto';
import { VistasRolDto } from './dto/vistas-rol.dto';
import { PermisosRolDto } from './dto/permisos-rol.dto';

const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

/** Rol con acceso al sistema: nunca se edita desde la vista (solo lectura). */
const ES_SISTEMA = { es_sistema: true };

type RolRow = Prisma.rolesGetPayload<{
  include: {
    _count: {
      select: {
        users_roles: { where: { activo: true } };
        role_vistas: true;
        role_permissions: true;
      };
    };
  };
}>;

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ────────────────────────────────────────────
  //  CATÁLOGO (tab Roles)
  // ────────────────────────────────────────────
  async findCatalogo() {
    const roles = await this.prisma.roles.findMany({
      where: { eliminado_en: null },
      orderBy: { nivel: 'desc' },
      include: {
        _count: {
          select: {
            users_roles: { where: { activo: true } },
            role_vistas: true,
            role_permissions: true,
          },
        },
      },
    });

    return {
      items: roles.map((r) => this.serialize(r)),
    };
  }

  async create(dto: CrearRolDto, userId: string) {
    const nombre = dto.nombre.trim();
    const tomado = await this.prisma.roles.findFirst({
      where: { nombre, eliminado_en: null },
      select: { id: true },
    });
    if (tomado) {
      return this.fallir(
        AuditAction.ROL_CREADO,
        null,
        'NOMBRE_DUPLICADO',
        BadRequestException,
        `Ya existe un rol con el nombre "${nombre}"`,
      );
    }

    try {
      const rol = await this.prisma.roles.create({
        data: {
          id: randomUUID(),
          nombre,
          descripcion: dto.descripcion?.trim() || null,
          nivel: dto.nivel ?? 0,
          torre: dto.torre ?? undefined,
          creado_por: userId,
          actualizado_en: new Date(),
        },
      });

      await this.auditService.log({
        action: AuditAction.ROL_CREADO,
        entityType: 'roles',
        entityId: rol.id,
        result: AuditResult.SUCCESS,
        actorUserId: userId,
        newValue: { nombre: rol.nombre, nivel: rol.nivel, torre: rol.torre },
      });
      return {
        id: rol.id,
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        nivel: rol.nivel,
        torre: rol.torre,
        esSistema: rol.es_sistema,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return this.fallir(
          AuditAction.ROL_CREADO,
          null,
          'NOMBRE_DUPLICADO',
          BadRequestException,
          `Ya existe un rol con el nombre "${nombre}"`,
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: ActualizarRolDto, userId: string) {
    const rol = await this.prisma.roles.findFirst({
      where: { id, eliminado_en: null },
    });
    if (!rol) {
      return this.fallir(
        AuditAction.ROL_ACTUALIZADO,
        id,
        'ROL_NO_ENCONTRADO',
        NotFoundException,
        `Rol con id "${id}" no encontrado`,
      );
    }
    if (rol.es_sistema) {
      return this.fallir(
        AuditAction.ROL_ACTUALIZADO,
        id,
        'ROL_SISTEMA_PROTEGIDO',
        ForbiddenException,
        'El rol Administrador del sistema no se puede editar',
      );
    }

    if (dto.nombre !== undefined && dto.nombre.trim() !== rol.nombre) {
      const tomado = await this.prisma.roles.findFirst({
        where: { nombre: dto.nombre.trim(), eliminado_en: null, id: { not: id } },
        select: { id: true },
      });
      if (tomado) {
        return this.fallir(
          AuditAction.ROL_ACTUALIZADO,
          id,
          'NOMBRE_DUPLICADO',
          BadRequestException,
          `Ya existe un rol con el nombre "${dto.nombre.trim()}"`,
        );
      }
    }

    const actualizado = await this.prisma.roles.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.descripcion !== undefined && {
          descripcion: dto.descripcion.trim() || null,
        }),
        ...(dto.nivel !== undefined && { nivel: dto.nivel }),
        ...(dto.torre !== undefined && { torre: dto.torre }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
        actualizado_en: new Date(),
      },
    });

    await this.auditService.log({
      action: AuditAction.ROL_ACTUALIZADO,
      entityType: 'roles',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      newValue: {
        nombre: actualizado.nombre,
        nivel: actualizado.nivel,
        torre: actualizado.torre,
        activo: actualizado.activo,
      },
    });
    return { id: actualizado.id, nombre: actualizado.nombre, nivel: actualizado.nivel };
  }

  async remove(id: string, userId: string) {
    const rol = await this.prisma.roles.findFirst({
      where: { id, eliminado_en: null },
      include: {
        _count: { select: { users_roles: { where: { activo: true } } } },
      },
    });
    if (!rol) {
      return this.fallir(
        AuditAction.ROL_ELIMINADO,
        id,
        'ROL_NO_ENCONTRADO',
        NotFoundException,
        `Rol con id "${id}" no encontrado`,
      );
    }
    if (rol.es_sistema) {
      return this.fallir(
        AuditAction.ROL_ELIMINADO,
        id,
        'ROL_SISTEMA_PROTEGIDO',
        ForbiddenException,
        'El rol Administrador del sistema no se puede eliminar',
      );
    }
    if (rol._count.users_roles > 0) {
      return this.fallir(
        AuditAction.ROL_ELIMINADO,
        id,
        'ROL_EN_USO',
        BadRequestException,
        `El rol "${rol.nombre}" tiene ${rol._count.users_roles} usuario(s) asignado(s) — reasígnalos primero`,
      );
    }

    await this.prisma.roles.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false },
    });

    await this.auditService.log({
      action: AuditAction.ROL_ELIMINADO,
      entityType: 'roles',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      newValue: { nombre: rol.nombre, motivo: 'baja de rol (soft delete)' },
    });
    return { message: `Rol "${rol.nombre}" eliminado` };
  }

  // ────────────────────────────────────────────
  //  VISTAS DEL ROL (flags por vista)
  // ────────────────────────────────────────────
  async findVistas(id: string) {
    await this.validarRolExistente(id);
    const rol = await this.prisma.roles.findUnique({ where: { id }, select: { nombre: true } });

    const [vistas, asignadas] = await Promise.all([
      this.prisma.vistas.findMany({
        where: { activo: true, eliminado_en: null },
        orderBy: { orden: 'asc' },
        select: { id: true, ruta: true, nombre: true, orden: true },
      }),
      this.prisma.role_vistas.findMany({
        where: { rol_id: id, activo: true },
      }),
    ]);

    const porVista = new Map(asignadas.map((rv) => [rv.vista_id, rv]));
    return {
      rolId: id,
      rolNombre: rol?.nombre ?? null,
      vistas: vistas.map((v) => {
        const rv = porVista.get(v.id);
        return {
          vistaId: v.id,
          ruta: v.ruta,
          nombre: v.nombre,
          orden: v.orden,
          puedeVer: rv?.puede_ver ?? false,
          puedeCrear: rv?.puede_crear ?? false,
          puedeEditar: rv?.puede_editar ?? false,
          puedeEliminar: rv?.puede_eliminar ?? false,
          puedeExportar: rv?.puede_exportar ?? false,
        };
      }),
    };
  }

  async updateVistas(id: string, dto: VistasRolDto, userId: string) {
    await this.validarRolEditable(id);

    const ids = [...new Set(dto.vistas.map((v) => v.vistaId))];
    const existentes = await this.prisma.vistas.count({
      where: { id: { in: ids }, activo: true, eliminado_en: null },
    });
    if (existentes !== ids.length) {
      return this.fallir(
        AuditAction.VISTAS_ROL_ACTUALIZADAS,
        id,
        'VISTA_NO_ENCONTRADA',
        BadRequestException,
        'Una de las vistas enviadas no existe o está inactiva',
      );
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.role_vistas.deleteMany({
        where: { rol_id: id, vista_id: { in: ids } },
      });
      await tx.role_vistas.createMany({
        data: dto.vistas.map((v) => ({
          id: randomUUID(),
          rol_id: id,
          vista_id: v.vistaId,
          puede_ver: v.puedeVer,
          puede_crear: v.puedeCrear,
          puede_editar: v.puedeEditar,
          puede_eliminar: v.puedeEliminar,
          puede_exportar: v.puedeExportar,
          asignado_por: userId,
        })),
      });
    });

    await this.auditService.log({
      action: AuditAction.VISTAS_ROL_ACTUALIZADAS,
      entityType: 'roles',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      metadata: { vistas: dto.vistas.length },
    });
    return { message: `Vistas actualizadas para ${dto.vistas.length} vista(s)` };
  }

  // ────────────────────────────────────────────
  //  PERMISOS DEL ROL (matriz por módulo)
  // ────────────────────────────────────────────
  async findPermisos(id: string) {
    await this.validarRolExistente(id);

    const permisos = await this.prisma.permissions.findMany({
      orderBy: [{ modulo: 'asc' }, { recurso: 'asc' }, { accion: 'asc' }],
      include: {
        role_permissions: { where: { rol_id: id }, select: { rol_id: true } },
      },
    });

    return {
      rolId: id,
      permisos: permisos.map((p) => ({
        id: p.id,
        modulo: p.modulo,
        recurso: p.recurso,
        accion: p.accion,
        asignado: p.role_permissions.length > 0,
      })),
    };
  }

  async updatePermisos(id: string, dto: PermisosRolDto, userId: string) {
    await this.validarRolEditable(id);

    const agregar = [...new Set(dto.agregar ?? [])];
    const quitar = [...new Set(dto.quitar ?? [])];

    if (agregar.length > 0) {
      const existen = await this.prisma.permissions.count({
        where: { id: { in: agregar } },
      });
      if (existen !== agregar.length) {
        return this.fallir(
          AuditAction.PERMISOS_ROL_ACTUALIZADAS,
          id,
          'PERMISO_NO_ENCONTRADO',
          BadRequestException,
          'Uno de los permisos enviados no existe',
        );
      }
    }

    const actuales = await this.prisma.role_permissions.findMany({
      where: { rol_id: id },
      select: { permiso_id: true },
    });
    const actualesIds = new Set(actuales.map((a) => a.permiso_id));
    const porAgregar = agregar.filter((p) => !actualesIds.has(p));
    const porQuitar = quitar.filter((p) => actualesIds.has(p));

    if (porAgregar.length > 0 || porQuitar.length > 0) {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        if (porQuitar.length > 0) {
          await tx.role_permissions.deleteMany({
            where: { rol_id: id, permiso_id: { in: porQuitar } },
          });
        }
        if (porAgregar.length > 0) {
          await tx.role_permissions.createMany({
            data: porAgregar.map((permiso_id) => ({ rol_id: id, permiso_id })),
          });
        }
      });
    }

    await this.auditService.log({
      action: AuditAction.PERMISOS_ROL_ACTUALIZADAS,
      entityType: 'roles',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      metadata: { agregados: porAgregar.length, quitados: porQuitar.length },
    });
    return {
      message: 'Permisos actualizados',
    };
  }

  // ────────────────────────────────────────────
  //  Validaciones
  // ────────────────────────────────────────────
  private async validarRolExistente(id: string) {
    const rol = await this.prisma.roles.findFirst({
      where: { id, eliminado_en: null },
      select: { id: true },
    });
    if (!rol) {
      return this.fallir(
        AuditAction.ROL_ACTUALIZADO,
        id,
        'ROL_NO_ENCONTRADO',
        NotFoundException,
        `Rol con id "${id}" no encontrado`,
      );
    }
  }

  /** Existente + NO es_sistema (el Administrador no se edita en nada). */
  private async validarRolEditable(id: string) {
    const rol = await this.prisma.roles.findFirst({
      where: { id, eliminado_en: null },
      select: { id: true, es_sistema: true, nombre: true },
    });
    if (!rol) {
      return this.fallir(
        AuditAction.ROL_ACTUALIZADO,
        id,
        'ROL_NO_ENCONTRADO',
        NotFoundException,
        `Rol con id "${id}" no encontrado`,
      );
    }
    if (rol.es_sistema) {
      return this.fallir(
        AuditAction.ROL_ACTUALIZADO,
        id,
        'ROL_SISTEMA_PROTEGIDO',
        ForbiddenException,
        'El rol Administrador del sistema no se puede editar',
      );
    }
  }

  private serialize(r: RolRow) {
    return {
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      nivel: r.nivel,
      torre: (r.torre as CategoriaReporte | null) ?? null,
      esSistema: r.es_sistema,
      activo: r.activo,
      usuarios: r._count.users_roles,
      vistas: r._count.role_vistas,
      permisos: r._count.role_permissions,
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
      entityType: 'roles',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }
}
