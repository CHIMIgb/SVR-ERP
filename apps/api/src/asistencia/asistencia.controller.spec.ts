import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSION_KEY } from '../auth/guards/require-permission.decorator';
import { AsistenciaController } from './asistencia.controller';
import { AsistenciaService } from './asistencia.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AsistenciaController', () => {
  let controller: AsistenciaController;
  let service: AsistenciaService;

  const mockRegistro = { id: 'reg-uuid-1', trabajadorId: 'trab-uuid-1', estado: 'Puntual' };
  const mockRequest = { user: { id: 'user-1' } } as never;

  const mockService = {
    findAll: jest.fn().mockResolvedValue({ items: [mockRegistro], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } }),
    findSemanal: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(mockRegistro),
    marcarEntrada: jest.fn().mockResolvedValue(mockRegistro),
    marcarSalida: jest.fn().mockResolvedValue(mockRegistro),
    marcarCuadrilla: jest.fn().mockResolvedValue({ creados: [mockRegistro], omitidos: [] }),
    registrarFalta: jest.fn().mockResolvedValue(mockRegistro),
    actualizarEstado: jest.fn().mockResolvedValue(mockRegistro),
    registrarHorasExtra: jest.fn().mockResolvedValue(mockRegistro),
    aprobarHorasExtra: jest.fn().mockResolvedValue(mockRegistro),
    rechazarHorasExtra: jest.fn().mockResolvedValue(mockRegistro),
    resolverOmision: jest.fn().mockResolvedValue(mockRegistro),
    resolverOmisionSinMarcaje: jest.fn().mockResolvedValue(mockRegistro),
    registrarUbicacionObra: jest.fn().mockResolvedValue({ id: 'obra-1' }),
    findMia: jest.fn().mockResolvedValue({ registroHoy: null }),
    marcarEntradaPropia: jest.fn().mockResolvedValue(mockRegistro),
    marcarSalidaPropia: jest.fn().mockResolvedValue(mockRegistro),
    findEquipo: jest.fn().mockResolvedValue({ miembros: [] }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsistenciaController],
      providers: [
        { provide: AsistenciaService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(AsistenciaController);
    service = module.get(AsistenciaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll delegates to service', async () => {
    await controller.findAll({});
    expect(service.findAll).toHaveBeenCalledWith({});
  });

  it('findSemanal delegates to service', async () => {
    await controller.findSemanal({});
    expect(service.findSemanal).toHaveBeenCalledWith({});
  });

  it('findOne delegates to service', async () => {
    await controller.findOne('reg-uuid-1');
    expect(service.findOne).toHaveBeenCalledWith('reg-uuid-1');
  });

  it('marcarEntrada passes the userId from the JWT request', async () => {
    const dto = { trabajadorId: 'trab-uuid-1' } as never;
    await controller.marcarEntrada(dto, mockRequest);
    expect(service.marcarEntrada).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('marcarSalida passes the userId from the JWT request', async () => {
    const dto = { trabajadorId: 'trab-uuid-1' } as never;
    await controller.marcarSalida(dto, mockRequest);
    expect(service.marcarSalida).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('marcarCuadrilla passes the userId from the JWT request', async () => {
    const dto = { trabajadorIds: ['trab-uuid-1'] } as never;
    await controller.marcarCuadrilla(dto, mockRequest);
    expect(service.marcarCuadrilla).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('registrarFalta passes the userId from the JWT request', async () => {
    const dto = { trabajadorId: 'trab-uuid-1' } as never;
    await controller.registrarFalta(dto, mockRequest);
    expect(service.registrarFalta).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('actualizarEstado passes the userId from the JWT request', async () => {
    const dto = { estado: 'Justificado' } as never;
    await controller.actualizarEstado('reg-uuid-1', dto, mockRequest);
    expect(service.actualizarEstado).toHaveBeenCalledWith('reg-uuid-1', dto, 'user-1');
  });

  it('registrarHorasExtra passes the userId from the JWT request', async () => {
    const dto = { inicio: '17:00', horasCalculadas: 3 } as never;
    await controller.registrarHorasExtra('reg-uuid-1', dto, mockRequest);
    expect(service.registrarHorasExtra).toHaveBeenCalledWith('reg-uuid-1', dto, 'user-1');
  });

  it('aprobarHorasExtra passes the userId from the JWT request', async () => {
    await controller.aprobarHorasExtra('he-uuid-1', mockRequest);
    expect(service.aprobarHorasExtra).toHaveBeenCalledWith('he-uuid-1', 'user-1');
  });

  it('rechazarHorasExtra passes the userId from the JWT request', async () => {
    await controller.rechazarHorasExtra('he-uuid-1', mockRequest);
    expect(service.rechazarHorasExtra).toHaveBeenCalledWith('he-uuid-1', 'user-1');
  });

  it('resolverOmision passes the userId from the JWT request', async () => {
    const dto = { resolucion: 'Falta' as const, motivo: 'Sin aviso' };
    await controller.resolverOmision('reg-1', dto, mockRequest);
    expect(service.resolverOmision).toHaveBeenCalledWith('reg-1', dto, 'user-1');
  });

  it('resolverOmisionSinMarcaje passes the userId from the JWT request', async () => {
    const dto = { trabajadorId: 'trab-1', resolucion: 'Retardo' as const, motivo: 'Olvidó checar' };
    await controller.resolverOmisionSinMarcaje(dto, mockRequest);
    expect(service.resolverOmisionSinMarcaje).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('registrarUbicacionObra passes the userId from the JWT request', async () => {
    const dto = { lat: 19.4, lng: -99.1, radioPermitidoMetros: 150 };
    await controller.registrarUbicacionObra('obra-1', dto, mockRequest);
    expect(service.registrarUbicacionObra).toHaveBeenCalledWith('obra-1', dto, 'user-1');
  });

  it('resolving omisiones and registering the obra location need rrhh.asistencia.editar (not just crear)', () => {
    const reflector = new Reflector();
    for (const m of ['resolverOmision', 'resolverOmisionSinMarcaje', 'registrarUbicacionObra'] as const) {
      expect(reflector.get(REQUIRE_PERMISSION_KEY, AsistenciaController.prototype[m])).toEqual({
        modulo: 'rrhh',
        recurso: 'asistencia',
        accion: 'editar',
      });
    }
  });

  describe('asistencia propia y del equipo (PWA)', () => {
    it('findMia toma al usuario del JWT, no de la petición', async () => {
      await controller.findMia(mockRequest);
      expect(service.findMia).toHaveBeenCalledWith('user-1');
    });

    it('marcarEntradaPropia pasa el dto y el userId del JWT', async () => {
      const dto = { obraId: 'obra-1', lat: 19.4, lng: -99.1, dispositivo: 'Móvil' };
      await controller.marcarEntradaPropia(dto, mockRequest);
      expect(service.marcarEntradaPropia).toHaveBeenCalledWith(dto, 'user-1');
    });

    it('marcarSalidaPropia pasa el dto y el userId del JWT', async () => {
      const dto = { lat: 19.4, lng: -99.1, dispositivo: 'Móvil' };
      await controller.marcarSalidaPropia(dto, mockRequest);
      expect(service.marcarSalidaPropia).toHaveBeenCalledWith(dto, 'user-1');
    });

    it('findEquipo pasa el userId del JWT y la consulta', async () => {
      await controller.findEquipo({ fecha: '2026-11-17' }, mockRequest);
      expect(service.findEquipo).toHaveBeenCalledWith('user-1', { fecha: '2026-11-17' });
    });

    it('usan los permisos propios, no los de RRHH que abren a todos los trabajadores', () => {
      const reflector = new Reflector();
      const permiso = (m: keyof AsistenciaController) => reflector.get(REQUIRE_PERMISSION_KEY, AsistenciaController.prototype[m]);
      expect(permiso('findMia')).toEqual({ modulo: 'rrhh', recurso: 'mi_asistencia', accion: 'ver' });
      expect(permiso('marcarEntradaPropia')).toEqual({ modulo: 'rrhh', recurso: 'mi_asistencia', accion: 'crear' });
      expect(permiso('marcarSalidaPropia')).toEqual({ modulo: 'rrhh', recurso: 'mi_asistencia', accion: 'crear' });
      expect(permiso('findEquipo')).toEqual({ modulo: 'rrhh', recurso: 'mi_equipo', accion: 'ver' });
    });
  });
});
