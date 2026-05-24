import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OcrService {
    private openai: OpenAI;

    constructor(private configService: ConfigService) {
        this.openai = new OpenAI({
            apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
        });
    }

    async extractInvoiceData(fileData: string): Promise<any> {
        let base64Image = fileData;
        
        // Remove data URL prefix if it exists (e.g. "data:image/jpeg;base64,")
        if (base64Image.startsWith('data:')) {
            const parts = base64Image.split(',');
            if (parts.length > 1) {
                base64Image = parts[1];
            }
        }

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: `Bạn là trợ lý trích xuất hóa đơn chuyên nghiệp. Hãy phân tích hình ảnh hóa đơn được cung cấp và trả về dữ liệu định dạng JSON chính xác.
Dữ liệu trả về phải có cấu trúc như sau:
{
  "invoiceNumber": "Số hóa đơn",
  "invoiceDate": "Ngày lập hóa đơn (YYYY-MM-DD)",
  "sellerName": "Tên đơn vị bán",
  "sellerTaxCode": "Mã số thuế đơn vị bán",
  "buyerName": "Tên đơn vị mua",
  "buyerTaxCode": "Mã số thuế đơn vị mua",
  "items": [
    {
      "name": "Tên mặt hàng/dịch vụ",
      "quantity": 1,
      "unitPrice": 1000,
      "amount": 1000
    }
  ],
  "taxAmount": 100,
  "totalAmount": 1100
}`,
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Trích xuất thông tin từ hóa đơn này:',
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
        });

        const jsonText = response.choices[0]?.message?.content;
        if (!jsonText) {
            throw new Error('Không thể trích xuất dữ liệu từ hóa đơn.');
        }

        return JSON.parse(jsonText);
    }
}
