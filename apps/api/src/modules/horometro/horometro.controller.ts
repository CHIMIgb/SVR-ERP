import { Controller, Get, Post, Body, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { HorometroService } from './horometro.service';
import { CreateLecturaHorometroDto } from './dto/create-lectura-horometro.dto';
import { QueryLecturaHorometroDto } from './dto/query-lectura-horometro.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/guards/require-permission.decorator';

@Controller('lecturas-horometro')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HorometroController {
  constructor(private readonly horometroService: HorometroService) {}

  @RequirePermission('maquinaria', 'horometro', 'ver')
  @Get()
  async findAll(@Query() query: QueryLecturaHorometroDto) {
    return this.horometroService.findAll(query);
  }

  @RequirePermission('maquinaria', 'horometro', 'ver')
  @Get('stats')
  async findStats() {
    return this.horometroService.findStats();
  }

  @RequirePermission('maquinaria', 'horometro', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLecturaHorometroDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.horometroService.create(dto, user.id);
  }
}
