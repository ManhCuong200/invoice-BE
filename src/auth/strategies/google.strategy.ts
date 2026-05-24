import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
            clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
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

        // Kiểm tra xem user đã tồn tại trong DB chưa
        let user = await this.prisma.user.findUnique({
            where: { email },
        });

        // Nếu chưa tồn tại, tự động tạo mới tài khoản (Just-in-time provisioning)
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    fullName: displayName,
                    avatarUrl: photos[0]?.value,
                    role: 'STAFF', // Mặc định khi đăng nhập lần đầu
                },
            });
        }

        done(null, user);
    }
}