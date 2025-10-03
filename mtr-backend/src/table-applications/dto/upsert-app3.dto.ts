import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertAppendix3ItemDto {
  @IsInt()
  @Min(1)
  mtrListId: number;

  @IsOptional() @IsString() dateRequest?: string | null;
  @IsOptional() @IsString() dateShipment?: string | null;
  @IsOptional() @IsString() format?: string | null;
  @IsOptional() @IsString() transportNumber?: string | null;
  @IsOptional() @IsString() transit?: string | null;
  @IsOptional() @IsString() dateM11?: string | null;
  @IsOptional() @IsString() numberM11?: string | null;
  @IsOptional() shippedQty?: number | null;
  @IsOptional() @IsString() note?: string | null;
  remainder: null;
}

export class UpsertAppendix3Dto {
  @IsInt()
  @Min(1)
  zapiskaId: number;

  @IsInt()
  @Min(1)
  userId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertAppendix3ItemDto)
  items: UpsertAppendix3ItemDto[];
}
