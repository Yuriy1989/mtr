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
exports.ZapiskiController = void 0;
const common_1 = require("@nestjs/common");
const zapiski_service_1 = require("./zapiski.service");
const update_zapiski_dto_1 = require("./dto/update-zapiski.dto");
const jwtAuth_guard_1 = require("../auth/guard/jwtAuth.guard");
let ZapiskiController = class ZapiskiController {
    constructor(zapiskiService) {
        this.zapiskiService = zapiskiService;
    }
    async create(createZapiskiDto) {
        const zapiska = await this.zapiskiService.create(createZapiskiDto);
        return {
            success: true,
            data: zapiska,
        };
    }
    async findAll(from, to) {
        const data = await this.zapiskiService.findAll({ from, to });
        return { success: true, data };
    }
    async findOne(id) {
        const data = await this.zapiskiService.findOne(+id);
        return { success: true, data };
    }
    async stats(id) {
        const data = await this.zapiskiService.getStatsForZapiska(+id);
        return { success: true, data };
    }
    update(id, updateZapiskiDto) {
        return this.zapiskiService.update(+id, updateZapiskiDto);
    }
    async sendToWork(id) {
        const data = await this.zapiskiService.sendToWork(+id);
        return { success: true, data };
    }
    async sendToSent(id) {
        const data = await this.zapiskiService.sendToSent(+id);
        return { success: true, data };
    }
    remove(id) {
        return this.zapiskiService.remove(+id);
    }
};
exports.ZapiskiController = ZapiskiController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ZapiskiController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ZapiskiController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ZapiskiController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ZapiskiController.prototype, "stats", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_zapiski_dto_1.UpdateZapiskiDto]),
    __metadata("design:returntype", void 0)
], ZapiskiController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/send'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ZapiskiController.prototype, "sendToWork", null);
__decorate([
    (0, common_1.Patch)(':id/send50'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ZapiskiController.prototype, "sendToSent", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ZapiskiController.prototype, "remove", null);
exports.ZapiskiController = ZapiskiController = __decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Controller)('zapiski'),
    __metadata("design:paramtypes", [zapiski_service_1.ZapiskiService])
], ZapiskiController);
//# sourceMappingURL=zapiski.controller.js.map