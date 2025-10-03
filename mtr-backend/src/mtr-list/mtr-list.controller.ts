// C:\Server\data\htdocs\umtsik\mtr-backend\src\mtr-list\mtr-list.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { MtrListService } from './mtr-list.service';
import { JournalService } from 'src/journal/journal.service';
import { JwtGuard } from 'src/auth/guard/jwtAuth.guard';

@UseGuards(JwtGuard)
@Controller('mtr-list')
export class MtrListController {
  constructor(
    private readonly mtrListService: MtrListService,
    private readonly journal: JournalService,
  ) {}

  @Post()
  async create(@Body() createMtrListDto: any, @Req() req: Request) {
    const data = await this.mtrListService.create(createMtrListDto);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'create',
      entity: 'MtrList',
      description: 'Созданы строки MTR для служебки',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
      meta: {
        count: Array.isArray(createMtrListDto) ? createMtrListDto.length : 1,
      },
    });

    return data;
  }

  @Get()
  findAll() {
    return this.mtrListService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.mtrListService.findByZapiskaId(+id);
  }

  @Get('by-zapiska/:id')
  async getByZapiska(@Param('id', ParseIntPipe) id: number) {
    const data = await this.mtrListService.getByZapiskaWithVl06(id);
    return { success: true, data };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMtrListDto: any,
    @Req() req: Request,
  ) {
    const data = await this.mtrListService.update(+id, updateMtrListDto);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'update',
      entity: 'MtrList',
      entityId: String(id),
      description: 'Обновлена строка MTR',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
    });

    return data;
  }

  @Put('sync/:zapiskaId')
  async syncForZapiska(
    @Param('zapiskaId', ParseIntPipe) zapiskaId: number,
    @Body()
    items: Array<{ vl06Id: number; express?: string; note?: string }>,
    @Req() req: Request,
  ) {
    const data = await this.mtrListService.syncForZapiska(zapiskaId, items);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'sync',
      entity: 'MtrList',
      entityId: String(zapiskaId),
      description: 'Синхронизированы строки MTR для служебки',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
      meta: data,
    });

    return data;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const data = await this.mtrListService.remove(+id);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'delete',
      entity: 'MtrList',
      entityId: String(id),
      description: 'Удалена строка MTR',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
    });

    return data;
  }
}
