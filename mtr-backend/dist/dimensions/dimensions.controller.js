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
exports.DimensionsController = void 0;
const common_1 = require("@nestjs/common");
const dimensions_service_1 = require("./dimensions.service");
const create_dimension_dto_1 = require("./dto/create-dimension.dto");
const update_dimension_dto_1 = require("./dto/update-dimension.dto");
const jwtAuth_guard_1 = require("../auth/guard/jwtAuth.guard");
let DimensionsController = class DimensionsController {
    constructor(dimensionsService) {
        this.dimensionsService = dimensionsService;
    }
    create(createDimensionDto) {
        return this.dimensionsService.create(createDimensionDto);
    }
    listCategories() {
        return this.dimensionsService.listCategories();
    }
    findAll() {
        return this.dimensionsService.findAll();
    }
    upsertCategory(body) {
        return Array.isArray(body)
            ? this.dimensionsService.upsertCategories(body)
            : this.dimensionsService.upsertCategory(body);
    }
    update(id, updateDimensionDto) {
        return this.dimensionsService.update(id, updateDimensionDto);
    }
    remove(id) {
        return this.dimensionsService.remove(id);
    }
};
exports.DimensionsController = DimensionsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_dimension_dto_1.CreateDimensionDto]),
    __metadata("design:returntype", void 0)
], DimensionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DimensionsController.prototype, "listCategories", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DimensionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)('categories'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DimensionsController.prototype, "upsertCategory", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_dimension_dto_1.UpdateDimensionDto]),
    __metadata("design:returntype", void 0)
], DimensionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DimensionsController.prototype, "remove", null);
exports.DimensionsController = DimensionsController = __decorate([
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtGuard),
    (0, common_1.Controller)('dimensions'),
    __metadata("design:paramtypes", [dimensions_service_1.DimensionsService])
], DimensionsController);
//# sourceMappingURL=dimensions.controller.js.map