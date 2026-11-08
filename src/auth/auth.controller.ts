import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginEmailDto } from './dto/login-email.dto.js';
import type { Request, Response, CookieOptions } from 'express';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './constants.js';
import { Public } from './decorators/public.decorator.js';
import { ConfigService } from '@nestjs/config';
import type { IssuedTokens } from './types.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private get cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/',
    };
  }
  private setAuthCookies(res: Response, tokens: IssuedTokens) {
    res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      ...this.cookieOptions,
      maxAge: tokens.accessTokenExpAt.getTime() - Date.now(),
    });

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...this.cookieOptions,
      path: '/auth',
      maxAge: tokens.refreshTokenExpAt.getTime() - Date.now(),
    });
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(loginDto);
    this.setAuthCookies(res, tokens);
    return;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    await this.authService.logout(refreshToken);
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions);
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      ...this.cookieOptions,
      path: '/auth',
    });
    return;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (!raw) throw new HttpException('缺少刷新令牌', HttpStatus.UNAUTHORIZED);
    const tokens = await this.authService.refreshTokens(raw);
    this.setAuthCookies(res, tokens);
    return;
  }
}
