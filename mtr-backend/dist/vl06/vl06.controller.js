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
exports.Vl06Controller = void 0;
const common_1 = require("@nestjs/common");
const vl06_service_1 = require("./vl06.service");
const create_vl06_dto_1 = require("./dto/create-vl06.dto");
const update_vl06_statuses_dto_1 = require("./dto/update-vl06-statuses.dto");
const journal_service_1 = require("../journal/journal.service");
const jwtAuth_guard_1 = require("../auth/guard/jwtAuth.guard");
let Vl06Controller = class Vl06Controller {
    constructor(vl06Service, journal) {
        this.vl06Service = vl06Service;
        this.journal = journal;
    }
    async create(createVl06Dto, req) {
        const data = await this.vl06Service.create(createVl06Dto);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'create',
            entity: 'VL06',
            entityId: String(data?.id ?? ''),
            description: 'Создана запись VL06',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
        });
        return { success: true, data };
    }
    async createMany(dtos, req) {
        const data = await this.vl06Service.createMany(dtos);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'create_many',
            entity: 'VL06',
            description: 'Массовая загрузка VL06',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
            meta: { count: Array.isArray(data) ? data.length : dtos.length },
        });
        return { success: true, data };
    }
    async findAll() {
        const data = await this.vl06Service.findAll();
        return { success: true, data };
    }
    async update(id, dto, req) {
        const data = await this.vl06Service.update(+id, dto);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'update',
            entity: 'VL06',
            entityId: String(id),
            description: 'Обновлена запись VL06',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
        });
        return { success: true, data };
    }
    async updateStatus(id, dto, req) {
        const data = await this.vl06Service.updateStatus(+id, dto.status);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'update_status',
            entity: 'VL06',
            entityId: String(id),
            description: 'Изменён статус VL06',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
            meta: { status: dto?.status },
        });
        return { success: true, data };
    }
    async updateStatuses(dto, req) {
        const data = await this.vl06Service.updateStatuses(dto.ids, dto.status);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'update_status_bulk',
            entity: 'VL06',
            description: 'Массовая смена статусов VL06',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
            meta: { ids: dto.ids?.length ?? 0, status: dto.status },
        });
        return { success: true, data };
    }
    async remove(id, req) {
        const data = await this.vl06Service.remove(+id);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'delete',
            entity: 'VL06',
            entityId: String(id),
            description: 'Удалена запись VL06',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
        });
        return { success: true, data };
    }
};
exports.Vl06Controller = Vl06Controller;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_vl06_dto_1.CreateVl06Dto, Object]),
    __metadata("design:returntype", Promise)
], Vl06Controller.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk'),
    __param(0, (0, common_1.Body)(new common_1.ParseArrayPipe({ items: create_vl06_dto_1.CreateVl06Dto }))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], Vl06Controller.prototype, "createMany", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Vl06Controller.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], Vl06Controller.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], Vl06Controller.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)('status/bulk'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_vl06_statuses_dto_1.UpdateVl06StatusesDto, Object]),
    __metadata("design:returntype", Promise)
], Vl06Controller.prototype, "updateStatuses", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], Vl06Controller.prototype, "remove", null);
exports.Vl06Controller = Vl06Controller = __decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Controller)('vl06'),
    __metadata("design:paramtypes", [vl06_service_1.Vl06Service,
        journal_service_1.JournalService])
], Vl06Controller);
//# sourceMappingURL=vl06.controller.js.map