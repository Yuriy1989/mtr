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
exports.JournalController = void 0;
const common_1 = require("@nestjs/common");
const journal_service_1 = require("./journal.service");
const create_journal_dto_1 = require("./dto/create-journal.dto");
const update_journal_dto_1 = require("./dto/update-journal.dto");
const query_journal_dto_1 = require("./dto/query-journal.dto");
const jwtAuth_guard_1 = require("../auth/guard/jwtAuth.guard");
let JournalController = class JournalController {
    constructor(journalService) {
        this.journalService = journalService;
    }
    async create(dto, req) {
        const ip = dto.ip ?? req.headers['x-forwarded-for'] ?? req.ip ?? null;
        const route = dto.route ?? req.originalUrl ?? req.url ?? null;
        const method = dto.method ?? req.method ?? null;
        return this.journalService.create({ ...dto, ip, route, method });
    }
    findAll(query) {
        return this.journalService.findAll(query);
    }
    findOne(id) {
        return this.journalService.findOne(+id);
    }
    update(id, dto) {
        return this.journalService.update(+id, dto);
    }
    remove(id) {
        return this.journalService.remove(+id);
    }
};
exports.JournalController = JournalController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_journal_dto_1.CreateJournalDto, Object]),
    __metadata("design:returntype", Promise)
], JournalController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_journal_dto_1.QueryJournalDto]),
    __metadata("design:returntype", void 0)
], JournalController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JournalController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_journal_dto_1.UpdateJournalDto]),
    __metadata("design:returntype", void 0)
], JournalController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JournalController.prototype, "remove", null);
exports.JournalController = JournalController = __decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Controller)('journal'),
    __metadata("design:paramtypes", [journal_service_1.JournalService])
], JournalController);
//# sourceMappingURL=journal.controller.js.map