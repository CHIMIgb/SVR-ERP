/**
 * Integration tests de Flota (máquinas, despachos, checklists) — BD real, sin mocks.
 *
 * - Alta de máquina: código en mayúsculas, duplicado rechazado (también dos altas al mismo tiempo) y auditoría
 *   MAQUINA_CREADA SUCCESS/FAIL con error_code.
 * - Despachos: traslape rechazado (también dos despachos encimados al mismo tiempo), auditoría DESPACHO_CREADO,
 *   listado paginado y la ventana de fechas del cronograma.
 * - Checklists: luces y alarmas se guarda, una falla deja el checklist CON_FALLA y se audita con WARNING.
 * - registro_auditoria es inmutable.
 *
 * Run with: npm run test:integration -- --testPathPattern="flota"
 * Requires: PostgreSQL running con la DB configurada en apps/api/.env.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditContextService } from '../../audit/audit-context.service';
import { MaquinasService } from './maquinas.service';
import { DespachosService } from '../despachos/despachos.service';
import { ChecklistsService } from '../checklists/checklists.service';
import { CreateChecklistDto } from '../checklists/dto/create-checklist.dto';

const TEST_ID = randomUUID().slice(0, 6).toUpperCase();
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Flota: máquinas, despachos y checklists (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let maquinas: MaquinasService;
  let despachos: DespachosService;
  let checklists: ChecklistsService;

  const tipoNombre = `TF-${TEST_ID}`;
  const codigo = `ZT${TEST_ID}`;
  const codigoCarrera = `ZR${TEST_ID}`;
  const clienteId = randomUUID();
  const proyectoId = randomUUID();
  const proyectoCodigo = `IT-FLOTA-${TEST_ID}`;
  const inicio = new Date();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, MaquinasService, DespachosService, ChecklistsService],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    prisma = module.get(PrismaService);
    maquinas = module.get(MaquinasService);
    despachos = module.get(DespachosService);
    checklists = module.get(ChecklistsService);

    await prisma.clientes.create({
      data: {
        id: clienteId, codigo: `IT-FLOTA-${TEST_ID}`, nombre: `Cliente IT Flota ${TEST_ID}`, empresa: `Empresa IT ${TEST_ID}`,
        correo: `flota-${TEST_ID}@integration.mx`, telefono: '55-0000-0000', activo: true, actualizado_en: new Date(),
      },
    });
    await prisma.proyectos.create({
      data: {
        id: proyectoId, codigo: proyectoCodigo, nombre: `Obra IT Flota ${TEST_ID}`, cliente_id: clienteId, presupuesto: 100000,
        fecha_inicio: new Date('2026-01-01'), fecha_fin: new Date('2026-12-31'), activo: true, actualizado_en: new Date(),
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    const ids = (await prisma.maquinas.findMany({ where: { codigo: { in: [codigo, codigoCarrera] } }, select: { id: true } })).map((m) => m.id);
    await prisma.checklists_preoperacionales.deleteMany({ where: { maquina_id: { in: ids } } });
    await prisma.despachos_maquina.deleteMany({ where: { maquina_id: { in: ids } } });
    await prisma.maquinas.deleteMany({ where: { id: { in: ids } } });
    await prisma.tipos_maquina.deleteMany({ where: { nombre: tipoNombre } });
    await prisma.proyectos.deleteMany({ where: { id: proyectoId } });
    await prisma.clientes.deleteMany({ where: { id: clienteId } });
    await prisma.$disconnect();
    await app.close();
  });

  const auditsDe = (action: AuditAction, where: Record<string, unknown>) =>
    prisma.registro_auditoria.findMany({ where: { action, timestamp: { gte: inicio }, ...where } });

  const altaDto = (id: string, nombre = 'Máquina de prueba') => ({ id, tipo: tipoNombre, nombre, combustible: 50, consumoEsperado: 12 });

  describe('alta de máquina', () => {
    it('da de alta con el código en mayúsculas, el nombre recortado y quién la creó, y audita SUCCESS', async () => {
      const creada = await maquinas.create({ ...altaDto(`  ${codigo.toLowerCase()} `), nombre: '  Máquina de prueba  ', horometro: 10 }, ACTOR_USER_ID);
      expect(creada.id).toBe(codigo);

      const fila = await prisma.maquinas.findUniqueOrThrow({ where: { codigo } });
      expect(fila.nombre).toBe('Máquina de prueba');
      expect(fila.creado_por).toBe(ACTOR_USER_ID);
      const [audit] = await auditsDe(AuditAction.MAQUINA_CREADA, { entity_id: fila.id, result: AuditResult.SUCCESS });
      expect(audit.new_value).toMatchObject({ id: codigo });
    });

    it('rechaza el mismo código en minúsculas con 409 y lo audita como FAIL MAQUINA_DUPLICADA', async () => {
      await expect(maquinas.create(altaDto(codigo.toLowerCase(), 'Duplicada'), ACTOR_USER_ID)).rejects.toThrow(ConflictException);
      expect(await prisma.maquinas.count({ where: { codigo } })).toBe(1);
      const fallos = await auditsDe(AuditAction.MAQUINA_CREADA, {
        result: AuditResult.FAIL, error_code: 'MAQUINA_DUPLICADA', metadata: { path: ['codigo'], equals: codigo },
      });
      expect(fallos).toHaveLength(1);
    });

    it('dos altas del mismo código al mismo tiempo: una se registra y la otra recibe 409 (no 500)', async () => {
      const resultados = await Promise.allSettled([
        maquinas.create(altaDto(codigoCarrera), ACTOR_USER_ID),
        maquinas.create(altaDto(codigoCarrera), ACTOR_USER_ID),
      ]);
      expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect((resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);
      expect(await prisma.maquinas.count({ where: { codigo: codigoCarrera } })).toBe(1);
    });
  });

  describe('despachos', () => {
    const despacho = (fechaInicio: string, fechaFin: string, maquinaId = codigo) => ({ maquinaId, proyectoId: proyectoCodigo, fechaInicio, fechaFin });

    it('despacha a la obra, guarda quién lo hizo y audita SUCCESS', async () => {
      const res = await despachos.create(despacho('2026-03-01', '2026-03-10'), ACTOR_USER_ID);
      expect(res).toMatchObject({ maquinaId: codigo, proyectoId: proyectoCodigo, fechaInicio: '2026-03-01', fechaFin: '2026-03-10' });

      const fila = await prisma.despachos_maquina.findFirstOrThrow({ where: { maquinas: { codigo } } });
      expect(fila.creado_por).toBe(ACTOR_USER_ID);
      expect(await auditsDe(AuditAction.DESPACHO_CREADO, { entity_id: fila.id, result: AuditResult.SUCCESS })).toHaveLength(1);
    });

    it('rechaza un despacho que se encima (409) y lo audita como FAIL DESPACHO_TRASLAPADO', async () => {
      await expect(despachos.create(despacho('2026-03-05', '2026-03-20'), ACTOR_USER_ID)).rejects.toThrow(ConflictException);
      const fallos = await auditsDe(AuditAction.DESPACHO_CREADO, {
        result: AuditResult.FAIL, error_code: 'DESPACHO_TRASLAPADO', metadata: { path: ['maquinaId'], equals: codigo },
      });
      expect(fallos).toHaveLength(1);
    });

    it('dos despachos encimados de la misma máquina al mismo tiempo: solo se registra uno', async () => {
      const resultados = await Promise.allSettled([
        despachos.create(despacho('2026-04-01', '2026-04-05'), ACTOR_USER_ID),
        despachos.create(despacho('2026-04-03', '2026-04-08'), ACTOR_USER_ID),
      ]);
      expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect((resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);
      expect(await prisma.despachos_maquina.count({ where: { maquinas: { codigo }, fecha_inicio: { gte: new Date('2026-04-01') } } })).toBe(1);
    });

    it.each([
      ['FECHAS_INVALIDAS', () => despacho('2026-05-10', '2026-05-01'), BadRequestException],
      ['MAQUINA_NO_ENCONTRADA', () => despacho('2026-05-01', '2026-05-02', `NOEX${TEST_ID}`), NotFoundException],
      ['PROYECTO_NO_ENCONTRADO', () => ({ ...despacho('2026-05-01', '2026-05-02'), proyectoId: `NOEX${TEST_ID}` }), NotFoundException],
    ])('rechaza %s y lo audita como FAIL con su error_code', async (errorCode, armar, Excepcion) => {
      const dto = armar();
      await expect(despachos.create(dto, ACTOR_USER_ID)).rejects.toThrow(Excepcion);
      const fallos = await auditsDe(AuditAction.DESPACHO_CREADO, {
        result: AuditResult.FAIL, error_code: errorCode, metadata: { path: ['fechaInicio'], equals: dto.fechaInicio },
      });
      expect(fallos.length).toBeGreaterThanOrEqual(1);
    });

    it('lista paginado y la ventana del cronograma trae solo los que se enciman con esas fechas', async () => {
      const pagina = await despachos.findAll({ maquinaId: codigo, page: 1, limit: 1 });
      expect(pagina.items).toHaveLength(1);
      expect(pagina.pagination).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
      // Ordenado por inicio, el más reciente primero.
      expect(pagina.items[0].fechaInicio >= '2026-04-01').toBe(true);

      const ventana = await despachos.findAll({ maquinaId: codigo, desde: '2026-03-08', hasta: '2026-03-21' });
      expect(ventana.items.map((d) => d.fechaInicio)).toEqual(['2026-03-01']);
      expect((await despachos.findAll({ limit: 5000 })).pagination.limit).toBe(100);
    });
  });

  describe('checklists', () => {
    const checklistDto = (overrides: Partial<CreateChecklistDto> = {}): CreateChecklistDto => ({
      maquinaId: codigo, operador: `Operador ${TEST_ID}`, horometroInicial: 10, nivelAceiteMotor: 'Correcto', nivelHidraulico: 'Correcto',
      fugasVisibles: false, estadoLlantasOrugas: 'Correcto', lucesYAlarmas: 'Correcto', sistemaFrenos: 'Correcto', observaciones: '', ...overrides,
    });

    it('guarda la falla de luces y alarmas, deja el checklist con falla y lo audita con WARNING', async () => {
      await checklists.create(checklistDto({ lucesYAlarmas: 'Falla', observaciones: 'Faro trasero fundido' }), ACTOR_USER_ID);
      const fila = await prisma.checklists_preoperacionales.findFirstOrThrow({ where: { maquinas: { codigo }, luces_y_alarmas: 'FALLA' } });
      expect(fila.estado).toBe('CON_FALLA');
      expect(fila.creado_por).toBe(ACTOR_USER_ID);

      const [audit] = await auditsDe(AuditAction.CHECKLIST_REGISTRADO, { entity_id: fila.id, result: AuditResult.SUCCESS });
      expect(audit.severity).toBe('WARNING');
    });

    it('con todo correcto queda aprobado, con luces en CORRECTO y auditado como INFO', async () => {
      await checklists.create(checklistDto(), ACTOR_USER_ID);
      const fila = await prisma.checklists_preoperacionales.findFirstOrThrow({ where: { maquinas: { codigo }, estado: 'APROBADO' } });
      expect(fila.luces_y_alarmas).toBe('CORRECTO');
      const [audit] = await auditsDe(AuditAction.CHECKLIST_REGISTRADO, { entity_id: fila.id });
      expect(audit.severity).toBe('INFO');
    });

    it('rechaza una máquina que no existe (404) y lo audita como FAIL MAQUINA_NO_ENCONTRADA', async () => {
      const otro = `NOEX${TEST_ID}`;
      await expect(checklists.create(checklistDto({ maquinaId: otro }), ACTOR_USER_ID)).rejects.toThrow(NotFoundException);
      const fallos = await auditsDe(AuditAction.CHECKLIST_REGISTRADO, {
        result: AuditResult.FAIL, error_code: 'MAQUINA_NO_ENCONTRADA', metadata: { path: ['maquinaId'], equals: otro },
      });
      expect(fallos).toHaveLength(1);
    });

    it('lista paginado y filtra por resultado', async () => {
      const conFalla = await checklists.findAll({ maquinaId: codigo, estado: 'Con Falla' });
      expect(conFalla.items).toHaveLength(1);
      expect(conFalla.pagination.total).toBe(1);
      expect((await checklists.findAll({ maquinaId: codigo })).pagination.total).toBe(2);
    });
  });

  it('registro_auditoria es inmutable: la auditoría del alta no se puede borrar ni modificar', async () => {
    const fila = await prisma.maquinas.findUniqueOrThrow({ where: { codigo } });
    const [audit] = await auditsDe(AuditAction.MAQUINA_CREADA, { entity_id: fila.id });

    await expect(prisma.registro_auditoria.delete({ where: { event_id: audit.event_id } })).rejects.toThrow();
    await expect(
      prisma.registro_auditoria.update({ where: { event_id: audit.event_id }, data: { error_code: 'MANIPULADO' } }),
    ).rejects.toThrow();
    expect((await prisma.registro_auditoria.findUnique({ where: { event_id: audit.event_id } }))?.error_code).toBeNull();
  });
});
