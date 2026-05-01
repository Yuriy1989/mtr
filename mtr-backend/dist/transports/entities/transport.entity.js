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
exports.Transport = exports.TransportStatus = void 0;
const typeorm_1 = require("typeorm");
const application_entity_1 = require("../../applications/entities/application.entity");
var TransportStatus;
(function (TransportStatus) {
    TransportStatus[TransportStatus["PENDING"] = 10] = "PENDING";
    TransportStatus[TransportStatus["APPROVED"] = 20] = "APPROVED";
    TransportStatus[TransportStatus["REJECTED"] = 30] = "REJECTED";
})(TransportStatus || (exports.TransportStatus = TransportStatus = {}));
let Transport = class Transport {
};
exports.Transport = Transport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Transport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => application_entity_1.Application, { eager: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'applicationId' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", application_entity_1.Application)
], Transport.prototype, "application", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: TransportStatus.PENDING }),
    __metadata("design:type", Number)
], Transport.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Transport.prototype, "rejectReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Transport.prototype, "wave", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Transport.prototype, "supplyVolumeTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Transport.prototype, "shippedTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Transport.prototype, "recipientsSummary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Transport.prototype, "cargoFormedSummary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Transport.prototype, "materialsSummary", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { array: true, nullable: true }),
    __metadata("design:type", Array)
], Transport.prototype, "storages", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Transport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Transport.prototype, "updatedAt", void 0);
exports.Transport = Transport = __decorate([
    (0, typeorm_1.Entity)('transport')
], Transport);
//# sourceMappingURL=transport.entity.js.map