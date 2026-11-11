import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IntentosLoginService } from './intentos-login.service';
import { PinController } from './pin/pin.controller';
import { PinService } from './pin/pin.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { BloqueoModule } from '../bloqueo/bloqueo.module';
import { AuditModule } from '../audit/audit.module';

const ACCESS_TOKEN_EXPIRY_SECONDS = parseInt(
  process.env.ACCESS_TOKEN_EXPIRY_SECONDS || '900',
  10,
);

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS },
    }),
    BloqueoModule,
    AuditModule,
  ],
  controllers: [AuthController, PinController],
  providers: [
    AuthService,
    IntentosLoginService,
    PinService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthService, IntentosLoginService, JwtModule],
})
export class AuthModule {}
