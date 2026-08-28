import { Test, TestingModule } from '@nestjs/testing';
import { CotizacionesGlobalController } from './cotizaciones-global.controller';
import { CotizacionesService } from './cotizaciones.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CotizacionesGlobalController', () => {
  let controller: CotizacionesGlobalController;
  let service: CotizacionesService;

  const mockCotizacion = {
    id: '490e8400-e29b-41d4-a716-446655440010',
    codigo: 'COT-20260815-ABC123',
    clienteId: '550e8400-e29b-41d4-a716-446655440010',
    descripcion: 'Renta de excavadora por 100 horas',
    monto: 125000,
    fecha: '2026-08-15',
    estado: 'Pendiente',
    clienteNombre: 'Carlos SVR',
    clienteEmpresa: 'SVR Constructora',
    activo: true,
  };

  const mockResult = {
    items: [mockCotizacion],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockResult),
    findOne: jest.fn().mockResolvedValue(mockCotizacion),
    update: jest.fn().mockResolvedValue({ ...mockCotizacion, monto: 130000 }),
    cambiarEstado: jest.fn().mockResolvedValue({ ...mockCotizacion, estado: 'Aceptada' }),
    findStats: jest.fn().mockResolvedValue({
      total: 10,
      pendientes: 4,
      aceptadas: 5,
      rechazadas: 1,
      montoAceptado: 520000,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CotizacionesGlobalController],
      providers: [
        { provide: CotizacionesService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(CotizacionesGlobalController);
    service = module.get(CotizacionesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated global cotizaciones', async () => {
      const result = await controller.findAll({ page: 1, limit: 10 });
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('findStats', () => {
    it('should return cotizaciones stats', async () => {
      const result = await controller.findStats();
      expect(result.total).toBe(10);
      expect(result.aceptadas).toBe(5);
      expect(service.findStats).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single cotizacion detail', async () => {
      const result = await controller.findOne(mockCotizacion.id);
      expect(result.id).toBe(mockCotizacion.id);
      expect(service.findOne).toHaveBeenCalledWith(mockCotizacion.id);
    });
  });

  describe('update', () => {
    it('should edit a cotizacion passing userId', async () => {
      const dto = { monto: 130000 };
      const req = { user: { id: 'user-1' } };
      const result = await controller.update(mockCotizacion.id, dto as never, req as never);
      expect(result.monto).toBe(130000);
      expect(service.update).toHaveBeenCalledWith(mockCotizacion.id, dto, 'user-1');
    });
  });

  describe('cambiarEstado', () => {
    it('should change estado passing userId', async () => {
      const dto = { estado: 'ACEPTADA' };
      const req = { user: { id: 'user-1' } };
      const result = await controller.cambiarEstado(mockCotizacion.id, dto as never, req as never);
      expect(result.estado).toBe('Aceptada');
      expect(service.cambiarEstado).toHaveBeenCalledWith(mockCotizacion.id, dto, 'user-1');
    });
  });
});
