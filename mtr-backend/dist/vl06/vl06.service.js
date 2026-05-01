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
exports.Vl06Service = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const vl06_entity_1 = require("./entities/vl06.entity");
const typeorm_2 = require("typeorm");
let Vl06Service = class Vl06Service {
    constructor(tableVL06) {
        this.tableVL06 = tableVL06;
    }
    toDateOrNull(value) {
        if (!value)
            return null;
        const d = new Date(value);
        if (isNaN(d.getTime())) {
            throw new common_1.BadRequestException('Неверный формат даты');
        }
        return d;
    }
    async create(createVl06Dto) {
        try {
            const entity = this.tableVL06.create({
                ...createVl06Dto,
                vacationOfTheMaterial: this.toDateOrNull(createVl06Dto.vacationOfTheMaterial),
            });
            return await this.tableVL06.save(entity);
        }
        catch (error) {
            this.handleDbError(error);
        }
    }
    async createMany(dtos) {
        try {
            const entities = dtos.map((dto) => this.tableVL06.create({
                ...dto,
                vacationOfTheMaterial: this.toDateOrNull(dto.vacationOfTheMaterial),
            }));
            return await this.tableVL06.save(entities);
        }
        catch (error) {
            this.handleDbError(error);
        }
    }
    async findAll() {
        return this.tableVL06.find({
            order: { id: 'DESC' },
        });
    }
    async update(id, dto) {
        const row = await this.tableVL06.findOne({ where: { id } });
        if (!row)
            throw new common_1.NotFoundException('VL06 not found');
        const patch = {};
        if (dto.supply !== undefined)
            patch.supply = dto.supply;
        if (dto.factory !== undefined)
            patch.factory = dto.factory;
        if (dto.storage !== undefined)
            patch.storage = dto.storage;
        if (dto.material !== undefined)
            patch.material = dto.material;
        if (dto.party !== undefined)
            patch.party = dto.party;
        if (dto.nameMTR !== undefined)
            patch.nameMTR = dto.nameMTR;
        if (dto.basic !== undefined)
            patch.basic = dto.basic;
        if (dto.address !== undefined)
            patch.address = dto.address;
        if (dto.created !== undefined)
            patch.created = dto.created;
        if (dto.vacationOfTheMaterial !== undefined) {
            patch.vacationOfTheMaterial = this.toDateOrNull(dto.vacationOfTheMaterial);
        }
        if (dto.supplyVolume !== undefined) {
            const num = Number(dto.supplyVolume);
            if (Number.isNaN(num)) {
                throw new common_1.BadRequestException('supplyVolume должно быть числом');
            }
            patch.supplyVolume = num;
        }
        if (dto.status !== undefined) {
            patch.status = Number(dto.status);
        }
        await this.tableVL06.update(id, patch);
        return this.tableVL06.findOne({ where: { id } });
    }
    async updateStatus(id, status) {
        const row = await this.tableVL06.findOne({ where: { id } });
        if (!row)
            throw new common_1.NotFoundException('Запись не найдена');
        row.status = status;
        try {
            return await this.tableVL06.save(row);
        }
        catch (error) {
            this.handleDbError(error);
        }
    }
    async updateStatuses(ids, status) {
        if (!Array.isArray(ids) || !ids.length) {
            throw new common_1.BadRequestException('ids must be a non-empty array');
        }
        const code = Number(status);
        if (Number.isNaN(code)) {
            throw new common_1.BadRequestException('status must be a number');
        }
        const patch = { status: code };
        await this.tableVL06.update({ id: (0, typeorm_2.In)(ids) }, patch);
        return { updated: ids.length, status: code };
    }
    async remove(id) {
        try {
            const result = await this.tableVL06.delete(id);
            if (!result.affected) {
                throw new common_1.NotFoundException('VL06 not found');
            }
            return { id };
        }
        catch (error) {
            this.handleDbError(error);
        }
    }
    handleDbError(error) {
        const code = error?.code;
        if (code === '23505')
            throw new common_1.ConflictException('Запись с такими значениями уже существует.');
        if (code === '22P02')
            throw new common_1.BadRequestException('Неверный формат данных. Проверьте поля (в т.ч. дату).');
        if (code === '23503')
            throw new common_1.BadRequestException('Нарушение внешнего ключа: проверьте связанные записи.');
        if (error?.name === 'QueryFailedError')
            throw new common_1.BadRequestException('Ошибка при сохранении данных. Проверьте корректность полей.');
        throw new common_1.InternalServerErrorException('Не удалось создать запись.');
    }
};
exports.Vl06Service = Vl06Service;
exports.Vl06Service = Vl06Service = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(vl06_entity_1.Vl06)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], Vl06Service);
//# sourceMappingURL=vl06.service.js.map