import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
export declare class RegionsController {
    private readonly regionsService;
    constructor(regionsService: RegionsService);
    create(createRegionDto: CreateRegionDto): Promise<CreateRegionDto & import("./entities/region.entity").Region>;
    findAll(): Promise<import("./entities/region.entity").Region[]>;
    update(updateRegionDto: any): Promise<import("typeorm").UpdateResult>;
    remove(id: any): Promise<import("typeorm").DeleteResult>;
}
