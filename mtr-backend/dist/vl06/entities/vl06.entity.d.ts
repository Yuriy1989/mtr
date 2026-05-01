import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
export declare class Vl06 {
    id: number;
    supply: string;
    factory: string;
    storage: string;
    vacationOfTheMaterial: Date | null;
    material: string;
    party: string;
    nameMTR: string;
    basic: string;
    supplyVolume: number | null;
    address: string;
    created: string;
    mtrList: MtrList[];
    status: number;
    createdAt: Date;
    updatedAt: Date;
}
