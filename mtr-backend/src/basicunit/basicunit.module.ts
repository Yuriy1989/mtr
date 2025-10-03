import { Module } from '@nestjs/common';
import { BasicunitService } from './basicunit.service';
import { BasicunitController } from './basicunit.controller';

@Module({
  controllers: [BasicunitController],
  providers: [BasicunitService],
})
export class BasicunitModule {}
