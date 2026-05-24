import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/admin')
@UseGuards(AuthGuard('jwt'), RolesGuard) // Chặn token và chặn quyền truy cập
@Roles(Role.ADMIN) // Chỉ cho phép tài khoản có quyền ADMIN truy cập vào các router dưới đây
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('stats')
    async getStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('logs')
    async getLogs() {
        return this.adminService.getAuditLogs();
    }

    @Get('users')
    async getUsers() {
        return this.adminService.getAllUsers();
    }

    @Patch('users/:id/role')
    async changeRole(@Param('id') id: string, @Body('role') role: 'ADMIN' | 'STAFF') {
        return this.adminService.updateUserRole(id, role);
    }
}