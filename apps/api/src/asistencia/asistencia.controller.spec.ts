import { Test, TestingModule } from '@nestjs/testing';
import { AsistenciaController } from './asistencia.controller';
import { AsistenciaService } from './asistencia.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AsistenciaController', () => {
  let controller: AsistenciaController;
  let service: AsistenciaService;

  const mockRegistro = { id: 'reg-uuid-1', trabajadorId: 'trab-uuid-1', estado: 'Puntual' };
  const mockRequest = { user: { id: 'user-1' } } as never;

  const mockService = {
    findAll: jest.fn().mockResolvedValue({ items: [mockRegistro], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } }),
    findSemanal: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(mockRegistro),
    marcarEntrada: jest.fn().mockResolvedValue(mockRegistro),
    marcarSalida: jest.fn().mockResolvedValue(mockRegistro),
    marcarCuadrilla: jest.fn().mockResolvedValue({ creados: [mockRegistro], omitidos: [] }),
    registrarFalta: jest.fn().mockResolvedValue(mockRegistro),
    actualizarEstado: jest.fn().mockResolvedValue(mockRegistro),
    registrarHorasExtra: jest.fn().mockResolvedValue(mockRegistro),
    aprobarHorasExtra: jest.fn().mockResolvedValue(mockRegistro),
    rechazarHorasExtra: jest.fn().mockResolvedValue(mockRegistro),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsistenciaController],
      providers: [
        { provide: AsistenciaService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(AsistenciaController);
    service = module.get(AsistenciaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll delegates to service', async () => {
    await controller.findAll({});
    expect(service.findAll).toHaveBeenCalledWith({});
  });

  it('findSemanal delegates to service', async () => {
    await controller.findSemanal({});
    expect(service.findSemanal).toHaveBeenCalledWith({});
  });

  it('findOne delegates to service', async () => {
    await controller.findOne('reg-uuid-1');
    expect(service.findOne).toHaveBeenCalledWith('reg-uuid-1');
  });

  it('marcarEntrada passes the userId from the JWT request', async () => {
    const dto = { trabajadorId: 'trab-uuid-1' } as never;
    await controller.marcarEntrada(dto, mockRequest);
    expect(service.marcarEntrada).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('marcarSalida passes the userId from the JWT request', async () => {
    const dto = { trabajadorId: 'trab-uuid-1' } as never;
    await controller.marcarSalida(dto, mockRequest);
    expect(service.marcarSalida).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('marcarCuadrilla passes the userId from the JWT request', async () => {
    const dto = { trabajadorIds: ['trab-uuid-1'] } as never;
    await controller.marcarCuadrilla(dto, mockRequest);
    expect(service.marcarCuadrilla).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('registrarFalta passes the userId from the JWT request', async () => {
    const dto = { trabajadorId: 'trab-uuid-1' } as never;
    await controller.registrarFalta(dto, mockRequest);
    expect(service.registrarFalta).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('actualizarEstado passes the userId from the JWT request', async () => {
    const dto = { estado: 'Justificado' } as never;
    await controller.actualizarEstado('reg-uuid-1', dto, mockRequest);
    expect(service.actualizarEstado).toHaveBeenCalledWith('reg-uuid-1', dto, 'user-1');
  });

  it('registrarHorasExtra passes the userId from the JWT request', async () => {
    const dto = { inicio: '17:00', horasCalculadas: 3 } as never;
    await controller.registrarHorasExtra('reg-uuid-1', dto, mockRequest);
    expect(service.registrarHorasExtra).toHaveBeenCalledWith('reg-uuid-1', dto, 'user-1');
  });

  it('aprobarHorasExtra passes the userId from the JWT request', async () => {
    await controller.aprobarHorasExtra('he-uuid-1', mockRequest);
    expect(service.aprobarHorasExtra).toHaveBeenCalledWith('he-uuid-1', 'user-1');
  });

  it('rechazarHorasExtra passes the userId from the JWT request', async () => {
    await controller.rechazarHorasExtra('he-uuid-1', mockRequest);
    expect(service.rechazarHorasExtra).toHaveBeenCalledWith('he-uuid-1', 'user-1');
  });
});
