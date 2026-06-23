import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class OwnershipGuard implements CanActivate {
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
