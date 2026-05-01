import { DimensionAlias } from './dimension-alias.entity';
export declare class Dimension {
    id: number;
    nameDimension: string;
    code: string;
    category: string;
    isBase: boolean;
    toBaseFactor: string | null;
    aliases: DimensionAlias[];
}
