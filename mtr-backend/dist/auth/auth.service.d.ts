import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { ILoginUser } from '../helpers/types';
export declare class AuthService {
    private jwtService;
    private usersService;
    private configService;
    constructor(jwtService: JwtService, usersService: UsersService, configService: ConfigService);
    auth(id: number, user: ILoginUser): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    validatePassword(username: string, password: string): Promise<{
        id: number;
        firstName: string;
        lastName: string;
        surname: string;
        username: string;
        authProvider: string;
        adDn?: string;
        email: string;
        position: string;
        department: import("../departments/entities/department.entity").Department;
        storage: import("../storages/entities/storage.entity").Storage;
        region: import("../regions/entities/region.entity").Region;
        zapiski: import("../zapiski/entities/zapiski.entity").Zapiski[];
        application: import("../applications/entities/application.entity").Application[];
        roles: string[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    refreshTokens(userId: number, refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
}
