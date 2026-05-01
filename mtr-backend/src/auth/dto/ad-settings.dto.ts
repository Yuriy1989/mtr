import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateAdSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  baseDn?: string;

  @IsOptional()
  @IsString()
  bindUsername?: string;

  @IsOptional()
  @IsString()
  bindPassword?: string;

  @IsOptional()
  @IsString()
  userDnTemplate?: string;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(60000)
  timeout?: number;
}
