import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Admin Guard
 * Checks if the authenticated user has admin privileges
 * Must be used together with JwtAuthGuard
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is admin
    // Adjust based on your User schema - could be role, isAdmin, permissions, etc.
    const isAdmin = user.role === 'admin' || user.isAdmin === true;

    if (!isAdmin) {
      throw new ForbiddenException(
        'Only administrators can access this resource',
      );
    }

    return true;
  }
}
