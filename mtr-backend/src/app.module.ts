import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { StoragesModule } from './storages/storages.module';
import { FilialsModule } from './filials/filials.module';
import { DepartmentsModule } from './departments/departments.module';
import { DimensionsModule } from './dimensions/dimensions.module';
import { RegionsModule } from './regions/regions.module';
import configuration from './config/configuration';
import { AppServices } from './config/appService';
import { AuthModule } from './auth/auth.module';
import { TableApplicationsModule } from './table-applications/table-applications.module';
import { ZapiskiModule } from './zapiski/zapiski.module';
import { Vl06Module } from './vl06/vl06.module';
import { MtrListModule } from './mtr-list/mtr-list.module';
import { ApplicationsModule } from './applications/applications.module';
import { TransportsModule } from './transports/transports.module';
import { JournalModule } from './journal/journal.module';
import { LastmileModule } from './lastmile/lastmile.module';
import { BasicunitModule } from './basicunit/basicunit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      useClass: AppServices,
    }),
    UsersModule,
    StoragesModule,
    FilialsModule,
    DepartmentsModule,
    DimensionsModule,
    RegionsModule,
    AuthModule,
    TableApplicationsModule,
    ZapiskiModule,
    Vl06Module,
    MtrListModule,
    ApplicationsModule,
    TransportsModule,
    JournalModule,
    LastmileModule,
    BasicunitModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
