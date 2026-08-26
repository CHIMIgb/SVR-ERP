import { Test, TestingModule } from '@nestjs/testing';
import { TrabajadoresController } from './trabajadores.controller';
import { TrabajadoresService } from './trabajadores.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TrabajadoresController', () => {
  let controller: TrabajadoresController;
  let service: TrabajadoresService;

  const mockTrabajador = { id: 'trab-uuid-1', nombre: 'Juan Pérez', categoriaPuesto: 'Operador' };
  const mockResult = { items: [mockTrabajador], pagination: { page: 1, limit: 12, total: 1, totalPages: 1 } };
  const mockRequest = { user: { id: 'user-1' } } as never;

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockResult),
    findOne: jest.fn().mockResolvedValue(mockTrabajador),
    create: jest.fn().mockResolvedValue(mockTrabajador),
    update: jest.fn().mockResolvedValue(mockTrabajador),
    remove: jest.fn().mockResolvedValue({ message: 'Trabajador eliminado exitosamente' }),
    liquidar: jest.fn().mockResolvedValue({ granTotalNeto: 5000 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrabajadoresController],
      providers: [
        { provide: TrabajadoresService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(TrabajadoresController);
    service = module.get(TrabajadoresService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll delegates to service', async () => {
    await controller.findAll({});
    expect(service.findAll).toHaveBeenCalledWith({});
  });

  it('findOne delegates to service', async () => {
    await controller.findOne('trab-uuid-1');
    expect(service.findOne).toHaveBeenCalledWith('trab-uuid-1');
  });

  it('create passes the userId from the JWT request', async () => {
    const dto = { nombre: 'Juan Pérez' } as never;
    await controller.create(dto, mockRequest);
    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('update passes the userId from the JWT request', async () => {
    const dto = { puesto: 'X' } as never;
    await controller.update('trab-uuid-1', dto, mockRequest);
    expect(service.update).toHaveBeenCalledWith('trab-uuid-1', dto, 'user-1');
  });

  it('liquidar passes the userId from the JWT request', async () => {
    const dto = { tipoTerminacion: 'Renuncia', diasTrabajadosPeriodo: 6, diasVacacionesPendientes: 8 } as never;
    await controller.liquidar('trab-uuid-1', dto, mockRequest);
    expect(service.liquidar).toHaveBeenCalledWith('trab-uuid-1', dto, 'user-1');
  });

  it('remove passes the userId from the JWT request', async () => {
    await controller.remove('trab-uuid-1', mockRequest);
    expect(service.remove).toHaveBeenCalledWith('trab-uuid-1', 'user-1');
  });
});
