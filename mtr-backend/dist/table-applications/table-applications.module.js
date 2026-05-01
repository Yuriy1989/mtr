"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableApplicationsModule = void 0;
const common_1 = require("@nestjs/common");
const table_applications_controller_1 = require("./table-applications.controller");
const typeorm_1 = require("@nestjs/typeorm");
const table_application_entity_1 = require("./entities/table-application.entity");
const table_applications_service_1 = require("./table-applications.service");
const zapiski_entity_1 = require("../zapiski/entities/zapiski.entity");
const application_entity_1 = require("../applications/entities/application.entity");
const vl06_entity_1 = require("../vl06/entities/vl06.entity");
const mtr_list_entity_1 = require("../mtr-list/entities/mtr-list.entity");
const journal_module_1 = require("../journal/journal.module");
const table_application_history_entity_1 = require("./entities/table-application-history.entity");
let TableApplicationsModule = class TableApplicationsModule {
};
exports.TableApplicationsModule = TableApplicationsModule;
exports.TableApplicationsModule = TableApplicationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                table_application_entity_1.TableApplication,
                zapiski_entity_1.Zapiski,
                application_entity_1.Application,
                vl06_entity_1.Vl06,
                mtr_list_entity_1.MtrList,
                table_application_history_entity_1.TableApplicationHistory,
            ]),
            journal_module_1.JournalModule,
        ],
        controllers: [table_applications_controller_1.TableApplicationsController],
        providers: [table_applications_service_1.TableApplicationsService],
        exports: [table_applications_service_1.TableApplicationsService],
    })
], TableApplicationsModule);
//# sourceMappingURL=table-applications.module.js.map