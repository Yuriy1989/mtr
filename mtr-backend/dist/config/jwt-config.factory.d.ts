import { ConfigService } from '@nestjs/config';
import { JwtOptionsFactory } from '@nestjs/jwt';
import { JwtModuleOptions } from '@nestjs/jwt/dist';
export declare class JwtConfigFactory implements JwtOptionsFactory {
    private configService;
    constructor(configService: ConfigService);
    createJwtOptions(): JwtModuleOptions | Promise<JwtModuleOptions>;
    createRefreshJwtOptions(): JwtModuleOptions;
}
