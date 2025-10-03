import { IsOptional, IsString } from 'class-validator';

export class CreateTableApplicationDto {
  @IsOptional() @IsString() lengthObject?: string | null;
  @IsOptional() @IsString() width?: string | null;
  @IsOptional() @IsString() height?: string | null;
  @IsOptional() @IsString() massa?: string | null;

  @IsOptional() @IsString() dateRequest?: string | null;
  @IsOptional() @IsString() transport?: string | null; // 'container' | 'auto'
  @IsOptional() @IsString() dateShipment?: string | null;
  @IsOptional() @IsString() format?: string | null; // 'container' | 'auto'
  @IsOptional() @IsString() transportNumber?: string | null;

  @IsOptional() @IsString() discarded?: string | null;
  @IsOptional() @IsString() remainder?: string | null;
  @IsOptional() @IsString() transit?: string | null;

  @IsOptional() @IsString() numberM11?: string | null;
  @IsOptional() @IsString() dateM11?: string | null;

  @IsOptional() @IsString() addNote?: string | null;
}
