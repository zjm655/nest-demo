import { 
  Injectable, 
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }
  handleRequest(err: unknown, user: any, info: any) {
    if (err) throw err;
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
