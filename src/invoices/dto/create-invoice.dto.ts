export class CreateInvoiceDto {
    title?: string;

    // Chuỗi base64 của ảnh hoặc file PDF (Ví dụ: "data:image/jpeg;base64,...")
    fileData: string;

    fileType: string; // png, jpg, jpeg, pdf

    companyId: string; // ID của công ty kế toán dịch vụ được chọn

    userId: string; // ID của user thực hiện việc upload
}