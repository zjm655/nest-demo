import { IsEmail, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateUserDto {
    @IsOptional()
    @MaxLength(32, { message: '昵称长度不能超过32个字符' })
    @IsString()
    nickname?: string

    @IsEmail()
    email: string

    @IsString()
    passwordHash: string

    @IsString()
    role: string
}
