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
exports.MtrListController = void 0;
const common_1 = require("@nestjs/common");
const mtr_list_service_1 = require("./mtr-list.service");
const journal_service_1 = require("../journal/journal.service");
const jwtAuth_guard_1 = require("../auth/guard/jwtAuth.guard");
let MtrListController = class MtrListController {
    constructor(mtrListService, journal) {
        this.mtrListService = mtrListService;
        this.journal = journal;
    }
    async create(createMtrListDto, req) {
        const data = await this.mtrListService.create(createMtrListDto);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'create',
            entity: 'MtrList',
            description: 'Созданы строки MTR для служебки',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
            meta: {
                count: Array.isArray(createMtrListDto) ? createMtrListDto.length : 1,
            },
        });
        return data;
    }
    findAll() {
        return this.mtrListService.findAll();
    }
    findById(id) {
        return this.mtrListService.findByZapiskaId(+id);
    }
    async getByZapiska(id) {
        const data = await this.mtrListService.getByZapiskaWithVl06(id);
        return { success: true, data };
    }
    async update(id, updateMtrListDto, req) {
        const data = await this.mtrListService.update(+id, updateMtrListDto);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'update',
            entity: 'MtrList',
            entityId: String(id),
            description: 'Обновлена строка MTR',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
        });
        return data;
    }
    async syncForZapiska(zapiskaId, items, req) {
        const data = await this.mtrListService.syncForZapiska(zapiskaId, items);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'sync',
            entity: 'MtrList',
            entityId: String(zapiskaId),
            description: 'Синхронизированы строки MTR для служебки',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
            meta: data,
        });
        return data;
    }
    async remove(id, req) {
        const data = await this.mtrListService.remove(+id);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'delete',
            entity: 'MtrList',
            entityId: String(id),
            description: 'Удалена строка MTR',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
        });
        return data;
    }
};
exports.MtrListController = MtrListController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MtrListController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MtrListController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MtrListController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('by-zapiska/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MtrListController.prototype, "getByZapiska", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], MtrListController.prototype, "update", null);
__decorate([
    (0, common_1.Put)('sync/:zapiskaId'),
    __param(0, (0, common_1.Param)('zapiskaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Array, Object]),
    __metadata("design:returntype", Promise)
], MtrListController.prototype, "syncForZapiska", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MtrListController.prototype, "remove", null);
exports.MtrListController = MtrListController = __decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Controller)('mtr-list'),
    __metadata("design:paramtypes", [mtr_list_service_1.MtrListService,
        journal_service_1.JournalService])
], MtrListController);
//# sourceMappingURL=mtr-list.controller.js.map