import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MaquinasService } from './maquinas.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('MaquinasService.create', () => {
  let service: MaquinasService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      maquinas: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...data,
            tipos_maquina: { nombre: 'Excavación' },
            trabajadores: null,
            proximo_mantenimiento: null,
          }),
        ),
      },
      tipos_maquina: {
        findUnique: jest.fn().mockResolvedValue({ id: 'tipo-1', nombre: 'Excavación' }),
        create: jest.fn(),
      },
      trabajadores: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaquinasService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(MaquinasService);
  });

  const dto = { id: ' m005 ', tipo: 'Excavación', nombre: ' Excavadora CAT 320 ', horometro: 10, combustible: 80, consumoEsperado: 15 };

  it('checks duplicates with the same uppercase code it stores (m005 used to slip through and crash on M005)', async () => {
    prisma.maquinas.findUnique.mockResolvedValue({ id: 'existente', codigo: 'M005' });
    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    expect(prisma.maquinas.findUnique).toHaveBeenCalledWith({ where: { codigo: 'M005' } });
    expect(prisma.maquinas.create).not.toHaveBeenCalled();
  });

  it('stores the code in uppercase and the name trimmed', async () => {
    const creada = await service.create(dto);
    const data = prisma.maquinas.create.mock.calls[0][0].data;
    expect(data.codigo).toBe('M005');
    expect(data.nombre).toBe('Excavadora CAT 320');
    expect(creada.id).toBe('M005');
  });
});
