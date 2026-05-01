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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const auth_service_1 = require("./auth.service");
const local_guard_1 = require("./guard/local.guard");
const jwtAuth_guard_1 = require("./guard/jwtAuth.guard");
const create_user_dto_1 = require("../users/dto/create-user.dto");
const signin_dto_1 = require("./dto/signin.dto");
const jwtRefresh_guard_1 = require("./guard/jwtRefresh.guard");
const ad_signin_dto_1 = require("./dto/ad-signin.dto");
const ad_auth_service_1 = require("./ad-auth.service");
const ad_settings_dto_1 = require("./dto/ad-settings.dto");
const import_ad_user_dto_1 = require("./dto/import-ad-user.dto");
let AuthController = class AuthController {
    constructor(usersService, authService, adAuthService) {
        this.usersService = usersService;
        this.authService = authService;
        this.adAuthService = adAuthService;
    }
    async signin(req, res, dto) {
        const userId = req.user?.id ?? req.user?._id ?? req.user?.userId;
        if (!userId)
            throw new common_1.UnauthorizedException('Не удалось определить id пользователя');
        const { access_token, refresh_token } = await this.authService.auth(userId, req.user);
        this.setRefreshCookie(res, refresh_token);
        return { access_token, user: req.user };
    }
    async signinAd(res, dto) {
        await this.adAuthService.validateCredentials(dto.username, dto.password);
        const username = this.adAuthService.normalizeUsername(dto.username);
        const user = await this.usersService.findByUsername(username);
        if (!user) {
            throw new common_1.UnauthorizedException('Пользователь AD найден, но не заведён в локальной базе приложения');
        }
        const { password, ...userWithoutPassword } = user;
        const { access_token, refresh_token } = await this.authService.auth(user.id, user);
        this.setRefreshCookie(res, refresh_token);
        return { access_token, user: userWithoutPassword };
    }
    getAdSettings(req) {
        this.ensureAdmin(req.user);
        return this.adAuthService.getPublicSettings();
    }
    updateAdSettings(req, dto) {
        this.ensureAdmin(req.user);
        return this.adAuthService.updateSettings(dto);
    }
    getAdUsers(req, search) {
        this.ensureAdmin(req.user);
        return this.adAuthService.findDomainUsers(search);
    }
    async importAdUser(req, dto) {
        this.ensureAdmin(req.user);
        const user = await this.usersService.upsertAdUser(dto);
        return {
            success: true,
            data: user,
        };
    }
    async signup(createUserDto) {
        const user = await this.usersService.create(createUserDto);
        return user;
    }
    me(req) {
        return { user: req.user };
    }
    async refreshToken(req, res) {
        const userId = req.user?.id ?? req.user?._id ?? req.user?.userId;
        if (!userId)
            throw new common_1.UnauthorizedException('User not authenticated');
        const rt = req.cookies?.['refreshToken'];
        if (!rt)
            throw new common_1.UnauthorizedException('No refresh token found');
        const { access_token, refresh_token } = await this.authService.refreshTokens(userId, rt);
        this.setRefreshCookie(res, refresh_token);
        return { access_token };
    }
    setRefreshCookie(res, refreshToken) {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
    }
    ensureAdmin(user) {
        if (!user?.roles?.map(Number).includes(100)) {
            throw new common_1.UnauthorizedException('Недостаточно прав');
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.UseGuards)(local_guard_1.LocalGuard),
    (0, common_1.Post)('signin'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, signin_dto_1.SigninToketDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signin", null);
__decorate([
    (0, common_1.Post)('signin/ad'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ad_signin_dto_1.AdSigninDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signinAd", null);
__decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Get)('ad/settings'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getAdSettings", null);
__decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Put)('ad/settings'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ad_settings_dto_1.UpdateAdSettingsDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "updateAdSettings", null);
__decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Get)('ad/users'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getAdUsers", null);
__decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Post)('ad/users/import'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, import_ad_user_dto_1.ImportAdUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "importAdUser", null);
__decorate([
    (0, common_1.Post)('signup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signup", null);
__decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('refresh-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwtRefresh_guard_1.JwtRefreshGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)(''),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        auth_service_1.AuthService,
        ad_auth_service_1.AdAuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map