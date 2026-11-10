import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { HorometroController } from './horometro.controller';
import { HorometroService } from './horometro.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { REQUIRE_PERMISSION_KEY } from '../../auth/guards/require-permission.decorator';

describe('HorometroController', () => {
  let controller: HorometroController;

  const lectura = {
    id: 'l1', maquinaId: 'M001', maquinaNombre: 'Excavadora', fecha: '2026-11-05',
    lecturaInicial: 100, lecturaFinal: 108, horasTrabajadas: 8, operador: null,
  };
  const mockService = {
    findAll: jest.fn().mockResolvedValue({ items: [lectura], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } }),
    findStats: jest.fn().mockResolvedValue({ horasHoy: 8 }),
    create: jest.fn().mockResolvedValue(lectura),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HorometroController],
      providers: [{ provide: HorometroService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .compile();
    controller = module.get(HorometroController);
  });

  it('protege todo el controller con JWT y permisos', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, HorometroController);
    expect(guards).toEqual([JwtAuthGuard, PermissionsGuard]);
  });

  it.each([
    ['findAll', 'ver'],
    ['findStats', 'ver'],
    ['create', 'crear'],
  ] as const)('%s pide maquinaria.horometro.%s', (metodo, accion) => {
    const permiso = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, HorometroController.prototype[metodo]);
    expect(permiso).toEqual({ modulo: 'maquinaria', recurso: 'horometro', accion });
  });

  it('lista paginado pasando los filtros', async () => {
    const query = { maquinaId: 'M001', page: 2, limit: 20 };
    await expect(controller.findAll(query)).resolves.toHaveProperty('pagination');
    expect(mockService.findAll).toHaveBeenCalledWith(query);
  });

  it('devuelve los indicadores', async () => {
    await expect(controller.findStats()).resolves.toEqual({ horasHoy: 8 });
  });

  it('registra la lectura con el usuario del token', async () => {
    const dto = { maquinaId: 'M001', fecha: '2026-11-05', lecturaInicial: 100, lecturaFinal: 108 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await controller.create(dto, { user: { id: 'user-1' } } as any);
    expect(mockService.create).toHaveBeenCalledWith(dto, 'user-1');
  });
});
