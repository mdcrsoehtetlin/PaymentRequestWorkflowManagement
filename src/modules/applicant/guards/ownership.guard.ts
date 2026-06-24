import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Guard that ensures a user can only access resources they own.
 * Currently allows requests to proceed and marks them as verified;
 * actual ownership is verified at the controller/service level.
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  /**
   * @description Validates if the current user is authenticated and marks the request for ownership verification.
   * @param {ExecutionContext} context - The execution context of the request.
   * @returns {boolean | Promise<boolean> | Observable<boolean>} True if user exists, false/throws otherwise.
   * @throws {ForbiddenException} If the user is not authenticated.
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    // Assuming user identity is attached to the request by an AuthGuard
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // In a real implementation, this would query the DB to check if the requested resource
    // belongs to `user.id`. For now, we allow the request to proceed to the controller
    // where the ownership will be verified against the specific payment request.
    // We attach a property so the controller knows this guard was executed.
    request.ownership_verified = true;

    return true;
  }
}
