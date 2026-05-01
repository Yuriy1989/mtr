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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilialsController = void 0;
const common_1 = require("@nestjs/common");
const filials_service_1 = require("./filials.service");
const create_filial_dto_1 = require("./dto/create-filial.dto");
const update_filial_dto_1 = require("./dto/update-filial.dto");
const jwtAuth_guard_1 = require("../auth/guard/jwtAuth.guard");
let FilialsController = class FilialsController {
    constructor(filialsService) {
        this.filialsService = filialsService;
    }
    create(createFilialDto) {
        return this.filialsService.create(createFilialDto);
    }
    findAll() {
        return this.filialsService.findAll();
    }
    update(updateFilialDto) {
        return this.filialsService.update(updateFilialDto);
    }
    remove(id) {
        return this.filialsService.remove(id);
    }
};
exports.FilialsController = FilialsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_filial_dto_1.CreateFilialDto]),
    __metadata("design:returntype", void 0)
], FilialsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FilialsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_filial_dto_1.UpdateFilialDto]),
    __metadata("design:returntype", void 0)
], FilialsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_filial_dto_1.UpdateFilialDto]),
    __metadata("design:returntype", void 0)
], FilialsController.prototype, "remove", null);
exports.FilialsController = FilialsController = __decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Controller)('filials'),
    __metadata("design:paramtypes", [filials_service_1.FilialsService])
], FilialsController);
//# sourceMappingURL=filials.controller.js.map