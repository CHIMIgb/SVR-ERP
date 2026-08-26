import { Test, TestingModule } from '@nestjs/testing';
import { NominaController } from './nomina.controller';
import { NominaService } from './nomina.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NominaController', () => {
  let controller: NominaController;
  let service: NominaService;

  const mockPeriodo = { id: 'periodo-uuid-1', codigo: 'NOM-2026-S35' };
  const mockNominaRow = { id: 'nomina-uuid-1', trabajadorNombre: 'Juan Pérez' };
  const mockRequest = { user: { id: 'user-1' } } as never;

  const mockService = {
    findActual: jest.fn().mockResolvedValue({ periodo: mockPeriodo, items: [mockNominaRow] }),
    sincronizarAsistencia: jest.fn().mockResolvedValue({ items: [mockNominaRow], totalHorasExtraSincronizadas: 0, totalFaltasAplicadas: 0 }),
    registrarAjuste: jest.fn().mockResolvedValue(mockNominaRow),
    actualizarEstado: jest.fn().mockResolvedValue(mockNominaRow),
    pagarTodos: jest.fn().mockResolvedValue({ items: [mockNominaRow], actualizados: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NominaController],
      providers: [
        { provide: NominaService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(NominaController);
    service = module.get(NominaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findActual passes the query and userId from the JWT request', async () => {
    await controller.findActual({ fecha: '2026-08-24' }, mockRequest);
    expect(service.findActual).toHaveBeenCalledWith({ fecha: '2026-08-24' }, 'user-1');
  });

  it('sincronizarAsistencia passes the userId from the JWT request', async () => {
    await controller.sincronizarAsistencia('periodo-uuid-1', mockRequest);
    expect(service.sincronizarAsistencia).toHaveBeenCalledWith('periodo-uuid-1', 'user-1');
  });

  it('registrarAjuste passes the userId from the JWT request', async () => {
    const dto = { tipo: 'Bono', monto: 500, concepto: 'Productividad' } as never;
    await controller.registrarAjuste('nomina-uuid-1', dto, mockRequest);
    expect(service.registrarAjuste).toHaveBeenCalledWith('nomina-uuid-1', dto, 'user-1');
  });

  it('actualizarEstado passes the userId from the JWT request', async () => {
    const dto = { estado: 'Pagado' } as never;
    await controller.actualizarEstado('nomina-uuid-1', dto, mockRequest);
    expect(service.actualizarEstado).toHaveBeenCalledWith('nomina-uuid-1', dto, 'user-1');
  });

  it('pagarTodos passes the userId from the JWT request', async () => {
    await controller.pagarTodos('periodo-uuid-1', mockRequest);
    expect(service.pagarTodos).toHaveBeenCalledWith('periodo-uuid-1', 'user-1');
  });
});
