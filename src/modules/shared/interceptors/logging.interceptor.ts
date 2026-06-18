import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { JwtPayload } from '../types';

/**
 * @description Global logging interceptor. Records request duration, method,
 * path, and authenticated user ID for every API call.
 * Mandatory log fields: timestamp, level, context, message, userId, duration.
 * See: Development Rules §6.3
 *
 * Register globally in AppModule:
 * { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const user = req.user as JwtPayload | undefined;
    const userId = user?.sub;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(
          `${method} ${url} — ${duration}ms${userId ? ` | userId=${userId}` : ''}`,
        );
      }),
    );
  }
}
