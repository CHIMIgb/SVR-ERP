/**
 * Integration tests for UsuariosService — real DB, no mocks.
 *
 * Verifies:
 * - cada mutación escribe SU registro en `registro_auditoria` (SUCCESS / FAIL + error_code).
 * - los índices únicos RECHAZAN duplicados reales (email, persona↔usuario).
 * - el soft delete cierra las sesiones activas del usuario.
 * - DELETE contra `registro_auditoria` es rechazado por el trigger (inmutable).
 *
 * Run with: npm run test:integration -- --testPathPattern="usuarios"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, CategoriaReporte } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { UsuariosService } from './usuarios.service';
import { QueryUsuariosDto } from './dto/query-usuarios.dto';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Usuarios (Real DB)', () => {
  let prisma: PrismaService;
  let service: UsuariosService;

  /** Roles de prueba con prefijo ZZ (fáciles de limpiar; nunca es_sistema). */
  let rolZZ: { id: string; nombre: string };
  let rolZZ2: { id: string; nombre: string };

  /** Limpieza: personas + users creados por este spec. */
  const createdPersonas: string[] = [];
  const createdUsers: string[] = [];
  const createdRoles: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        AuditContextService,
        AuditService,
        UsuariosService,
      ],
    }).compile();

    prisma = module.get(PrismaService);
    service = module.get(UsuariosService);

    const rol = await prisma.roles.create({
      data: {
        id: randomUUID(),
        nombre: `ZZ-rol-${TEST_ID}`,
        descripcion: 'rol de prueba de usuarios (fase 1)',
        nivel: 5,
        es_sistema: false,
        actualizado_en: new Date(),
      },
    });
    rolZZ = { id: rol.id, nombre: rol.nombre };
    createdRoles.push(rol.id);

    const rol2 = await prisma.roles.create({
      data: {
        id: randomUUID(),
        nombre: `ZZ-rol2-${TEST_ID}`,
        nivel: 4,
        es_sistema: false,
        actualizado_en: new Date(),
      },
    });
    rolZZ2 = { id: rol2.id, nombre: rol2.nombre };
    createdRoles.push(rol2.id);
  });

  afterAll(async () => {
    if (!prisma) return;

    // FK-safe: sesiones → users_roles → users → personas → roles.
    await prisma.sessions.deleteMany({
      where: { user_id: { in: createdUsers } },
    });
    await prisma.users_roles.deleteMany({
      where: { user_id: { in: createdUsers } },
    });
    await prisma.users.deleteMany({
      where: { id: { in: createdUsers } },
    });
    await prisma.personas.deleteMany({
      where: { id: { in: createdPersonas } },
    });
    await prisma.roles.deleteMany({
      where: { id: { in: createdRoles } },
    });
    // registro_auditoria es INMUTABLE (trigger) — se deja.

    await prisma.$disconnect();
  });

  /** Crea una persona de prueba (limpiable). */
  const crearPersona = async () => {
    const persona = await prisma.personas.create({
      data: {
        id: randomUUID(),
        nombre: `Persona ${TEST_ID}`,
        apellido_paterno: 'Prueba',
        actualizado_en: new Date(),
      },
    });
    createdPersonas.push(persona.id);
    return persona;
  };

  /** Crea un usuario real vía el service (quedan en createdUsers para limpiar). */
  const crearUsuario = async (emailSuffix = '') => {
    const persona = await crearPersona();
    const creado = await service.create(
      {
        personaId: persona.id,
        email: `zz-usr-${TEST_ID}-${randomUUID().slice(0, 4)}${emailSuffix}@test.mx`,
        password: 'passwordSegura1',
        rolId: rolZZ.id,
      },
      ACTOR_USER_ID,
    );
    createdUsers.push(creado.id);
    return creado;
  };

  describe('USUARIO_CREADO', () => {
    it('crea persona + user y registra USUARIO_CREADO (SUCCESS)', async () => {
      const creado = await crearUsuario();

      expect(creado.email).toContain('zz-usr-');
      expect(creado.roles).toHaveLength(1);
      expect(creado.roles[0].nombre).toBe(rolZZ.nombre);
      expect(creado.roles[0].esPrincipal).toBe(true);
      expect(creado.pinEstado).toBe('NORMAL');

      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.USUARIO_CREADO, entity_id: creado.id },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });

    it('rechaza email duplicado (índice único real) con FAIL + EMAIL_DUPLICADO', async () => {
      const creado = await crearUsuario();

      // La misma persona no puede repetirse (persona_id único), así que el
      // duplicado de email se intenta con otra persona nueva.
      const persona2 = await crearPersona();
      await expect(
        service.create(
          {
            personaId: persona2.id,
            email: creado.email, // YA existe — el pre-check y el índice lo rechazan
            password: 'passwordSegura1',
            rolId: rolZZ.id,
          },
          ACTOR_USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);

      const fail = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.USUARIO_CREADO,
          result: AuditResult.FAIL,
          error_code: 'EMAIL_DUPLICADO',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(fail).not.toBeNull();
      expect(fail!.severity).toBe('WARNING');
    });

    it('rechaza rol es_sistema con FAIL + ROL_NO_ASIGNABLE', async () => {
      const admin = await prisma.roles.findFirst({
        where: { es_sistema: true },
        select: { id: true },
      });
      expect(admin).not.toBeNull();
      const persona = await crearPersona();
      await expect(
        service.create(
          {
            personaId: persona.id,
            email: `zz-usr-${TEST_ID}-admin@test.mx`,
            password: 'passwordSegura1',
            rolId: admin!.id,
          },
          ACTOR_USER_ID,
        ),
      ).rejects.toThrow(ForbiddenException);

      const fail = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.USUARIO_CREADO,
          result: AuditResult.FAIL,
          error_code: 'ROL_NO_ASIGNABLE',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(fail).not.toBeNull();
    });

    it('rechaza persona que ya tiene usuario con FAIL + PERSONA_YA_TIENE_USUARIO', async () => {
      const creado = await crearUsuario();
      await expect(
        service.create(
          {
            personaId: creado.personaId,
            email: `zz-usr-${TEST_ID}-otro@test.mx`,
            password: 'passwordSegura1',
            rolId: rolZZ.id,
          },
          ACTOR_USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);

      const fail = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.USUARIO_CREADO,
          result: AuditResult.FAIL,
          error_code: 'PERSONA_YA_TIENE_USUARIO',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(fail).not.toBeNull();
    });
  });

  describe('USUARIO_ACTUALIZADO', () => {
    it('edita el área (torre) y registra SUCCESS', async () => {
      const creado = await crearUsuario();
      const actualizado = await service.update(
        creado.id,
        { torre: 'RESIDENTE' as CategoriaReporte },
        ACTOR_USER_ID,
      );
      expect(actualizado.torre).toBe('RESIDENTE');

      const audit = await prisma.registro_auditoria.findFirst({
        where: { action: AuditAction.USUARIO_ACTUALIZADO, entity_id: creado.id, result: 'SUCCESS' },
        orderBy: { timestamp: 'desc' },
      });
      expect(audit).not.toBeNull();
    });
  });

  describe('USUARIO_ELIMINADO', () => {
    it('soft delete cierra las sesiones activas y registra SUCCESS', async () => {
      const creado = await crearUsuario();

      // Sesión activa real para verificar que la baja la cierra.
      await prisma.sessions.create({
        data: {
          id: randomUUID(),
          user_id: creado.id,
          refresh_token_jti: randomUUID(),
          activa: true,
          expira_en: new Date(Date.now() + 3_600_000),
          actualizado_en: new Date(),
        },
      });

      const resultado = await service.remove(creado.id, ACTOR_USER_ID);
      expect(resultado.message).toBe('Usuario eliminado');

      const row = await prisma.users.findUnique({ where: { id: creado.id } });
      expect(row!.eliminado_en).not.toBeNull();
      expect(row!.activo).toBe(false);

      const sesiones = await prisma.sessions.findMany({
        where: { user_id: creado.id },
      });
      expect(sesiones.every((s) => !s.activa)).toBe(true);
      expect(sesiones[0].motivo_cierre).toBe('usuario_eliminado');

      const audit = await prisma.registro_auditoria.findFirst({
        where: { action: AuditAction.USUARIO_ELIMINADO, entity_id: creado.id, result: 'SUCCESS' },
        orderBy: { timestamp: 'desc' },
      });
      expect(audit).not.toBeNull();
    });

    it('no permite eliminar al propio actor con FAIL', async () => {
      await expect(service.remove(ACTOR_USER_ID, ACTOR_USER_ID)).rejects.toThrow(
        BadRequestException,
      );
      const fail = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.USUARIO_ELIMINADO,
          result: AuditResult.FAIL,
          error_code: 'NO_PUEDE_ELIMINARSE_A_SI_MISMO',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(fail).not.toBeNull();
    });

    it('no permite eliminar al único Administrador con FAIL + ULTIMO_ADMINISTRADOR', async () => {
      // El admin seed es el único es_sistema activo de la BD. El actor de la
      // baja NO puede ser el propio admin (guard de self-delete) — se usa
      // otro usuario existente de la BD.
      const adminSeed = await prisma.users.findFirst({
        where: {
          eliminado_en: null,
          users_roles_users_roles_user_idTousers: {
            some: { activo: true, roles: { es_sistema: true } },
          },
        },
        select: { id: true },
      });
      expect(adminSeed).not.toBeNull();

      const otroUser = await prisma.users.findFirst({
        where: { eliminado_en: null, id: { not: adminSeed!.id } },
        select: { id: true },
      });
      expect(otroUser).not.toBeNull();

      await expect(service.remove(adminSeed!.id, otroUser!.id)).rejects.toThrow(
        BadRequestException,
      );
      const fail = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.USUARIO_ELIMINADO,
          result: AuditResult.FAIL,
          error_code: 'ULTIMO_ADMINISTRADOR',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(fail).not.toBeNull();
    });
  });

  describe('ROLES (asignar / revocar)', () => {
    it('asigna y revoca un rol con auditoría real', async () => {
      const creado = await crearUsuario();

      await service.asignarRol(creado.id, { rolId: rolZZ2.id }, ACTOR_USER_ID);
      const asignado = await prisma.users_roles.findFirst({
        where: { user_id: creado.id, rol_id: rolZZ2.id, activo: true },
      });
      expect(asignado).not.toBeNull();

      const auditAlta = await prisma.registro_auditoria.findFirst({
        where: { action: AuditAction.ROL_ASIGNADO, entity_id: creado.id, result: 'SUCCESS' },
        orderBy: { timestamp: 'desc' },
      });
      expect(auditAlta).not.toBeNull();

      // Revocar (deja otro rol activo → pasa el guard de USUARIO_SIN_ROL)
      await service.revocarRol(creado.id, rolZZ2.id, ACTOR_USER_ID);
      const revocado = await prisma.users_roles.findFirst({
        where: { user_id: creado.id, rol_id: rolZZ2.id, activo: true },
      });
      expect(revocado).toBeNull();

      const auditBaja = await prisma.registro_auditoria.findFirst({
        where: { action: AuditAction.ROL_REVOCADO, entity_id: creado.id, result: 'SUCCESS' },
        orderBy: { timestamp: 'desc' },
      });
      expect(auditBaja).not.toBeNull();
    });

    it('rechaza asignar un rol duplicado con FAIL + ROL_YA_ASIGNADO', async () => {
      const creado = await crearUsuario();
      await expect(
        service.asignarRol(creado.id, { rolId: rolZZ.id }, ACTOR_USER_ID),
      ).rejects.toThrow(BadRequestException);

      const fail = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.ROL_ASIGNADO,
          result: AuditResult.FAIL,
          error_code: 'ROL_YA_ASIGNADO',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(fail).not.toBeNull();
    });
  });

  describe('listado (paginado, sin eliminados)', () => {
    it('el listado NO regresa usuarios eliminados', async () => {
      const creado = await crearUsuario();
      await service.remove(creado.id, ACTOR_USER_ID);

      const dto: QueryUsuariosDto = { search: TEST_ID, page: 1, limit: 100 };
      const listado = await service.findAll(dto);
      expect(listado.items.find((i) => i.id === creado.id)).toBeUndefined();
    });
  });

  describe('EQUIPOS (jefe_user_id, JEFE_ASIGNADO)', () => {
    it('asigna, re-asigna y des-asigna jefe con auditoría real y findEquipos lo refleja', async () => {
      const jefe = await crearUsuario();
      const sub = await crearUsuario();

      // Asignar
      const r1 = await service.asignarJefe(sub.id, { jefeUserId: jefe.id }, ACTOR_USER_ID);
      expect(r1.jefeUserId).toBe(jefe.id);
      const row = await prisma.users.findUnique({ where: { id: sub.id } });
      expect(row!.jefe_user_id).toBe(jefe.id);

      let audit = await prisma.registro_auditoria.findFirst({
        where: { action: AuditAction.JEFE_ASIGNADO, entity_id: sub.id, result: 'SUCCESS' },
        orderBy: { timestamp: 'desc' },
      });
      expect(audit).not.toBeNull();
      expect((audit!.metadata as Record<string, unknown>).accion).toBe('asignado');

      // El listado lo refleja
      const equipos = await service.findEquipos();
      const equipoJefe = equipos.equipos.find((e) => e.usuarioId === jefe.id);
      expect(equipoJefe).toBeDefined();
      expect(equipoJefe!.subordinados.some((s) => s.id === sub.id)).toBe(true);
      expect(equipos.sinJefe.some((s) => s.id === sub.id)).toBe(false);

      // Ciclo: el sub no puede ser jefe de su propio jefe → FAIL + JEFE_INVALIDO
      await expect(
        service.asignarJefe(jefe.id, { jefeUserId: sub.id }, ACTOR_USER_ID),
      ).rejects.toThrow(BadRequestException);
      const fail = await prisma.registro_auditoria.findFirst({
        where: { action: AuditAction.JEFE_ASIGNADO, result: AuditResult.FAIL, error_code: 'JEFE_INVALIDO' },
        orderBy: { timestamp: 'desc' },
      });
      expect(fail).not.toBeNull();

      // Des-asignar
      await service.asignarJefe(sub.id, { jefeUserId: null }, ACTOR_USER_ID);
      const row2 = await prisma.users.findUnique({ where: { id: sub.id } });
      expect(row2!.jefe_user_id).toBeNull();
      audit = await prisma.registro_auditoria.findFirst({
        where: { action: AuditAction.JEFE_ASIGNADO, entity_id: sub.id, result: 'SUCCESS' },
        orderBy: { timestamp: 'desc' },
      });
      expect((audit!.metadata as Record<string, unknown>).accion).toBe('desasignado');
    });
  });

  describe('registro_auditoria inmutable', () => {
    it('DELETE contra registro_auditoria es rechazado por el trigger', async () => {
      const creado = await crearUsuario();
      const audit = await prisma.registro_auditoria.findFirst({
        where: { action: AuditAction.USUARIO_CREADO, entity_id: creado.id },
      });
      expect(audit).not.toBeNull();
      await expect(
        prisma.registro_auditoria.delete({ where: { event_id: audit!.event_id } }),
      ).rejects.toThrow();
    });
  });
});
