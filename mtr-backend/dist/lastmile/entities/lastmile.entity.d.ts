import { Application } from 'src/applications/entities/application.entity';
import { TableApplication } from 'src/table-applications/entities/table-application.entity';
export declare class LastmileDecision {
    id: number;
    application: Application;
    row: TableApplication;
    accepted: boolean;
    reason: string | null;
    createdAt: Date;
    updatedAt: Date;
}
