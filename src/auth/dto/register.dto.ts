import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsOptional()
    @MaxLength(32, { message: '昵称长度不能超过32个字符' })
    nickname?: string

    @IsEmail()
    email: string

    @IsString()
    @MinLength(6, { message: '密码长度不能少于6个字符' })
    @MaxLength(72, { message: '密码长度不能超过72个字符' })   
    password1: string;

    @IsString()
    password2: string
}
