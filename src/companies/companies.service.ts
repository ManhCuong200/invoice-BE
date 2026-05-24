import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
    constructor(private prisma: PrismaService) { }

    // Tạo mới công ty khách hàng
    async create(data: { name: string; taxCode?: string; address?: string }) {
        if (data.taxCode) {
            const existing = await this.prisma.company.findUnique({ where: { taxCode: data.taxCode } });
            if (existing) throw new ConflictException('Mã số thuế này đã tồn tại trên hệ thống');
        }
        return this.prisma.company.create({ data });
    }

    // Lấy toàn bộ danh sách công ty hiển thị lên Menu xổ xuống (Dropdown) ở Frontend
    async findAll() {
        return this.prisma.company.findMany({
            orderBy: { name: 'asc' },
        });
    }

    // Xóa công ty khách hàng (Hệ thống tự động xóa các hóa đơn liên quan nhờ cấu hình Cascade trong Prisma)
    async remove(id: string) {
        try {
            return await this.prisma.company.delete({ where: { id } });
        } catch (error) {
            throw new NotFoundException('Không tìm thấy công ty để xóa');
        }
    }
}
