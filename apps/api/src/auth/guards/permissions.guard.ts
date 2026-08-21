import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import {
  REQUIRE_PERMISSION_KEY,
  RequiredPermission,
} from './require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<RequiredPermission>(
      REQUIRE_PERMISSION_KEY,
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const userWithPermissions = await this.prisma.users.findUnique({
      where: { id: user.id },
      include: {
        users_roles_users_roles_user_idTousers: {
          where: { activo: true },
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: { permissions: true },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithPermissions) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    const permisos = userWithPermissions.users_roles_users_roles_user_idTousers
      .flatMap((ur) => ur.roles.role_permissions)
      .map((rp) => rp.permissions);

    const tienePermiso = permisos.some(
      (p) =>
        p.modulo === requiredPermission.modulo &&
        p.recurso === requiredPermission.recurso &&
        p.accion === requiredPermission.accion &&
        p.activo,
    );

    if (!tienePermiso) {
      throw new ForbiddenException(
        `No tienes permiso para ${requiredPermission.modulo}.${requiredPermission.recurso}.${requiredPermission.accion}`,
      );
    }

    return true;
  }
}
