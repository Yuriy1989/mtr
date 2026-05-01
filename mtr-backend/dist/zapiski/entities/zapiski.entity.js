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
exports.Zapiski = void 0;
const application_entity_1 = require("../../applications/entities/application.entity");
const mtr_list_entity_1 = require("../../mtr-list/entities/mtr-list.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const typeorm_1 = require("typeorm");
let Zapiski = class Zapiski {
};
exports.Zapiski = Zapiski;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Zapiski.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => application_entity_1.Application, (a) => a.zapiska),
    __metadata("design:type", application_entity_1.Application)
], Zapiski.prototype, "application", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { array: true, nullable: true }),
    __metadata("design:type", Array)
], Zapiski.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => mtr_list_entity_1.MtrList, (m) => m.zapiska, { cascade: true }),
    __metadata("design:type", Array)
], Zapiski.prototype, "mtrList", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.zapiski, {
        onDelete: 'CASCADE',
    }),
    __metadata("design:type", user_entity_1.User)
], Zapiski.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Zapiski.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Zapiski.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Zapiski.prototype, "updatedAt", void 0);
exports.Zapiski = Zapiski = __decorate([
    (0, typeorm_1.Entity)('tableZapiski')
], Zapiski);
//# sourceMappingURL=zapiski.entity.js.map