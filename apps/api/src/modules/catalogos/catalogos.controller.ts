import { Controller, Get, UseGuards } from '@nestjs/common';
import { CatalogosService } from './catalogos.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/guards/require-permission.decorator';

@Controller('catalogos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  @RequirePermission('operaciones', 'proyectos', 'ver')
  @Get('proyectos')
  async proyectos() {
    return this.catalogosService.proyectos();
  }
}
