import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('api/invoices')
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    // Endpoint tiếp nhận file hóa đơn và xử lý OCR tự động
    @Post('upload')
    async uploadInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
        return this.invoicesService.createAndProcessInvoice(createInvoiceDto);
    }

    // Endpoint lấy danh sách hóa đơn (có thể lọc theo companyId từ menu xổ xuống của UI)
    @Get()
    async getInvoices(@Query('companyId') companyId?: string) {
        return this.invoicesService.findAll(companyId);
    }

    // Endpoint xem chi tiết một hóa đơn để render lên form đối chiếu dữ liệu
    @Get(':id')
    async getInvoiceById(@Param('id') id: string) {
        return this.invoicesService.findOne(id);
    }
}