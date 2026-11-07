import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResult } from '@prisma/client';
import { ChecklistsService } from './checklists.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';

describe('ChecklistsService.create', () => {
  let service: ChecklistsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const audit = { log: jest.fn().mockResolvedValue(undefined) };

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
    jest.clearAllMocks();
    prisma = {
      maquinas: {
        findFirst: jest.fn().mockImplementation(({ where }) => Promise.resolve(where.codigo === 'M001' ? { id: 'maq-uuid-1' } : null)),
      },
      trabajadores: { findFirst: jest.fn().mockResolvedValue(null) },
      checklists_preoperacionales: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve(creado(data))),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChecklistsService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: audit }],
    }).compile();
    service = module.get(ChecklistsService);
  });

  it('stores the luces y alarmas that was captured (it used to be always CORRECTO)', async () => {
    await service.create(dto({ lucesYAlarmas: 'Falla' }), 'user-1');
    const data = prisma.checklists_preoperacionales.create.mock.calls[0][0].data;
    expect(data.luces_y_alarmas).toBe('FALLA');
  });

  it('a failure in luces y alarmas makes the checklist Con Falla, audited as WARNING', async () => {
    const result = await service.create(dto({ lucesYAlarmas: 'Falla' }), 'user-1');
    expect(prisma.checklists_preoperacionales.create.mock.calls[0][0].data.estado).toBe('CON_FALLA');
    expect(result.estado).toBe('Con Falla');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.CHECKLIST_REGISTRADO, result: AuditResult.SUCCESS, severity: 'WARNING' }),
    );
  });

  it('everything correct is Aprobado, stores who registered it and audits INFO', async () => {
    await service.create(dto(), 'user-1');
    const data = prisma.checklists_preoperacionales.create.mock.calls[0][0].data;
    expect(data.estado).toBe('APROBADO');
    expect(data.creado_por).toBe('user-1');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ severity: 'INFO', actorUserId: 'user-1' }));
  });

  it('404 when the machine does not exist, audited as FAIL MAQUINA_NO_ENCONTRADA', async () => {
    await expect(service.create(dto({ maquinaId: 'M999' }), 'user-1')).rejects.toThrow(NotFoundException);
    expect(prisma.checklists_preoperacionales.create).not.toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ result: AuditResult.FAIL, errorCode: 'MAQUINA_NO_ENCONTRADA' }),
    );
  });
});
