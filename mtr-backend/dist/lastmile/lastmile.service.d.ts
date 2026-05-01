import { Repository } from 'typeorm';
import { Application } from 'src/applications/entities/application.entity';
import { TableApplication } from 'src/table-applications/entities/table-application.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { Vl06 } from 'src/vl06/entities/vl06.entity';
import { LastmileDecision } from './entities/lastmile.entity';
export declare class LastmileService {
    private readonly appRepo;
    private readonly rowRepo;
    private readonly zapRepo;
    private readonly mtrRepo;
    private readonly vl06Repo;
    private readonly decRepo;
    constructor(appRepo: Repository<Application>, rowRepo: Repository<TableApplication>, zapRepo: Repository<Zapiski>, mtrRepo: Repository<MtrList>, vl06Repo: Repository<Vl06>, decRepo: Repository<LastmileDecision>);
    private parseNum;
    listPending({ days, status }: {
        days?: number;
        status?: number;
    }): Promise<{
        success: boolean;
        data: {
            id: number;
            appId: number;
            zapiskaId: number;
            status: number;
            createdAt: Date;
            appCreatedAt: Date;
            zapiskaCreatedAt: Date;
            shippedCount: number;
        }[];
    }>;
    getAcceptance(appId: number): Promise<{
        success: boolean;
        data: {
            application: {
                id: number;
                zapiskaId: number;
                status: number;
                createdAt: Date;
                updatedAt: Date;
            };
            rows: {
                id: number;
                nameMTR: string;
                storage: string;
                supplyVolume: number;
                shippedQty: number;
                transit: string;
                format: string;
                transportNumber: string;
                decision: any;
            }[];
        };
    }>;
    accept(appId: number, decisions: Array<{
        tableApplicationRowId: number;
        accepted: boolean;
        reason?: string | null;
    }>): Promise<{
        success: boolean;
        data: {
            applicationId: number;
            status: number;
        };
    }>;
    registry(days?: number): Promise<{
        success: boolean;
        data: {
            id: number;
            appId: number;
            applicationCreatedAt: Date;
            zapiskaId: number;
            zapiskaCreatedAt: Date;
            status: number;
            updatedAt: Date;
            createdAt: Date;
        }[];
    }>;
    registryDetail(appId: number): Promise<{
        success: boolean;
        data: {
            application: {
                id: number;
                zapiskaId: number;
                status: number;
                createdAt: Date;
                updatedAt: Date;
            };
            rows: {
                id: number;
                nameMTR: string;
                storage: string;
                supplyVolume: number;
                shippedQty: number;
                transit: string;
                format: string;
                transportNumber: string;
                decision: {
                    accepted: boolean;
                    reason: string;
                    decidedAt: Date;
                };
            }[];
        };
    }>;
}
