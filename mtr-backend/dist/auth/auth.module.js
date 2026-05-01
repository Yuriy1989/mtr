"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const users_module_1 = require("../users/users.module");
const auth_service_1 = require("./auth.service");
const jwt_strategy_1 = require("./strategy/jwt.strategy");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const local_strategy_1 = require("./strategy/local.strategy");
const auth_controller_1 = require("./auth.controller");
const jwt_config_factory_1 = require("../config/jwt-config.factory");
const jwt_refresh_strategy_1 = require("./strategy/jwt-refresh.strategy");
const jwtRefresh_guard_1 = require("./guard/jwtRefresh.guard");
const ad_auth_service_1 = require("./ad-auth.service");
const typeorm_1 = require("@nestjs/typeorm");
const ad_settings_entity_1 = require("./entities/ad-settings.entity");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            (0, common_1.forwardRef)(() => users_module_1.UsersModule),
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                useClass: jwt_config_factory_1.JwtConfigFactory,
            }),
            typeorm_1.TypeOrmModule.forFeature([ad_settings_entity_1.AdSettings]),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            local_strategy_1.LocalStrategy,
            jwt_strategy_1.JwtStrategy,
            jwtRefresh_guard_1.JwtRefreshGuard,
            jwt_config_factory_1.JwtConfigFactory,
            jwt_refresh_strategy_1.JwtRefreshStrategy,
            ad_auth_service_1.AdAuthService,
        ],
        exports: [auth_service_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map