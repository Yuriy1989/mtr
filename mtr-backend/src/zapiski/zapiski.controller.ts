import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ZapiskiService } from './zapiski.service';
import { UpdateZapiskiDto } from './dto/update-zapiski.dto';
import { JwtGuard } from 'src/auth/guard/jwtAuth.guard';

@UseGuards(JwtGuard)
@Controller('zapiski')
export class ZapiskiController {
  constructor(private readonly zapiskiService: ZapiskiService) {}

  @Post()
  async create(@Body() createZapiskiDto: any) {
    const zapiska = await this.zapiskiService.create(createZapiskiDto);
    return {
      success: true,
      data: zapiska,
    };
  }

  @Get()
  async findAll(@Query('from') from?: string, @Query('to') to?: string) {
    const data = await this.zapiskiService.findAll({ from, to });
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    const data = await this.zapiskiService.findOne(+id);
    return { success: true, data };
  }

  @Get(':id/stats')
  async stats(@Param('id') id: number) {
    const data = await this.zapiskiService.getStatsForZapiska(+id);
    return { success: true, data };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateZapiskiDto: UpdateZapiskiDto) {
    return this.zapiskiService.update(+id, updateZapiskiDto);
  }

  //«Отправить в работу»
  @Patch(':id/send')
  async sendToWork(@Param('id') id: number) {
    const data = await this.zapiskiService.sendToWork(+id);
    return { success: true, data };
  }

  @Patch(':id/send50')
  async sendToSent(@Param('id') id: number) {
    const data = await this.zapiskiService.sendToSent(+id);
    return { success: true, data };
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.zapiskiService.remove(+id);
  }
}
