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
exports.DimensionsService = void 0;
const common_1 = require("@nestjs/common");
const dimension_category_entity_1 = require("./entities/dimension-category.entity");
const typeorm_1 = require("@nestjs/typeorm");
const dimension_entity_1 = require("./entities/dimension.entity");
const typeorm_2 = require("typeorm");
const dimension_alias_entity_1 = require("./entities/dimension-alias.entity");
let DimensionsService = class DimensionsService {
    constructor(dimRepo, aliasRepo, catRepo) {
        this.dimRepo = dimRepo;
        this.aliasRepo = aliasRepo;
        this.catRepo = catRepo;
    }
    async ensureSingleBaseInCategory(category, keepId) {
        if (!category)
            return;
        await this.dimRepo
            .createQueryBuilder()
            .update(dimension_entity_1.Dimension)
            .set({ isBase: false, toBaseFactor: '1' })
            .where('category = :category', { category })
            .andWhere(keepId ? 'id <> :id' : '1=1', keepId ? { id: keepId } : {})
            .execute();
    }
    async create(dto) {
        const nameDimension = (dto.nameDimension ?? '').toString().trim();
        const code = dto.code != null ? String(dto.code).trim() : null;
        const category = dto.category != null ? String(dto.category).trim() : null;
        const isBase = Boolean(dto.isBase);
        if (!nameDimension)
            throw new common_1.BadRequestException('nameDimension is required');
        if (!code)
            throw new common_1.BadRequestException('code is required');
        let toBaseFactor = null;
        if (isBase) {
            toBaseFactor = '1';
        }
        else if (dto.toBaseFactor != null && dto.toBaseFactor !== '') {
            const num = Number(dto.toBaseFactor);
            toBaseFactor = Number.isFinite(num) ? String(num) : null;
        }
        const aliases = Array.isArray(dto.aliases)
            ? dto.aliases.map((t) => String(t || '').trim()).filter(Boolean)
            : [];
        const d = this.dimRepo.create({
            nameDimension,
            code,
            category,
            isBase,
            toBaseFactor,
        });
        const saved = await this.dimRepo.save(d);
        if (isBase && category) {
            await this.ensureSingleBaseInCategory(category, saved.id);
        }
        if (aliases.length) {
            const list = aliases.map((t) => this.aliasRepo.create({ text: t, dimension: saved }));
            await this.aliasRepo.save(list);
        }
        return this.findAll();
    }
    async findAll() {
        const list = await this.dimRepo.find({ relations: { aliases: true } });
        return list.map((d) => ({
            id: d.id,
            nameDimension: d.nameDimension,
            code: d.code,
            category: d.category,
            isBase: d.isBase,
            toBaseFactor: d.toBaseFactor
                ? Number(d.toBaseFactor)
                : d.isBase
                    ? 1
                    : null,
            aliases: (d.aliases || []).map((a) => a.text),
        }));
    }
    async update(id, dto) {
        const exist = await this.dimRepo.findOne({
            where: { id },
            relations: { aliases: true },
        });
        if (!exist)
            throw new common_1.NotFoundException('Dimension not found');
        if (dto.nameDimension != null) {
            exist.nameDimension = String(dto.nameDimension).trim();
        }
        if (dto.code != null) {
            exist.code = String(dto.code).trim();
        }
        if (dto.category != null) {
            exist.category = String(dto.category).trim() || null;
        }
        if (dto.isBase != null) {
            exist.isBase = Boolean(dto.isBase);
        }
        if (exist.isBase) {
            exist.toBaseFactor = '1';
        }
        else if (dto.toBaseFactor !== undefined) {
            if (dto.toBaseFactor === '' || dto.toBaseFactor == null) {
                exist.toBaseFactor = null;
            }
            else {
                const n = Number(dto.toBaseFactor);
                exist.toBaseFactor = Number.isFinite(n) ? String(n) : null;
            }
        }
        const saved = await this.dimRepo.save(exist);
        if (saved.isBase && saved.category) {
            await this.ensureSingleBaseInCategory(saved.category, saved.id);
        }
        if (dto.aliases) {
            await this.aliasRepo.delete({ dimension: { id } });
            const list = dto.aliases
                .map((t) => String(t || '').trim())
                .filter(Boolean)
                .map((t) => this.aliasRepo.create({ text: t, dimension: saved }));
            if (list.length)
                await this.aliasRepo.save(list);
        }
        return this.findAll();
    }
    async remove(id) {
        await this.dimRepo.delete({ id });
        return this.findAll();
    }
    async getCategoryMap() {
        const list = await this.catRepo.find();
        const map = new Map();
        for (const c of list)
            map.set(c.key, c);
        return map;
    }
    async listCategories() {
        const list = await this.catRepo.find();
        return list.sort((a, b) => a.key.localeCompare(b.key));
    }
    async upsertCategory(dto) {
        const key = String(dto.key || '').trim();
        const nameRu = String(dto.nameRu || '').trim();
        if (!key || !nameRu)
            throw new Error('key and nameRu are required');
        let exist = await this.catRepo.findOne({ where: { key } });
        if (!exist) {
            exist = this.catRepo.create({ key, nameRu, nameEn: dto.nameEn ?? null });
        }
        else {
            exist.nameRu = nameRu;
            exist.nameEn = dto.nameEn ?? exist.nameEn ?? null;
        }
        await this.catRepo.save(exist);
        return this.listCategories();
    }
    async upsertCategories(list) {
        for (const it of list || []) {
            await this.upsertCategory(it);
        }
        return this.listCategories();
    }
};
exports.DimensionsService = DimensionsService;
exports.DimensionsService = DimensionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(dimension_entity_1.Dimension)),
    __param(1, (0, typeorm_1.InjectRepository)(dimension_alias_entity_1.DimensionAlias)),
    __param(2, (0, typeorm_1.InjectRepository)(dimension_category_entity_1.DimensionCategory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DimensionsService);
//# sourceMappingURL=dimensions.service.js.map