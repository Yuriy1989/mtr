import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { checkHash } from '../helpers/hash';
import { ILoginUser } from '../helpers/types';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async auth(id: number, user: ILoginUser) {
    const payload = { username: user.username, sub: id };
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    const refreshTtl = this.configService.get<string>('jwt.refreshTtl', '30d');

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshTtl,
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async validatePassword(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;
    const ok = await checkHash(password, user.password);
    if (!ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...result } = user;
    return result;
  }

  async refreshTokens(userId: number, refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      if (payload.sub !== userId) {
        throw new UnauthorizedException('Invalid refresh token (sub mismatch)');
      }

      const newAccess = this.jwtService.sign(
        { username: payload.username, sub: payload.sub },
        {
          secret: this.configService.get<string>('jwt.secret'),
          expiresIn: '15m',
        },
      );

      const newRefresh = this.jwtService.sign(
        { username: payload.username, sub: payload.sub },
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
          expiresIn: '30d',
        },
      );

      return {
        access_token: newAccess,
        refresh_token: newRefresh,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
