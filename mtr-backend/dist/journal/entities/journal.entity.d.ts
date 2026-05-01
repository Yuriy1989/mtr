export declare class Journal {
    id: number;
    createdAt: Date;
    userId: number | null;
    userName: string | null;
    action: string;
    entity: string | null;
    entityId: string | null;
    description: string | null;
    meta: any;
    ip: string | null;
    method: string | null;
    route: string | null;
    success: boolean;
}
