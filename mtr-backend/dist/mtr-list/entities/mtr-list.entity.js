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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MtrList = void 0;
const vl06_entity_1 = require("../../vl06/entities/vl06.entity");
const zapiski_entity_1 = require("../../zapiski/entities/zapiski.entity");
const typeorm_1 = require("typeorm");
let MtrList = class MtrList {
};
exports.MtrList = MtrList;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MtrList.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MtrList.prototype, "express", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MtrList.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MtrList.prototype, "repairObjectName", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zapiski_entity_1.Zapiski, (z) => z.mtrList, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'zapiskiId' }),
    __metadata("design:type", zapiski_entity_1.Zapiski)
], MtrList.prototype, "zapiska", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vl06_entity_1.Vl06, (z) => z.mtrList, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'vl06' }),
    __metadata("design:type", vl06_entity_1.Vl06)
], MtrList.prototype, "vl06", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MtrList.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MtrList.prototype, "updatedAt", void 0);
exports.MtrList = MtrList = __decorate([
    (0, typeorm_1.Entity)('mtrList'),
    (0, typeorm_1.Unique)(['zapiska', 'vl06'])
], MtrList);
//# sourceMappingURL=mtr-list.entity.js.map