import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AcceptDecisionDto {
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 123 })
  tableApplicationRowId: number;

  @IsBoolean()
  @ApiProperty({ example: true })
  accepted: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Повреждение упаковки', required: false })
  reason?: string;
}

export class AcceptApplicationDto {
  @IsArray()
  @IsNotEmpty()
  @ApiProperty({ type: [AcceptDecisionDto] })
  decisions: AcceptDecisionDto[];
}
