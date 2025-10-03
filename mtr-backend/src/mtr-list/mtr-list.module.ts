import { Module } from '@nestjs/common';
import { MtrListService } from './mtr-list.service';
import { MtrListController } from './mtr-list.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MtrList } from './entities/mtr-list.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
import { JournalModule } from 'src/journal/journal.module';

@Module({
  imports: [TypeOrmModule.forFeature([MtrList, Zapiski]), JournalModule],
  controllers: [MtrListController],
  providers: [MtrListService],
  exports: [MtrListService],
})
export class MtrListModule {}
