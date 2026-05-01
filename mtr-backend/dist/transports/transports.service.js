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
exports.TransportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transport_entity_1 = require("./entities/transport.entity");
const application_entity_1 = require("../applications/entities/application.entity");
const table_application_entity_1 = require("../table-applications/entities/table-application.entity");
const mtr_list_entity_1 = require("../mtr-list/entities/mtr-list.entity");
const vl06_entity_1 = require("../vl06/entities/vl06.entity");
const zapiski_entity_1 = require("../zapiski/entities/zapiski.entity");
let TransportsService = class TransportsService {
    constructor(trRepo, appRepo, appRowRepo, mtrRepo, vl06Repo, zapRepo) {
        this.trRepo = trRepo;
        this.appRepo = appRepo;
        this.appRowRepo = appRowRepo;
        this.mtrRepo = mtrRepo;
        this.vl06Repo = vl06Repo;
        this.zapRepo = zapRepo;
    }
    parseNum(v) {
        if (v == null || v === '')
            return null;
        const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
        return Number.isFinite(n) ? n : null;
    }
    async hasRemainders(appId) {
        const rows = await this.appRowRepo.find({
            where: { listApp: { id: appId } },
            relations: { mtrList: { vl06: true } },
            select: {
                id: true,
                discarded: true,
                remainder: true,
                mtrList: { id: true, vl06: { id: true, supplyVolume: true } },
            },
        });
        for (const r of rows) {
            const rem = this.parseNum(r.remainder);
            if (rem != null) {
                if (rem > 0)
                    return true;
                continue;
            }
            const vol = this.parseNum(r.mtrList?.vl06?.supplyVolume);
            const shipped = this.parseNum(r.discarded) || 0;
            if (vol != null && vol - shipped > 0)
                return true;
        }
        return false;
    }
    async buildSnapshot(appId) {
        const app = await this.appRepo.findOne({
            where: { id: appId },
            relations: { zapiska: true },
        });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        const rows = await this.appRowRepo.find({
            where: { listApp: { id: appId } },
            relations: { mtrList: { vl06: true } },
            order: { id: 'ASC' },
        });
        const names = new Set();
        const recipients = new Set();
        const cargo = new Set();
        const storages = new Set();
        let supplySum = 0;
        let shippedSum = 0;
        for (const r of rows) {
            const v = r.mtrList?.vl06;
            if (v?.nameMTR)
                names.add(v.nameMTR);
            if (v?.storage)
                storages.add(v.storage);
            if (typeof v?.supplyVolume === 'number')
                supplySum += v.supplyVolume;
            const disc = this.parseNum(r?.discarded);
            if (disc != null)
                shippedSum += disc;
            if (r?.transit)
                recipients.add(r.transit.trim());
            const f = r?.format
                ? r.format === 'container'
                    ? 'Конт.'
                    : 'Авто'
                : null;
            const tn = r?.transportNumber ? r.transportNumber.trim() : '';
            if (f)
                cargo.add(tn ? `${f} ${tn}` : f);
        }
        const materialsArr = [...names];
        const materialsSummary = materialsArr.length <= 3
            ? materialsArr.join(', ')
            : `${materialsArr.length} позиций: ${materialsArr
                .slice(0, 3)
                .join(', ')}…`;
        return {
            app,
            supplyVolumeTotal: supplySum || null,
            shippedTotal: shippedSum || null,
            recipientsSummary: [...recipients].filter(Boolean).join(', ') || null,
            cargoFormedSummary: [...cargo].filter(Boolean).join('; ') || null,
            materialsSummary: materialsSummary || null,
            storages: [...storages],
        };
    }
    async buildSnapshotForShippedOnly(appId) {
        const app = await this.appRepo.findOne({
            where: { id: appId },
            relations: { zapiska: true },
        });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        const rows = await this.appRowRepo.find({
            where: { listApp: { id: appId } },
            relations: { mtrList: { vl06: true } },
            order: { id: 'ASC' },
        });
        const names = new Set();
        const recipients = new Set();
        const cargo = new Set();
        const storages = new Set();
        let supplySum = 0;
        let shippedSum = 0;
        for (const r of rows) {
            const shipped = this.parseNum(r?.discarded) || 0;
            if (shipped <= 0)
                continue;
            const v = r.mtrList?.vl06;
            if (v?.nameMTR)
                names.add(v.nameMTR);
            if (v?.storage)
                storages.add(v.storage);
            if (typeof v?.supplyVolume === 'number')
                supplySum += v.supplyVolume;
            shippedSum += shipped;
            if (r?.transit)
                recipients.add(r.transit.trim());
            const f = r?.format
                ? r.format === 'container'
                    ? 'Конт.'
                    : 'Авто'
                : null;
            const tn = r?.transportNumber ? r.transportNumber.trim() : '';
            if (f)
                cargo.add(tn ? `${f} ${tn}` : f);
        }
        const materialsArr = [...names];
        const materialsSummary = materialsArr.length <= 3
            ? materialsArr.join(', ')
            : `${materialsArr.length} позиций: ${materialsArr
                .slice(0, 3)
                .join(', ')}…`;
        return {
            app,
            supplyVolumeTotal: supplySum || null,
            shippedTotal: shippedSum || null,
            recipientsSummary: [...recipients].filter(Boolean).join(', ') || null,
            cargoFormedSummary: [...cargo].filter(Boolean).join('; ') || null,
            materialsSummary: materialsSummary || null,
            storages: [...storages],
        };
    }
    async createFromApplication(appId) {
        const snap = await this.buildSnapshot(appId);
        let tr = await this.trRepo.findOne({
            where: { application: { id: appId } },
        });
        if (!tr) {
            tr = this.trRepo.create({ application: { id: appId } });
        }
        Object.assign(tr, {
            status: transport_entity_1.TransportStatus.PENDING,
            rejectReason: null,
            supplyVolumeTotal: snap.supplyVolumeTotal,
            shippedTotal: snap.shippedTotal,
            recipientsSummary: snap.recipientsSummary,
            cargoFormedSummary: snap.cargoFormedSummary,
            materialsSummary: snap.materialsSummary,
            storages: snap.storages,
        });
        return this.trRepo.save(tr);
    }
    async createNewFromApplication(appId) {
        const snap = await this.buildSnapshotForShippedOnly(appId);
        const waves = await this.trRepo.count({
            where: { application: { id: appId } },
        });
        const wave = waves + 1;
        const tr = this.trRepo.create({
            application: { id: appId },
            status: transport_entity_1.TransportStatus.PENDING,
            rejectReason: null,
            wave,
            supplyVolumeTotal: snap.supplyVolumeTotal,
            shippedTotal: snap.shippedTotal,
            recipientsSummary: snap.recipientsSummary,
            cargoFormedSummary: snap.cargoFormedSummary,
            materialsSummary: snap.materialsSummary,
            storages: snap.storages,
        });
        return this.trRepo.save(tr);
    }
    async findAll(status) {
        if (status)
            return this.trRepo.find({ where: { status }, order: { id: 'DESC' } });
        return this.trRepo.find({ order: { id: 'DESC' } });
    }
    async findOne(id) {
        const tr = await this.trRepo.findOne({ where: { id } });
        if (!tr)
            throw new common_1.NotFoundException('Transport request not found');
        return tr;
    }
    async findByApplication(appId) {
        return this.trRepo.find({
            where: { application: { id: appId } },
            order: { id: 'DESC' },
        });
    }
    async approve(id) {
        const tr = await this.findOne(id);
        tr.status = transport_entity_1.TransportStatus.APPROVED;
        tr.rejectReason = null;
        await this.trRepo.save(tr);
        const appId = tr.application?.id;
        if (appId) {
            const hasRest = await this.hasRemainders(appId);
            const nextStatus = hasRest ? 60 : 50;
            await this.appRepo.update({ id: appId }, { status: nextStatus, sendLock: false });
            const app = await this.appRepo.findOne({
                where: { id: appId },
                relations: { zapiska: true },
            });
            const zapId = app?.zapiska?.id;
            if (zapId) {
                await this.zapRepo.update({ id: zapId }, { status: nextStatus });
            }
        }
        return tr;
    }
    async reject(id, reason) {
        if (!reason || !reason.trim()) {
            throw new common_1.BadRequestException('Требуется причина отказа');
        }
        const tr = await this.findOne(id);
        tr.status = transport_entity_1.TransportStatus.REJECTED;
        tr.rejectReason = reason.trim();
        await this.trRepo.save(tr);
        const app = await this.appRepo.findOne({
            where: { id: tr.application.id },
            relations: { zapiska: true },
        });
        if (app) {
            await this.appRepo.update({ id: app.id }, { status: 40, sendLock: false });
            const zapId = app.zapiska?.id;
            if (zapId) {
                const raw = await this.mtrRepo
                    .createQueryBuilder('m')
                    .select('DISTINCT m.vl06', 'vl06')
                    .where('m.zapiskiId = :id', { id: zapId })
                    .getRawMany();
                const vl06Ids = raw.map((r) => r.vl06).filter(Boolean);
                await this.zapRepo.update({ id: zapId }, { status: 40 });
                if (vl06Ids.length) {
                    await this.vl06Repo.update({ id: (0, typeorm_2.In)(vl06Ids) }, { status: 40 });
                }
            }
        }
        return tr;
    }
    async approveForApplication(applicationId) {
        const hasRest = await this.hasRemainders(applicationId);
        const nextStatus = hasRest ? 60 : 50;
        await this.appRepo.update({ id: applicationId }, { status: nextStatus, sendLock: false });
        return { applicationId, status: nextStatus, sendLock: false };
    }
    async rejectForApplication(applicationId, reason) {
        await this.appRepo.update({ id: applicationId }, { status: 40, sendLock: false });
        const app = await this.appRepo.findOne({
            where: { id: applicationId },
            relations: { zapiska: true },
        });
        const zapId = app?.zapiska?.id;
        if (zapId) {
            const raw = await this.mtrRepo
                .createQueryBuilder('m')
                .select('DISTINCT m.vl06', 'vl06')
                .where('m.zapiskiId = :id', { id: zapId })
                .getRawMany();
            const vl06Ids = raw.map((r) => r.vl06).filter(Boolean);
            await this.zapRepo.update({ id: zapId }, { status: 40 });
            if (vl06Ids.length) {
                await this.vl06Repo.update({ id: (0, typeorm_2.In)(vl06Ids) }, { status: 40 });
            }
        }
        return {
            applicationId,
            status: 40,
            sendLock: false,
            reason: reason?.trim() || null,
        };
    }
};
exports.TransportsService = TransportsService;
exports.TransportsService = TransportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transport_entity_1.Transport)),
    __param(1, (0, typeorm_1.InjectRepository)(application_entity_1.Application)),
    __param(2, (0, typeorm_1.InjectRepository)(table_application_entity_1.TableApplication)),
    __param(3, (0, typeorm_1.InjectRepository)(mtr_list_entity_1.MtrList)),
    __param(4, (0, typeorm_1.InjectRepository)(vl06_entity_1.Vl06)),
    __param(5, (0, typeorm_1.InjectRepository)(zapiski_entity_1.Zapiski)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TransportsService);
//# sourceMappingURL=transports.service.js.map