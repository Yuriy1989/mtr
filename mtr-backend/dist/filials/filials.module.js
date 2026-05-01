"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilialsModule = void 0;
const common_1 = require("@nestjs/common");
const filials_service_1 = require("./filials.service");
const filials_controller_1 = require("./filials.controller");
const typeorm_1 = require("@nestjs/typeorm");
const filial_entity_1 = require("./entities/filial.entity");
let FilialsModule = class FilialsModule {
};
exports.FilialsModule = FilialsModule;
exports.FilialsModule = FilialsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([filial_entity_1.Filial])],
        controllers: [filials_controller_1.FilialsController],
        providers: [filials_service_1.FilialsService],
    })
], FilialsModule);
//# sourceMappingURL=filials.module.js.map