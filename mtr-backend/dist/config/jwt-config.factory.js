"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtConfigFactory = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let JwtConfigFactory = class JwtConfigFactory {
    constructor(configService) {
        this.configService = configService;
    }
    createJwtOptions() {
        const secret = this.configService.get('jwt.secret');
        if (!secret)
            throw new Error('Missing jwt.secret');
        return {
            secret,
            signOptions: {
                expiresIn: this.configService.get('jwt.ttl', '900s'),
            },
        };
    }
    createRefreshJwtOptions() {
        const refreshSecret = this.configService.get('jwt.refreshSecret');
        if (!refreshSecret)
            throw new Error('Missing jwt.refreshSecret');
        return {
            secret: refreshSecret,
            signOptions: {
                expiresIn: this.configService.get('jwt.refreshTtl', '30d'),
            },
        };
    }
};
exports.JwtConfigFactory = JwtConfigFactory;
exports.JwtConfigFactory = JwtConfigFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], JwtConfigFactory);
//# sourceMappingURL=jwt-config.factory.js.map