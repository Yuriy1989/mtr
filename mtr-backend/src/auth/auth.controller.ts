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
  Put,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { LocalGuard } from './guard/local.guard';
import { JwtGuard } from './guard/jwtAuth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SigninToketDto } from './dto/signin.dto';
import { JwtRefreshGuard } from './guard/jwtRefresh.guard';
import { AdSigninDto } from './dto/ad-signin.dto';
import { AdAuthService } from './ad-auth.service';
import { UpdateAdSettingsDto } from './dto/ad-settings.dto';
import { ImportAdUserDto } from './dto/import-ad-user.dto';

@Controller('')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private adAuthService: AdAuthService,
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
      req.user,
    );

    this.setRefreshCookie(res, refresh_token);

    return { access_token, user: req.user };
  }

  @Post('signin/ad')
  async signinAd(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: AdSigninDto,
  ) {
    await this.adAuthService.validateCredentials(dto.username, dto.password);

    const username = this.adAuthService.normalizeUsername(dto.username);
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException(
        'Пользователь AD найден, но не заведён в локальной базе приложения',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    const { access_token, refresh_token } = await this.authService.auth(
      user.id,
      user,
    );

    this.setRefreshCookie(res, refresh_token);

    return { access_token, user: userWithoutPassword };
  }

  @UseGuards(JwtGuard)
  @Get('ad/settings')
  getAdSettings(@Req() req) {
    this.ensureAdmin(req.user);
    return this.adAuthService.getPublicSettings();
  }

  @UseGuards(JwtGuard)
  @Put('ad/settings')
  updateAdSettings(@Req() req, @Body() dto: UpdateAdSettingsDto) {
    this.ensureAdmin(req.user);
    return this.adAuthService.updateSettings(dto);
  }

  @UseGuards(JwtGuard)
  @Get('ad/users')
  getAdUsers(@Req() req, @Query('search') search?: string): Promise<any[]> {
    this.ensureAdmin(req.user);
    return this.adAuthService.findDomainUsers(search);
  }

  @UseGuards(JwtGuard)
  @Post('ad/users/import')
  async importAdUser(@Req() req, @Body() dto: ImportAdUserDto) {
    this.ensureAdmin(req.user);
    const user = await this.usersService.upsertAdUser(dto);
    return {
      success: true,
      data: user,
    };
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

    this.setRefreshCookie(res, refresh_token);

    return { access_token };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  private ensureAdmin(user: { roles?: string[] }) {
    if (!user?.roles?.map(Number).includes(100)) {
      throw new UnauthorizedException('Недостаточно прав');
    }
  }
}
