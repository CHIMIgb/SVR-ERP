import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { MaquinasService } from './maquinas.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

describe('MaquinasService.create', () => {
  let service: MaquinasService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const audit = { log: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      maquinas: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...data,
            tipos_maquina: { nombre: 'Excavadora' },
            trabajadores: null,
            proximo_mantenimiento: null,
          }),
        ),
      },
      tipos_maquina: {
        findUnique: jest.fn().mockResolvedValue({ id: 'tipo-1', nombre: 'Excavadora' }),
        create: jest.fn(),
      },
      trabajadores: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaquinasService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: audit }],
    }).compile();
    service = module.get(MaquinasService);
  });

  const dto = { id: ' m005 ', tipo: 'Excavación', nombre: ' Excavadora CAT 320 ', horometro: 10, combustible: 80, consumoEsperado: 15 };

  it('checks duplicates with the same uppercase code it stores, answers 409 and audits the failure', async () => {
    prisma.maquinas.findUnique.mockResolvedValue({ id: 'existente', codigo: 'M005' });
    await expect(service.create(dto, 'user-1')).rejects.toThrow(ConflictException);
    expect(prisma.maquinas.findUnique).toHaveBeenCalledWith({ where: { codigo: 'M005' } });
    expect(prisma.maquinas.create).not.toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.MAQUINA_CREADA, result: AuditResult.FAIL, errorCode: 'MAQUINA_DUPLICADA' }),
    );
  });

  it('a duplicate that slips in at the same time (unique index P2002) is also a 409, not a 500', async () => {
    prisma.maquinas.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }),
    );
    await expect(service.create(dto, 'user-1')).rejects.toThrow(ConflictException);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'MAQUINA_DUPLICADA' }));
  });

  it('stores the code in uppercase, the name trimmed and who created it, and audits SUCCESS', async () => {
    const creada = await service.create(dto, 'user-1');
    const data = prisma.maquinas.create.mock.calls[0][0].data;
    expect(data.codigo).toBe('M005');
    expect(data.nombre).toBe('Excavadora CAT 320');
    expect(data.creado_por).toBe('user-1');
    expect(creada.id).toBe('M005');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.MAQUINA_CREADA, result: AuditResult.SUCCESS, actorUserId: 'user-1' }),
    );
  });
});
