import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { MantenimientoService } from './mantenimiento.service';
import { CreateMantenimientoDto } from './dto/create-mantenimiento.dto';
import { UpdateMantenimientoDto } from './dto/update-mantenimiento.dto';
import { QueryMantenimientoDto } from './dto/query-mantenimiento.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/guards/require-permission.decorator';

@Controller('mantenimiento')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MantenimientoController {
  constructor(private readonly mantenimientoService: MantenimientoService) {}

  @RequirePermission('maquinaria', 'mantenimiento', 'ver')
  @Get()
  async findAll(@Query() query: QueryMantenimientoDto) {
    return this.mantenimientoService.findAll(query);
  }

  @RequirePermission('maquinaria', 'mantenimiento', 'ver')
  @Get('stats')
  async findStats() {
    return this.mantenimientoService.findStats();
  }

  @RequirePermission('maquinaria', 'mantenimiento', 'ver')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mantenimientoService.findOne(id);
  }

  @RequirePermission('maquinaria', 'mantenimiento', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMantenimientoDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.mantenimientoService.create(dto, user.id);
  }

  @RequirePermission('maquinaria', 'mantenimiento', 'editar')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMantenimientoDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.mantenimientoService.update(id, dto, user.id);
  }

  @RequirePermission('maquinaria', 'mantenimiento', 'eliminar')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.mantenimientoService.remove(id, user.id);
  }
}
