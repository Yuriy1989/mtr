import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { TableApplication } from './entities/table-application.entity';
import { CreateTableApplicationDto } from './dto/create-table-application.dto';
import { UpdateTableApplicationDto } from './dto/update-table-application.dto';
import { UpsertAppendix3Dto } from './dto/upsert-app3.dto';
import { Application } from 'src/applications/entities/application.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { TableApplicationHistory } from './entities/table-application-history.entity';

@Injectable()
export class TableApplicationsService {
  constructor(
    @InjectRepository(TableApplication)
    private readonly appRowRepo: Repository<TableApplication>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(Zapiski)
    private readonly zapRepo: Repository<Zapiski>,
    @InjectRepository(Vl06)
    private readonly vl06Repo: Repository<Vl06>,
    @InjectRepository(MtrList)
    private readonly mtrRepo: Repository<MtrList>,
    @InjectRepository(TableApplicationHistory)
    private readonly historyRepo: Repository<TableApplicationHistory>,
  ) {}

  async create(dto: CreateTableApplicationDto) {
    const app = this.appRowRepo.create(dto as DeepPartial<TableApplication>);
    return this.appRowRepo.save(app);
  }

  async update(id: number, dto: UpdateTableApplicationDto) {
    const app = await this.appRowRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('TableApplication not found');

    // Сохраняем историю, если есть изменения значимых полей
    const snapshotFields: (keyof TableApplication)[] = [
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
    const changed = snapshotFields.some(
      (k) => (app as any)[k] !== (dto as any)[k],
    );
    if (changed) {
      const snap: any = {};
      snapshotFields.forEach((k) => (snap[k] = (app as any)[k] ?? null));
      await this.historyRepo.save(
        this.historyRepo.create({
          tableApplication: app,
          snapshot: snap,
        }),
      );
    }

    Object.assign(app, dto);
    return this.appRowRepo.save(app);
  }

  /**
   * Идемпотентное создание/обновление Приложения №3 для конкретной служебки.
   * Гарантирует: 1 application на 1 zapiska, без дублей строк.
   * Возвращает linkId = application.id
   */
  async upsertApp3(dto: UpsertAppendix3Dto) {
    const { zapiskaId, userId, items = [] } = dto;
    if (!zapiskaId) throw new ConflictException('zapiskaId is required');

    return this.appRowRepo.manager.transaction(async (manager) => {
      const zapRepo = manager.getRepository(Zapiski);
      const applicationRepo = manager.getRepository(Application);
      const appRowRepo = manager.getRepository(TableApplication);
      const mtrRepo = manager.getRepository(MtrList);
      const vl06Repo = manager.getRepository(Vl06);
      const historyRepo = manager.getRepository(TableApplicationHistory);

      const zap = await zapRepo.findOne({ where: { id: zapiskaId } });
      if (!zap) throw new NotFoundException(`Записка ${zapiskaId} не найдена`);

      // 1) application (user + статус 40)
      let app = await applicationRepo.findOne({
        where: { zapiska: { id: zapiskaId } },
        relations: { zapiska: true, user: true },
      });
      if (!app) {
        app = applicationRepo.create({
          zapiska: zap,
          user: userId ? ({ id: userId } as any) : null,
          status: 40,
        });
      } else {
        if (!app.user && userId) app.user = { id: userId } as any;
        app.status = 40;
      }
      app = await applicationRepo.save(app);

      // 2) апсертим строки по mtrListId
      for (const it of items) {
        const mid = Number(it.mtrListId);
        if (!Number.isFinite(mid) || mid <= 0) continue;

        const mtr = await mtrRepo.findOne({
          where: { id: mid },
          relations: { vl06: true },
        });
        if (!mtr) continue;

        if (mtr.vl06?.status === 50) {
          // Полностью отправленная позиция — не трогаем
          continue;
        }

        let row = await appRowRepo.findOne({
          where: { listApp: { id: app.id }, mtrList: { id: mid } },
        });

        const patch: DeepPartial<TableApplication> = {
          listApp: app,
          mtrList: mtr,
          dateRequest: it.dateRequest ?? null,
          dateShipment: it.dateShipment ?? null,
          format: it.format ?? null,
          transportNumber: it.transportNumber ?? null,
          transit: it.transit ?? '',
          dateM11: it.dateM11 ?? null,
          numberM11: it.numberM11 ?? '',
          discarded:
            typeof it.shippedQty === 'number'
              ? String(it.shippedQty)
              : it.shippedQty == null
                ? null
                : String(it.shippedQty),
          remainder:
            it.remainder == null
              ? row?.remainder ?? null
              : typeof it.remainder === 'number'
                ? String(it.remainder)
                : String(it.remainder),
          addNote: it.note ?? '',
        };

        if (!row) {
          row = appRowRepo.create(patch);
        } else {
          // Снимок истории перед изменением
          const snapshotFields: (keyof TableApplication)[] = [
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
          const changed = snapshotFields.some(
            (k) => (row as any)[k] !== (patch as any)[k],
          );
          if (changed) {
            const snap: any = {};
            snapshotFields.forEach((k) => (snap[k] = (row as any)[k] ?? null));
            await historyRepo.save(
              historyRepo.create({
                tableApplication: row,
                snapshot: snap,
              }),
            );
          }
          Object.assign(row, patch);
        }
        await appRowRepo.save(row);
      }

      // 3) статусы = 40 для zapiski и всех VL06 из служебки
      if (zap.status !== 40)
        await zapRepo.update({ id: zapiskaId }, { status: 40 });

      const raw = await mtrRepo
        .createQueryBuilder('m')
        .select('DISTINCT m.vl06', 'vl06')
        .where('m.zapiskiId = :id', { id: zapiskaId })
        .getRawMany<{ vl06: number }>();

      const vl06Ids = raw.map((r) => r.vl06).filter(Boolean);
      if (vl06Ids.length) {
        await vl06Repo.update({ id: In(vl06Ids) }, { status: 40 });
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

  async getByZapiska(zapiskaId: number) {
    const zap = await this.zapRepo.findOne({ where: { id: zapiskaId } });
    if (!zap) throw new NotFoundException('Записка не найдена');

    const app = await this.applicationRepo.findOne({
      where: { zapiska: { id: zapiskaId } },
    });
    if (!app) return { success: true, data: null };

    const rows = await this.appRowRepo.find({
      where: { listApp: { id: app.id } },
      relations: { mtrList: { vl06: true } },
      order: { id: 'ASC' },
    });

    return { success: true, data: { application: app, rows } };
  }

  // NEW: история одной строки
  async getRowHistory(rowId: number) {
    const row = await this.appRowRepo.findOne({ where: { id: rowId } });
    if (!row) throw new NotFoundException('TableApplication row not found');

    return this.historyRepo.find({
      where: { tableApplication: { id: rowId } as any },
      order: { id: 'DESC' },
    });
  }
}
