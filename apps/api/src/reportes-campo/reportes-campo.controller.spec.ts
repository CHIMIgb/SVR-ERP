import { Test, TestingModule } from '@nestjs/testing';
import { ReportesCampoController } from './reportes-campo.controller';
import { ReportesCampoService } from './reportes-campo.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportesCampoController (flujo incidentes v2)', () => {
  let controller: ReportesCampoController;
  let service: ReportesCampoService;

  const mockDetalle = {
    reporte: {
      id: '550e8400-e29b-41d4-a716-446655440010',
      codigo: 'INC0010',
      tipo: 'Pipero',
      usuario: 'Marcos G.',
      estado: 'Nuevo',
      descripcion: 'Suministro de diésel.',
    },
    actividades: [],
    adjuntos: [],
  };

  const mockResult = {
    items: [mockDetalle.reporte],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockResult),
    findOne: jest.fn().mockResolvedValue(mockDetalle),
    subcategorias: jest.fn().mockResolvedValue([{ id: 's1', categoria: 'Diesel', nombre: '150 litros de diésel' }]),
    create: jest.fn().mockResolvedValue(mockDetalle.reporte),
    update: jest.fn().mockResolvedValue(mockDetalle.reporte),
    cambiarEstado: jest.fn().mockResolvedValue({ ...mockDetalle.reporte, estado: 'En curso' }),
    asignar: jest.fn().mockResolvedValue(mockDetalle.reporte),
    comentar: jest.fn().mockResolvedValue({ id: 'act-1', texto: 'avance', autorNombre: 'm', creadoEn: 't' }),
    adjuntar: jest.fn().mockResolvedValue({ id: 'adj-1', nombre: 'e.png', mime: 'image/png', tamano: 67, datos: 'AA', creadoEn: 't' }),
    remove: jest.fn().mockResolvedValue({ message: 'eliminado' }),
    findStats: jest.fn().mockResolvedValue({
      nuevos: 2,
      enCurso: 1,
      cerrados: 3,
      criticosActivos: 1,
      porArea: {},
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
    it('delega al service', async () => {
      const result = await controller.findAll({});
      expect(result).toHaveProperty('items');
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findStats', () => {
    it('retorna stats del nuevo flujo', async () => {
      const result = await controller.findStats();
      expect(result.nuevos).toBe(2);
      expect(result.enCurso).toBe(1);
      expect(result.cerrados).toBe(3);
      expect(result.criticosActivos).toBe(1);
    });
  });

  describe('subcategorias', () => {
    it('delega al catálogo maestro', async () => {
      const result = await controller.subcategorias();
      expect(result).toHaveLength(1);
      expect(service.subcategorias).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('retorna detalle con actividades/adjuntos', async () => {
      const result = await controller.findOne(mockDetalle.reporte.id);
      expect(service.findOne).toHaveBeenCalledWith(mockDetalle.reporte.id);
      expect(result.reporte.usuario).toBe('Marcos G.');
      expect(result.actividades).toEqual([]);
    });
  });

  describe('create', () => {
    it('pasa la clase dto y userId', async () => {
      const dto = {
        tipo: 'PIPERO' as const,
        categoria: 'DIESEL' as const,
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
    it('pasa dto (EN_CURSO|CERRADO) y userId', async () => {
      const req = { user: { id: 'user-1' } };
      const dto = { estado: 'EN_CURSO' as const };
      const result = await controller.cambiarEstado(mockDetalle.reporte.id, dto, req as never);
      expect(result).toBeDefined();
      expect(service.cambiarEstado).toHaveBeenCalledWith(mockDetalle.reporte.id, dto, 'user-1');
    });
  });

  describe('asignar', () => {
    it('delega dto y userId al service', async () => {
      const req = { user: { id: 'user-1' } };
      const dto = { asignadoA: 'trab-uuid' };
      const result = await controller.asignar(mockDetalle.reporte.id, dto, req as never);
      expect(result).toBeDefined();
      expect(service.asignar).toHaveBeenCalledWith(mockDetalle.reporte.id, dto, 'user-1');
    });
  });

  describe('comentar', () => {
    it('pasa texto y userId al service', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.comentar(mockDetalle.reporte.id, { texto: 'avance' }, req as never);
      expect(result.id).toBe('act-1');
      expect(service.comentar).toHaveBeenCalledWith(mockDetalle.reporte.id, { texto: 'avance' }, 'user-1');
    });
  });

  describe('adjuntar', () => {
    it('pasa adjunto y userId al service', async () => {
      const req = { user: { id: 'user-1' } };
      const dto = { nombre: 'e.png', mime: 'image/png', tamano: 67, datos: 'AA' };
      const result = await controller.adjuntar(mockDetalle.reporte.id, dto, req as never);
      expect(result.id).toBe('adj-1');
      expect(service.adjuntar).toHaveBeenCalledWith(mockDetalle.reporte.id, dto, 'user-1');
    });
  });

  describe('update', () => {
    it('pasa dto y userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.update(
        mockDetalle.reporte.id,
        { descripcion: 'Corregido' },
        req as never,
      );
      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(mockDetalle.reporte.id, { descripcion: 'Corregido' }, 'user-1');
    });
  });

  describe('remove', () => {
    it('soft delete pasando userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.remove(mockDetalle.reporte.id, req as never);
      expect(result.message).toContain('eliminado');
      expect(service.remove).toHaveBeenCalledWith(mockDetalle.reporte.id, 'user-1');
    });
  });
});
