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
exports.LastmileService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const dayjsLib = require("dayjs");
const dayjs = dayjsLib.default || dayjsLib;
const application_entity_1 = require("../applications/entities/application.entity");
const table_application_entity_1 = require("../table-applications/entities/table-application.entity");
const zapiski_entity_1 = require("../zapiski/entities/zapiski.entity");
const mtr_list_entity_1 = require("../mtr-list/entities/mtr-list.entity");
const vl06_entity_1 = require("../vl06/entities/vl06.entity");
const lastmile_entity_1 = require("./entities/lastmile.entity");
const STATUS = {
    APP_SENT: 50,
    APP_PARTIAL: 60,
    DONE: 100,
    DONE_PARTIAL: 110,
    DONE_PARTIAL_WITH_ISSUES: 115,
    DONE_WITH_ISSUES: 120,
    NOT_ACCEPTED: 130,
};
let LastmileService = class LastmileService {
    constructor(appRepo, rowRepo, zapRepo, mtrRepo, vl06Repo, decRepo) {
        this.appRepo = appRepo;
        this.rowRepo = rowRepo;
        this.zapRepo = zapRepo;
        this.mtrRepo = mtrRepo;
        this.vl06Repo = vl06Repo;
        this.decRepo = decRepo;
    }
    parseNum(v) {
        if (v == null || v === '')
            return null;
        const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
        return Number.isFinite(n) ? n : null;
    }
    async listPending({ days = 7, status }) {
        const from = dayjs().subtract(days, 'day').toDate();
        const apps = await this.appRepo.find({
            where: {
                status: status ?? (0, typeorm_2.In)([STATUS.APP_SENT, STATUS.APP_PARTIAL]),
            },
            relations: { zapiska: true },
            order: { id: 'DESC' },
        });
        const data = apps
            .filter((a) => a.createdAt >= from)
            .map((a) => ({
            id: a.id,
            appId: a.id,
            zapiskaId: a.zapiska?.id ?? null,
            status: a.status,
            createdAt: a.createdAt,
            appCreatedAt: a.createdAt,
            zapiskaCreatedAt: a.zapiska?.createdAt ?? null,
            shippedCount: 0,
        }));
        return { success: true, data };
    }
    async getAcceptance(appId) {
        const app = await this.appRepo.findOne({
            where: { id: appId },
            relations: { zapiska: true },
        });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        const rows = await this.rowRepo.find({
            where: { listApp: { id: appId } },
            relations: { mtrList: { vl06: true } },
            order: { id: 'ASC' },
        });
        const shaped = rows.map((r) => {
            const v = r.mtrList?.vl06;
            return {
                id: r.id,
                nameMTR: v?.nameMTR ?? '',
                storage: v?.storage ?? '',
                supplyVolume: typeof v?.supplyVolume === 'number' ? v.supplyVolume : null,
                shippedQty: this.parseNum(r.discarded),
                transit: r?.transit ?? '',
                format: r?.format ?? null,
                transportNumber: r?.transportNumber ?? '',
                decision: null,
            };
        });
        return {
            success: true,
            data: {
                application: {
                    id: app.id,
                    zapiskaId: app.zapiska?.id ?? null,
                    status: app.status,
                    createdAt: app.createdAt,
                    updatedAt: app.updatedAt,
                },
                rows: shaped,
            },
        };
    }
    async accept(appId, decisions) {
        const app = await this.appRepo.findOne({
            where: { id: appId },
            relations: { zapiska: true },
        });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        const ids = decisions.map((d) => d.tableApplicationRowId);
        const rows = await this.rowRepo.find({
            where: { id: (0, typeorm_2.In)(ids) },
            relations: { mtrList: { vl06: true } },
        });
        if (rows.length !== decisions.length) {
            throw new common_1.BadRequestException('Некоторые позиции не найдены');
        }
        for (const d of decisions) {
            let rec = await this.decRepo.findOne({
                where: {
                    application: { id: appId },
                    row: { id: d.tableApplicationRowId },
                },
                relations: { row: true, application: true },
            });
            if (!rec) {
                rec = this.decRepo.create({
                    application: { id: appId },
                    row: { id: d.tableApplicationRowId },
                    accepted: !!d.accepted,
                    reason: d.reason?.trim() || null,
                });
            }
            else {
                rec.accepted = !!d.accepted;
                rec.reason = d.reason?.trim() || null;
            }
            await this.decRepo.save(rec);
        }
        const allAccepted = decisions.every((d) => d.accepted === true);
        const hasRejected = decisions.some((d) => d.accepted === false);
        for (const r of rows) {
            const dec = decisions.find((d) => d.tableApplicationRowId === r.id);
            const v = r.mtrList?.vl06;
            if (!v)
                continue;
            const shipped = this.parseNum(r.discarded) || 0;
            const vol = typeof v.supplyVolume === 'number' ? v.supplyVolume : null;
            if (dec?.accepted) {
                if (vol != null && shipped >= vol) {
                    await this.vl06Repo.update({ id: v.id }, { status: STATUS.DONE });
                }
                else {
                    await this.vl06Repo.update({ id: v.id }, { status: STATUS.DONE_PARTIAL });
                }
            }
            else {
                await this.vl06Repo.update({ id: v.id }, { status: STATUS.NOT_ACCEPTED });
            }
        }
        let finalStatus;
        if (hasRejected) {
            finalStatus = allAccepted
                ? STATUS.DONE_WITH_ISSUES
                : STATUS.DONE_PARTIAL_WITH_ISSUES;
        }
        else {
            finalStatus = allAccepted ? STATUS.DONE : STATUS.DONE_PARTIAL;
        }
        await this.appRepo.update({ id: appId }, { status: finalStatus });
        const zapId = app.zapiska?.id;
        if (zapId)
            await this.zapRepo.update({ id: zapId }, { status: finalStatus });
        return {
            success: true,
            data: { applicationId: appId, status: finalStatus },
        };
    }
    async registry(days = 30) {
        const from = dayjs().subtract(days, 'day').toDate();
        const apps = await this.appRepo.find({
            where: {
                status: (0, typeorm_2.In)([
                    STATUS.DONE,
                    STATUS.DONE_PARTIAL,
                    STATUS.DONE_PARTIAL_WITH_ISSUES,
                    STATUS.DONE_WITH_ISSUES,
                ]),
            },
            relations: { zapiska: true },
            order: { id: 'DESC' },
        });
        const data = apps
            .filter((a) => a.createdAt >= from)
            .map((a) => ({
            id: a.id,
            appId: a.id,
            applicationCreatedAt: a.createdAt,
            zapiskaId: a.zapiska?.id ?? null,
            zapiskaCreatedAt: a.zapiska?.createdAt ?? null,
            status: a.status,
            updatedAt: a.updatedAt,
            createdAt: a.createdAt,
        }));
        return { success: true, data };
    }
    async registryDetail(appId) {
        const app = await this.appRepo.findOne({
            where: { id: appId },
            relations: { zapiska: true },
        });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        const rows = await this.rowRepo.find({
            where: { listApp: { id: appId } },
            relations: { mtrList: { vl06: true } },
            order: { id: 'ASC' },
        });
        const decs = await this.decRepo.find({
            where: { application: { id: appId } },
            relations: { row: true },
        });
        const byRow = new Map();
        decs.forEach((d) => byRow.set(d.row.id, d));
        const shaped = rows.map((r) => {
            const v = r.mtrList?.vl06;
            const d = byRow.get(r.id) || null;
            return {
                id: r.id,
                nameMTR: v?.nameMTR ?? '',
                storage: v?.storage ?? '',
                supplyVolume: typeof v?.supplyVolume === 'number' ? v.supplyVolume : null,
                shippedQty: this.parseNum(r.discarded),
                transit: r?.transit ?? '',
                format: r?.format ?? null,
                transportNumber: r?.transportNumber ?? '',
                decision: d
                    ? { accepted: d.accepted, reason: d.reason, decidedAt: d.createdAt }
                    : null,
            };
        });
        return {
            success: true,
            data: {
                application: {
                    id: app.id,
                    zapiskaId: app.zapiska?.id ?? null,
                    status: app.status,
                    createdAt: app.createdAt,
                    updatedAt: app.updatedAt,
                },
                rows: shaped,
            },
        };
    }
};
exports.LastmileService = LastmileService;
exports.LastmileService = LastmileService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(application_entity_1.Application)),
    __param(1, (0, typeorm_1.InjectRepository)(table_application_entity_1.TableApplication)),
    __param(2, (0, typeorm_1.InjectRepository)(zapiski_entity_1.Zapiski)),
    __param(3, (0, typeorm_1.InjectRepository)(mtr_list_entity_1.MtrList)),
    __param(4, (0, typeorm_1.InjectRepository)(vl06_entity_1.Vl06)),
    __param(5, (0, typeorm_1.InjectRepository)(lastmile_entity_1.LastmileDecision)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], LastmileService);
//# sourceMappingURL=lastmile.service.js.map