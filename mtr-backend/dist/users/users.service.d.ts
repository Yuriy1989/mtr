import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { FindOneOptions, Repository } from 'typeorm';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    findById(id: number): Promise<User>;
    findOne(query: FindOneOptions<User>): Promise<User>;
    findByUsername(username: string): Promise<User>;
    upsertAdUser(data: any): Promise<User[]>;
    update(id: number, updateUserDto: any): Promise<any>;
    remove(id: number): Promise<import("typeorm").DeleteResult>;
}
