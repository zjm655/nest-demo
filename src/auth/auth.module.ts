import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UserModule } from '../user/user.module.js';

@Module({
    imports:[
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: Number(process.env.JWT_EXPIRES_IN) * 60 || 15 * 60,
        },
        }),
        UserModule,
    ],
    controllers: [AuthController],
    providers: [AuthService],
})

export class AuthModule {}
