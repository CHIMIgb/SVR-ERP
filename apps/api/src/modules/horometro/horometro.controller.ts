import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { HorometroService } from './horometro.service';
import { CreateLecturaHorometroDto } from './dto/create-lectura-horometro.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/guards/require-permission.decorator';

@Controller('lecturas-horometro')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HorometroController {
  constructor(private readonly horometroService: HorometroService) {}

  @RequirePermission('maquinaria', 'horometro', 'ver')
  @Get()
  async findAll() {
    return this.horometroService.findAll();
  }

  @RequirePermission('maquinaria', 'horometro', 'crear')
  @Post()
  async create(@Body() dto: CreateLecturaHorometroDto) {
    return this.horometroService.create(dto);
  }
}
