import { JournalService } from './journal.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { QueryJournalDto } from './dto/query-journal.dto';
import { Request } from 'express';
export declare class JournalController {
    private readonly journalService;
    constructor(journalService: JournalService);
    create(dto: CreateJournalDto, req: Request): Promise<import("./entities/journal.entity").Journal>;
    findAll(query: QueryJournalDto): Promise<{
        items: import("./entities/journal.entity").Journal[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<import("./entities/journal.entity").Journal>;
    update(id: string, dto: UpdateJournalDto): Promise<import("./entities/journal.entity").Journal>;
    remove(id: string): Promise<{
        id: number;
    }>;
}
