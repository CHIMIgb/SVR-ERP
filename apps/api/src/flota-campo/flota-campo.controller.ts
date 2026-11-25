import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { FlotaCampoService } from './flota-campo.service';

/**
 * PWA del Técnico: "Flota y obras". Vive en su propio módulo plano (src/modules/ ya no recibe cosas nuevas)
 * pero conserva la ruta /maquinas/campo. Ojo si algún día se agrega GET /maquinas/:id en el controller de
 * máquinas: `campo` no debe quedar atrapado como un :id.
 *
 * Permiso propio, no maquinaria.flota:ver: el técnico solo ve lo de la pantalla (AGENTS.md: un endpoint nuevo
 * usa SU permiso). JwtAuthGuard ya revisa la blacklist del token. Es solo lectura y no tiene fallos de
 * negocio: no se audita (igual que GET /asistencia/mia y /asistencia/equipo); el 403 lo responde
 * PermissionsGuard.
 */
@Controller('maquinas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FlotaCampoController {
  constructor(private readonly flotaCampoService: FlotaCampoService) {}

  @RequirePermission('maquinaria', 'flota_campo', 'ver')
  @Get('campo')
  async findCampo() {
    return this.flotaCampoService.findCampo();
  }
}
