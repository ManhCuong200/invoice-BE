import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OcrService {
    constructor(private configService: ConfigService) {}

    async extractInvoiceData(fileData: string): Promise<any> {
        // Hỗ trợ cả hai biến cấu hình để linh hoạt
        const apiKey = this.configService.get<string>('GEMINI_API_KEY') || this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey || apiKey === 'placeholder' || apiKey.includes('dien_key_cua_ban') || apiKey === 'sk-proj-') {
            // Trả về dữ liệu mock chất lượng cao để thuận tiện test giao diện Frontend
            return {
                invoiceNumber: "INV-" + Math.floor(100000 + Math.random() * 900000),
                invoiceDate: new Date().toISOString().split('T')[0],
                sellerName: "Công ty Cổ phần Bán lẻ FPT",
                sellerTaxCode: "0102030405",
                buyerName: "Công ty TNHH Giải pháp Kế toán X",
                buyerTaxCode: "0109987654",
                items: [
                    {
                        name: "Máy tính xách tay ASUS ZenBook UX3402",
                        quantity: 1,
                        unitPrice: 22490000,
                        amount: 22490000
                    },
                    {
                        name: "Chuột không dây Logitech MX Master 3S",
                        quantity: 1,
                        unitPrice: 2490000,
                        amount: 2490000
                    }
                ],
                taxAmount: 2498000,
                totalAmount: 27478000
            };
        }

        let base64Image = fileData;
        let mimeType = 'image/jpeg'; // Mặc định

        // Trích xuất MIME type từ chuỗi Data URL Base64
        if (base64Image.startsWith('data:')) {
            const parts = base64Image.split(',');
            if (parts.length > 1) {
                const match = parts[0].match(/data:(.*?);base64/);
                if (match) {
                    mimeType = match[1];
                }
                base64Image = parts[1];
            }
        }

        const prompt = `Bạn là trợ lý trích xuất hóa đơn chuyên nghiệp. Hãy phân tích hình ảnh hoặc tệp PDF hóa đơn được cung cấp và trả về dữ liệu định dạng JSON chính xác.
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
}`;

        try {
            const modelName = 'gemini-2.5-flash';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType: mimeType,
                                        data: base64Image,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        responseMimeType: 'application/json',
                    },
                }),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Gemini API trả về mã lỗi ${response.status}: ${errText}`);
            }

            const resJson: any = await response.json();
            const textContent = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textContent) {
                throw new Error('Không thể trích xuất dữ liệu hóa đơn từ phản hồi của Gemini.');
            }

            return JSON.parse(textContent.trim());
        } catch (error) {
            throw new Error(`Lỗi xử lý OCR qua Gemini: ${error.message}`);
        }
    }
}
