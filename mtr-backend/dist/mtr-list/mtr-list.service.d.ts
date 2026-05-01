import { MtrList } from './entities/mtr-list.entity';
import { Repository, DataSource } from 'typeorm';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
export declare class MtrListService {
    private mtrList;
    private dataSource;
    private readonly zapRepo;
    constructor(mtrList: Repository<MtrList>, dataSource: DataSource, zapRepo: Repository<Zapiski>);
    create(createMtrListDto: any): Promise<import("typeorm").InsertResult>;
    findByZapiskaId(zapiskaId: number): Promise<MtrList[]>;
    getByZapiskaWithVl06(zapiskaId: number): Promise<MtrList[]>;
    findAll(): string;
    findOne(id: number): string;
    update(id: number, body: any): Promise<import("typeorm").UpdateResult>;
    remove(id: number): Promise<{
        success: boolean;
        id: number;
    }>;
    syncForZapiska(zapiskaId: number, items: Array<{
        vl06Id: number;
        express?: string;
        note?: string;
        repairObjectName?: string;
    }>): Promise<{
        updatedCount: number;
        removedCount: number;
    }>;
}
