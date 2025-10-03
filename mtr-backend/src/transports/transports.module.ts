// src/transports/transports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransportsService } from './transports.service';
import { TransportsController } from './transports.controller';

import { Transport } from './entities/transport.entity';
import { Application } from 'src/applications/entities/application.entity';
import { TableApplication } from 'src/table-applications/entities/table-application.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
import { JournalModule } from 'src/journal/journal.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transport,
      Application,
      TableApplication,
      MtrList,
      Vl06,
      Zapiski,
    ]),
    JournalModule,
  ],
  controllers: [TransportsController],
  providers: [TransportsService],
  exports: [TransportsService],
})
export class TransportsModule {}
