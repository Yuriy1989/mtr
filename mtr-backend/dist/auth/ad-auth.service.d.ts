import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { AdSettings } from './entities/ad-settings.entity';
import { UpdateAdSettingsDto } from './dto/ad-settings.dto';
interface DomainUser {
    username: string;
    firstName: string;
    lastName: string;
    surname: string;
    email: string;
    position: string;
    displayName: string;
    userPrincipalName: string;
    distinguishedName: string;
}
export declare class AdAuthService {
    private readonly configService;
    private readonly adSettingsRepository;
    private readonly logger;
    constructor(configService: ConfigService, adSettingsRepository: Repository<AdSettings>);
    validateCredentials(username: string, password: string): Promise<void>;
    getPublicSettings(): Promise<{
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
    updateSettings(dto: UpdateAdSettingsDto): Promise<{
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
    findDomainUsers(query?: string): Promise<DomainUser[]>;
    normalizeUsername(username: string): string;
    private getSettingsEntity;
    private getEffectiveSettings;
    private getBindDn;
    private bind;
    private searchUsers;
    private getUsersSearchFilter;
    private escapeFilterValue;
    private mapDomainUser;
    private matchesDomainUser;
    private getAttr;
    private encrypt;
    private decrypt;
    private getEncryptionKey;
}
export {};
