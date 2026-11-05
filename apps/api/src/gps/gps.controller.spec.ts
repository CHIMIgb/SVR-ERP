import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { GpsController } from './gps.controller';
import { GpsService } from './gps.service';
import { PrismaService } from '../prisma/prisma.service';
import { REQUIRE_PERMISSION_KEY } from '../auth/guards/require-permission.decorator';

describe('GpsController', () => {
  let controller: GpsController;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let service: any;
  let reflector: Reflector;

  const req = { user: { id: 'user-1' } } as never;

  beforeEach(async () => {
    service = {
      findMaquinasEnVivo: jest.fn().mockResolvedValue([{ id: 'M001' }]),
      findHistorialMaquina: jest.fn().mockResolvedValue({ puntos: [], eventos: [] }),
      findAllGeocercas: jest.fn().mockResolvedValue({ items: [], pagination: {} }),
      findOneGeocerca: jest.fn().mockResolvedValue({ id: 'g1' }),
      createGeocerca: jest.fn().mockResolvedValue({ id: 'g1' }),
      updateGeocerca: jest.fn().mockResolvedValue({ id: 'g1' }),
      removeGeocerca: jest.fn().mockResolvedValue({ message: 'ok' }),
      simularMovimiento: jest.fn().mockResolvedValue({ maquinasActualizadas: 3 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GpsController],
      providers: [
        { provide: GpsService, useValue: service },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(GpsController);
    reflector = new Reflector();
  });

  it('GET /gps/maquinas delega en el servicio', async () => {
    await expect(controller.findMaquinasEnVivo()).resolves.toEqual([{ id: 'M001' }]);
    expect(service.findMaquinasEnVivo).toHaveBeenCalled();
  });

  it('GET historial pasa el id y los filtros', async () => {
    await controller.findHistorial('M001', { limit: 50 });
    expect(service.findHistorialMaquina).toHaveBeenCalledWith('M001', { limit: 50 });
  });

  it('GET geocercas pasa el query', async () => {
    await controller.findAllGeocercas({ page: 2 });
    expect(service.findAllGeocercas).toHaveBeenCalledWith({ page: 2 });
  });

  it('GET geocerca por id delega', async () => {
    await controller.findOneGeocerca('g1');
    expect(service.findOneGeocerca).toHaveBeenCalledWith('g1');
  });

  it('POST geocerca pasa el userId del token', async () => {
    const dto = { nombre: 'Obra', tipo: 'OBRA' as const, centroLat: 19, centroLng: -99, radioMetros: 100 };
    await controller.createGeocerca(dto, req);
    expect(service.createGeocerca).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('PATCH geocerca pasa id, dto y userId', async () => {
    await controller.updateGeocerca('g1', { radioMetros: 500 }, req);
    expect(service.updateGeocerca).toHaveBeenCalledWith('g1', { radioMetros: 500 }, 'user-1');
  });

  it('DELETE geocerca pasa id y userId', async () => {
    await controller.removeGeocerca('g1', req);
    expect(service.removeGeocerca).toHaveBeenCalledWith('g1', 'user-1');
  });

  it('POST simular pasa el userId', async () => {
    await controller.simular(req);
    expect(service.simularMovimiento).toHaveBeenCalledWith('user-1');
  });

  describe('RBAC declarado en cada endpoint', () => {
    const permisoDe = (metodo: keyof GpsController) =>
      reflector.get(REQUIRE_PERMISSION_KEY, GpsController.prototype[metodo]);

    it('las lecturas exigen maquinaria.gps.ver', () => {
      for (const m of ['findMaquinasEnVivo', 'findHistorial', 'findAllGeocercas', 'findOneGeocerca'] as const) {
        expect(permisoDe(m)).toEqual({ modulo: 'maquinaria', recurso: 'gps', accion: 'ver' });
      }
    });

    it('toda mutación exige maquinaria.gps.editar (no ver)', () => {
      for (const m of ['createGeocerca', 'updateGeocerca', 'removeGeocerca', 'simular'] as const) {
        expect(permisoDe(m)).toEqual({ modulo: 'maquinaria', recurso: 'gps', accion: 'editar' });
      }
    });
  });
});
