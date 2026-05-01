"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const transports_service_1 = require("./transports.service");
const transports_controller_1 = require("./transports.controller");
const transport_entity_1 = require("./entities/transport.entity");
const application_entity_1 = require("../applications/entities/application.entity");
const table_application_entity_1 = require("../table-applications/entities/table-application.entity");
const mtr_list_entity_1 = require("../mtr-list/entities/mtr-list.entity");
const vl06_entity_1 = require("../vl06/entities/vl06.entity");
const zapiski_entity_1 = require("../zapiski/entities/zapiski.entity");
const journal_module_1 = require("../journal/journal.module");
let TransportsModule = class TransportsModule {
};
exports.TransportsModule = TransportsModule;
exports.TransportsModule = TransportsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                transport_entity_1.Transport,
                application_entity_1.Application,
                table_application_entity_1.TableApplication,
                mtr_list_entity_1.MtrList,
                vl06_entity_1.Vl06,
                zapiski_entity_1.Zapiski,
            ]),
            journal_module_1.JournalModule,
        ],
        controllers: [transports_controller_1.TransportsController],
        providers: [transports_service_1.TransportsService],
        exports: [transports_service_1.TransportsService],
    })
], TransportsModule);
//# sourceMappingURL=transports.module.js.map