import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { MaxByteLength } from '../../common/validators/max-byte-length.js';
export class RegisterDto {
    @IsString()
    @IsOptional()
    @MaxLength(32, { message: '昵称长度不能超过32个字符' })
    nickname?: string

    @IsEmail()
    email: string

    @IsString()
    @MinLength(6, { message: '密码长度不能少于6个字符' })
    @MaxByteLength(72, { message: '密码长度不能超过72个字节' })
    password1: string;

    @IsString()
    password2: string
}
