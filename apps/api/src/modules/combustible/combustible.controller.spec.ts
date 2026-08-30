import { Test, TestingModule } from '@nestjs/testing';
import { CombustibleController } from './combustible.controller';
import { CombustibleService } from './combustible.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CombustibleController', () => {
  let controller: CombustibleController;
  let service: CombustibleService;

  const mockCarga = {
    id: 'carga-uuid-1',
    maquinaId: 'M001',
    fecha: '2026-08-23',
    litros: 112,
    costo: 2576,
    operador: 'Juan Pérez',
    lugar: 'Gasolinera Norte',
    horometroActual: 1008,
    horasTrabajadasPeriodo: 8,
    consumoEsperadoLtsHora: 14,
    rendimientoLtsHora: 14,
    alertaOrdena: false,
    desviacionPorcentaje: 0,
  };

  const mockResult = {
    items: [mockCarga],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockResult),
    findStats: jest.fn().mockResolvedValue({ totalLitros: 312, totalCosto: 7176, rendimientoPromedio: 14.2, totalAlertasOrdena: 1 }),
    findOne: jest.fn().mockResolvedValue(mockCarga),
    create: jest.fn().mockResolvedValue(mockCarga),
    update: jest.fn().mockResolvedValue(mockCarga),
    remove: jest.fn().mockResolvedValue({ message: 'Carga de combustible eliminada exitosamente' }),
  };

  const mockRequest = { user: { id: 'user-1' } } as never;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CombustibleController],
      providers: [
        { provide: CombustibleService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(CombustibleController);
    service = module.get(CombustibleService);
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
    expect(result.totalLitros).toBe(312);
    expect(service.findStats).toHaveBeenCalled();
  });

  it('findOne delegates to service', async () => {
    const result = await controller.findOne('carga-uuid-1');
    expect(result).toBe(mockCarga);
    expect(service.findOne).toHaveBeenCalledWith('carga-uuid-1');
  });

  it('create passes the userId from the JWT request', async () => {
    const dto = { maquinaId: 'M001' } as never;
    await controller.create(dto, mockRequest);
    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('update passes the userId from the JWT request', async () => {
    const dto = { litros: 200 } as never;
    await controller.update('carga-uuid-1', dto, mockRequest);
    expect(service.update).toHaveBeenCalledWith('carga-uuid-1', dto, 'user-1');
  });

  it('remove passes the userId from the JWT request', async () => {
    await controller.remove('carga-uuid-1', mockRequest);
    expect(service.remove).toHaveBeenCalledWith('carga-uuid-1', 'user-1');
  });
});
