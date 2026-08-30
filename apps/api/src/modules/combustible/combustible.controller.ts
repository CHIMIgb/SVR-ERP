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
import { CombustibleService } from './combustible.service';
import { CreateCargaCombustibleDto } from './dto/create-carga-combustible.dto';
import { UpdateCargaCombustibleDto } from './dto/update-carga-combustible.dto';
import { QueryCargaCombustibleDto } from './dto/query-carga-combustible.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/guards/require-permission.decorator';

@Controller('combustible')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CombustibleController {
  constructor(private readonly combustibleService: CombustibleService) {}

  @RequirePermission('maquinaria', 'combustible', 'ver')
  @Get()
  async findAll(@Query() query: QueryCargaCombustibleDto) {
    return this.combustibleService.findAll(query);
  }

  @RequirePermission('maquinaria', 'combustible', 'ver')
  @Get('stats')
  async findStats() {
    return this.combustibleService.findStats();
  }

  @RequirePermission('maquinaria', 'combustible', 'ver')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.combustibleService.findOne(id);
  }

  @RequirePermission('maquinaria', 'combustible', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCargaCombustibleDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.combustibleService.create(dto, user.id);
  }

  @RequirePermission('maquinaria', 'combustible', 'editar')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCargaCombustibleDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.combustibleService.update(id, dto, user.id);
  }

  @RequirePermission('maquinaria', 'combustible', 'eliminar')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.combustibleService.remove(id, user.id);
  }
}
