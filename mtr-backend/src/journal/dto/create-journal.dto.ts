import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateJournalDto {
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsString()
  action!: string;

  @IsOptional()
  @IsString()
  entity?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  meta?: any;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  route?: string;

  @IsOptional()
  @IsBoolean()
  success?: boolean;
}
