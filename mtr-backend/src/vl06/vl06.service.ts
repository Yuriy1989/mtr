import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateVl06Dto } from './dto/create-vl06.dto';
import { UpdateVl06Dto } from './dto/update-vl06.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Vl06 } from './entities/vl06.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class Vl06Service {
  constructor(
    @InjectRepository(Vl06)
    private tableVL06: Repository<Vl06>,
  ) {}

  private toDateOrNull(value?: string): Date | null {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      throw new BadRequestException('Неверный формат даты');
    }
    return d;
  }

  async create(createVl06Dto: CreateVl06Dto) {
    try {
      const entity = this.tableVL06.create({
        ...createVl06Dto,
        vacationOfTheMaterial: this.toDateOrNull(
          createVl06Dto.vacationOfTheMaterial,
        ),
      });
      return await this.tableVL06.save(entity);
    } catch (error) {
      this.handleDbError(error);
    }
  }

  async createMany(dtos: CreateVl06Dto[]) {
    try {
      const entities = dtos.map((dto) =>
        this.tableVL06.create({
          ...dto,
          vacationOfTheMaterial: this.toDateOrNull(dto.vacationOfTheMaterial),
        }),
      );
      return await this.tableVL06.save(entities);
    } catch (error) {
      this.handleDbError(error);
    }
  }

  async findAll(): Promise<Vl06[]> {
    return this.tableVL06.find({
      order: { id: 'DESC' }, // при желании убери сортировку
    });
  }

  async update(id: number, dto: UpdateVl06Dto) {
    const row = await this.tableVL06.findOne({ where: { id } });
    if (!row) throw new NotFoundException('VL06 not found');

    // аккуратно нормализуем входящие поля
    const patch: Partial<Vl06> = {};

    if (dto.supply !== undefined) patch.supply = dto.supply;
    if (dto.factory !== undefined) patch.factory = dto.factory;
    if (dto.storage !== undefined) patch.storage = dto.storage;
    if (dto.material !== undefined) patch.material = dto.material;
    if (dto.party !== undefined) patch.party = dto.party;
    if (dto.nameMTR !== undefined) patch.nameMTR = dto.nameMTR;
    if (dto.basic !== undefined) patch.basic = dto.basic;
    if (dto.address !== undefined) patch.address = dto.address;
    if (dto.created !== undefined) patch.created = dto.created;
    if (dto.vacationOfTheMaterial !== undefined) {
      // строку -> Date | null (как в create)
      patch.vacationOfTheMaterial = this.toDateOrNull(
        dto.vacationOfTheMaterial,
      );
    }
    if (dto.supplyVolume !== undefined) {
      const num = Number(dto.supplyVolume);
      if (Number.isNaN(num)) {
        throw new BadRequestException('supplyVolume должно быть числом');
      }
      patch.supplyVolume = num;
    }
    if (dto.status !== undefined) {
      patch.status = Number(dto.status);
    }
    await this.tableVL06.update(id, patch);
    return this.tableVL06.findOne({ where: { id } });
  }

  //только статус одной записи VL06
  async updateStatus(id: number, status: number) {
    const row = await this.tableVL06.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Запись не найдена');
    row.status = status;
    try {
      return await this.tableVL06.save(row);
    } catch (error) {
      this.handleDbError(error);
    }
  }

  //пакетное обновление статуса
  async updateStatuses(ids: number[], status: number) {
    if (!Array.isArray(ids) || !ids.length) {
      throw new BadRequestException('ids must be a non-empty array');
    }
    const code = Number(status);
    if (Number.isNaN(code)) {
      throw new BadRequestException('status must be a number');
    }
    const patch: Partial<Vl06> = { status: code };
    await this.tableVL06.update({ id: In(ids) }, patch);
    return { updated: ids.length, status: code };
  }

  async remove(id: number) {
    try {
      const result = await this.tableVL06.delete(id);
      if (!result.affected) {
        throw new NotFoundException('VL06 not found');
      }
      return { id };
    } catch (error) {
      this.handleDbError(error);
    }
  }

  private handleDbError(error: any): never {
    const code = error?.code;
    if (code === '23505')
      throw new ConflictException('Запись с такими значениями уже существует.');
    if (code === '22P02')
      throw new BadRequestException(
        'Неверный формат данных. Проверьте поля (в т.ч. дату).',
      );
    if (code === '23503')
      throw new BadRequestException(
        'Нарушение внешнего ключа: проверьте связанные записи.',
      );
    if (error?.name === 'QueryFailedError')
      throw new BadRequestException(
        'Ошибка при сохранении данных. Проверьте корректность полей.',
      );
    throw new InternalServerErrorException('Не удалось создать запись.');
  }
}
