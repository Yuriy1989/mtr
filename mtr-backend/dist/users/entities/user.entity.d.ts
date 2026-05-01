import { Department } from '../../departments/entities/department.entity';
import { Storage } from 'src/storages/entities/storage.entity';
import { Region } from 'src/regions/entities/region.entity';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
import { Application } from 'src/applications/entities/application.entity';
export declare class User {
    id: number;
    firstName: string;
    lastName: string;
    surname: string;
    username: string;
    password: string;
    authProvider: string;
    adDn?: string;
    email: string;
    position: string;
    department: Department;
    storage: Storage;
    region: Region;
    zapiski: Zapiski[];
    application: Application[];
    roles: string[];
    createdAt: Date;
    updatedAt: Date;
}
