import { Test, TestingModule } from '@nestjs/testing';
import { CobranzaController } from './cobranza.controller';
import { CobranzaService } from './cobranza.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CobranzaController', () => {
  let controller: CobranzaController;
  const service = {
    findAll: jest.fn(),
    stats: jest.fn(),
    exportar: jest.fn(),
    findOne: jest.fn(),
    cobrosDeCuenta: jest.fn(),
    crearCuenta: jest.fn(),
    actualizarCuenta: jest.fn(),
    registrarCobro: jest.fn(),
  };

  const req = { user: { id: 'a0000000-0000-0000-0000-000000000099' } };
  const ID = '550e8400-e29b-41d4-a716-446655440010';

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CobranzaController],
      providers: [
        { provide: CobranzaService, useValue: service },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(CobranzaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /cobranza', () => {
    it('debe listar cuentas con los filtros', async () => {
      service.findAll.mockResolvedValue({ items: [], pagination: {} });
      const result = await controller.findAll({ estado: 'PENDIENTE' } as never);
      expect(service.findAll).toHaveBeenCalledWith({ estado: 'PENDIENTE' });
      expect(result).toEqual({ items: [], pagination: {} });
    });
  });

  describe('GET /cobranza/stats', () => {
    it('debe devolver las estadísticas de la cartera', async () => {
      service.stats.mockResolvedValue({ totalPorCobrar: 1000 });
      const result = await controller.stats();
      expect(service.stats).toHaveBeenCalled();
      expect(result).toEqual({ totalPorCobrar: 1000 });
    });
  });

  describe('GET /cobranza/exportar', () => {
    it('debe devolver el CSV de la cartera', async () => {
      service.exportar.mockResolvedValue('\uFEFF"ID"\n"x"');
      const result = await controller.exportar({} as never);
      expect(service.exportar).toHaveBeenCalledWith({});
      expect(result).toContain('\uFEFF"ID"');
    });
  });

  describe('GET /cobranza/:id', () => {
    it('debe devolver el detalle de la cuenta', async () => {
      service.findOne.mockResolvedValue({ id: ID });
      const result = await controller.findOne(ID);
      expect(service.findOne).toHaveBeenCalledWith(ID);
      expect(result).toEqual({ id: ID });
    });
  });

  describe('GET /cobranza/:id/cobros', () => {
    it('debe devolver el ledger de la cuenta', async () => {
      service.cobrosDeCuenta.mockResolvedValue({ cuentaId: ID, cobros: [] });
      const result = await controller.cobrosDeCuenta(ID);
      expect(service.cobrosDeCuenta).toHaveBeenCalledWith(ID);
      expect(result).toEqual({ cuentaId: ID, cobros: [] });
    });
  });

  describe('POST /cobranza', () => {
    it('debe crear la cuenta con el userId del JWT', async () => {
      const dto = { clienteId: ID, monto: 100 };
      service.crearCuenta.mockResolvedValue({ id: 'nueva' });
      const result = await controller.crearCuenta(dto as never, req as never);
      expect(service.crearCuenta).toHaveBeenCalledWith(dto, req.user.id);
      expect(result).toEqual({ id: 'nueva' });
    });
  });

  describe('PATCH /cobranza/:id', () => {
    it('debe actualizar la cuenta con el userId del JWT', async () => {
      const dto = { monto: 200 };
      service.actualizarCuenta.mockResolvedValue({ id: ID });
      const result = await controller.actualizarCuenta(ID, dto as never, req as never);
      expect(service.actualizarCuenta).toHaveBeenCalledWith(ID, dto, req.user.id);
      expect(result).toEqual({ id: ID });
    });
  });

  describe('POST /cobranza/:id/cobros', () => {
    it('debe registrar el cobro con el userId del JWT', async () => {
      const dto = { monto: 50, metodoPago: 'TRANSFERENCIA' };
      service.registrarCobro.mockResolvedValue({ cobro: { id: 'pago' }, cuenta: {} });
      const result = await controller.registrarCobro(ID, dto as never, req as never);
      expect(service.registrarCobro).toHaveBeenCalledWith(ID, dto, req.user.id);
      expect(result).toEqual({ cobro: { id: 'pago' }, cuenta: {} });
    });
  });
});