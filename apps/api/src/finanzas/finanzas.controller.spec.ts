import { Test, TestingModule } from '@nestjs/testing';
import { FinanzasController } from './finanzas.controller';
import { FinanzasService } from './finanzas.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FinanzasController', () => {
  let controller: FinanzasController;
  let service: FinanzasService;

  const mockTransaccion = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    codigo: 'TRA-20260820-ABC123',
    tipo: 'INGRESO',
    categoria: 'Pago de Obra',
    monto: 15000,
    fecha: '2026-08-20',
    descripcion: 'Anticipo de obra',
  };

  const mockResult = {
    items: [mockTransaccion],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockResult),
    findOne: jest.fn().mockResolvedValue(mockTransaccion),
    create: jest.fn().mockResolvedValue(mockTransaccion),
    update: jest.fn().mockResolvedValue(mockTransaccion),
    remove: jest.fn().mockResolvedValue({ message: 'Transacción eliminada exitosamente' }),
    findStats: jest.fn().mockResolvedValue({
      balance: 11000,
      totalIngresos: 15000,
      totalEgresos: 4000,
      cantidad: 3,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanzasController],
      providers: [
        { provide: FinanzasService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(FinanzasController);
    service = module.get(FinanzasService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated transacciones', async () => {
      const result = await controller.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findStats', () => {
    it('should return finanzas stats', async () => {
      const result = await controller.findStats();
      expect(result.balance).toBe(11000);
      expect(result.totalIngresos).toBe(15000);
      expect(result.totalEgresos).toBe(4000);
    });
  });

  describe('findOne', () => {
    it('should return a single transaccion', async () => {
      const result = await controller.findOne(mockTransaccion.id);
      expect(result.id).toBe(mockTransaccion.id);
      expect(service.findOne).toHaveBeenCalledWith(mockTransaccion.id);
    });
  });

  describe('create', () => {
    it('should create a transaccion passing userId', async () => {
      const dto = {
        tipo: 'EGRESO' as const,
        categoria: 'Combustible',
        monto: 850,
        fecha: '2026-08-21',
        descripcion: 'Diesel maquinaria',
      };
      const req = { user: { id: 'user-1' } };
      const result = await controller.create(dto as never, req as never);
      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('update', () => {
    it('should update a transaccion passing userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.update(mockTransaccion.id, { monto: 900 }, req as never);
      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(mockTransaccion.id, { monto: 900 }, 'user-1');
    });
  });

  describe('remove', () => {
    it('should soft delete a transaccion passing userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.remove(mockTransaccion.id, req as never);
      expect(result.message).toContain('eliminada');
      expect(service.remove).toHaveBeenCalledWith(mockTransaccion.id, 'user-1');
    });
  });
});
