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
import { TrabajadoresService } from './trabajadores.service';
import { CreateTrabajadorDto } from './dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from './dto/update-trabajador.dto';
import { QueryTrabajadoresDto } from './dto/query-trabajadores.dto';
import { LiquidarTrabajadorDto } from './dto/liquidar-trabajador.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('trabajadores')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TrabajadoresController {
  constructor(private readonly trabajadoresService: TrabajadoresService) {}

  @RequirePermission('rrhh', 'trabajadores', 'ver')
  @Get()
  async findAll(@Query() query: QueryTrabajadoresDto) {
    return this.trabajadoresService.findAll(query);
  }

  @RequirePermission('rrhh', 'trabajadores', 'ver')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.trabajadoresService.findOne(id);
  }

  @RequirePermission('rrhh', 'trabajadores', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTrabajadorDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.trabajadoresService.create(dto, user.id);
  }

  @RequirePermission('rrhh', 'trabajadores', 'editar')
  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTrabajadorDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.trabajadoresService.update(id, dto, user.id);
  }

  @RequirePermission('rrhh', 'trabajadores', 'eliminar')
  @Post(':id/liquidar')
  @HttpCode(HttpStatus.OK)
  async liquidar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: LiquidarTrabajadorDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.trabajadoresService.liquidar(id, dto, user.id);
  }

  @RequirePermission('rrhh', 'trabajadores', 'eliminar')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.trabajadoresService.remove(id, user.id);
  }
}
