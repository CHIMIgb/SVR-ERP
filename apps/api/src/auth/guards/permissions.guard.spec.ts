import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { PrismaService } from '../../prisma/prisma.service';
import {
  REQUIRE_PERMISSION_KEY,
  RequiredPermission,
} from './require-permission.decorator';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let prisma: Record<string, any>;

  // Helper para crear un ExecutionContext mock
  const mockContext = (
    user?: { id: string },
    permissionMeta?: RequiredPermission,
  ): ExecutionContext => {
    const handler = jest.fn();
    if (permissionMeta) {
      Reflect.defineMetadata(REQUIRE_PERMISSION_KEY, permissionMeta, handler);
    }

    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => handler,
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    prisma = {
      users: {
        findUnique: jest.fn(),
      },
    };
    guard = new PermissionsGuard(reflector, prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── SIN @RequirePermission ──
  describe('sin decorator @RequirePermission', () => {
    it('debe permitir el acceso si no hay metadata de permiso', async () => {
      const ctx = mockContext({ id: 'user-1' }); // sin permissionMeta

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
    });
  });

  // ── CON @RequirePermission ──
  describe('con decorator @RequirePermission', () => {
    const permisoRequerido: RequiredPermission = {
      modulo: 'inventario',
      recurso: 'inventario',
      accion: 'ver',
    };

    // ── CASO: Token inválido (sin user) ──
    it('debe rechazar 403 si no hay usuario en el request (token inválido)', async () => {
      const ctx = mockContext(undefined, permisoRequerido); // user undefined

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        'Usuario no autenticado',
      );
    });

    // ── CASO: Sin permisos ──
    it('debe rechazar 403 si el usuario no tiene el permiso requerido', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        users_roles_users_roles_user_idTousers: [
          {
            roles: {
              role_permissions: [
                {
                  permissions: {
                    modulo: 'rrhh',
                    recurso: 'trabajadores',
                    accion: 'ver',
                    activo: true,
                  },
                },
              ],
            },
          },
        ],
      });

      const ctx = mockContext({ id: 'user-1' }, permisoRequerido);

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        'inventario.inventario.ver',
      );
    });

    it('debe rechazar 403 si el permiso existe pero está desactivado', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        users_roles_users_roles_user_idTousers: [
          {
            roles: {
              role_permissions: [
                {
                  permissions: {
                    modulo: 'inventario',
                    recurso: 'inventario',
                    accion: 'ver',
                    activo: false, // ← desactivado
                  },
                },
              ],
            },
          },
        ],
      });

      const ctx = mockContext({ id: 'user-1' }, permisoRequerido);

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe rechazar 403 si el usuario no tiene roles asignados', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        users_roles_users_roles_user_idTousers: [],
      });

      const ctx = mockContext({ id: 'user-1' }, permisoRequerido);

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe rechazar 403 si el usuario no existe en la BD', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      const ctx = mockContext({ id: 'user-1' }, permisoRequerido);

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        'Usuario no encontrado',
      );
    });

    // ── CASO: Con permisos ──
    it('debe permitir si el usuario tiene el permiso requerido', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        users_roles_users_roles_user_idTousers: [
          {
            roles: {
              role_permissions: [
                {
                  permissions: {
                    modulo: 'inventario',
                    recurso: 'inventario',
                    accion: 'ver',
                    activo: true,
                  },
                },
              ],
            },
          },
        ],
      });

      const ctx = mockContext({ id: 'user-1' }, permisoRequerido);

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('debe exponer los roles del usuario en request.auditRoles para auditoría', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        users_roles_users_roles_user_idTousers: [
          {
            roles: {
              nombre: 'Administrador',
              role_permissions: [
                {
                  permissions: {
                    modulo: 'inventario',
                    recurso: 'inventario',
                    accion: 'ver',
                    activo: true,
                  },
                },
              ],
            },
          },
          {
            roles: { nombre: 'Operador', role_permissions: [] },
          },
        ],
      });

      const request: Record<string, unknown> = { user: { id: 'user-1' } };
      const handler = jest.fn();
      Reflect.defineMetadata(REQUIRE_PERMISSION_KEY, permisoRequerido, handler);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => handler,
      } as unknown as ExecutionContext;

      await guard.canActivate(ctx);

      expect(request['auditRoles']).toEqual(['Administrador', 'Operador']);
    });

    it('debe permitir si el usuario tiene múltiples roles y al menos uno tiene el permiso', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        users_roles_users_roles_user_idTousers: [
          {
            roles: {
              role_permissions: [
                {
                  permissions: {
                    modulo: 'rrhh',
                    recurso: 'trabajadores',
                    accion: 'ver',
                    activo: true,
                  },
                },
              ],
            },
          },
          {
            roles: {
              role_permissions: [
                {
                  permissions: {
                    modulo: 'inventario',
                    recurso: 'inventario',
                    accion: 'ver',
                    activo: true,
                  },
                },
              ],
            },
          },
        ],
      });

      const ctx = mockContext({ id: 'user-1' }, permisoRequerido);

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    // ── CASO: Permisos de operaciones ──
    it('debe rechazar 403 si el usuario no tiene permiso de operaciones.operaciones.ver', async () => {
      const ctx = mockContext(
        { id: 'user-1' },
        { modulo: 'operaciones', recurso: 'operaciones', accion: 'ver' },
      );

      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        users_roles_users_roles_user_idTousers: [
          {
            roles: {
              role_permissions: [
                {
                  permissions: {
                    modulo: 'inventario',
                    recurso: 'inventario',
                    accion: 'ver',
                    activo: true,
                  },
                },
              ],
            },
          },
        ],
      });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe permitir si el usuario tiene permiso de operaciones.operaciones.ver', async () => {
      const ctx = mockContext(
        { id: 'user-1' },
        { modulo: 'operaciones', recurso: 'operaciones', accion: 'ver' },
      );

      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        users_roles_users_roles_user_idTousers: [
          {
            roles: {
              role_permissions: [
                {
                  permissions: {
                    modulo: 'operaciones',
                    recurso: 'operaciones',
                    accion: 'ver',
                    activo: true,
                  },
                },
              ],
            },
          },
        ],
      });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });
  });
});
