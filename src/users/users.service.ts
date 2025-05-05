import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JWTPayloadType } from './entities/types';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserType } from '@prisma/client';
import { AuthProvider } from './auth.provider';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authProvider: AuthProvider,
  ) {}

  public async register(registerDto: RegisterDto) {
    return this.authProvider.register(registerDto);
  }

  public async login(loginDto: LoginDto) {
    return this.authProvider.login(loginDto);
  }

  public async getCurrentUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      message: 'User found successfully',
      userData: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        userType: user.userType,
      },
    };
  }

  public async getAllUsers() {
    const users = await this.prisma.user.findMany();
    if (!users) throw new NotFoundException('Users not found');
    return {
      message: 'Users found successfully',
      usersData: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        role: user.userType,
      })),
    };
  }

  public async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, name } = updateUserDto;
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('User not found');
    const data: { name?: string; password?: string } = {};
    if (name) data.name = name;
    if (password)
      data.password = await this.authProvider.hashPassword(password);
    await this.prisma.user.update({
      where: { id },
      data,
    });
    return {
      message: 'User updated successfully',
    };
  }

  public async delete(id: string, payload: JWTPayloadType) {
    const user = await this.getCurrentUser(id);
    if (!user) throw new BadRequestException('User not found');
    const currentUser = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (
      currentUser?.userType === UserType.ADMIN ||
      user.userData.id === payload?.id
    ) {
      await this.prisma.user.delete({ where: { id } });
      return { message: 'user has been removed' };
    }
    throw new UnauthorizedException('You are not allowed');
  }
}
