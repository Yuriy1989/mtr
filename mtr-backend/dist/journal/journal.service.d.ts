import { Repository } from 'typeorm';
import { Journal } from './entities/journal.entity';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { QueryJournalDto } from './dto/query-journal.dto';
export declare class JournalService {
    private readonly repo;
    constructor(repo: Repository<Journal>);
    create(createJournalDto: CreateJournalDto): Promise<Journal>;
    findAll(query: QueryJournalDto): Promise<{
        items: Journal[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: number): Promise<Journal>;
    update(id: number, updateJournalDto: UpdateJournalDto): Promise<Journal>;
    remove(id: number): Promise<{
        id: number;
    }>;
    log(params: CreateJournalDto): Promise<Journal>;
}
