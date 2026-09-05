import { Test, TestingModule } from '@nestjs/testing';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClientesController', () => {
  let controller: ClientesController;
  let service: ClientesService;

  const mockCliente = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    codigo: null,
    nombre: 'Carlos SVR',
    empresa: 'ARCO Construcciones',
    correo: 'carlos@arco.mx',
    telefono: '55-1234-5678',
    rfc: null,
    activo: true,
  };

  const mockResult = {
    items: [mockCliente],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockResult),
    findOne: jest.fn().mockResolvedValue(mockCliente),
    create: jest.fn().mockResolvedValue(mockCliente),
    update: jest.fn().mockResolvedValue(mockCliente),
    remove: jest.fn().mockResolvedValue({ message: 'Cliente eliminado exitosamente' }),
    findStats: jest.fn().mockResolvedValue({
      totalClientes: 12,
      clientesActivos: 10,
      empresas: 8,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientesController],
      providers: [
        { provide: ClientesService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(ClientesController);
    service = module.get(ClientesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated clientes', async () => {
      const result = await controller.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findStats', () => {
    it('should return clientes stats', async () => {
      const result = await controller.findStats();
      expect(result.totalClientes).toBe(12);
      expect(result.empresas).toBe(8);
    });
  });

  describe('findOne', () => {
    it('should return a single cliente', async () => {
      const result = await controller.findOne(mockCliente.id);
      expect(result.id).toBe(mockCliente.id);
      expect(service.findOne).toHaveBeenCalledWith(mockCliente.id);
    });
  });

  describe('create', () => {
    it('should create a cliente passing userId', async () => {
      const dto = {
        nombre: 'Nuevo Cliente',
        empresa: 'Empresa SA',
        correo: 'nuevo@empresa.mx',
        telefono: '55-5555-5555',
      };
      const req = { user: { id: 'user-1' } };
      const result = await controller.create(dto as never, req as never);
      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('update', () => {
    it('should update a cliente passing userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.update(
        mockCliente.id,
        { nombre: 'Cliente Editado' },
        req as never,
      );
      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(
        mockCliente.id,
        { nombre: 'Cliente Editado' },
        'user-1',
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a cliente passing userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.remove(mockCliente.id, req as never);
      expect(result.message).toContain('eliminado');
      expect(service.remove).toHaveBeenCalledWith(mockCliente.id, 'user-1');
    });
  });
});
