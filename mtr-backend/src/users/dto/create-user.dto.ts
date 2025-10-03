import { IsString, IsInt, IsOptional, IsArray } from 'class-validator';
import { CreateDepartmentDto } from 'src/departments/dto/create-department.dto';
import { CreateRegionDto } from 'src/regions/dto/create-region.dto';
import { CreateStorageDto } from 'src/storages/dto/create-storage.dto';

export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  surname: string;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  email: string;

  @IsString()
  position: string;

  @IsInt()
  department: CreateDepartmentDto;

  @IsOptional()
  @IsInt()
  storage?: CreateStorageDto;

  @IsOptional()
  @IsInt()
  region?: CreateRegionDto;

  @IsArray()
  roles: string[];
}
