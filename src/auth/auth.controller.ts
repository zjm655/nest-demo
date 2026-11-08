import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginEmailDto } from './dto/login-email.dto.js';
import type { Response, CookieOptions } from 'express';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './constants.js';
import { Public } from './decorators/public.decorator.js';
import { ConfigService } from '@nestjs/config';

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
    const { accessToken, accessTokenExpAt, refreshToken, refreshTokenExpAt } =
      await this.authService.login(loginDto);

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...this.cookieOptions,
      maxAge: accessTokenExpAt.getTime() - Date.now(),
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...this.cookieOptions,
      path: '/auth',
      maxAge: refreshTokenExpAt.getTime() - Date.now(),
    });

    return;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions);
    return;
  }
}
