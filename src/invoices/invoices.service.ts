import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OcrService } from '../ocr/ocr.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
    constructor(
        private prisma: PrismaService,
        private ocrService: OcrService,
    ) { }

    // --- 1. Upload và kích hoạt trích xuất OCR bằng AI ---
    async createAndProcessInvoice(createInvoiceDto: CreateInvoiceDto) {
        const { title, fileData, fileType, companyId, userId } = createInvoiceDto;

        // Kiểm tra xem công ty khách hàng được chọn có tồn tại không
        const companyExists = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!companyExists) {
            throw new NotFoundException('Không tìm thấy thông ty khách hàng tương ứng');
        }

        // Bước 1: Khởi tạo bản ghi hóa đơn trong Database với trạng thái đang xử lý
        const invoice = await this.prisma.invoice.create({
            data: {
                title: title || `Hóa đơn - ${new Date().toLocaleDateString('vi-VN')}`,
                fileUrl: fileData, // Lưu tạm chuỗi base64 hoặc URL lưu trữ
                fileType,
                status: 'PROCESSING',
                companyId,
                userId,
            },
        });

        try {
            // Bước 2: Gọi sang OcrService để đẩy ảnh qua GPT-4o trích xuất JSON
            const extractedData = await this.ocrService.extractInvoiceData(fileData);

            // Bước 3: Cập nhật kết quả JSON nhận được vào DB và chuyển trạng thái thành thành công
            const updatedInvoice = await this.prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                    ocrData: extractedData,
                    status: 'COMPLETED',
                },
            });

            // Tạo một log lịch sử hoạt động của hệ thống
            await this.prisma.auditLog.create({
                data: {
                    action: 'OCR_INVOICE_SUCCESS',
                    description: `Trích xuất thành công hóa đơn số ${extractedData.invoiceNumber || ''} cho công ty ${companyExists.name}`,
                    userId,
                },
            });

            return updatedInvoice;
        } catch (error) {
            // Nếu có bất kỳ lỗi gì xảy ra trong quá trình gọi AI, cập nhật trạng thái FAILED
            await this.prisma.invoice.update({
                where: { id: invoice.id },
                data: { status: 'FAILED' },
            });

            await this.prisma.auditLog.create({
                data: {
                    action: 'OCR_INVOICE_FAILED',
                    description: `Thất bại khi xử lý hóa đơn lỗi: ${error.message}`,
                    userId,
                },
            });

            throw error;
        }
    }

    // --- 2. Lấy danh sách hóa đơn kèm bộ lọc theo Công ty phục vụ giao diện ---
    async findAll(companyId?: string) {
        return this.prisma.invoice.findMany({
            where: companyId ? { companyId } : {},
            include: {
                company: { select: { name: true } },
                user: { select: { fullName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // --- 3. Lấy chi tiết một hóa đơn để hiển thị kết quả OCR ---
    async findOne(id: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: { company: true },
        });
        if (!invoice) throw new NotFoundException('Không tìm thấy hóa đơn này');
        return invoice;
    }
}
