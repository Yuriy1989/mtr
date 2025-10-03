// C:\Server\data\htdocs\umtsik\mtr-backend\src\transports\transports.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transport, TransportStatus } from './entities/transport.entity';
import { Application } from 'src/applications/entities/application.entity';
import { TableApplication } from 'src/table-applications/entities/table-application.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';

@Injectable()
export class TransportsService {
  constructor(
    @InjectRepository(Transport)
    private readonly trRepo: Repository<Transport>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(TableApplication)
    private readonly appRowRepo: Repository<TableApplication>,
    @InjectRepository(MtrList)
    private readonly mtrRepo: Repository<MtrList>,
    @InjectRepository(Vl06)
    private readonly vl06Repo: Repository<Vl06>,
    @InjectRepository(Zapiski)
    private readonly zapRepo: Repository<Zapiski>,
  ) {}

  // ---------- helpers ----------
  private parseNum(v: any): number | null {
    if (v == null || v === '') return null;
    const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  // true, если в приложении остались строки с ненулевым остатком
  private async hasRemainders(appId: number): Promise<boolean> {
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
      // если remainder хранится в строке — используем его
      const rem = this.parseNum((r as any).remainder);
      if (rem != null) {
        if (rem > 0) return true;
        continue;
      }
      // иначе считаем vol - shipped
      const vol = this.parseNum((r.mtrList?.vl06 as any)?.supplyVolume);
      const shipped = this.parseNum((r as any).discarded) || 0;
      if (vol != null && vol - shipped > 0) return true;
    }
    return false;
  }

  // Собрать витрину по приложению (все строки)
  private async buildSnapshot(appId: number) {
    const app = await this.appRepo.findOne({
      where: { id: appId },
      relations: { zapiska: true },
    });
    if (!app) throw new NotFoundException('Application not found');

    const rows = await this.appRowRepo.find({
      where: { listApp: { id: appId } },
      relations: { mtrList: { vl06: true } },
      order: { id: 'ASC' },
    });

    const names = new Set<string>();
    const recipients = new Set<string>();
    const cargo = new Set<string>();
    const storages = new Set<string>();
    let supplySum = 0;
    let shippedSum = 0;

    for (const r of rows) {
      const v = r.mtrList?.vl06;
      if (v?.nameMTR) names.add(v.nameMTR);
      if (v?.storage) storages.add(v.storage);
      if (typeof v?.supplyVolume === 'number') supplySum += v.supplyVolume;

      const disc = this.parseNum(r?.discarded);
      if (disc != null) shippedSum += disc;

      if (r?.transit) recipients.add(r.transit.trim());
      const f = r?.format
        ? r.format === 'container'
          ? 'Конт.'
          : 'Авто'
        : null;
      const tn = r?.transportNumber ? r.transportNumber.trim() : '';
      if (f) cargo.add(tn ? `${f} ${tn}` : f);
    }

    const materialsArr = [...names];
    const materialsSummary =
      materialsArr.length <= 3
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

  // Снимок только по реально отгруженным строкам (shipped > 0)
  private async buildSnapshotForShippedOnly(appId: number) {
    const app = await this.appRepo.findOne({
      where: { id: appId },
      relations: { zapiska: true },
    });
    if (!app) throw new NotFoundException('Application not found');

    const rows = await this.appRowRepo.find({
      where: { listApp: { id: appId } },
      relations: { mtrList: { vl06: true } },
      order: { id: 'ASC' },
    });

    const names = new Set<string>();
    const recipients = new Set<string>();
    const cargo = new Set<string>();
    const storages = new Set<string>();
    let supplySum = 0;
    let shippedSum = 0;

    for (const r of rows) {
      const shipped = this.parseNum(r?.discarded) || 0;
      if (shipped <= 0) continue;

      const v = r.mtrList?.vl06;
      if (v?.nameMTR) names.add(v.nameMTR);
      if (v?.storage) storages.add(v.storage);
      if (typeof v?.supplyVolume === 'number') supplySum += v.supplyVolume;
      shippedSum += shipped;

      if (r?.transit) recipients.add(r.transit.trim());
      const f = r?.format
        ? r.format === 'container'
          ? 'Конт.'
          : 'Авто'
        : null;
      const tn = r?.transportNumber ? r.transportNumber.trim() : '';
      if (f) cargo.add(tn ? `${f} ${tn}` : f);
    }

    const materialsArr = [...names];
    const materialsSummary =
      materialsArr.length <= 3
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

  // ---------- public API ----------

  // Создать/обновить заявку из полного снимка (используется при первой отправке)
  async createFromApplication(appId: number) {
    const snap = await this.buildSnapshot(appId);

    let tr = await this.trRepo.findOne({
      where: { application: { id: appId } },
    });
    if (!tr) {
      tr = this.trRepo.create({ application: { id: appId } as Application });
    }

    Object.assign(tr, {
      status: TransportStatus.PENDING, // 10
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

  // Создать НОВУЮ заявку (волна) только по реально отгружаемым строкам
  async createNewFromApplication(appId: number) {
    const snap = await this.buildSnapshotForShippedOnly(appId);

    // следующая волна = count + 1
    const waves = await this.trRepo.count({
      where: { application: { id: appId } },
    });
    const wave = waves + 1;

    const tr = this.trRepo.create({
      application: { id: appId } as any,
      status: TransportStatus.PENDING, // 10
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

  async findAll(status?: number) {
    if (status)
      return this.trRepo.find({ where: { status }, order: { id: 'DESC' } });
    return this.trRepo.find({ order: { id: 'DESC' } });
  }

  async findOne(id: number) {
    const tr = await this.trRepo.findOne({ where: { id } });
    if (!tr) throw new NotFoundException('Transport request not found');
    return tr;
  }

  async findByApplication(appId: number) {
    return this.trRepo.find({
      where: { application: { id: appId } },
      order: { id: 'DESC' }, // свежие сверху
    });
  }

  // ---- Решения по заявке ----

  // Согласовать: выставляем статус заявки, снимаем блок отправки, и
  // ставим Application.status = 60 (если есть остатки) или 50 (если нет)
  async approve(id: number) {
    const tr = await this.findOne(id);
    tr.status = TransportStatus.APPROVED; // 20
    tr.rejectReason = null;
    await this.trRepo.save(tr);

    const appId = tr.application?.id;
    if (appId) {
      const hasRest = await this.hasRemainders(appId);
      const nextStatus = hasRest ? 60 : 50; // 60 — частично, 50 — полностью

      // Обновляем само приложение
      await this.appRepo.update(
        { id: appId },
        { status: nextStatus, sendLock: false },
      );

      // И ОБЯЗАТЕЛЬНО — связанную служебку
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

  // Не согласовать: откатываем статусы к редактированию и снимаем блок отправки
  async reject(id: number, reason: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Требуется причина отказа');
    }
    const tr = await this.findOne(id);
    tr.status = TransportStatus.REJECTED; // 40
    tr.rejectReason = reason.trim();
    await this.trRepo.save(tr);

    // Откат статусов для возможности правок
    const app = await this.appRepo.findOne({
      where: { id: tr.application.id },
      relations: { zapiska: true },
    });

    if (app) {
      // снимаем блокировку сразу, статус приложения — 40 (редактирование)
      await this.appRepo.update(
        { id: app.id },
        { status: 40, sendLock: false },
      );

      const zapId = app.zapiska?.id;
      if (zapId) {
        const raw = await this.mtrRepo
          .createQueryBuilder('m')
          .select('DISTINCT m.vl06', 'vl06')
          .where('m.zapiskiId = :id', { id: zapId })
          .getRawMany<{ vl06: number }>();
        const vl06Ids = raw.map((r) => r.vl06).filter(Boolean);

        await this.zapRepo.update({ id: zapId }, { status: 40 });
        if (vl06Ids.length) {
          await this.vl06Repo.update({ id: In(vl06Ids) }, { status: 40 });
        }
      }
    }

    return tr;
  }

  // ---- (опционально) операции напрямую по приложению ----

  async approveForApplication(applicationId: number) {
    const hasRest = await this.hasRemainders(applicationId);
    const nextStatus = hasRest ? 60 : 50;
    await this.appRepo.update(
      { id: applicationId },
      { status: nextStatus, sendLock: false },
    );
    return { applicationId, status: nextStatus, sendLock: false };
  }

  async rejectForApplication(applicationId: number, reason?: string) {
    await this.appRepo.update(
      { id: applicationId },
      { status: 40, sendLock: false },
    );

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
        .getRawMany<{ vl06: number }>();
      const vl06Ids = raw.map((r) => r.vl06).filter(Boolean);

      await this.zapRepo.update({ id: zapId }, { status: 40 });
      if (vl06Ids.length) {
        await this.vl06Repo.update({ id: In(vl06Ids) }, { status: 40 });
      }
    }

    return {
      applicationId,
      status: 40,
      sendLock: false,
      reason: reason?.trim() || null,
    };
  }
}
