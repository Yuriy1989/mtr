// src/dimensions/dto/update-dimension.dto.ts
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateDimensionDto {
  // ВНИМАНИЕ: поля id здесь больше нет
  @IsOptional() @IsString() nameDimension?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsBoolean() isBase?: boolean;
  @IsOptional() toBaseFactor?: number | string | null;
  @IsOptional() @IsArray() aliases?: string[]; // строки проверим в сервисе
}
