import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'ldapts';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
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

@Injectable()
export class AdAuthService {
  private readonly logger = new Logger(AdAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AdSettings)
    private readonly adSettingsRepository: Repository<AdSettings>,
  ) {}

  async validateCredentials(username: string, password: string): Promise<void> {
    const settings = await this.getEffectiveSettings();
    if (!settings.enabled) {
      throw new ServiceUnavailableException('Авторизация через AD отключена');
    }

    if (!settings.url) {
      throw new ServiceUnavailableException('Не настроен AD_URL');
    }

    const bindDn = this.getBindDn(username, settings);
    const client = new Client({
      url: settings.url,
      timeout: settings.timeout,
      connectTimeout: settings.timeout,
    });

    try {
      await this.bind(client, bindDn, password);
    } catch {
      throw new UnauthorizedException('Неверный логин или пароль AD');
    } finally {
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

  async updateSettings(dto: UpdateAdSettingsDto) {
    const current = await this.getSettingsEntity();
    const next = this.adSettingsRepository.merge(current, {
      ...dto,
      bindPassword:
        dto.bindPassword && dto.bindPassword.trim()
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

  async findDomainUsers(query = ''): Promise<DomainUser[]> {
    const settings = await this.getEffectiveSettings();
    if (!settings.enabled) {
      throw new ServiceUnavailableException('Авторизация через AD отключена');
    }
    if (!settings.bindUsername || !settings.bindPassword) {
      throw new ServiceUnavailableException(
        'Не настроена учетная запись для чтения AD',
      );
    }

    const client = new Client({
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
        .map((entry) => this.mapDomainUser(entry as Record<string, unknown>))
        .filter((user) => Boolean(user.username))
        .filter((user) => this.matchesDomainUser(user, normalizedQuery))
        .sort((a, b) => a.username.localeCompare(b.username, 'ru'));
    } catch (error) {
      this.logger.error(
        `AD users search failed: ${error?.message || error}`,
        error?.stack,
      );
      throw new ServiceUnavailableException(
        'Не удалось получить пользователей из AD',
      );
    } finally {
      void client.unbind().catch(() => undefined);
    }
  }

  normalizeUsername(username: string): string {
    const trimmed = username.trim();
    if (trimmed.includes('\\')) {
      return trimmed.split('\\').pop();
    }
    if (trimmed.includes('@')) {
      return trimmed.split('@')[0];
    }
    return trimmed;
  }

  private async getSettingsEntity(): Promise<AdSettings> {
    const existing = await this.adSettingsRepository.findOne({
      where: {},
      order: { id: 'ASC' },
    });
    if (existing) return existing;

    return this.adSettingsRepository.save(
      this.adSettingsRepository.create({
        enabled: this.configService.get<boolean>('activeDirectory.enabled'),
        url:
          this.configService.get<string>('activeDirectory.url') ||
          'ldap://192.168.2.20:389',
        domain:
          this.configService.get<string>('activeDirectory.domain') ||
          'mfc.dom',
        baseDn:
          this.configService.get<string>('activeDirectory.baseDn') ||
          'DC=mfc,DC=dom',
        userDnTemplate:
          this.configService.get<string>('activeDirectory.userDnTemplate') ||
          '${username}@${domain}',
        timeout:
          this.configService.get<number>('activeDirectory.timeout') || 5000,
      }),
    );
  }

  private async getEffectiveSettings(): Promise<AdSettings> {
    const settings = await this.getSettingsEntity();
    return {
      ...settings,
      bindPassword: settings.bindPassword
        ? this.decrypt(settings.bindPassword)
        : undefined,
    };
  }

  private getBindDn(username: string, settings: AdSettings): string {
    const trimmed = username.trim();
    const template = settings.userDnTemplate;

    if (template) {
      return template
        .replace(/\$\{username\}/g, this.normalizeUsername(trimmed))
        .replace(/\$\{domain\}/g, settings.domain || '');
    }

    if (trimmed.includes('\\') || trimmed.includes('@')) return trimmed;

    const domain = settings.domain;
    return domain ? `${trimmed}@${domain}` : trimmed;
  }

  private bind(
    client: Client,
    bindDn: string,
    password: string,
  ): Promise<void> {
    return client.bind(bindDn, password);
  }

  private async searchUsers(client: Client, baseDn: string, query: string) {
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

  private getUsersSearchFilter(query: string): string {
    const activeUsersFilter =
      '(&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2))';

    if (!query) return `${activeUsersFilter})`;

    const value = this.escapeFilterValue(query);
    return `${activeUsersFilter}(|(sAMAccountName=*${value}*)(cn=*${value}*)(name=*${value}*)(displayName=*${value}*)(givenName=*${value}*)(sn=*${value}*)(mail=*${value}*)(userPrincipalName=*${value}*)))`;
  }

  private escapeFilterValue(value: string): string {
    return value
      .replace(/\\/g, '\\5c')
      .replace(/\*/g, '\\2a')
      .replace(/\(/g, '\\28')
      .replace(/\)/g, '\\29')
      .replace(/\0/g, '\\00');
  }

  private mapDomainUser(entry: Record<string, unknown>): DomainUser {
    const username = this.getAttr(entry, 'sAMAccountName');
    const displayName =
      this.getAttr(entry, 'displayName') ||
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

  private matchesDomainUser(user: DomainUser, query: string): boolean {
    if (!query) return true;

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

  private getAttr(entry: Record<string, unknown>, key: string): string {
    const value = entry[key];
    if (Array.isArray(value)) return String(value[0] || '');
    return value ? String(value) : '';
  }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const key = this.getEncryptionKey();
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString(
      'hex',
    )}`;
  }

  private decrypt(value: string): string {
    const [ivHex, tagHex, encryptedHex] = value.split(':');
    if (!ivHex || !tagHex || !encryptedHex) return value;

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.getEncryptionKey(),
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final(),
    ]).toString('utf8');
  }

  private getEncryptionKey(): Buffer {
    return createHash('sha256')
      .update(this.configService.get<string>('jwt.secret') || 'super_secret')
      .digest();
  }
}
