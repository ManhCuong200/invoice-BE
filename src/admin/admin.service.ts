import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    // --- Thống kê số liệu trực quan cho Dashboard panel ---
    async getDashboardStats() {
        const [totalUsers, totalCompanies, totalInvoices, completedInvoices, failedInvoices] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.company.count(),
            this.prisma.invoice.count(),
            this.prisma.invoice.count({ where: { status: 'COMPLETED' } }),
            this.prisma.invoice.count({ where: { status: 'FAILED' } }),
        ]);

        return {
            totalUsers,
            totalCompanies,
            totalInvoices,
            successRate: totalInvoices > 0 ? (completedInvoices / totalInvoices) * 100 : 0,
            failedInvoices,
        };
    }

    // --- Lấy lịch sử thao tác hệ thống (Audit Logs) ---
    async getAuditLogs() {
        return this.prisma.auditLog.findMany({
            include: {
                user: { select: { fullName: true, email: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100, // Lấy 100 dòng lịch sử mới nhất
        });
    }

    // --- Quản trị tài khoản, phân quyền thành viên ---
    async getAllUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateUserRole(userId: string, role: 'ADMIN' | 'STAFF') {
        return this.prisma.user.update({
            where: { id: userId },
            data: { role },
        });
    }
}