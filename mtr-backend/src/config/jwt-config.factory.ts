import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtOptionsFactory } from '@nestjs/jwt';
import { JwtModuleOptions } from '@nestjs/jwt/dist';

@Injectable()
export class JwtConfigFactory implements JwtOptionsFactory {
  constructor(private configService: ConfigService) {}
  createJwtOptions(): JwtModuleOptions | Promise<JwtModuleOptions> {
    const secret = this.configService.get<string>('jwt.secret');
    if (!secret) throw new Error('Missing jwt.secret');
    return {
      secret,
      signOptions: {
        expiresIn: this.configService.get<string>('jwt.ttl', '900s'),
      },
    };
  }
  createRefreshJwtOptions(): JwtModuleOptions {
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret) throw new Error('Missing jwt.refreshSecret');
    return {
      secret: refreshSecret,
      signOptions: {
        expiresIn: this.configService.get<string>('jwt.refreshTtl', '30d'),
      },
    };
  }
}
