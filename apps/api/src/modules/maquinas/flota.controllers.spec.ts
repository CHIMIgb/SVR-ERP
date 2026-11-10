import { GUARDS_METADATA } from '@nestjs/common/constants';
import { MaquinasController } from './maquinas.controller';
import { MaquinasService } from './maquinas.service';
import { DespachosController } from '../despachos/despachos.controller';
import { DespachosService } from '../despachos/despachos.service';
import { ChecklistsController } from '../checklists/checklists.controller';
import { ChecklistsService } from '../checklists/checklists.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { REQUIRE_PERMISSION_KEY } from '../../auth/guards/require-permission.decorator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = { user: { id: 'user-1' } } as any;

describe('Controllers de Flota', () => {
  it.each([MaquinasController, DespachosController, ChecklistsController])('%p exige JWT y permisos', (Controller) => {
    expect(Reflect.getMetadata(GUARDS_METADATA, Controller)).toEqual([JwtAuthGuard, PermissionsGuard]);
  });

  it.each([
    [MaquinasController, 'findAll', 'ver'],
    [MaquinasController, 'create', 'crear'],
    [DespachosController, 'findAll', 'ver'],
    [DespachosController, 'create', 'crear'],
    [ChecklistsController, 'findAll', 'ver'],
    [ChecklistsController, 'create', 'crear'],
  ] as const)('%p.%s pide maquinaria.flota.%s', (Controller, metodo, accion) => {
    const permiso = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, (Controller.prototype as unknown as Record<string, () => void>)[metodo]);
    expect(permiso).toEqual({ modulo: 'maquinaria', recurso: 'flota', accion });
  });

  it('el alta de máquina pasa el usuario del token', async () => {
    const service = { create: jest.fn().mockResolvedValue({ id: 'M005' }) } as unknown as MaquinasService;
    const dto = { id: 'M005', tipo: 'Grúa', nombre: 'Grúa', combustible: 50, consumoEsperado: 10 };
    await new MaquinasController(service).create(dto, req);
    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('el despacho lista con filtros y crea con el usuario del token', async () => {
    const service = {
      findAll: jest.fn().mockResolvedValue({ items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
      create: jest.fn().mockResolvedValue({ id: 'D1' }),
    } as unknown as DespachosService;
    const controller = new DespachosController(service);
    const query = { desde: '2026-11-02', hasta: '2026-11-15', limit: 100 };
    await controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query);
    const dto = { maquinaId: 'M001', proyectoId: 'P001', fechaInicio: '2026-11-05', fechaFin: '2026-11-06' };
    await controller.create(dto, req);
    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('el checklist lista con filtros y crea con el usuario del token', async () => {
    const service = {
      findAll: jest.fn().mockResolvedValue({ items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
      create: jest.fn().mockResolvedValue({ id: 'C1' }),
    } as unknown as ChecklistsService;
    const controller = new ChecklistsController(service);
    await controller.findAll({ estado: 'Con Falla', page: 2 });
    expect(service.findAll).toHaveBeenCalledWith({ estado: 'Con Falla', page: 2 });
    const dto = {
      maquinaId: 'M001', operador: 'Ana', horometroInicial: 1, nivelAceiteMotor: 'Correcto', nivelHidraulico: 'Correcto',
      fugasVisibles: false, estadoLlantasOrugas: 'Correcto', lucesYAlarmas: 'Correcto', sistemaFrenos: 'Correcto', observaciones: '',
    } as const;
    await controller.create(dto, req);
    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });
});
