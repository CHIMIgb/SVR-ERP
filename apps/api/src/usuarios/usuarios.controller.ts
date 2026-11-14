import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AsignarRolDto } from './dto/asignar-rol.dto';
import { QueryUsuariosDto } from './dto/query-usuarios.dto';

/**
 * Endpoints de la vista /usuarios (CRUD de usuarios de escritorio).
 * Ruta base: /api/usuarios — acceso exclusivo del módulo sistema.
 */
@Controller('usuarios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * GET /api/usuarios
   * Listado paginado con búsqueda y filtros (rol, estado).
   * Permiso: sistema.usuarios.ver
   */
  @RequirePermission('sistema', 'usuarios', 'ver')
  @Get()
  findAll(@Query() query: QueryUsuariosDto) {
    return this.usuariosService.findAll(query);
  }

  /**
   * GET /api/usuarios/stats
   * Métricas para las tarjetas de la vista.
   * Permiso: sistema.usuarios.ver
   */
  @RequirePermission('sistema', 'usuarios', 'ver')
  @Get('stats')
  findStats() {
    return this.usuariosService.findStats();
  }

  /**
   * GET /api/usuarios/catalogos
   * Roles asignables y personas sin cuenta de acceso (para los selects).
   * Va antes de `:id` para que Nest no lo trate como id.
   * Permiso: sistema.usuarios.ver
   */
  @RequirePermission('sistema', 'usuarios', 'ver')
  @Get('catalogos')
  findCatalogos() {
    return this.usuariosService.findCatalogos();
  }

  /**
   * POST /api/usuarios
   * Crea persona (o la reutiliza) + user con email/contraseña + rol principal.
   * Permiso: sistema.usuarios.crear
   */
  @RequirePermission('sistema', 'usuarios', 'crear')
  @Post()
  create(@Body() dto: CreateUsuarioDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.usuariosService.create(dto, user.id);
  }

  /**
   * PATCH /api/usuarios/:id
   * Edita email, estado activo y área (torre).
   * Permiso: sistema.usuarios.editar
   */
  @RequirePermission('sistema', 'usuarios', 'editar')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.usuariosService.update(id, dto, user.id);
  }

  /**
   * DELETE /api/usuarios/:id
   * Baja de usuario (soft delete + cierre de sesiones).
   * Permiso: sistema.usuarios.eliminar
   */
  @RequirePermission('sistema', 'usuarios', 'eliminar')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.usuariosService.remove(id, user.id);
  }

  /**
   * POST /api/usuarios/:id/roles
   * Asigna un rol (opcionalmente como principal).
   * Permiso: sistema.usuarios.asignar_rol
   */
  @RequirePermission('sistema', 'usuarios', 'asignar_rol')
  @Post(':id/roles')
  asignarRol(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AsignarRolDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.usuariosService.asignarRol(id, dto, user.id);
  }

  /**
   * DELETE /api/usuarios/:id/roles/:rolId
   * Revoca un rol activo.
   * Permiso: sistema.usuarios.asignar_rol
   */
  @RequirePermission('sistema', 'usuarios', 'asignar_rol')
  @Delete(':id/roles/:rolId')
  revocarRol(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('rolId', ParseUUIDPipe) rolId: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.usuariosService.revocarRol(id, rolId, user.id);
  }
}
