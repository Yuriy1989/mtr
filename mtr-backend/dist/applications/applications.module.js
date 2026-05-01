"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsModule = void 0;
const common_1 = require("@nestjs/common");
const applications_service_1 = require("./applications.service");
const applications_controller_1 = require("./applications.controller");
const typeorm_1 = require("@nestjs/typeorm");
const application_entity_1 = require("./entities/application.entity");
const zapiski_entity_1 = require("../zapiski/entities/zapiski.entity");
const table_application_entity_1 = require("../table-applications/entities/table-application.entity");
const mtr_list_entity_1 = require("../mtr-list/entities/mtr-list.entity");
const transport_entity_1 = require("../transports/entities/transport.entity");
const journal_module_1 = require("../journal/journal.module");
const lastmile_entity_1 = require("../lastmile/entities/lastmile.entity");
let ApplicationsModule = class ApplicationsModule {
};
exports.ApplicationsModule = ApplicationsModule;
exports.ApplicationsModule = ApplicationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                application_entity_1.Application,
                zapiski_entity_1.Zapiski,
                table_application_entity_1.TableApplication,
                mtr_list_entity_1.MtrList,
                transport_entity_1.Transport,
                lastmile_entity_1.LastmileDecision,
            ]),
            journal_module_1.JournalModule,
        ],
        controllers: [applications_controller_1.ApplicationsController],
        providers: [applications_service_1.ApplicationsService],
        exports: [applications_service_1.ApplicationsService],
    })
], ApplicationsModule);
//# sourceMappingURL=applications.module.js.map