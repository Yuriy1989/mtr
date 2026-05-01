import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { DepartmentsService } from 'src/departments/departments.service';
interface IidUser {
    id: number;
}
export declare class UsersController {
    private readonly usersService;
    private readonly departmentService;
    constructor(usersService: UsersService, departmentService: DepartmentsService);
    createUser(createUserDto: CreateUserDto): Promise<{
        success: boolean;
        data: import("./entities/user.entity").User;
    }>;
    findAll(): Promise<import("./entities/user.entity").User[]>;
    findOne(id: string): Promise<import("./entities/user.entity").User>;
    findOwn(user: any): Promise<import("./entities/user.entity").User>;
    update(updateUserDto: any): Promise<{
        success: boolean;
        data: any;
    }>;
    remove(data: IidUser): Promise<import("typeorm").DeleteResult>;
}
export {};
