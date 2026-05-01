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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const users_service_1 = require("../users/users.service");
const hash_1 = require("../helpers/hash");
let AuthService = class AuthService {
    constructor(jwtService, usersService, configService) {
        this.jwtService = jwtService;
        this.usersService = usersService;
        this.configService = configService;
    }
    async auth(id, user) {
        const payload = { username: user.username, sub: id };
        const refreshSecret = this.configService.get('jwt.refreshSecret');
        const refreshTtl = this.configService.get('jwt.refreshTtl', '30d');
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('jwt.secret'),
            expiresIn: '15m',
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: refreshSecret,
            expiresIn: refreshTtl,
        });
        return { access_token: accessToken, refresh_token: refreshToken };
    }
    async validatePassword(username, password) {
        const user = await this.usersService.findByUsername(username);
        if (!user)
            return null;
        const ok = await (0, hash_1.checkHash)(password, user.password);
        if (!ok)
            return null;
        const { password: _p, ...result } = user;
        return result;
    }
    async refreshTokens(userId, refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('jwt.refreshSecret'),
            });
            if (payload.sub !== userId) {
                throw new common_1.UnauthorizedException('Invalid refresh token (sub mismatch)');
            }
            const newAccess = this.jwtService.sign({ username: payload.username, sub: payload.sub }, {
                secret: this.configService.get('jwt.secret'),
                expiresIn: '15m',
            });
            const newRefresh = this.jwtService.sign({ username: payload.username, sub: payload.sub }, {
                secret: this.configService.get('jwt.refreshSecret'),
                expiresIn: '30d',
            });
            return {
                access_token: newAccess,
                refresh_token: newRefresh,
            };
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        users_service_1.UsersService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map