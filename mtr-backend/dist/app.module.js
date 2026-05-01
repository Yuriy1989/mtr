"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const typeorm_1 = require("@nestjs/typeorm");
const users_module_1 = require("./users/users.module");
const storages_module_1 = require("./storages/storages.module");
const filials_module_1 = require("./filials/filials.module");
const departments_module_1 = require("./departments/departments.module");
const dimensions_module_1 = require("./dimensions/dimensions.module");
const regions_module_1 = require("./regions/regions.module");
const configuration_1 = require("./config/configuration");
const appService_1 = require("./config/appService");
const auth_module_1 = require("./auth/auth.module");
const table_applications_module_1 = require("./table-applications/table-applications.module");
const zapiski_module_1 = require("./zapiski/zapiski.module");
const vl06_module_1 = require("./vl06/vl06.module");
const mtr_list_module_1 = require("./mtr-list/mtr-list.module");
const applications_module_1 = require("./applications/applications.module");
const transports_module_1 = require("./transports/transports.module");
const journal_module_1 = require("./journal/journal.module");
const lastmile_module_1 = require("./lastmile/lastmile.module");
const basicunit_module_1 = require("./basicunit/basicunit.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                useClass: appService_1.AppServices,
            }),
            users_module_1.UsersModule,
            storages_module_1.StoragesModule,
            filials_module_1.FilialsModule,
            departments_module_1.DepartmentsModule,
            dimensions_module_1.DimensionsModule,
            regions_module_1.RegionsModule,
            auth_module_1.AuthModule,
            table_applications_module_1.TableApplicationsModule,
            zapiski_module_1.ZapiskiModule,
            vl06_module_1.Vl06Module,
            mtr_list_module_1.MtrListModule,
            applications_module_1.ApplicationsModule,
            transports_module_1.TransportsModule,
            journal_module_1.JournalModule,
            lastmile_module_1.LastmileModule,
            basicunit_module_1.BasicunitModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map