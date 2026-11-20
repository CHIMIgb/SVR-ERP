/**
 * Integration tests de la asistencia propia y del equipo (PWA) — real DB, sin mocks.
 *
 * Verifica contra Postgres real que el trabajador sale de la cuenta (trabajadores.usuario_id), que solo se
 * checa en obras de sus proyectos activos, que el residente ve a su equipo (users.jefe_user_id) sin sueldos,
 * y que cada fallo queda auditado.
 *
 * Run with: npm run test:integration -- --testPathPattern="asistencia-propia"
 * Requires: PostgreSQL con la BD configurada en apps/api/.env y la migración 20261113060000_trabajadores_usuario_id.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, INestApplication, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { AsistenciaService } from './asistencia.service';

const TEST_ID = randomUUID().slice(0, 8);

describe('Asistencia propia y del equipo (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: AsistenciaService;
  const inicio = new Date();

  const obraLat = 19.3421;
  const obraLng = -99.1843;

  const ids = {
    cliente: randomUUID(),
    proyectoAsignado: randomUUID(),
    proyectoAjeno: randomUUID(),
    obraAsignada: randomUUID(),
    obraAjena: randomUUID(),
    categoria: randomUUID(),
    personaResidente: randomUUID(),
    residente: randomUUID(),
    personaTrabajador: randomUUID(),
    cuentaTrabajador: randomUUID(),
    personaSinTrabajador: randomUUID(),
    cuentaSinTrabajador: randomUUID(),
    trabajador: randomUUID(),
  };

  const crearPersonaYCuenta = async (personaId: string, userId: string, etiqueta: string, jefeId?: string) => {
    await prisma.personas.create({
      data: { id: personaId, nombre: etiqueta, apellido_paterno: TEST_ID, actualizado_en: new Date() },
    });
    await prisma.users.create({
      data: {
        id: userId,
        persona_id: personaId,
        email: `${etiqueta.toLowerCase()}-${TEST_ID}@svr-erp.local`,
        password_hash: 'no-usado',
        jefe_user_id: jefeId ?? null,
        actualizado_en: new Date(),
      },
    });
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, AsistenciaService],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    prisma = module.get(PrismaService);
    service = module.get(AsistenciaService);

    await prisma.clientes.create({
      data: {
        id: ids.cliente,
        nombre: `Cliente IT AsistPropia ${TEST_ID}`,
        correo: `asistpropia-${TEST_ID}@integration.mx`,
        telefono: '55-0000-0000',
        actualizado_en: new Date(),
      },
    });
    for (const [id, nombre] of [
      [ids.proyectoAsignado, `Proyecto IT Asignado ${TEST_ID}`],
      [ids.proyectoAjeno, `Proyecto IT Ajeno ${TEST_ID}`],
    ]) {
      await prisma.proyectos.create({
        data: {
          id,
          nombre,
          cliente_id: ids.cliente,
          presupuesto: 100000,
          fecha_inicio: new Date('2026-01-01'),
          fecha_fin: new Date('2026-12-31'),
          actualizado_en: new Date(),
        },
      });
    }
    // Obra 1:1 con su proyecto, ambas con ubicación: la ajena sí se podría checar, pero no es suya.
    for (const [id, proyectoId, nombre] of [
      [ids.obraAsignada, ids.proyectoAsignado, `Obra IT Asignada ${TEST_ID}`],
      [ids.obraAjena, ids.proyectoAjeno, `Obra IT Ajena ${TEST_ID}`],
    ]) {
      await prisma.obras.create({
        data: {
          id,
          nombre,
          proyecto_id: proyectoId,
          lat: obraLat,
          lng: obraLng,
          radio_permitido_metros: 2000,
          actualizado_en: new Date(),
        },
      });
    }
    await prisma.categorias_puesto.create({
      data: { id: ids.categoria, nombre: `TestCategoriaAsistPropia-${TEST_ID}`, actualizado_en: new Date() },
    });

    await crearPersonaYCuenta(ids.personaResidente, ids.residente, 'ResidenteIT');
    await crearPersonaYCuenta(ids.personaTrabajador, ids.cuentaTrabajador, 'TrabajadorIT', ids.residente);
    await crearPersonaYCuenta(ids.personaSinTrabajador, ids.cuentaSinTrabajador, 'SinTrabajadorIT');

    await prisma.trabajadores.create({
      data: {
        id: ids.trabajador,
        nombre: `Trabajador IT Propia ${TEST_ID}`,
        puesto: 'Operador de prueba',
        categoria_puesto_id: ids.categoria,
        telefono: '55 1111 2222',
        avatar: 'TP',
        sueldo_fiscal: 2500,
        sueldo_efectivo: 3500,
        metodo_pago: 'MIXTO',
        entrada: new Date(Date.UTC(1970, 0, 1, 7, 0, 0)),
        usuario_id: ids.cuentaTrabajador,
        actualizado_en: new Date(),
      },
    });
    await prisma.trabajadores_proyectos.create({
      data: { trabajador_id: ids.trabajador, proyecto_id: ids.proyectoAsignado },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.horas_extra_asistencia.deleteMany({ where: { registros_asistencia: { trabajador_id: ids.trabajador } } });
    await prisma.registros_asistencia.deleteMany({ where: { trabajador_id: ids.trabajador } });
    await prisma.nominas.deleteMany({ where: { trabajador_id: ids.trabajador } });
    await prisma.trabajadores_proyectos.deleteMany({ where: { trabajador_id: ids.trabajador } });
    await prisma.trabajadores.deleteMany({ where: { id: ids.trabajador } });
    // La cuenta del trabajador quedó como actor de sus marcajes en registro_auditoria, que es inmutable: borrarla
    // haría que la FK intentara un UPDATE ahí y el trigger lo rechaza. Se da de baja (soft-delete) y se conserva.
    await prisma.users.updateMany({
      where: { id: { in: [ids.cuentaTrabajador, ids.cuentaSinTrabajador] } },
      data: { jefe_user_id: null },
    });
    await prisma.users.update({
      where: { id: ids.cuentaTrabajador },
      data: { activo: false, eliminado_en: new Date() },
    });
    await prisma.users.deleteMany({ where: { id: { in: [ids.cuentaSinTrabajador, ids.residente] } } });
    await prisma.personas.deleteMany({ where: { id: { in: [ids.personaResidente, ids.personaSinTrabajador] } } });
    await prisma.categorias_puesto.deleteMany({ where: { id: ids.categoria } });
    await prisma.obras.deleteMany({ where: { id: { in: [ids.obraAsignada, ids.obraAjena] } } });
    await prisma.proyectos.deleteMany({ where: { id: { in: [ids.proyectoAsignado, ids.proyectoAjeno] } } });
    await prisma.clientes.deleteMany({ where: { id: ids.cliente } });
    await prisma.$disconnect();
    await app.close();
  });

  const falloAuditado = (action: AuditAction, errorCode: string) =>
    prisma.registro_auditoria.findFirst({
      where: { action, error_code: errorCode, result: 'FAIL', timestamp: { gte: inicio } },
    });

  const entrada = (obraId: string) => ({
    obraId,
    lat: obraLat + 0.0002,
    lng: obraLng + 0.0002,
    dispositivo: 'Móvil de prueba',
  });

  it('findMia: devuelve solo sus obras (la del proyecto asignado) y aún sin registro hoy', async () => {
    const r = await service.findMia(ids.cuentaTrabajador);
    expect(r.trabajador.id).toBe(ids.trabajador);
    expect(r.trabajador.entradaProgramada).toBe('07:00');
    expect(r.obras).toEqual([{ id: ids.obraAsignada, nombre: `Obra IT Asignada ${TEST_ID}`, tieneUbicacion: true }]);
    expect(r.registroHoy).toBeNull();
    expect(r.semana?.trabajadorId).toBe(ids.trabajador);
    expect(JSON.stringify(r)).not.toMatch(/sueldo/i);
  });

  it('cuenta sin trabajador enlazado: findMia 404 y la entrada 404 auditada', async () => {
    await expect(service.findMia(ids.cuentaSinTrabajador)).rejects.toThrow(NotFoundException);
    await expect(service.marcarEntradaPropia(entrada(ids.obraAsignada), ids.cuentaSinTrabajador)).rejects.toThrow(
      NotFoundException,
    );
    expect(await falloAuditado(AuditAction.ASISTENCIA_ENTRADA_REGISTRADA, 'SIN_TRABAJADOR_ENLAZADO')).not.toBeNull();
  });

  it('no deja checar en una obra que no es suya: 403 auditado y sin registro', async () => {
    await expect(service.marcarEntradaPropia(entrada(ids.obraAjena), ids.cuentaTrabajador)).rejects.toThrow(
      ForbiddenException,
    );
    expect(await falloAuditado(AuditAction.ASISTENCIA_ENTRADA_REGISTRADA, 'OBRA_NO_ASIGNADA')).not.toBeNull();
    expect(await prisma.registros_asistencia.count({ where: { trabajador_id: ids.trabajador } })).toBe(0);
  });

  it('checa la entrada propia en su obra, y una segunda entrada del día se rechaza', async () => {
    const registro = await service.marcarEntradaPropia(entrada(ids.obraAsignada), ids.cuentaTrabajador);
    expect(registro.trabajadorId).toBe(ids.trabajador);
    expect(registro.enSitio).toBe(true);

    const enBd = await prisma.registros_asistencia.findUniqueOrThrow({ where: { id: registro.id } });
    expect(enBd.obra_id).toBe(ids.obraAsignada);
    expect(enBd.creado_por).toBe(ids.cuentaTrabajador);

    await expect(service.marcarEntradaPropia(entrada(ids.obraAsignada), ids.cuentaTrabajador)).rejects.toThrow(
      BadRequestException,
    );

    const mia = await service.findMia(ids.cuentaTrabajador);
    expect(mia.registroHoy?.id).toBe(registro.id);
  });

  it('el residente ve a su equipo con el estado del día y sin sueldos', async () => {
    const r = await service.findEquipo(ids.residente, {});
    expect(r.miembros.map((m) => m.trabajadorId)).toEqual([ids.trabajador]);
    expect(r.miembros[0].telefono).toBe('55 1111 2222');
    expect(r.miembros[0].dia).not.toBeNull();
    expect(r.totales.miembros).toBe(1);
    expect(JSON.stringify(r)).not.toMatch(/sueldo|2500|3500/i);
  });

  it('quien no es jefe de nadie ve su equipo vacío', async () => {
    const r = await service.findEquipo(ids.cuentaTrabajador, {});
    expect(r.miembros).toEqual([]);
  });

  it('checa la salida propia sobre su registro del día', async () => {
    const r = await service.marcarSalidaPropia(
      { lat: obraLat, lng: obraLng, dispositivo: 'Móvil de prueba' },
      ids.cuentaTrabajador,
    );
    expect(r.trabajadorId).toBe(ids.trabajador);
    expect(r.horaSalida).toBeDefined();
  });
});
