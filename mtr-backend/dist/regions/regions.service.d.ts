import { CreateRegionDto } from './dto/create-region.dto';
import { Region } from './entities/region.entity';
import { Repository } from 'typeorm';
export declare class RegionsService {
    private regionRepository;
    constructor(regionRepository: Repository<Region>);
    create(createRegionDto: CreateRegionDto): Promise<CreateRegionDto & Region>;
    findAll(): Promise<Region[]>;
    update(updateRegionDto: any, id: number): Promise<import("typeorm").UpdateResult>;
    remove(id: number): Promise<import("typeorm").DeleteResult>;
}
