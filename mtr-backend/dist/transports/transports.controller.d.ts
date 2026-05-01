import { Request } from 'express';
import { TransportsService } from './transports.service';
import { JournalService } from 'src/journal/journal.service';
export declare class TransportsController {
    private readonly svc;
    private readonly journal;
    constructor(svc: TransportsService, journal: JournalService);
    findAll(status?: string): Promise<{
        success: boolean;
        data: import("./entities/transport.entity").Transport[];
    }>;
    byApplication(appId: number): Promise<{
        success: boolean;
        data: import("./entities/transport.entity").Transport[];
    }>;
    fromApp(appId: number, req: Request): Promise<{
        success: boolean;
        data: import("./entities/transport.entity").Transport;
    }>;
    approve(id: number, req: Request): Promise<{
        success: boolean;
        data: import("./entities/transport.entity").Transport;
    }>;
    approveForApp(id: number, req: Request): Promise<{
        applicationId: number;
        status: number;
        sendLock: boolean;
    }>;
    rejectForApp(id: number, req: Request): Promise<{
        applicationId: number;
        status: number;
        sendLock: boolean;
        reason: string;
    }>;
    reject(id: number, body: {
        reason: string;
    }, req: Request): Promise<{
        success: boolean;
        data: import("./entities/transport.entity").Transport;
    }>;
}
