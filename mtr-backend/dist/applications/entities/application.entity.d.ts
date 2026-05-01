import { TableApplication } from 'src/table-applications/entities/table-application.entity';
import { User } from 'src/users/entities/user.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
export declare class Application {
    id: number;
    zapiska: Zapiski;
    tableApp: TableApplication[];
    user: User | null;
    status: number;
    sendLock: boolean;
    createdAt: Date;
    updatedAt: Date;
}
