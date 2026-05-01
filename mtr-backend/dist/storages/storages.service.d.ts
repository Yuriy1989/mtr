import { CreateStorageDto } from './dto/create-storage.dto';
import { Repository } from 'typeorm';
import { Storage } from './entities/storage.entity';
export declare class StoragesService {
    private storageRepository;
    constructor(storageRepository: Repository<Storage>);
    create(createStorageDto: CreateStorageDto): Promise<CreateStorageDto & Storage>;
    findAll(): Promise<Storage[]>;
    update(updateStorageDto: any, id: number): Promise<import("typeorm").UpdateResult>;
    remove(id: number): Promise<import("typeorm").DeleteResult>;
}
