import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { OwnershipGuard } from '../guards/ownership.guard';

describe('OwnershipGuard', () => {
  let guard: OwnershipGuard;

  beforeEach(() => {
    guard = new OwnershipGuard();
  });

  it('should throw ForbiddenException if user is not authenticated', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should attach ownership_verified and return true if user is authenticated', () => {
    const mockRequest = { user: { id: 1 } } as {
      user: { id: number };
      ownership_verified?: boolean;
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(mockRequest.ownership_verified).toBe(true);
  });
});
