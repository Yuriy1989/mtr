import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { LocalGuard } from './guard/local.guard';
import { JwtGuard } from './guard/jwtAuth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SigninToketDto } from './dto/signin.dto';
import { JwtRefreshGuard } from './guard/jwtRefresh.guard';

@Controller('')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @UseGuards(LocalGuard)
  @Post('signin')
  async signin(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: SigninToketDto,
  ) {
    const userId = req.user?.id ?? req.user?._id ?? req.user?.userId;
    if (!userId)
      throw new UnauthorizedException('Не удалось определить id пользователя');

    const { access_token, refresh_token } = await this.authService.auth(
      userId,
      dto,
    );

    // httpOnly, secure, sameSite — под свои условия (dev/prod)
    res.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none', // если разные origin в dev
      path: '/', // можно ограничить до /refresh-token
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
    });

    return { access_token, user: req.user };
  }

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return user;
  }

  // Защищённая точка для проверки токена и получения профиля
  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req) {
    return { user: req.user };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard) // ← ВАЖНО: проверяем refreshToken, а не accessToken
  async refreshToken(@Req() req, @Res({ passthrough: true }) res: Response) {
    const userId = req.user?.id ?? req.user?._id ?? req.user?.userId;
    if (!userId) throw new UnauthorizedException('User not authenticated');

    const rt = req.cookies?.['refreshToken'];
    if (!rt) throw new UnauthorizedException('No refresh token found');

    const { access_token, refresh_token } =
      await this.authService.refreshTokens(userId, rt);

    // Ротация refresh-токена в куке
    res.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { access_token };
  }
}
