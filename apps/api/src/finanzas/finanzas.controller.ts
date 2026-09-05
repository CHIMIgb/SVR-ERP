import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { FinanzasService } from './finanzas.service';
import { CreateTransaccionDto } from './dto/create-transaccion.dto';
import { UpdateTransaccionDto } from './dto/update-transaccion.dto';
import { QueryTransaccionesDto } from './dto/query-transacciones.dto';

@Controller('finanzas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanzasController {
  constructor(private readonly finanzasService: FinanzasService) {}

  @Get()
  @RequirePermission('comercial', 'finanzas', 'ver')
  async findAll(@Query() query: QueryTransaccionesDto) {
    return this.finanzasService.findAll(query);
  }

  @Get('stats')
  @RequirePermission('comercial', 'finanzas', 'ver')
  async findStats() {
    return this.finanzasService.findStats();
  }

  @Get(':id')
  @RequirePermission('comercial', 'finanzas', 'ver')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.finanzasService.findOne(id);
  }

  @Post()
  @RequirePermission('comercial', 'finanzas', 'crear')
  async create(
    @Body() dto: CreateTransaccionDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.finanzasService.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermission('comercial', 'finanzas', 'editar')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransaccionDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.finanzasService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('comercial', 'finanzas', 'eliminar')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.finanzasService.remove(id, user.id);
  }
}
