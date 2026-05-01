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
exports.TableApplicationsController = void 0;
const common_1 = require("@nestjs/common");
const table_applications_service_1 = require("./table-applications.service");
const create_table_application_dto_1 = require("./dto/create-table-application.dto");
const update_table_application_dto_1 = require("./dto/update-table-application.dto");
const upsert_app3_dto_1 = require("./dto/upsert-app3.dto");
const journal_service_1 = require("../journal/journal.service");
const jwtAuth_guard_1 = require("../auth/guard/jwtAuth.guard");
let TableApplicationsController = class TableApplicationsController {
    constructor(svc, journal) {
        this.svc = svc;
        this.journal = journal;
    }
    async create(dto, req) {
        const data = await this.svc.create(dto);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'create',
            entity: 'TableApplication',
            entityId: String(data?.id ?? ''),
            description: 'Создана строка Приложения №3',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
        });
        return data;
    }
    async update(id, dto, req) {
        const data = await this.svc.update(id, dto);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'update',
            entity: 'TableApplication',
            entityId: String(id),
            description: 'Обновлена строка Приложения №3',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
        });
        return data;
    }
    async upsert(dto, req) {
        const data = await this.svc.upsertApp3(dto);
        await this.journal.log({
            userId: req.user?.id,
            userName: req.user?.username || req.user?.email,
            action: 'upsert',
            entity: 'Application3',
            entityId: String(data?.linkId ?? ''),
            description: 'Идемпотентное обновление/создание Приложения №3',
            route: req.originalUrl,
            method: req.method,
            ip: req.headers['x-forwarded-for'] ?? req.ip,
            success: true,
            meta: data?.data?.updated,
        });
        return data;
    }
    getByZapiska(id) {
        return this.svc.getByZapiska(id);
    }
    async getHistory(rowId) {
        const list = await this.svc.getRowHistory(rowId);
        return { success: true, data: list };
    }
};
exports.TableApplicationsController = TableApplicationsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_table_application_dto_1.CreateTableApplicationDto, Object]),
    __metadata("design:returntype", Promise)
], TableApplicationsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_table_application_dto_1.UpdateTableApplicationDto, Object]),
    __metadata("design:returntype", Promise)
], TableApplicationsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('upsert'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_app3_dto_1.UpsertAppendix3Dto, Object]),
    __metadata("design:returntype", Promise)
], TableApplicationsController.prototype, "upsert", null);
__decorate([
    (0, common_1.Get)('by-zapiska/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TableApplicationsController.prototype, "getByZapiska", null);
__decorate([
    (0, common_1.Get)(':rowId/history'),
    __param(0, (0, common_1.Param)('rowId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TableApplicationsController.prototype, "getHistory", null);
exports.TableApplicationsController = TableApplicationsController = __decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Controller)('table-applications'),
    __metadata("design:paramtypes", [table_applications_service_1.TableApplicationsService,
        journal_service_1.JournalService])
], TableApplicationsController);
//# sourceMappingURL=table-applications.controller.js.map