import { CreateDepartmentDto } from 'src/departments/dto/create-department.dto';
import { CreateRegionDto } from 'src/regions/dto/create-region.dto';
import { CreateStorageDto } from 'src/storages/dto/create-storage.dto';
export declare class CreateUserDto {
    firstName: string;
    lastName: string;
    surname: string;
    username: string;
    password?: string;
    authProvider?: string;
    adDn?: string;
    email: string;
    position: string;
    department: CreateDepartmentDto;
    storage?: CreateStorageDto;
    region?: CreateRegionDto;
    roles: string[];
}
