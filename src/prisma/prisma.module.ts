import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Biến module này thành Global để không cần import lại ở nhiều nơi
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule { }
