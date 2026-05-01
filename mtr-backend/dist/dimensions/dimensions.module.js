"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DimensionsModule = void 0;
const common_1 = require("@nestjs/common");
const dimensions_service_1 = require("./dimensions.service");
const dimensions_controller_1 = require("./dimensions.controller");
const typeorm_1 = require("@nestjs/typeorm");
const dimension_entity_1 = require("./entities/dimension.entity");
const dimension_alias_entity_1 = require("./entities/dimension-alias.entity");
const dimension_category_entity_1 = require("./entities/dimension-category.entity");
let DimensionsModule = class DimensionsModule {
};
exports.DimensionsModule = DimensionsModule;
exports.DimensionsModule = DimensionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([dimension_entity_1.Dimension, dimension_alias_entity_1.DimensionAlias, dimension_category_entity_1.DimensionCategory]),
        ],
        controllers: [dimensions_controller_1.DimensionsController],
        providers: [dimensions_service_1.DimensionsService],
    })
], DimensionsModule);
//# sourceMappingURL=dimensions.module.js.map