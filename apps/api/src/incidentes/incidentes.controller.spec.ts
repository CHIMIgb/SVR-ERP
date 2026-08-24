import { Test, TestingModule } from '@nestjs/testing';
import { IncidentesController } from './incidentes.controller';
import { IncidentesService } from './incidentes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('IncidentesController', () => {
  let controller: IncidentesController;
  let service: IncidentesService;

  const mockIncidente = {
    id: 'in000000-0000-0000-0000-000000000001',
    titulo: 'Fuga de aceite hidráulico',
    descripcion: 'Se detectó fuga en manguera principal',
    prioridad: 'Alta',
    estado: 'Abierto',
    fecha: '2025-04-27',
    maquinaId: 'mq000000-0000-0000-0000-000000000001',
    maquina: 'Excavadora CAT 320',
    obraId: 'ob000000-0000-0000-0000-000000000001',
    obra: 'Valle Sur',
  };

  const mockResult = {
    items: [mockIncidente],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockResult),
    findOne: jest.fn().mockResolvedValue(mockIncidente),
    create: jest.fn().mockResolvedValue(mockIncidente),
    update: jest.fn().mockResolvedValue(mockIncidente),
    remove: jest.fn().mockResolvedValue({ message: 'Incidente eliminado exitosamente' }),
    resolver: jest.fn().mockResolvedValue(mockIncidente),
    findStats: jest.fn().mockResolvedValue({ total: 1, abiertos: 1, criticos: 0 }),
    findCatalogos: jest.fn().mockResolvedValue({
      maquinas: [{ id: 'mq1', nombre: 'Excavadora CAT 320' }],
      obras: [{ id: 'ob1', nombre: 'Valle Sur' }],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentesController],
      providers: [
        { provide: IncidentesService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(IncidentesController);
    service = module.get(IncidentesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated incidentes', async () => {
      const result = await controller.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('should return a single incidente', async () => {
      const result = await controller.findOne(mockIncidente.id);
      expect(result.id).toBe(mockIncidente.id);
      expect(service.findOne).toHaveBeenCalledWith(mockIncidente.id);
    });
  });

  describe('create', () => {
    it('should create a new incidente', async () => {
      const dto = {
        titulo: 'Fuga de aceite hidráulico',
        descripcion: 'Se detectó fuga',
        prioridad: 'ALTA' as const,
        estado: 'ABIERTO' as const,
        fecha: '2025-04-27',
        obraId: 'ob000000-0000-0000-0000-000000000001',
      };
      const req = { user: { id: 'user-1' } };
      const result = await controller.create(dto as never, req as never);
      expect(result.titulo).toBe(mockIncidente.titulo);
      expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('update', () => {
    it('should update an incidente', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.update(
        mockIncidente.id,
        { titulo: 'Fuga reparada' },
        req as never,
      );
      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(mockIncidente.id, { titulo: 'Fuga reparada' }, 'user-1');
    });
  });

  describe('remove', () => {
    it('should soft delete an incidente passing userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.remove(mockIncidente.id, req as never);
      expect(result.message).toContain('eliminado');
      expect(service.remove).toHaveBeenCalledWith(mockIncidente.id, 'user-1');
    });
  });

  describe('resolver', () => {
    it('should resolve an incidente passing userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.resolver(mockIncidente.id, req as never);
      expect(result).toBeDefined();
      expect(service.resolver).toHaveBeenCalledWith(mockIncidente.id, 'user-1');
    });
  });

  describe('findStats', () => {
    it('should return incidente stats', async () => {
      const result = await controller.findStats();
      expect(result.total).toBe(1);
      expect(result.abiertos).toBe(1);
      expect(result.criticos).toBe(0);
    });
  });

  describe('findCatalogos', () => {
    it('should return catalog data', async () => {
      const result = await controller.findCatalogos();
      expect(result).toHaveProperty('maquinas');
      expect(result).toHaveProperty('obras');
    });
  });
});
