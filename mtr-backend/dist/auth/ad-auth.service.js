"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AdAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ldapts_1 = require("ldapts");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const ad_settings_entity_1 = require("./entities/ad-settings.entity");
let AdAuthService = AdAuthService_1 = class AdAuthService {
    constructor(configService, adSettingsRepository) {
        this.configService = configService;
        this.adSettingsRepository = adSettingsRepository;
        this.logger = new common_1.Logger(AdAuthService_1.name);
    }
    async validateCredentials(username, password) {
        const settings = await this.getEffectiveSettings();
        if (!settings.enabled) {
            throw new common_1.ServiceUnavailableException('Авторизация через AD отключена');
        }
        if (!settings.url) {
            throw new common_1.ServiceUnavailableException('Не настроен AD_URL');
        }
        const bindDn = this.getBindDn(username, settings);
        const client = new ldapts_1.Client({
            url: settings.url,
            timeout: settings.timeout,
            connectTimeout: settings.timeout,
        });
        try {
            await this.bind(client, bindDn, password);
        }
        catch {
            throw new common_1.UnauthorizedException('Неверный логин или пароль AD');
        }
        finally {
            void client.unbind().catch(() => undefined);
        }
    }
    async getPublicSettings() {
        const settings = await this.getEffectiveSettings();
        const hasBindPassword = Boolean(settings.bindPassword);
        return {
            ...settings,
            bindPassword: undefined,
            hasBindPassword,
        };
    }
    async updateSettings(dto) {
        const current = await this.getSettingsEntity();
        const next = this.adSettingsRepository.merge(current, {
            ...dto,
            bindPassword: dto.bindPassword && dto.bindPassword.trim()
                ? this.encrypt(dto.bindPassword)
                : current.bindPassword,
        });
        const saved = await this.adSettingsRepository.save(next);
        return {
            ...saved,
            bindPassword: undefined,
            hasBindPassword: Boolean(saved.bindPassword),
        };
    }
    async findDomainUsers(query = '') {
        const settings = await this.getEffectiveSettings();
        if (!settings.enabled) {
            throw new common_1.ServiceUnavailableException('Авторизация через AD отключена');
        }
        if (!settings.bindUsername || !settings.bindPassword) {
            throw new common_1.ServiceUnavailableException('Не настроена учетная запись для чтения AD');
        }
        const client = new ldapts_1.Client({
            url: settings.url,
            timeout: settings.timeout,
            connectTimeout: settings.timeout,
        });
        try {
            await client.bind(settings.bindUsername, settings.bindPassword);
            const normalizedQuery = query.trim();
            let searchEntries = await this.searchUsers(client, settings.baseDn, normalizedQuery);
            if (normalizedQuery && searchEntries.length === 0) {
                searchEntries = await this.searchUsers(client, settings.baseDn, '');
            }
            return searchEntries
                .map((entry) => this.mapDomainUser(entry))
                .filter((user) => Boolean(user.username))
                .filter((user) => this.matchesDomainUser(user, normalizedQuery))
                .sort((a, b) => a.username.localeCompare(b.username, 'ru'));
        }
        catch (error) {
            this.logger.error(`AD users search failed: ${error?.message || error}`, error?.stack);
            throw new common_1.ServiceUnavailableException('Не удалось получить пользователей из AD');
        }
        finally {
            void client.unbind().catch(() => undefined);
        }
    }
    normalizeUsername(username) {
        const trimmed = username.trim();
        if (trimmed.includes('\\')) {
            return trimmed.split('\\').pop();
        }
        if (trimmed.includes('@')) {
            return trimmed.split('@')[0];
        }
        return trimmed;
    }
    async getSettingsEntity() {
        const existing = await this.adSettingsRepository.findOne({
            where: {},
            order: { id: 'ASC' },
        });
        if (existing)
            return existing;
        return this.adSettingsRepository.save(this.adSettingsRepository.create({
            enabled: this.configService.get('activeDirectory.enabled'),
            url: this.configService.get('activeDirectory.url') ||
                'ldap://192.168.2.20:389',
            domain: this.configService.get('activeDirectory.domain') ||
                'mfc.dom',
            baseDn: this.configService.get('activeDirectory.baseDn') ||
                'DC=mfc,DC=dom',
            userDnTemplate: this.configService.get('activeDirectory.userDnTemplate') ||
                '${username}@${domain}',
            timeout: this.configService.get('activeDirectory.timeout') || 5000,
        }));
    }
    async getEffectiveSettings() {
        const settings = await this.getSettingsEntity();
        return {
            ...settings,
            bindPassword: settings.bindPassword
                ? this.decrypt(settings.bindPassword)
                : undefined,
        };
    }
    getBindDn(username, settings) {
        const trimmed = username.trim();
        const template = settings.userDnTemplate;
        if (template) {
            return template
                .replace(/\$\{username\}/g, this.normalizeUsername(trimmed))
                .replace(/\$\{domain\}/g, settings.domain || '');
        }
        if (trimmed.includes('\\') || trimmed.includes('@'))
            return trimmed;
        const domain = settings.domain;
        return domain ? `${trimmed}@${domain}` : trimmed;
    }
    bind(client, bindDn, password) {
        return client.bind(bindDn, password);
    }
    async searchUsers(client, baseDn, query) {
        const { searchEntries } = await client.search(baseDn, {
            scope: 'sub',
            paged: { pageSize: 500 },
            sizeLimit: 1000,
            filter: this.getUsersSearchFilter(query),
            attributes: [
                'sAMAccountName',
                'cn',
                'name',
                'givenName',
                'sn',
                'middleName',
                'displayName',
                'mail',
                'title',
                'distinguishedName',
                'userPrincipalName',
            ],
        });
        return searchEntries;
    }
    getUsersSearchFilter(query) {
        const activeUsersFilter = '(&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2))';
        if (!query)
            return `${activeUsersFilter})`;
        const value = this.escapeFilterValue(query);
        return `${activeUsersFilter}(|(sAMAccountName=*${value}*)(cn=*${value}*)(name=*${value}*)(displayName=*${value}*)(givenName=*${value}*)(sn=*${value}*)(mail=*${value}*)(userPrincipalName=*${value}*)))`;
    }
    escapeFilterValue(value) {
        return value
            .replace(/\\/g, '\\5c')
            .replace(/\*/g, '\\2a')
            .replace(/\(/g, '\\28')
            .replace(/\)/g, '\\29')
            .replace(/\0/g, '\\00');
    }
    mapDomainUser(entry) {
        const username = this.getAttr(entry, 'sAMAccountName');
        const displayName = this.getAttr(entry, 'displayName') ||
            this.getAttr(entry, 'cn') ||
            this.getAttr(entry, 'name') ||
            username;
        const parts = displayName.split(' ').filter(Boolean);
        return {
            username,
            firstName: this.getAttr(entry, 'givenName') || parts[1] || username,
            lastName: this.getAttr(entry, 'middleName') || parts[2] || '-',
            surname: this.getAttr(entry, 'sn') || parts[0] || username,
            email: this.getAttr(entry, 'mail') || `${username}@mfc.dom`,
            position: this.getAttr(entry, 'title') || '-',
            displayName,
            userPrincipalName: this.getAttr(entry, 'userPrincipalName'),
            distinguishedName: this.getAttr(entry, 'distinguishedName'),
        };
    }
    matchesDomainUser(user, query) {
        if (!query)
            return true;
        const needle = query.toLowerCase();
        return [
            user.username,
            user.firstName,
            user.lastName,
            user.surname,
            user.email,
            user.position,
            user.displayName,
            user.userPrincipalName,
            user.distinguishedName,
        ].some((value) => value?.toLowerCase().includes(needle));
    }
    getAttr(entry, key) {
        const value = entry[key];
        if (Array.isArray(value))
            return String(value[0] || '');
        return value ? String(value) : '';
    }
    encrypt(value) {
        const iv = (0, crypto_1.randomBytes)(12);
        const key = this.getEncryptionKey();
        const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([
            cipher.update(value, 'utf8'),
            cipher.final(),
        ]);
        const tag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
    }
    decrypt(value) {
        const [ivHex, tagHex, encryptedHex] = value.split(':');
        if (!ivHex || !tagHex || !encryptedHex)
            return value;
        const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', this.getEncryptionKey(), Buffer.from(ivHex, 'hex'));
        decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
        return Buffer.concat([
            decipher.update(Buffer.from(encryptedHex, 'hex')),
            decipher.final(),
        ]).toString('utf8');
    }
    getEncryptionKey() {
        return (0, crypto_1.createHash)('sha256')
            .update(this.configService.get('jwt.secret') || 'super_secret')
            .digest();
    }
};
exports.AdAuthService = AdAuthService;
exports.AdAuthService = AdAuthService = AdAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(ad_settings_entity_1.AdSettings)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository])
], AdAuthService);
//# sourceMappingURL=ad-auth.service.js.map