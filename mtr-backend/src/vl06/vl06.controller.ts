// C:\Server\data\htdocs\umtsik\mtr-backend\src\vl06\vl06.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseArrayPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Vl06Service } from './vl06.service';
import { CreateVl06Dto } from './dto/create-vl06.dto';
import { UpdateVl06StatusesDto } from './dto/update-vl06-statuses.dto';
import { JournalService } from 'src/journal/journal.service';
import { JwtGuard } from 'src/auth/guard/jwtAuth.guard';

@UseGuards(JwtGuard)
@Controller('vl06')
export class Vl06Controller {
  constructor(
    private readonly vl06Service: Vl06Service,
    private readonly journal: JournalService,
  ) {}

  @Post()
  async create(@Body() createVl06Dto: CreateVl06Dto, @Req() req: Request) {
    const data = await this.vl06Service.create(createVl06Dto);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'create',
      entity: 'VL06',
      entityId: String(data?.id ?? ''),
      description: 'Создана запись VL06',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
    });

    return { success: true, data };
  }

  @Post('bulk')
  async createMany(
    @Body(new ParseArrayPipe({ items: CreateVl06Dto })) dtos: CreateVl06Dto[],
    @Req() req: Request,
  ) {
    const data = await this.vl06Service.createMany(dtos);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'create_many',
      entity: 'VL06',
      description: 'Массовая загрузка VL06',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
      meta: { count: Array.isArray(data) ? data.length : dtos.length },
    });

    return { success: true, data };
  }

  @Get()
  async findAll() {
    const data = await this.vl06Service.findAll();
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any, @Req() req: Request) {
    const data = await this.vl06Service.update(+id, dto);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'update',
      entity: 'VL06',
      entityId: String(id),
      description: 'Обновлена запись VL06',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
    });

    return { success: true, data };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: any,
    @Req() req: Request,
  ) {
    const data = await this.vl06Service.updateStatus(+id, dto.status);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'update_status',
      entity: 'VL06',
      entityId: String(id),
      description: 'Изменён статус VL06',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
      meta: { status: dto?.status },
    });

    return { success: true, data };
  }

  @Patch('status/bulk')
  async updateStatuses(
    @Body() dto: UpdateVl06StatusesDto,
    @Req() req: Request,
  ) {
    const data = await this.vl06Service.updateStatuses(dto.ids, dto.status);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'update_status_bulk',
      entity: 'VL06',
      description: 'Массовая смена статусов VL06',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
      meta: { ids: dto.ids?.length ?? 0, status: dto.status },
    });

    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const data = await this.vl06Service.remove(+id);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'delete',
      entity: 'VL06',
      entityId: String(id),
      description: 'Удалена запись VL06',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
    });

    return { success: true, data };
  }
}
