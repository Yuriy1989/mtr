"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LastmileModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const lastmile_service_1 = require("./lastmile.service");
const lastmile_controller_1 = require("./lastmile.controller");
const application_entity_1 = require("../applications/entities/application.entity");
const table_application_entity_1 = require("../table-applications/entities/table-application.entity");
const zapiski_entity_1 = require("../zapiski/entities/zapiski.entity");
const mtr_list_entity_1 = require("../mtr-list/entities/mtr-list.entity");
const vl06_entity_1 = require("../vl06/entities/vl06.entity");
const lastmile_entity_1 = require("./entities/lastmile.entity");
const journal_module_1 = require("../journal/journal.module");
let LastmileModule = class LastmileModule {
};
exports.LastmileModule = LastmileModule;
exports.LastmileModule = LastmileModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                application_entity_1.Application,
                table_application_entity_1.TableApplication,
                zapiski_entity_1.Zapiski,
                mtr_list_entity_1.MtrList,
                vl06_entity_1.Vl06,
                lastmile_entity_1.LastmileDecision,
            ]),
            journal_module_1.JournalModule,
        ],
        controllers: [lastmile_controller_1.LastmileController],
        providers: [lastmile_service_1.LastmileService],
        exports: [lastmile_service_1.LastmileService],
    })
], LastmileModule);
//# sourceMappingURL=lastmile.module.js.map