// src/zapiski/zapiski.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Zapiski } from './entities/zapiski.entity';
import { ZapiskiService } from './zapiski.service';
import { ZapiskiController } from './zapiski.controller';

import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { Application } from 'src/applications/entities/application.entity';
import { TableApplication } from 'src/table-applications/entities/table-application.entity';

import { TransportsModule } from 'src/transports/transports.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Zapiski,
      MtrList,
      Vl06,
      Application,
      TableApplication,
    ]),
    forwardRef(() => TransportsModule),
  ],
  controllers: [ZapiskiController],
  providers: [ZapiskiService],
  exports: [ZapiskiService],
})
export class ZapiskiModule {}
