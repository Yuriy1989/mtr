import { Request } from 'express';
import { MtrListService } from './mtr-list.service';
import { JournalService } from 'src/journal/journal.service';
export declare class MtrListController {
    private readonly mtrListService;
    private readonly journal;
    constructor(mtrListService: MtrListService, journal: JournalService);
    create(createMtrListDto: any, req: Request): Promise<import("typeorm").InsertResult>;
    findAll(): string;
    findById(id: string): Promise<import("./entities/mtr-list.entity").MtrList[]>;
    getByZapiska(id: number): Promise<{
        success: boolean;
        data: import("./entities/mtr-list.entity").MtrList[];
    }>;
    update(id: number, updateMtrListDto: any, req: Request): Promise<import("typeorm").UpdateResult>;
    syncForZapiska(zapiskaId: number, items: Array<{
        vl06Id: number;
        express?: string;
        note?: string;
    }>, req: Request): Promise<{
        updatedCount: number;
        removedCount: number;
    }>;
    remove(id: string, req: Request): Promise<{
        success: boolean;
        id: number;
    }>;
}
