import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    let message: string = 'Internal Server Error';
    let statusCode: number = 500;
    let code = -1;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = exception.getResponse() as string;
      } else if (res !== null && typeof res === 'object') {
        const body = res as Record<string, any>;
        if (typeof body?.code === 'number') {
          code = body.code;
        }
        const raw = body.message ?? body.error ?? exception.message;
        if (Array.isArray(raw)) {
          message = raw.length > 0 ? raw.join('\n ') : 'An error occurred';
        } else {
          message = raw ?? 'An error occurred';
        }
      } else {
        message = exception.message ?? 'An error occurred';
      }
    }

    // 如果是500，需要把错误上报，信息要具体
    if (statusCode === 500) {
      // pass 上报逻辑，此处先空着，等后续接入日志系统补上
    }

    if (code === -1) {
      code = statusCode;
    }

    response.status(statusCode).json({
      code,
      message,
    });
  }
}
