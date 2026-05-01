import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class ImportAdUserDto {
  @IsString()
  username: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  surname: string;

  @IsString()
  email: string;

  @IsString()
  position: string;

  @IsInt()
  department: number;

  @IsOptional()
  @IsInt()
  storage?: number;

  @IsOptional()
  @IsInt()
  region?: number;

  @IsArray()
  roles: string[];

  @IsOptional()
  @IsString()
  adDn?: string;
}
