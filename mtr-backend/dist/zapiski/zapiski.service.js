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
exports.ZapiskiService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const zapiski_entity_1 = require("./entities/zapiski.entity");
const typeorm_2 = require("typeorm");
const vl06_entity_1 = require("../vl06/entities/vl06.entity");
const mtr_list_entity_1 = require("../mtr-list/entities/mtr-list.entity");
const application_entity_1 = require("../applications/entities/application.entity");
const table_application_entity_1 = require("../table-applications/entities/table-application.entity");
const dimension_category_entity_1 = require("../dimensions/entities/dimension-category.entity");
const transports_service_1 = require("../transports/transports.service");
const dimension_entity_1 = require("../dimensions/entities/dimension.entity");
let ZapiskiService = class ZapiskiService {
    constructor(tableZapiskiRepository, mtrRepo, vl06Repo, appRepo, appRowRepo, transports) {
        this.tableZapiskiRepository = tableZapiskiRepository;
        this.mtrRepo = mtrRepo;
        this.vl06Repo = vl06Repo;
        this.appRepo = appRepo;
        this.appRowRepo = appRowRepo;
        this.transports = transports;
    }
    async create(createZapiskiDto) {
        const { id: userId, region } = createZapiskiDto || {};
        const newZapiski = this.tableZapiskiRepository.create({
            user: userId,
            status: 20,
            region: Array.isArray(region) ? region : null,
        });
        const data = await this.tableZapiskiRepository.save(newZapiski);
        return data;
    }
    async findAll(range) {
        const qb = this.tableZapiskiRepository
            .createQueryBuilder('z')
            .leftJoinAndSelect('z.user', 'user')
            .loadRelationCountAndMap('z.mtrCount', 'z.mtrList')
            .orderBy('z.createdAt', 'DESC');
        if (range?.from) {
            const from = new Date(range.from);
            if (!isNaN(from.getTime()))
                qb.andWhere('z.createdAt >= :from', { from });
        }
        if (range?.to) {
            const to = new Date(range.to);
            if (!isNaN(to.getTime()))
                qb.andWhere('z.createdAt <= :to', { to });
        }
        const list = await qb.getMany();
        return list;
    }
    async findOne(id) {
        const zapiska = await this.tableZapiskiRepository.findOne({
            where: { id },
            relations: { user: true },
        });
        if (!zapiska)
            throw new common_1.NotFoundException('Записка не найдена');
        return zapiska;
    }
    update(id, updateZapiskiDto) {
        return this.tableZapiskiRepository.update({ id }, updateZapiskiDto);
    }
    async remove(id) {
        return this.tableZapiskiRepository.manager.transaction(async (manager) => {
            const zapRepo = manager.getRepository(zapiski_entity_1.Zapiski);
            const mtrRepo = manager.getRepository(mtr_list_entity_1.MtrList);
            const vl06Repo = manager.getRepository(vl06_entity_1.Vl06);
            const zap = await zapRepo.findOne({
                where: { id },
                select: { id: true },
            });
            if (!zap)
                throw new common_1.NotFoundException('Записка не найдена');
            const raw = await mtrRepo
                .createQueryBuilder('m')
                .select('DISTINCT m.vl06', 'vl06')
                .where('m.zapiskiId = :id', { id })
                .getRawMany();
            const vl06Ids = raw.map((r) => r.vl06).filter(Boolean);
            if (vl06Ids.length) {
                await vl06Repo
                    .createQueryBuilder()
                    .update(vl06_entity_1.Vl06)
                    .set({ status: 10 })
                    .whereInIds(vl06Ids)
                    .execute();
            }
            await zapRepo.delete({ id });
            return {
                success: true,
                data: { id, updatedVl06: vl06Ids.length },
            };
        });
    }
    async sendToWork(id) {
        return this.tableZapiskiRepository.manager.transaction(async (manager) => {
            const zapRepo = manager.getRepository(zapiski_entity_1.Zapiski);
            const mtrRepo = manager.getRepository(mtr_list_entity_1.MtrList);
            const vl06Repo = manager.getRepository(vl06_entity_1.Vl06);
            const zap = await zapRepo.findOne({
                where: { id },
                select: { id: true, status: true },
            });
            if (!zap)
                throw new common_1.NotFoundException('Записка не найдена');
            if (zap.status === 30) {
                return { id, already: true, updatedVl06: 0 };
            }
            const raw = await mtrRepo
                .createQueryBuilder('m')
                .select('DISTINCT m.vl06', 'vl06')
                .where('m.zapiskiId = :id', { id })
                .getRawMany();
            const vl06Ids = raw.map((r) => r.vl06).filter(Boolean);
            if (vl06Ids.length) {
                await vl06Repo.update({ id: (0, typeorm_2.In)(vl06Ids) }, { status: 30 });
            }
            await zapRepo.update({ id }, { status: 30 });
            return { id, updatedVl06: vl06Ids.length };
        });
    }
    async sendToSent(id) {
        return this.tableZapiskiRepository.manager.transaction(async (manager) => {
            const zapRepo = manager.getRepository(zapiski_entity_1.Zapiski);
            const mtrRepo = manager.getRepository(mtr_list_entity_1.MtrList);
            const vl06Repo = manager.getRepository(vl06_entity_1.Vl06);
            const appRepo = manager.getRepository(application_entity_1.Application);
            const appRowRepo = manager.getRepository(table_application_entity_1.TableApplication);
            const zap = await zapRepo.findOne({
                where: { id },
                select: { id: true, status: true },
            });
            if (!zap)
                throw new common_1.NotFoundException('Записка не найдена');
            const app = await appRepo.findOne({ where: { zapiska: { id } } });
            if (!app)
                throw new common_1.NotFoundException('Нет Приложения №3 для этой служебки');
            const rows = await appRowRepo.find({
                where: { listApp: { id: app.id } },
                relations: { mtrList: { vl06: true } },
                order: { id: 'ASC' },
            });
            const full = [];
            const partial = [];
            const untouched = [];
            let shippedAny = false;
            for (const r of rows) {
                const v = r.mtrList?.vl06;
                if (!v?.id)
                    continue;
                const supply = typeof v.supplyVolume === 'number' ? v.supplyVolume : null;
                const shippedRaw = r.discarded;
                const shipped = shippedRaw != null && shippedRaw !== ''
                    ? Number(String(shippedRaw).replace(/\s/g, '').replace(',', '.'))
                    : 0;
                if (shipped > 0)
                    shippedAny = true;
                if (supply != null && supply > 0) {
                    if (shipped >= supply)
                        full.push(v.id);
                    else if (shipped > 0 && shipped < supply)
                        partial.push(v.id);
                    else
                        untouched.push(v.id);
                }
                else {
                    if (shipped > 0)
                        partial.push(v.id);
                    else
                        untouched.push(v.id);
                }
            }
            const rawAll = await mtrRepo
                .createQueryBuilder('m')
                .select('DISTINCT m.vl06', 'vl06')
                .where('m.zapiskiId = :id', { id })
                .getRawMany();
            const allVl06 = rawAll.map((r) => r.vl06).filter(Boolean);
            const known = new Set([...full, ...partial, ...untouched]);
            for (const vid of allVl06)
                if (!known.has(vid))
                    untouched.push(vid);
            if (full.length)
                await vl06Repo.update({ id: (0, typeorm_2.In)(full) }, { status: 50 });
            if (partial.length)
                await vl06Repo.update({ id: (0, typeorm_2.In)(partial) }, { status: 60 });
            if (untouched.length)
                await vl06Repo.update({ id: (0, typeorm_2.In)(untouched) }, { status: 40 });
            const total = allVl06.length;
            const fullCount = full.length;
            let appStatus = 40;
            if (fullCount === total && total > 0)
                appStatus = 50;
            else if (shippedAny)
                appStatus = 60;
            let zapStatus = 40;
            if (fullCount === total && total > 0)
                zapStatus = 50;
            else if (shippedAny)
                zapStatus = 60;
            await appRepo.update({ id: app.id }, { status: appStatus, sendLock: true });
            await zapRepo.update({ id }, { status: zapStatus });
            await this.transports.createNewFromApplication(app.id);
            return { id, updatedVl06: allVl06.length, status: appStatus };
        });
    }
    async getStatsForZapiska(id) {
        const rows = await this.tableZapiskiRepository.manager
            .getRepository(mtr_list_entity_1.MtrList)
            .find({ where: { zapiska: { id } }, relations: { vl06: true } });
        const catList = await this.tableZapiskiRepository.manager
            .getRepository(dimension_category_entity_1.DimensionCategory)
            .find();
        const catNameByKey = new Map(catList.map((c) => [c.key, c.nameRu || c.key]));
        const dimRepo = this.tableZapiskiRepository.manager.getRepository(dimension_entity_1.Dimension);
        const dims = await dimRepo.find({ relations: { aliases: true } });
        const byUnit = new Map();
        const byCategory = new Map();
        const lower = (s) => (s == null ? '' : String(s).trim().toLowerCase());
        const byCode = new Map();
        const byAlias = new Map();
        for (const d of dims) {
            if (d.code)
                byCode.set(lower(d.code), d);
            for (const a of d.aliases || []) {
                if (a?.text)
                    byAlias.set(lower(a.text), d);
            }
            if (d.nameDimension)
                byAlias.set(lower(d.nameDimension), d);
        }
        function resolveDimension(raw) {
            const s = lower(raw);
            if (byCode.has(s))
                return byCode.get(s);
            if (byAlias.has(s))
                return byAlias.get(s);
            return null;
        }
        for (const r of rows) {
            const v = r.vl06;
            const unitRaw = v?.basic;
            const qty = typeof v?.supplyVolume === 'number' ? v.supplyVolume : 0;
            const key = unitRaw || '—';
            byUnit.set(key, (byUnit.get(key) || 0) + qty);
            const dim = resolveDimension(unitRaw);
            if (dim?.category) {
                const toBase = dim.isBase ? qty : qty * Number(dim.toBaseFactor || 1);
                const prev = byCategory.get(dim.category) || {
                    total: 0,
                    baseUnit: null,
                };
                byCategory.set(dim.category, {
                    total: prev.total + toBase,
                    baseUnit: prev.baseUnit || (dim.isBase ? dim.code : prev.baseUnit),
                });
            }
        }
        const toObject = (m) => {
            const o = {};
            for (const [k, v] of m.entries())
                o[k] = v;
            return o;
        };
        return {
            byUnit: toObject(byUnit),
            byCategory: Object.fromEntries(Object.entries(toObject(byCategory)).map(([catKey, val]) => [
                catKey,
                { ...val, categoryName: catNameByKey.get(catKey) || catKey },
            ])),
        };
    }
    async sendToSent50(id) {
        return this.sendToSent(id);
    }
};
exports.ZapiskiService = ZapiskiService;
exports.ZapiskiService = ZapiskiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zapiski_entity_1.Zapiski)),
    __param(1, (0, typeorm_1.InjectRepository)(mtr_list_entity_1.MtrList)),
    __param(2, (0, typeorm_1.InjectRepository)(vl06_entity_1.Vl06)),
    __param(3, (0, typeorm_1.InjectRepository)(application_entity_1.Application)),
    __param(4, (0, typeorm_1.InjectRepository)(table_application_entity_1.TableApplication)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        transports_service_1.TransportsService])
], ZapiskiService);
//# sourceMappingURL=zapiski.service.js.map