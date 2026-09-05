/**
 * Integration tests for ClientesService audit logging — real DB, no mocks.
 *
 * Verifies that cada operación CRUD de clientes escribe el audit correcto
 * en `registro_auditoria`:
 *   CLIENTE_CREADO, CLIENTE_ACTUALIZADO, CLIENTE_ELIMINADO
 *
 * Run with: npm run test:integration -- --testPathPattern="clientes"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { ClientesService } from './clientes.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Clientes Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: ClientesService;
  let auditContext: AuditContextService;

  const createdClienteIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, ClientesService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(ClientesService);
    auditContext = module.get(AuditContextService);
  });

  afterAll(async () => {
    if (!prisma) return;

    if (createdClienteIds.length > 0) {
      await prisma.clientes.deleteMany({
        where: { id: { in: createdClienteIds } },
      });
    }

    await prisma.$disconnect();
    await app.close();
  });

  const createDto = (overrides: Record<string, unknown> = {}) => ({
    nombre: `Cliente ${TEST_ID}-${randomUUID().slice(0, 4)}`,
    empresa: `Empresa ${TEST_ID}`,
    correo: `${TEST_ID}-${randomUUID().slice(0, 4)}@test.mx`,
    telefono: '55-0000-0000',
    ...overrides,
  });

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({
      where: { action, entity_id: entityId },
      orderBy: { timestamp: 'desc' },
    });

  describe('CLIENTE_CREADO', () => {
    it('debe crear cliente y registrar CLIENTE_CREADO en registro_auditoria', async () => {
      const dto = createDto();
      const cliente = await service.create(dto, ACTOR_USER_ID);
      createdClienteIds.push(cliente.id);

      expect(cliente.nombre).toBe(dto.nombre);
      expect(cliente.empresa).toBe(dto.empresa);

      const audits = await findAudits(AuditAction.CLIENTE_CREADO, cliente.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.nombre).toBe(dto.nombre);

      const metadata = audits[0].metadata as Record<string, unknown> | null;
      expect(metadata).not.toBeNull();
      expect(metadata?.source).toBe('SYSTEM');
    });
  });

  describe('CLIENTE_ACTUALIZADO', () => {
    it('debe actualizar cliente y registrar valores previo/nuevo', async () => {
      const dto = createDto();
      const cliente = await service.create(dto, ACTOR_USER_ID);
      createdClienteIds.push(cliente.id);

      const updated = await service.update(
        cliente.id,
        { nombre: 'Cliente Renombrado' },
        ACTOR_USER_ID,
      );
      expect(updated.nombre).toBe('Cliente Renombrado');

      const audits = await findAudits(AuditAction.CLIENTE_ACTUALIZADO, cliente.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const previousValue = audits[0].previous_value as Record<string, unknown> | null;
      expect(previousValue?.nombre).toBe(dto.nombre);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.nombre).toBe('Cliente Renombrado');
    });

    it('debe rechazar actualizar un cliente inexistente Y auditar el fallo', async () => {
      const idInexistente = randomUUID();

      await auditContext.run(
        {
          jwtUserId: ACTOR_USER_ID,
          endpoint: '/api/clientes',
          method: 'PATCH',
        },
        async () => {
          await expect(
            service.update(idInexistente, { nombre: 'X' }, ACTOR_USER_ID),
          ).rejects.toThrow('no encontrado');
        },
      );

      const audits = await prisma.registro_auditoria.findMany({
        where: {
          action: AuditAction.CLIENTE_ACTUALIZADO,
          result: 'FAIL',
          error_code: 'CLIENTE_NO_ENCONTRADO',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const metadata = audits[0].metadata as Record<string, unknown> | null;
      expect(metadata?.endpoint).toBe('/api/clientes');
      expect(metadata?.method).toBe('PATCH');
    });
  });

  describe('CLIENTE_ELIMINADO', () => {
    it('debe soft-delete cliente y registrar CLIENTE_ELIMINADO', async () => {
      const dto = createDto();
      const cliente = await service.create(dto, ACTOR_USER_ID);
      createdClienteIds.push(cliente.id);

      const result = await service.remove(cliente.id, ACTOR_USER_ID);
      expect(result.message).toContain('eliminado');

      const deleted = await prisma.clientes.findUnique({
        where: { id: cliente.id },
      });
      expect(deleted?.eliminado_en).not.toBeNull();

      const audits = await findAudits(AuditAction.CLIENTE_ELIMINADO, cliente.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });
  });
});
