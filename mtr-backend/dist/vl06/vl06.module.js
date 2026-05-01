"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vl06Module = void 0;
const common_1 = require("@nestjs/common");
const vl06_service_1 = require("./vl06.service");
const vl06_controller_1 = require("./vl06.controller");
const typeorm_1 = require("@nestjs/typeorm");
const vl06_entity_1 = require("./entities/vl06.entity");
const journal_module_1 = require("../journal/journal.module");
let Vl06Module = class Vl06Module {
};
exports.Vl06Module = Vl06Module;
exports.Vl06Module = Vl06Module = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([vl06_entity_1.Vl06]), journal_module_1.JournalModule],
        controllers: [vl06_controller_1.Vl06Controller],
        providers: [vl06_service_1.Vl06Service],
        exports: [vl06_service_1.Vl06Service],
    })
], Vl06Module);
//# sourceMappingURL=vl06.module.js.map