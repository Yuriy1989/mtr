// C:\Server\data\htdocs\umtsik\mtr-backend\src\transports\transports.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { TransportsService } from './transports.service';
import { JournalService } from 'src/journal/journal.service';
import { JwtGuard } from 'src/auth/guard/jwtAuth.guard';

@UseGuards(JwtGuard)
@Controller('transports')
export class TransportsController {
  constructor(
    private readonly svc: TransportsService,
    private readonly journal: JournalService,
  ) {}

  @Get()
  async findAll(@Query('status') status?: string) {
    const data = await this.svc.findAll(status ? Number(status) : undefined);
    return { success: true, data };
  }

  @Get('by-application/:appId')
  async byApplication(@Param('appId', ParseIntPipe) appId: number) {
    const data = await this.svc.findByApplication(appId);
    return { success: true, data };
  }

  @Post('from-application/:appId')
  async fromApp(
    @Param('appId', ParseIntPipe) appId: number,
    @Req() req: Request,
  ) {
    const data = await this.svc.createFromApplication(appId);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'create',
      entity: 'TransportRequest',
      entityId: String(data?.id ?? ''),
      description: 'Создана заявка на транспорт из Приложения №3',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
      meta: { applicationId: appId },
    });

    return { success: true, data };
  }

  @Patch(':id/approve')
  async approve(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const data = await this.svc.approve(id);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'approve',
      entity: 'TransportRequest',
      entityId: String(id),
      description: 'Заявка на транспорт согласована',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
    });

    return { success: true, data };
  }

  @Patch('approve/app/:applicationId')
  async approveForApp(
    @Param('applicationId', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const data = await this.svc.approveForApplication(id);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'approve_for_app',
      entity: 'Application',
      entityId: String(id),
      description: 'Приложение согласовано (без заявки)',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
      meta: data,
    });

    return data;
  }

  @Patch('reject/app/:applicationId')
  async rejectForApp(
    @Param('applicationId', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const data = await this.svc.rejectForApplication(id);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'reject_for_app',
      entity: 'Application',
      entityId: String(id),
      description: 'Приложение отклонено (без заявки)',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
      meta: data,
    });

    return data;
  }

  @Patch(':id/reject')
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
    @Req() req: Request,
  ) {
    const data = await this.svc.reject(id, body?.reason);

    await this.journal.log({
      userId: (req as any).user?.id,
      userName: (req as any).user?.username || (req as any).user?.email,
      action: 'reject',
      entity: 'TransportRequest',
      entityId: String(id),
      description: 'Заявка на транспорт отклонена',
      route: req.originalUrl,
      method: req.method,
      ip: (req.headers['x-forwarded-for'] as string) ?? req.ip,
      success: true,
      meta: { reason: body?.reason ?? null },
    });

    return { success: true, data };
  }
}
