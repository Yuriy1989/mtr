import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Journal } from './entities/journal.entity';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { QueryJournalDto } from './dto/query-journal.dto';

@Injectable()
export class JournalService {
  constructor(
    @InjectRepository(Journal)
    private readonly repo: Repository<Journal>,
  ) {}

  async create(createJournalDto: CreateJournalDto) {
    const row = this.repo.create({
      ...createJournalDto,
      success: createJournalDto.success ?? true,
    });
    return this.repo.save(row);
  }

  async findAll(query: QueryJournalDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.max(1, Math.min(200, Number(query.pageSize ?? 50)));
    const qb = this.repo.createQueryBuilder('j');

    // период
    if (query.start)
      qb.andWhere('j.createdAt >= :start', { start: query.start });
    if (query.end) qb.andWhere('j.createdAt <= :end', { end: query.end });

    // поиск по нескольким полям
    if (query.q) {
      const q = `%${query.q}%`;
      qb.andWhere(
        '(j.userName ILIKE :q OR j.action ILIKE :q OR j.entity ILIKE :q OR j.entityId ILIKE :q OR j.description ILIKE :q)',
        { q },
      );
    }

    // сортировка
    const allowedSort = new Set([
      'createdAt',
      'userId',
      'userName',
      'action',
      'entity',
      'entityId',
      'success',
    ]);
    const sortField = allowedSort.has(query.sortField)
      ? query.sortField
      : 'createdAt';
    const sortOrder: 'ASC' | 'DESC' =
      query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(`j.${sortField}`, sortOrder);

    // пагинация
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  async update(id: number, updateJournalDto: UpdateJournalDto) {
    await this.repo.update({ id }, updateJournalDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete({ id });
    return { id };
  }

  // Удобный хелпер для записи
  async log(params: CreateJournalDto) {
    return this.create(params);
  }
}
