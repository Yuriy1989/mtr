import { IsArray, ArrayNotEmpty, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVl06StatusesDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  ids: number[];

  @Type(() => Number)
  @IsInt()
  status: number;
}
