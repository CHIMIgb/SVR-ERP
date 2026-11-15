import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { EquiposController } from './equipos.controller';
import { RolesController } from './roles.controller';
import { UsuariosService } from './usuarios.service';
import { RolesService } from './roles.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [UsuariosController, EquiposController, RolesController],
  providers: [UsuariosService, RolesService],
  exports: [UsuariosService, RolesService],
})
export class UsuariosModule {}
