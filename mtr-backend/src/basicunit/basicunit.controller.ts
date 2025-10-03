import { Controller, Get, Param, Delete } from '@nestjs/common';
import { BasicunitService } from './basicunit.service';

@Controller('basicunit')
export class BasicunitController {
  constructor(private readonly basicunitService: BasicunitService) {}

  @Get()
  findAll() {
    return this.basicunitService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.basicunitService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.basicunitService.remove(+id);
  }
}
