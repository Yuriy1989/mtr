import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FilialsService } from './filials.service';
import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';
import { JwtGuard } from 'src/auth/guard/jwtAuth.guard';

@UseGuards(JwtGuard)
@Controller('filials')
export class FilialsController {
  constructor(private readonly filialsService: FilialsService) {}

  @Post()
  create(@Body() createFilialDto: CreateFilialDto) {
    return this.filialsService.create(createFilialDto);
  }

  @Get()
  findAll() {
    return this.filialsService.findAll();
  }

  @Patch()
  update(@Body() updateFilialDto: UpdateFilialDto) {
    return this.filialsService.update(updateFilialDto);
  }

  @Delete()
  remove(@Body() id: UpdateFilialDto) {
    return this.filialsService.remove(id);
  }
}
