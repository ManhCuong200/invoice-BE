import { Controller, Get, UseGuards, Req, Res, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

@Controller('api/auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) { }

    // --- 1. Kích hoạt luồng đăng nhập Google ---
    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req) {
        // Guard tự động điều hướng sang trang Google, không cần viết logic ở đây
    }

    // --- 2. Endpoint xử lý kết quả Callback từ Google gửi về ---
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req, @Res() res: Response) {
        // Dữ liệu user do GoogleStrategy trả về sẽ nằm trong req.user
        if (!req.user) {
            throw new UnauthorizedException('Không thể lấy thông tin tài khoản từ Google');
        }

        // Gọi AuthService để sinh Access Token và Refresh Token, đồng thời lưu vào DB
        const result = await this.authService.login(req.user);

        // Lấy URL trang chủ hoặc trang Dashboard của Frontend cấu hình trong môi trường
        // Ví dụ trong file .env đặt FRONTEND_URL=http://localhost:3000
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        // Điều hướng (Redirect) thẳng về Frontend kèm theo token trên URL để Frontend lưu lại
        // (Hoặc bạn có thể tối ưu bằng cách set cookie httpOnly ở đây nếu muốn bảo mật hơn)
        return res.redirect(
            `${frontendUrl}/auth-success?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
        );
    }

    // --- 3. Endpoint làm mới Access Token ---
    @Post('refresh')
    async refresh(@Body('refreshToken') refreshToken: string) {
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh Token là bắt buộc');
        }
        return this.authService.refreshAccessToken(refreshToken);
    }

    // --- 4. Endpoint Đăng xuất ---
    @Post('logout')
    async logout(@Body('userId') userId: string) {
        if (!userId) {
            throw new UnauthorizedException('User ID là bắt buộc');
        }
        return this.authService.logout(userId);
    }
}