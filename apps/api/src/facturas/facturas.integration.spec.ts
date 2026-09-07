/**
 * Facturas Audit (Real DB) — integration tests, no mocks.
 *
 * Verifica que el CRUD de facturas escribe el audit correcto en
 * `registro_auditoria` (inmutable) y que los totales con IVA se
 * calculan y persisten correctamente.
 *
 * Run with: npm run test:integration -- --testPathPattern="facturas"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { FacturasService } from './facturas.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Facturas Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: FacturasService;

  let clienteId: string;
  let facturaId: string;
  let conceptoId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, FacturasService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(FacturasService);

    // Cliente de prueba directo para aislar el flujo.
    const cliente = await prisma.clientes.create({
      data: {
        id: randomUUID(),
        codigo: `IT-FAC-${TEST_ID}`,
        nombre: `Cliente IT Facturas ${TEST_ID}`,
        empresa: `Empresa IT FAC ${TEST_ID}`,
        correo: `${TEST_ID}@integration-facturas.mx`,
        telefono: '55-0000-0000',
        activo: true,
        actualizado_en: new Date(),
      },
    });
    clienteId = cliente.id;
  });

  afterAll(async () => {
    if (!prisma) return;

    if (facturaId) {
      await prisma.factura_conceptos.deleteMany({ where: { factura_id: facturaId } });
      await prisma.facturas.deleteMany({ where: { id: facturaId } });
    }
    if (clienteId) {
      await prisma.clientes.deleteMany({ where: { id: clienteId } });
    }
    // registro_auditoria es IMMUTABLE — se conserva.

    await prisma.$disconnect();
    await app.close();
  });

  it('debe crear factura y registrar FACTURA_CREADA en registro_auditoria', async () => {
    const factura = await service.create(
      {
        clienteId,
        conceptos: [
          { cantidad: 2, unidad: 'm³', descripcion: 'Excavación', valorUnitario: 500 },
          { cantidad: 3, unidad: 'pza', descripcion: 'Acarreo', valorUnitario: 100, objetoImpuesto: '02' },
        ],
      },
      ACTOR_USER_ID,
    );
    facturaId = factura.id;

    // 1. Auditoría SUCCESS
    const audit = await prisma.registro_auditoria.findFirst({
      where: { action: AuditAction.FACTURA_CREADA, entity_id: facturaId },
    });
    expect(audit).not.toBeNull();
    expect(audit!.result).toBe(AuditResult.SUCCESS);

    // 2. Totales con IVA por concepto: 2×500=1000 @16% → 160 IVA; 3×100=300 exento
    expect(Number(factura.subtotal)).toBe(1300);
    expect(Number(factura.impuestos)).toBe(160);
    expect(Number(factura.total)).toBe(1460);

    // 3. Conceptos persistidos
    const conceptos = await prisma.factura_conceptos.findMany({
      where: { factura_id: facturaId, activo: true },
      orderBy: { descripcion: 'desc' },
    });
    expect(conceptos).toHaveLength(2);
    expect(conceptos.find((c) => c.objeto_impuesto === '04')).toBeDefined();
    expect(conceptos.find((c) => c.objeto_impuesto === '02')).toBeDefined();
    expect(conceptos.some((c) => Number(c.importe) === 1000)).toBe(true);
    expect(conceptos.some((c) => Number(c.importe) === 300)).toBe(true);
  });

  it('debe timbrar y registrar FACTURA_TIMBRADA, luego NO permitir edición', async () => {
    const timbrada = await service.cambiarEstado(facturaId, { estado: 'TIMBRADA' }, ACTOR_USER_ID);
    expect(timbrada.estado).toBe('TIMBRADA');

    const audit = await prisma.registro_auditoria.findFirst({
      where: { action: AuditAction.FACTURA_TIMBRADA, entity_id: facturaId },
    });
    expect(audit).not.toBeNull();
    expect(audit!.result).toBe(AuditResult.SUCCESS);

    // Factura timbrada es inmutable → editar lanza Conflict y audita FAIL
    await expect(
      service.update(facturaId, { usoCfdi: 'G01' }, ACTOR_USER_ID),
    ).rejects.toThrow();

    const failAudit = await prisma.registro_auditoria.findFirst({
      where: {
        action: AuditAction.FACTURA_ACTUALIZADA,
        entity_id: facturaId,
        result: AuditResult.FAIL,
        error_code: 'FACTURA_NO_EDITABLE',
      },
      orderBy: { timestamp: 'desc' },
    });
    expect(failAudit).not.toBeNull();
  });

  it('debe cancelar con motivo y registrar FACTURA_CANCELADA', async () => {
    // Crear una factura nueva PENDIENTE para cancelarla
    const pendiente = await service.create(
      { clienteId, conceptos: [{ cantidad: 1, unidad: 'pza', descripcion: 'Proyecto', valorUnitario: 1000 }] },
      ACTOR_USER_ID,
    );

    await service.cambiarEstado(pendiente.id, { estado: 'CANCELADA', motivoCancelacion: 'Error en datos fiscales' }, ACTOR_USER_ID);

    const audit = await prisma.registro_auditoria.findFirst({
      where: { action: AuditAction.FACTURA_CANCELADA, entity_id: pendiente.id },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).not.toBeNull();
    expect(audit!.result).toBe(AuditResult.SUCCESS);

    const factura = await prisma.facturas.findUnique({ where: { id: pendiente.id } });
    expect(factura!.estado).toBe('CANCELADA');

    await prisma.factura_conceptos.deleteMany({ where: { factura_id: pendiente.id } });
    await prisma.facturas.deleteMany({ where: { id: pendiente.id } });
  });
});