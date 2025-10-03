import { Module } from '@nestjs/common';
import { TableApplicationsController } from './table-applications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableApplication } from './entities/table-application.entity';
import { TableApplicationsService } from './table-applications.service';
import { Zapiski } from '../zapiski/entities/zapiski.entity';
import { Application } from '../applications/entities/application.entity';
import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { JournalModule } from 'src/journal/journal.module';
import { TableApplicationHistory } from './entities/table-application-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TableApplication,
      Zapiski,
      Application,
      Vl06,
      MtrList,
      TableApplicationHistory,
    ]),
    JournalModule,
  ],
  controllers: [TableApplicationsController],
  providers: [TableApplicationsService],
  exports: [TableApplicationsService],
})
export class TableApplicationsModule {}
