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
exports.JournalService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const journal_entity_1 = require("./entities/journal.entity");
let JournalService = class JournalService {
    constructor(repo) {
        this.repo = repo;
    }
    async create(createJournalDto) {
        const row = this.repo.create({
            ...createJournalDto,
            success: createJournalDto.success ?? true,
        });
        return this.repo.save(row);
    }
    async findAll(query) {
        const page = Math.max(1, Number(query.page ?? 1));
        const pageSize = Math.max(1, Math.min(200, Number(query.pageSize ?? 50)));
        const qb = this.repo.createQueryBuilder('j');
        if (query.start)
            qb.andWhere('j.createdAt >= :start', { start: query.start });
        if (query.end)
            qb.andWhere('j.createdAt <= :end', { end: query.end });
        if (query.q) {
            const q = `%${query.q}%`;
            qb.andWhere('(j.userName ILIKE :q OR j.action ILIKE :q OR j.entity ILIKE :q OR j.entityId ILIKE :q OR j.description ILIKE :q)', { q });
        }
        const allowedSort = new Set([
            'createdAt',
            'userId',
            'userName',
            'action',
            'entity',
            'entityId',
            'success',
        ]);
        const sortField = allowedSort.has(query.sortField)
            ? query.sortField
            : 'createdAt';
        const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
        qb.orderBy(`j.${sortField}`, sortOrder);
        qb.skip((page - 1) * pageSize).take(pageSize);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, pageSize };
    }
    findOne(id) {
        return this.repo.findOneBy({ id });
    }
    async update(id, updateJournalDto) {
        await this.repo.update({ id }, updateJournalDto);
        return this.findOne(id);
    }
    async remove(id) {
        await this.repo.delete({ id });
        return { id };
    }
    async log(params) {
        return this.create(params);
    }
};
exports.JournalService = JournalService;
exports.JournalService = JournalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(journal_entity_1.Journal)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], JournalService);
//# sourceMappingURL=journal.service.js.map