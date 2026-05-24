import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- BẬT CẤU HÌNH CORS ĐỂ FRONTEND GỌI ĐƯỢC API ---
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Cho phép domain Frontend truy cập
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Nếu bạn có truyền cookie hoặc token đi kèm
  });

  await app.listen(3001); // Giả sử Backend chạy cổng 3001 để nhường cổng 3000 cho Next.js
}
bootstrap();