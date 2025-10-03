import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateZapiskiDto {
  userId: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;
}
