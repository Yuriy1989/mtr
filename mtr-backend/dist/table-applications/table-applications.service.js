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
exports.TableApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const table_application_entity_1 = require("./entities/table-application.entity");
const application_entity_1 = require("../applications/entities/application.entity");
const zapiski_entity_1 = require("../zapiski/entities/zapiski.entity");
const vl06_entity_1 = require("../vl06/entities/vl06.entity");
const mtr_list_entity_1 = require("../mtr-list/entities/mtr-list.entity");
const table_application_history_entity_1 = require("./entities/table-application-history.entity");
let TableApplicationsService = class TableApplicationsService {
    constructor(appRowRepo, applicationRepo, zapRepo, vl06Repo, mtrRepo, historyRepo) {
        this.appRowRepo = appRowRepo;
        this.applicationRepo = applicationRepo;
        this.zapRepo = zapRepo;
        this.vl06Repo = vl06Repo;
        this.mtrRepo = mtrRepo;
        this.historyRepo = historyRepo;
    }
    async create(dto) {
        const app = this.appRowRepo.create(dto);
        return this.appRowRepo.save(app);
    }
    async update(id, dto) {
        const app = await this.appRowRepo.findOne({ where: { id } });
        if (!app)
            throw new common_1.NotFoundException('TableApplication not found');
        const snapshotFields = [
            'dateRequest',
            'dateShipment',
            'format',
            'transportNumber',
            'discarded',
            'remainder',
            'transit',
            'numberM11',
            'dateM11',
            'addNote',
        ];
        const changed = snapshotFields.some((k) => app[k] !== dto[k]);
        if (changed) {
            const snap = {};
            snapshotFields.forEach((k) => (snap[k] = app[k] ?? null));
            await this.historyRepo.save(this.historyRepo.create({
                tableApplication: app,
                snapshot: snap,
            }));
        }
        Object.assign(app, dto);
        return this.appRowRepo.save(app);
    }
    async upsertApp3(dto) {
        const { zapiskaId, userId, items = [] } = dto;
        if (!zapiskaId)
            throw new common_1.ConflictException('zapiskaId is required');
        return this.appRowRepo.manager.transaction(async (manager) => {
            const zapRepo = manager.getRepository(zapiski_entity_1.Zapiski);
            const applicationRepo = manager.getRepository(application_entity_1.Application);
            const appRowRepo = manager.getRepository(table_application_entity_1.TableApplication);
            const mtrRepo = manager.getRepository(mtr_list_entity_1.MtrList);
            const vl06Repo = manager.getRepository(vl06_entity_1.Vl06);
            const historyRepo = manager.getRepository(table_application_history_entity_1.TableApplicationHistory);
            const zap = await zapRepo.findOne({ where: { id: zapiskaId } });
            if (!zap)
                throw new common_1.NotFoundException(`Записка ${zapiskaId} не найдена`);
            let app = await applicationRepo.findOne({
                where: { zapiska: { id: zapiskaId } },
                relations: { zapiska: true, user: true },
            });
            if (!app) {
                app = applicationRepo.create({
                    zapiska: zap,
                    user: userId ? { id: userId } : null,
                    status: 40,
                });
            }
            else {
                if (!app.user && userId)
                    app.user = { id: userId };
                app.status = 40;
            }
            app = await applicationRepo.save(app);
            for (const it of items) {
                const mid = Number(it.mtrListId);
                if (!Number.isFinite(mid) || mid <= 0)
                    continue;
                const mtr = await mtrRepo.findOne({
                    where: { id: mid },
                    relations: { vl06: true },
                });
                if (!mtr)
                    continue;
                if (mtr.vl06?.status === 50) {
                    continue;
                }
                let row = await appRowRepo.findOne({
                    where: { listApp: { id: app.id }, mtrList: { id: mid } },
                });
                const patch = {
                    listApp: app,
                    mtrList: mtr,
                    dateRequest: it.dateRequest ?? null,
                    dateShipment: it.dateShipment ?? null,
                    format: it.format ?? null,
                    transportNumber: it.transportNumber ?? null,
                    transit: it.transit ?? '',
                    dateM11: it.dateM11 ?? null,
                    numberM11: it.numberM11 ?? '',
                    discarded: typeof it.shippedQty === 'number'
                        ? String(it.shippedQty)
                        : it.shippedQty == null
                            ? null
                            : String(it.shippedQty),
                    remainder: it.remainder == null
                        ? row?.remainder ?? null
                        : typeof it.remainder === 'number'
                            ? String(it.remainder)
                            : String(it.remainder),
                    addNote: it.note ?? '',
                };
                if (!row) {
                    row = appRowRepo.create(patch);
                }
                else {
                    const snapshotFields = [
                        'dateRequest',
                        'dateShipment',
                        'format',
                        'transportNumber',
                        'discarded',
                        'remainder',
                        'transit',
                        'numberM11',
                        'dateM11',
                        'addNote',
                    ];
                    const changed = snapshotFields.some((k) => row[k] !== patch[k]);
                    if (changed) {
                        const snap = {};
                        snapshotFields.forEach((k) => (snap[k] = row[k] ?? null));
                        await historyRepo.save(historyRepo.create({
                            tableApplication: row,
                            snapshot: snap,
                        }));
                    }
                    Object.assign(row, patch);
                }
                await appRowRepo.save(row);
            }
            if (zap.status !== 40)
                await zapRepo.update({ id: zapiskaId }, { status: 40 });
            const raw = await mtrRepo
                .createQueryBuilder('m')
                .select('DISTINCT m.vl06', 'vl06')
                .where('m.zapiskiId = :id', { id: zapiskaId })
                .getRawMany();
            const vl06Ids = raw.map((r) => r.vl06).filter(Boolean);
            if (vl06Ids.length) {
                await vl06Repo.update({ id: (0, typeorm_2.In)(vl06Ids) }, { status: 40 });
            }
            return {
                success: true,
                linkId: app.id,
                data: {
                    applicationId: app.id,
                    updated: {
                        applicationStatus: 40,
                        zapiskaStatus: 40,
                        vl06Status: 40,
                        vl06Count: vl06Ids.length,
                    },
                },
            };
        });
    }
    async getByZapiska(zapiskaId) {
        const zap = await this.zapRepo.findOne({ where: { id: zapiskaId } });
        if (!zap)
            throw new common_1.NotFoundException('Записка не найдена');
        const app = await this.applicationRepo.findOne({
            where: { zapiska: { id: zapiskaId } },
        });
        if (!app)
            return { success: true, data: null };
        const rows = await this.appRowRepo.find({
            where: { listApp: { id: app.id } },
            relations: { mtrList: { vl06: true } },
            order: { id: 'ASC' },
        });
        return { success: true, data: { application: app, rows } };
    }
    async getRowHistory(rowId) {
        const row = await this.appRowRepo.findOne({ where: { id: rowId } });
        if (!row)
            throw new common_1.NotFoundException('TableApplication row not found');
        return this.historyRepo.find({
            where: { tableApplication: { id: rowId } },
            order: { id: 'DESC' },
        });
    }
};
exports.TableApplicationsService = TableApplicationsService;
exports.TableApplicationsService = TableApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(table_application_entity_1.TableApplication)),
    __param(1, (0, typeorm_1.InjectRepository)(application_entity_1.Application)),
    __param(2, (0, typeorm_1.InjectRepository)(zapiski_entity_1.Zapiski)),
    __param(3, (0, typeorm_1.InjectRepository)(vl06_entity_1.Vl06)),
    __param(4, (0, typeorm_1.InjectRepository)(mtr_list_entity_1.MtrList)),
    __param(5, (0, typeorm_1.InjectRepository)(table_application_history_entity_1.TableApplicationHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TableApplicationsService);
//# sourceMappingURL=table-applications.service.js.map