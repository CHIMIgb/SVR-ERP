/**
 * Integration tests de Flota (máquinas + checklists) — BD real, sin mocks.
 *
 * Cubre lo que los mocks no ven:
 * - El alta de máquina guarda el código en mayúsculas y rechaza el mismo código escrito en minúsculas.
 * - El checklist guarda en `luces_y_alarmas` lo que se capturó (antes siempre era CORRECTO)
 *   y una falla de luces deja el checklist CON_FALLA.
 *
 * Run with: npm run test:integration -- --testPathPattern="checklists"
 * Requires: PostgreSQL running con la DB configurada en apps/api/.env.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MaquinasService } from '../maquinas/maquinas.service';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';

const TEST_ID = randomUUID().slice(0, 6);

describe('Flota: máquinas y checklists (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let maquinas: MaquinasService;
  let checklists: ChecklistsService;

  const tipoNombre = `TT-${TEST_ID}`;
  const codigo = `ZT${TEST_ID}`.toUpperCase();
  const checklistIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, MaquinasService, ChecklistsService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    maquinas = module.get(MaquinasService);
    checklists = module.get(ChecklistsService);
  });

  afterAll(async () => {
    if (!prisma) return;
    if (checklistIds.length > 0) {
      await prisma.checklists_preoperacionales.deleteMany({ where: { id: { in: checklistIds } } });
    }
    await prisma.maquinas.deleteMany({ where: { codigo } });
    await prisma.tipos_maquina.deleteMany({ where: { nombre: tipoNombre } });
    await prisma.$disconnect();
    await app.close();
  });

  const checklistDto = (overrides: Partial<CreateChecklistDto> = {}): CreateChecklistDto => ({
    maquinaId: codigo,
    operador: `Operador ${TEST_ID}`,
    horometroInicial: 10,
    nivelAceiteMotor: 'Correcto',
    nivelHidraulico: 'Correcto',
    fugasVisibles: false,
    estadoLlantasOrugas: 'Correcto',
    lucesYAlarmas: 'Correcto',
    sistemaFrenos: 'Correcto',
    observaciones: '',
    ...overrides,
  });

  it('da de alta la máquina con el código en mayúsculas y el nombre recortado', async () => {
    const creada = await maquinas.create({
      id: `  ${codigo.toLowerCase()} `,
      tipo: tipoNombre,
      nombre: '  Máquina de prueba  ',
      horometro: 10,
      combustible: 50,
      consumoEsperado: 12,
    });
    expect(creada.id).toBe(codigo);

    const fila = await prisma.maquinas.findUnique({ where: { codigo } });
    expect(fila?.nombre).toBe('Máquina de prueba');
  });

  it('rechaza el mismo código escrito en minúsculas (antes se colaba y tronaba con el índice único)', async () => {
    await expect(
      maquinas.create({ id: codigo.toLowerCase(), tipo: tipoNombre, nombre: 'Duplicada', combustible: 50, consumoEsperado: 12 }),
    ).rejects.toThrow(BadRequestException);
    expect(await prisma.maquinas.count({ where: { codigo } })).toBe(1);
  });

  it('guarda la falla de luces y alarmas y deja el checklist con falla', async () => {
    const res = await checklists.create(checklistDto({ lucesYAlarmas: 'Falla', observaciones: 'Faro trasero fundido' }));
    checklistIds.push(res.id);

    const fila = await prisma.checklists_preoperacionales.findUnique({ where: { id: res.id } });
    expect(fila?.luces_y_alarmas).toBe('FALLA');
    expect(fila?.estado).toBe('CON_FALLA');
    expect(res.estado).toBe('Con Falla');
    expect(res.lucesYAlarmas).toBe('Falla');
  });

  it('con todo correcto queda aprobado y luces en CORRECTO', async () => {
    const res = await checklists.create(checklistDto());
    checklistIds.push(res.id);

    const fila = await prisma.checklists_preoperacionales.findUnique({ where: { id: res.id } });
    expect(fila?.luces_y_alarmas).toBe('CORRECTO');
    expect(fila?.estado).toBe('APROBADO');
  });
});
