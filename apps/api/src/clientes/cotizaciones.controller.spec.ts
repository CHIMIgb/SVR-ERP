import { Test, TestingModule } from '@nestjs/testing';
import { CotizacionesController } from './cotizaciones.controller';
import { CotizacionesService } from './cotizaciones.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CotizacionesController', () => {
  let controller: CotizacionesController;
  let service: CotizacionesService;

  const mockClienteId = '550e8400-e29b-41d4-a716-446655440010';

  const mockCotizacion = {
    id: '490e8400-e29b-41d4-a716-446655440010',
    codigo: 'COT-20260815-ABC123',
    clienteId: mockClienteId,
    descripcion: 'Renta de excavadora por 100 horas',
    monto: 125000,
    fecha: '2026-08-15',
    estado: 'Aceptada',
    activo: true,
  };

  const mockService = {
    findByCliente: jest.fn().mockResolvedValue({
      items: [mockCotizacion],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    }),
    create: jest.fn().mockResolvedValue(mockCotizacion),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CotizacionesController],
      providers: [
        { provide: CotizacionesService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(CotizacionesController);
    service = module.get(CotizacionesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByCliente', () => {
    it('should return cotizaciones del cliente paginadas', async () => {
      const result = await controller.findByCliente(mockClienteId, { page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.pagination).toBeDefined();
      expect(service.findByCliente).toHaveBeenCalledWith(mockClienteId, { page: 1, limit: 10 });
    });
  });

  describe('create', () => {
    it('should create a cotizacion passing clienteId and userId', async () => {
      const dto = {
        descripcion: 'Movimiento de tierras valle sur',
        monto: 450000,
        fecha: '2026-08-20',
      };
      const req = { user: { id: 'user-1' } };
      const result = await controller.create(mockClienteId, dto as never, req as never);
      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(mockClienteId, dto, 'user-1');
    });
  });
});
