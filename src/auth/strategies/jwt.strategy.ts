import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
        });
    }

    async validate(payload: any) {
        // Kiểm tra xem trạng thái tài khoản còn hoạt động (isActive) không
        const user = await this.prisma.user.findUnique({
            where: { id: payload.id },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Tài khoản đã bị khóa hoặc không tồn tại.');
        }

        return { id: user.id, email: user.email, role: user.role };
    }
}