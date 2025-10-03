import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { IUser } from '../../helpers/types';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'username', passwordField: 'password' });
  }

  async validate(username: string, password: string): Promise<IUser> {
    const user = await this.authService.validatePassword(username, password);
    if (!user) {
      throw new UnauthorizedException(
        'Неправильное имя пользователя или пароль',
      );
    }

    return user;
  }
}
