import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) return true;

        const { user } = context.switchToHttp().getRequest();
        // Kiểm tra xem User đính kèm trong Request (từ JWT) có khớp quyền Admin không
        if (!user || !requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Bạn không có quyền truy cập tính năng quản trị này');
        }
        return true;
    }
}