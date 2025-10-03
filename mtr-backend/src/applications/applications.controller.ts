// C:\Server\data\htdocs\umtsik\mtr-backend\src\applications\applications.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JournalService } from 'src/journal/journal.service';
import { JwtGuard } from '../auth/guard/jwtAuth.guard';

@UseGuards(JwtGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly journal: JournalService,
  ) {}

  @Post()
  async create(@Body() dto: CreateApplicationDto, @Req() req: Request) {
    const data = await this.applicationsService.create(dto);

    // journal
    await this.journal.log({
      userId: (req as any).user?.id,
      userName:
        (req as any).user?.username ||
        (req as any).user?.email ||
        [(req as any).user?.surname, (req as any).user?.firstName]
          .filter(Boolean)
          .join(' '),
      action: 'create',
      entity: 'Application',
      entityId: String(data?.id ?? ''),
      description: 'Создано Приложение №3',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
      meta: dto ? { hasDto: true } : undefined,
    });

    return { success: true, data };
  }

  @Get('all')
  findAllDetailed(@Query('start') start?: string, @Query('end') end?: string) {
    // отдаём в сервис как ISO-строки; null если не пришло
    return this.applicationsService.findAllDetailed(
      start ? new Date(start) : null,
      end ? new Date(end) : null,
    );
  }

  @Get()
  async findAll() {
    const data = await this.applicationsService.findAll();
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.applicationsService.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApplicationDto,
    @Req() req: Request,
  ) {
    const data = await this.applicationsService.update(id, dto);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'update',
      entity: 'Application',
      entityId: String(id),
      description: 'Обновлено Приложение №3',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
    });

    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    // ← req
    const data = await this.applicationsService.remove(id);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'delete',
      entity: 'Application',
      entityId: String(id),
      description: 'Удалено Приложение №3 (со сменой статусов связей)',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
      meta: data?.data?.updatedStatuses,
    });

    return { success: true, data };
  }
}
