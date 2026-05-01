import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
export declare class MtrList {
    id: number;
    express: string;
    note: string;
    repairObjectName: string;
    zapiska: Zapiski;
    vl06: Vl06;
    createdAt: Date;
    updatedAt: Date;
}
