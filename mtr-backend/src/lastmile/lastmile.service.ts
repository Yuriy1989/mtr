import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

// ✅ безопасный импорт dayjs под CJS/ESM
import * as dayjsLib from 'dayjs';
const dayjs: any = (dayjsLib as any).default || (dayjsLib as any);

import { Application } from 'src/applications/entities/application.entity';
import { TableApplication } from 'src/table-applications/entities/table-application.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { LastmileDecision } from './entities/lastmile.entity';

const STATUS = {
  APP_SENT: 50,
  APP_PARTIAL: 60,
  DONE: 100,
  DONE_PARTIAL: 110,
  DONE_PARTIAL_WITH_ISSUES: 115,
  DONE_WITH_ISSUES: 120,
  NOT_ACCEPTED: 130,
};

@Injectable()
export class LastmileService {
  constructor(
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(TableApplication)
    private readonly rowRepo: Repository<TableApplication>,
    @InjectRepository(Zapiski)
    private readonly zapRepo: Repository<Zapiski>,
    @InjectRepository(MtrList)
    private readonly mtrRepo: Repository<MtrList>,
    @InjectRepository(Vl06)
    private readonly vl06Repo: Repository<Vl06>,
    @InjectRepository(LastmileDecision)
    private readonly decRepo: Repository<LastmileDecision>,
  ) {}

  private parseNum(v: any): number | null {
    if (v == null || v === '') return null;
    const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  // ----- PENDING LIST -----
  async listPending({ days = 7, status }: { days?: number; status?: number }) {
    const from = dayjs().subtract(days, 'day').toDate();

    // Приложения 50/60 за период
    const apps = await this.appRepo.find({
      where: {
        status: status ?? In([STATUS.APP_SENT, STATUS.APP_PARTIAL]),
      } as any,
      relations: { zapiska: true },
      order: { id: 'DESC' },
    });

    const data = apps
      .filter((a) => a.createdAt >= from)
      .map((a) => ({
        id: a.id, // applicationId
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

  // ----- ACCEPTANCE CARD (editable) -----
  async getAcceptance(appId: number) {
    const app = await this.appRepo.findOne({
      where: { id: appId },
      relations: { zapiska: true },
    });
    if (!app) throw new NotFoundException('Application not found');

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
        supplyVolume:
          typeof v?.supplyVolume === 'number' ? v.supplyVolume : null,
        shippedQty: this.parseNum((r as any).discarded),
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

  // ----- ACCEPT (save decisions & update statuses) -----
  async accept(
    appId: number,
    decisions: Array<{
      tableApplicationRowId: number;
      accepted: boolean;
      reason?: string | null;
    }>,
  ) {
    const app = await this.appRepo.findOne({
      where: { id: appId },
      relations: { zapiska: true },
    });
    if (!app) throw new NotFoundException('Application not found');

    const ids = decisions.map((d) => d.tableApplicationRowId);
    const rows = await this.rowRepo.find({
      where: { id: In(ids) },
      relations: { mtrList: { vl06: true } },
    });
    if (rows.length !== decisions.length) {
      throw new BadRequestException('Некоторые позиции не найдены');
    }

    // Upsert решений
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
          application: { id: appId } as any,
          row: { id: d.tableApplicationRowId } as any,
          accepted: !!d.accepted,
          reason: d.reason?.trim() || null,
        });
      } else {
        rec.accepted = !!d.accepted;
        rec.reason = d.reason?.trim() || null;
      }
      await this.decRepo.save(rec);
    }

    const allAccepted = decisions.every((d) => d.accepted === true);
    const hasRejected = decisions.some((d) => d.accepted === false);

    // Обновление VL06
    for (const r of rows) {
      const dec = decisions.find((d) => d.tableApplicationRowId === r.id);
      const v = r.mtrList?.vl06;
      if (!v) continue;

      const shipped = this.parseNum((r as any).discarded) || 0;
      const vol = typeof v.supplyVolume === 'number' ? v.supplyVolume : null;

      if (dec?.accepted) {
        if (vol != null && shipped >= vol) {
          await this.vl06Repo.update({ id: v.id }, { status: STATUS.DONE });
        } else {
          await this.vl06Repo.update(
            { id: v.id },
            { status: STATUS.DONE_PARTIAL },
          );
        }
      } else {
        await this.vl06Repo.update(
          { id: v.id },
          { status: STATUS.NOT_ACCEPTED },
        );
      }
    }

    // Итоговый статус приложения/СЗ
    let finalStatus: number;
    if (hasRejected) {
      finalStatus = allAccepted
        ? STATUS.DONE_WITH_ISSUES
        : STATUS.DONE_PARTIAL_WITH_ISSUES;
    } else {
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

  // ----- REGISTRY LIST -----
  async registry(days = 30) {
    const from = dayjs().subtract(days, 'day').toDate();

    const apps = await this.appRepo.find({
      where: {
        status: In([
          STATUS.DONE,
          STATUS.DONE_PARTIAL,
          STATUS.DONE_PARTIAL_WITH_ISSUES,
          STATUS.DONE_WITH_ISSUES,
        ]),
      } as any,
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

  // ----- REGISTRY DETAIL (read-only view) -----
  async registryDetail(appId: number) {
    const app = await this.appRepo.findOne({
      where: { id: appId },
      relations: { zapiska: true },
    });
    if (!app) throw new NotFoundException('Application not found');

    const rows = await this.rowRepo.find({
      where: { listApp: { id: appId } },
      relations: { mtrList: { vl06: true } },
      order: { id: 'ASC' },
    });

    const decs = await this.decRepo.find({
      where: { application: { id: appId } },
      relations: { row: true },
    });
    const byRow = new Map<number, LastmileDecision>();
    decs.forEach((d) => byRow.set(d.row.id, d));

    const shaped = rows.map((r) => {
      const v = r.mtrList?.vl06;
      const d = byRow.get(r.id) || null;
      return {
        id: r.id,
        nameMTR: v?.nameMTR ?? '',
        storage: v?.storage ?? '',
        supplyVolume:
          typeof v?.supplyVolume === 'number' ? v.supplyVolume : null,
        shippedQty: this.parseNum((r as any).discarded),
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
}
