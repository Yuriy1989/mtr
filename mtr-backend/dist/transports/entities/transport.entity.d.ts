import { Application } from 'src/applications/entities/application.entity';
export declare enum TransportStatus {
    PENDING = 10,
    APPROVED = 20,
    REJECTED = 30
}
export declare class Transport {
    id: number;
    application: Application;
    status: number;
    rejectReason: string | null;
    wave: number;
    supplyVolumeTotal: number | null;
    shippedTotal: number | null;
    recipientsSummary: string | null;
    cargoFormedSummary: string | null;
    materialsSummary: string | null;
    storages: string[] | null;
    createdAt: Date;
    updatedAt: Date;
}
