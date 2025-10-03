import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DeepPartial, In, Repository } from 'typeorm';
import { Application } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
import { TableApplication } from 'src/table-applications/entities/table-application.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { Transport } from 'src/transports/entities/transport.entity';
import { LastmileDecision } from '../lastmile/entities/lastmile.entity';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,

    @InjectRepository(Zapiski)
    private readonly zapRepo: Repository<Zapiski>,

    @InjectRepository(TableApplication)
    private readonly appRowRepo: Repository<TableApplication>,

    @InjectRepository(MtrList)
    private readonly mtrRepo: Repository<MtrList>,

    @InjectRepository(Transport)
    private readonly transportRepo: Repository<Transport>,

    // ← шестой параметр — именно он и должен резолвиться
    @InjectRepository(LastmileDecision)
    private readonly decRepo: Repository<LastmileDecision>,
  ) {}

  async create(dto: CreateApplicationDto): Promise<Application> {
    // (опционально) защита от массива
    if (Array.isArray(dto)) {
      throw new BadRequestException(
        'Expected single CreateApplicationDto, got array',
      );
    }

    const partial: DeepPartial<Application> =
      dto as unknown as DeepPartial<Application>;
    const entity = this.appRepo.create(partial); // <- теперь точно Entity, не массив
    return await this.appRepo.save(entity as Application); // <- и save вернет Application
  }

  async findAll() {
    // при необходимости — добавить пагинацию/фильтры
    return this.appRepo.find({
      relations: { zapiska: true, tableApp: true, user: true },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const app = await this.appRepo.findOne({
      where: { id },
      relations: {
        zapiska: true, // чтобы достать zapiska.id
        user: true,
        tableApp: { mtrList: { vl06: true } }, //сразу видеть строки
      },
    });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  async findAllDetailed(start?: Date | null, end?: Date | null) {
    const whereCreated: any = {};
    if (start && end) {
      whereCreated.createdAt = { $gte: start, $lte: end } as any;
    }

    // TypeORM-стиль (между датами):
    const dateWhere = start && end ? { createdAt: Between(start, end) } : {};

    const apps = await this.appRepo.find({
      where: dateWhere,
      relations: { zapiska: { user: true } },
      order: { id: 'DESC' },
    });

    const result = [];
    for (const a of apps) {
      // Кол-во строк в приложении
      const rowsCount = await this.appRowRepo.count({
        where: { listApp: { id: a.id } },
      });

      // Остатки по строкам (vol - shipped > 0)
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

      const parseNum = (v: any): number | null => {
        if (v == null || v === '') return null;
        const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
        return Number.isFinite(n) ? n : null;
      };

      let remainderCount = 0;
      for (const r of rows) {
        const rem = parseNum((r as any).remainder);
        if (rem != null) {
          if (rem > 0) remainderCount += 1;
          continue;
        }
        const vol = parseNum((r.mtrList?.vl06 as any)?.supplyVolume);
        const shipped = parseNum((r as any).discarded) || 0;
        if (vol != null && vol - shipped > 0) remainderCount += 1;
      }

      // distinct storages по служебке (через mtrList -> vl06.storage)
      const zapId = a.zapiska?.id;
      let storages: string[] = [];
      if (zapId) {
        const raw = await this.mtrRepo
          .createQueryBuilder('m')
          .leftJoin('m.vl06', 'v')
          .select('DISTINCT v.storage', 'storage')
          .where('m.zapiskiId = :id', { id: zapId })
          .andWhere('v.storage IS NOT NULL')
          .getRawMany<{ storage: string }>();
        storages = raw.map((r) => r.storage).filter(Boolean);
      }

      // Последняя заявка + количество волн
      const waves = await this.transportRepo.count({
        where: { application: { id: a.id } },
      });
      const lastTransport = await this.transportRepo.findOne({
        where: { application: { id: a.id } },
        order: { id: 'DESC' },
      });

      // причины отказа на последней миле (если есть непринятые позиции)
      const decs = await this.decRepo.find({
        where: { application: { id: a.id }, accepted: false } as any,
        select: { reason: true }, // тянем только reason
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
                    email: (a.zapiska.user as any).email ?? null,
                    surname: (a.zapiska.user as any).surname ?? null,
                    firstName: (a.zapiska.user as any).firstName ?? null,
                    lastName: (a.zapiska.user as any).lastName ?? null,
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

  async update(
    id: number,
    updateApplicationDto: UpdateApplicationDto,
  ): Promise<Application> {
    const app = await this.appRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    Object.assign(app, updateApplicationDto);
    return await this.appRepo.save(app); // тоже тип Application
  }

  async remove(id: number) {
    return this.appRepo.manager.transaction(async (manager) => {
      const appRepo = manager.getRepository(Application);
      const zapRepo = manager.getRepository(Zapiski);
      const mtrRepo = manager.getRepository(MtrList);
      const vl06Repo = manager.getRepository(Vl06);

      // 0) приложение + служебка
      const app = await appRepo.findOne({
        where: { id },
        relations: { zapiska: true },
      });
      if (!app) throw new NotFoundException('Application not found');

      const zapiskaId = app.zapiska?.id;
      // 1) собрать уникальные VL06 по служебке
      let vl06Ids: number[] = [];
      if (zapiskaId) {
        const raw = await mtrRepo
          .createQueryBuilder('m')
          .select('DISTINCT m.vl06', 'vl06')
          .where('m.zapiskiId = :id', { id: zapiskaId })
          .getRawMany<{ vl06: number }>();
        vl06Ids = raw.map((r) => r.vl06).filter(Boolean);
      }

      // 2) статусы -> 30
      if (zapiskaId) {
        await zapRepo.update({ id: zapiskaId }, { status: 30 });
      }
      if (vl06Ids.length) {
        await vl06Repo.update({ id: In(vl06Ids) }, { status: 30 });
      }

      // 3) удаляем приложение (строки tableApplication удалятся каскадом)
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
}
