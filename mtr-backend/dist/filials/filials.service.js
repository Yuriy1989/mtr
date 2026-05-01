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
exports.FilialsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const filial_entity_1 = require("./entities/filial.entity");
let FilialsService = class FilialsService {
    constructor(filialRepository) {
        this.filialRepository = filialRepository;
    }
    async create(createFilialDto) {
        return await this.filialRepository.save(createFilialDto);
    }
    async findAll() {
        return await this.filialRepository.find();
    }
    async update(updateFilialDto) {
        const id = updateFilialDto.id;
        const data = {
            nameFilial: updateFilialDto.nameFilial,
        };
        return await this.filialRepository.update({ id }, data);
    }
    async remove(id) {
        return await this.filialRepository.delete(id);
    }
};
exports.FilialsService = FilialsService;
exports.FilialsService = FilialsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(filial_entity_1.Filial)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], FilialsService);
//# sourceMappingURL=filials.service.js.map