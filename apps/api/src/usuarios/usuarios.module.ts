import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { EquiposController } from './equipos.controller';
import { UsuariosService } from './usuarios.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [UsuariosController, EquiposController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
