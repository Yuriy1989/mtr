import { Zapiski } from './entities/zapiski.entity';
import { Repository } from 'typeorm';
import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { Application } from 'src/applications/entities/application.entity';
import { TableApplication } from 'src/table-applications/entities/table-application.entity';
import { TransportsService } from 'src/transports/transports.service';
export declare class ZapiskiService {
    private tableZapiskiRepository;
    private readonly mtrRepo;
    private readonly vl06Repo;
    private readonly appRepo;
    private readonly appRowRepo;
    private readonly transports;
    constructor(tableZapiskiRepository: Repository<Zapiski>, mtrRepo: Repository<MtrList>, vl06Repo: Repository<Vl06>, appRepo: Repository<Application>, appRowRepo: Repository<TableApplication>, transports: TransportsService);
    create(createZapiskiDto: any): Promise<Zapiski>;
    findAll(range?: {
        from?: string;
        to?: string;
    }): Promise<Zapiski[]>;
    findOne(id: number): Promise<Zapiski>;
    update(id: number, updateZapiskiDto: any): Promise<import("typeorm").UpdateResult>;
    remove(id: number): Promise<{
        success: boolean;
        data: {
            id: number;
            updatedVl06: number;
        };
    }>;
    sendToWork(id: number): Promise<{
        id: number;
        already: boolean;
        updatedVl06: number;
    } | {
        id: number;
        updatedVl06: number;
        already?: undefined;
    }>;
    sendToSent(id: number): Promise<{
        id: number;
        updatedVl06: number;
        status: number;
    }>;
    getStatsForZapiska(id: number): Promise<{
        byUnit: any;
        byCategory: any;
    }>;
    sendToSent50(id: number): Promise<{
        id: number;
        updatedVl06: number;
        status: number;
    }>;
}
