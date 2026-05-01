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
exports.LastmileDecision = void 0;
const typeorm_1 = require("typeorm");
const application_entity_1 = require("../../applications/entities/application.entity");
const table_application_entity_1 = require("../../table-applications/entities/table-application.entity");
let LastmileDecision = class LastmileDecision {
};
exports.LastmileDecision = LastmileDecision;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LastmileDecision.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => application_entity_1.Application, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'application_id' }),
    __metadata("design:type", application_entity_1.Application)
], LastmileDecision.prototype, "application", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => table_application_entity_1.TableApplication, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'row_id' }),
    __metadata("design:type", table_application_entity_1.TableApplication)
], LastmileDecision.prototype, "row", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], LastmileDecision.prototype, "accepted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LastmileDecision.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LastmileDecision.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LastmileDecision.prototype, "updatedAt", void 0);
exports.LastmileDecision = LastmileDecision = __decorate([
    (0, typeorm_1.Entity)('lastmile_decisions')
], LastmileDecision);
//# sourceMappingURL=lastmile.entity.js.map