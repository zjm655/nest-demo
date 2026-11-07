import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ROLE } from '../constants.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<ROLE[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!roles || roles.length === 0) {
      return true;
    }
    const user = ctx.switchToHttp().getRequest().user;
    if (!user) {
      // 这里需要打印一个服务端错误日志！，但是console工具还没准备好，先空着
      throw new HttpException(
        {
          code: 500,
          message: '未登录！',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const userRole = user.role;
    if (roles.includes(userRole)) {
      return true;
    }
    throw new HttpException(
      {
        code: 403,
        message: '权限不足！',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
