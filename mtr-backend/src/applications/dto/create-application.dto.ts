import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateApplicationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;
}
