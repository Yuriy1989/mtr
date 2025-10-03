import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LastmileService } from './lastmile.service';
import { LastmileController } from './lastmile.controller';
import { Application } from 'src/applications/entities/application.entity';
import { TableApplication } from 'src/table-applications/entities/table-application.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { LastmileDecision } from './entities/lastmile.entity';
import { JournalModule } from 'src/journal/journal.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      TableApplication,
      Zapiski,
      MtrList,
      Vl06,
      LastmileDecision,
    ]),
    JournalModule,
  ],
  controllers: [LastmileController],
  providers: [LastmileService],
  exports: [LastmileService],
})
export class LastmileModule {}
