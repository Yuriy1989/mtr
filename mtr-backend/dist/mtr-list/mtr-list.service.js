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
exports.MtrListService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const mtr_list_entity_1 = require("./entities/mtr-list.entity");
const typeorm_2 = require("typeorm");
const vl06_entity_1 = require("../vl06/entities/vl06.entity");
const zapiski_entity_1 = require("../zapiski/entities/zapiski.entity");
let MtrListService = class MtrListService {
    constructor(mtrList, dataSource, zapRepo) {
        this.mtrList = mtrList;
        this.dataSource = dataSource;
        this.zapRepo = zapRepo;
    }
    async create(createMtrListDto) {
        const createList = await this.mtrList
            .createQueryBuilder()
            .insert()
            .into(mtr_list_entity_1.MtrList)
            .values(createMtrListDto)
            .execute();
        return createList;
    }
    async findByZapiskaId(zapiskaId) {
        const rows = await this.mtrList.find({
            where: { zapiska: { id: zapiskaId } },
            relations: ['vl06'],
            order: { id: 'ASC' },
        });
        return rows;
    }
    async getByZapiskaWithVl06(zapiskaId) {
        const zap = await this.zapRepo.findOne({ where: { id: zapiskaId } });
        if (!zap)
            throw new common_1.NotFoundException('Записка не найдена');
        return this.mtrList.find({
            where: { zapiska: { id: zapiskaId } },
            relations: { vl06: true },
            order: { id: 'ASC' },
        });
    }
    findAll() {
        return `This action returns all mtrList`;
    }
    findOne(id) {
        return `This action returns a #${id} mtrList`;
    }
    async update(id, body) {
        const res = await this.mtrList.update(body.vl06Id, body.data);
        if (!res.affected)
            throw new common_1.NotFoundException(`MtrList ${body.vl06Id} not found`);
        return res;
    }
    async remove(id) {
        const res = await this.mtrList.delete({ id });
        if (!res.affected) {
            throw new common_1.NotFoundException(`MtrList ${id} not found`);
        }
        return { success: true, id };
    }
    async syncForZapiska(zapiskaId, items) {
        return this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(mtr_list_entity_1.MtrList);
            const vl06Repo = manager.getRepository(vl06_entity_1.Vl06);
            const existing = await repo.find({
                where: { zapiska: { id: zapiskaId } },
                relations: ['vl06'],
                select: { id: true, vl06: { id: true } },
            });
            const existingByVl06 = new Map();
            for (const row of existing)
                existingByVl06.set(row.vl06.id, row.id);
            const incomingVl06Ids = new Set(items.map((i) => i.vl06Id));
            const toSave = items.map((i) => {
                const m = new mtr_list_entity_1.MtrList();
                const existingId = existingByVl06.get(i.vl06Id);
                if (existingId)
                    m.id = existingId;
                m.express = i.express ?? null;
                m.note = i.note ?? null;
                m.repairObjectName = i.repairObjectName ?? null;
                m.zapiska = { id: zapiskaId };
                m.vl06 = { id: i.vl06Id };
                return m;
            });
            const removedVl06Ids = existing
                .map((row) => row.vl06.id)
                .filter((id) => !incomingVl06Ids.has(id));
            if (removedVl06Ids.length) {
                await vl06Repo
                    .createQueryBuilder()
                    .update(vl06_entity_1.Vl06)
                    .set({ status: 10 })
                    .whereInIds(removedVl06Ids)
                    .execute();
                await repo
                    .createQueryBuilder()
                    .delete()
                    .where('zapiskiId = :zapiskaId', { zapiskaId })
                    .andWhere('vl06 IN (:...ids)', { ids: removedVl06Ids })
                    .execute();
            }
            const saved = await repo.save(toSave);
            return {
                updatedCount: saved.length,
                removedCount: removedVl06Ids.length,
            };
        });
    }
};
exports.MtrListService = MtrListService;
exports.MtrListService = MtrListService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(mtr_list_entity_1.MtrList)),
    __param(2, (0, typeorm_1.InjectRepository)(zapiski_entity_1.Zapiski)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        typeorm_2.Repository])
], MtrListService);
//# sourceMappingURL=mtr-list.service.js.map