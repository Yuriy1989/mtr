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
exports.Dimension = void 0;
const typeorm_1 = require("typeorm");
const dimension_alias_entity_1 = require("./dimension-alias.entity");
let Dimension = class Dimension {
};
exports.Dimension = Dimension;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Dimension.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Dimension.prototype, "nameDimension", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Dimension.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Dimension.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Dimension.prototype, "isBase", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 9, nullable: true }),
    __metadata("design:type", String)
], Dimension.prototype, "toBaseFactor", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => dimension_alias_entity_1.DimensionAlias, (a) => a.dimension, { cascade: true }),
    __metadata("design:type", Array)
], Dimension.prototype, "aliases", void 0);
exports.Dimension = Dimension = __decorate([
    (0, typeorm_1.Entity)('dimansion')
], Dimension);
//# sourceMappingURL=dimension.entity.js.map