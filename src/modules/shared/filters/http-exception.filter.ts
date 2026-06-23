import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'A system error occurred. Please contact the administrator.';
    let details: unknown[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'object' && exResponse !== null) {
        const resObj = exResponse as Record<string, unknown>;
        message = (resObj.message as string) || message;
        details = (resObj.details as unknown[]) || [];
      } else {
        message = exResponse;
      }
    }

    // Log detailed error server-side
    this.logger.error(
      `[${status}] ${request.method} ${request.url} - ${
        exception instanceof Error ? exception.message : 'Unknown error'
      }`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status] || 'Error',
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
