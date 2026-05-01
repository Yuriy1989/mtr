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
exports.AcceptApplicationDto = exports.AcceptDecisionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AcceptDecisionDto {
}
exports.AcceptDecisionDto = AcceptDecisionDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, swagger_1.ApiProperty)({ example: 123 }),
    __metadata("design:type", Number)
], AcceptDecisionDto.prototype, "tableApplicationRowId", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], AcceptDecisionDto.prototype, "accepted", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'Повреждение упаковки', required: false }),
    __metadata("design:type", String)
], AcceptDecisionDto.prototype, "reason", void 0);
class AcceptApplicationDto {
}
exports.AcceptApplicationDto = AcceptApplicationDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({ type: [AcceptDecisionDto] }),
    __metadata("design:type", Array)
], AcceptApplicationDto.prototype, "decisions", void 0);
//# sourceMappingURL=create-lastmile.dto.js.map