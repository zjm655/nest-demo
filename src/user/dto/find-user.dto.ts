import { IsEmail } from 'class-validator';
export class FindUserDto {
    @IsEmail()
    email: string;
}
