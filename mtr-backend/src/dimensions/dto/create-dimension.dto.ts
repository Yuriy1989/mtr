import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateDimensionDto {
  @IsString()
  nameDimension: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isBase?: boolean;

  // может быть number|string|null — не валидируем тип строго, важно лишь «разрешить» поле
  @IsOptional()
  toBaseFactor?: number | string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];
}
