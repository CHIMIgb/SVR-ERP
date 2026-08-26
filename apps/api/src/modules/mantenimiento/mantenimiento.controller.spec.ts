import { Test, TestingModule } from '@nestjs/testing';
import { MantenimientoController } from './mantenimiento.controller';
import { MantenimientoService } from './mantenimiento.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('MantenimientoController', () => {
  let controller: MantenimientoController;
  let service: MantenimientoService;

  const mockRegistro = {
    id: 'reg-uuid-1',
    maquinaId: 'M001',
    tipo: 'Preventivo',
    descripcion: 'Cambio de aceite',
    fecha: '2026-08-20',
    horasServicio: 1000,
    costo: 5500,
    proximoServicioHoras: 1250,
  };

  const mockResult = {
    items: [mockRegistro],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockResult),
    findStats: jest.fn().mockResolvedValue({ serviciosProximos: 1, promedioHorasServicio: 940, equiposEnOptimoEstado: 3, totalMaquinas: 4 }),
    findOne: jest.fn().mockResolvedValue(mockRegistro),
    create: jest.fn().mockResolvedValue(mockRegistro),
    update: jest.fn().mockResolvedValue(mockRegistro),
    remove: jest.fn().mockResolvedValue({ message: 'Registro de mantenimiento eliminado exitosamente' }),
  };

  const mockRequest = { user: { id: 'user-1' } } as never;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MantenimientoController],
      providers: [
        { provide: MantenimientoService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(MantenimientoController);
    service = module.get(MantenimientoService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll delegates to service', async () => {
    const result = await controller.findAll({});
    expect(result).toBe(mockResult);
    expect(service.findAll).toHaveBeenCalledWith({});
  });

  it('findStats delegates to service', async () => {
    const result = await controller.findStats();
    expect(result.serviciosProximos).toBe(1);
    expect(service.findStats).toHaveBeenCalled();
  });

  it('findOne delegates to service', async () => {
    const result = await controller.findOne('reg-uuid-1');
    expect(result).toBe(mockRegistro);
    expect(service.findOne).toHaveBeenCalledWith('reg-uuid-1');
  });

  it('create passes the userId from the JWT request', async () => {
    const dto = { maquinaId: 'M001' } as never;
    await controller.create(dto, mockRequest);
    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('update passes the userId from the JWT request', async () => {
    const dto = { costo: 6000 } as never;
    await controller.update('reg-uuid-1', dto, mockRequest);
    expect(service.update).toHaveBeenCalledWith('reg-uuid-1', dto, 'user-1');
  });

  it('remove passes the userId from the JWT request', async () => {
    await controller.remove('reg-uuid-1', mockRequest);
    expect(service.remove).toHaveBeenCalledWith('reg-uuid-1', 'user-1');
  });
});
