import { StoragesService } from './storages.service';
import { CreateStorageDto } from './dto/create-storage.dto';
export declare class StoragesController {
    private readonly storagesService;
    constructor(storagesService: StoragesService);
    create(createStorageDto: CreateStorageDto): Promise<CreateStorageDto & import("./entities/storage.entity").Storage>;
    findAll(): Promise<import("./entities/storage.entity").Storage[]>;
    update(updateStorageDto: any): Promise<import("typeorm").UpdateResult>;
    remove(id: any): Promise<import("typeorm").DeleteResult>;
}
