import { Test, TestingModule } from '@nestjs/testing';
import { FacturasController } from './facturas.controller';
import { FacturasService } from './facturas.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FacturasController', () => {
  let controller: FacturasController;
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    cambiarEstado: jest.fn(),
    remove: jest.fn(),
    agregarConcepto: jest.fn(),
    actualizarConcepto: jest.fn(),
    eliminarConcepto: jest.fn(),
  };

  const req = { user: { id: 'c0000000-0000-0000-0000-000000000001' } };
  const ID = '550e8400-e29b-41d4-a716-446655440010';
  const CONCEPTO_ID = '550e8400-e29b-41d4-a716-446655440011';

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacturasController],
      providers: [
        { provide: FacturasService, useValue: service },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(FacturasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /facturas', () => {
    it('debe listar facturas con filtros', async () => {
      service.findAll.mockResolvedValue({ items: [], pagination: {} });
      const result = await controller.findAll({ estado: 'PENDIENTE' } as never);
      expect(service.findAll).toHaveBeenCalledWith({ estado: 'PENDIENTE' });
      expect(result).toEqual({ items: [], pagination: {} });
    });
  });

  describe('GET /facturas/:id', () => {
    it('debe devolver el detalle', async () => {
      service.findOne.mockResolvedValue({ id: ID });
      const result = await controller.findOne(ID);
      expect(service.findOne).toHaveBeenCalledWith(ID);
      expect(result).toEqual({ id: ID });
    });
  });

  describe('POST /facturas', () => {
    it('debe crear con el userId del JWT', async () => {
      const dto = { clienteId: ID, conceptos: [] };
      service.create.mockResolvedValue({ id: 'nueva' });
      const result = await controller.create(dto as never, req as never);
      expect(service.create).toHaveBeenCalledWith(dto, req.user.id);
      expect(result).toEqual({ id: 'nueva' });
    });
  });

  describe('PATCH /facturas/:id', () => {
    it('debe actualizar con el userId del JWT', async () => {
      const dto = { usoCfdi: 'G01' };
      service.update.mockResolvedValue({ id: ID });
      const result = await controller.update(ID, dto as never, req as never);
      expect(service.update).toHaveBeenCalledWith(ID, dto, req.user.id);
      expect(result).toEqual({ id: ID });
    });
  });

  describe('PATCH /facturas/:id/estado', () => {
    it('debe cambiar estado con el userId del JWT', async () => {
      const dto = { estado: 'TIMBRADA' };
      service.cambiarEstado.mockResolvedValue({ id: ID, estado: 'TIMBRADA' });
      const result = await controller.cambiarEstado(ID, dto as never, req as never);
      expect(service.cambiarEstado).toHaveBeenCalledWith(ID, dto, req.user.id);
      expect(result).toEqual({ id: ID, estado: 'TIMBRADA' });
    });
  });

  describe('DELETE /facturas/:id', () => {
    it('debe eliminar con el userId del JWT', async () => {
      service.remove.mockResolvedValue({ success: true, id: ID });
      const result = await controller.remove(ID, req as never);
      expect(service.remove).toHaveBeenCalledWith(ID, req.user.id);
      expect(result).toEqual({ success: true, id: ID });
    });
  });

  describe('POST /facturas/:id/conceptos', () => {
    it('debe agregar concepto con el userId del JWT', async () => {
      const dto = { cantidad: 1, unidad: 'pza', descripcion: 'X', valorUnitario: 100 };
      service.agregarConcepto.mockResolvedValue({ id: ID });
      const result = await controller.agregarConcepto(ID, dto as never, req as never);
      expect(service.agregarConcepto).toHaveBeenCalledWith(ID, dto, req.user.id);
      expect(result).toEqual({ id: ID });
    });
  });

  describe('PATCH /facturas/:id/conceptos/:conceptoId', () => {
    it('debe actualizar concepto con el userId del JWT', async () => {
      const dto = { cantidad: 2 };
      service.actualizarConcepto.mockResolvedValue({ id: ID });
      const result = await controller.actualizarConcepto(ID, CONCEPTO_ID, dto as never, req as never);
      expect(service.actualizarConcepto).toHaveBeenCalledWith(ID, CONCEPTO_ID, dto, req.user.id);
      expect(result).toEqual({ id: ID });
    });
  });

  describe('DELETE /facturas/:id/conceptos/:conceptoId', () => {
    it('debe eliminar concepto con el userId del JWT', async () => {
      service.eliminarConcepto.mockResolvedValue({ id: ID });
      const result = await controller.eliminarConcepto(ID, CONCEPTO_ID, req as never);
      expect(service.eliminarConcepto).toHaveBeenCalledWith(ID, CONCEPTO_ID, req.user.id);
      expect(result).toEqual({ id: ID });
    });
  });
});