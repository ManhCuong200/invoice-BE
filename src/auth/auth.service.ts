import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    // --- 1. Logic Đăng nhập (Login) ---
    async login(user: any) {
        const payload = { id: user.id, email: user.email, role: user.role };
        const jwtSecret = this.configService.get<string>('JWT_SECRET');

        // Access Token: Xác thực API call, hết hạn nhanh (15p)
        const accessToken = this.jwtService.sign(payload, {
            secret: jwtSecret,
            expiresIn: '15m',
        });

        // Refresh Token: Cấp lại access token mới, hết hạn lâu (7 ngày)
        const refreshToken = this.jwtService.sign(payload, {
            secret: jwtSecret,
            expiresIn: '7d',
        });

        // Lưu Refresh Token vào DB để quản lý phiên đăng nhập
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });

        return {
            user,
            accessToken,
            refreshToken,
        };
    }

    // --- 2. Logic Refresh Token ---
    async refreshAccessToken(refreshToken: string) {
        try {
            const jwtSecret = this.configService.get<string>('JWT_SECRET');

            const decoded = this.jwtService.verify(refreshToken, {
                secret: jwtSecret,
            });

            // Tìm user và kiểm tra xem Refresh Token có trùng khớp với bản ghi cuối trong DB không
            const user = await this.prisma.user.findUnique({
                where: { id: decoded.id },
            });

            if (!user || user.refreshToken !== refreshToken) {
                throw new UnauthorizedException('Invalid Refresh Token');
            }

            // Tạo Access Token mới cho người dùng
            const newAccessToken = this.jwtService.sign(
                { id: user.id, email: user.email, role: user.role },
                { secret: jwtSecret, expiresIn: '15m' }
            );

            return { accessToken: newAccessToken };
        } catch (error) {
            throw new UnauthorizedException('Refresh Token Failed');
        }
    }

    // --- 3. Logic Logout ---
    // Fix: Đổi kiểu dữ liệu userId từ number thành string để khớp UUID trong Prisma Schema
    async logout(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
        return { success: true };
    }
}