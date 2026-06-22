import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleCode } from '../shared/types';

const ADMIN_ROLES_KEY = 'admin_roles';

/**
 * @description Guard that restricts access to ADMIN-only routes.
 * Validates the JWT payload contains role === 'ADMIN'.
 * Used as a secondary defense layer alongside RolesGuard.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('認証が必要です');
    }

    if (requiredRoles && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('管理者権限がありません');
    }

    if (user.role !== RoleCode.ADMIN) {
      throw new ForbiddenException('管理者権限がありません');
    }

    return true;
  }
}
