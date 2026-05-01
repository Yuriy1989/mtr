import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';
import { Repository } from 'typeorm';
export declare class DepartmentsService {
    private departmentRepository;
    constructor(departmentRepository: Repository<Department>);
    create(createDepartmentDto: CreateDepartmentDto): Promise<CreateDepartmentDto & Department>;
    findAll(): Promise<Department[]>;
    findByOne(id: number): Promise<Department>;
    update(updateDepartmentDto: UpdateDepartmentDto): Promise<import("typeorm").UpdateResult>;
    remove(id: number): Promise<import("typeorm").DeleteResult>;
}
