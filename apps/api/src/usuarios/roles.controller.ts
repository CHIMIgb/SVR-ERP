import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { RolesService } from './roles.service';
import { CrearRolDto } from './dto/crear-rol.dto';
import { ActualizarRolDto } from './dto/actualizar-rol.dto';
import { VistasRolDto } from './dto/vistas-rol.dto';
import { PermisosRolDto } from './dto/permisos-rol.dto';

/**
 * Endpoints de la vista /roles (Gestión de Identidad — catálogo de roles).
 * Ruta base: /api/roles. La ficha 360 de usuarios vive en /usuarios/:id/identidad.
 * El rol `es_sistema` (Administrador) es SOLO LECTURA en todo.
 */
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * GET /api/roles
   * Catálogo de roles con conteos (usuarios, vistas, permisos).
   * Permiso: sistema.roles.ver
   */
  @RequirePermission('sistema', 'roles', 'ver')
  @Get()
  findCatalogo() {
    return this.rolesService.findCatalogo();
  }

  /**
   * POST /api/roles
   * Crea un rol (nombre único).
   * Permiso: sistema.roles.crear
   */
  @RequirePermission('sistema', 'roles', 'crear')
  @Post()
  create(@Body() dto: CrearRolDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.rolesService.create(dto, user.id);
  }

  /**
   * PATCH /api/roles/:id
   * Edita nombre, descripción, nivel, torre o estado del rol.
   * Permiso: sistema.roles.editar
   */
  @RequirePermission('sistema', 'roles', 'editar')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: ActualizarRolDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.rolesService.update(id, dto, user.id);
  }

  /**
   * DELETE /api/roles/:id
   * Baja del rol (soft delete; no procede con usuarios asignados).
   * Permiso: sistema.roles.eliminar
   */
  @RequirePermission('sistema', 'roles', 'eliminar')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.rolesService.remove(id, user.id);
  }

  /**
   * GET /api/roles/:id/vistas
   * Todas las vistas con los flags del rol.
   * Permiso: sistema.permisos.ver
   */
  @RequirePermission('sistema', 'permisos', 'ver')
  @Get(':id/vistas')
  findVistas(@Param('id') id: string) {
    return this.rolesService.findVistas(id);
  }

  /**
   * PATCH /api/roles/:id/vistas
   * Upsert de los flags de vistas del rol.
   * Permiso: sistema.permisos.editar
   */
  @RequirePermission('sistema', 'permisos', 'editar')
  @Patch(':id/vistas')
  updateVistas(
    @Param('id') id: string,
    @Body() dto: VistasRolDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.rolesService.updateVistas(id, dto, user.id);
  }

  /**
   * GET /api/roles/:id/permisos
   * Matriz de permisos (modulo/recurso/acción) con asignado=true/false.
   * Permiso: sistema.permisos.ver
   */
  @RequirePermission('sistema', 'permisos', 'ver')
  @Get(':id/permisos')
  findPermisos(@Param('id') id: string) {
    return this.rolesService.findPermisos(id);
  }

  /**
   * PATCH /api/roles/:id/permisos
   * Agregar/quitar permisos del rol.
   * Permiso: sistema.permisos.editar
   */
  @RequirePermission('sistema', 'permisos', 'editar')
  @Patch(':id/permisos')
  updatePermisos(
    @Param('id') id: string,
    @Body() dto: PermisosRolDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.rolesService.updatePermisos(id, dto, user.id);
  }
}
