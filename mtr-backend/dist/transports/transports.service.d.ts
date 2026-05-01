import { Repository } from 'typeorm';
import { Transport } from './entities/transport.entity';
import { Application } from 'src/applications/entities/application.entity';
import { TableApplication } from 'src/table-applications/entities/table-application.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
export declare class TransportsService {
    private readonly trRepo;
    private readonly appRepo;
    private readonly appRowRepo;
    private readonly mtrRepo;
    private readonly vl06Repo;
    private readonly zapRepo;
    constructor(trRepo: Repository<Transport>, appRepo: Repository<Application>, appRowRepo: Repository<TableApplication>, mtrRepo: Repository<MtrList>, vl06Repo: Repository<Vl06>, zapRepo: Repository<Zapiski>);
    private parseNum;
    private hasRemainders;
    private buildSnapshot;
    private buildSnapshotForShippedOnly;
    createFromApplication(appId: number): Promise<Transport>;
    createNewFromApplication(appId: number): Promise<Transport>;
    findAll(status?: number): Promise<Transport[]>;
    findOne(id: number): Promise<Transport>;
    findByApplication(appId: number): Promise<Transport[]>;
    approve(id: number): Promise<Transport>;
    reject(id: number, reason: string): Promise<Transport>;
    approveForApplication(applicationId: number): Promise<{
        applicationId: number;
        status: number;
        sendLock: boolean;
    }>;
    rejectForApplication(applicationId: number, reason?: string): Promise<{
        applicationId: number;
        status: number;
        sendLock: boolean;
        reason: string;
    }>;
}
