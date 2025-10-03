import { IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVl06Dto {
  @IsOptional() @IsString() supply?: string;
  @IsOptional() @IsString() factory?: string;
  @IsOptional() @IsString() storage?: string;

  // ожидаем ISO-дату "YYYY-MM-DD" (или полную ISO 8601)
  @IsOptional() @IsDateString() vacationOfTheMaterial?: string | null;

  @IsOptional() @IsString() material?: string | null;
  @IsOptional() @IsString() party?: string | null;
  @IsOptional() @IsString() nameMTR?: string | null;
  @IsOptional() @IsString() basic?: string | null;

  // число! + преобразование из строки, если вдруг прилетит
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  supplyVolume?: number;

  @IsOptional() @IsString() address?: string | null;
  @IsOptional() @IsString() created?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;
}
