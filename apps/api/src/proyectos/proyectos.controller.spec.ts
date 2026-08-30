import { Test, TestingModule } from '@nestjs/testing';
import { ProyectosController } from './proyectos.controller';
import { ProyectosService } from './proyectos.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProyectosController', () => {
  let controller: ProyectosController;
  let service: ProyectosService;

  const mockProyecto = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    nombre: 'Fraccionamiento Valle Sur',
    clienteId: '550e8400-e29b-41d4-a716-446655440001',
    cliente: 'Constructora ABC',
    presupuesto: 1200000,
    progreso: 85,
    estado: 'En Proceso',
    fechaInicio: '2025-01-10',
    fechaFin: '2025-05-30',
    ingresoCobrado: 1020000,
    gastado: 950000,
  };

  const mockResult = {
    items: [mockProyecto],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockResult),
    findOne: jest.fn().mockResolvedValue(mockProyecto),
    create: jest.fn().mockResolvedValue(mockProyecto),
    update: jest.fn().mockResolvedValue(mockProyecto),
    actualizarFinanzas: jest.fn().mockResolvedValue(mockProyecto),
    remove: jest.fn().mockResolvedValue({ message: 'Proyecto eliminado exitosamente' }),
    findStats: jest.fn().mockResolvedValue({
      total: 1,
      enProceso: 1,
      finalizados: 0,
      presupuestoTotal: 1200000,
    }),
    findCatalogos: jest.fn().mockResolvedValue({
      clientes: [{ id: 'cli-1', nombre: 'Constructora ABC' }],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProyectosController],
      providers: [
        { provide: ProyectosService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(ProyectosController);
    service = module.get(ProyectosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated proyectos', async () => {
      const result = await controller.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findStats', () => {
    it('should return proyecto stats', async () => {
      const result = await controller.findStats();
      expect(result.total).toBe(1);
      expect(result.enProceso).toBe(1);
      expect(result.presupuestoTotal).toBe(1200000);
    });
  });

  describe('findCatalogos', () => {
    it('should return catalog data', async () => {
      const result = await controller.findCatalogos();
      expect(result).toHaveProperty('clientes');
    });
  });

  describe('findOne', () => {
    it('should return a single proyecto', async () => {
      const result = await controller.findOne(mockProyecto.id);
      expect(result.nombre).toBe(mockProyecto.nombre);
      expect(service.findOne).toHaveBeenCalledWith(mockProyecto.id);
    });
  });

  describe('create', () => {
    it('should create a new proyecto', async () => {
      const dto = {
        nombre: 'Puente Atizapán',
        clienteId: '550e8400-e29b-41d4-a716-446655440001',
        presupuesto: 8900000,
        fechaInicio: '2025-06-15',
        fechaFin: '2026-04-20',
      };
      const req = { user: { id: 'user-1' } };
      const result = await controller.create(dto as never, req as never);
      expect(result.nombre).toBe(mockProyecto.nombre);
      expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('update', () => {
    it('should update a proyecto', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.update(
        mockProyecto.id,
        { nombre: 'Valle Sur Fase II' },
        req as never,
      );
      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(
        mockProyecto.id,
        { nombre: 'Valle Sur Fase II' },
        'user-1',
      );
    });
  });

  describe('actualizarFinanzas', () => {
    it('should update finanzas passing dto and userId', async () => {
      const req = { user: { id: 'user-1' } };
      const dto = { ingresoCobrado: 1100000, gastado: 980000 };
      const result = await controller.actualizarFinanzas(mockProyecto.id, dto, req as never);
      expect(result).toBeDefined();
      expect(service.actualizarFinanzas).toHaveBeenCalledWith(mockProyecto.id, dto, 'user-1');
    });
  });

  describe('remove', () => {
    it('should soft delete a proyecto passing userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.remove(mockProyecto.id, req as never);
      expect(result.message).toContain('eliminado');
      expect(service.remove).toHaveBeenCalledWith(mockProyecto.id, 'user-1');
    });
  });
});
