import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LastmileService } from './lastmile.service';
import { JwtGuard } from 'src/auth/guard/jwtAuth.guard';

@UseGuards(JwtGuard)
@Controller('lastmile')
export class LastmileController {
  constructor(private readonly svc: LastmileService) {}

  // Пул "на приёмку"
  @Get('pending')
  listPending(@Query('days') days?: string, @Query('status') status?: string) {
    return this.svc.listPending({
      days: Number(days) || 7,
      status: status ? Number(status) : undefined,
    });
  }

  // Карточка приёмки (редактируемая)
  @Get('acceptance/:appId')
  getAcceptance(@Param('appId', ParseIntPipe) appId: number) {
    return this.svc.getAcceptance(appId);
  }

  // Завершение приёмки
  @Post('accept/:appId')
  accept(
    @Param('appId', ParseIntPipe) appId: number,
    @Body()
    decisions: Array<{
      tableApplicationRowId: number;
      accepted: boolean;
      reason?: string | null;
    }>,
  ) {
    return this.svc.accept(appId, decisions);
  }

  // Реестр — список завершённых
  @Get('registry')
  registry(@Query('days') days?: string) {
    return this.svc.registry(Number(days) || 30);
  }

  // Реестр — карточка (read-only)
  @Get('registry/:appId')
  registryDetail(@Param('appId', ParseIntPipe) appId: number) {
    return this.svc.registryDetail(appId);
  }
}
