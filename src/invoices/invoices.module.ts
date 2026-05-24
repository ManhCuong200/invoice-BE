import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { OcrModule } from '../ocr/ocr.module'; // Import OCR module chứa OpenAI service

@Module({
  imports: [OcrModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule { }