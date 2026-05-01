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
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const application_entity_1 = require("./entities/application.entity");
const zapiski_entity_1 = require("../zapiski/entities/zapiski.entity");
const table_application_entity_1 = require("../table-applications/entities/table-application.entity");
const mtr_list_entity_1 = require("../mtr-list/entities/mtr-list.entity");
const vl06_entity_1 = require("../vl06/entities/vl06.entity");
const transport_entity_1 = require("../transports/entities/transport.entity");
const lastmile_entity_1 = require("../lastmile/entities/lastmile.entity");
let ApplicationsService = class ApplicationsService {
    constructor(appRepo, zapRepo, appRowRepo, mtrRepo, transportRepo, decRepo) {
        this.appRepo = appRepo;
        this.zapRepo = zapRepo;
        this.appRowRepo = appRowRepo;
        this.mtrRepo = mtrRepo;
        this.transportRepo = transportRepo;
        this.decRepo = decRepo;
    }
    async create(dto) {
        if (Array.isArray(dto)) {
            throw new common_1.BadRequestException('Expected single CreateApplicationDto, got array');
        }
        const partial = dto;
        const entity = this.appRepo.create(partial);
        return await this.appRepo.save(entity);
    }
    async findAll() {
        return this.appRepo.find({
            relations: { zapiska: true, tableApp: true, user: true },
            order: { id: 'DESC' },
        });
    }
    async findOne(id) {
        const app = await this.appRepo.findOne({
            where: { id },
            relations: {
                zapiska: true,
                user: true,
                tableApp: { mtrList: { vl06: true } },
            },
        });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        return app;
    }
    async findAllDetailed(start, end) {
        const whereCreated = {};
        if (start && end) {
            whereCreated.createdAt = { $gte: start, $lte: end };
        }
        const dateWhere = start && end ? { createdAt: (0, typeorm_2.Between)(start, end) } : {};
        const apps = await this.appRepo.find({
            where: dateWhere,
            relations: { zapiska: { user: true } },
            order: { id: 'DESC' },
        });
        const result = [];
        for (const a of apps) {
            const rowsCount = await this.appRowRepo.count({
                where: { listApp: { id: a.id } },
            });
            const rows = await this.appRowRepo.find({
                where: { listApp: { id: a.id } },
                relations: { mtrList: { vl06: true } },
                select: {
                    id: true,
                    discarded: true,
                    remainder: true,
                    mtrList: { id: true, vl06: { id: true, supplyVolume: true } },
                },
            });
            const parseNum = (v) => {
                if (v == null || v === '')
                    return null;
                const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
                return Number.isFinite(n) ? n : null;
            };
            let remainderCount = 0;
            for (const r of rows) {
                const rem = parseNum(r.remainder);
                if (rem != null) {
                    if (rem > 0)
                        remainderCount += 1;
                    continue;
                }
                const vol = parseNum(r.mtrList?.vl06?.supplyVolume);
                const shipped = parseNum(r.discarded) || 0;
                if (vol != null && vol - shipped > 0)
                    remainderCount += 1;
            }
            const zapId = a.zapiska?.id;
            let storages = [];
            if (zapId) {
                const raw = await this.mtrRepo
                    .createQueryBuilder('m')
                    .leftJoin('m.vl06', 'v')
                    .select('DISTINCT v.storage', 'storage')
                    .where('m.zapiskiId = :id', { id: zapId })
                    .andWhere('v.storage IS NOT NULL')
                    .getRawMany();
                storages = raw.map((r) => r.storage).filter(Boolean);
            }
            const waves = await this.transportRepo.count({
                where: { application: { id: a.id } },
            });
            const lastTransport = await this.transportRepo.findOne({
                where: { application: { id: a.id } },
                order: { id: 'DESC' },
            });
            const decs = await this.decRepo.find({
                where: { application: { id: a.id }, accepted: false },
                select: { reason: true },
            });
            const lastmileReasons = (decs || [])
                .map((d) => (d?.reason || '').trim())
                .filter(Boolean);
            result.push({
                application: {
                    id: a.id,
                    status: a.status,
                    createdAt: a.createdAt,
                    updatedAt: a.updatedAt,
                },
                zapiska: a.zapiska
                    ? {
                        id: a.zapiska.id,
                        status: a.zapiska.status,
                        createdAt: a.zapiska.createdAt,
                        user: a.zapiska.user
                            ? {
                                id: a.zapiska.user.id,
                                email: a.zapiska.user.email ?? null,
                                surname: a.zapiska.user.surname ?? null,
                                firstName: a.zapiska.user.firstName ?? null,
                                lastName: a.zapiska.user.lastName ?? null,
                            }
                            : null,
                    }
                    : null,
                rowsCount,
                remainderCount,
                storages,
                transport: lastTransport
                    ? {
                        id: lastTransport.id,
                        status: lastTransport.status,
                        rejectReason: lastTransport.rejectReason,
                        wave: lastTransport.wave ?? null,
                    }
                    : null,
                waves,
                lastmile: {
                    hasRejected: lastmileReasons.length > 0,
                    reasons: lastmileReasons,
                },
            });
        }
        return { success: true, data: result };
    }
    async update(id, updateApplicationDto) {
        const app = await this.appRepo.findOne({ where: { id } });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        Object.assign(app, updateApplicationDto);
        return await this.appRepo.save(app);
    }
    async remove(id) {
        return this.appRepo.manager.transaction(async (manager) => {
            const appRepo = manager.getRepository(application_entity_1.Application);
            const zapRepo = manager.getRepository(zapiski_entity_1.Zapiski);
            const mtrRepo = manager.getRepository(mtr_list_entity_1.MtrList);
            const vl06Repo = manager.getRepository(vl06_entity_1.Vl06);
            const app = await appRepo.findOne({
                where: { id },
                relations: { zapiska: true },
            });
            if (!app)
                throw new common_1.NotFoundException('Application not found');
            const zapiskaId = app.zapiska?.id;
            let vl06Ids = [];
            if (zapiskaId) {
                const raw = await mtrRepo
                    .createQueryBuilder('m')
                    .select('DISTINCT m.vl06', 'vl06')
                    .where('m.zapiskiId = :id', { id: zapiskaId })
                    .getRawMany();
                vl06Ids = raw.map((r) => r.vl06).filter(Boolean);
            }
            if (zapiskaId) {
                await zapRepo.update({ id: zapiskaId }, { status: 30 });
            }
            if (vl06Ids.length) {
                await vl06Repo.update({ id: (0, typeorm_2.In)(vl06Ids) }, { status: 30 });
            }
            await appRepo.delete({ id });
            return {
                success: true,
                data: {
                    id,
                    zapiskaId: zapiskaId ?? null,
                    updatedStatuses: { zapiska: 30, vl06: 30, vl06Count: vl06Ids.length },
                },
            };
        });
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(application_entity_1.Application)),
    __param(1, (0, typeorm_1.InjectRepository)(zapiski_entity_1.Zapiski)),
    __param(2, (0, typeorm_1.InjectRepository)(table_application_entity_1.TableApplication)),
    __param(3, (0, typeorm_1.InjectRepository)(mtr_list_entity_1.MtrList)),
    __param(4, (0, typeorm_1.InjectRepository)(transport_entity_1.Transport)),
    __param(5, (0, typeorm_1.InjectRepository)(lastmile_entity_1.LastmileDecision)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map