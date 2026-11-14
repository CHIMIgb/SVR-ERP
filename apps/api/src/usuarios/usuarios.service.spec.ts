import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('UsuariosService', () => {
  let service: UsuariosService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const ACTOR = 'c0000000-0000-0000-0000-000000000001';
  const ROL_ID = 'e0000000-0000-0000-0000-0000000000a5'; // Trabajador
  const USER_ID = '550e8400-e29b-41d4-a716-446655440010';
  const PERSONA_ID = '660e8400-e29b-41d4-a716-446655440010';

  const mockUsuarioRow = {
    id: USER_ID,
    persona_id: PERSONA_ID,
    email: 'nuevo@svr.com',
    activo: true,
    torre: 'ADMINISTRATIVO',
    numero_empleado: null,
    intentos_pin: 0,
    pin_temporal_hasta: null,
    creado_en: new Date('2026-11-14'),
    personas_users_persona_idTopersonas: { nombre: 'Ana', apellido_paterno: 'Lopez', apellido_materno: null },
    users_roles_users_roles_user_idTousers: [
      { activo: true, es_principal: true, roles: { id: ROL_ID, nombre: 'Trabajador' } },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: PrismaService, useValue: mockPrisma() },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(UsuariosService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
    mockAudit.log.mockResolvedValue(undefined);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mockPrisma(): any {
    return {
      users: {
        findMany: jest.fn().mockResolvedValue([mockUsuarioRow]),
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue(mockUsuarioRow),
        update: jest.fn().mockResolvedValue(mockUsuarioRow),
      },
      personas: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: PERSONA_ID }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      roles: { findFirst: jest.fn().mockResolvedValue({ id: ROL_ID, nombre: 'Trabajador' }) },
      users_roles: {
        findFirst: jest.fn(),
        count: jest.fn().mockResolvedValue(2),
        create: jest.fn().mockResolvedValue({ id: 'ur-1' }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      sessions: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      $transaction: jest.fn((ops: unknown) =>
        Array.isArray(ops) ? Promise.resolve(ops) : Promise.resolve((ops as (tx: unknown) => unknown)(prisma)),
      ),
    };
  }

  describe('findAll', () => {
    it('pagina con techo de 100 y excluye eliminados', async () => {
      await service.findAll({ page: 1, limit: 500 });
      const args = prisma.users.findMany.mock.calls[0][0];
      expect(args.where.eliminado_en).toBeNull();
      expect(args.take).toBe(100);
      expect(args.skip).toBe(0);
      const result = await service.findAll({ page: 1, limit: 500 });
      expect(result.pagination).toEqual({ page: 1, limit: 100, total: 1, totalPages: 1 });
      expect(result.items[0].email).toBe('nuevo@svr.com');
    });

    it('aplica search y filtros de rol/estado', async () => {
      await service.findAll({ search: 'ana', rolId: ROL_ID, estado: 'activo' });
      const args = prisma.users.findMany.mock.calls[0][0];
      expect(args.where.OR).toEqual(expect.any(Array));
      expect(args.where.users_roles_users_roles_user_idTousers).toEqual({
        some: { activo: true, rol_id: ROL_ID },
      });
      expect(args.where.activo).toBe(true);
    });
  });

  describe('findStats', () => {
    it('devuelve las 4 métricas', async () => {
      const result = await service.findStats();
      expect(result).toEqual({ total: 1, activos: 1, conIdentidad: 1, bloqueados: 1 });
      expect(prisma.users.count).toHaveBeenCalledTimes(4);
    });
  });

  describe('findCatalogos', () => {
    it('devuelve roles asignables y personas sin usuario', async () => {
      prisma.roles.findMany = jest.fn().mockResolvedValue([
        { id: ROL_ID, nombre: 'Trabajador', nivel: 20, torre: null },
      ]);
      prisma.personas.findMany = jest.fn().mockResolvedValue([
        { id: PERSONA_ID, nombre: 'Ana', apellido_paterno: 'Lopez', apellido_materno: null },
      ]);
      const result = await service.findCatalogos();
      expect(prisma.roles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { activo: true, eliminado_en: null, es_sistema: false } }),
      );
      expect(result.personas).toEqual([{ id: PERSONA_ID, nombre: 'Ana Lopez' }]);
    });
  });

  describe('create', () => {
    const dtoBase = { email: 'NUEVO@svr.com', password: 'secreta123', rolId: ROL_ID };

    it('crea usuario con persona nueva y audit SUCCESS', async () => {
      prisma.users.findFirst.mockResolvedValue(null); // email libre
      const result = await service.create(
        { ...dtoBase, nombre: 'Ana' },
        ACTOR,
      );
      expect(prisma.personas.create).toHaveBeenCalled();
      const userData = prisma.users.create.mock.calls[0][0].data;
      expect(userData.email).toBe('nuevo@svr.com'); // normalizado a minúsculas
      expect(userData.password_hash).not.toBe('secreta123');
      expect(userData.users_roles_users_roles_user_idTousers.create.es_principal).toBe(true);
      expect(result.email).toBe('nuevo@svr.com');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.USUARIO_CREADO, result: AuditResult.SUCCESS }),
      );
    });

    it('reutiliza la persona existente del catálogo', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      prisma.personas.findUnique.mockResolvedValue({
        id: PERSONA_ID,
        users_users_persona_idTopersonas: null,
      });
      await service.create({ ...dtoBase, personaId: PERSONA_ID }, ACTOR);
      expect(prisma.personas.create).not.toHaveBeenCalled();
      expect(prisma.users.create.mock.calls[0][0].data.persona_id).toBe(PERSONA_ID);
    });

    it('rechaza rol no asignable con FAIL + ROL_NO_ASIGNABLE', async () => {
      prisma.roles.findFirst.mockResolvedValue(null);
      await expect(service.create({ ...dtoBase, nombre: 'Ana' }, ACTOR)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          result: AuditResult.FAIL,
          errorCode: 'ROL_NO_ASIGNABLE',
        }),
      );
    });

    it('rechaza email duplicado con FAIL + EMAIL_DUPLICADO', async () => {
      prisma.users.findFirst.mockResolvedValue({ id: 'otro' });
      await expect(service.create({ ...dtoBase, nombre: 'Ana' }, ACTOR)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'EMAIL_DUPLICADO' }),
      );
    });

    it('rechaza persona que ya tiene usuario con FAIL + PERSONA_YA_TIENE_USUARIO', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      prisma.personas.findUnique.mockResolvedValue({
        id: PERSONA_ID,
        users_users_persona_idTopersonas: { id: 'otro-user' },
      });
      await expect(
        service.create({ ...dtoBase, personaId: PERSONA_ID }, ACTOR),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'PERSONA_YA_TIENE_USUARIO' }),
      );
    });

    it('rechaza alta rápida sin nombre con FAIL + PERSONA_REQUERIDA', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(service.create(dtoBase, ACTOR)).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'PERSONA_REQUERIDA' }),
      );
    });

    it('carrera real: P2002 → FAIL + EMAIL_DUPLICADO', async () => {
      prisma.users.findFirst.mockResolvedValue(null); // pre-check pasa
      const p2002 = new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'x',
      });
      prisma.users.create.mockRejectedValue(p2002);
      await expect(service.create({ ...dtoBase, nombre: 'Ana' }, ACTOR)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'EMAIL_DUPLICADO' }),
      );
    });
  });

  describe('update', () => {
    it('edita y audita SUCCESS', async () => {
      prisma.users.findFirst.mockResolvedValue({
        id: USER_ID,
        email: 'nuevo@svr.com',
        torre: null,
        activo: true,
      });
      await service.update(USER_ID, { torre: 'RESIDENTE' }, ACTOR);
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ torre: 'RESIDENTE' }) }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.USUARIO_ACTUALIZADO, result: AuditResult.SUCCESS }),
      );
    });

    it('usuario no encontrado → FAIL + USUARIO_NO_ENCONTRADO', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(service.update(USER_ID, {}, ACTOR)).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'USUARIO_NO_ENCONTRADO' }),
      );
    });

    it('email tomado por otro → FAIL + EMAIL_DUPLICADO', async () => {
      prisma.users.findFirst
        .mockResolvedValueOnce({ id: USER_ID, email: 'nuevo@svr.com' }) // el propio
        .mockResolvedValueOnce({ id: 'otro-user' }); // el email lo tiene otro
      await expect(
        service.update(USER_ID, { email: 'otro@svr.com' }, ACTOR),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'EMAIL_DUPLICADO' }),
      );
    });
  });

  describe('remove', () => {
    it('soft delete + cierra sesiones, audit SUCCESS', async () => {
      prisma.users.findFirst.mockResolvedValue({
        id: USER_ID,
        email: 'nuevo@svr.com',
        users_roles_users_roles_user_idTousers: [{ activo: true, roles: { nombre: 'Trabajador', es_sistema: false } }],
      });
      const result = await service.remove(USER_ID, ACTOR);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.sessions.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: USER_ID, activa: true }),
        }),
      );
      expect(result.message).toBe('Usuario eliminado');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.USUARIO_ELIMINADO, result: AuditResult.SUCCESS }),
      );
    });

    it('no se puede eliminar a sí mismo → FAIL', async () => {
      await expect(service.remove(ACTOR, ACTOR)).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'NO_PUEDE_ELIMINARSE_A_SI_MISMO' }),
      );
    });

    it('no encontrado → FAIL + USUARIO_NO_ENCONTRADO', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(service.remove(USER_ID, ACTOR)).rejects.toThrow(NotFoundException);
    });

    it('último Administrador → FAIL + ULTIMO_ADMINISTRADOR', async () => {
      prisma.users.findFirst.mockResolvedValue({
        id: USER_ID,
        email: 'admin@svr.com',
        users_roles_users_roles_user_idTousers: [{ activo: true, roles: { nombre: 'Administrador', es_sistema: true } }],
      });
      prisma.users.count.mockResolvedValue(1); // solo él
      await expect(service.remove(USER_ID, ACTOR)).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'ULTIMO_ADMINISTRADOR' }),
      );
    });
  });

  describe('asignarRol', () => {
    const dto = { rolId: ROL_ID };

    it('asigna y audita ROL_ASIGNADO SUCCESS', async () => {
      prisma.users.findFirst.mockResolvedValue({ id: USER_ID, email: 'a@b.com' });
      prisma.users_roles.findFirst.mockResolvedValue(null);
      await service.asignarRol(USER_ID, dto, ACTOR);
      expect(prisma.users_roles.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ROL_ASIGNADO, result: AuditResult.SUCCESS }),
      );
    });

    it('rol ya asignado → FAIL + ROL_YA_ASIGNADO', async () => {
      prisma.users.findFirst.mockResolvedValue({ id: USER_ID, email: 'a@b.com' });
      prisma.users_roles.findFirst.mockResolvedValue({ id: 'ur-1' });
      await expect(service.asignarRol(USER_ID, dto, ACTOR)).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'ROL_YA_ASIGNADO' }),
      );
    });

    it('rol no asignable → FAIL + ROL_NO_ASIGNABLE', async () => {
      prisma.users.findFirst.mockResolvedValue({ id: USER_ID, email: 'a@b.com' });
      prisma.roles.findFirst.mockResolvedValue(null);
      await expect(service.asignarRol(USER_ID, dto, ACTOR)).rejects.toThrow(ForbiddenException);
    });

    it('usuario no encontrado → FAIL', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(service.asignarRol(USER_ID, dto, ACTOR)).rejects.toThrow(NotFoundException);
    });

    it('es_principal quita el principal anterior en transacción', async () => {
      prisma.users.findFirst.mockResolvedValue({ id: USER_ID, email: 'a@b.com' });
      prisma.users_roles.findFirst.mockResolvedValue(null);
      await service.asignarRol(USER_ID, { ...dto, esPrincipal: true }, ACTOR);
      expect(prisma.users_roles.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: USER_ID, activo: true } }),
      );
    });
  });

  describe('findEquipos', () => {
    const jefeRow = {
      id: 'user-jefe',
      email: 'residente@test.mx',
      torre: 'RESIDENTE',
      numero_empleado: 'RES-001',
      personas_users_persona_idTopersonas: { nombre: 'Resi', apellido_paterno: 'Dente', apellido_materno: null },
      users_roles_users_roles_user_idTousers: [
        { activo: true, roles: { nombre: 'Residente' } },
      ],
    };
    const subRow = {
      id: 'user-sub',
      email: 'sub@test.mx',
      torre: 'MECANICO',
      numero_empleado: 'TRA-010',
      personas_users_persona_idTopersonas: { nombre: 'Sub', apellido_paterno: 'Ordinado', apellido_materno: null },
      users_roles_users_roles_user_idTousers: [
        { activo: true, roles: { nombre: 'Trabajador' } },
      ],
    };

    it('agrupa subordinados por jefe y lista los sin jefe', async () => {
      prisma.users.findMany = jest
        .fn()
        .mockResolvedValueOnce([jefeRow]) // jefes
        .mockResolvedValueOnce([{ ...subRow, jefe_user_id: 'user-jefe' }]) // subordinados
        .mockResolvedValueOnce([{ ...subRow, id: 'user-libre', jefe_user_id: null }]); // sin jefe
      const result = await service.findEquipos();
      expect(result.equipos).toHaveLength(1);
      expect(result.equipos[0].usuarioId).toBe('user-jefe');
      expect(result.equipos[0].nombre).toBe('Resi Dente');
      expect(result.equipos[0].subordinados).toEqual([
        expect.objectContaining({ id: 'user-sub', nombre: 'Sub Ordinado' }),
      ]);
      expect(result.sinJefe).toEqual([
        expect.objectContaining({ id: 'user-libre' }),
      ]);
    });

    it('sin jefes no consulta subordinados', async () => {
      prisma.users.findMany = jest
        .fn()
        .mockResolvedValueOnce([]) // jefes
        .mockResolvedValueOnce([]); // sin jefe
      const result = await service.findEquipos();
      expect(result.equipos).toEqual([]);
      expect(result.sinJefe).toEqual([]);
      expect(prisma.users.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('asignarJefe', () => {
    it('asigna jefe y audita JEFE_ASIGNADO SUCCESS', async () => {
      prisma.users.findFirst
        .mockResolvedValueOnce({ id: USER_ID, jefe_user_id: null }) // el usuario
        .mockResolvedValueOnce({ id: 'user-jefe', jefe_user_id: null }); // el jefe
      prisma.users.update.mockResolvedValue({ id: USER_ID, jefe_user_id: 'user-jefe' });
      const result = await service.asignarJefe(USER_ID, { jefeUserId: 'user-jefe' }, ACTOR);
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: USER_ID }, data: expect.objectContaining({ jefe_user_id: 'user-jefe' }) }),
      );
      expect(result.jefeUserId).toBe('user-jefe');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.JEFE_ASIGNADO, result: AuditResult.SUCCESS }),
      );
    });

    it('des-asigna (null) y audita con accion desasignado', async () => {
      prisma.users.findFirst.mockResolvedValue({ id: USER_ID, jefe_user_id: 'user-jefe' });
      prisma.users.update.mockResolvedValue({ id: USER_ID, jefe_user_id: null });
      await service.asignarJefe(USER_ID, { jefeUserId: null }, ACTOR);
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ jefe_user_id: null }) }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.JEFE_ASIGNADO,
          metadata: expect.objectContaining({ accion: 'desasignado' }),
        }),
      );
    });

    it('no encontrado → FAIL + USUARIO_NO_ENCONTRADO', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(service.asignarJefe(USER_ID, { jefeUserId: null }, ACTOR)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'USUARIO_NO_ENCONTRADO' }),
      );
    });

    it('auto-jefe → FAIL + JEFE_INVALIDO', async () => {
      prisma.users.findFirst.mockResolvedValue({ id: USER_ID, jefe_user_id: null });
      await expect(
        service.asignarJefe(USER_ID, { jefeUserId: USER_ID }, ACTOR),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'JEFE_INVALIDO' }),
      );
    });

    it('jefe inexistente/inactivo → FAIL + JEFE_INVALIDO', async () => {
      prisma.users.findFirst
        .mockResolvedValueOnce({ id: USER_ID, jefe_user_id: null })
        .mockResolvedValueOnce(null);
      await expect(
        service.asignarJefe(USER_ID, { jefeUserId: 'user-fantasma' }, ACTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('ciclo: el jefe es subordinado del usuario → FAIL + JEFE_INVALIDO', async () => {
      prisma.users.findFirst
        .mockResolvedValueOnce({ id: USER_ID, jefe_user_id: null })
        .mockResolvedValueOnce({ id: 'user-sub', jefe_user_id: USER_ID });
      await expect(
        service.asignarJefe(USER_ID, { jefeUserId: 'user-sub' }, ACTOR),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'JEFE_INVALIDO' }),
      );
      expect(prisma.users.update).not.toHaveBeenCalled();
    });
  });

  describe('revocarRol', () => {
    it('revoca y audita ROL_REVOCADO SUCCESS', async () => {
      prisma.users_roles.findFirst.mockResolvedValue({
        id: 'ur-1',
        roles: { nombre: 'Trabajador' },
      });
      prisma.users_roles.count.mockResolvedValue(2);
      await service.revocarRol(USER_ID, ROL_ID, ACTOR);
      expect(prisma.users_roles.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'ur-1' } }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ROL_REVOCADO, result: AuditResult.SUCCESS }),
      );
    });

    it('rol no activo → FAIL + ROL_NO_ASIGNADO', async () => {
      prisma.users_roles.findFirst.mockResolvedValue(null);
      await expect(service.revocarRol(USER_ID, ROL_ID, ACTOR)).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'ROL_NO_ASIGNADO' }),
      );
    });

    it('último rol activo → FAIL + USUARIO_SIN_ROL', async () => {
      prisma.users_roles.findFirst.mockResolvedValue({
        id: 'ur-1',
        roles: { nombre: 'Trabajador' },
      });
      prisma.users_roles.count.mockResolvedValue(1);
      await expect(service.revocarRol(USER_ID, ROL_ID, ACTOR)).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'USUARIO_SIN_ROL' }),
      );
    });
  });
});
