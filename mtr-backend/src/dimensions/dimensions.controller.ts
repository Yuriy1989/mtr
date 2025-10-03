// src/dimensions/dimensions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { DimensionsService } from './dimensions.service';
import { CreateDimensionDto } from './dto/create-dimension.dto';
import { UpdateDimensionDto } from './dto/update-dimension.dto';
import { UpsertCategoryDto } from './dto/upsert-category.dto';
import { JwtGuard } from 'src/auth/guard/jwtAuth.guard';

@UseGuards(JwtGuard)
@Controller('dimensions')
export class DimensionsController {
  constructor(private readonly dimensionsService: DimensionsService) {}

  @Post()
  create(@Body() createDimensionDto: CreateDimensionDto) {
    return this.dimensionsService.create(createDimensionDto);
  }

  @Get('categories')
  listCategories() {
    return this.dimensionsService.listCategories();
  }

  @Get()
  findAll() {
    return this.dimensionsService.findAll();
  }

  @Patch('categories')
  upsertCategory(@Body() body: UpsertCategoryDto | UpsertCategoryDto[]) {
    return Array.isArray(body)
      ? this.dimensionsService.upsertCategories(body)
      : this.dimensionsService.upsertCategory(body);
  }

  // === ВАЖНО: единственный PATCH для обновления единицы ===
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDimensionDto: UpdateDimensionDto,
  ) {
    // ВАЖНО: передаём два аргумента — id и dto
    return this.dimensionsService.update(id, updateDimensionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.dimensionsService.remove(id);
  }
}
