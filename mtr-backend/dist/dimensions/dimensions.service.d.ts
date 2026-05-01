import { CreateDimensionDto } from './dto/create-dimension.dto';
import { UpdateDimensionDto } from './dto/update-dimension.dto';
import { DimensionCategory } from './entities/dimension-category.entity';
import { Dimension } from './entities/dimension.entity';
import { Repository } from 'typeorm';
import { DimensionAlias } from './entities/dimension-alias.entity';
import { UpsertCategoryDto } from './dto/upsert-category.dto';
export declare class DimensionsService {
    private dimRepo;
    private aliasRepo;
    private catRepo;
    constructor(dimRepo: Repository<Dimension>, aliasRepo: Repository<DimensionAlias>, catRepo: Repository<DimensionCategory>);
    private ensureSingleBaseInCategory;
    create(dto: CreateDimensionDto): Promise<{
        id: number;
        nameDimension: string;
        code: string;
        category: string;
        isBase: boolean;
        toBaseFactor: number;
        aliases: string[];
    }[]>;
    findAll(): Promise<{
        id: number;
        nameDimension: string;
        code: string;
        category: string;
        isBase: boolean;
        toBaseFactor: number;
        aliases: string[];
    }[]>;
    update(id: number, dto: UpdateDimensionDto): Promise<{
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
    getCategoryMap(): Promise<Map<string, DimensionCategory>>;
    listCategories(): Promise<DimensionCategory[]>;
    upsertCategory(dto: UpsertCategoryDto): Promise<DimensionCategory[]>;
    upsertCategories(list: UpsertCategoryDto[]): Promise<DimensionCategory[]>;
}
