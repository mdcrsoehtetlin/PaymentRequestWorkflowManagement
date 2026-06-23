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

  /**
   * @description Intercepts an incoming HTTP request, logs the method, path, duration,
   * user ID, and IP address upon successful completion.
   *
   * @param context - The execution context of the request
   * @param next - The call handler to invoke the next interceptor or route handler
   * @returns An observable representing the response stream
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = req;
    const user = req.user as JwtPayload | undefined;
    const userId = user?.sub;
    const requestId = (req.headers['x-request-id'] as string) || 'N/A';
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(
          `${method} ${url} — ${duration}ms | ip=${ip} | requestId=${requestId}${userId ? ` | userId=${userId}` : ''}`,
        );
      }),
    );
  }
}
