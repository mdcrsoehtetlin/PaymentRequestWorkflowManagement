import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessRuleException extends HttpException {
  constructor(message: string, details?: { field: string; code: string; message: string }[]) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'Unprocessable Entity',
        message,
        details: details || [],
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
