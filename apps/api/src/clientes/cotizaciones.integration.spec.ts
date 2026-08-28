/**
 * Integration tests for CotizacionesService — real DB, no mocks.
 *
 * Verifies:
 * - crear una cotización escribe el audit correcto en `registro_auditoria` (COTIZACION_CREADA).
 * - el historial de cotizaciones se devuelve ordenado del más reciente al más antiguo.
 *
 * Run with: npm run test:integration -- --testPathPattern="cotizaciones"
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
import { CotizacionesService } from './cotizaciones.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Cotizaciones Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clientesService: ClientesService;
  let service: CotizacionesService;

  const createdClienteIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        AuditContextService,
        AuditService,
        ClientesService,
        CotizacionesService,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    clientesService = module.get(ClientesService);
    service = module.get(CotizacionesService);
  });

  afterAll(async () => {
    if (!prisma) return;

    if (createdClienteIds.length > 0) {
      // FK-safe: primer las cotizaciones, luego los clientes
      await prisma.cotizaciones.deleteMany({
        where: { cliente_id: { in: createdClienteIds } },
      });
      await prisma.clientes.deleteMany({
        where: { id: { in: createdClienteIds } },
      });
    }

    await prisma.$disconnect();
    await app.close();
  });

  const createCliente = async () => {
    const cliente = await clientesService.create(
      {
        nombre: `Cliente ${TEST_ID}-${randomUUID().slice(0, 4)}`,
        empresa: `Empresa ${TEST_ID}`,
        correo: `${TEST_ID}-${randomUUID().slice(0, 4)}@test.mx`,
        telefono: '55-0000-0000',
      },
      ACTOR_USER_ID,
    );
    createdClienteIds.push(cliente.id);
    return cliente;
  };

  describe('COTIZACION_CREADA', () => {
    it('debe crear cotización y registrar COTIZACION_CREADA en registro_auditoria', async () => {
      const cliente = await createCliente();

      const cotizacion = await service.create(
        cliente.id,
        {
          descripcion: `Cotización test ${TEST_ID}`,
          monto: 125000,
          fecha: '2026-08-20',
        },
        ACTOR_USER_ID,
      );

      expect(cotizacion.clienteId).toBe(cliente.id);
      expect(cotizacion.monto).toBe(125000);
      expect(cotizacion.codigo).toContain('COT-');

      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.COTIZACION_CREADA, entity_id: cotizacion.id },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.clienteId).toBe(cliente.id);
      expect(newValue?.monto).toBe(125000);
    });
  });

  describe('HISTORIAL_COTIZACIONES', () => {
    it('debe listar cotizaciones del más reciente al más antiguo', async () => {
      const cliente = await createCliente();

      const antigua = await service.create(
        cliente.id,
        {
          descripcion: 'Cotización antigua',
          monto: 1000,
          fecha: '2026-08-20',
        },
        ACTOR_USER_ID,
      );

      const reciente = await service.create(
        cliente.id,
        {
          descripcion: 'Cotización reciente',
          monto: 2500,
          fecha: '2026-08-25',
        },
        ACTOR_USER_ID,
      );

      const historial = await service.findByCliente(cliente.id);

      expect(historial).toHaveProperty('items');
      expect(historial.items).toHaveLength(2);

      // Orden: más reciente primero
      expect(historial.items[0].id).toBe(reciente.id);
      expect(historial.items[1].id).toBe(antigua.id);

      // Estructura serializada
      for (const item of historial.items) {
        expect(item.clienteId).toBe(cliente.id);
        expect(item.codigo).toMatch(/^COT-\d{8}-/);
        expect(typeof item.monto).toBe('number');
        expect(item.estado).toBe('Pendiente');
        expect(item.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });
});
