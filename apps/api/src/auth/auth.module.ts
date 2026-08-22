import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IntentosLoginService } from './intentos-login.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { BloqueoModule } from '../bloqueo/bloqueo.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'svr-erp-access-secret-dev',
      signOptions: { expiresIn: '15m' },
    }),
    BloqueoModule,
    AuditModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    IntentosLoginService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthService, IntentosLoginService, JwtModule],
})
export class AuthModule {}
