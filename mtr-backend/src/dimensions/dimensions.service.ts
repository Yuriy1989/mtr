import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDimensionDto } from './dto/create-dimension.dto';
import { UpdateDimensionDto } from './dto/update-dimension.dto';
import { DimensionCategory } from './entities/dimension-category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Dimension } from './entities/dimension.entity';
import { Repository } from 'typeorm';
import { DimensionAlias } from './entities/dimension-alias.entity';
import { UpsertCategoryDto } from './dto/upsert-category.dto';

@Injectable()
export class DimensionsService {
  constructor(
    @InjectRepository(Dimension)
    private dimRepo: Repository<Dimension>,
    @InjectRepository(DimensionAlias)
    private aliasRepo: Repository<DimensionAlias>,
    @InjectRepository(DimensionCategory)
    private catRepo: Repository<DimensionCategory>,
  ) {}

  /** Сервисная: снять флаг базовой у всех в категории, кроме данного id */
  private async ensureSingleBaseInCategory(
    category: string | null,
    keepId?: number,
  ) {
    if (!category) return;
    await this.dimRepo
      .createQueryBuilder()
      .update(Dimension)
      .set({ isBase: false, toBaseFactor: '1' })
      .where('category = :category', { category })
      .andWhere(keepId ? 'id <> :id' : '1=1', keepId ? { id: keepId } : {})
      .execute();
  }

  async create(dto: CreateDimensionDto) {
    const nameDimension = (dto.nameDimension ?? '').toString().trim();
    const code = dto.code != null ? String(dto.code).trim() : null;
    const category = dto.category != null ? String(dto.category).trim() : null;
    const isBase = Boolean(dto.isBase);

    if (!nameDimension)
      throw new BadRequestException('nameDimension is required');
    if (!code) throw new BadRequestException('code is required');

    // нормализуем коэффициент
    let toBaseFactor: string | null = null;
    if (isBase) {
      toBaseFactor = '1';
    } else if (dto.toBaseFactor != null && dto.toBaseFactor !== '') {
      const num = Number(dto.toBaseFactor);
      toBaseFactor = Number.isFinite(num) ? String(num) : null;
    }

    const aliases = Array.isArray(dto.aliases)
      ? dto.aliases.map((t) => String(t || '').trim()).filter(Boolean)
      : [];

    const d = this.dimRepo.create({
      nameDimension,
      code,
      category,
      isBase,
      toBaseFactor, // для базовой = "1"
    });
    const saved = await this.dimRepo.save(d);

    // если отметили базовой — снимаем флаг у остальных в категории
    if (isBase && category) {
      await this.ensureSingleBaseInCategory(category, saved.id);
    }

    if (aliases.length) {
      const list = aliases.map((t) =>
        this.aliasRepo.create({ text: t, dimension: saved }),
      );
      await this.aliasRepo.save(list);
    }
    return this.findAll();
  }

  async findAll() {
    const list = await this.dimRepo.find({ relations: { aliases: true } });
    return list.map((d) => ({
      id: d.id,
      nameDimension: d.nameDimension,
      code: d.code,
      category: d.category,
      isBase: d.isBase,
      toBaseFactor: d.toBaseFactor
        ? Number(d.toBaseFactor)
        : d.isBase
          ? 1
          : null,
      aliases: (d.aliases || []).map((a) => a.text),
    }));
  }

  async update(id: number, dto: UpdateDimensionDto) {
    const exist = await this.dimRepo.findOne({
      where: { id },
      relations: { aliases: true },
    });
    if (!exist) throw new NotFoundException('Dimension not found');

    // Поля
    if (dto.nameDimension != null) {
      exist.nameDimension = String(dto.nameDimension).trim();
    }
    if (dto.code != null) {
      exist.code = String(dto.code).trim();
    }
    if (dto.category != null) {
      exist.category = String(dto.category).trim() || null;
    }
    if (dto.isBase != null) {
      exist.isBase = Boolean(dto.isBase);
    }

    // Коэффициент
    if (exist.isBase) {
      exist.toBaseFactor = '1';
    } else if (dto.toBaseFactor !== undefined) {
      if (dto.toBaseFactor === '' || dto.toBaseFactor == null) {
        exist.toBaseFactor = null;
      } else {
        const n = Number(dto.toBaseFactor);
        exist.toBaseFactor = Number.isFinite(n) ? String(n) : null;
      }
    }

    const saved = await this.dimRepo.save(exist);

    if (saved.isBase && saved.category) {
      await this.ensureSingleBaseInCategory(saved.category, saved.id);
    }

    // Алиасы
    if (dto.aliases) {
      await this.aliasRepo.delete({ dimension: { id } as any });
      const list = dto.aliases
        .map((t) => String(t || '').trim())
        .filter(Boolean)
        .map((t) => this.aliasRepo.create({ text: t, dimension: saved }));
      if (list.length) await this.aliasRepo.save(list);
    }

    return this.findAll();
  }

  async remove(id: number) {
    await this.dimRepo.delete({ id });
    return this.findAll();
  }
  // ===== Категории =====

  async getCategoryMap() {
    const list = await this.catRepo.find();
    const map = new Map<string, DimensionCategory>();
    for (const c of list) map.set(c.key, c);
    return map;
  }

  async listCategories() {
    const list = await this.catRepo.find();
    return list.sort((a, b) => a.key.localeCompare(b.key));
  }

  async upsertCategory(dto: UpsertCategoryDto) {
    const key = String(dto.key || '').trim();
    const nameRu = String(dto.nameRu || '').trim();
    if (!key || !nameRu) throw new Error('key and nameRu are required');

    let exist = await this.catRepo.findOne({ where: { key } });
    if (!exist) {
      exist = this.catRepo.create({ key, nameRu, nameEn: dto.nameEn ?? null });
    } else {
      exist.nameRu = nameRu;
      exist.nameEn = dto.nameEn ?? exist.nameEn ?? null;
    }
    await this.catRepo.save(exist);
    return this.listCategories();
  }

  async upsertCategories(list: UpsertCategoryDto[]) {
    for (const it of list || []) {
      await this.upsertCategory(it);
    }
    return this.listCategories();
  }
}
