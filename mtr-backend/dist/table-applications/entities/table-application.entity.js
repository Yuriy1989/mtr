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
exports.TableApplication = void 0;
const class_validator_1 = require("class-validator");
const application_entity_1 = require("../../applications/entities/application.entity");
const mtr_list_entity_1 = require("../../mtr-list/entities/mtr-list.entity");
const typeorm_1 = require("typeorm");
let TableApplication = class TableApplication {
};
exports.TableApplication = TableApplication;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TableApplication.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => application_entity_1.Application, (h) => h.tableApp, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'applicationId' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", application_entity_1.Application)
], TableApplication.prototype, "listApp", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => mtr_list_entity_1.MtrList, { onDelete: 'CASCADE', eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'mtrListId' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", mtr_list_entity_1.MtrList)
], TableApplication.prototype, "mtrList", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "lengthObject", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "width", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "height", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "massa", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "dateRequest", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "transport", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "dateShipment", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "transportNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "discarded", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "remainder", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "transit", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "numberM11", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "dateM11", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TableApplication.prototype, "addNote", void 0);
__decorate([
    (0, class_validator_1.IsEmpty)(),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TableApplication.prototype, "createdAt", void 0);
__decorate([
    (0, class_validator_1.IsEmpty)(),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TableApplication.prototype, "updatedAt", void 0);
exports.TableApplication = TableApplication = __decorate([
    (0, typeorm_1.Entity)('tableApplication'),
    (0, typeorm_1.Unique)(['listApp', 'mtrList'])
], TableApplication);
//# sourceMappingURL=table-application.entity.js.map