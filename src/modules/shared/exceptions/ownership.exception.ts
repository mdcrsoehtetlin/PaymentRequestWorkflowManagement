import { ForbiddenException } from '@nestjs/common';

export class OwnershipException extends ForbiddenException {
  constructor() {
    super('この操作を実行する権限がありません');
  }
}
