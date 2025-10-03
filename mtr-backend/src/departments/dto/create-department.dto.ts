import { IsString } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  nameDepartment: string;

  @IsString()
  numberDepartment: string;
}
