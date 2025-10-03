import { IsOptional, IsString } from 'class-validator';

export class UpsertCategoryDto {
  @IsString()
  key: string; // например "length"

  @IsString()
  nameRu: string; // например "Длина"

  @IsOptional()
  @IsString()
  nameEn?: string;
}
