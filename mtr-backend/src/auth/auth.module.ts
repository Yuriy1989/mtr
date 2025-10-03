import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategy/local.strategy';
import { AuthController } from './auth.controller';
import { JwtConfigFactory } from '../config/jwt-config.factory';
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy';
import { JwtRefreshGuard } from './guard/jwtRefresh.guard';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    JwtModule.registerAsync({
      useClass: JwtConfigFactory,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshGuard,
    JwtConfigFactory,
    JwtRefreshStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
