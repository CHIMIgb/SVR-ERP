import { Controller, Get, Post, Body, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { DespachosService } from './despachos.service';
import { CreateDespachoDto } from './dto/create-despacho.dto';
import { QueryDespachoDto } from './dto/query-despacho.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/guards/require-permission.decorator';

@Controller('despachos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DespachosController {
  constructor(private readonly despachosService: DespachosService) {}

  @RequirePermission('maquinaria', 'flota', 'ver')
  @Get()
  async findAll(@Query() query: QueryDespachoDto) {
    return this.despachosService.findAll(query);
  }

  @RequirePermission('maquinaria', 'flota', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDespachoDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.despachosService.create(dto, user.id);
  }
}
