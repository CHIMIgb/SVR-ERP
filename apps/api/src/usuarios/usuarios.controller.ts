import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { CambiarRolDto } from './dto/cambiar-rol.dto';
import { EstadoUsuarioDto } from './dto/estado-usuario.dto';
import { AsignarJefeDto } from './dto/asignar-jefe.dto';
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
    @Param('id') id: string,
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
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.usuariosService.remove(id, user.id);
  }

  /**
   * PATCH /api/usuarios/:id/estado
   * Activar / desactivar cuenta (acción propia del botón, audita el campo).
   * Al desactivar se cierran sus sesiones activas.
   * Permiso: sistema.usuarios.editar
   */
  @RequirePermission('sistema', 'usuarios', 'editar')
  @Patch(':id/estado')
  cambiarEstado(
    @Param('id') id: string,
    @Body() dto: EstadoUsuarioDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.usuariosService.cambiarEstado(id, dto, user.id);
  }

  /**
   * PATCH /api/usuarios/:id/rol
   * Cambia el ROL ÚNICO del usuario (mono-rol, decisión del cliente).
   * Audita ROL_ASIGNADO con metadata del rol anterior y el nuevo.
   * Permiso: sistema.usuarios.asignar_rol
   */
  @RequirePermission('sistema', 'usuarios', 'asignar_rol')
  @Patch(':id/rol')
  cambiarRol(
    @Param('id') id: string,
    @Body() dto: CambiarRolDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.usuariosService.cambiarRol(id, dto, user.id);
  }
}
