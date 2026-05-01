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
exports.ApplicationsController = void 0;
const common_1 = require("@nestjs/common");
const applications_service_1 = require("./applications.service");
const create_application_dto_1 = require("./dto/create-application.dto");
const update_application_dto_1 = require("./dto/update-application.dto");
const journal_service_1 = require("../journal/journal.service");
const jwtAuth_guard_1 = require("../auth/guard/jwtAuth.guard");
let ApplicationsController = class ApplicationsController {
    constructor(applicationsService, journal) {
        this.applicationsService = applicationsService;
        this.journal = journal;
    }
    async create(dto, req) {
        const data = await this.applicationsService.create(dto);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username ||
                req.user?.email ||
                [req.user?.surname, req.user?.firstName]
                    .filter(Boolean)
                    .join(' '),
            action: 'create',
            entity: 'Application',
            entityId: String(data?.id ?? ''),
            description: 'Создано Приложение №3',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
            meta: dto ? { hasDto: true } : undefined,
        });
        return { success: true, data };
    }
    findAllDetailed(start, end) {
        return this.applicationsService.findAllDetailed(start ? new Date(start) : null, end ? new Date(end) : null);
    }
    async findAll() {
        const data = await this.applicationsService.findAll();
        return { success: true, data };
    }
    async findOne(id) {
        const data = await this.applicationsService.findOne(id);
        return { success: true, data };
    }
    async update(id, dto, req) {
        const data = await this.applicationsService.update(id, dto);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'update',
            entity: 'Application',
            entityId: String(id),
            description: 'Обновлено Приложение №3',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
        });
        return { success: true, data };
    }
    async remove(id, req) {
        const data = await this.applicationsService.remove(id);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'delete',
            entity: 'Application',
            entityId: String(id),
            description: 'Удалено Приложение №3 (со сменой статусов связей)',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
            meta: data?.data?.updatedStatuses,
        });
        return { success: true, data };
    }
};
exports.ApplicationsController = ApplicationsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_application_dto_1.CreateApplicationDto, Object]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('all'),
    __param(0, (0, common_1.Query)('start')),
    __param(1, (0, common_1.Query)('end')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findAllDetailed", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_application_dto_1.UpdateApplicationDto, Object]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "remove", null);
exports.ApplicationsController = ApplicationsController = __decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Controller)('applications'),
    __metadata("design:paramtypes", [applications_service_1.ApplicationsService,
        journal_service_1.JournalService])
], ApplicationsController);
//# sourceMappingURL=applications.controller.js.map