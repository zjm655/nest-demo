import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { UserService } from '../user/user.service.js';
import { LoginEmailDto } from './dto/login-email.dto.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService
    ){}

    async register(data: RegisterDto) {
        if(data.password1 !== data.password2){
            throw new HttpException({
                code: 400,
                message: '两次输入的密码不一致！',
            }, HttpStatus.BAD_REQUEST);
        }
        const hashedPassword = await bcrypt.hash(data.password1, 10);

        const res = await this.userService.create({
            email: data.email,
            passwordHash: hashedPassword,
            nickname: data.nickname,
            role: "user"
        })

        return {
            code: 200,
            message: '注册成功！',
            data: res,
        }
    }

    async login(data: LoginEmailDto) {
        const email = data.email;
        const user = await this.userService.findUserByEmail({ email });
        if (!user) {
            throw new HttpException({
                code: 401,
                message: '邮箱或密码错误！',
            }, HttpStatus.UNAUTHORIZED);
        }

        const match = await bcrypt.compare(data.password, user.password)
        if (!match) {
            throw new HttpException({
                code: 401,
                message: '邮箱或密码错误！',
            }, HttpStatus.UNAUTHORIZED);
        }

        const token = await this.jwtService.signAsync({ sub: user.id, email: user.email });
        return { token }
    }
}