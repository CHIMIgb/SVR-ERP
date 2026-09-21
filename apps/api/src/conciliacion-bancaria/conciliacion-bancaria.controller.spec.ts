import { Test, TestingModule } from '@nestjs/testing';
import { ConciliacionBancariaController } from './conciliacion-bancaria.controller';
import { ConciliacionBancariaService } from './conciliacion-bancaria.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ConciliacionBancariaController', () => {
  let controller: ConciliacionBancariaController;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let service: any;

  const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
  const BANCO_ID = '550e8400-e29b-41d4-a716-446655440002';
  const CUENTA_ID = '550e8400-e29b-41d4-a716-446655440003';
  const MOVIMIENTO_ID = '550e8400-e29b-41d4-a716-446655440004';
  const TRX_ID = '550e8400-e29b-41d4-a716-446655440005';
  const req = { user: { id: USER_ID } };

  const mockService = {
    listarBancos: jest.fn().mockResolvedValue([{ id: BANCO_ID, nombre: 'BBVA', activo: true }]),
    crearBanco: jest.fn().mockResolvedValue({ id: BANCO_ID, nombre: 'BBVA', activo: true }),
    listarCuentas: jest.fn().mockResolvedValue([{ id: CUENTA_ID }]),
    crearCuenta: jest.fn().mockResolvedValue({ id: CUENTA_ID }),
    listarMovimientos: jest.fn().mockResolvedValue({ items: [], pagination: { page: 1 } }),
    listarCandidatas: jest.fn().mockResolvedValue([]),
    crearMovimiento: jest.fn().mockResolvedValue({ id: MOVIMIENTO_ID }),
    cargarLote: jest.fn().mockResolvedValue({ totalMovimientos: 2, insertados: 2, duplicados: 0 }),
    conciliar: jest.fn().mockResolvedValue({ conciliado: true, movimientoId: MOVIMIENTO_ID, transaccionId: TRX_ID, monto: 5000 }),
    desconciliar: jest.fn().mockResolvedValue({ conciliado: false, movimientoId: MOVIMIENTO_ID }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConciliacionBancariaController],
      providers: [
        { provide: ConciliacionBancariaService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(ConciliacionBancariaController);
    service = module.get(ConciliacionBancariaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listarBancos', () => {
    it('should call service.listarBancos', async () => {
      const result = await controller.listarBancos();
      expect(result).toHaveLength(1);
      expect(service.listarBancos).toHaveBeenCalled();
    });
  });

  describe('crearBanco', () => {
    it('should create banco with userId', async () => {
      await controller.crearBanco({ nombre: 'BBVA' }, req as never);
      expect(service.crearBanco).toHaveBeenCalledWith({ nombre: 'BBVA' }, USER_ID);
    });
  });

  describe('listarCuentas', () => {
    it('should call service.listarCuentas with bancoId', async () => {
      await controller.listarCuentas(BANCO_ID);
      expect(service.listarCuentas).toHaveBeenCalledWith(BANCO_ID);
    });
  });

  describe('crearCuenta', () => {
    it('should create cuenta with bancoId and userId', async () => {
      await controller.crearCuenta(BANCO_ID, { numero: '0123456789' }, req as never);
      expect(service.crearCuenta).toHaveBeenCalledWith(BANCO_ID, { numero: '0123456789' }, USER_ID);
    });
  });

  describe('listarMovimientos', () => {
    it('should call service.listarMovimientos with query', async () => {
      await controller.listarMovimientos(CUENTA_ID, { page: 1 });
      expect(service.listarMovimientos).toHaveBeenCalledWith(CUENTA_ID, { page: 1 });
    });
  });

  describe('listarCandidatas', () => {
    it('should call service.listarCandidatas', async () => {
      await controller.listarCandidatas(MOVIMIENTO_ID);
      expect(service.listarCandidatas).toHaveBeenCalledWith(MOVIMIENTO_ID);
    });
  });

  describe('cargarLote', () => {
    it('should call service.cargarLote with csv and userId', async () => {
      await controller.cargarLote(CUENTA_ID, { csv: 'a,b,c,d' }, req as never);
      expect(service.cargarLote).toHaveBeenCalledWith(CUENTA_ID, { csv: 'a,b,c,d' }, USER_ID);
    });
  });

  describe('crearMovimiento', () => {
    it('should call service.crearMovimiento with userId', async () => {
      await controller.crearMovimiento(CUENTA_ID, { fecha: '2026-09-01', descripcion: 'X', deposito: 100 }, req as never);
      expect(service.crearMovimiento).toHaveBeenCalled();
    });
  });

  describe('conciliar', () => {
    it('should call service.conciliar with transaccionId and userId', async () => {
      const result = await controller.conciliar(MOVIMIENTO_ID, { transaccionId: TRX_ID }, req as never);
      expect(result.conciliado).toBe(true);
      expect(service.conciliar).toHaveBeenCalledWith(MOVIMIENTO_ID, { transaccionId: TRX_ID }, USER_ID);
    });
  });

  describe('desconciliar', () => {
    it('should call service.desconciliar with userId', async () => {
      const result = await controller.desconciliar(MOVIMIENTO_ID, req as never);
      expect(result.conciliado).toBe(false);
      expect(service.desconciliar).toHaveBeenCalledWith(MOVIMIENTO_ID, USER_ID);
    });
  });
});