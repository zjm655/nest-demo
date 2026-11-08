import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { UserService } from '../user/user.service.js';
import { RefreshSessionService } from './refresh-session.service.js';
import { LoginEmailDto } from './dto/login-email.dto.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { User, IssuedTokens } from './types.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly refreshSessionService: RefreshSessionService,
  ) {}

  private async signAccessToken(user: User) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const { exp } = this.jwtService.decode(accessToken) as { exp: number };
    const accessTokenExpAt = new Date(exp * 1000);
    return { accessToken, accessTokenExpAt };
  }

  async register(data: RegisterDto) {
    if (data.password1 !== data.password2) {
      throw new HttpException(
        {
          code: 400,
          message: '两次输入的密码不一致！',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const hashedPassword = await bcrypt.hash(data.password1, 10);

    const res = await this.userService.create({
      email: data.email,
      passwordHash: hashedPassword,
      nickname: data.nickname,
      // role不该由前端指定，我们还未做响应拦截，所以这里默认是user
      role: 'user',
    });

    return res;
  }

  async login(data: LoginEmailDto) {
    const email = data.email;
    const user = await this.userService.findUserByEmail({ email });
    if (!user) {
      throw new HttpException(
        {
          code: 401,
          message: '邮箱或密码错误！',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const match = await bcrypt.compare(data.password, user.password);
    if (!match) {
      throw new HttpException(
        {
          code: 401,
          message: '邮箱或密码错误！',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { accessToken, accessTokenExpAt } = await this.signAccessToken(user);
    const { refreshToken, expiresAt: refreshTokenExpAt } =
      await this.refreshSessionService.create(user.id);
    return { accessToken, accessTokenExpAt, refreshToken, refreshTokenExpAt };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    await this.refreshSessionService.revoke(refreshToken);
    return;
  }

  async refreshTokens(rawRefreshToken: string): Promise<IssuedTokens> {
    const session =
      await this.refreshSessionService.verifyRefreshToken(rawRefreshToken);
    const refreshRes = await this.refreshSessionService.rotate(session);
    if (!refreshRes.reused) {
      const { accessToken, accessTokenExpAt } = await this.signAccessToken(
        session.user,
      );
      const { refreshToken, expiresAt: refreshTokenExpAt } = refreshRes;
      return { accessToken, accessTokenExpAt, refreshToken, refreshTokenExpAt };
    }
    throw new HttpException('刷新令牌已被使用', HttpStatus.UNAUTHORIZED);
  }
}
