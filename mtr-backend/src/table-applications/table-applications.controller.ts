// C:\Server\data\htdocs\umtsik\mtr-backend\src\table-applications\table-applications.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { TableApplicationsService } from './table-applications.service';
import { CreateTableApplicationDto } from './dto/create-table-application.dto';
import { UpdateTableApplicationDto } from './dto/update-table-application.dto';
import { UpsertAppendix3Dto } from './dto/upsert-app3.dto';
import { JournalService } from 'src/journal/journal.service';
import { JwtGuard } from 'src/auth/guard/jwtAuth.guard';

@UseGuards(JwtGuard)
@Controller('table-applications')
export class TableApplicationsController {
  constructor(
    private readonly svc: TableApplicationsService,
    private readonly journal: JournalService,
  ) {}

  @Post()
  async create(@Body() dto: CreateTableApplicationDto, @Req() req: Request) {
    const data = await this.svc.create(dto);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'create',
      entity: 'TableApplication',
      entityId: String(data?.id ?? ''),
      description: 'Создана строка Приложения №3',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
    });

    return data;
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTableApplicationDto,
    @Req() req: Request,
  ) {
    const data = await this.svc.update(id, dto);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'update',
      entity: 'TableApplication',
      entityId: String(id),
      description: 'Обновлена строка Приложения №3',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
    });

    return data;
  }

  @Post('upsert')
  async upsert(@Body() dto: UpsertAppendix3Dto, @Req() req: Request) {
    const data = await this.svc.upsertApp3(dto);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'upsert',
      entity: 'Application3',
      entityId: String(data?.linkId ?? ''),
      description: 'Идемпотентное обновление/создание Приложения №3',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
      meta: data?.data?.updated,
    });

    return data;
  }

  @Get('by-zapiska/:id')
  getByZapiska(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getByZapiska(id);
  }

  // NEW: история изменений одной строки приложения
  @Get(':rowId/history')
  async getHistory(@Param('rowId', ParseIntPipe) rowId: number) {
    const list = await this.svc.getRowHistory(rowId);
    return { success: true, data: list };
  }
}
