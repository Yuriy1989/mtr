import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MtrList } from './entities/mtr-list.entity';
import { Repository, DataSource } from 'typeorm';
import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';

@Injectable()
export class MtrListService {
  constructor(
    @InjectRepository(MtrList)
    private mtrList: Repository<MtrList>,
    private dataSource: DataSource,
    @InjectRepository(Zapiski) private readonly zapRepo: Repository<Zapiski>,
  ) {}

  async create(createMtrListDto: any) {
    const createList = await this.mtrList
      .createQueryBuilder()
      .insert()
      .into(MtrList)
      .values(createMtrListDto)
      .execute();
    return createList;
  }

  async findByZapiskaId(zapiskaId: number) {
    const rows = await this.mtrList.find({
      where: { zapiska: { id: zapiskaId } },
      relations: ['vl06'],
      order: { id: 'ASC' },
    });
    return rows;
  }

  async getByZapiskaWithVl06(zapiskaId: number) {
    const zap = await this.zapRepo.findOne({ where: { id: zapiskaId } });
    if (!zap) throw new NotFoundException('Записка не найдена');

    // берём MTR + связанные VL06
    return this.mtrList.find({
      where: { zapiska: { id: zapiskaId } },
      relations: { vl06: true },
      order: { id: 'ASC' },
    });
  }

  findAll() {
    return `This action returns all mtrList`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mtrList`;
  }

  async update(id: number, body: any) {
    // ожидаем { vl06Id, data }, где data может включать repairObjectName
    const res = await this.mtrList.update(body.vl06Id, body.data);
    if (!res.affected)
      throw new NotFoundException(`MtrList ${body.vl06Id} not found`);
    return res;
  }

  async remove(id: number) {
    const res = await this.mtrList.delete({ id });
    if (!res.affected) {
      throw new NotFoundException(`MtrList ${id} not found`);
    }
    return { success: true, id };
  }

  async syncForZapiska(
    zapiskaId: number,
    items: Array<{
      vl06Id: number;
      express?: string;
      note?: string;
      repairObjectName?: string; // NEW
    }>,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(MtrList);
      const vl06Repo = manager.getRepository(Vl06);

      const existing = await repo.find({
        where: { zapiska: { id: zapiskaId } },
        relations: ['vl06'],
        select: { id: true, vl06: { id: true } as any },
      });

      const existingByVl06 = new Map<number, number>();
      for (const row of existing) existingByVl06.set(row.vl06.id, row.id);

      const incomingVl06Ids = new Set(items.map((i) => i.vl06Id));

      const toSave: MtrList[] = items.map((i) => {
        const m = new MtrList();
        const existingId = existingByVl06.get(i.vl06Id);
        if (existingId) m.id = existingId;
        m.express = i.express ?? null;
        m.note = i.note ?? null;
        m.repairObjectName = i.repairObjectName ?? null; // NEW
        (m as any).zapiska = { id: zapiskaId };
        (m as any).vl06 = { id: i.vl06Id };
        return m;
      });

      const removedVl06Ids = existing
        .map((row) => row.vl06.id)
        .filter((id) => !incomingVl06Ids.has(id));

      if (removedVl06Ids.length) {
        await vl06Repo
          .createQueryBuilder()
          .update(Vl06)
          .set({ status: 10 })
          .whereInIds(removedVl06Ids)
          .execute();

        await repo
          .createQueryBuilder()
          .delete()
          .where('zapiskiId = :zapiskaId', { zapiskaId })
          .andWhere('vl06 IN (:...ids)', { ids: removedVl06Ids })
          .execute();
      }

      const saved = await repo.save(toSave);

      return {
        updatedCount: saved.length,
        removedCount: removedVl06Ids.length,
      };
    });
  }
}
