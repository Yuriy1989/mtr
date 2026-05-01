import { DimensionsService } from './dimensions.service';
import { CreateDimensionDto } from './dto/create-dimension.dto';
import { UpdateDimensionDto } from './dto/update-dimension.dto';
import { UpsertCategoryDto } from './dto/upsert-category.dto';
export declare class DimensionsController {
    private readonly dimensionsService;
    constructor(dimensionsService: DimensionsService);
    create(createDimensionDto: CreateDimensionDto): Promise<{
        id: number;
        nameDimension: string;
        code: string;
        category: string;
        isBase: boolean;
        toBaseFactor: number;
        aliases: string[];
    }[]>;
    listCategories(): Promise<import("./entities/dimension-category.entity").DimensionCategory[]>;
    findAll(): Promise<{
        id: number;
        nameDimension: string;
        code: string;
        category: string;
        isBase: boolean;
        toBaseFactor: number;
        aliases: string[];
    }[]>;
    upsertCategory(body: UpsertCategoryDto | UpsertCategoryDto[]): Promise<import("./entities/dimension-category.entity").DimensionCategory[]>;
    update(id: number, updateDimensionDto: UpdateDimensionDto): Promise<{
        id: number;
        nameDimension: string;
        code: string;
        category: string;
        isBase: boolean;
        toBaseFactor: number;
        aliases: string[];
    }[]>;
    remove(id: number): Promise<{
        id: number;
        nameDimension: string;
        code: string;
        category: string;
        isBase: boolean;
        toBaseFactor: number;
        aliases: string[];
    }[]>;
}
