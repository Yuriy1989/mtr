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
exports.TransportsController = void 0;
const common_1 = require("@nestjs/common");
const transports_service_1 = require("./transports.service");
const journal_service_1 = require("../journal/journal.service");
const jwtAuth_guard_1 = require("../auth/guard/jwtAuth.guard");
let TransportsController = class TransportsController {
    constructor(svc, journal) {
        this.svc = svc;
        this.journal = journal;
    }
    async findAll(status) {
        const data = await this.svc.findAll(status ? Number(status) : undefined);
        return { success: true, data };
    }
    async byApplication(appId) {
        const data = await this.svc.findByApplication(appId);
        return { success: true, data };
    }
    async fromApp(appId, req) {
        const data = await this.svc.createFromApplication(appId);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'create',
            entity: 'TransportRequest',
            entityId: String(data?.id ?? ''),
            description: 'Создана заявка на транспорт из Приложения №3',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
            meta: { applicationId: appId },
        });
        return { success: true, data };
    }
    async approve(id, req) {
        const data = await this.svc.approve(id);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'approve',
            entity: 'TransportRequest',
            entityId: String(id),
            description: 'Заявка на транспорт согласована',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
        });
        return { success: true, data };
    }
    async approveForApp(id, req) {
        const data = await this.svc.approveForApplication(id);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'approve_for_app',
            entity: 'Application',
            entityId: String(id),
            description: 'Приложение согласовано (без заявки)',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
            meta: data,
        });
        return data;
    }
    async rejectForApp(id, req) {
        const data = await this.svc.rejectForApplication(id);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'reject_for_app',
            entity: 'Application',
            entityId: String(id),
            description: 'Приложение отклонено (без заявки)',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
            meta: data,
        });
        return data;
    }
    async reject(id, body, req) {
        const data = await this.svc.reject(id, body?.reason);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'reject',
            entity: 'TransportRequest',
            entityId: String(id),
            description: 'Заявка на транспорт отклонена',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
            meta: { reason: body?.reason ?? null },
        });
        return { success: true, data };
    }
};
exports.TransportsController = TransportsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('by-application/:appId'),
    __param(0, (0, common_1.Param)('appId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TransportsController.prototype, "byApplication", null);
__decorate([
    (0, common_1.Post)('from-application/:appId'),
    __param(0, (0, common_1.Param)('appId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TransportsController.prototype, "fromApp", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TransportsController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)('approve/app/:applicationId'),
    __param(0, (0, common_1.Param)('applicationId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TransportsController.prototype, "approveForApp", null);
__decorate([
    (0, common_1.Patch)('reject/app/:applicationId'),
    __param(0, (0, common_1.Param)('applicationId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TransportsController.prototype, "rejectForApp", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], TransportsController.prototype, "reject", null);
exports.TransportsController = TransportsController = __decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Controller)('transports'),
    __metadata("design:paramtypes", [transports_service_1.TransportsService,
        journal_service_1.JournalService])
], TransportsController);
//# sourceMappingURL=transports.controller.js.map