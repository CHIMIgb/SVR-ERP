/**
 * Integration tests de Horómetro — BD real, sin mocks.
 *
 * - Registrar una lectura avanza el horómetro de la máquina y queda auditado (HOROMETRO_REGISTRADO SUCCESS).
 * - Unicidad: un rango que se encima con otro, o la misma lectura enviada dos veces al mismo tiempo, no se
 *   registra dos veces (candado sobre la máquina).
 * - Cada fallo de negocio queda auditado como FAIL con su error_code antes de lanzar.
 * - Listado paginado e indicadores con datos reales; registro_auditoria es inmutable.
 *
 * Run with: npm run test:integration -- --testPathPattern="horometro"
 * Requires: PostgreSQL running con la DB configurada en apps/api/.env.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditContextService } from '../../audit/audit-context.service';
import { hoyEnZona } from '../../common/validacion';
import { MaquinasService } from '../maquinas/maquinas.service';
import { HorometroService } from './horometro.service';

const TEST_ID = randomUUID().slice(0, 6).toUpperCase();
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Horómetro (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: HorometroService;

  const tipoId = randomUUID();
  const maquinaId = randomUUID();
  const codigo = `HT${TEST_ID}`;
  const registroMantId = randomUUID();
  const hoy = hoyEnZona();
  const inicio = new Date();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, MaquinasService, HorometroService],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    prisma = module.get(PrismaService);
    service = module.get(HorometroService);

    const now = new Date();
    await prisma.tipos_maquina.create({ data: { id: tipoId, nombre: `TipoHT-${TEST_ID}`, activo: true, actualizado_en: now } });
    await prisma.maquinas.create({
      data: {
        id: maquinaId, codigo, nombre: `Máquina HT ${TEST_ID}`, tipo_id: tipoId, estado: 'APAGADA',
        horometro: 100, lat: 0, lng: 0, activo: true, actualizado_en: now,
      },
    });
    // Último servicio: el siguiente toca a las 140 h.
    await prisma.registros_mantenimiento.create({
      data: {
        id: registroMantId, maquina_id: maquinaId, tipo: 'PREVENTIVO', descripcion: `Servicio HT ${TEST_ID}`,
        fecha: new Date('2026-01-10'), horas_servicio: 90, costo: 0, proximo_servicio_horas: 140, actualizado_en: now,
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.lecturas_horometro.deleteMany({ where: { maquina_id: maquinaId } });
    await prisma.registros_mantenimiento.deleteMany({ where: { id: registroMantId } });
    await prisma.maquinas.deleteMany({ where: { id: maquinaId } });
    await prisma.tipos_maquina.deleteMany({ where: { id: tipoId } });
    await prisma.$disconnect();
    await app.close();
  });

  const dto = (lecturaInicial: number, lecturaFinal: number, fecha = hoy) => ({ maquinaId: codigo, fecha, lecturaInicial, lecturaFinal });
  const horometroDe = async () => Number((await prisma.maquinas.findUniqueOrThrow({ where: { id: maquinaId } })).horometro);
  const fallosCon = (errorCode: string) =>
    prisma.registro_auditoria.findMany({
      where: {
        action: AuditAction.HOROMETRO_REGISTRADO,
        result: AuditResult.FAIL,
        error_code: errorCode,
        timestamp: { gte: inicio },
        metadata: { path: ['maquinaId'], equals: codigo },
      },
    });

  it('registra la lectura, avanza el horómetro de la máquina y audita SUCCESS', async () => {
    const res = await service.create(dto(100, 108.5), ACTOR_USER_ID);

    expect(res).toMatchObject({ maquinaId: codigo, lecturaInicial: 100, lecturaFinal: 108.5, horasTrabajadas: 8.5, fecha: hoy });
    expect(await horometroDe()).toBe(108.5);

    const fila = await prisma.lecturas_horometro.findFirstOrThrow({ where: { maquina_id: maquinaId } });
    expect(fila.creado_por).toBe(ACTOR_USER_ID);

    const [audit] = await prisma.registro_auditoria.findMany({
      where: { action: AuditAction.HOROMETRO_REGISTRADO, entity_id: fila.id, result: AuditResult.SUCCESS },
    });
    expect(audit).toBeDefined();
    expect(audit.actor_user_id).toBe(ACTOR_USER_ID);
    expect(audit.new_value).toMatchObject({ maquinaId: codigo, horasTrabajadas: 8.5 });
    expect(audit.metadata).toMatchObject({ horometroMaquinaAnterior: 100, horometroMaquinaNuevo: 108.5 });
  });

  it('rechaza un rango que se encima con otro (409) y lo audita como FAIL LECTURA_TRASLAPADA', async () => {
    await expect(service.create(dto(105, 110), ACTOR_USER_ID)).rejects.toThrow(ConflictException);
    expect(await prisma.lecturas_horometro.count({ where: { maquina_id: maquinaId } })).toBe(1);
    expect(await fallosCon('LECTURA_TRASLAPADA')).toHaveLength(1);
  });

  it('la misma lectura enviada dos veces al mismo tiempo se registra una sola vez', async () => {
    const resultados = await Promise.allSettled([
      service.create(dto(108.5, 116), ACTOR_USER_ID),
      service.create(dto(108.5, 116), ACTOR_USER_ID),
    ]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rechazada = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rechazada.reason).toBeInstanceOf(ConflictException);
    expect(await prisma.lecturas_horometro.count({ where: { maquina_id: maquinaId, lectura_inicial: 108.5 } })).toBe(1);
    expect(await horometroDe()).toBe(116);
  });

  it('una lectura atrasada que no se encima se registra, pero no regresa el horómetro de la máquina', async () => {
    await service.create(dto(90, 95, '2026-01-12'), ACTOR_USER_ID);
    expect(await horometroDe()).toBe(116);
  });

  it.each([
    ['FECHA_FUTURA', () => dto(200, 201, '2999-01-01'), BadRequestException],
    ['LECTURA_INVALIDA', () => dto(300, 299), BadRequestException],
    ['HORAS_EXCEDIDAS', () => dto(400, 425), BadRequestException],
  ])('rechaza %s y lo audita como FAIL con su error_code', async (errorCode, armar, Excepcion) => {
    await expect(service.create(armar(), ACTOR_USER_ID)).rejects.toThrow(Excepcion);
    expect(await fallosCon(errorCode)).toHaveLength(1);
  });

  it('rechaza una máquina que no existe (404) y lo audita como FAIL MAQUINA_NO_ENCONTRADA', async () => {
    const otro = `NOEX${TEST_ID}`;
    await expect(service.create({ ...dto(1, 2), maquinaId: otro }, ACTOR_USER_ID)).rejects.toThrow(NotFoundException);
    const fallos = await prisma.registro_auditoria.findMany({
      where: { action: AuditAction.HOROMETRO_REGISTRADO, error_code: 'MAQUINA_NO_ENCONTRADA', metadata: { path: ['maquinaId'], equals: otro } },
    });
    expect(fallos).toHaveLength(1);
  });

  it('lista paginado y filtrado por máquina, con el tope de 100 por página', async () => {
    const pagina = await service.findAll({ maquinaId: codigo, page: 1, limit: 2 });
    expect(pagina.items).toHaveLength(2);
    expect(pagina.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
    // Ordenado por fecha, la más reciente primero.
    expect(pagina.items[0].fecha >= pagina.items[1].fecha).toBe(true);

    expect((await service.findAll({ maquinaId: codigo, limit: 5000 })).pagination.limit).toBe(100);
    // Un código inexistente da lista vacía, no un error.
    expect((await service.findAll({ maquinaId: `NOEX${TEST_ID}` })).items).toHaveLength(0);
  });

  it('los indicadores salen de los datos reales: horas del día y horas que faltan al próximo servicio', async () => {
    const stats = await service.findStats();
    expect(stats.fecha).toBe(hoy);
    expect(stats.horasHoy).toBeGreaterThanOrEqual(8.5 + 7.5);
    expect(stats.maquinasSinLecturaHoy).not.toContain(codigo);

    const servicio = stats.servicios.find((s) => s.maquinaId === codigo);
    expect(servicio).toMatchObject({ horometro: 116, proximoServicioHoras: 140, horasRestantes: 24 });
  });

  it('registro_auditoria es inmutable: no se puede borrar ni modificar la auditoría de una lectura', async () => {
    const fila = await prisma.lecturas_horometro.findFirstOrThrow({ where: { maquina_id: maquinaId, lectura_inicial: 100 } });
    // La de SUCCESS: el FAIL del traslape también apunta a esta lectura (es la que ya tenía esas horas).
    const [audit] = await prisma.registro_auditoria.findMany({
      where: { action: AuditAction.HOROMETRO_REGISTRADO, entity_id: fila.id, result: AuditResult.SUCCESS },
    });

    await expect(prisma.registro_auditoria.delete({ where: { event_id: audit.event_id } })).rejects.toThrow();
    await expect(
      prisma.registro_auditoria.update({ where: { event_id: audit.event_id }, data: { error_code: 'MANIPULADO' } }),
    ).rejects.toThrow();
    const sigue = await prisma.registro_auditoria.findUnique({ where: { event_id: audit.event_id } });
    expect(sigue?.error_code).toBeNull();
  });
});
