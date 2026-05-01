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
exports.TableApplicationHistory = void 0;
const typeorm_1 = require("typeorm");
const table_application_entity_1 = require("./table-application.entity");
let TableApplicationHistory = class TableApplicationHistory {
};
exports.TableApplicationHistory = TableApplicationHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TableApplicationHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => table_application_entity_1.TableApplication, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tableApplicationId' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", table_application_entity_1.TableApplication)
], TableApplicationHistory.prototype, "tableApplication", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], TableApplicationHistory.prototype, "snapshot", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TableApplicationHistory.prototype, "createdAt", void 0);
exports.TableApplicationHistory = TableApplicationHistory = __decorate([
    (0, typeorm_1.Entity)('tableApplicationHistory')
], TableApplicationHistory);
//# sourceMappingURL=table-application-history.entity.js.map