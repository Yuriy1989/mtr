import { Module } from '@nestjs/common';
import { FilialsService } from './filials.service';
import { FilialsController } from './filials.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Filial } from './entities/filial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Filial])],
  controllers: [FilialsController],
  providers: [FilialsService],
})
export class FilialsModule {}
