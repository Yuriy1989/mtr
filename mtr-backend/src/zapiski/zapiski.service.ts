// src/zapiski/zapiski.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Zapiski } from './entities/zapiski.entity';
import { In, Repository } from 'typeorm';
import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { Application } from 'src/applications/entities/application.entity';
import { TableApplication } from 'src/table-applications/entities/table-application.entity';
import { DimensionCategory } from 'src/dimensions/entities/dimension-category.entity';
import { TransportsService } from 'src/transports/transports.service';
import { Dimension } from 'src/dimensions/entities/dimension.entity';

@Injectable()
export class ZapiskiService {
  constructor(
    @InjectRepository(Zapiski)
    private tableZapiskiRepository: Repository<Zapiski>,
    @InjectRepository(MtrList)
    private readonly mtrRepo: Repository<MtrList>,
    @InjectRepository(Vl06)
    private readonly vl06Repo: Repository<Vl06>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(TableApplication)
    private readonly appRowRepo: Repository<TableApplication>,
    private readonly transports: TransportsService, // для создания заявок
  ) {}

  async create(createZapiskiDto: any) {
    const { id: userId, region } = createZapiskiDto || {};
    const newZapiski = this.tableZapiskiRepository.create({
      user: userId as any,
      status: 20,
      region: Array.isArray(region) ? region : null,
    });
    const data = await this.tableZapiskiRepository.save(newZapiski);
    return data;
  }

  async findAll(range?: { from?: string; to?: string }) {
    const qb = this.tableZapiskiRepository
      .createQueryBuilder('z')
      .leftJoinAndSelect('z.user', 'user')
      .loadRelationCountAndMap('z.mtrCount', 'z.mtrList')
      .orderBy('z.createdAt', 'DESC');

    if (range?.from) {
      const from = new Date(range.from);
      if (!isNaN(from.getTime())) qb.andWhere('z.createdAt >= :from', { from });
    }
    if (range?.to) {
      const to = new Date(range.to);
      if (!isNaN(to.getTime())) qb.andWhere('z.createdAt <= :to', { to });
    }

    const list = await qb.getMany();
    return list;
  }

  async findOne(id: number) {
    const zapiska = await this.tableZapiskiRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!zapiska) throw new NotFoundException('Записка не найдена');
    return zapiska;
  }

  update(id: number, updateZapiskiDto: any) {
    return this.tableZapiskiRepository.update({ id }, updateZapiskiDto);
  }

  async remove(id: number) {
    return this.tableZapiskiRepository.manager.transaction(async (manager) => {
      const zapRepo = manager.getRepository(Zapiski);
      const mtrRepo = manager.getRepository(MtrList);
      const vl06Repo = manager.getRepository(Vl06);

      const zap = await zapRepo.findOne({
        where: { id },
        select: { id: true },
      });
      if (!zap) throw new NotFoundException('Записка не найдена');

      const raw = await mtrRepo
        .createQueryBuilder('m')
        .select('DISTINCT m.vl06', 'vl06')
        .where('m.zapiskiId = :id', { id })
        .getRawMany<{ vl06: number }>();

      const vl06Ids = raw.map((r) => r.vl06).filter(Boolean);

      if (vl06Ids.length) {
        await vl06Repo
          .createQueryBuilder()
          .update(Vl06)
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

  async sendToWork(id: number) {
    return this.tableZapiskiRepository.manager.transaction(async (manager) => {
      const zapRepo = manager.getRepository(Zapiski);
      const mtrRepo = manager.getRepository(MtrList);
      const vl06Repo = manager.getRepository(Vl06);

      const zap = await zapRepo.findOne({
        where: { id },
        select: { id: true, status: true },
      });
      if (!zap) throw new NotFoundException('Записка не найдена');
      if (zap.status === 30) {
        return { id, already: true, updatedVl06: 0 };
      }

      const raw = await mtrRepo
        .createQueryBuilder('m')
        .select('DISTINCT m.vl06', 'vl06')
        .where('m.zapiskiId = :id', { id })
        .getRawMany<{ vl06: number }>();
      const vl06Ids = raw.map((r) => r.vl06).filter(Boolean);

      if (vl06Ids.length) {
        await vl06Repo.update({ id: In(vl06Ids) }, { status: 30 });
      }

      await zapRepo.update({ id }, { status: 30 });

      return { id, updatedVl06: vl06Ids.length };
    });
  }

  /**
   * Отправка (без новой служебки) с поддержкой частичных отгрузок.
   * ВНИМАНИЕ: эндпоинт называется /send50 исторически, но теперь:
   *  - статусы VL06 расставляются: 50 (полностью), 60 (частично), 40 (без отгрузки)
   *  - статус Application: 50 (все полные) / 60 (частично) / 40 (нет отгрузки)
   *  - статус Zapiski: аналогично Application
   *  - создается НОВАЯ заявка на транспорт (Опция B, волна N)
   */
  // src/zapiski/zapiski.service.ts
  async sendToSent(id: number) {
    return this.tableZapiskiRepository.manager.transaction(async (manager) => {
      const zapRepo = manager.getRepository(Zapiski);
      const mtrRepo = manager.getRepository(MtrList);
      const vl06Repo = manager.getRepository(Vl06);
      const appRepo = manager.getRepository(Application);
      const appRowRepo = manager.getRepository(TableApplication);

      const zap = await zapRepo.findOne({
        where: { id },
        select: { id: true, status: true },
      });
      if (!zap) throw new NotFoundException('Записка не найдена');

      const app = await appRepo.findOne({ where: { zapiska: { id } } });
      if (!app)
        throw new NotFoundException('Нет Приложения №3 для этой служебки');

      const rows = await appRowRepo.find({
        where: { listApp: { id: app.id } },
        relations: { mtrList: { vl06: true } },
        order: { id: 'ASC' },
      });

      const full: number[] = [];
      const partial: number[] = [];
      const untouched: number[] = [];
      let shippedAny = false;

      for (const r of rows) {
        const v = r.mtrList?.vl06;
        if (!v?.id) continue;
        const supply =
          typeof v.supplyVolume === 'number' ? v.supplyVolume : null;
        const shippedRaw = r.discarded;
        const shipped =
          shippedRaw != null && shippedRaw !== ''
            ? Number(String(shippedRaw).replace(/\s/g, '').replace(',', '.'))
            : 0;

        if (shipped > 0) shippedAny = true;

        if (supply != null && supply > 0) {
          if (shipped >= supply) full.push(v.id);
          else if (shipped > 0 && shipped < supply) partial.push(v.id);
          else untouched.push(v.id);
        } else {
          if (shipped > 0) partial.push(v.id);
          else untouched.push(v.id);
        }
      }

      // все vl06 из служебки
      const rawAll = await mtrRepo
        .createQueryBuilder('m')
        .select('DISTINCT m.vl06', 'vl06')
        .where('m.zapiskiId = :id', { id })
        .getRawMany<{ vl06: number }>();
      const allVl06 = rawAll.map((r) => r.vl06).filter(Boolean);

      // добиваем те, что не попали в rows
      const known = new Set([...full, ...partial, ...untouched]);
      for (const vid of allVl06) if (!known.has(vid)) untouched.push(vid);

      if (full.length) await vl06Repo.update({ id: In(full) }, { status: 50 });
      if (partial.length)
        await vl06Repo.update({ id: In(partial) }, { status: 60 });
      if (untouched.length)
        await vl06Repo.update({ id: In(untouched) }, { status: 40 });

      const total = allVl06.length;
      const fullCount = full.length;

      // Статусы приложения и служебки
      let appStatus = 40;
      if (fullCount === total && total > 0) appStatus = 50;
      else if (shippedAny) appStatus = 60;

      let zapStatus = 40;
      if (fullCount === total && total > 0) zapStatus = 50;
      else if (shippedAny) zapStatus = 60;

      // ВАЖНО: блокируем отправку до решения по заявке (approve/reject снимет блок)
      await appRepo.update(
        { id: app.id },
        { status: appStatus, sendLock: true },
      );
      await zapRepo.update({ id }, { status: zapStatus });

      // Новая заявка (волна) — только по реально отгруженным строкам
      await this.transports.createNewFromApplication(app.id);

      return { id, updatedVl06: allVl06.length, status: appStatus };
    });
  }

  async getStatsForZapiska(id: number) {
    // забираем все mtrList + vl06
    const rows = await this.tableZapiskiRepository.manager
      .getRepository(MtrList)
      .find({ where: { zapiska: { id } as any }, relations: { vl06: true } });
    // подтянем человекочитаемые имена категорий
    const catList = await this.tableZapiskiRepository.manager
      .getRepository(DimensionCategory)
      .find();
    const catNameByKey = new Map(
      catList.map((c) => [c.key, c.nameRu || c.key]),
    );

    const dimRepo =
      this.tableZapiskiRepository.manager.getRepository(Dimension);

    const dims = await dimRepo.find({ relations: { aliases: true } });

    const byUnit = new Map<string, number>(); // как указано
    const byCategory = new Map<
      string,
      { total: number; baseUnit?: string | null }
    >();

    const lower = (s: any) => (s == null ? '' : String(s).trim().toLowerCase());

    // быстрые карты
    const byCode = new Map<string, Dimension>();
    const byAlias = new Map<string, Dimension>();
    for (const d of dims) {
      if (d.code) byCode.set(lower(d.code), d);
      for (const a of d.aliases || []) {
        if (a?.text) byAlias.set(lower(a.text), d);
      }
      // nameDimension тоже как алиас
      if (d.nameDimension) byAlias.set(lower(d.nameDimension), d);
    }

    function resolveDimension(raw: string): Dimension | null {
      const s = lower(raw);
      if (byCode.has(s)) return byCode.get(s)!;
      if (byAlias.has(s)) return byAlias.get(s)!;
      return null;
    }

    for (const r of rows) {
      const v = r.vl06;
      const unitRaw = v?.basic;
      const qty = typeof v?.supplyVolume === 'number' ? v!.supplyVolume : 0;

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

    const toObject = (m: Map<any, any>) => {
      const o: any = {};
      for (const [k, v] of m.entries()) o[k] = v;
      return o;
    };

    return {
      byUnit: toObject(byUnit),
      byCategory: Object.fromEntries(
        Object.entries(toObject(byCategory)).map(([catKey, val]: any) => [
          catKey,
          { ...val, categoryName: catNameByKey.get(catKey) || catKey },
        ]),
      ),
    };
  }

  // Историческая ручка /:id/send50 — теперь проксируем на новую логику
  async sendToSent50(id: number) {
    return this.sendToSent(id);
  }
}
