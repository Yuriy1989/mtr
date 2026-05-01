import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
declare const JwtRefreshStrategy_base: new (...args: any[]) => any;
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    private readonly configService;
    private readonly usersService;
    constructor(configService: ConfigService, usersService: UsersService);
    validate(req: Request, payload: {
        sub: number | string;
        username?: string;
    }): Promise<{
        id: number;
        firstName: string;
        lastName: string;
        surname: string;
        username: string;
        authProvider: string;
        adDn?: string;
        email: string;
        position: string;
        department: import("../../departments/entities/department.entity").Department;
        storage: import("../../storages/entities/storage.entity").Storage;
        region: import("../../regions/entities/region.entity").Region;
        zapiski: import("../../zapiski/entities/zapiski.entity").Zapiski[];
        application: import("../../applications/entities/application.entity").Application[];
        roles: string[];
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
