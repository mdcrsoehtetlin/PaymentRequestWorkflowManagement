import { ForbiddenException } from '@nestjs/common';

export class OwnershipException extends ForbiddenException {
  constructor() {
    super('You do not have permission to perform this operation');
  }
}
