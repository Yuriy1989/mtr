import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { StoragesService } from './storages.service';
import { CreateStorageDto } from './dto/create-storage.dto';
import { JwtGuard } from 'src/auth/guard/jwtAuth.guard';

@UseGuards(JwtGuard)
@Controller('storages')
export class StoragesController {
  constructor(private readonly storagesService: StoragesService) {}

  @Post()
  create(@Body() createStorageDto: CreateStorageDto) {
    return this.storagesService.create(createStorageDto);
  }

  @Get()
  findAll() {
    return this.storagesService.findAll();
  }

  @Patch()
  update(@Body() updateStorageDto: any) {
    const id = updateStorageDto.id;
    const data: any = {
      nameStorage: updateStorageDto.name,
    };
    return this.storagesService.update(data, id);
  }

  @Delete()
  remove(@Body() id: any) {
    return this.storagesService.remove(id.id);
  }
}
