import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { FindUserDto } from './dto/find-user.dto.js';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });
    if (existing) {
      throw new HttpException(
        {
          code: 409,
          message: '该邮箱已被注册！',
        },
        HttpStatus.CONFLICT,
      );
    }

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: createUserDto.passwordHash,
        nickname: createUserDto.nickname,
        role: createUserDto.role || 'user',
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
        role: true,
        password: false,
      },
    });

    return user;
  }

  async findUserByEmail(data: FindUserDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });
    return user;
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
