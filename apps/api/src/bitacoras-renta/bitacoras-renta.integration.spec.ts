/**
 * Integration tests for BitacorasRentaService audit logging — real DB, no mocks.
 *
 * Run with: npm run test:integration -- --testPathPattern="bitacoras-renta"
 * Requires: PostgreSQL running con la DB configurada en apps/api/.env.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { BitacorasRentaService } from './bitacoras-renta.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('BitacorasRenta Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: BitacorasRentaService;

  let tipoMaquinaId: string;
  let maquinaId: string;
  const maquinaCodigo = `BR-${TEST_ID}`;
  let trabajadorId: string;
  let categoriaId: string;
  const createdBitacoraIds: string[] = [];
  const clienteNombre = `Cliente Test ${TEST_ID}`;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, BitacorasRentaService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(BitacorasRentaService);

    tipoMaquinaId = randomUUID();
    maquinaId = randomUUID();
    trabajadorId = randomUUID();
    categoriaId = randomUUID();
    const now = new Date();

    await prisma.tipos_maquina.create({
      data: { id: tipoMaquinaId, nombre: `TestTipo-${TEST_ID}`, activo: true, actualizado_en: now },
    });
    await prisma.maquinas.create({
      data: {
        id: maquinaId,
        codigo: maquinaCodigo,
        nombre: `TestMaquina-${TEST_ID}`,
        tipo_id: tipoMaquinaId,
        estado: 'APAGADA',
        lat: 0,
        lng: 0,
        activo: true,
        actualizado_en: now,
      },
    });
    await prisma.categorias_puesto.create({
      data: { id: categoriaId, nombre: `TestCategoriaBR-${TEST_ID}`, activo: true, actualizado_en: now },
    });
    await prisma.trabajadores.create({
      data: {
        id: trabajadorId,
        nombre: `TestOperador-${TEST_ID}`,
        puesto: 'Operador de prueba',
        categoria_puesto_id: categoriaId,
        estado: 'ACTIVO',
        telefono: '55 0000 0000',
        avatar: 'TT',
        sueldo_fiscal: 2500,
        sueldo_efectivo: 3500,
        metodo_pago: 'MIXTO',
        entrada: new Date('1970-01-01T07:00:00'),
        activo: true,
        actualizado_en: now,
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    if (createdBitacoraIds.length > 0) {
      await prisma.cuentas_por_cobrar.deleteMany({
        where: { bitacora_id: { in: createdBitacoraIds } },
      });
      await prisma.firmas_cliente.deleteMany({ where: { bitacora_id: { in: createdBitacoraIds } } });
      await prisma.bitacoras_renta_diaria.deleteMany({ where: { id: { in: createdBitacoraIds } } });
    }
    await prisma.clientes.deleteMany({ where: { nombre: clienteNombre } });
    await prisma.trabajadores.deleteMany({ where: { id: trabajadorId } });
    await prisma.categorias_puesto.deleteMany({ where: { id: categoriaId } });
    await prisma.maquinas.deleteMany({ where: { id: maquinaId } });
    await prisma.tipos_maquina.deleteMany({ where: { id: tipoMaquinaId } });

    await prisma.$disconnect();
    await app.close();
  });

  const createDto = (overrides: Record<string, unknown> = {}) => ({
    trabajadorId,
    maquinaId: maquinaCodigo,
    fecha: '2026-08-20',
    cliente: clienteNombre,
    obraUbicacion: 'Fracc. Valle Sur',
    horaInicio: '07:00',
    horaFin: '17:00',
    horasEfectivas: 8,
    horasExtras: 2,
    horometroInicial: 1245,
    horometroFinal: 1255,
    actividadRealizada: `Excavación de zanja ${TEST_ID}`,
    tarifaHoraRenta: 1450,
    ...overrides,
  });

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({ where: { action, entity_id: entityId }, orderBy: { timestamp: 'desc' } });

  describe('BITACORA_RENTA_CREADA', () => {
    it('debe crear la bitácora, auto-crear el cliente, y calcular el importe correcto', async () => {
      const dto = createDto();
      const bitacora = await service.create(dto, ACTOR_USER_ID);
      createdBitacoraIds.push(bitacora.id);

      expect(bitacora.importeTotalRenta).toBe((8 + 2) * 1450);
      expect(bitacora.cliente).toBe(clienteNombre);

      const cliente = await prisma.clientes.findFirst({ where: { nombre: clienteNombre } });
      expect(cliente).not.toBeNull();

      const audits = await findAudits(AuditAction.BITACORA_RENTA_CREADA, bitacora.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });

    it('debe auditar FAIL cuando el horómetro final es menor al inicial', async () => {
      const dto = createDto({ horometroInicial: 2000, horometroFinal: 1000 });
      await expect(service.create(dto, ACTOR_USER_ID)).rejects.toThrow(BadRequestException);

      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.BITACORA_RENTA_CREADA, error_code: 'HOROMETRO_INVALIDO' },
        orderBy: { timestamp: 'desc' },
        take: 1,
      });
      expect(audits.length).toBe(1);
      expect(audits[0].result).toBe('FAIL');
    });
  });

  describe('BITACORA_RENTA_ACTUALIZADA', () => {
    it('debe actualizar, recalcular el importe, y auditar', async () => {
      const bitacora = await service.create(createDto(), ACTOR_USER_ID);
      createdBitacoraIds.push(bitacora.id);

      const actualizada = await service.update(bitacora.id, { horasEfectivas: 10 }, ACTOR_USER_ID);
      expect(actualizada.importeTotalRenta).toBe((10 + 2) * 1450);

      const audits = await findAudits(AuditAction.BITACORA_RENTA_ACTUALIZADA, bitacora.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
    });
  });

  describe('BITACORA_RENTA_ELIMINADA', () => {
    it('debe soft-delete y auditar', async () => {
      const bitacora = await service.create(createDto(), ACTOR_USER_ID);
      createdBitacoraIds.push(bitacora.id);

      const result = await service.remove(bitacora.id, ACTOR_USER_ID);
      expect(result.message).toContain('eliminada');

      const audits = await findAudits(AuditAction.BITACORA_RENTA_ELIMINADA, bitacora.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
    });
  });

  describe('BITACORA_FACTURADA (O3: bitácora → CxC)', () => {
    it('debe cerrar la bitácora LISTO_FACTURAR, crear la CxC y auditar SUCCESS', async () => {
      const bitacora = await service.create(createDto({ firmado: true }), ACTOR_USER_ID);
      createdBitacoraIds.push(bitacora.id);
      expect(bitacora.estadoCobro).toBe('Listo para Facturar');

      const resultado = await service.facturar(bitacora.id, ACTOR_USER_ID);

      // 1. Bitácora marcada FACTURADO
      const enDb = await prisma.bitacoras_renta_diaria.findUnique({ where: { id: bitacora.id } });
      expect(enDb!.estado_cobro).toBe('FACTURADO');

      // 2. CxC persistida con bitacora_id + monto de la bitácora
      const cxc = await prisma.cuentas_por_cobrar.findUnique({ where: { id: resultado.cuenta.id } });
      expect(cxc).not.toBeNull();
      expect(cxc!.bitacora_id).toBe(bitacora.id);
      expect(Number(cxc!.monto)).toBe(bitacora.importeTotalRenta);
      expect(cxc!.estado).toBe('PENDIENTE');

      // 3. Audits SUCCESS de BITACORA_FACTURADA + CXC_CREADA
      const auditFacturada = await prisma.registro_auditoria.findFirst({
        where: { action: AuditAction.BITACORA_FACTURADA, entity_id: bitacora.id },
      });
      expect(auditFacturada).not.toBeNull();
      expect(auditFacturada!.result).toBe(AuditResult.SUCCESS);

      const auditCxc = await prisma.registro_auditoria.findFirst({
        where: { action: AuditAction.CXC_CREADA, entity_id: resultado.cuenta.id },
      });
      expect(auditCxc).not.toBeNull();
      expect(auditCxc!.result).toBe(AuditResult.SUCCESS);
    });

    it('debe bloquear la segunda facturación (doble clic) con BITACORA_YA_FACTURADA', async () => {
      // La bitácora del test anterior ya quedó FACTURADO con CxC.
      const bitacora = await service.create(createDto({ firmado: true }), ACTOR_USER_ID);
      createdBitacoraIds.push(bitacora.id);
      await service.facturar(bitacora.id, ACTOR_USER_ID);

      await expect(service.facturar(bitacora.id, ACTOR_USER_ID)).rejects.toThrow(ConflictException);

      // En secuencia, el pre-guard detecta el estado FACTURADO (la carrera real
      // BITACORA_YA_FACTURADA se cubre en los unit tests con updateMany count 0).
      const audit = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.BITACORA_FACTURADA,
          entity_id: bitacora.id,
          result: AuditResult.FAIL,
          error_code: 'BITACORA_NO_LISTA_FACTURAR',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audit).not.toBeNull();

      // Solo debe existir UNA CxC para la bitácora.
      const cxcs = await prisma.cuentas_por_cobrar.count({ where: { bitacora_id: bitacora.id } });
      expect(cxcs).toBe(1);
    });

    it('debe rechazar bitácora sin firma (PENDIENTE_FIRMA) con BITACORA_NO_LISTA_FACTURAR', async () => {
      const bitacora = await service.create(createDto(), ACTOR_USER_ID); // firmado: false
      createdBitacoraIds.push(bitacora.id);
      expect(bitacora.estadoCobro).toBe('Pendiente Firma');

      await expect(service.facturar(bitacora.id, ACTOR_USER_ID)).rejects.toThrow(ConflictException);

      const audit = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.BITACORA_FACTURADA,
          entity_id: bitacora.id,
          result: AuditResult.FAIL,
          error_code: 'BITACORA_NO_LISTA_FACTURAR',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audit).not.toBeNull();
    });
  });
});
