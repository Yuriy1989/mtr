import { Response } from 'express';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SigninToketDto } from './dto/signin.dto';
import { AdSigninDto } from './dto/ad-signin.dto';
import { AdAuthService } from './ad-auth.service';
import { UpdateAdSettingsDto } from './dto/ad-settings.dto';
import { ImportAdUserDto } from './dto/import-ad-user.dto';
export declare class AuthController {
    private usersService;
    private authService;
    private adAuthService;
    constructor(usersService: UsersService, authService: AuthService, adAuthService: AdAuthService);
    signin(req: any, res: Response, dto: SigninToketDto): Promise<{
        access_token: string;
        user: any;
    }>;
    signinAd(res: Response, dto: AdSigninDto): Promise<{
        access_token: string;
        user: {
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
        };
    }>;
    getAdSettings(req: any): Promise<{
        bindPassword: any;
        hasBindPassword: boolean;
        id: number;
        enabled: boolean;
        url: string;
        domain: string;
        baseDn: string;
        bindUsername?: string;
        userDnTemplate: string;
        timeout: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateAdSettings(req: any, dto: UpdateAdSettingsDto): Promise<{
        bindPassword: any;
        hasBindPassword: boolean;
        id: number;
        enabled: boolean;
        url: string;
        domain: string;
        baseDn: string;
        bindUsername?: string;
        userDnTemplate: string;
        timeout: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getAdUsers(req: any, search?: string): Promise<any[]>;
    importAdUser(req: any, dto: ImportAdUserDto): Promise<{
        success: boolean;
        data: import("../users/entities/user.entity").User[];
    }>;
    signup(createUserDto: CreateUserDto): Promise<import("../users/entities/user.entity").User>;
    me(req: any): {
        user: any;
    };
    refreshToken(req: any, res: Response): Promise<{
        access_token: string;
    }>;
    private setRefreshCookie;
    private ensureAdmin;
}
