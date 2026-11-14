import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { UsuariosService } from './usuarios.service';

/**
 * Endpoints de la vista /equipos (P11: residentes ↔ sus empleados).
 * Ruta base: /api/equipos — la escritura vive en PATCH /usuarios/:id/jefe.
 */
@Controller('equipos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EquiposController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * GET /api/equipos
   * Jefes (rol Residente o con subordinados) con su equipo + candidatos sin jefe.
   * Permiso: sistema.usuarios.ver
   */
  @RequirePermission('sistema', 'usuarios', 'ver')
  @Get()
  findEquipos() {
    return this.usuariosService.findEquipos();
  }
}
