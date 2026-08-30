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
import { BitacorasRentaService } from './bitacoras-renta.service';
import { CreateBitacoraRentaDto } from './dto/create-bitacora-renta.dto';
import { UpdateBitacoraRentaDto } from './dto/update-bitacora-renta.dto';
import { QueryBitacorasRentaDto } from './dto/query-bitacoras-renta.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('bitacoras-renta')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BitacorasRentaController {
  constructor(private readonly bitacorasRentaService: BitacorasRentaService) {}

  @RequirePermission('rrhh', 'trabajadores', 'ver')
  @Get()
  async findAll(@Query() query: QueryBitacorasRentaDto) {
    return this.bitacorasRentaService.findAll(query);
  }

  @RequirePermission('rrhh', 'trabajadores', 'ver')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bitacorasRentaService.findOne(id);
  }

  @RequirePermission('rrhh', 'trabajadores', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateBitacoraRentaDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.bitacorasRentaService.create(dto, user.id);
  }

  @RequirePermission('rrhh', 'trabajadores', 'editar')
  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBitacoraRentaDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.bitacorasRentaService.update(id, dto, user.id);
  }

  @RequirePermission('rrhh', 'trabajadores', 'eliminar')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.bitacorasRentaService.remove(id, user.id);
  }
}
