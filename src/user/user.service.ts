import { Injectable, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { FindUserDto } from './dto/find-user.dto.js';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  
  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email
      }
    })
    if (existing) {
      throw new ConflictException('该邮箱已被注册！');
    }
    
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: createUserDto.passwordHash,
        nickname: createUserDto.nickname,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
      },
    });

    return user;
  }

  async findUserByEmail(data:FindUserDto){
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      }
    })
    return user;
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
