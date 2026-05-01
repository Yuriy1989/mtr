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
exports.LastmileController = void 0;
const common_1 = require("@nestjs/common");
const lastmile_service_1 = require("./lastmile.service");
const jwtAuth_guard_1 = require("../auth/guard/jwtAuth.guard");
let LastmileController = class LastmileController {
    constructor(svc) {
        this.svc = svc;
    }
    listPending(days, status) {
        return this.svc.listPending({
            days: Number(days) || 7,
            status: status ? Number(status) : undefined,
        });
    }
    getAcceptance(appId) {
        return this.svc.getAcceptance(appId);
    }
    accept(appId, decisions) {
        return this.svc.accept(appId, decisions);
    }
    registry(days) {
        return this.svc.registry(Number(days) || 30);
    }
    registryDetail(appId) {
        return this.svc.registryDetail(appId);
    }
};
exports.LastmileController = LastmileController;
__decorate([
    (0, common_1.Get)('pending'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LastmileController.prototype, "listPending", null);
__decorate([
    (0, common_1.Get)('acceptance/:appId'),
    __param(0, (0, common_1.Param)('appId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LastmileController.prototype, "getAcceptance", null);
__decorate([
    (0, common_1.Post)('accept/:appId'),
    __param(0, (0, common_1.Param)('appId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Array]),
    __metadata("design:returntype", void 0)
], LastmileController.prototype, "accept", null);
__decorate([
    (0, common_1.Get)('registry'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LastmileController.prototype, "registry", null);
__decorate([
    (0, common_1.Get)('registry/:appId'),
    __param(0, (0, common_1.Param)('appId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LastmileController.prototype, "registryDetail", null);
exports.LastmileController = LastmileController = __decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Controller)('lastmile'),
    __metadata("design:paramtypes", [lastmile_service_1.LastmileService])
], LastmileController);
//# sourceMappingURL=lastmile.controller.js.map