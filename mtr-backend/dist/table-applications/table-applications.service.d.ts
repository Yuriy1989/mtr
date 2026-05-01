import { Repository } from 'typeorm';
import { TableApplication } from './entities/table-application.entity';
import { CreateTableApplicationDto } from './dto/create-table-application.dto';
import { UpdateTableApplicationDto } from './dto/update-table-application.dto';
import { UpsertAppendix3Dto } from './dto/upsert-app3.dto';
import { Application } from 'src/applications/entities/application.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { TableApplicationHistory } from './entities/table-application-history.entity';
export declare class TableApplicationsService {
    private readonly appRowRepo;
    private readonly applicationRepo;
    private readonly zapRepo;
    private readonly vl06Repo;
    private readonly mtrRepo;
    private readonly historyRepo;
    constructor(appRowRepo: Repository<TableApplication>, applicationRepo: Repository<Application>, zapRepo: Repository<Zapiski>, vl06Repo: Repository<Vl06>, mtrRepo: Repository<MtrList>, historyRepo: Repository<TableApplicationHistory>);
    create(dto: CreateTableApplicationDto): Promise<TableApplication>;
    update(id: number, dto: UpdateTableApplicationDto): Promise<TableApplication>;
    upsertApp3(dto: UpsertAppendix3Dto): Promise<{
        success: boolean;
        linkId: number;
        data: {
            applicationId: number;
            updated: {
                applicationStatus: number;
                zapiskaStatus: number;
                vl06Status: number;
                vl06Count: number;
            };
        };
    }>;
    getByZapiska(zapiskaId: number): Promise<{
        success: boolean;
        data: {
            application: Application;
            rows: TableApplication[];
        };
    }>;
    getRowHistory(rowId: number): Promise<TableApplicationHistory[]>;
}
