import { Test, TestingModule } from '@nestjs/testing';
import { BitacorasRentaController } from './bitacoras-renta.controller';
import { BitacorasRentaService } from './bitacoras-renta.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BitacorasRentaController', () => {
  let controller: BitacorasRentaController;
  let service: BitacorasRentaService;

  const mockBitacora = { id: 'bit-uuid-1', folio: 'BIT-2026-001' };
  const mockResult = { items: [mockBitacora], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
  const mockRequest = { user: { id: 'user-1' } } as never;

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockResult),
    findOne: jest.fn().mockResolvedValue(mockBitacora),
    create: jest.fn().mockResolvedValue(mockBitacora),
    update: jest.fn().mockResolvedValue(mockBitacora),
    remove: jest.fn().mockResolvedValue({ message: 'Bitácora de renta eliminada exitosamente' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BitacorasRentaController],
      providers: [
        { provide: BitacorasRentaService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(BitacorasRentaController);
    service = module.get(BitacorasRentaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll delegates to service', async () => {
    await controller.findAll({});
    expect(service.findAll).toHaveBeenCalledWith({});
  });

  it('create passes the userId from the JWT request', async () => {
    const dto = { trabajadorId: 'trab-uuid-1' } as never;
    await controller.create(dto, mockRequest);
    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('update passes the userId from the JWT request', async () => {
    const dto = { firmado: true } as never;
    await controller.update('bit-uuid-1', dto, mockRequest);
    expect(service.update).toHaveBeenCalledWith('bit-uuid-1', dto, 'user-1');
  });

  it('remove passes the userId from the JWT request', async () => {
    await controller.remove('bit-uuid-1', mockRequest);
    expect(service.remove).toHaveBeenCalledWith('bit-uuid-1', 'user-1');
  });
});
