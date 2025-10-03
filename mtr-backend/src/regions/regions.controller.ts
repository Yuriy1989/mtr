import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { JwtGuard } from 'src/auth/guard/jwtAuth.guard';

@UseGuards(JwtGuard)
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Post()
  create(@Body() createRegionDto: CreateRegionDto) {
    return this.regionsService.create(createRegionDto);
  }

  @Get()
  findAll() {
    return this.regionsService.findAll();
  }

  @Patch()
  update(@Body() updateRegionDto: any) {
    const id = updateRegionDto.id;
    const data: any = {
      nameRegion: updateRegionDto.name,
      codeRegion: updateRegionDto.codeRegion,
    };
    return this.regionsService.update(data, id);
  }

  @Delete()
  remove(@Body() id: any) {
    return this.regionsService.remove(id);
  }
}
