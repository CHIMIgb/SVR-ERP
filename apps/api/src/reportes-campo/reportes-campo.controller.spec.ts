import { Test, TestingModule } from '@nestjs/testing';
import { ReportesCampoController } from './reportes-campo.controller';
import { ReportesCampoService } from './reportes-campo.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportesCampoController', () => {
  let controller: ReportesCampoController;
  let service: ReportesCampoService;

  const mockReporte = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    tipo: 'Pipero',
    usuario: 'Marcos G.',
    obra: 'Valle Sur',
    estado: 'Visto',
    descripcion: 'Suministro de diésel.',
  };

  const mockResult = {
    items: [mockReporte],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockResult),
    findOne: jest.fn().mockResolvedValue(mockReporte),
    create: jest.fn().mockResolvedValue(mockReporte),
    update: jest.fn().mockResolvedValue(mockReporte),
    cambiarEstado: jest.fn().mockResolvedValue(mockReporte),
    remove: jest.fn().mockResolvedValue({ message: 'eliminado' }),
    findStats: jest.fn().mockResolvedValue({
      pendientes: 2,
      enRevision: 1,
      atendidos: 3,
      resueltos: 5,
      criticosActivos: 1,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportesCampoController],
      providers: [
        { provide: ReportesCampoService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(ReportesCampoController);
    service = module.get(ReportesCampoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should delegate to service', async () => {
      const result = await controller.findAll({});
      expect(result).toHaveProperty('items');
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findStats', () => {
    it('should return stats', async () => {
      const result = await controller.findStats();
      expect(result.pendientes).toBe(2);
      expect(result.criticosActivos).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a single reporte', async () => {
      const result = await controller.findOne(mockReporte.id);
      expect(service.findOne).toHaveBeenCalledWith(mockReporte.id);
      expect(result.usuario).toBe('Marcos G.');
    });
  });

  describe('create', () => {
    it('should create passing userId', async () => {
      const dto = {
        tipo: 'PIPERO' as const,
        usuario: 'Marcos G.',
        obraTexto: 'Valle Sur',
        fecha: '2025-04-27',
        hora: '14:15',
        descripcion: 'Suministro de diésel.',
      };
      const req = { user: { id: 'user-1' } };
      const result = await controller.create(dto as never, req as never);
      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('cambiarEstado', () => {
    it('should pass dto and userId', async () => {
      const req = { user: { id: 'user-1' } };
      const dto = { estado: 'ATENDIDO' as never };
      const result = await controller.cambiarEstado(mockReporte.id, dto, req as never);
      expect(result).toBeDefined();
      expect(service.cambiarEstado).toHaveBeenCalledWith(mockReporte.id, dto, 'user-1');
    });
  });

  describe('update', () => {
    it('should pass dto and userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.update(
        mockReporte.id,
        { descripcion: 'Corregido' },
        req as never,
      );
      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(mockReporte.id, { descripcion: 'Corregido' }, 'user-1');
    });
  });

  describe('remove', () => {
    it('should soft delete passing userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.remove(mockReporte.id, req as never);
      expect(result.message).toContain('eliminado');
      expect(service.remove).toHaveBeenCalledWith(mockReporte.id, 'user-1');
    });
  });
});
