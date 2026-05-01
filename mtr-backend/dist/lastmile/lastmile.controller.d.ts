import { LastmileService } from './lastmile.service';
export declare class LastmileController {
    private readonly svc;
    constructor(svc: LastmileService);
    listPending(days?: string, status?: string): Promise<{
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
    registry(days?: string): Promise<{
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
