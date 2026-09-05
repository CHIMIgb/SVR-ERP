import { Test, TestingModule } from '@nestjs/testing';
import { ProveedoresController } from './proveedores.controller';
import { ProveedoresService } from './proveedores.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProveedoresController', () => {
  let controller: ProveedoresController;
  const service = {
    findAll: jest.fn(),
    findEstadoCuentaResumen: jest.fn(),
    findLedgerPorProveedor: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    registrarAbono: jest.fn(),
    findAllOrdenes: jest.fn(),
    findOneOrden: jest.fn(),
    createOrden: jest.fn(),
    updateOrden: jest.fn(),
    removeOrden: jest.fn(),
    cambiarEstadoOrden: jest.fn(),
  };

  const req = { user: { id: 'a0000000-0000-0000-0000-000000000099' } };
  const ID = '550e8400-e29b-41d4-a716-446655440010';

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProveedoresController],
      providers: [
        { provide: ProveedoresService, useValue: service },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(ProveedoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('proveedores endpoints', () => {
    it('GET /proveedores -> findAll with query', async () => {
      service.findAll.mockResolvedValue({ items: [], pagination: {} });
      await controller.findAll({ search: 'tornillo' });
      expect(service.findAll).toHaveBeenCalledWith({ search: 'tornillo' });
    });

    it('GET /proveedores/estados-cuenta -> findEstadoCuentaResumen', async () => {
      service.findEstadoCuentaResumen.mockResolvedValue([]);
      await controller.findEstadoCuentaResumen();
      expect(service.findEstadoCuentaResumen).toHaveBeenCalled();
    });

    it('GET /proveedores/:id/estado-cuenta -> findLedgerPorProveedor', async () => {
      await controller.findLedgerPorProveedor(ID);
      expect(service.findLedgerPorProveedor).toHaveBeenCalledWith(ID);
    });

    it('GET /proveedores/:id -> findOne', async () => {
      await controller.findOne(ID);
      expect(service.findOne).toHaveBeenCalledWith(ID);
    });

    it('POST /proveedores -> create with user id', async () => {
      const dto = { nombre: 'Nuevo' };
      await controller.create(dto, req as never);
      expect(service.create).toHaveBeenCalledWith(dto, req.user.id);
    });

    it('PATCH /proveedores/:id -> update with user id', async () => {
      const dto = { nombre: 'Editado' };
      await controller.update(ID, dto, req as never);
      expect(service.update).toHaveBeenCalledWith(ID, dto, req.user.id);
    });

    it('DELETE /proveedores/:id -> remove with user id', async () => {
      await controller.remove(ID, req as never);
      expect(service.remove).toHaveBeenCalledWith(ID, req.user.id);
    });

    it('POST /proveedores/:id/abonos -> registrarAbono with user id', async () => {
      const dto = { ordenCompraId: ID, monto: 400 };
      await controller.registrarAbono(ID, dto, req as never);
      expect(service.registrarAbono).toHaveBeenCalledWith(ID, dto, req.user.id);
    });
  });

  describe('ordenes-compra endpoints', () => {
    it('GET /ordenes-compra -> findAllOrdenes with query', async () => {
      await controller.findAllOrdenes({ estado: 'PENDIENTE' });
      expect(service.findAllOrdenes).toHaveBeenCalledWith({ estado: 'PENDIENTE' });
    });

    it('GET /ordenes-compra/:id -> findOneOrden', async () => {
      await controller.findOneOrden(ID);
      expect(service.findOneOrden).toHaveBeenCalledWith(ID);
    });

    it('POST /ordenes-compra -> createOrden with user id', async () => {
      const dto = { proveedorId: ID, descripcion: 'Cemento', monto: 800 };
      await controller.createOrden(dto, req as never);
      expect(service.createOrden).toHaveBeenCalledWith(dto, req.user.id);
    });

    it('PATCH /ordenes-compra/:id -> updateOrden with user id', async () => {
      const dto = { monto: 1000 };
      await controller.updateOrden(ID, dto, req as never);
      expect(service.updateOrden).toHaveBeenCalledWith(ID, dto, req.user.id);
    });

    it('DELETE /ordenes-compra/:id -> removeOrden with user id', async () => {
      await controller.removeOrden(ID, req as never);
      expect(service.removeOrden).toHaveBeenCalledWith(ID, req.user.id);
    });

    it('POST /ordenes-compra/:id/cambiar-estado -> cambiarEstadoOrden', async () => {
      const dto = { estado: 'APROBADA' as never };
      await controller.cambiarEstadoOrden(ID, dto, req as never);
      expect(service.cambiarEstadoOrden).toHaveBeenCalledWith(ID, dto, req.user.id);
    });

    it('POST /ordenes-compra/:id/cambiar-estado rejects missing estado', async () => {
      await expect(
        controller.cambiarEstadoOrden(ID, {} as never, req as never),
      ).rejects.toThrow();
      expect(service.cambiarEstadoOrden).not.toHaveBeenCalled();
    });
  });
});