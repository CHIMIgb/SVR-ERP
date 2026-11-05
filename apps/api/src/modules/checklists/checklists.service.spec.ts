import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ChecklistsService } from './checklists.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MaquinasService } from '../maquinas/maquinas.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';

describe('ChecklistsService.create', () => {
  let service: ChecklistsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const maquinasService = { mapaCodigoAId: jest.fn().mockResolvedValue(new Map([['M001', 'maq-uuid-1']])) };

  const creado = (data: Record<string, unknown>) => ({
    id: 'chk-1',
    codigo: null,
    maquinas: { codigo: 'M001' },
    fecha: new Date(Date.UTC(2026, 10, 5)),
    hora: new Date(Date.UTC(1970, 0, 1, 7, 30, 0)),
    trabajadores: null,
    horometro_inicial: 1250,
    observaciones: '',
    ...data,
  });

  const dto = (overrides: Partial<CreateChecklistDto> = {}): CreateChecklistDto => ({
    maquinaId: 'M001',
    operador: 'Juan Pérez',
    horometroInicial: 1250,
    nivelAceiteMotor: 'Correcto',
    nivelHidraulico: 'Correcto',
    fugasVisibles: false,
    estadoLlantasOrugas: 'Correcto',
    lucesYAlarmas: 'Correcto',
    sistemaFrenos: 'Correcto',
    observaciones: '',
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      trabajadores: { findFirst: jest.fn().mockResolvedValue(null) },
      checklists_preoperacionales: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve(creado(data))),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MaquinasService, useValue: maquinasService },
      ],
    }).compile();
    service = module.get(ChecklistsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('stores the luces y alarmas that was captured (it used to be always CORRECTO)', async () => {
    await service.create(dto({ lucesYAlarmas: 'Falla' }));
    const data = prisma.checklists_preoperacionales.create.mock.calls[0][0].data;
    expect(data.luces_y_alarmas).toBe('FALLA');
  });

  it('a failure in luces y alarmas makes the checklist Con Falla', async () => {
    const result = await service.create(dto({ lucesYAlarmas: 'Falla' }));
    expect(prisma.checklists_preoperacionales.create.mock.calls[0][0].data.estado).toBe('CON_FALLA');
    expect(result.estado).toBe('Con Falla');
  });

  it('everything correct is Aprobado', async () => {
    await service.create(dto());
    expect(prisma.checklists_preoperacionales.create.mock.calls[0][0].data.estado).toBe('APROBADO');
  });

  it('404 when the machine does not exist', async () => {
    await expect(service.create(dto({ maquinaId: 'M999' }))).rejects.toThrow(NotFoundException);
  });
});
