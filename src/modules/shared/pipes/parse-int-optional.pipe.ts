import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * @description Parses an optional integer query param.
 * Returns undefined if value is undefined/empty — does NOT throw.
 * Throws BadRequestException if value is present but not a valid integer.
 *
 * @example
 * @Get()
 * findAll(@Query('statusId', ParseIntOptionalPipe) statusId?: number) { ... }
 */
@Injectable()
export class ParseIntOptionalPipe implements PipeTransform<string | undefined, number | undefined> {
  transform(value: string | undefined): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new BadRequestException(`'${value}' は有効な整数ではありません`);
    }
    return parsed;
  }
}
