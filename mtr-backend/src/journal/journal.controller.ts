import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JournalService } from './journal.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { QueryJournalDto } from './dto/query-journal.dto';
import { Request } from 'express';
import { JwtGuard } from 'src/auth/guard/jwtAuth.guard';

@UseGuards(JwtGuard)
@Controller('journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  async create(@Body() dto: CreateJournalDto, @Req() req: Request) {
    // заполним ip/route/method, если не передали
    const ip =
      dto.ip ?? (req.headers['x-forwarded-for'] as string) ?? req.ip ?? null;
    const route = dto.route ?? req.originalUrl ?? req.url ?? null;
    const method = dto.method ?? req.method ?? null;
    return this.journalService.create({ ...dto, ip, route, method });
  }

  @Get()
  findAll(@Query() query: QueryJournalDto) {
    return this.journalService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.journalService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJournalDto) {
    return this.journalService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.journalService.remove(+id);
  }
}
