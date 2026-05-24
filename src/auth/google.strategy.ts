import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private prisma: PrismaService) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { emails, displayName, photos } = profile;
        const email = emails[0].value;

        // Tìm xem user đã tồn tại trong DB chưa, nếu chưa thì tạo mới (Đăng nhập lần đầu)
        let user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    fullName: displayName,
                    avatarUrl: photos[0]?.value,
                    role: 'STAFF', // Mặc định là STAFF, Admin sẽ phân quyền lại sau
                },
            });
        }

        done(null, user);
    }
}