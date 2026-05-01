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
exports.Application = void 0;
const class_validator_1 = require("class-validator");
const table_application_entity_1 = require("../../table-applications/entities/table-application.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const zapiski_entity_1 = require("../../zapiski/entities/zapiski.entity");
const typeorm_1 = require("typeorm");
let Application = class Application {
};
exports.Application = Application;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Application.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => zapiski_entity_1.Zapiski, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'zapiskaId' }),
    __metadata("design:type", zapiski_entity_1.Zapiski)
], Application.prototype, "zapiska", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => table_application_entity_1.TableApplication, (h) => h.listApp, { cascade: true }),
    __metadata("design:type", Array)
], Application.prototype, "tableApp", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.application, { onDelete: 'CASCADE' }),
    __metadata("design:type", user_entity_1.User)
], Application.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Application.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Application.prototype, "sendLock", void 0);
__decorate([
    (0, class_validator_1.IsEmpty)(),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Application.prototype, "createdAt", void 0);
__decorate([
    (0, class_validator_1.IsEmpty)(),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Application.prototype, "updatedAt", void 0);
exports.Application = Application = __decorate([
    (0, typeorm_1.Entity)('application'),
    (0, typeorm_1.Unique)(['zapiska'])
], Application);
//# sourceMappingURL=application.entity.js.map