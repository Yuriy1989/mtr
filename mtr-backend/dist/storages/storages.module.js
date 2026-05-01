"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoragesModule = void 0;
const common_1 = require("@nestjs/common");
const storages_service_1 = require("./storages.service");
const storages_controller_1 = require("./storages.controller");
const typeorm_1 = require("@nestjs/typeorm");
const storage_entity_1 = require("./entities/storage.entity");
let StoragesModule = class StoragesModule {
};
exports.StoragesModule = StoragesModule;
exports.StoragesModule = StoragesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([storage_entity_1.Storage])],
        controllers: [storages_controller_1.StoragesController],
        providers: [storages_service_1.StoragesService],
    })
], StoragesModule);
//# sourceMappingURL=storages.module.js.map