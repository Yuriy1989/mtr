import { Request } from 'express';
import { TableApplicationsService } from './table-applications.service';
import { CreateTableApplicationDto } from './dto/create-table-application.dto';
import { UpdateTableApplicationDto } from './dto/update-table-application.dto';
import { UpsertAppendix3Dto } from './dto/upsert-app3.dto';
import { JournalService } from 'src/journal/journal.service';
export declare class TableApplicationsController {
    private readonly svc;
    private readonly journal;
    constructor(svc: TableApplicationsService, journal: JournalService);
    create(dto: CreateTableApplicationDto, req: Request): Promise<import("./entities/table-application.entity").TableApplication>;
    update(id: number, dto: UpdateTableApplicationDto, req: Request): Promise<import("./entities/table-application.entity").TableApplication>;
    upsert(dto: UpsertAppendix3Dto, req: Request): Promise<{
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
    getByZapiska(id: number): Promise<{
        success: boolean;
        data: {
            application: import("../applications/entities/application.entity").Application;
            rows: import("./entities/table-application.entity").TableApplication[];
        };
    }>;
    getHistory(rowId: number): Promise<{
        success: boolean;
        data: import("./entities/table-application-history.entity").TableApplicationHistory[];
    }>;
}
