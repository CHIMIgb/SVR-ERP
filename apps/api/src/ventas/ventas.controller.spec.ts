import { Test, TestingModule } from '@nestjs/testing';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VentasController', () => {
  let controller: VentasController;
  let service: VentasService;

  const mockVenta = {
    id: 'v1',
    folio: 'S123',
    ticket: 'T-00001',
    total: 350,
    method: 'efectivo',
  };

  const mockService = {
    findCatalogos: jest.fn().mockResolvedValue({ materiales: [] }),
    findHoy: jest.fn().mockResolvedValue({ ventas: [], stats: {} }),
    create: jest.fn().mockResolvedValue(mockVenta),
    findRetiros: jest.fn().mockResolvedValue({ items: [] }),
    createRetiro: jest.fn().mockResolvedValue({ id: 'r1' }),
    findCierreHoy: jest.fn().mockResolvedValue({ existe: false, registro: null }),
    createCierre: jest.fn().mockResolvedValue({ id: 'c1' }),
    findConfig: jest.fn().mockResolvedValue({
      apertura: '07:00',
      cierre: '20:00',
      formato: '24h',
    }),
    findAperturaHoy: jest.fn().mockResolvedValue({ existe: false, registro: null }),
    createApertura: jest.fn().mockResolvedValue({ id: 'a1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VentasController],
      providers: [
        { provide: VentasService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(VentasController);
    service = module.get(VentasService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return catalogos', async () => {
    const result = await controller.findCatalogos();
    expect(result).toHaveProperty('materiales');
  });

  it('should return ventas of the day', async () => {
    const result = await controller.findHoy();
    expect(result).toHaveProperty('ventas');
  });

  it('should create a venta passing userId from req', async () => {
    const req = { user: { id: 'user-1' } };
    const dto = { cajero: 'Cajero' };
    const result = await controller.create(dto as never, req as never);
    expect(result.id).toBe('v1');
    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('should return retiros', async () => {
    const result = await controller.findRetiros();
    expect(result).toHaveProperty('items');
  });

  it('should create a retiro passing userId', async () => {
    const req = { user: { id: 'user-1', nombre: 'Carlos' } };
    const dto = { concepto: 'Gasolina', monto: 500, autorizadoPor: 'Jefe' };
    const result = await controller.createRetiro(dto, req as never);
    expect(result.id).toBe('r1');
    expect(service.createRetiro).toHaveBeenCalledWith(dto, 'user-1', 'Carlos');
  });

  it('should return cierre/registro of the day', async () => {
    const result = await controller.findCierreHoy();
    expect(result.existe).toBe(false);
  });

  it('should create a cierre passing userId', async () => {
    const req = { user: { id: 'user-1', nombre: 'Carlos' } };
    const dto = { denominaciones: { '100': 1 } };
    const result = await controller.createCierre(dto, req as never);
    expect(result.id).toBe('c1');
    expect(service.createCierre).toHaveBeenCalledWith(dto, 'user-1', 'Carlos');
  });

  it('should return turn config', async () => {
    const result = await controller.findConfig();
    expect(result.apertura).toBe('07:00');
  });

  it('should return apertura of the day', async () => {
    const result = await controller.findAperturaHoy();
    expect(result.existe).toBe(false);
  });

  it('should create an apertura passing userId and cajero', async () => {
    const req = { user: { id: 'user-1', nombre: 'Carlos' } };
    const dto = { fondoInicial: 500 };
    const result = await controller.createApertura(dto, req as never);
    expect(result.id).toBe('a1');
    expect(service.createApertura).toHaveBeenCalledWith(dto, 'user-1', 'Carlos');
  });
});
