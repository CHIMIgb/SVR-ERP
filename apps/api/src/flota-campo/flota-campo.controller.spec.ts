import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { REQUIRE_PERMISSION_KEY } from '../auth/guards/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { FlotaCampoController } from './flota-campo.controller';
import { FlotaCampoService } from './flota-campo.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FlotaCampoController', () => {
  let controller: FlotaCampoController;
  const mockService = { findCampo: jest.fn().mockResolvedValue({ fecha: '2026-11-24', truncado: false, maquinas: [] }) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlotaCampoController],
      providers: [
        { provide: FlotaCampoService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();
    controller = module.get(FlotaCampoController);
  });

  afterEach(() => jest.clearAllMocks());

  it('findCampo devuelve lo del servicio', async () => {
    await expect(controller.findCampo()).resolves.toEqual({ fecha: '2026-11-24', truncado: false, maquinas: [] });
    expect(mockService.findCampo).toHaveBeenCalledTimes(1);
  });

  it('usa su permiso propio, no maquinaria.flota:ver (que abre toda la API de flota)', () => {
    const permiso = new Reflector().get(REQUIRE_PERMISSION_KEY, FlotaCampoController.prototype.findCampo);
    expect(permiso).toEqual({ modulo: 'maquinaria', recurso: 'flota_campo', accion: 'ver' });
  });

  it('pasa por JwtAuthGuard (incluye la blacklist del token) y PermissionsGuard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, FlotaCampoController);
    expect(guards).toEqual([JwtAuthGuard, PermissionsGuard]);
  });
});
