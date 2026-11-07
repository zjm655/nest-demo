import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginEmailDto } from './dto/login-email.dto.js';
import type { Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from './constants.js';
import { Public } from './decorators/public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.login(loginDto);

    res.cookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: Number(process.env.JWT_EXPIRES_IN) * 60 * 1000,
    });

    return;
  }
}
