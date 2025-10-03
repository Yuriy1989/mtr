import { Module } from '@nestjs/common';
import { DimensionsService } from './dimensions.service';
import { DimensionsController } from './dimensions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dimension } from './entities/dimension.entity';
import { DimensionAlias } from './entities/dimension-alias.entity';
import { DimensionCategory } from './entities/dimension-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dimension, DimensionAlias, DimensionCategory]),
  ],
  controllers: [DimensionsController],
  providers: [DimensionsService],
})
export class DimensionsModule {}
