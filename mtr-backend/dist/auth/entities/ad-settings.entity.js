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
exports.AdSettings = void 0;
const typeorm_1 = require("typeorm");
let AdSettings = class AdSettings {
};
exports.AdSettings = AdSettings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AdSettings.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], AdSettings.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'ldap://192.168.2.20:389' }),
    __metadata("design:type", String)
], AdSettings.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'mfc.dom' }),
    __metadata("design:type", String)
], AdSettings.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'DC=mfc,DC=dom' }),
    __metadata("design:type", String)
], AdSettings.prototype, "baseDn", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AdSettings.prototype, "bindUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AdSettings.prototype, "bindPassword", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '${username}@${domain}' }),
    __metadata("design:type", String)
], AdSettings.prototype, "userDnTemplate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 5000 }),
    __metadata("design:type", Number)
], AdSettings.prototype, "timeout", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AdSettings.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AdSettings.prototype, "updatedAt", void 0);
exports.AdSettings = AdSettings = __decorate([
    (0, typeorm_1.Entity)('ad_settings')
], AdSettings);
//# sourceMappingURL=ad-settings.entity.js.map